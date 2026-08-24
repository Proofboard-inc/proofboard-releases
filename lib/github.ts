const OWNER = "Proofboard-inc";
const REPO = "proofboard-cli";
const GITHUB_API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const GITHUB_DOWNLOAD = `https://github.com/${OWNER}/${REPO}/releases/download`;

export type ReleaseAsset = {
    name: string;
    size: number;
    downloadUrl: string;
};

function githubHeaders(): HeadersInit {
    const headers: HeadersInit = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
}

export async function resolveTag(version: string): Promise<string | null> {
    if (version !== "latest") return version;
    // "latest" must always reflect the real latest GitHub release the moment
    // it's published — this backs the public install one-liner. A cached
    // fetch here (previously `next: { revalidate: 300 }`) was observed
    // serving a release that was 15+ minutes stale, well past its own
    // revalidate window, because Vercel's Data Cache for this fetch persists
    // across deployments and isn't reliably busted by a redeploy alone.
    // Always hit GitHub fresh instead — this endpoint is only called once
    // per CLI install, not at a volume that needs response caching, and a
    // GITHUB_TOKEN (5,000 req/hr) is configured specifically to afford that.
    const res = await fetch(`${GITHUB_API}/releases/latest`, {
        headers: githubHeaders(),
        cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    return data.tag_name ?? null;
}

export async function listAssets(tag: string): Promise<ReleaseAsset[]> {
    const res = await fetch(`${GITHUB_API}/releases/tags/${encodeURIComponent(tag)}`, {
        headers: githubHeaders(),
        cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
        assets?: { name: string; size: number }[];
    };
    return (data.assets ?? []).map((a) => ({
        name: a.name,
        size: a.size,
        downloadUrl: assetUrl(tag, a.name),
    }));
}

// The release has carried two naming conventions for the same binaries:
// the product name "Proofboard-Career-Agent-<os>-<arch>" and the older
// lowercase "proofboard-<os>-<arch>". Publishing both meant every release
// listed each binary twice, so the release now carries the product name
// only — but install scripts already out in the wild, and anything a user
// has bookmarked or scripted against, still ask for the lowercase one.
//
// Translating here is what makes dropping the duplicates safe: an old name
// keeps resolving for as long as anyone is still asking for it, without the
// release itself having to carry a second copy of every artifact forever.
const LEGACY_PREFIX = "proofboard-";
const PRODUCT_PREFIX = "Proofboard-Career-Agent-";

export function aliasesFor(name: string): string[] {
    if (name.startsWith(PRODUCT_PREFIX)) {
        return [LEGACY_PREFIX + name.slice(PRODUCT_PREFIX.length)];
    }
    if (name.startsWith(LEGACY_PREFIX)) {
        return [PRODUCT_PREFIX + name.slice(LEGACY_PREFIX.length)];
    }
    return [];
}

// Returns the name that actually exists on the release, or null when neither
// the requested name nor any alias of it is published.
export async function resolveAssetName(
    tag: string,
    requested: string
): Promise<string | null> {
    const assets = await listAssets(tag);
    if (assets.length === 0) {
        // The asset list is unavailable (rate limit, transient GitHub error).
        // Fall through to the requested name rather than turning a working
        // download into a 404 — GitHub itself will 404 if it truly is wrong.
        return requested;
    }
    const names = new Set(assets.map((a) => a.name));
    if (names.has(requested)) return requested;
    for (const alias of aliasesFor(requested)) {
        if (names.has(alias)) return alias;
    }
    return null;
}

export function assetUrl(tag: string, filename: string): string {
    return `${GITHUB_DOWNLOAD}/${tag}/${filename}`;
}
