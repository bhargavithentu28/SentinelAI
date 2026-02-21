"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authAPI } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await authAPI.login({ email, password });
            const { access_token, user } = res.data;

            localStorage.setItem("sentinel_token", access_token);
            localStorage.setItem("sentinel_user", JSON.stringify(user));

            if (user.role === "admin") {
                router.push("/admin");
            } else if (!user.consent_given) {
                router.push("/consent");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-sentinel-accent/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-sentinel-neon-purple/8 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Shield className="w-8 h-8 text-sentinel-accent" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                        SentinelAI
                    </span>
                </div>

                <h2 className="text-xl font-semibold text-center text-white mb-2">Welcome Back</h2>
                <p className="text-sm text-sentinel-text-muted text-center mb-8">Sign in to your security dashboard</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4"
                    >
                        <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field !pl-10"
                                placeholder="you@university.edu"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field !pl-10 !pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sentinel-text-muted hover:text-white"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded border-sentinel-border bg-sentinel-card accent-sentinel-accent"
                            />
                            <span className="text-sm text-sentinel-text-muted">Remember me</span>
                        </label>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="btn-neon w-full !py-3 text-center disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </motion.button>
                </form>

                <p className="text-sm text-center text-sentinel-text-muted mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-sentinel-accent hover:text-sentinel-accent-light transition-colors">
                        Create one
                    </Link>
                </p>

                {/* Demo credentials */}
                <div className="mt-6 pt-6 border-t border-sentinel-border">
                    <p className="text-xs text-sentinel-text-muted text-center mb-2">Demo Credentials</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                            onClick={() => { setEmail("admin@sentinelai.com"); setPassword("admin123"); }}
                            className="p-2 rounded-lg bg-sentinel-accent/10 text-sentinel-accent-light hover:bg-sentinel-accent/20 transition-colors"
                        >
                            Admin Login
                        </button>
                        <button
                            onClick={() => { setEmail("student1@university.edu"); setPassword("student123"); }}
                            className="p-2 rounded-lg bg-sentinel-neon/10 text-sentinel-neon hover:bg-sentinel-neon/20 transition-colors"
                        >
                            Student Login
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
