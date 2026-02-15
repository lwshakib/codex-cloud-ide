import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const agents = await prisma.customAgent.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
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
  });

  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, instruction, characterId } = await req.json();

  if (!name || !instruction) {
    return new NextResponse("Name and instruction are required", { status: 400 });
  }

  const agent = await prisma.customAgent.create({
    data: {
      name,
      instruction,
      characterId,
      userId: session.user.id,
    },
  });

  return NextResponse.json(agent);
}
