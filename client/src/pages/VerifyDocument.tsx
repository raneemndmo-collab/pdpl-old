/**
 * VerifyDocument — Public verification page for incident documentation
 * Features: QR scanning, manual code entry, ultra-premium verification animation
 * with particle effects, scanning rings, and professional results display
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Hash,
  Database,
  AlertTriangle,
  Fingerprint,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Wifi,
  Eye,
  Zap,
  Binary,
  ScanLine,
  CircuitBoard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

const severityLabel = (s: string) => {
  switch (s) {
    case "critical": return "حرج";
    case "high": return "عالي";
    case "medium": return "متوسط";
    default: return "منخفض";
  }
};

const severityColor = (s: string) => {
  switch (s) {
    case "critical": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "high": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }
};

// Floating particle component
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-teal-400/30"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{
        y: "-10vh",
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Scanning ring animation
function ScanRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full border border-teal-400/20"
      style={{ width: size, height: size }}
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

// Binary rain effect
function BinaryRain({ column }: { column: number }) {
  const chars = "01";
  const [text, setText] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setText(Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * 2)]).join("\n"));
    }, 150);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="absolute text-teal-500/10 font-mono text-[10px] leading-tight whitespace-pre select-none pointer-events-none"
      style={{ left: `${column * 5}%`, top: 0, animationDelay: `${column * 0.2}s` }}
    >
      {text}
    </div>
  );
}

// Verification animation stages
type VerifyStage = "idle" | "scanning" | "analyzing" | "matching" | "decrypting" | "result";

export default function VerifyDocument() {
  const [, params] = useRoute("/verify/:code");
  const [code, setCode] = useState(params?.code || "");
  const [stage, setStage] = useState<VerifyStage>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [queryCode, setQueryCode] = useState<string | null>(params?.code || null);
  const [hexStream, setHexStream] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: verifyResult } = trpc.documentation.verify.useQuery(
    { code: queryCode! },
    { enabled: !!queryCode }
  );

  // Auto-verify if code comes from URL
  useEffect(() => {
    if (params?.code) {
      setCode(params.code);
      setQueryCode(params.code);
      startVerification();
    }
  }, [params?.code]);

  // Hex stream animation during scanning
  useEffect(() => {
    if (stage !== "idle" && stage !== "result") {
      const interval = setInterval(() => {
        setHexStream(
          Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        );
      }, 80);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const scanSteps = [
    { label: "استلام رمز التحقق...", labelEn: "Receiving verification code...", icon: QrCode, color: "text-teal-400" },
    { label: "الاتصال بقاعدة البيانات المشفرة...", labelEn: "Connecting to encrypted database...", icon: Database, color: "text-cyan-400" },
    { label: "تحليل بصمة المحتوى الرقمية...", labelEn: "Analyzing digital content fingerprint...", icon: Fingerprint, color: "text-indigo-400" },
    { label: "مطابقة التوقيع الإلكتروني...", labelEn: "Matching electronic signature...", icon: Shield, color: "text-violet-400" },
    { label: "فك تشفير بيانات التحقق...", labelEn: "Decrypting verification data...", icon: Lock, color: "text-emerald-400" },
    { label: "التحقق من سلامة سلسلة الأدلة...", labelEn: "Verifying evidence chain integrity...", icon: CircuitBoard, color: "text-amber-400" },
    { label: "إصدار نتيجة التحقق النهائية...", labelEn: "Issuing final verification result...", icon: CheckCircle2, color: "text-emerald-400" },
  ];

  const startVerification = useCallback(() => {
    if (!code.trim()) return;
    setStage("scanning");
    setScanProgress(0);
    setScanStep(0);
    setShowResult(false);
    setQueryCode(code.trim());

    // Animated scanning sequence with more steps
    let progress = 0;
    let step = 0;
    const interval = setInterval(() => {
      progress += 1;
      setScanProgress(progress);
      if (progress >= 12 && step === 0) { step = 1; setScanStep(1); }
      if (progress >= 25 && step === 1) { step = 2; setScanStep(2); setStage("analyzing"); }
      if (progress >= 40 && step === 2) { step = 3; setScanStep(3); setStage("matching"); }
      if (progress >= 55 && step === 3) { step = 4; setScanStep(4); setStage("decrypting"); }
      if (progress >= 72 && step === 4) { step = 5; setScanStep(5); }
      if (progress >= 88 && step === 5) { step = 6; setScanStep(6); }
      if (progress >= 100) {
        clearInterval(interval);
        setStage("result");
        setTimeout(() => setShowResult(true), 800);
      }
    }, 50);
  }, [code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startVerification();
  };

  const isScanning = stage !== "idle" && stage !== "result";

  return (
    <div className="min-h-screen bg-[#030712] text-foreground overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]"
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-indigo-500/3 rounded-full blur-[80px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} x={Math.random() * 100} size={2 + Math.random() * 4} />
        ))}

        {/* Binary rain during scanning */}
        {isScanning && Array.from({ length: 10 }).map((_, i) => (
          <BinaryRain key={i} column={i * 2 + 1} />
        ))}
      </div>

      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          {/* Animated Logo */}
          <motion.div
            className="inline-flex items-center justify-center mb-6"
            animate={isScanning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/30"
                animate={isScanning ? {
                  boxShadow: [
                    "0 0 30px rgba(13,148,136,0.3)",
                    "0 0 60px rgba(13,148,136,0.5)",
                    "0 0 30px rgba(13,148,136,0.3)",
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShieldCheck className="w-10 h-10 text-white" />
              </motion.div>
              {isScanning && (
                <>
                  <ScanRing delay={0} size={80} />
                  <ScanRing delay={1} size={80} />
                  <ScanRing delay={2} size={80} />
                </>
              )}
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
            نظام التحقق من الوثائق
          </h1>
          <p className="text-sm text-slate-400">
            منصة <span className="text-teal-400 font-semibold">راصد</span> — مكتب إدارة البيانات الوطنية
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            أدخل رمز التحقق أو امسح رمز QR للتحقق من صحة وثيقة توثيق حادثة تسريب البيانات الشخصية
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="bg-slate-900/60 border-slate-700/40 backdrop-blur-2xl shadow-2xl shadow-black/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="أدخل رمز التحقق (مثال: NDMO-XXXXXX-XXXXXXXX)"
                    className="bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500 font-mono text-sm h-12 pr-10"
                    dir="ltr"
                  />
                  <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
                <Button
                  type="submit"
                  disabled={!code.trim() || isScanning}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8 h-12 shrink-0 shadow-lg shadow-teal-500/20"
                >
                  {isScanning ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Search className="w-4 h-4 ml-2" />
                      تحقق
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Animation */}
        <AnimatePresence>
          {stage !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <Card className="bg-slate-900/60 border-slate-700/40 backdrop-blur-2xl overflow-hidden shadow-2xl">
                <CardContent className="p-6">
                  {/* Hex Stream */}
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 bg-slate-950/80 rounded-lg p-3 border border-slate-700/30 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Binary className="w-3 h-3 text-teal-400" />
                        <span className="text-[9px] text-teal-400 font-mono">NDMO_VERIFY_STREAM</span>
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-slate-500 break-all leading-relaxed">
                        {hexStream}
                      </p>
                    </motion.div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={isScanning ? { rotate: 360 } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Cpu className="w-3.5 h-3.5 text-teal-400" />
                        </motion.div>
                        <span className="text-xs text-slate-400">
                          {stage === "result" ? "اكتمل التحقق" : "جاري المعالجة..."}
                        </span>
                      </div>
                      <span className="text-xs text-teal-400 font-mono font-bold">{scanProgress}%</span>
                    </div>
                    <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/30">
                      <motion.div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                          background: "linear-gradient(90deg, #0d9488, #06b6d4, #0d9488)",
                          backgroundSize: "200% 100%",
                        }}
                        animate={{
                          width: `${scanProgress}%`,
                          backgroundPosition: ["0% 0%", "100% 0%"],
                        }}
                        transition={{
                          width: { duration: 0.3 },
                          backgroundPosition: { duration: 1.5, repeat: Infinity, ease: "linear" },
                        }}
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Scan Steps */}
                  <div className="space-y-2">
                    {scanSteps.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isActive = idx === scanStep;
                      const isComplete = idx < scanStep;
                      const isVisible = idx <= scanStep + 1;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{
                            opacity: isVisible ? (idx <= scanStep ? 1 : 0.2) : 0,
                            x: isVisible ? 0 : 30,
                          }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isActive
                              ? "bg-gradient-to-l from-teal-500/10 to-transparent border border-teal-500/30 shadow-lg shadow-teal-500/5"
                              : isComplete
                                ? "bg-emerald-500/5 border border-emerald-500/15"
                                : "bg-slate-800/20 border border-transparent"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            isComplete
                              ? "bg-emerald-500/20 shadow-inner"
                              : isActive
                                ? "bg-teal-500/20 shadow-lg shadow-teal-500/10"
                                : "bg-slate-700/30"
                          }`}>
                            {isComplete ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </motion.div>
                            ) : isActive ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <StepIcon className={`w-4 h-4 ${step.color}`} />
                              </motion.div>
                            ) : (
                              <StepIcon className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className={`text-xs ${
                              isActive ? "text-teal-300 font-semibold" : isComplete ? "text-emerald-300/80" : "text-slate-600"
                            }`}>
                              {step.label}
                            </span>
                            <span className={`block text-[9px] font-mono ${
                              isActive ? "text-teal-500/60" : isComplete ? "text-emerald-500/40" : "text-slate-700"
                            }`}>
                              {step.labelEn}
                            </span>
                          </div>
                          {isActive && (
                            <motion.div
                              className="flex gap-0.5"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            >
                              {[0, 1, 2].map((d) => (
                                <motion.div
                                  key={d}
                                  className="w-1 h-1 rounded-full bg-teal-400"
                                  animate={{ scale: [1, 1.5, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.2 }}
                                />
                              ))}
                            </motion.div>
                          )}
                          {isComplete && (
                            <span className="text-[9px] text-emerald-500/50 font-mono">OK</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Central Scanning Animation */}
                  {isScanning && (
                    <div className="mt-8 flex justify-center">
                      <div className="relative flex items-center justify-center">
                        {/* Outer rings */}
                        <motion.div
                          className="absolute w-40 h-40 rounded-full border border-teal-500/10"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/50" />
                        </motion.div>
                        <motion.div
                          className="absolute w-32 h-32 rounded-full border border-cyan-500/15"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-400/50" />
                        </motion.div>

                        {/* Pulsing core */}
                        <motion.div
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(13,148,136,0)",
                              "0 0 30px 10px rgba(13,148,136,0.15)",
                              "0 0 0 0 rgba(13,148,136,0)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          >
                            <Fingerprint className="w-10 h-10 text-teal-400" />
                          </motion.div>
                        </motion.div>

                        {/* Orbiting dots */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full bg-teal-400/60"
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 3 + i * 0.5,
                              repeat: Infinity,
                              ease: "linear",
                              delay: i * 0.5,
                            }}
                            style={{
                              transformOrigin: `${60 + i * 5}px center`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status text */}
                  {isScanning && (
                    <motion.p
                      className="text-center text-[10px] text-slate-500 mt-6 font-mono"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      NDMO_RASID_VERIFY_ENGINE v3.2.1 — Secure Document Verification Protocol
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {showResult && verifyResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="mt-6"
            >
              {verifyResult.valid ? (
                <Card className="bg-emerald-500/5 border-emerald-500/25 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-emerald-500/5">
                  {/* Success Header */}
                  <div className="relative bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 p-8 text-center border-b border-emerald-500/20 overflow-hidden">
                    {/* Success particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
                        initial={{ x: "50%", y: "50%", scale: 0 }}
                        animate={{
                          x: `${20 + Math.random() * 60}%`,
                          y: `${10 + Math.random() * 80}%`,
                          scale: [0, 1, 0],
                        }}
                        transition={{ duration: 2, delay: 0.5 + i * 0.15, repeat: Infinity, repeatDelay: 3 }}
                      />
                    ))}

                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.3, duration: 0.8 }}
                    >
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-emerald-500/20"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                        </div>
                      </div>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-2xl font-bold text-emerald-300"
                    >
                      ✅ الوثيقة صحيحة ومتحقق منها
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-sm text-emerald-400/70 mt-2"
                    >
                      {verifyResult.message}
                    </motion.p>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {verifyResult.document && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: Hash, label: "رقم الوثيقة", value: verifyResult.document.documentId, color: "text-teal-400" },
                            { icon: FileText, label: "رقم التسريب", value: verifyResult.document.leakId, color: "text-cyan-400" },
                            { icon: User, label: "أصدرها", value: verifyResult.document.generatedByName, color: "text-white" },
                            { icon: Calendar, label: "تاريخ الإصدار", value: verifyResult.document.createdAt ? new Date(verifyResult.document.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) : "—", color: "text-white" },
                          ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                                className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                              >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Icon className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] text-slate-400">{item.label}</span>
                                </div>
                                <p className={`text-xs font-mono ${item.color}`}>{item.value}</p>
                              </motion.div>
                            );
                          })}
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 }}
                          className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30"
                        >
                          <p className="text-[10px] text-slate-400 mb-1.5">عنوان الحادثة</p>
                          <p className="text-sm font-semibold text-white">{verifyResult.document.titleAr}</p>
                        </motion.div>

                        {verifyResult.document.leakSeverity && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                            className="flex items-center gap-3 flex-wrap"
                          >
                            <span className={`text-xs px-3 py-1.5 rounded-lg border ${severityColor(verifyResult.document.leakSeverity)}`}>
                              الخطورة: {severityLabel(verifyResult.document.leakSeverity)}
                            </span>
                            {verifyResult.document.leakSector && (
                              <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/40">
                                {verifyResult.document.leakSector}
                              </span>
                            )}
                            {verifyResult.document.leakRecordCount && (
                              <span className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                                {verifyResult.document.leakRecordCount.toLocaleString()} سجل مكشوف
                              </span>
                            )}
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 }}
                          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] text-slate-400 font-semibold">بصمة المحتوى الرقمية (SHA-256)</span>
                          </div>
                          <p className="text-[10px] font-mono text-indigo-400/80 break-all leading-relaxed bg-slate-950/50 rounded-lg p-2">
                            {verifyResult.document.contentHash}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                          className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/15 text-center"
                        >
                          <p className="text-[10px] text-emerald-400/70">
                            ✓ تم التحقق من تطابق المحتوى مع النسخة المحفوظة في قاعدة البيانات المشفرة
                          </p>
                        </motion.div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-red-500/5 border-red-500/25 backdrop-blur-2xl shadow-2xl">
                  <CardContent className="p-10 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-red-500/10"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative w-full h-full rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/30">
                          <XCircle className="w-12 h-12 text-red-400" />
                        </div>
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-red-300 mb-2">❌ الوثيقة غير صالحة</h3>
                    <p className="text-sm text-red-400/70">{verifyResult?.message || "رمز التحقق غير صالح أو غير موجود في النظام"}</p>
                    <div className="mt-6 bg-red-500/5 rounded-xl p-4 border border-red-500/15">
                      <p className="text-xs text-slate-400">
                        تأكد من إدخال رمز التحقق بشكل صحيح أو تواصل مع مكتب إدارة البيانات الوطنية
                      </p>
                    </div>
                    <Button
                      className="mt-4 gap-2"
                      variant="outline"
                      onClick={() => { setStage("idle"); setShowResult(false); setQueryCode(null); setCode(""); }}
                    >
                      <Search className="w-4 h-4" />
                      محاولة أخرى
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-teal-500/50 font-semibold mb-1">❝ حماية البيانات الشخصية متطلب وطني ❞</p>
          <p className="text-[10px] text-slate-600">منصة راصد — مكتب إدارة البيانات الوطنية (NDMO)</p>
          <p className="text-[9px] text-slate-700 mt-1">NDMO_RASID_VERIFY_ENGINE v3.2.1</p>
        </motion.div>
      </div>
    </div>
  );
}
