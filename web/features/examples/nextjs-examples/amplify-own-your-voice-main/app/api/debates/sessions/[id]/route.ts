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

    const debateSession = await prisma.debateSession.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        debate: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!debateSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(debateSession)
  } catch (error) {
    console.error("Error fetching debate session:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await req.json()
    const updated = await prisma.debateSession.update({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating debate session:", error)
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    )
  }
}
