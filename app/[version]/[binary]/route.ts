import { NextResponse } from "next/server";
import { resolveTag, resolveAssetName, assetUrl } from "@/lib/github";

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

  // Resolve against what the release actually publishes rather than trusting
  // the requested spelling. The release carries one naming convention; older
  // install scripts ask for the other. Without this, tidying the duplicate
  // assets off the release would 404 every install already in the wild.
  const name = await resolveAssetName(tag, binary);

  if (!name) {
    return NextResponse.json(
      { error: `"${binary}" is not published on release ${tag}` },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  // No shared/CDN caching on the "latest" redirect — a cached 302 here is
  // exactly what kept serving a stale release for 15+ minutes after a new
  // one published (see resolveTag in lib/github.ts, which no longer caches
  // the GitHub lookup either). A pinned version (e.g. /v1.16.0/binary) is
  // immutable and would be safe to cache, but this handler serves both from
  // the same code path, so keep it uncached for correctness on "latest".
  return NextResponse.redirect(assetUrl(tag, name), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
