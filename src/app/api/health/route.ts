import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  let version = "0.0.0";
  try {
    version = readFileSync(join(process.cwd(), "VERSION"), "utf8").trim();
  } catch {
    // VERSION optional
  }

  return NextResponse.json({
    ok: true,
    version,
    service: "daily-briefing",
  });
}
