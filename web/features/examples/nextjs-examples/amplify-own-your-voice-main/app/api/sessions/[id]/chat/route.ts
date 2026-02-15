import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateText } from "ai"
import { GeminiModel } from "@/llm/model"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, code, duration } = await req.json()

    const interviewSession = await prisma.interviewSession.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        interview: true,
      },
    })

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { getCharacter } = await import("@/lib/characters")
    const interviewerChar = getCharacter(interviewSession.interview.characterId || "olivia")
    const interviewerName = interviewerChar ? `${interviewerChar.firstName} ${interviewerChar.lastName}` : "Sarah Thompson"

    const systemPrompt = `You are an expert AI interviewer named ${interviewerName}. You are conducting a ${interviewSession.interview.type} interview for the position of ${interviewSession.interview.jobTitle}.
    
    Candidate Name: ${session.user.name}
    Job Description:
    ${interviewSession.interview.description}
    
    CORE INTERVIEW QUESTIONS:
    1. Tell me about yourself and your qualifications.
    2. What makes you unique?
    3. Why should we hire you?
    4. Why do you want to work here?
    5. What interests you about this role?
    6. What motivates you?
    7. What are your greatest strengths?
    8. What is your greatest weakness?
    9. Where do you see yourself in five years?
    10. What are your goals for the future?
    11. What did you like most about your last position?
    12. What did you like least about your last position?
    13. Why are you leaving your current job?
    14. Can you tell me about a difficult work situation and how you overcame it? (STAR method)
    15. How do you handle stress and pressure?
    16. How do you handle conflict in the workplace?
    17. What is your greatest accomplishment?
    18. How do you define success?
    19. What are your salary expectations?
    20. Do you have any questions for me?
    21. What are you passionate about?
    22. What can you bring to the company?

    YOUR GOAL: 
    - Conduct a professional, structured, and challenging technical interview.
    - INTERVIEW STRUCTURE:
      1. START (Phase 1): Introduce yourself, greet the candidate, and ask exactly 2 introductory questions about their background and qualifications.
      2. MIDDLE (Phase 2): Shift to technical/DSA questions. Ask 2-3 technical questions, with at least one involving a "codingChallenge". Use the coding editor for these.
      3. END (Phase 3): Ask 1 final question about career goals or "Why should we hire you?".
      4. CONCLUSION: After the final question, provide a formal verdict: "You are hired on our team!" or "Unfortunately, you are not hired for our team at this time." based on their performance. Give a brief summary of why, and set "isFinished: true".

    - LIMIT: The entire interview must conclude within 6-7 questions.
    - STYLE: Keep your responses concise (3-4 sentences) for voice-over.
    - SCORING: Be highly critical. Only perfect answers get 100%. Honest feedback is mandatory.

    CRITICAL: 
    - Do NOT use any Markdown formatting (like **bolding** or __italics__) in your 'reply' field. The text will be read aloud by a TTS engine, and special characters like asterisks will be read literally. 
    - Keep the text as plain, conversational prose.
    - NEVER use placeholders. Use "${interviewerName}" and "${session.user.name}".
    
    CRITICAL: You must provide your response in JSON format:
    {
      "reply": "Your conversational response here",
      "isFinished": boolean, // Set to true ONLY when you provide the final verdict at the very end of the session.
      "codingChallenge": {
        "title": "Title",
        "description": "Problem statement",
        "initialCode": "// Boilerplate",
        "language": "javascript" | "python" | "cpp"
      },
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
      }
    }
    Set codingChallenge to null if not needed. Set evaluation to null for the initial greeting.
    
    Current Interview Status: ${interviewSession.status}.`

    // Augment messages with code if present
    const augmentedMessages = messages.map((m: any) => {
      if (m.role === 'user' && m.code) {
        return {
          ...m,
          content: `${m.content}\n\n[SUBMITTED CODE]:\n\`\`\`\n${m.code}\n\`\`\``
        }
      }
      return m
    })

    const finalMessages = augmentedMessages.length === 0 
      ? [{ role: 'user', content: `Please start the interview by introducing yourself as ${interviewerName} and asking the first question.` }] 
      : augmentedMessages

    // If current request has code, append it to the last user message in finalMessages for the LLM
    if (code && finalMessages.length > 0) {
      const lastIdx = finalMessages.length - 1
      if (finalMessages[lastIdx].role === 'user') {
        finalMessages[lastIdx].content = `${finalMessages[lastIdx].content}\n\n[SUBMITTED CODE]:\n\`\`\`\n${code}\n\`\`\``
      }
    }

    // 1. If it's a real user message (not the initial greeting request), save it
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'user') {
        await prisma.message.create({
          data: {
            interviewSessionId: id,
            role: 'user',
            content: lastMsg.content,
            code: code || null,
            speakerName: session.user.name || "Candidate",
            speakerTitle: "Candidate",
          }
        })
      }
    }

    const response = await generateText({
      model: GeminiModel(),
      system: systemPrompt,
      messages: finalMessages,
    })

    let aiData;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: response.text, evaluation: null };
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", response.text);
      aiData = { reply: response.text, evaluation: null };
    }

    // 2. Save assistant's reply
    const assistantMsg = await prisma.message.create({
      data: {
        interviewSessionId: id,
        role: 'assistant',
        content: aiData.reply,
        codingChallenge: aiData.codingChallenge || null,
        speakerName: interviewerName,
        speakerTitle: "Interviewer",
      }
    })

    // 3. Update session metadata (duration and status)
    await prisma.interviewSession.update({
      where: { id },
      data: {
        duration: duration || undefined,
        status: aiData.isFinished ? 'Completed' : undefined
      }
    })

    // 3. Update the last user message with evaluation if provided
    if (aiData.evaluation) {
      const lastUserMsg = await prisma.message.findFirst({
        where: { 
          interviewSessionId: id,
          role: 'user'
        },
        orderBy: { createdAt: 'desc' }
      })

      if (lastUserMsg) {
        await prisma.message.update({
          where: { id: lastUserMsg.id },
          data: {
            feedback: aiData.evaluation.feedback,
            ...aiData.evaluation.metrics
          }
        })

        // 4. Update session-wide average metrics
        const allUserMessages = await prisma.message.findMany({
          where: {
            interviewSessionId: id,
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

          await prisma.interviewSession.update({
            where: { id },
            data: averages
          })
        }
      }
    }

    return NextResponse.json({ 
      text: aiData.reply,
      codingChallenge: aiData.codingChallenge,
      status: aiData.isFinished ? 'Completed' : 'In Progress'
    })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    )
  }
}
