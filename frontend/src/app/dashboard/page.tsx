"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Shield, Activity, Bell, TrendingUp, Award, LogOut,
    AlertTriangle, CheckCircle, XCircle, Wifi, Smartphone,
    Lock, Unlock, Eye, ShieldAlert, Zap, Star, Trophy, ChevronDown,
    BookOpen, Target, Radar, PieChart as PieChartIcon, Brain, Timer,
    Fingerprint, BarChart3
} from "lucide-react";
import { logsAPI, studentAPI, createWebSocket, anomaliesAPI, devicesAPI, incidentsAPI, privacyAPI } from "@/lib/api";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, Radar as RechartsRadar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, BarChart, Bar, Legend
} from "recharts";
import { AlertModal } from "./components/AlertModal";

// ──── Risk Gauge Component ────
function RiskGauge({ score, level }: { score: number; level: string }) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference * 0.75;
    const color = score <= 40 ? "#10b981" : score <= 70 ? "#f59e0b" : "#ef4444";

    return (
        <div className="flex flex-col items-center">
            <svg width="200" height="180" viewBox="0 0 200 200">
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"
                    strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                    strokeLinecap="round"
                    transform="rotate(135 100 100)"
                />
                <motion.circle
                    cx="100" cy="100" r={radius}
                    fill="none" stroke={color} strokeWidth="12"
                    strokeDasharray={`${progress} ${circumference - progress}`}
                    strokeLinecap="round"
                    transform="rotate(135 100 100)"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
                />
                <text x="100" y="95" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold">
                    {Math.round(score)}
                </text>
                <text x="100" y="120" textAnchor="middle" fill="#94a3b8" fontSize="12">
                    Risk Score
                </text>
            </svg>
            <span
                className="px-4 py-1 rounded-full text-sm font-semibold capitalize mt-1"
                style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}30`,
                }}
            >
                {level} Risk
            </span>
        </div>
    );
}

// ──── Alert Card Component ────
function AlertCard({ alert, onResolve, onBlock, onView }: { alert: any; onResolve: (id: number) => void; onBlock: (app: string) => void; onView: (alert: any) => void }) {
    const severityColors: Record<string, string> = {
        critical: "border-red-500/30 bg-red-500/5 text-red-400",
        high: "border-orange-500/30 bg-orange-500/5 text-orange-400",
        medium: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
        low: "border-green-500/30 bg-green-500/5 text-green-400",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`p-4 rounded-xl border ${severityColors[alert.severity] || severityColors.medium}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 capitalize font-medium">
                        {alert.severity}
                    </span>
                </div>
                <span className="text-xs opacity-70">
                    {new Date(alert.created_at).toLocaleTimeString()}
                </span>
            </div>
            <p className="text-sm mb-3 opacity-90">{alert.message}</p>
            {!alert.resolved && (
                <div className="flex gap-2">
                    <button onClick={() => onView(alert)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View Context
                    </button>
                    <button onClick={() => onResolve(alert.id)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        Dismiss
                    </button>
                </div>
            )}
            {alert.resolved && (
                <span className="text-xs opacity-70 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Resolved
                </span>
            )}
        </motion.div>
    );
}

const PERM_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

// ──── Main Dashboard ────
export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [riskScore, setRiskScore] = useState({ current_score: 0, risk_level: "low", last_updated: null });
    const [alerts, setAlerts] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [activeDevice, setActiveDevice] = useState<any>(null);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [wsAlerts, setWsAlerts] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    // New state for added features
    const [wellbeing, setWellbeing] = useState<any>(null);
    const [permissions, setPermissions] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [training, setTraining] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("sentinel_user");
        if (!stored) { router.push("/login"); return; }

        const u = JSON.parse(stored);
        if (u.role === "admin") { router.push("/admin"); return; }
        if (!u.consent_given) { router.push("/consent"); return; }

        setUser(u);
        loadData();
        loadExtendedData();

        // WebSocket
        const ws = createWebSocket(u.id);
        if (ws) {
            wsRef.current = ws;
            ws.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (data.type === "alert") {
                        setWsAlerts((prev) => [data, ...prev].slice(0, 5));
                        loadData();
                    }
                } catch { }
            };
            ws.onclose = () => console.log("WS disconnected");
        }

        const interval = setInterval(loadData, 15000);
        return () => {
            clearInterval(interval);
            wsRef.current?.close();
        };
    }, []);

    const loadData = async () => {
        try {
            const [scoreRes, alertsRes, logsRes, timeRes, devRes] = await Promise.all([
                logsAPI.riskScore(),
                logsAPI.alerts(),
                logsAPI.recentLogs(),
                anomaliesAPI.getTimeline().catch(() => ({ data: [] })),
                devicesAPI.getAll().catch(() => ({ data: [] }))
            ]);
            setRiskScore(scoreRes.data);
            setAlerts(alertsRes.data);
            setLogs(logsRes.data);
            setTimeline(timeRes.data);
            setDevices(devRes.data);
            if (devRes.data.length > 0 && !activeDevice) {
                setActiveDevice(devRes.data[0]);
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const loadExtendedData = async () => {
        try {
            const [wb, perm, lb, tr] = await Promise.all([
                studentAPI.wellbeing().catch(() => ({ data: null })),
                studentAPI.permissionAudit().catch(() => ({ data: null })),
                studentAPI.leaderboard().catch(() => ({ data: null })),
                studentAPI.trainingProgress().catch(() => ({ data: null })),
            ]);
            setWellbeing(wb.data);
            setPermissions(perm.data);
            setLeaderboard(lb.data);
            setTraining(tr.data);
        } catch (err) {
            console.error("Failed to load extended data", err);
        }
    };

    const handleResolve = async (id: number) => {
        try {
            await studentAPI.resolveAlert(id);
            setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
        } catch { }
    };

    const handleBlock = async (app: string) => {
        try {
            await studentAPI.blockApp(app);
        } catch { }
    };

    const handleReportIncident = async (alertId: number) => {
        try {
            await incidentsAPI.report({
                alert_id: alertId,
                report_type: "false_positive",
                description: "User reported this alert as a false positive from dashboard."
            });
            setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
        } catch (err) {
            console.error(err);
        }
    };

    const handleViewAlert = async (alert: any) => {
        try {
            const expRes = await privacyAPI.getExplanation(alert.id);
            setSelectedAlert({ ...alert, ...expRes.data });
        } catch {
            setSelectedAlert(alert);
        }
        setIsAlertModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("sentinel_token");
        localStorage.removeItem("sentinel_user");
        router.push("/login");
    };

    // Badges
    const badges = [
        { icon: Star, name: "Zero Risk Champion", desc: "Maintained low risk for 7 days", earned: riskScore.current_score <= 40 },
        { icon: Trophy, name: "Threat Survivor", desc: "Successfully resolved 5+ alerts", earned: alerts.filter((a) => a.resolved).length >= 3 },
        { icon: Shield, name: "Security Aware", desc: "Completed consent flow", earned: true },
        { icon: Zap, name: "Quick Responder", desc: "Resolved alert within 1 minute", earned: alerts.some((a) => a.resolved) },
    ];

    // Radar chart data for leaderboard
    const radarData = leaderboard ? [
        { subject: "Network", user: leaderboard.categories.network, campus: leaderboard.campus_categories.network },
        { subject: "Permissions", user: leaderboard.categories.permissions, campus: leaderboard.campus_categories.permissions },
        { subject: "Apps", user: leaderboard.categories.apps, campus: leaderboard.campus_categories.apps },
        { subject: "Behavior", user: leaderboard.categories.behavior, campus: leaderboard.campus_categories.behavior },
    ] : [];

    if (loading) {
        return (
            <div className="min-h-screen p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen border-t-2 border-sentinel-accent">
            <AlertModal
                alert={selectedAlert}
                isOpen={isAlertModalOpen}
                onClose={() => setIsAlertModalOpen(false)}
                onResolve={handleResolve}
                onReport={handleReportIncident}
            />

            {/* Header */}
            <header className="border-b border-sentinel-border px-6 py-4 bg-sentinel-card/30 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-7 h-7 text-sentinel-accent" />
                        <span className="text-lg font-bold bg-gradient-to-r from-sentinel-accent md:from-sentinel-accent md:to-sentinel-neon bg-clip-text text-transparent hidden sm:block">
                            SentinelAI
                        </span>

                        {/* Device Switcher */}
                        {devices.length > 0 && (
                            <div className="ml-2 sm:ml-6 relative group">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sentinel-card border border-sentinel-border hover:border-sentinel-text-muted transition-colors text-sm text-sentinel-text">
                                    <Smartphone className="w-4 h-4 text-sentinel-accent-light" />
                                    {activeDevice?.device_name || "Devices"}
                                    <ChevronDown className="w-3 h-3 text-sentinel-text-muted opacity-80" />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-sentinel-card border border-sentinel-border shadow-soft opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    {devices.map(d => (
                                        <button
                                            key={d.id}
                                            onClick={() => setActiveDevice(d)}
                                            className={`w-full text-left px-4 py-2 text-sm first:rounded-t-xl last:rounded-b-xl hover:bg-white/5 transition-colors flex items-center justify-between ${activeDevice?.id === d.id ? 'text-sentinel-accent bg-sentinel-accent/5' : 'text-sentinel-text'}`}
                                        >
                                            {d.device_name}
                                            {activeDevice?.id === d.id && <CheckCircle className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Utils */}
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex gap-4 mr-4">
                            <button onClick={() => router.push('/dashboard/training')} className="text-sm font-medium text-sentinel-text-muted hover:text-white transition-colors flex items-center gap-1"><BookOpen className="w-3 h-3" /> Training</button>
                            <button onClick={() => router.push('/dashboard/incidents')} className="text-sm font-medium text-sentinel-text-muted hover:text-white transition-colors">Incidents</button>
                            <button onClick={() => router.push('/dashboard/privacy')} className="text-sm font-medium text-sentinel-text-muted hover:text-white transition-colors flex items-center gap-1"><Lock className="w-3 h-3" /> Privacy</button>
                        </nav>
                        <span className="text-sm text-sentinel-text-muted hidden sm:block border-l border-sentinel-border pl-4 flex items-center gap-2">
                            <span>Welcome, <span className="text-white font-medium">{user?.name}</span></span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-sentinel-card text-sentinel-text-muted hover:text-white transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* WebSocket Alert Toast */}
            <AnimatePresence>
                {wsAlerts.map((wa, i) => (
                    <motion.div
                        key={`ws-${i}`}
                        initial={{ opacity: 0, y: -50, x: 50 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed top-4 right-4 z-50 glass-card p-4 border-l-4 border-red-500 max-w-sm"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-red-400">Real-Time Alert</span>
                        </div>
                        <p className="text-xs text-sentinel-text-muted">{wa.message}</p>
                    </motion.div>
                ))}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Top Row: Risk Score + Stats + Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Risk Score Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 flex flex-col items-center"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2 w-full">
                            <Activity className="w-4 h-4 text-sentinel-accent" /> Current Risk Score
                        </h3>
                        <RiskGauge score={riskScore.current_score} level={riskScore.risk_level} />
                        {riskScore.last_updated && (
                            <p className="text-xs text-sentinel-text-muted mt-3">
                                Updated {new Date(riskScore.last_updated).toLocaleTimeString()}
                            </p>
                        )}
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-sentinel-accent" /> Alert Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                <p className="text-2xl font-bold text-red-400">{alerts.filter((a) => !a.resolved).length}</p>
                                <p className="text-xs text-sentinel-text-muted">Unresolved</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                <p className="text-2xl font-bold text-green-400">{alerts.filter((a) => a.resolved).length}</p>
                                <p className="text-xs text-sentinel-text-muted">Resolved</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <p className="text-2xl font-bold text-blue-400">{logs.length}</p>
                                <p className="text-xs text-sentinel-text-muted">Recent Logs</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                <p className="text-2xl font-bold text-purple-400">{logs.filter((l) => l.anomaly_flag).length}</p>
                                <p className="text-xs text-sentinel-text-muted">Anomalies</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Weekly Trend */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 flex flex-col"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sentinel-accent" /> Risk Analytics Heatmap
                        </h3>
                        <div className="flex-1 w-full min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                                    <XAxis dataKey="timestamp" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ background: "#111128", border: "1px solid #1e1e3a", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} />
                                    <Area type="monotone" dataKey="risk_score" stroke="#6366f1" fill="url(#riskGrad)" strokeWidth={2} activeDot={{ r: 6, fill: "#6366f1", stroke: "#111128", strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Row 2: Permission Audit + Digital Wellbeing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Permission Audit Donut */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-sentinel-accent" /> App Permission Audit
                        </h3>
                        {permissions && permissions.breakdown.length > 0 ? (
                            <div className="flex items-center gap-6">
                                <div className="w-48 h-48 flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={permissions.breakdown}
                                                dataKey="count"
                                                nameKey="permission"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                strokeWidth={0}
                                            >
                                                {permissions.breakdown.map((_: any, i: number) => (
                                                    <Cell key={i} fill={PERM_COLORS[i % PERM_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "#111128", border: "1px solid #1e1e3a", borderRadius: 8 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {permissions.breakdown.map((p: any, i: number) => (
                                        <div key={p.permission} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ background: PERM_COLORS[i % PERM_COLORS.length] }} />
                                                <span className="text-sm text-sentinel-text capitalize">{p.permission}</span>
                                            </div>
                                            <span className="text-sm font-mono text-sentinel-text-muted">{p.percentage}%</span>
                                        </div>
                                    ))}
                                    {permissions.risky_apps.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-sentinel-border">
                                            <p className="text-xs text-red-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risky Apps</p>
                                            <div className="flex flex-wrap gap-1">
                                                {permissions.risky_apps.map((app: string) => (
                                                    <span key={app} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{app}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-sentinel-text-muted text-center py-8">No permission data yet.</p>
                        )}
                    </motion.div>

                    {/* Digital Wellbeing */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-sentinel-accent" /> Digital Wellbeing
                        </h3>
                        {wellbeing ? (
                            <div>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                                        <Timer className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                                        <p className="text-lg font-bold text-white">{wellbeing.screen_time_hours}h</p>
                                        <p className="text-xs text-sentinel-text-muted">Screen Time</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
                                        <Target className="w-5 h-5 mx-auto mb-1 text-green-400" />
                                        <p className="text-lg font-bold text-white">{wellbeing.focus_score}%</p>
                                        <p className="text-xs text-sentinel-text-muted">Focus Score</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                                        <Activity className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                                        <p className="text-lg font-bold text-white">{wellbeing.daily_sessions}</p>
                                        <p className="text-xs text-sentinel-text-muted">Sessions</p>
                                    </div>
                                </div>
                                <div className="h-[130px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={wellbeing.top_apps.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                                            <XAxis dataKey="app_name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: "#111128", border: "1px solid #1e1e3a", borderRadius: 8 }} />
                                            <Bar dataKey="usage_minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-sentinel-text-muted text-center py-8">Loading wellbeing data...</p>
                        )}
                    </motion.div>
                </div>

                {/* Row 3: Behavior Feed + Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Live Behavior Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-sentinel-accent" /> Live Behavior Feed
                        </h3>
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.slice(0, 15).map((log: any, i: number) => (
                                <motion.div
                                    key={log.id || i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex items-center justify-between p-3 rounded-lg ${log.anomaly_flag ? "bg-red-500/5 border border-red-500/10" : "bg-sentinel-card/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.anomaly_flag ? "bg-red-400 animate-pulse" : "bg-green-400"}`} />
                                        <div>
                                            <p className="text-sm font-medium text-white">{log.app_name}</p>
                                            <p className="text-xs text-sentinel-text-muted mt-0.5">
                                                {log.permission_requested !== "none" && (
                                                    <span className="text-yellow-400/90 mr-2 inline-flex items-center">
                                                        <Lock className="w-3 h-3 mr-1" /> {log.permission_requested}
                                                    </span>
                                                )}
                                                <span className="text-sentinel-text-muted inline-flex items-center">
                                                    <Wifi className="w-3 h-3 mr-1" />
                                                    {log.network_activity_level}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-sentinel-text-muted font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-sm text-sentinel-text-muted text-center py-8">
                                    No behavior logs yet. Simulator will generate data shortly.
                                </p>
                            )}
                        </div>
                    </motion.div>

                    {/* Real-Time Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-sentinel-accent" /> Security Alerts
                        </h3>
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {alerts.slice(0, 10).map((alert) => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onResolve={handleResolve}
                                        onBlock={handleBlock}
                                        onView={handleViewAlert}
                                    />
                                ))}
                            </AnimatePresence>
                            {alerts.length === 0 && (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-10 h-10 text-green-400/50 mx-auto mb-3" />
                                    <p className="text-sm text-sentinel-text-muted">No alerts. Your device is secure!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Row 4: Peer Leaderboard + Training Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Peer Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Radar className="w-4 h-4 text-sentinel-accent" /> Peer Security Comparison
                        </h3>
                        {leaderboard ? (
                            <div className="flex items-start gap-4">
                                <div className="flex-1 h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#1e1e3a" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <RechartsRadar name="You" dataKey="user" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                                            <RechartsRadar name="Campus Avg" dataKey="campus" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-32 flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sentinel-accent to-sentinel-neon flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">#{leaderboard.rank}</span>
                                    </div>
                                    <p className="text-xs text-sentinel-text-muted text-center">
                                        of {leaderboard.total_students} students
                                    </p>
                                    <div className="w-full p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                                        <p className="text-lg font-bold text-indigo-400">{leaderboard.percentile}%</p>
                                        <p className="text-xs text-sentinel-text-muted">Percentile</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-sentinel-text-muted text-center py-8">Loading leaderboard...</p>
                        )}
                    </motion.div>

                    {/* Training Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-sentinel-text-muted flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-sentinel-accent" /> Security Training
                            </h3>
                            <button
                                onClick={() => router.push('/dashboard/training')}
                                className="text-xs text-sentinel-accent hover:text-sentinel-accent-light transition-colors"
                            >
                                View All →
                            </button>
                        </div>
                        {training ? (
                            <div>
                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-sentinel-text-muted mb-1">
                                        <span>{training.completed_count}/{training.total_count} Completed</span>
                                        <span>Score: {training.overall_score}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-sentinel-card overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(training.completed_count / training.total_count) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full bg-gradient-to-r from-sentinel-accent to-sentinel-neon"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {training.modules.slice(0, 4).map((mod: any) => (
                                        <div
                                            key={mod.id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${mod.completed ? 'bg-green-500/5 border border-green-500/10' : 'bg-sentinel-card/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {mod.completed ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border-2 border-sentinel-border" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">{mod.title}</p>
                                                    <p className="text-xs text-sentinel-text-muted">{mod.duration_minutes} min • {mod.difficulty}</p>
                                                </div>
                                            </div>
                                            {mod.completed && (
                                                <span className="text-sm font-bold text-green-400">{mod.score}%</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-sentinel-text-muted text-center py-8">Loading training data...</p>
                        )}
                    </motion.div>
                </div>

                {/* Bottom Row: Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="glass-card p-6"
                >
                    <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-sentinel-accent" /> Security Badges
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {badges.map((badge, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className={`p-4 rounded-xl text-center transition-all ${badge.earned
                                    ? "bg-sentinel-accent/10 border border-sentinel-accent/20"
                                    : "bg-sentinel-card/50 border border-sentinel-border opacity-40"
                                    }`}
                            >
                                <badge.icon className={`w-8 h-8 mx-auto mb-2 ${badge.earned ? "text-sentinel-accent-light" : "text-sentinel-text-muted"}`} />
                                <p className="text-sm font-semibold text-white">{badge.name}</p>
                                <p className="text-xs text-sentinel-text-muted mt-1">{badge.desc}</p>
                                {badge.earned && (
                                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                        Earned ✓
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
