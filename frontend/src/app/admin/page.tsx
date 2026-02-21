"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Shield, Users, AlertTriangle, BarChart3, Download,
    TrendingUp, LogOut, ShieldAlert, Activity, FileDown,
    Search, Filter, Eye, Zap, Building2, ChevronRight,
    ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart,
    ComposedChart
} from "recharts";

const RISK_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981"];
const SEVERITY_STYLES: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [highRisk, setHighRisk] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New state
    const [activityFeed, setActivityFeed] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [colleges, setColleges] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        const stored = localStorage.getItem("sentinel_user");
        if (!stored) { router.push("/login"); return; }
        const u = JSON.parse(stored);
        if (u.role !== "admin") { router.push("/dashboard"); return; }
        setUser(u);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, hrRes, feedRes, trendsRes, collegeRes, usersRes] = await Promise.all([
                adminAPI.stats(),
                adminAPI.highRiskUsers(),
                adminAPI.activityFeed().catch(() => ({ data: [] })),
                adminAPI.trends().catch(() => ({ data: [] })),
                adminAPI.collegeBreakdown().catch(() => ({ data: [] })),
                adminAPI.allUsers().catch(() => ({ data: [] })),
            ]);
            setStats(statsRes.data);
            setHighRisk(hrRes.data);
            setActivityFeed(feedRes.data);
            setTrends(trendsRes.data);
            setColleges(collegeRes.data);
            setAllUsers(usersRes.data);
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await adminAPI.exportReport();
            const blob = new Blob([res.data], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "sentinel_report.csv"; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("sentinel_token");
        localStorage.removeItem("sentinel_user");
        router.push("/login");
    };

    const handleSearchUsers = async () => {
        try {
            const res = await adminAPI.allUsers(searchQuery, roleFilter);
            setAllUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(handleSearchUsers, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, roleFilter]);

    const riskPieData = stats ? [
        { name: "High", value: stats.high_risk_count },
        { name: "Medium", value: stats.medium_risk_count },
        { name: "Low", value: stats.low_risk_count },
    ] : [];

    if (loading) {
        return (
            <div className="min-h-screen p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen border-t-2 border-sentinel-accent">
            {/* Header */}
            <header className="border-b border-sentinel-border px-6 py-4 bg-sentinel-card/30 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-7 h-7 text-sentinel-accent" />
                        <span className="text-lg font-bold bg-gradient-to-r from-sentinel-accent to-sentinel-neon bg-clip-text text-transparent">
                            SentinelAI Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="btn-neon !py-2 !px-4 text-sm flex items-center gap-2">
                            <FileDown className="w-4 h-4" /> Export CSV
                        </button>
                        <span className="text-sm text-sentinel-text-muted hidden sm:block">
                            {user?.name}
                        </span>
                        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-sentinel-card text-sentinel-text-muted hover:text-white transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Users", value: stats?.total_users, icon: Users, color: "blue" },
                        { label: "High Risk", value: stats?.high_risk_count, icon: AlertTriangle, color: "red" },
                        { label: "Total Alerts", value: stats?.total_alerts, icon: ShieldAlert, color: "purple" },
                        { label: "Unresolved", value: stats?.unresolved_alerts, icon: Zap, color: "orange" },
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-5"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-${card.color}-500/10 text-${card.color}-400`}>
                                    {card.color === "red" ? "!" : "•"}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-white">{card.value ?? 0}</p>
                            <p className="text-xs text-sentinel-text-muted mt-1">{card.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Row 2: Risk Pie + Trend Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Risk Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-sentinel-accent" /> Risk Distribution
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                                        {riskPieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "#111128", border: "1px solid #1e1e3a", borderRadius: 8 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* 14-Day Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card p-6 lg:col-span-2"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sentinel-accent" /> 14-Day Trend Analysis
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#111128", border: "1px solid #1e1e3a", borderRadius: 8 }} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="avg_risk_score" stroke="#6366f1" strokeWidth={2} name="Avg Risk" dot={false} />
                                    <Bar yAxisId="right" dataKey="alert_count" fill="#ef444440" name="Alerts" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="anomaly_count" fill="#f59e0b40" name="Anomalies" radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Row 3: College Breakdown + Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* College Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-sentinel-accent" /> College Breakdown
                        </h3>
                        {colleges.length > 0 ? (
                            <div className="space-y-3">
                                {colleges.map((c: any, i: number) => (
                                    <div key={i} className="p-3 rounded-xl bg-sentinel-card/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-white">{c.college}</span>
                                            <span className="text-xs text-sentinel-text-muted">{c.total_students} students</span>
                                        </div>
                                        <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-sentinel-bg">
                                            {c.high_risk > 0 && (
                                                <div
                                                    className="h-full bg-red-500 rounded-l-full"
                                                    style={{ width: `${(c.high_risk / c.total_students) * 100}%` }}
                                                />
                                            )}
                                            {c.medium_risk > 0 && (
                                                <div
                                                    className="h-full bg-yellow-500"
                                                    style={{ width: `${(c.medium_risk / c.total_students) * 100}%` }}
                                                />
                                            )}
                                            {c.low_risk > 0 && (
                                                <div
                                                    className="h-full bg-green-500 rounded-r-full"
                                                    style={{ width: `${(c.low_risk / c.total_students) * 100}%` }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-sentinel-text-muted">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {c.high_risk} High</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> {c.medium_risk} Med</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> {c.low_risk} Low</span>
                                            <span className="ml-auto font-mono">Avg: {c.avg_score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-sentinel-text-muted text-center py-8">No college data available.</p>
                        )}
                    </motion.div>

                    {/* Live Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sentinel-accent" /> Live Threat Feed
                        </h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                            {activityFeed.slice(0, 20).map((item: any, i: number) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-sentinel-card/50 hover:bg-sentinel-card/80 transition-colors"
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.severity === 'critical' ? 'bg-red-400 animate-pulse' : item.severity === 'high' ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-white truncate">{item.student_name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${SEVERITY_STYLES[item.severity] || ''}`}>
                                                {item.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-sentinel-text-muted truncate">{item.message}</p>
                                        <p className="text-xs text-sentinel-text-muted/60 mt-1">
                                            {new Date(item.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            {activityFeed.length === 0 && (
                                <p className="text-sm text-sentinel-text-muted text-center py-8">No recent activity.</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Row 4: High Risk Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                >
                    <h3 className="text-sm font-medium text-sentinel-text-muted mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> High Risk Students
                    </h3>
                    {highRisk.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-sentinel-border text-left">
                                        <th className="pb-3 text-sentinel-text-muted font-medium">Student</th>
                                        <th className="pb-3 text-sentinel-text-muted font-medium">College</th>
                                        <th className="pb-3 text-sentinel-text-muted font-medium">Risk Score</th>
                                        <th className="pb-3 text-sentinel-text-muted font-medium">Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {highRisk.map((u: any) => (
                                        <tr key={u.id} className="border-b border-sentinel-border/50 hover:bg-white/2">
                                            <td className="py-3">
                                                <p className="font-medium text-white">{u.name}</p>
                                                <p className="text-xs text-sentinel-text-muted">{u.email}</p>
                                            </td>
                                            <td className="py-3 text-sentinel-text">{u.college}</td>
                                            <td className="py-3">
                                                <span className="font-mono font-bold text-red-400">{u.current_score}</span>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 capitalize">
                                                    {u.risk_level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-sentinel-text-muted text-center py-6">No high-risk students found.</p>
                    )}
                </motion.div>

                {/* Row 5: User Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h3 className="text-sm font-medium text-sentinel-text-muted flex items-center gap-2">
                            <Users className="w-4 h-4 text-sentinel-accent" /> User Management
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-lg bg-sentinel-card border border-sentinel-border text-sm text-white placeholder-sentinel-text-muted focus:border-sentinel-accent outline-none w-56"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-sentinel-card border border-sentinel-border text-sm text-white outline-none focus:border-sentinel-accent"
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sentinel-border text-left">
                                    <th className="pb-3 text-sentinel-text-muted font-medium">User</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">College</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">Role</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">Risk</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">Alerts</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">Consent</th>
                                    <th className="pb-3 text-sentinel-text-muted font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map((u: any) => (
                                    <tr key={u.id} className="border-b border-sentinel-border/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3">
                                            <p className="font-medium text-white">{u.name}</p>
                                            <p className="text-xs text-sentinel-text-muted">{u.email}</p>
                                        </td>
                                        <td className="py-3 text-sentinel-text">{u.college}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {u.risk_score !== null ? (
                                                <span className={`font-mono font-bold ${(u.risk_score || 0) > 70 ? 'text-red-400' : (u.risk_score || 0) > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                    {u.risk_score}
                                                </span>
                                            ) : (
                                                <span className="text-sentinel-text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-sentinel-text font-mono">{u.alert_count}</td>
                                        <td className="py-3">
                                            {u.consent_given ? (
                                                <span className="text-green-400 text-xs">✓ Yes</span>
                                            ) : (
                                                <span className="text-red-400 text-xs">✗ No</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-xs text-sentinel-text-muted">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {allUsers.length === 0 && (
                        <p className="text-sm text-sentinel-text-muted text-center py-6">No users found.</p>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
