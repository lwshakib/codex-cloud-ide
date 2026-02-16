import { NextRequest, NextResponse } from "next/server";
import { getInitialFiles } from "@/lib/starters";
import { getTemplateByType } from "@/lib/workspace-registry";
import { AppType } from "@/hooks/use-workspace-store";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type") as AppType;

  if (!type) {
    return NextResponse.json({ error: "Type is required" }, { status: 400 });
  }

  const template = getTemplateByType(type);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    const files = getInitialFiles(template.folder);
    return NextResponse.json({ files });
  } catch (err: any) {
    console.error("Failed to get initial files:", err);
    return NextResponse.json({ error: "Failed to load starter files" }, { status: 500 });
  }
}
