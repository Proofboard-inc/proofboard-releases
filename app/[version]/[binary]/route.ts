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

  // No shared/CDN caching on the "latest" redirect — a cached 302 here is
  // exactly what kept serving a stale release for 15+ minutes after a new
  // one published (see resolveTag in lib/github.ts, which no longer caches
  // the GitHub lookup either). A pinned version (e.g. /v1.16.0/binary) is
  // immutable and would be safe to cache, but this handler serves both from
  // the same code path, so keep it uncached for correctness on "latest".
  return NextResponse.redirect(assetUrl(tag, binary), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}