import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { GeminiModel } from "@/llm/model";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { description } = await req.json();

  if (!description) {
    return new NextResponse("Description is required", { status: 400 });
  }

  try {
    const { object: generatedInfo } = await generateObject({
      model: GeminiModel(),
      system: `You are an expert AI Architect. Your task is to generate a comprehensive "Name" and "System Instruction" for a custom AI agent based on a user's brief goal description.
      
The Name should be concise and professional.
The System Instruction should be detailed, defining the agent's personality, goals, output format, and specific behaviors.
The agent has access to UI rendering capabilities, so instructions should include guidance on when to project rich UI content.`,
      prompt: `User's Goal: "${description}"`,
      schema: z.object({
        name: z.string().describe("A professional and catchy name for the agent."),
        instruction: z.string().describe("Comprehensive system instructions for the agent."),
      }),
    });

    return NextResponse.json(generatedInfo);
  } catch (error) {
    console.error("Error generating agent info:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
