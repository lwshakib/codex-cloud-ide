import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { instructions, selectedText, fileName } = await req.json();
    
    // In a real app, this would be a streaming response from an LLM
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const fullResponse = `// Modified for: ${instructions}\n${selectedText.toUpperCase()}`;
        const chunks = fullResponse.split(" ");
        
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk + " "));
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to perform quick edit" }, { status: 500 });
  }
}
