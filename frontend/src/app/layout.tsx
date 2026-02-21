import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "SentinelAI — AI Cybersecurity Platform",
    description: "AI-Based Real-Time Behavioral Cybersecurity Platform for Students. Detect smartphone behavioral anomalies and get real-time security alerts.",
    keywords: ["cybersecurity", "AI", "behavioral analysis", "security", "students"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="bg-sentinel-bg text-sentinel-text min-h-screen bg-grid">
                {children}
            </body>
        </html>
    );
}
