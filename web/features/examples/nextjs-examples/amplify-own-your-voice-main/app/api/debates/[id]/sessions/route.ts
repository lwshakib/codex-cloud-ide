import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // const debateId = params.id (removed)

    const body = await req.json().catch(() => ({}));
    const userSide = body.userSide ?? null;
    
    // Create a new debate session
    const debateSession = await prisma.debateSession.create({
      data: {
        debateId,
        userId: session.user.id,
        status: "In Progress",
        userSide: userSide,
      },
    })


    return NextResponse.json(debateSession)
  } catch (error) {
    console.error("Error creating debate session:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}
