import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                sentinel: {
                    bg: "#0a0a1a",
                    card: "#111128",
                    border: "#1e1e3a",
                    accent: "#6366f1",
                    "accent-light": "#818cf8",
                    neon: "#22d3ee",
                    "neon-purple": "#a855f7",
                    success: "#10b981",
                    warning: "#f59e0b",
                    danger: "#ef4444",
                    text: "#e2e8f0",
                    "text-muted": "#94a3b8",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "sentinel-gradient": "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)",
                "card-gradient": "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)",
            },
            boxShadow: {
                neon: "0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)",
                "neon-lg": "0 0 30px rgba(99,102,241,0.4), 0 0 90px rgba(99,102,241,0.15)",
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "float": "float 6s ease-in-out infinite",
                "glow": "glow 2s ease-in-out infinite alternate",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                glow: {
                    "0%": { boxShadow: "0 0 5px rgba(99,102,241,0.2)" },
                    "100%": { boxShadow: "0 0 20px rgba(99,102,241,0.6)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
