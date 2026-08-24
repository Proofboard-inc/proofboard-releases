import { resolveTag, listAssets } from "@/lib/github";

// Formats worth offering a person a button for. Signatures, checksums and the
// npm tarball are all published too, but they are things a script fetches
// rather than things someone picks off a page.
const FORMAT_LABELS: Record<string, string> = {
    binary: "Binary",
    installer: "Installer (.exe)",
    deb: ".deb",
    rpm: ".rpm",
    appimage: ".AppImage",
    pkg: ".pkg",
    dmg: ".dmg",
    msi: ".msi",
    msix: ".msix",
};

const PLATFORM_ORDER = ["macOS", "Linux", "Windows"] as const;
type PlatformName = (typeof PLATFORM_ORDER)[number];

type Entry = { format: string; name: string };

function classify(name: string): { platform: PlatformName; arch: string; format: string } | null {
    const lower = name.toLowerCase();
    if (lower.endsWith(".sig") || lower.endsWith(".txt") || lower.endsWith(".tgz")) return null;
    if (lower.endsWith(".json") || lower.startsWith("install.")) return null;

    let platform: PlatformName;
    if (lower.includes("darwin")) platform = "macOS";
    else if (lower.includes("windows")) platform = "Windows";
    else if (lower.includes("linux")) platform = "Linux";
    else return null;

    const arch = lower.includes("arm64") ? "arm64" : lower.includes("amd64") ? "amd64" : "";
    if (!arch) return null;

    let format = "binary";
    if (lower.endsWith("-setup.exe")) format = "installer";
    else if (lower.endsWith(".deb")) format = "deb";
    else if (lower.endsWith(".rpm")) format = "rpm";
    else if (lower.endsWith(".appimage")) format = "appimage";
    else if (lower.endsWith(".pkg")) format = "pkg";
    else if (lower.endsWith(".dmg")) format = "dmg";
    else if (lower.endsWith(".msi")) format = "msi";
    else if (lower.endsWith(".msix")) format = "msix";

    return { platform, arch, format };
}

export default async function Downloads() {
    const tag = await resolveTag("latest");
    if (!tag) return null;

    const assets = await listAssets(tag);
    if (assets.length === 0) return null;

    // While the release still publishes both naming conventions, the same
    // binary arrives twice and would render as two identical buttons — the
    // mixed naming, made visible. Key on what the artifact IS and keep the
    // product-named copy, so the page shows one button per real download
    // whichever spellings the release happens to carry.
    const chosen = new Map<string, { platform: PlatformName; arch: string; format: string; name: string }>();
    for (const asset of assets) {
        const info = classify(asset.name);
        if (!info) continue;
        const key = `${info.platform}/${info.arch}/${info.format}`;
        const existing = chosen.get(key);
        if (!existing || (!existing.name.startsWith("Proofboard-") && asset.name.startsWith("Proofboard-"))) {
            chosen.set(key, { ...info, name: asset.name });
        }
    }

    // platform -> arch -> entries
    const grouped = new Map<PlatformName, Map<string, Entry[]>>();
    for (const info of chosen.values()) {
        if (!grouped.has(info.platform)) grouped.set(info.platform, new Map());
        const byArch = grouped.get(info.platform)!;
        if (!byArch.has(info.arch)) byArch.set(info.arch, []);
        byArch.get(info.arch)!.push({ format: info.format, name: info.name });
    }

    const labelStyle = {
        fontFamily: "var(--font-geist-mono)",
        fontSize: 12,
        color: "#8A8A8A",
    } as const;

    return (
        <section style={{ marginTop: 48 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}
            >
                <h2
                    style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 600,
                        fontSize: 15,
                        color: "#F5F5F5",
                        margin: 0,
                    }}
                >
                    Direct downloads
                </h2>
                <span style={labelStyle}>{tag}</span>
            </div>

            {PLATFORM_ORDER.filter((p) => grouped.has(p)).map((platform) => {
                const byArch = grouped.get(platform)!;
                return (
                    <div
                        key={platform}
                        style={{
                            border: "1px solid #1C1C1C",
                            borderRadius: 10,
                            padding: "14px 16px",
                            marginBottom: 10,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "var(--font-geist)",
                                fontSize: 14,
                                color: "#F5F5F5",
                                marginBottom: 10,
                            }}
                        >
                            {platform}
                        </div>

                        {[...byArch.keys()].sort().map((arch) => (
                            <div
                                key={arch}
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 8,
                                }}
                            >
                                <span style={{ ...labelStyle, minWidth: 54 }}>{arch}</span>
                                {byArch
                                    .get(arch)!
                                    .sort((a, b) => a.format.localeCompare(b.format))
                                    .map((entry) => (
                                        <a
                                            key={entry.name}
                                            href={`/${tag}/${entry.name}`}
                                            style={{
                                                fontFamily: "var(--font-geist-mono)",
                                                fontSize: 12,
                                                color: "#C8C8C8",
                                                textDecoration: "none",
                                                border: "1px solid #232323",
                                                borderRadius: 6,
                                                padding: "5px 10px",
                                            }}
                                        >
                                            {FORMAT_LABELS[entry.format] ?? entry.format}
                                        </a>
                                    ))}
                            </div>
                        ))}
                    </div>
                );
            })}

            <p style={{ ...labelStyle, marginTop: 14 }}>
                Every artifact, including signatures and checksums:{" "}
                <a href="/manifest.json" style={{ color: "#00AA05", textDecoration: "none" }}>
                    manifest.json
                </a>
            </p>
        </section>
    );
}
