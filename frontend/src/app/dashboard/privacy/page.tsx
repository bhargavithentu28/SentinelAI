"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Lock, Database, Eye, CheckCircle, ShieldAlert } from "lucide-react";
import { privacyAPI } from "@/lib/api";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    const router = useRouter();
    const [accessLogs, setAccessLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("sentinel_user");
        if (!stored) { router.push("/login"); return; }

        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            const res = await privacyAPI.getLogs();
            setAccessLogs(res.data);
        } catch (err) {
            console.error("Failed to load privacy logs", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen border-t-2 border-sentinel-accent">
            <header className="border-b border-sentinel-border px-6 py-4 bg-sentinel-card/30 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-sentinel-card text-sentinel-text-muted hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Lock className="w-6 h-6 text-sentinel-accent" />
                    <h1 className="text-xl font-bold text-white">Privacy & Transparency</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Data Transparency Center</h2>
                    <p className="text-sentinel-text-muted">See exactly who or what has accessed your behavioral data.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-sentinel-accent/10">
                            <Database className="w-6 h-6 text-sentinel-accent" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Data Storage</h3>
                            <p className="text-sm text-sentinel-text-muted mt-1">Data is encrypted at rest and in transit. Only retained for 30 days.</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-green-500/10">
                            <Eye className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">AI Analysis</h3>
                            <p className="text-sm text-sentinel-text-muted mt-1">AI models operate on anonymized data features, not raw content.</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10">
                            <ShieldAlert className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Campus IT Access</h3>
                            <p className="text-sm text-sentinel-text-muted mt-1">University IT only receives alerts for Medium or High severity anomalies.</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-sentinel-border bg-sentinel-card/30">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-sentinel-accent" /> Data Access Audit Log
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
                        </div>
                    ) : accessLogs.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <CheckCircle className="w-12 h-12 text-sentinel-text-muted mb-4 opacity-30" />
                            <h3 className="text-lg font-medium text-white mb-2">No auditable access yet</h3>
                            <p className="text-sentinel-text-muted">Your data has not been queried by external systems.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-sentinel-card/50 text-sentinel-text-muted border-b border-sentinel-border">
                                    <tr>
                                        <th className="p-4 font-medium">Timestamp</th>
                                        <th className="p-4 font-medium">Accessed By</th>
                                        <th className="p-4 font-medium">Reason</th>
                                        <th className="p-4 font-medium">Data Scope</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accessLogs.map((log, i) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-sentinel-border/50 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="p-4 text-sentinel-text whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-xs">
                                                    {log.accessed_by}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sentinel-text">{log.reason}</td>
                                            <td className="p-4">
                                                <span className="text-xs text-sentinel-accent-light bg-sentinel-accent/10 px-2 py-1 rounded-full border border-sentinel-accent/20">
                                                    {log.data_accessed}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <button className="text-xs text-sentinel-text-muted hover:text-red-400 transition-colors underline decoration-dotted underline-offset-4">
                        Request Complete Data Deletion
                    </button>
                </div>
            </main>
        </div>
    );
}
