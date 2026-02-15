import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { CHARACTERS } from "@/lib/characters"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, content } = await req.json()

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      )
    }

    // Auto Selection
    const judges = CHARACTERS.filter(c => c.role === 'judge')
    const opponents = CHARACTERS.filter(c => c.role === 'opponent')

    const randomJudge = judges[Math.floor(Math.random() * judges.length)]
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)]

    const debate = await prisma.debate.create({
      data: {
        subject,
        content: content || null, // Ensure explicitly null if empty
        judgeId: randomJudge.id,
        opponentId: randomOpponent.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(debate)
  } catch (error) {
    console.error("Error creating debate:", error)
    return NextResponse.json(
      { error: "Failed to create debate" },
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

    const debates = await prisma.debate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        debateSessions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        installedFrom: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(debates)
  } catch (error) {
    console.error("Error fetching debates:", error)
    return NextResponse.json(
      { error: "Failed to fetch debates" },
      { status: 500 }
    )
  }
}
