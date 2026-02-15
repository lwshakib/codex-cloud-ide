import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// POST /api/marketplace/[id]/install - Install into my list
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const content = item.content as any
    const userId = session.user.id

    if (item.type === "interview") {
      const existing = await prisma.interview.findFirst({
        where: { userId, installedFromId: id }
      })
      if (existing) return NextResponse.json({ success: true, alreadyInstalled: true })

      await prisma.interview.create({
        data: {
          jobTitle: content.jobTitle,
          description: content.description,
          type: content.type || "Technical",
          characterId: content.characterId,
          userId,
          installedFromId: id,
        }
      })
    } else if (item.type === "debate") {
      const existing = await prisma.debate.findFirst({
        where: { userId, installedFromId: id }
      })
      if (existing) return NextResponse.json({ success: true, alreadyInstalled: true })

      await prisma.debate.create({
        data: {
          subject: content.subject,
          content: content.content,
          judgeId: content.judgeId,
          opponentId: content.opponentId,
          userId,
          installedFromId: id,
        }
      })
    } else if (item.type === "ai-persona") {
      const existing = await prisma.customAgent.findFirst({
        where: { userId, installedFromId: id }
      })
      if (existing) return NextResponse.json({ success: true, alreadyInstalled: true })

      await prisma.customAgent.create({
        data: {
          name: content.name,
          instruction: content.instruction,
          characterId: content.characterId,
          userId,
          installedFromId: id,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error installing marketplace item:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
