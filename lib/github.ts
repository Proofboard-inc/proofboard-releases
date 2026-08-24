const OWNER = "Proofboard-inc";
const REPO = "proofboard-cli";
const GITHUB_API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const GITHUB_DOWNLOAD = `https://github.com/${OWNER}/${REPO}/releases/download`;

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

export function assetUrl(tag: string, filename: string): string {
    return `${GITHUB_DOWNLOAD}/${tag}/${filename}`;
}