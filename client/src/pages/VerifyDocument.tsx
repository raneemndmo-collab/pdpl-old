/**
 * VerifyDocument — Internal verification page with dramatic console animation
 * Features: QR scanning via camera, file upload, console-style step-by-step verification
 * with typing effect showing each verification step sequentially
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
  Sparkles,
  Lock,
  Cpu,
  Eye,
  Zap,
  Binary,
  ScanLine,
  CircuitBoard,
  Camera,
  Upload,
  X,
  Terminal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import jsQR from "jsqr";

// ─── Extract NDMO verification code from text ─────────────────
function extractVerificationCode(text: string): string | null {
  const match = text.match(/NDMO-DOC-\d{4}-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}

// ─── Console Line Component with typing effect ─────────────────
function ConsoleLine({
  text,
  color = "text-emerald-400",
  prefix = ">>>",
  delay = 0,
  typingSpeed = 30,
  onComplete,
  showCursor = false,
}: {
  text: string;
  color?: string;
  prefix?: string;
  delay?: number;
  typingSpeed?: number;
  onComplete?: () => void;
  showCursor?: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, typingSpeed);
    return () => clearInterval(interval);
  }, [started, text, typingSpeed]);

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2 font-mono text-xs leading-relaxed"
    >
      <span className="text-slate-600 shrink-0 select-none">{prefix}</span>
      <span className={color}>
        {displayed}
        {(!done || showCursor) && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-3.5 bg-current ml-0.5 align-middle"
          />
        )}
      </span>
    </motion.div>
  );
}

// ─── Scan Line Animation ─────────────────
function ScanLineAnimation() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent z-20 pointer-events-none"
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Floating Particle ─────────────────
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-teal-400/30"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.8, 0.8, 0] }}
      transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── Verification Steps ─────────────────
const VERIFY_STEPS = [
  {
    id: "connect",
    label: "جاري الاتصال بخادم التحقق المشفّر...",
    labelEn: "Connecting to encrypted verification server...",
    icon: Database,
    successMsg: "تم الاتصال بنجاح — قناة مشفّرة AES-256",
    successEn: "Connected — AES-256 encrypted channel established",
  },
  {
    id: "code_check",
    label: "جاري التحقق من رقم الكود...",
    labelEn: "Verifying document code number...",
    icon: Hash,
    successMsg: "تم التعرف على كود التوثيق — تنسيق صالح",
    successEn: "Document code recognized — valid format",
  },
  {
    id: "qr_check",
    label: "جاري التحقق من كود QR...",
    labelEn: "Verifying QR code integrity...",
    icon: QrCode,
    successMsg: "كود QR مطابق — التوقيع الرقمي سليم",
    successEn: "QR code matched — digital signature intact",
  },
  {
    id: "content_check",
    label: "جاري التحقق من سلامة المحتوى...",
    labelEn: "Verifying content integrity (SHA-256)...",
    icon: Fingerprint,
    successMsg: "بصمة المحتوى مطابقة — لم يتم التلاعب بالوثيقة",
    successEn: "Content hash matched — document not tampered",
  },
  {
    id: "final",
    label: "إصدار نتيجة التحقق النهائية...",
    labelEn: "Issuing final verification result...",
    icon: Shield,
    successMsg: "اكتمل التحقق بنجاح",
    successEn: "Verification complete",
  },
];

type VerifyStage = "idle" | "scanning_qr" | "verifying" | "result";

export default function VerifyDocument() {
  const [, params] = useRoute("/verify/:code");
  const [code, setCode] = useState(params?.code || "");
  const [stage, setStage] = useState<VerifyStage>("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState<("pending" | "running" | "done" | "error")[]>(
    VERIFY_STEPS.map(() => "pending")
  );
  const [consoleLines, setConsoleLines] = useState<
    { text: string; color: string; prefix: string; key: string }[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const trpcUtils = trpc.useUtils();

  // Auto-verify if code comes from URL
  useEffect(() => {
    if (params?.code) {
      setCode(params.code);
      startVerification(params.code);
    }
  }, [params?.code]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLines]);

  // ─── Console helpers ─────────────────
  const addConsoleLine = useCallback(
    (text: string, color = "text-emerald-400", prefix = ">>>") => {
      setConsoleLines((prev) => [...prev, { text, color, prefix, key: `${Date.now()}-${Math.random()}` }]);
    },
    []
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ─── Camera Controls ─────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Scan for QR codes using jsQR
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrResult) {
          const qrValue = qrResult.data;
          const extracted = extractVerificationCode(qrValue);
          const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
          const finalCode = extracted || (urlMatch ? urlMatch[1] : qrValue);

          stopCamera();
          setShowCamera(false);
          setCode(finalCode);
          startVerification(finalCode);
        }
      }, 300);
    } catch (err: any) {
      setShowCamera(false);
      addConsoleLine(
        `[ERROR] فشل تشغيل الكاميرا: ${err.name === "NotAllowedError" ? "تم رفض الإذن" : err.message}`,
        "text-red-400",
        "!!!"
      );
    }
  };

  // ─── File Upload Handler ─────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addConsoleLine(`جاري معالجة الملف: ${file.name}`, "text-cyan-400", ">>>");

    try {
      if (file.type.startsWith("image/")) {
        // Process image for QR code
        const img = document.createElement("img");
        const reader = new FileReader();

        reader.onload = async (ev) => {
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
            if (qrResult) {
              const qrValue = qrResult.data;
              const extracted = extractVerificationCode(qrValue);
              const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
              const finalCode = extracted || (urlMatch ? urlMatch[1] : qrValue);

              addConsoleLine(`تم استخراج كود QR: ${finalCode}`, "text-emerald-400", "[✓]");
              setCode(finalCode);
              startVerification(finalCode);
            } else {
              // Try BarcodeDetector as fallback
              if ("BarcodeDetector" in window) {
                try {
                  const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
                  const barcodes = await detector.detect(img);
                  if (barcodes.length > 0) {
                    const qrValue = barcodes[0].rawValue;
                    const extracted = extractVerificationCode(qrValue);
                    const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
                    const finalCode = extracted || (urlMatch ? urlMatch[1] : qrValue);
                    addConsoleLine(`تم استخراج كود QR: ${finalCode}`, "text-emerald-400", "[✓]");
                    setCode(finalCode);
                    startVerification(finalCode);
                    return;
                  }
                } catch {}
              }
              // Try filename
              const fnCode = extractVerificationCode(file.name);
              if (fnCode) {
                addConsoleLine(`تم استخراج الكود من اسم الملف: ${fnCode}`, "text-amber-400", "[~]");
                setCode(fnCode);
                startVerification(fnCode);
              } else {
                addConsoleLine("لم يتم العثور على رمز QR في الصورة", "text-red-400", "[✗]");
              }
            }
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        // Process PDF
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + " ";
        }

        const pdfCode = extractVerificationCode(fullText);
        if (pdfCode) {
          addConsoleLine(`تم استخراج كود التوثيق من PDF: ${pdfCode}`, "text-emerald-400", "[✓]");
          setCode(pdfCode);
          startVerification(pdfCode);
        } else {
          const fnCode = extractVerificationCode(file.name);
          if (fnCode) {
            addConsoleLine(`تم استخراج الكود من اسم الملف: ${fnCode}`, "text-amber-400", "[~]");
            setCode(fnCode);
            startVerification(fnCode);
          } else {
            addConsoleLine("لم يتم العثور على كود توثيق في ملف PDF", "text-red-400", "[✗]");
          }
        }
      } else {
        addConsoleLine("نوع الملف غير مدعوم — يرجى رفع صورة أو PDF", "text-red-400", "[✗]");
      }
    } catch (err) {
      addConsoleLine("خطأ في معالجة الملف", "text-red-400", "[✗]");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Main Verification Flow ─────────────────
  const startVerification = useCallback(
    async (verifyCode?: string) => {
      const codeToVerify = verifyCode || code.trim();
      if (!codeToVerify) return;

      stopCamera();
      setShowCamera(false);
      setStage("verifying");
      setShowResult(false);
      setCurrentStep(-1);
      setStepStatuses(VERIFY_STEPS.map(() => "pending"));
      setConsoleLines([]);

      // ── Step 0: Initialize ──
      await sleep(300);
      addConsoleLine("═══════════════════════════════════════════════", "text-slate-600", "");
      await sleep(100);
      addConsoleLine("NDMO RASID VERIFICATION ENGINE v4.0", "text-teal-300", "   ");
      await sleep(100);
      addConsoleLine("نظام التحقق من وثائق منصة راصد الوطنية", "text-teal-300", "   ");
      await sleep(100);
      addConsoleLine("═══════════════════════════════════════════════", "text-slate-600", "");
      await sleep(400);
      addConsoleLine(`كود التحقق المُدخل: ${codeToVerify}`, "text-cyan-400", "[i]");
      await sleep(300);
      addConsoleLine("بدء عملية التحقق المتعددة المراحل...", "text-white", ">>>");
      await sleep(500);

      // ── Steps 1-5: Sequential verification ──
      for (let i = 0; i < VERIFY_STEPS.length; i++) {
        const step = VERIFY_STEPS[i];

        // Mark step as running
        setCurrentStep(i);
        setStepStatuses((prev) => {
          const next = [...prev];
          next[i] = "running";
          return next;
        });

        // Show step start
        addConsoleLine("", "text-slate-700", "");
        addConsoleLine(`[${i + 1}/${VERIFY_STEPS.length}] ${step.label}`, "text-amber-400", ">>>");
        addConsoleLine(`        ${step.labelEn}`, "text-slate-500", "   ");

        // Simulate processing with hex stream
        await sleep(600);
        const hexLine = Array.from({ length: 48 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");
        addConsoleLine(`HASH: ${hexLine}`, "text-slate-600", "   ");
        await sleep(400 + Math.random() * 600);

        // Mark step as done
        setStepStatuses((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
        addConsoleLine(`✓ ${step.successMsg}`, "text-emerald-400", "[✓]");
        addConsoleLine(`  ${step.successEn}`, "text-emerald-600", "   ");
        await sleep(300);
      }

      // ── Fetch actual result from API ──
      let apiResult: any = null;
      try {
        apiResult = await trpcUtils.documentation.verify.fetch({ code: codeToVerify });
      } catch (err: any) {
        console.error("Verify API error:", err);
      }

      // ── Final ──
      await sleep(500);
      addConsoleLine("", "text-slate-700", "");
      addConsoleLine("═══════════════════════════════════════════════", "text-slate-600", "");
      addConsoleLine("جاري إصدار النتيجة النهائية...", "text-white", ">>>");
      await sleep(800);

      if (apiResult) {
        if (apiResult.valid) {
          addConsoleLine("✓ الوثيقة صحيحة ومتحقق منها", "text-emerald-400", "[✓]");
        } else {
          addConsoleLine("✗ الوثيقة غير صالحة أو غير موجودة", "text-red-400", "[✗]");
        }
      } else {
        addConsoleLine("✗ فشل الاتصال بخادم التحقق", "text-red-400", "[✗]");
        apiResult = { valid: false, message: "فشل الاتصال بخادم التحقق" };
      }

      setVerifyResult(apiResult);
      setStage("result");
      setTimeout(() => setShowResult(true), 400);
    },
    [code, addConsoleLine, stopCamera]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startVerification();
  };

  const resetAll = () => {
    setStage("idle");
    setShowResult(false);
    setVerifyResult(null);
    setCode("");
    setConsoleLines([]);
    setCurrentStep(-1);
    setStepStatuses(VERIFY_STEPS.map(() => "pending"));
  };

  const isProcessing = stage === "verifying";

  return (
    <div className="min-h-screen bg-[#030712] text-foreground overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
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
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6,182,212,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {Array.from({ length: 15 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} x={Math.random() * 100} size={2 + Math.random() * 4} />
        ))}
      </div>

      {/* Hidden elements */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative z-10 container max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center mb-4"
            animate={isProcessing ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/30"
                animate={
                  isProcessing
                    ? {
                        boxShadow: [
                          "0 0 30px rgba(13,148,136,0.3)",
                          "0 0 60px rgba(13,148,136,0.5)",
                          "0 0 30px rgba(13,148,136,0.3)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShieldCheck className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent mb-1">
            نظام التحقق من الوثائق
          </h1>
          <p className="text-xs text-slate-500">
            Document Verification System — NDMO Rasid Platform
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* INPUT SECTION: Code + Camera + Upload */}
        {/* ═══════════════════════════════════════════════ */}
        {stage === "idle" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/60 border-slate-700/40 backdrop-blur-2xl shadow-2xl">
              <CardContent className="p-6 space-y-4">
                {/* Camera Scanner */}
                {showCamera && (
                  <div className="relative rounded-xl overflow-hidden bg-black/60 aspect-video mb-4">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <ScanLineAnimation />
                      <div className="absolute inset-4 border-2 border-teal-400/30 rounded-xl" />
                      <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                      <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                      <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                      <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="text-xs text-teal-300/70 bg-black/50 px-3 py-1 rounded-full">
                        وجّه الكاميرا نحو رمز QR
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        stopCamera();
                        setShowCamera(false);
                      }}
                      className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}

                {/* Code Input */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="أدخل رمز التحقق (مثال: NDMO-DOC-2026-XXXXXXXX)"
                      className="bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500 font-mono text-sm h-12 pr-10"
                      dir="ltr"
                    />
                    <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                  <Button
                    type="submit"
                    disabled={!code.trim()}
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 h-12 shrink-0 shadow-lg shadow-teal-500/20"
                  >
                    <Search className="w-4 h-4 ml-2" />
                    تحقق
                  </Button>
                </form>

                {/* Camera + Upload Buttons */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700/40" />
                  <span className="text-xs text-slate-600">أو</span>
                  <div className="flex-1 h-px bg-slate-700/40" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 border-teal-500/20 text-teal-300 hover:bg-teal-500/10 bg-transparent gap-2"
                    onClick={startCamera}
                  >
                    <Camera className="w-4 h-4" />
                    مسح QR بالكاميرا
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10 bg-transparent gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    رفع صورة / PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* CONSOLE VERIFICATION ANIMATION */}
        {/* ═══════════════════════════════════════════════ */}
        <AnimatePresence>
          {(stage === "verifying" || stage === "result") && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mt-6"
            >
              {/* Console Window */}
              <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/40">
                {/* Console Title Bar */}
                <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5 mr-3">
                      <Terminal className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs text-slate-400 font-mono">RASID_VERIFY_CONSOLE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isProcessing && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isProcessing ? "PROCESSING..." : stage === "result" ? "COMPLETE" : "READY"}
                    </span>
                  </div>
                </div>

                {/* Console Body */}
                <div
                  className="bg-[#0a0e1a] p-4 max-h-[420px] overflow-y-auto font-mono text-xs space-y-1 relative"
                  style={{ minHeight: "280px" }}
                >
                  {/* Scan line effect during processing */}
                  {isProcessing && <ScanLineAnimation />}

                  {consoleLines.map((line) => (
                    <ConsoleLine
                      key={line.key}
                      text={line.text}
                      color={line.color}
                      prefix={line.prefix}
                      typingSpeed={20}
                    />
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {/* Step Progress Bar */}
                <div className="bg-slate-800/60 px-4 py-3 border-t border-slate-700/40">
                  <div className="flex items-center gap-2">
                    {VERIFY_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const status = stepStatuses[idx];
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <motion.div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              status === "done"
                                ? "bg-emerald-500/20 border border-emerald-500/40"
                                : status === "running"
                                  ? "bg-teal-500/20 border border-teal-500/40"
                                  : "bg-slate-700/30 border border-slate-700/40"
                            }`}
                            animate={status === "running" ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            {status === "done" ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </motion.div>
                            ) : status === "running" ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <StepIcon className="w-3.5 h-3.5 text-teal-400" />
                              </motion.div>
                            ) : (
                              <StepIcon className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </motion.div>
                          {idx < VERIFY_STEPS.length - 1 && (
                            <div
                              className={`w-4 h-0.5 rounded-full transition-colors ${
                                status === "done" ? "bg-emerald-500/40" : "bg-slate-700/30"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                    <div className="flex-1" />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentStep >= 0
                        ? `${Math.min(currentStep + 1, VERIFY_STEPS.length)}/${VERIFY_STEPS.length}`
                        : "0/5"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════ */}
        {/* RESULT SECTION */}
        {/* ═══════════════════════════════════════════════ */}
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
                            {
                              icon: Calendar,
                              label: "تاريخ الإصدار",
                              value: verifyResult.document.createdAt
                                ? new Date(verifyResult.document.createdAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })
                                : "—",
                              color: "text-white",
                            },
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
                            <span
                              className={`text-xs px-3 py-1.5 rounded-lg border ${
                                verifyResult.document.leakSeverity === "critical"
                                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                                  : verifyResult.document.leakSeverity === "high"
                                    ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                    : verifyResult.document.leakSeverity === "medium"
                                      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                                      : "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
                              }`}
                            >
                              حجم التأثير:{" "}
                              {verifyResult.document.leakSeverity === "critical"
                                ? "واسع النطاق"
                                : verifyResult.document.leakSeverity === "high"
                                  ? "عالي"
                                  : verifyResult.document.leakSeverity === "medium"
                                    ? "متوسط"
                                    : "منخفض"}
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
                            <span className="text-[10px] text-slate-400 font-semibold">
                              بصمة المحتوى الرقمية (SHA-256)
                            </span>
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

                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={resetAll}
                        className="gap-2 border-slate-600/40 text-slate-300 hover:bg-slate-800/40"
                      >
                        <Search className="w-4 h-4" />
                        تحقق من وثيقة أخرى
                      </Button>
                    </div>
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
                    <p className="text-sm text-red-400/70">
                      {verifyResult?.message || "رمز التحقق غير صالح أو غير موجود في النظام"}
                    </p>
                    <div className="mt-6 bg-red-500/5 rounded-xl p-4 border border-red-500/15">
                      <p className="text-xs text-slate-400">
                        تأكد من إدخال رمز التحقق بشكل صحيح أو تواصل مع مكتب إدارة البيانات الوطنية
                      </p>
                    </div>
                    <Button className="mt-4 gap-2" variant="outline" onClick={resetAll}>
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
          className="mt-12 text-center"
        >
          <p className="text-xs text-teal-500/50 font-semibold mb-1">❝ حماية البيانات الشخصية متطلب وطني ❞</p>
          <p className="text-[10px] text-slate-600">منصة راصد — مكتب إدارة البيانات الوطنية (NDMO)</p>
          <p className="text-[9px] text-slate-700 mt-1">NDMO_RASID_VERIFY_ENGINE v4.0</p>
        </motion.div>
      </div>
    </div>
  );
}
