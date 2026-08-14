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
    const res = await fetch(`${GITHUB_API}/releases/latest`, {
        headers: githubHeaders(),
        next: { revalidate: 300 },
    } as RequestInit & { next: { revalidate: number } });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    return data.tag_name ?? null;
}

export function assetUrl(tag: string, filename: string): string {
    return `${GITHUB_DOWNLOAD}/${tag}/${filename}`;
}