import { NextResponse } from "next/server";
import { buildService } from "@/lib/agents/service-builder/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let description: string | undefined;
  try {
    const b = await req.json();
    if (typeof b?.description === "string" && b.description.trim()) description = b.description.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!description) return NextResponse.json({ error: "description is required." }, { status: 400 });

  try {
    return NextResponse.json(await buildService(description));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Service build failed." }, { status: 500 });
  }
}
