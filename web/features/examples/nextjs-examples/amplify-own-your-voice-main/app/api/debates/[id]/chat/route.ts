import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
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

    const { messages, duration } = await req.json()
    // const sessionId = params.id (removed as it is now sessionId from await params)

    // Fetch the debate session and motion
    const debateSession = await prisma.debateSession.findUnique({
      where: { id: sessionId },
      include: { 
        debate: true,
        user: true 
      },
    })

    if (!debateSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { CHARACTERS, getCharacter } = await import("@/lib/characters")
    const judge = getCharacter(debateSession.debate.judgeId || "ethan")
    
    // Get all 3 opponents for a full team
    const leadId = debateSession.debate.opponentId || "sophia"
    const allOpponents = CHARACTERS.filter(c => c.role === "opponent")
    const lead = allOpponents.find(c => c.id === leadId) || allOpponents[0]
    const others = allOpponents.filter(c => c.id !== lead.id)
    const deputy = others[0]
    const whip = others[1]

    const userName = debateSession.user?.name || "User"
    const motion = debateSession.debate.subject
    const extraInfo = debateSession.debate.content || "No extra context provided."

    if (!debateSession.userSide) {
      return NextResponse.json({ error: "User side not selected" }, { status: 400 })
    }
    const userSide = debateSession.userSide
    const isUserPro = userSide === "PRO"

    const judgesName = `${judge?.firstName} ${judge?.lastName}`
    const leadsName = `${lead?.firstName} ${lead?.lastName}`
    const deputysName = `${deputy?.firstName} ${deputy?.lastName}`
    const whipsName = `${whip?.firstName} ${whip?.lastName}`

    // System prompt for the Debate Judge/Opponent
    const systemPrompt = `
You are an expert Debate Judge and a team of 3 debaters.
The motion is: "${motion}"
Context: ${extraInfo}

THE CHARACTERS:
JUDGE: ${judgesName}. Description: ${judge?.description}

AFFIRMATIVE TEAM:
1. Prime Minister: ${isUserPro ? userName : leadsName}
2. Deputy Prime Minister: ${isUserPro ? userName : deputysName}
3. Rebuttal Speaker: ${isUserPro ? userName : whipsName}

NEGATIVE TEAM:
1. Leader of Opposition: ${isUserPro ? leadsName : userName}
2. Deputy Leader of Opposition: ${isUserPro ? deputysName : userName}
3. Opposition Whip: ${isUserPro ? whipsName : userName}

DEBATE STRUCTURE & TURN ORDER:
1. JUDGE opens and invites Prime Minister.
2. Prime Minister speaks.
3. JUDGE invites Leader of Opposition.
4. Leader of Opposition speaks.
5. JUDGE invites Deputy Prime Minister.
6. Deputy Prime Minister speaks.
7. JUDGE invites Deputy Leader of Opposition.
8. Deputy Leader of Opposition speaks.
9. JUDGE invites Affirmative Rebuttal.
10. Affirmative Rebuttal speaks.
11. JUDGE invites Opposition Whip.
12. Opposition Whip speaks.
13. JUDGE closes and declares winner.

USER SIDE: You are on the ${isUserPro ? 'AFFIRMATIVE' : 'NEGATIVE'} team.
AI SIDE: You play the Judge and the speakers for the ${isUserPro ? 'NEGATIVE' : 'AFFIRMATIVE'} team.

YOUR ROLES:
- You play the JUDGE (${judgesName}) and the three speakers on the ${isUserPro ? 'NEGATIVE' : 'AFFIRMATIVE'} team.
- YOU ARE STRICTLY FORBIDDEN from generating dialogue, speeches, or "text" for any character on the ${isUserPro ? 'AFFIRMATIVE' : 'NEGATIVE'} team (the User's team).
- If it is the turn of someone on the User's team to speak, the JUDGE should take the floor, invite them to speak, and then you MUST STOP.
- After every speaker (AI or User) finishes their turn, the JUDGE must speak to invite the next person.
- NEVER combine the Judge's transition and a debater's speech in a single response IF the debater is a different character. 
- ALWAYS respond as ONLY ONE character at a time.
- LENGTH LIMIT: Your "text" field MUST be under 1500 characters. Be concise.
- JSON ESCAPING: Use \\n for newlines. No raw newlines in JSON strings.

You MUST respond with a valid JSON object matching the following structure. NO markdown formatting, NO preamble.
 { 
   "text": string, 
   "speakerName": string, 
   "speakerTitle": string, 
   "status": "In Progress" | "Completed", 
   "isUsersTurn": boolean,
   "evaluation": {
    "feedback": "Detailed feedback for the LAST user message in terms of argument strength, logic, and delivery.",
    "metrics": {
      "correctness": 0-100, // Logic/Fact accuracy
      "clarity": 0-100,
      "relevance": 0-100,
      "detail": 0-100,
      "efficiency": 0-100,
      "creativity": 0-100,
      "communication": 0-100,
      "problemSolving": 0-100 // Strategic advantage in debate
    }
  } | null
 }
 Set evaluation to null if the last speaker was AI.
`


    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: `${m.speakerName} (${m.speakerTitle}): ${m.content}`,
    }))

    if (coreMessages.length === 0) {
      coreMessages.push({
        role: "user", 
        content: "The debate is live. Proceed with the first turn as per the rules."
      })
    } else if (coreMessages[coreMessages.length - 1].role === "assistant") {
      coreMessages.push({
        role: "user",
        content: "Proceed with the next speaker's turn according to the structure."
      })
    }

    const { object: responseData } = await generateObject({
      model: GeminiModel(),
      system: systemPrompt,
      messages: coreMessages,
      schema: z.object({
        text: z.string().describe("The spoken content of the current speaker. Max 1500 characters. USE \\n FOR NEWLINES, DO NOT USE RAW NEWLINES."),
        speakerName: z.string().describe("The full name of the current character."),
        speakerTitle: z.string().describe("The role (Judge, Prime Minister, etc.)"),
        status: z.enum(["In Progress", "Completed"]),
        isUsersTurn: z.boolean().describe("true if the USER is the very next speaker to be invited or to speak."),
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

    // Save the new messages to the database
    // Extract user message from input if not already saved
    if (messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
            await prisma.message.create({
                data: {
                    role: 'user',
                    content: lastUserMessage.content,
                    debateSessionId: sessionId,
                    speakerName: lastUserMessage.speakerName || 'You',
                    speakerTitle: lastUserMessage.speakerTitle || 'Speaker',
                }
            })
        }
    }

    // Save AI response
    await prisma.message.create({
      data: {
        role: "assistant",
        content: responseData.text,
        debateSessionId: sessionId,
        speakerName: responseData.speakerName,
        speakerTitle: responseData.speakerTitle,
        isUsersTurn: responseData.isUsersTurn,
      },
    })

    // Update session status and duration
    await prisma.debateSession.update({
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
                debateSessionId: sessionId,
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
                    debateSessionId: sessionId,
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

                await prisma.debateSession.update({
                    where: { id: sessionId },
                    data: averages
                })
            }
        }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in debate chat:", error)
    return NextResponse.json(
      { error: "Failed to process debate step" },
      { status: 500 }
    )
  }
}
