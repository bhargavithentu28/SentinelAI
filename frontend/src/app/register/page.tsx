"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, User, Mail, Lock, GraduationCap, Eye, EyeOff } from "lucide-react";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", college: "", password: "", role: "student" });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authAPI.register(form);
            router.push("/login");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-sentinel-accent/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sentinel-neon-purple/8 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Shield className="w-8 h-8 text-sentinel-accent" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                        SentinelAI
                    </span>
                </div>

                <h2 className="text-xl font-semibold text-center text-white mb-2">Create Account</h2>
                <p className="text-sm text-sentinel-text-muted text-center mb-6">Join the AI security platform</p>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-1.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field !pl-10" placeholder="John Doe" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field !pl-10" placeholder="you@university.edu" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-1.5">College / Institution</label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input type="text" value={form.college} onChange={(e) => update("college", e.target.value)} className="input-field !pl-10" placeholder="MIT, Stanford..." required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                            <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field !pl-10 !pr-10" placeholder="Min 6 characters" required minLength={6} />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sentinel-text-muted hover:text-white">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sentinel-text-muted mb-1.5">Role</label>
                        <div className="grid grid-cols-3 gap-3">
                            {["student", "parent", "admin"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => update("role", role)}
                                    className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${form.role === role
                                        ? "border-sentinel-accent bg-sentinel-accent/10 text-sentinel-accent-light"
                                        : "border-sentinel-border text-sentinel-text-muted hover:border-sentinel-accent/30"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-neon w-full !py-3 text-center disabled:opacity-50 mt-2">
                        {loading ? "Creating Account..." : "Create Account"}
                    </motion.button>
                </form>

                <p className="text-sm text-center text-sentinel-text-muted mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-sentinel-accent hover:text-sentinel-accent-light transition-colors">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
