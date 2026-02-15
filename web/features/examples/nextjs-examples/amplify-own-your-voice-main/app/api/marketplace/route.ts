import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET /api/marketplace - List all items or filter by mine
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    const { searchParams } = new URL(req.url)
    const filterMine = searchParams.get("mine") === "true"

    const where = filterMine && session?.user?.id 
      ? { userId: session.user.id } 
      : {}

    const items = await prisma.marketplaceItem.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        },
        ratings: true, // For average rating calculation if needed
      },
      orderBy: { createdAt: "desc" },
    })

    // Enrich with isInstalled status
    let enrichedItems = items.map(item => ({ ...item, isInstalled: false }))
    
    if (session?.user?.id) {
        const userId = session.user.id
        const [userInterviews, userDebates, userAgents] = await Promise.all([
            prisma.interview.findMany({ where: { userId, NOT: { installedFromId: null } }, select: { installedFromId: true } }),
            prisma.debate.findMany({ where: { userId, NOT: { installedFromId: null } }, select: { installedFromId: true } }),
            prisma.customAgent.findMany({ where: { userId, NOT: { installedFromId: null } }, select: { installedFromId: true } }),
        ])

        const installedIds = new Set([
            ...userInterviews.map(i => i.installedFromId),
            ...userDebates.map(d => d.installedFromId),
            ...userAgents.map(a => a.installedFromId),
        ])

        enrichedItems = items.map(item => ({
            ...item,
            isInstalled: installedIds.has(item.id)
        }))
    }

    return NextResponse.json(enrichedItems)
  } catch (error) {
    console.error("Error fetching marketplace items:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/marketplace - Add a copy of an existing item to marketplace
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, id: originalId } = await req.json()

    let name = ""
    let description = ""
    let content: any = {}
    let originalIdField: any = {}

    if (type === "interview") {
      const interview = await prisma.interview.findUnique({
        where: { id: originalId },
      })
      if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 })
      
      const existing = await prisma.marketplaceItem.findFirst({
        where: { userId: session.user.id, originalInterviewId: originalId }
      })
      if (existing) return NextResponse.json(existing)

      name = interview.jobTitle
      description = interview.description
      content = {
        jobTitle: interview.jobTitle,
        description: interview.description,
        type: interview.type,
        characterId: interview.characterId,
      }
      originalIdField = { originalInterviewId: originalId }
    } else if (type === "debate") {
      const debate = await prisma.debate.findUnique({
        where: { id: originalId },
      })
      if (!debate) return NextResponse.json({ error: "Debate not found" }, { status: 404 })
      
      const existing = await prisma.marketplaceItem.findFirst({
        where: { userId: session.user.id, originalDebateId: originalId }
      })
      if (existing) return NextResponse.json(existing)

      name = debate.subject
      description = debate.content || ""
      content = {
        subject: debate.subject,
        content: debate.content,
        judgeId: debate.judgeId,
        opponentId: debate.opponentId,
      }
      originalIdField = { originalDebateId: originalId }
    } else if (type === "ai-persona") {
      const agent = await prisma.customAgent.findUnique({
        where: { id: originalId },
      })
      if (!agent) return NextResponse.json({ error: "AI Persona not found" }, { status: 404 })
      
      const existing = await prisma.marketplaceItem.findFirst({
        where: { userId: session.user.id, originalCustomAgentId: originalId }
      })
      if (existing) return NextResponse.json(existing)

      name = agent.name
      description = agent.instruction
      content = {
        name: agent.name,
        instruction: agent.instruction,
        characterId: agent.characterId,
      }
      originalIdField = { originalCustomAgentId: originalId }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const newItem = await prisma.marketplaceItem.create({
      data: {
        name,
        description,
        type,
        content,
        userId: session.user.id,
        ...originalIdField
      }
    })

    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Error adding to marketplace:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
