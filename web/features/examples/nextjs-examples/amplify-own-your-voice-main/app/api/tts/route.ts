import { NextRequest, NextResponse } from "next/server";
import { generateAudio } from "@/lib/audio";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await generateAudio({ text, voice });

    if (!result.success || !result.buffer) {
      return NextResponse.json(
        { error: result.error || "Failed to generate audio" },
        { status: 500 }
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
