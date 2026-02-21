import axios from "axios";

// API calls use relative paths so they go through Next.js rewrites (avoids CORS)
const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});

// Direct backend URL — only used for WebSocket connections
const WS_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("sentinel_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("sentinel_token");
            localStorage.removeItem("sentinel_user");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// ──── Auth ────
export const authAPI = {
    register: (data: { name: string; email: string; college: string; password: string; role: string }) =>
        api.post("/register", data),
    login: (data: { email: string; password: string }) =>
        api.post("/login", data),
    profile: () => api.get("/profile"),
    consent: (data: { accept_terms: boolean; enable_monitoring: boolean }) =>
        api.post("/consent", data),
};

// ──── Logs ────
export const logsAPI = {
    ingest: (data: any) => api.post("/logs", data),
    riskScore: () => api.get("/risk-score"),
    alerts: () => api.get("/alerts"),
    recentLogs: () => api.get("/logs/recent"),
};

// ──── Student Actions ────
export const studentAPI = {
    blockApp: (app_name: string) => api.post("/block-app", { app_name }),
    resolveAlert: (alert_id: number) => api.post("/resolve-alert", { alert_id }),
    wellbeing: () => api.get("/wellbeing"),
    permissionAudit: () => api.get("/permission-audit"),
    leaderboard: () => api.get("/leaderboard"),
    trainingProgress: () => api.get("/training-progress"),
};

// ──── Admin ────
export const adminAPI = {
    stats: () => api.get("/admin/stats"),
    highRiskUsers: () => api.get("/admin/high-risk-users"),
    exportReport: () => api.get("/admin/export-report", { responseType: "blob" }),
    activityFeed: () => api.get("/admin/activity-feed"),
    trends: (days: number = 14) => api.get(`/admin/trends?days=${days}`),
    collegeBreakdown: () => api.get("/admin/college-breakdown"),
    allUsers: (search: string = "", role: string = "all") => api.get(`/admin/all-users?search=${search}&role_filter=${role}`),
};

// ──── Devices ────
export const devicesAPI = {
    register: (data: { device_name: string; device_type: string }) => api.post("/devices/register", data),
    getAll: () => api.get("/devices"),
    getRisk: (id: string) => api.get(`/devices/${id}/risk`),
};

// ──── Profiles ────
export const profilesAPI = {
    getBaseline: () => api.get("/profile/baseline"),
    getDeviation: () => api.get("/profile/deviation"),
};

// ──── Incidents ────
export const incidentsAPI = {
    report: (data: { alert_id: number; report_type: string; description: string }) => api.post("/incidents/report", data),
    getAll: () => api.get("/incidents"),
    updateStatus: (id: number, status: string) => api.patch(`/incidents/${id}/status?status=${status}`),
};

// ──── Privacy ────
export const privacyAPI = {
    getLogs: () => api.get("/privacy/data-access"),
    getExplanation: (alertId: number) => api.get(`/privacy/explanation/${alertId}`),
};

// ──── Anomalies (Analytics) ────
export const anomaliesAPI = {
    getTimeline: () => api.get("/anomalies/timeline"),
    getHeatmap: () => api.get("/anomalies/heatmap"),
};

// ──── Escalate ────
export const escalateAPI = {
    trigger: (data: { user_id: string; reason: string }) => api.post("/escalate", data),
};

// ──── WebSocket ────
export function createWebSocket(userId: string): WebSocket | null {
    if (typeof window === "undefined") return null;
    const wsBase = WS_BACKEND.replace("http", "ws");
    return new WebSocket(`${wsBase}/ws/${userId}`);
}

export default api;
