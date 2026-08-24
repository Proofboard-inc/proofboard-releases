import { NextResponse } from "next/server";
import { resolveTag } from "@/lib/github";

export const runtime = "edge";
export const revalidate = 300;

export async function GET() {
    const tag = await resolveTag("latest");
    if (!tag) {
        return NextResponse.json({ error: "Could not resolve latest release" }, { status: 502 });
    }
    return NextResponse.json(
        { version: tag },
        { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
}