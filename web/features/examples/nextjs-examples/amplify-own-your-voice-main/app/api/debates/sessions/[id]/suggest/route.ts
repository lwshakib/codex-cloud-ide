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
    const { id: sessionId } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages } = await req.json()

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

    const motion = debateSession.debate.subject
    const extraInfo = debateSession.debate.content || "No extra context provided."
    const userSide = debateSession.userSide
    const userName = debateSession.user?.name || "User"

    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: `${m.speakerName} (${m.speakerTitle}): ${m.content}`,
    }))

    if (coreMessages.length > 0 && coreMessages[coreMessages.length - 1].role === "assistant") {
      coreMessages.push({
        role: "user",
        content: "I am now taking the floor. Based on the debate above, help me formulate a powerful speech for my turn."
      })
    }

    const systemPrompt = `
You are an expert Debate Coach. 
The user is participating in a debate on the motion: "${motion}"
Context: ${extraInfo}
User's Team: ${userSide === "PRO" ? "AFFIRMATIVE (Government)" : "NEGATIVE (Opposition)"}

TASK:
Provide a concise, high-impact speech (max 1000 characters) for the user to read. 
The speech should respond to the latest points made in the debate and strongly support the user's side.
Address the Judge and the audience formally.

FORMAT:
Return ONLY the text of the speech. 
CRITICAL: Do not include the speaker's name, title, or any prefix like "Ethan Pierce:". 
Do not include any introductory notes or coaching advice.
Just the raw speech content.
`

    const { text } = await generateText({
      model: GeminiModel(),
      system: systemPrompt,
      messages: coreMessages,
    })

    return NextResponse.json({ suggestion: text.trim() })
  } catch (error) {
    console.error("Error in suggestion API:", error)
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    )
  }
}
