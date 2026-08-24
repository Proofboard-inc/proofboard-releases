"use client";

import { useEffect, useRef, useState } from "react";

type OS = "macos" | "linux" | "windows";

const SEQUENCES: Record<OS, { command: string; lines: string[] }> = {
    macos: {
        command: "curl -fsSL https://releases.proofboard.io/install.sh | sh",
        lines: [
            "Downloading Proofboard CLI (darwin/amd64)...",
            "Verifying checksum...",
            "Proofboard-Career-Agent-darwin-amd64: OK",
            "✔ Proofboard CLI installed. Run: proofboard auth",
        ],
    },
    linux: {
        command: "curl -fsSL https://releases.proofboard.io/install.sh | sh",
        lines: [
            "Downloading Proofboard CLI (linux/amd64)...",
            "Verifying checksum...",
            "Proofboard-Career-Agent-linux-amd64: OK",
            "✔ Proofboard CLI installed. Run: proofboard auth",
        ],
    },
    windows: {
        command: "irm https://releases.proofboard.io/install.ps1 | iex",
        lines: [
            "Downloading Proofboard CLI (windows/amd64)...",
            "Verifying checksum...",
            "Proofboard-Career-Agent-windows-amd64.exe: OK",
            "Proofboard CLI installed. Run: proofboard auth",
        ],
    },
};

const TABS: { id: OS; label: string }[] = [
    { id: "macos", label: "macOS" },
    { id: "linux", label: "Linux" },
    { id: "windows", label: "Windows" },
];

export default function InstallTerminal() {
    const [os, setOs] = useState<OS>("macos");
    const [visibleLines, setVisibleLines] = useState(0);
    const [copied, setCopied] = useState(false);
    const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const detected = navigator.userAgent.toLowerCase();
        if (detected.includes("win")) setOs("windows");
        else if (detected.includes("linux") && !detected.includes("android"))
            setOs("linux");
    }, []);

    useEffect(() => {
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];
        setVisibleLines(0);

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const total = SEQUENCES[os].lines.length;

        if (prefersReducedMotion) {
            setVisibleLines(total);
            return;
        }

        for (let i = 1; i <= total; i++) {
            const t = setTimeout(() => setVisibleLines(i), 260 * i + 400);
            timeouts.current.push(t);
        }

        return () => timeouts.current.forEach(clearTimeout);
    }, [os]);

    const copy = () => {
        navigator.clipboard.writeText(SEQUENCES[os].command);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    return (
        <div>
            <div
                role="tablist"
                aria-label="Operating system"
                style={{
                    display: "inline-flex",
                    gap: 4,
                    padding: 4,
                    background: "#141414",
                    border: "1px solid #232323",
                    borderRadius: 10,
                    marginBottom: 16,
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={os === tab.id}
                        onClick={() => setOs(tab.id)}
                        style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 13,
                            padding: "6px 14px",
                            borderRadius: 7,
                            border: "none",
                            cursor: "pointer",
                            background: os === tab.id ? "#00AA05" : "transparent",
                            color: os === tab.id ? "#0A0A0A" : "#8A8A8A",
                            fontWeight: os === tab.id ? 600 : 500,
                            transition: "background 120ms ease, color 120ms ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                style={{
                    background: "#111111",
                    border: "1px solid #232323",
                    borderRadius: 12,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        borderBottom: "1px solid #232323",
                    }}
                >
                    <span style={dot("#FF5F56")} />
                    <span style={dot("#FFBD2E")} />
                    <span style={dot("#27C93F")} />
                    <span
                        style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 12,
                            color: "#5A5A5A",
                            marginLeft: 6,
                        }}
                    >
                        terminal
                    </span>
                </div>

                <div style={{ padding: "18px 20px 22px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        <code
                            style={{
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 14,
                                color: "#00D009",
                                overflowWrap: "anywhere",
                            }}
                        >
                            <span style={{ color: "#5A5A5A" }}>
                                {os === "windows" ? "> " : "$ "}
                            </span>
                            {SEQUENCES[os].command}
                        </code>
                        <button
                            onClick={copy}
                            aria-label="Copy install command"
                            style={{
                                flexShrink: 0,
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 12,
                                color: "#8A8A8A",
                                background: "#1B1B1B",
                                border: "1px solid #2A2A2A",
                                borderRadius: 6,
                                padding: "5px 10px",
                                cursor: "pointer",
                            }}
                        >
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <div style={{ marginTop: 14 }}>
                        {SEQUENCES[os].lines.map((line, i) => (
                            <div
                                key={line}
                                style={{
                                    fontFamily: "var(--font-geist-mono)",
                                    fontSize: 13,
                                    lineHeight: 1.9,
                                    color: line.startsWith("✔") ? "#00D009" : "#8A8A8A",
                                    opacity: i < visibleLines ? 1 : 0,
                                    transition: "opacity 180ms ease",
                                }}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p
                style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                    color: "#5A5A5A",
                    marginTop: 12,
                }}
            >
                Already have Node.js? <code style={{ color: "#8A8A8A" }}>npx proofboard-cli sync</code> also
                works.
            </p>
        </div>
    );
}

function dot(color: string): React.CSSProperties {
    return {
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
    };
}