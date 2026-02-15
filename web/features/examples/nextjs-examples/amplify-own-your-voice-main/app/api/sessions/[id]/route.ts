import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
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

    // Try finding in interview sessions first
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: id, userId: session.user.id },
      include: {
        interview: { select: { jobTitle: true, description: true, type: true, characterId: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (interviewSession) {
      return NextResponse.json({ ...interviewSession, type: 'interview' })
    }

    // Try finding in debate sessions
    const debateSession = await prisma.debateSession.findUnique({
      where: { id: id, userId: session.user.id },
      include: {
        debate: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (debateSession) {
      return NextResponse.json({ ...debateSession, type: 'debate' })
    }

    // Try finding in ai-persona sessions
    const customAgentSession = await prisma.customAgentSession.findUnique({
      where: { id: id, userId: session.user.id },
      include: {
        customAgent: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (customAgentSession) {
      return NextResponse.json({ ...customAgentSession, type: 'ai-persona' })
    }

    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (type === 'debate') {
      await prisma.debateSession.delete({
        where: { id: id, userId: session.user.id },
      })
    } else if (type === 'ai-persona') {
      await prisma.customAgentSession.delete({
        where: { id: id, userId: session.user.id },
      })
    } else {
      await prisma.interviewSession.delete({
        where: { id: id, userId: session.user.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
