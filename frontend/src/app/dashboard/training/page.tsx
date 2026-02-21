"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, ArrowLeft, BookOpen, CheckCircle, Clock, Award,
    ChevronRight, Lock, Wifi, Mail, Eye, Fingerprint, Database,
    AlertTriangle, Zap, Star
} from "lucide-react";
import { studentAPI } from "@/lib/api";

// Training quiz questions for each module
const QUIZZES: Record<string, { question: string; options: string[]; correct: number }[]> = {
    phishing: [
        { question: "What is the most common sign of a phishing email?", options: ["Personalized greeting", "Urgent action required", "Company letterhead", "Sent during work hours"], correct: 1 },
        { question: "You receive an email from 'support@g00gle.com'. What should you do?", options: ["Click the link to verify", "Reply asking for more info", "Report it as phishing", "Forward to a friend"], correct: 2 },
        { question: "Which URL is most likely legitimate?", options: ["http://paypal.security-check.com", "https://www.paypal.com/login", "http://paypa1.com/account", "https://paypal.login-verify.net"], correct: 1 },
    ],
    passwords: [
        { question: "Which is the strongest password?", options: ["Password123!", "MyDog'sName", "j7$kL!9q#Bz2", "admin"], correct: 2 },
        { question: "How often should you change your passwords?", options: ["Every day", "When you suspect a breach", "Never", "Every year regardless"], correct: 1 },
        { question: "What is two-factor authentication?", options: ["Using two passwords", "A second verification step", "Having two accounts", "Encrypting data twice"], correct: 1 },
    ],
    social_eng: [
        { question: "What is 'pretexting' in social engineering?", options: ["Texting before calling", "Creating a fabricated scenario", "Sending pre-written texts", "Using text encryption"], correct: 1 },
        { question: "An attacker calls pretending to be IT support. What should you do?", options: ["Give them your password", "Hang up and call IT directly", "Ask a colleague", "Follow their instructions"], correct: 1 },
        { question: "Which is a tailgating attack?", options: ["Following someone through a secure door", "Sending spam emails", "Hacking a server", "Phishing on social media"], correct: 0 },
    ],
    wifi_safety: [
        { question: "What should you avoid on public Wi-Fi?", options: ["Reading news", "Online banking", "Checking weather", "Listening to music"], correct: 1 },
        { question: "What tool helps secure public Wi-Fi usage?", options: ["Antivirus only", "A VPN", "A firewall only", "A stronger password"], correct: 1 },
        { question: "How can you verify a Wi-Fi network is legitimate?", options: ["It has a strong signal", "Ask the establishment", "It's password-protected", "It has a common name"], correct: 1 },
    ],
    app_permissions: [
        { question: "An alarm clock app asks for camera access. What should you do?", options: ["Allow it", "Deny it", "Install a different phone", "Ignore the prompt"], correct: 1 },
        { question: "Which permission is most sensitive?", options: ["Vibration", "Internet access", "Location (always)", "Wi-Fi state"], correct: 2 },
        { question: "How can you review app permissions on your phone?", options: ["You can't", "Through Settings > Apps", "Only by reinstalling", "Contact support"], correct: 1 },
    ],
    data_privacy: [
        { question: "What does GDPR stand for?", options: ["General Data Processing Rule", "General Data Protection Regulation", "Global Data Privacy Regulation", "General Digital Privacy Right"], correct: 1 },
        { question: "What is 'data minimization'?", options: ["Deleting all data", "Collecting only necessary data", "Compressing data", "Encrypting data"], correct: 1 },
        { question: "Who is responsible for your online data privacy?", options: ["Only the company", "Only the government", "Primarily you", "Nobody"], correct: 2 },
    ],
};

const ICONS: Record<string, any> = {
    phishing: Mail,
    passwords: Lock,
    social_eng: Eye,
    wifi_safety: Wifi,
    app_permissions: Fingerprint,
    data_privacy: Database,
};

const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-400 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function TrainingPage() {
    const router = useRouter();
    const [training, setTraining] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("sentinel_user");
        if (!stored) { router.push("/login"); return; }
        loadTraining();
    }, []);

    const loadTraining = async () => {
        try {
            const res = await studentAPI.trainingProgress();
            setTraining(res.data);
        } catch (err) {
            console.error("Failed to load training", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = (moduleId: string) => {
        setActiveQuiz(moduleId);
        setQuizAnswers({});
        setQuizSubmitted(false);
    };

    const handleSelectAnswer = (qIndex: number, optIndex: number) => {
        if (quizSubmitted) return;
        setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
    };

    const handleSubmitQuiz = () => {
        setQuizSubmitted(true);
    };

    const getQuizScore = () => {
        if (!activeQuiz) return 0;
        const questions = QUIZZES[activeQuiz] || [];
        let correct = 0;
        questions.forEach((q, i) => {
            if (quizAnswers[i] === q.correct) correct++;
        });
        return Math.round((correct / questions.length) * 100);
    };

    return (
        <div className="min-h-screen border-t-2 border-sentinel-accent">
            <header className="border-b border-sentinel-border px-6 py-4 bg-sentinel-card/30 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-sentinel-card text-sentinel-text-muted hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Shield className="w-6 h-6 text-sentinel-accent" />
                    <h1 className="text-xl font-bold text-white">Security Training Center</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Stats Bar */}
                {training && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-sentinel-accent" />
                                <span className="font-semibold text-white">Your Progress</span>
                            </div>
                            <span className="text-sm text-sentinel-text-muted">
                                {training.completed_count}/{training.total_count} modules completed
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-sentinel-card overflow-hidden mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(training.completed_count / training.total_count) * 100}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-sentinel-accent via-sentinel-neon to-sentinel-neon-purple"
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-sentinel-text-muted">
                            <span>Overall Score: <span className={`font-bold ${training.overall_score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{training.overall_score}%</span></span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {training.completed_count * 50} XP Earned</span>
                        </div>
                    </motion.div>
                )}

                {/* Quiz Modal */}
                <AnimatePresence>
                    {activeQuiz && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-card p-6 border-2 border-sentinel-accent/30"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-sentinel-accent" />
                                    Quiz: {training?.modules.find((m: any) => m.id === activeQuiz)?.title}
                                </h2>
                                <button onClick={() => setActiveQuiz(null)} className="text-sentinel-text-muted hover:text-white text-sm">
                                    Close ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {(QUIZZES[activeQuiz] || []).map((q, qIdx) => (
                                    <div key={qIdx} className="space-y-3">
                                        <p className="text-sm font-medium text-white">
                                            <span className="text-sentinel-accent mr-2">Q{qIdx + 1}.</span>
                                            {q.question}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.options.map((opt, optIdx) => {
                                                let style = "bg-sentinel-card/50 border-sentinel-border text-sentinel-text hover:bg-white/5";
                                                if (quizAnswers[qIdx] === optIdx && !quizSubmitted) {
                                                    style = "bg-sentinel-accent/15 border-sentinel-accent/40 text-white";
                                                }
                                                if (quizSubmitted) {
                                                    if (optIdx === q.correct) {
                                                        style = "bg-green-500/15 border-green-500/40 text-green-400";
                                                    } else if (quizAnswers[qIdx] === optIdx && optIdx !== q.correct) {
                                                        style = "bg-red-500/15 border-red-500/40 text-red-400";
                                                    }
                                                }
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                                                        className={`p-3 rounded-lg border text-sm text-left transition-all ${style}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                {!quizSubmitted ? (
                                    <button
                                        onClick={handleSubmitQuiz}
                                        disabled={Object.keys(quizAnswers).length < (QUIZZES[activeQuiz]?.length || 0)}
                                        className="btn-neon !py-2.5 !px-6 disabled:opacity-30"
                                    >
                                        Submit Answers
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getQuizScore() >= 70 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            Score: {getQuizScore()}%
                                        </div>
                                        <p className="text-sm text-sentinel-text-muted">
                                            {getQuizScore() >= 70 ? "Great job! 🎉" : "Review the material and try again."}
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setActiveQuiz(null)}
                                    className="text-sm text-sentinel-text-muted hover:text-white transition-colors"
                                >
                                    {quizSubmitted ? 'Done' : 'Skip'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Module Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-56 rounded-xl" />)}
                    </div>
                ) : training ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {training.modules.map((mod: any, i: number) => {
                            const Icon = ICONS[mod.id] || BookOpen;
                            return (
                                <motion.div
                                    key={mod.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className={`glass-card p-6 relative overflow-hidden group cursor-pointer hover:border-sentinel-accent/30 transition-all ${mod.completed ? 'border-green-500/20' : ''}`}
                                    onClick={() => !activeQuiz && handleStartQuiz(mod.id)}
                                >
                                    {mod.completed && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.completed ? 'bg-green-500/10' : 'bg-sentinel-accent/10'}`}>
                                        <Icon className={`w-6 h-6 ${mod.completed ? 'text-green-400' : 'text-sentinel-accent-light'}`} />
                                    </div>

                                    <h3 className="text-base font-semibold text-white mb-2">{mod.title}</h3>
                                    <p className="text-xs text-sentinel-text-muted mb-4 line-clamp-2">{mod.description}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_COLORS[mod.difficulty] || ''}`}>
                                                {mod.difficulty}
                                            </span>
                                            <span className="text-xs text-sentinel-text-muted flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {mod.duration_minutes}m
                                            </span>
                                        </div>
                                        {mod.completed ? (
                                            <span className="text-sm font-bold text-green-400">{mod.score}%</span>
                                        ) : (
                                            <span className="text-xs text-sentinel-accent flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Start <ChevronRight className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Hover gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-sentinel-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </motion.div>
                            );
                        })}
                    </div>
                ) : null}
            </main>
        </div>
    );
}
