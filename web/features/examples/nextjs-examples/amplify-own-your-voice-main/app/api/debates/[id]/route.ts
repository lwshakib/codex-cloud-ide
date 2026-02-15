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

    const debate = await prisma.debate.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 })
    }

    return NextResponse.json(debate)
  } catch (error) {
    console.error("Error fetching debate:", error)
    return NextResponse.json(
      { error: "Failed to fetch debate" },
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

    await prisma.debate.delete({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting debate:", error)
    return NextResponse.json(
      { error: "Failed to delete debate" },
      { status: 500 }
    )
  }
}
