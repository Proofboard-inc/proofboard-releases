import InstallTerminal from "@/components/InstallTerminal";
import Downloads from "@/components/Downloads";

export default function Home() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "18vh 24px 64px",
            }}
        >
            <div style={{ width: "100%", maxWidth: 640 }}>
                <p
                    style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        color: "#00AA05",
                        textTransform: "uppercase",
                        marginBottom: 18,
                    }}
                >
                    Proofboard · Release Infrastructure
                </p>

                <h1
                    style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 700,
                        fontSize: "clamp(32px, 5vw, 44px)",
                        lineHeight: 1.15,
                        margin: "0 0 12px",
                        color: "#F5F5F5",
                    }}
                >
                    Install the Career Agent.
                </h1>

                <p
                    style={{
                        fontFamily: "var(--font-geist)",
                        fontSize: 16,
                        lineHeight: 1.6,
                        color: "#A3A3A3",
                        margin: "0 0 32px",
                        maxWidth: 520,
                    }}
                >
                    One command, every OS. The binary reads your local commit history —
                    nothing but cryptographic proof ever leaves your machine.
                </p>

                <InstallTerminal />

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 28,
                    }}
                >
                    {["SHA256 verified", "MIT licensed", "Open source"].map((chip) => (
                        <span
                            key={chip}
                            style={{
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 12,
                                color: "#8A8A8A",
                                border: "1px solid #232323",
                                borderRadius: 999,
                                padding: "5px 12px",
                            }}
                        >
                            {chip}
                        </span>
                    ))}
                </div>

                <Downloads />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 56,
                        paddingTop: 20,
                        borderTop: "1px solid #1C1C1C",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 12,
                        color: "#5A5A5A",
                    }}
                >
                    <a
                        href="https://github.com/Proofboard-inc/proofboard-cli"
                        style={{ color: "#5A5A5A", textDecoration: "none" }}
                    >
                        github.com/Proofboard-inc/proofboard-cli
                    </a>

                    <a href="https://proofboard.io"
                        style={{ color: "#5A5A5A", textDecoration: "none" }}
                    >
                        proofboard.io →
                    </a>
                </div>
            </div>
        </main>
    );
}