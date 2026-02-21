"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { incidentsAPI } from "@/lib/api";
import { motion } from "framer-motion";

export default function IncidentsPage() {
    const router = useRouter();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("sentinel_user");
        if (!stored) { router.push("/login"); return; }

        loadIncidents();
    }, [router]);

    const loadIncidents = async () => {
        try {
            const res = await incidentsAPI.getAll();
            setIncidents(res.data);
        } catch (err) {
            console.error("Failed to load incidents", err);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === "open") return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Under Review</span>;
        if (status === "resolved") return <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Resolved</span>;
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Rejected</span>;
    };

    return (
        <div className="min-h-screen border-t-2 border-sentinel-accent">
            <header className="border-b border-sentinel-border px-6 py-4 bg-sentinel-card/30 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-sentinel-card text-sentinel-text-muted hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Shield className="w-6 h-6 text-sentinel-accent" />
                    <h1 className="text-xl font-bold text-white">Incident Tracker</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Reported False Positives</h2>
                    <p className="text-sentinel-text-muted">Track the status of alerts you have reported as incorrect.</p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="glass-card p-12 text-center flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-green-500/50 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No reported incidents</h3>
                        <p className="text-sentinel-text-muted">You haven't reported any false positive alerts yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {incidents.map((incident, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={incident.id}
                                className="glass-card p-5"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-sentinel-accent" />
                                                <span className="font-semibold text-white">Incident #{incident.id}</span>
                                            </div>
                                            <StatusBadge status={incident.status} />
                                        </div>
                                        <p className="text-sm text-sentinel-text">{incident.description || "Reported as False Positive from Dashboard."}</p>
                                        <div className="flex items-center gap-4 text-xs text-sentinel-text-muted">
                                            <span>Reported: {new Date(incident.created_at).toLocaleString()}</span>
                                            {incident.resolution_notes && (
                                                <span className="text-sentinel-accent-light px-2 py-0.5 rounded bg-sentinel-accent/10">
                                                    Note: {incident.resolution_notes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
