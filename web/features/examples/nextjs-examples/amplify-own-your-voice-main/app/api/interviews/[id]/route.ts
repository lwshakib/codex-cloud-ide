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

    const interview = await prisma.interview.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json(interview)
  } catch (error) {
    console.error("Error fetching interview:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview" },
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

    const { description } = await req.json()

    const updatedInterview = await prisma.interview.update({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        description,
      },
    })

    return NextResponse.json(updatedInterview)
  } catch (error) {
    console.error("Error updating interview:", error)
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.interview.delete({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting interview:", error)
    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 }
    )
  }
}
