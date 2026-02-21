"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Check, X, Eye, EyeOff, ShieldCheck, ShieldOff } from "lucide-react";
import { authAPI } from "@/lib/api";

export default function ConsentPage() {
    const router = useRouter();
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [enableMonitoring, setEnableMonitoring] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const willMonitor = [
        { icon: Eye, text: "App usage behavior" },
        { icon: Shield, text: "Permission request patterns" },
        { icon: Shield, text: "Network behavior anomalies" },
        { icon: Shield, text: "Background suspicious processes" },
        { icon: Shield, text: "Rapid OTP access attempts (behavior-based only)" },
    ];

    const wontAccess = [
        { icon: X, text: "Private messages" },
        { icon: X, text: "Gallery / photos" },
        { icon: X, text: "Personal files" },
        { icon: X, text: "Microphone recordings" },
        { icon: X, text: "Call recordings" },
    ];

    const handleConsent = async () => {
        if (!acceptTerms || !enableMonitoring) return;
        setLoading(true);
        setError("");

        try {
            const res = await authAPI.consent({ accept_terms: true, enable_monitoring: true });
            // Update stored user
            const stored = localStorage.getItem("sentinel_user");
            if (stored) {
                const user = JSON.parse(stored);
                user.consent_given = true;
                localStorage.setItem("sentinel_user", JSON.stringify(user));
            }
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to save consent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-2xl p-8"
            >
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Shield className="w-8 h-8 text-sentinel-accent" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                        Device Monitoring Consent
                    </span>
                </div>

                <p className="text-sentinel-text-muted text-center mb-8">
                    SentinelAI requires your consent to monitor behavioral patterns on your device.
                    Please review what we will and will not access.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Will Monitor */}
                    <div className="p-5 rounded-xl bg-sentinel-success/5 border border-sentinel-success/20">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-sentinel-success" />
                            <h3 className="font-semibold text-sentinel-success">SentinelAI WILL monitor</h3>
                        </div>
                        <ul className="space-y-3">
                            {willMonitor.map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-sm text-sentinel-text"
                                >
                                    <Check className="w-4 h-4 text-sentinel-success flex-shrink-0" />
                                    {item.text}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Won't Access */}
                    <div className="p-5 rounded-xl bg-sentinel-danger/5 border border-sentinel-danger/20">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldOff className="w-5 h-5 text-sentinel-danger" />
                            <h3 className="font-semibold text-sentinel-danger">SentinelAI WILL NOT access</h3>
                        </div>
                        <ul className="space-y-3">
                            {wontAccess.map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-sm text-sentinel-text"
                                >
                                    <X className="w-4 h-4 text-sentinel-danger flex-shrink-0" />
                                    {item.text}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-4 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-sentinel-border bg-sentinel-card accent-sentinel-accent"
                        />
                        <span className="text-sm text-sentinel-text-muted group-hover:text-sentinel-text transition-colors">
                            I accept the terms and conditions. I understand SentinelAI will analyze my device&apos;s behavioral patterns for security purposes.
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={enableMonitoring}
                            onChange={(e) => setEnableMonitoring(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-sentinel-border bg-sentinel-card accent-sentinel-accent"
                        />
                        <span className="text-sm text-sentinel-text-muted group-hover:text-sentinel-text transition-colors">
                            I enable behavioral monitoring on my device. I can revoke this at any time from settings.
                        </span>
                    </label>
                </div>

                <motion.button
                    whileHover={acceptTerms && enableMonitoring ? { scale: 1.02 } : {}}
                    whileTap={acceptTerms && enableMonitoring ? { scale: 0.98 } : {}}
                    onClick={handleConsent}
                    disabled={!acceptTerms || !enableMonitoring || loading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${acceptTerms && enableMonitoring
                            ? "btn-neon"
                            : "bg-sentinel-border text-sentinel-text-muted cursor-not-allowed"
                        }`}
                >
                    {loading ? "Saving..." : "Accept & Continue to Dashboard"}
                </motion.button>
            </motion.div>
        </div>
    );
}
