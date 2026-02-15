import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prefix, suffix, fileName } = await req.json();
    
    // Simulating AI completion
    // In a real app, this would call an LLM (Claude, GPT-4, etc.)
    
    let completion = "";
    if (prefix.endsWith("const ") || prefix.endsWith("let ")) {
        completion = "myVariable = 10;";
    } else if (prefix.endsWith("function ")) {
        completion = "handleClick() {\n  console.log('clicked');\n}";
    }
    
    return NextResponse.json({ completion });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch completion" }, { status: 500 });
  }
}
