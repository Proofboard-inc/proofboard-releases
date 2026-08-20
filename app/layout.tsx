import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proofboard CLI — Release Infrastructure",
  description:
    "Install the Proofboard Career Agent. Nothing leaves your machine except cryptographic proof.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body
        style={{
          margin: 0,
          background: "#0A0A0A",
          color: "#F5F5F5",
          fontFamily: "var(--font-geist)",
        }}
      >
        {children}
      </body>
    </html>
  );
}