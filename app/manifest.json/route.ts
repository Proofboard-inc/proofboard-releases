import { NextResponse } from "next/server";
import { resolveTag, listAssets } from "@/lib/github";

export const runtime = "edge";

type Platform = "macos" | "linux" | "windows" | "other";

// Every artifact the release publishes, described so a human or a script can
// find the right one without knowing the filename convention. This is what
// makes "does this release cover Windows on ARM?" answerable by looking at
// one URL instead of eyeballing the GitHub release page.
function describe(name: string): {
    platform: Platform;
    arch: string | null;
    format: string;
} {
    const lower = name.toLowerCase();

    let platform: Platform = "other";
    if (lower.includes("darwin") || lower.endsWith(".pkg") || lower.endsWith(".dmg")) {
        platform = "macos";
    } else if (lower.includes("windows") || lower.endsWith(".msi") || lower.endsWith(".msix")) {
        platform = "windows";
    } else if (
        lower.includes("linux") ||
        lower.endsWith(".deb") ||
        lower.endsWith(".rpm") ||
        lower.endsWith(".appimage")
    ) {
        platform = "linux";
    }

    let arch: string | null = null;
    if (lower.includes("arm64") || lower.includes("aarch64")) arch = "arm64";
    else if (lower.includes("amd64") || lower.includes("x86_64")) arch = "amd64";

    let format = "binary";
    if (lower.endsWith(".sig")) format = "signature";
    else if (lower.endsWith("-setup.exe")) format = "installer";
    else if (lower.endsWith(".deb")) format = "deb";
    else if (lower.endsWith(".rpm")) format = "rpm";
    else if (lower.endsWith(".appimage")) format = "appimage";
    else if (lower.endsWith(".pkg")) format = "pkg";
    else if (lower.endsWith(".dmg")) format = "dmg";
    else if (lower.endsWith(".msi")) format = "msi";
    else if (lower.endsWith(".msix")) format = "msix";
    else if (lower.endsWith(".tgz")) format = "npm";
    else if (lower === "checksums.txt") format = "checksums";
    else if (lower.startsWith("install.")) format = "script";
    else if (lower.endsWith(".json")) format = "metadata";

    return { platform, arch, format };
}

export async function GET() {
    const tag = await resolveTag("latest");
    if (!tag) {
        return NextResponse.json(
            { error: "Could not resolve latest release" },
            { status: 502 }
        );
    }

    const assets = await listAssets(tag);
    const artifacts = assets
        .map((a) => ({ name: a.name, size: a.size, url: `/${tag}/${a.name}`, ...describe(a.name) }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
        { version: tag, count: artifacts.length, artifacts },
        { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
    );
}
