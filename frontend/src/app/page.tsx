"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Activity, Bell, Zap, Lock, Eye, BarChart3, Cpu } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sentinel-accent/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sentinel-neon-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sentinel-neon/5 rounded-full blur-3xl animate-float" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-sentinel-accent" />
                    <span className="text-xl font-bold bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                        SentinelAI
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sentinel-text-muted hover:text-white transition-colors px-4 py-2">
                        Login
                    </Link>
                    <Link href="/register" className="btn-neon text-sm !py-2 !px-6 inline-block">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-20 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sentinel-accent/10 border border-sentinel-accent/20 mb-8"
                    >
                        <Zap className="w-4 h-4 text-sentinel-neon" />
                        <span className="text-sm text-sentinel-accent-light">AI-Powered Cybersecurity for Students</span>
                    </motion.div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                        <span className="bg-gradient-to-r from-white via-sentinel-accent-light to-sentinel-neon bg-clip-text text-transparent">
                            Secure Your Digital Life
                        </span>
                        <br />
                        <span className="text-white">with AI Intelligence</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-sentinel-text-muted max-w-2xl mx-auto mb-10">
                        Real-time behavioral anomaly detection powered by machine learning.
                        Protect your smartphone from threats before they strike.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn-neon text-lg !py-4 !px-10 flex items-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Secure My Device
                            </motion.button>
                        </Link>
                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-10 py-4 rounded-xl border border-sentinel-border text-sentinel-text hover:border-sentinel-accent/50 hover:bg-sentinel-accent/5 transition-all text-lg"
                            >
                                Try Demo
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24"
                >
                    {[
                        { icon: Eye, title: "Behavioral Analysis", desc: "AI monitors app usage patterns and detects suspicious behavior in real-time" },
                        { icon: Activity, title: "Risk Scoring", desc: "Dynamic 0-100 risk score calculated using Isolation Forest ML model" },
                        { icon: Bell, title: "Instant Alerts", desc: "WebSocket-powered real-time notifications when threats are detected" },
                        { icon: BarChart3, title: "Deep Insights", desc: "Weekly trends, risk analytics, and actionable security recommendations" },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + i * 0.15 }}
                            whileHover={{ y: -5 }}
                            className="glass-card p-6"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sentinel-accent/20 to-sentinel-neon-purple/20 flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-sentinel-accent-light" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-sentinel-text-muted leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Architecture highlight */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-24 glass-card p-8 lg:p-12"
                >
                    <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
                        <span className="bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                            Enterprise-Grade Architecture
                        </span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: Cpu, label: "FastAPI Backend", sub: "Async + WebSocket" },
                            { icon: Shield, label: "JWT Security", sub: "bcrypt + RBAC" },
                            { icon: Activity, label: "ML Engine", sub: "Isolation Forest" },
                            { icon: Zap, label: "Real-Time", sub: "< 1s Latency" },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <item.icon className="w-8 h-8 text-sentinel-neon" />
                                <span className="font-semibold text-white">{item.label}</span>
                                <span className="text-xs text-sentinel-text-muted">{item.sub}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-sentinel-border py-8 px-6 text-center">
                <p className="text-sm text-sentinel-text-muted">
                    © 2026 SentinelAI — AI-Based Cybersecurity Platform. Built for hackathons.
                </p>
            </footer>
        </div>
    );
}
