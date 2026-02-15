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

    const { jobTitle, description, characterId } = await req.json()

    if (!jobTitle || !description) {
      return NextResponse.json(
        { error: "Job title and description are required" },
        { status: 400 }
      )
    }

    // Auto Selection if not provided
    let finalCharacterId = characterId
    if (!finalCharacterId) {
      const interviewers = CHARACTERS.filter(c => c.role === 'interviewer')
      const randomInterviewer = interviewers[Math.floor(Math.random() * interviewers.length)]
      finalCharacterId = randomInterviewer.id
    }

    const interview = await prisma.interview.create({
      data: {
        jobTitle,
        description,
        characterId: finalCharacterId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(interview)
  } catch (error) {
    console.error("Error creating interview:", error)
    return NextResponse.json(
      { error: "Failed to create interview" },
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

    const interviews = await prisma.interview.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
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
    })

    return NextResponse.json(interviews)
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    )
  }
}
