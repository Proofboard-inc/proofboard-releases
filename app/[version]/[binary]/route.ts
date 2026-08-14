import { NextResponse } from "next/server";
import { resolveTag, assetUrl } from "@/lib/github";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ version: string; binary: string }> }
) {
  const { version, binary } = await params;
  const tag = await resolveTag(version);

  if (!tag) {
    return NextResponse.json(
      { error: `Could not resolve release for version "${version}"` },
      { status: 404 }
    );
  }

  return NextResponse.redirect(assetUrl(tag, binary), {
    status: 302,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}