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

    const agentName = agentSession.customAgent.name
    const agentInstruction = agentSession.customAgent.instruction
    const userName = agentSession.user?.name || "User"

    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    if (coreMessages.length > 0 && coreMessages[coreMessages.length - 1].role === "assistant") {
      coreMessages.push({
        role: "user",
        content: "Help me formulate a creative and engaging response to continue this conversation."
      })
    }

    const systemPrompt = `
You are an expert Communication Coach. 
The user is talking to an AI Persona named: "${agentName}"
The AI Persona's instructions/personality: ${agentInstruction}

TASK:
Provide a concise, engaging, and high-impact response (max 1000 characters) for the user to say. 
The response should be consistent with the conversation's flow and help the user express themselves effectively.

FORMAT:
Return ONLY the text of the speech. 
Do not include any introductory notes or coaching advice.
Just the raw response content.
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
