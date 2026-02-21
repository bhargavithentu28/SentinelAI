import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle, AlertTriangle, Info, Shield, X } from "lucide-react";

export function AlertModal({ alert, isOpen, onClose, onResolve, onReport }: any) {
    if (!isOpen || !alert) return null;

    const severityColors: any = {
        critical: "text-red-400 border-red-500/30 bg-red-500/5",
        high: "text-orange-400 border-orange-500/30 bg-orange-500/5",
        medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
        low: "text-green-400 border-green-500/30 bg-green-500/5",
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="glass-card w-full max-w-lg overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className={`p-4 border-b flex justify-between items-center ${severityColors[alert.severity] || severityColors.medium}`}>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            <h2 className="font-semibold text-white capitalize">{alert.severity} Risk Alert</h2>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 transition-colors text-sentinel-text-muted hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-lg text-white font-medium mb-1">{alert.message}</p>
                            <span className="text-xs text-sentinel-text-muted">{new Date(alert.created_at || alert.timestamp).toLocaleString()}</span>
                        </div>

                        {/* Explanation */}
                        <div className="p-4 rounded-xl bg-sentinel-card/50 border border-sentinel-border">
                            <h3 className="text-sm font-semibold text-sentinel-text-muted flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-blue-400" /> AI Explanation
                            </h3>
                            <p className="text-sm text-sentinel-text leading-relaxed">
                                {alert.explanation_text || "The AI detected anomalous behavior deviating from your baseline profile."}
                            </p>
                            {alert.confidence_score && (
                                <p className="text-xs text-sentinel-text-muted mt-2">
                                    Confidence: {(alert.confidence_score * 100).toFixed(0)}%
                                </p>
                            )}
                        </div>

                        {/* Recommendation */}
                        <div className="p-4 rounded-xl bg-sentinel-card/50 border border-sentinel-border">
                            <h3 className="text-sm font-semibold text-sentinel-text-muted flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-green-400" /> Recommended Action
                            </h3>
                            <p className="text-sm text-sentinel-text leading-relaxed">
                                {alert.recommendation || "Review the activity and determine if it was expected."}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-sentinel-border bg-sentinel-card/30 flex justify-between items-center gap-4">
                        <button
                            onClick={() => {
                                onReport(alert.id);
                                onClose();
                            }}
                            className="text-sm text-sentinel-text-muted hover:text-white transition-colors underline decoration-dotted underline-offset-4"
                        >
                            Report False Positive
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sentinel-card hover:bg-sentinel-border transition-colors border border-sentinel-border"
                            >
                                Dismiss
                            </button>
                            {!alert.resolved && (
                                <button
                                    onClick={() => {
                                        onResolve(alert.id);
                                        onClose();
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sentinel-accent hover:bg-sentinel-accent-light transition-colors flex items-center gap-2 shadow-lg shadow-sentinel-accent/20"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark Safe
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
