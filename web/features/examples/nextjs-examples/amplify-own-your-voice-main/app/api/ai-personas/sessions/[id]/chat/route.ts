import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateObject } from "ai"
import { GeminiModel } from "@/llm/model"
import { z } from "zod"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, duration, code } = await req.json()

    // Fetch the custom agent session
    const agentSession = await prisma.customAgentSession.findUnique({
      where: { id: sessionId },
      include: { 
        customAgent: true,
        user: true 
      },
    })

    if (!agentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const agent = agentSession.customAgent
    const userName = agentSession.user?.name || "User"

    const systemPrompt = `
You are a custom AI agent named "${agent.name}".
Your instructions are:
${agent.instruction}

CAPABILITIES:
1. COMMUNICATION: You communicate with the user via text (the "text" field).
2. CODING CHALLENGE: If you want the user to write code, provide a "codingChallenge" object. This will open a code editor for them.

USER: ${userName}
${code ? `The user has submitted code: \n\`\`\`\n${code}\n\`\`\`` : ""}

- Respond in character.
- PROACTIVITY: Unless your core instructions explicitly tell you to wait for the user to speak first, you MUST initiate the interaction, greet the user, and set the stage for the session when there is no conversation history.
- Use "codingChallenge" to prompt for code.
- VERDICT: If you are acting as an interviewer or team lead, provide a final verdict when concluding: "You are hired on our team!" or a polite rejection, and provide feedback.
- Set "status" to "Completed" when the interaction is finished.
- Set "isUsersTurn" to true if you are waiting for them to speak or act.

CRITICAL:
- Do NOT use any Markdown formatting (like **bolding** or __italics__) in your 'text' field. The text will be read aloud by a TTS engine, and special characters will be read literally. 
- Keep the text as plain, conversational prose. No bullet points or numbered lists.

CRITICAL: You must provide your response in JSON format:
{
  "text": "Your conversational response here",
  "status": "In Progress" | "Completed",
  "isUsersTurn": boolean,
  "codingChallenge": { ... } | null,
  "evaluation": {
    "feedback": "Feedback for the LAST user message",
    "metrics": {
      "correctness": 0-100,
      "clarity": 0-100,
      "relevance": 0-100,
      "detail": 0-100,
      "efficiency": 0-100,
      "creativity": 0-100,
      "communication": 0-100,
      "problemSolving": 0-100
    }
  } | null
}
Set evaluation to null for the initial greeting.
`

    // Augment messages with code if present in history
    const augmentedMessages = messages.map((m: any) => {
      if (m.role === 'user' && m.code) {
        return {
          role: m.role,
          content: `${m.content}\n\n[SUBMITTED CODE]:\n\`\`\`\n${m.code}\n\`\`\``
        }
      }
      return {
        role: m.role,
        content: m.content
      }
    })

    // Handle empty messages array for initial greeting
    let finalMessages = augmentedMessages.length === 0 
      ? [{ role: 'user', content: 'Please start the session by greeting the user and introducing yourself according to your instructions.' }] 
      : augmentedMessages

    // If current request has code, append it to the last user message for the LLM
    if (code && finalMessages.length > 0) {
      const lastIdx = finalMessages.length - 1
      if (finalMessages[lastIdx].role === 'user') {
        finalMessages[lastIdx] = {
          ...finalMessages[lastIdx],
          content: `${finalMessages[lastIdx].content}\n\n[SUBMITTED CODE]:\n\`\`\`\n${code}\n\`\`\``
        }
      }
    }

    const { object: responseData } = await generateObject({
      model: GeminiModel(),
      system: systemPrompt,
      messages: finalMessages,
      schema: z.object({
        text: z.string().describe("Your spoken or written message to the user."),
        codingChallenge: z.object({
            title: z.string(),
            description: z.string(),
            initialCode: z.string(),
            language: z.enum(["javascript", "python", "cpp"])
        }).optional().nullable(),
        status: z.enum(["In Progress", "Completed"]),
        isUsersTurn: z.boolean().default(true),
        evaluation: z.object({
            feedback: z.string(),
            metrics: z.object({
                correctness: z.number().min(0).max(100),
                clarity: z.number().min(0).max(100),
                relevance: z.number().min(0).max(100),
                detail: z.number().min(0).max(100),
                efficiency: z.number().min(0).max(100),
                creativity: z.number().min(0).max(100),
                communication: z.number().min(0).max(100),
                problemSolving: z.number().min(0).max(100),
            })
        }).optional().nullable(),
      }),
    })

    // Save user message if it's the latest in the input
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'user') {
        // We check if it already exists to avoid duplication if the page re-renders/retries
        const alreadyExists = await prisma.message.findFirst({
            where: {
                customAgentSessionId: sessionId,
                role: 'user',
                content: lastMsg.content,
            }
        })
        if (!alreadyExists) {
            await prisma.message.create({
                data: {
                  role: "user",
                  content: lastMsg.content,
                  customAgentSessionId: sessionId,
                  code: code || null,
                  speakerName: userName,
                  speakerTitle: "Candidate",
                },
              })
        }
      }
    }

    // Save AI response
    await prisma.message.create({
      data: {
        role: "assistant",
        content: responseData.text,
        customAgentSessionId: sessionId,
        codingChallenge: (responseData.codingChallenge as any) || null,
        isUsersTurn: responseData.isUsersTurn,
        speakerName: agent.name,
        speakerTitle: "Interviewer",
      },
    })

    // Update session and calculate metrics
    await prisma.customAgentSession.update({
      where: { id: sessionId },
      data: {
        status: responseData.status === 'Completed' ? 'Completed' : 'In Progress',
        duration: duration || 0
      }
    })

    // If there's an evaluation, update the last user message and session metrics
    if (responseData.evaluation) {
        const lastUserMsg = await prisma.message.findFirst({
            where: { 
                customAgentSessionId: sessionId,
                role: 'user'
            },
            orderBy: { createdAt: 'desc' }
        })

        if (lastUserMsg) {
            await prisma.message.update({
                where: { id: lastUserMsg.id },
                data: {
                    feedback: responseData.evaluation.feedback,
                    ...responseData.evaluation.metrics
                }
            })

            // Calculate new averages
            const allUserMessages = await prisma.message.findMany({
                where: {
                    customAgentSessionId: sessionId,
                    role: 'user',
                    correctness: { not: null }
                }
            })

            if (allUserMessages.length > 0) {
                const metrics = [
                    'correctness', 'clarity', 'relevance', 'detail', 
                    'efficiency', 'creativity', 'communication', 'problemSolving'
                ]
                
                const averages: Record<string, number> = {}
                metrics.forEach(metric => {
                    const sum = allUserMessages.reduce((acc, msg) => acc + (Number(msg[metric as keyof typeof msg]) || 0), 0)
                    averages[metric] = Math.round(sum / allUserMessages.length)
                })

                await prisma.customAgentSession.update({
                    where: { id: sessionId },
                    data: averages
                })
            }
        }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in custom agent chat:", error)
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    )
  }
}
