import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const query = req.nextUrl.searchParams.get("q")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    // 1. Interviews (by title, description, or interviewer character name)
    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        OR: [
          { jobTitle: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    })

    // 2. Debates (by subject, mission/content)
    const debates = await prisma.debate.findMany({
      where: {
        userId,
        OR: [
          { subject: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    })

    // 3. AI Personas (by name, instruction)
    const customAgents = await prisma.customAgent.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { instruction: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    })

    // 4. Session Conversations (searching within messages)
    const sessionsWithMatches = await prisma.message.findMany({
        where: {
            interviewSession: { userId },
            OR: [
                { content: { contains: query, mode: "insensitive" } },
                { speakerName: { contains: query, mode: "insensitive" } },
            ]
        },
        include: {
            interviewSession: {
                include: {
                    interview: true
                }
            }
        },
        take: 10,
        distinct: ['interviewSessionId']
    })

    const debateSessionsWithMatches = await prisma.message.findMany({
        where: {
            debateSession: { userId },
            OR: [
                { content: { contains: query, mode: "insensitive" } },
                { speakerName: { contains: query, mode: "insensitive" } },
            ]
        },
        include: {
            debateSession: {
                include: {
                    debate: true
                }
            }
        },
        take: 10,
        distinct: ['debateSessionId']
    })

    const agentSessionsWithMatches = await prisma.message.findMany({
        where: {
            customAgentSession: { userId },
            OR: [
                { content: { contains: query, mode: "insensitive" } },
                { speakerName: { contains: query, mode: "insensitive" } },
            ]
        },
        include: {
            customAgentSession: {
                include: {
                    customAgent: true
                }
            }
        },
        take: 10,
        distinct: ['customAgentSessionId']
    })

    const results = [
      ...interviews.map((i) => ({
        id: i.id,
        title: i.jobTitle,
        type: "Interview Template",
        url: `/interviews/${i.id}`,
        subtitle: i.description.substring(0, 60) + "..."
      })),
      ...debates.map((d) => ({
        id: d.id,
        title: d.subject,
        type: "Debate Template",
        url: `/debates/${d.id}`,
        subtitle: (d.content || "").substring(0, 60) + "..."
      })),
      ...customAgents.map((a) => ({
        id: a.id,
        title: a.name,
        type: "AI Persona",
        url: `/ai-personas/${a.id}`,
        subtitle: a.instruction.substring(0, 60) + "..."
      })),
      ...sessionsWithMatches.map((m) => ({
        id: m.interviewSessionId!,
        title: `Session: ${m.interviewSession?.interview.jobTitle}`,
        type: "Interview Session",
        url: `/sessions/${m.interviewSessionId}/run`,
        subtitle: `Match: "${m.content.substring(0, 40)}..."`
      })),
      ...debateSessionsWithMatches.map((m) => ({
        id: m.debateSessionId!,
        title: `Session: ${m.debateSession?.debate.subject}`,
        type: "Debate Session",
        url: `/debates/sessions/${m.debateSessionId}/run`,
        subtitle: `Match: "${m.content.substring(0, 40)}..."`
      })),
      ...agentSessionsWithMatches.map((m) => ({
        id: m.customAgentSessionId!,
        title: `Session: ${m.customAgentSession?.customAgent.name}`,
        type: "AI Persona Session",
        url: `/ai-personas/sessions/${m.customAgentSessionId}/run`,
        subtitle: `Match: "${m.content.substring(0, 40)}..."`
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
