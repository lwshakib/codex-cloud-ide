import { NextRequest, NextResponse } from "next/server"
import { generateObjectFromAI } from "@/llm/generateObject"
import { z } from "zod"

const jobDescriptionSchema = z.object({
  description: z.string().describe("A detailed, professional, and comprehensive job description"),
})

export async function POST(req: NextRequest) {
  try {
    const { jobTitle } = await req.json()

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 })
    }

    const systemPrompt = `You are an expert HR manager and recruiter. 
    Your task is to generate a highly detailed, professional, and attractive job description for the following job title: "${jobTitle}".
    
    The description should include:
    1. A brief overview of the role.
    2. Key responsibilities and duties.
    3. Required qualifications and skills (both technical and soft skills).
    4. Preferred experience.
    5. A section about the ideal candidate's personality or work ethic.

    Use professional language and clear formatting (using bullet points where appropriate).`

    const response = await generateObjectFromAI(
      systemPrompt,
      jobDescriptionSchema
    )

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate job description" },
      { status: 500 }
    )
  }
}
