import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { interviewId } = await req.json()

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      )
    }

    // Create a new interview session
    const interviewSession = await prisma.interviewSession.create({
      data: {
        interviewId,
        userId: session.user.id,
        status: "In Progress",
      },
    })

    return NextResponse.json(interviewSession)
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [interviewSessions, debateSessions, customAgentSessions] = await Promise.all([
      prisma.interviewSession.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          interview: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.debateSession.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          debate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.customAgentSession.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          customAgent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    ])

    const allSessions = [
      ...interviewSessions.map(s => ({ ...s, type: 'interview' })),
      ...debateSessions.map(s => ({ ...s, type: 'debate' })),
      ...customAgentSessions.map(s => ({ ...s, type: 'ai-persona' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(allSessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}
