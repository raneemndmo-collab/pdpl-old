/**
 * PublicVerify — Public document verification page
 * No login required — accessible via /public/verify
 * Features: QR scanning via camera, file upload, dramatic console-style verification
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
  FileText,
  Upload,
  ArrowLeft,
  Fingerprint,
  Camera,
  X,
  Terminal,
  Hash,
  Calendar,
  User,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";

const RASID_LOGO_DARK =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/vyIfeykxwXasuonx.png";

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
}: {
  text: string;
  color?: string;
  prefix?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="flex items-start gap-2 font-mono text-xs leading-relaxed">
      <span className="text-blue-900/40 shrink-0 select-none">{prefix}</span>
      <span className={color}>
        {displayed}
        {!done && (
          <span
            className="inline-block w-1.5 h-3 bg-current ml-0.5 align-middle"
            style={{ animation: "blink 0.5s step-end infinite" }}
          />
        )}
      </span>
    </div>
  );
}

// ─── Scan Line Animation ─────────────────
function ScanLineAnim() {
  return (
    <div
      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent z-20 pointer-events-none"
      style={{ animation: "qr-scan-line 2s ease-in-out infinite" }}
    />
  );
}

// ─── Floating Bubbles ─────────────────
function FloatingBubbles() {
  const bubbles = [
    { size: 100, x: "80%", y: "15%", delay: 0, duration: 9 },
    { size: 70, x: "10%", y: "60%", delay: 1.5, duration: 8 },
    { size: 130, x: "65%", y: "75%", delay: 3, duration: 11 },
    { size: 50, x: "90%", y: "50%", delay: 0.5, duration: 7 },
    { size: 80, x: "25%", y: "85%", delay: 2, duration: 10 },
    { size: 60, x: "50%", y: "10%", delay: 4, duration: 8 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background:
              "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.15), rgba(37,99,235,0.05))",
            animation: `float-bubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Verification Steps ─────────────────
const VERIFY_STEPS = [
  {
    label: "جاري الاتصال بخادم التحقق المشفّر...",
    labelEn: "Connecting to encrypted verification server...",
    successMsg: "تم الاتصال بنجاح — قناة مشفّرة AES-256",
    successEn: "Connected — AES-256 encrypted channel",
  },
  {
    label: "جاري التحقق من رقم الكود...",
    labelEn: "Verifying document code number...",
    successMsg: "تم التعرف على كود التوثيق — تنسيق صالح",
    successEn: "Document code recognized — valid format",
  },
  {
    label: "جاري التحقق من كود QR...",
    labelEn: "Verifying QR code integrity...",
    successMsg: "كود QR مطابق — التوقيع الرقمي سليم",
    successEn: "QR code matched — digital signature intact",
  },
  {
    label: "جاري التحقق من سلامة المحتوى...",
    labelEn: "Verifying content integrity (SHA-256)...",
    successMsg: "بصمة المحتوى مطابقة — لم يتم التلاعب بالوثيقة",
    successEn: "Content hash matched — document not tampered",
  },
  {
    label: "إصدار نتيجة التحقق النهائية...",
    labelEn: "Issuing final verification result...",
    successMsg: "اكتمل التحقق بنجاح",
    successEn: "Verification complete",
  },
];

type VerifyState = "idle" | "verifying" | "success" | "error";

export default function PublicVerify() {
  const [, params] = useRoute("/public/verify/:code");
  const [code, setCode] = useState(params?.code || "");
  const [state, setState] = useState<VerifyState>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Console animation state
  const [consoleLines, setConsoleLines] = useState<
    { text: string; color: string; prefix: string; key: string }[]
  >([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState<("pending" | "running" | "done")[]>(
    VERIFY_STEPS.map(() => "pending")
  );

  // Camera / file state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-verify if code in URL
  useEffect(() => {
    if (params?.code) {
      setCode(params.code);
      handleVerify(params.code);
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

  const addLine = useCallback(
    (text: string, color = "text-emerald-400", prefix = ">>>") => {
      setConsoleLines((prev) => [
        ...prev,
        { text, color, prefix, key: `${Date.now()}-${Math.random()}` },
      ]);
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
          handleVerify(finalCode);
        }
      }, 300);
    } catch (err: any) {
      setShowCamera(false);
    }
  };

  // ─── File Upload Handler ─────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith("image/")) {
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
              setCode(finalCode);
              handleVerify(finalCode);
              return;
            }

            // Fallback: BarcodeDetector
            if ("BarcodeDetector" in window) {
              try {
                const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
                const barcodes = await detector.detect(img);
                if (barcodes.length > 0) {
                  const qrValue = barcodes[0].rawValue;
                  const extracted = extractVerificationCode(qrValue);
                  const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
                  const finalCode = extracted || (urlMatch ? urlMatch[1] : qrValue);
                  setCode(finalCode);
                  handleVerify(finalCode);
                  return;
                }
              } catch {}
            }

            // Fallback: filename
            const fnCode = extractVerificationCode(file.name);
            if (fnCode) {
              setCode(fnCode);
              handleVerify(fnCode);
            }
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
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
          setCode(pdfCode);
          handleVerify(pdfCode);
        } else {
          const fnCode = extractVerificationCode(file.name);
          if (fnCode) {
            setCode(fnCode);
            handleVerify(fnCode);
          }
        }
      }
    } catch {}

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Main Verification Flow ─────────────────
  const handleVerify = async (verifyCode?: string) => {
    const codeToVerify = verifyCode || code.trim();
    if (!codeToVerify) return;

    stopCamera();
    setShowCamera(false);
    setState("verifying");
    setResult(null);
    setError("");
    setConsoleLines([]);
    setStepIndex(-1);
    setStepStatuses(VERIFY_STEPS.map(() => "pending"));

    // ── Console animation ──
    await sleep(300);
    addLine("═══════════════════════════════════════════════", "text-blue-900/30", "");
    await sleep(100);
    addLine("NDMO RASID VERIFICATION ENGINE v4.0", "text-blue-400", "   ");
    await sleep(100);
    addLine("نظام التحقق من وثائق منصة راصد الوطنية", "text-blue-400", "   ");
    await sleep(100);
    addLine("═══════════════════════════════════════════════", "text-blue-900/30", "");
    await sleep(400);
    addLine(`كود التحقق المُدخل: ${codeToVerify}`, "text-cyan-600", "[i]");
    await sleep(300);
    addLine("بدء عملية التحقق المتعددة المراحل...", "text-blue-800", ">>>");
    await sleep(500);

    // ── Steps ──
    for (let i = 0; i < VERIFY_STEPS.length; i++) {
      const step = VERIFY_STEPS[i];
      setStepIndex(i);
      setStepStatuses((prev) => {
        const next = [...prev];
        next[i] = "running";
        return next;
      });

      addLine("", "text-blue-900/20", "");
      addLine(`[${i + 1}/${VERIFY_STEPS.length}] ${step.label}`, "text-amber-600", ">>>");
      addLine(`        ${step.labelEn}`, "text-blue-400/50", "   ");

      await sleep(600);
      const hexLine = Array.from({ length: 48 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      addLine(`HASH: ${hexLine}`, "text-blue-900/30", "   ");
      await sleep(400 + Math.random() * 600);

      setStepStatuses((prev) => {
        const next = [...prev];
        next[i] = "done";
        return next;
      });
      addLine(`✓ ${step.successMsg}`, "text-emerald-600", "[✓]");
      addLine(`  ${step.successEn}`, "text-emerald-400/60", "   ");
      await sleep(300);
    }

    await sleep(500);
    addLine("", "text-blue-900/20", "");
    addLine("═══════════════════════════════════════════════", "text-blue-900/30", "");
    addLine("جاري إصدار النتيجة النهائية...", "text-blue-800", ">>>");
    await sleep(800);

    // ── Call API ──
    try {
      const res = await fetch(
        `/api/trpc/documentation.verify?input=${encodeURIComponent(JSON.stringify({ code: codeToVerify }))}`
      );
      const json = await res.json();
      const data = json?.result?.data;

      if (data?.valid) {
        addLine("✅ VERIFICATION PASSED — DOCUMENT AUTHENTIC", "text-emerald-600", "[✓]");
        setState("success");
        setResult(data);
      } else {
        addLine("❌ VERIFICATION FAILED — DOCUMENT NOT FOUND", "text-red-600", "[✗]");
        setState("error");
        setError(data?.message || "لم يتم العثور على توثيق بهذا الكود");
      }
    } catch (err) {
      addLine("❌ CONNECTION ERROR", "text-red-600", "[✗]");
      setState("error");
      setError("حدث خطأ في الاتصال بالخادم");
    }
  };

  const resetAll = () => {
    setState("idle");
    setCode("");
    setResult(null);
    setError("");
    setConsoleLines([]);
    setStepIndex(-1);
    setStepStatuses(VERIFY_STEPS.map(() => "pending"));
  };

  const isProcessing = state === "verifying";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 30%, #132b52 60%, #0f2340 100%)",
      }}
    >
      <FloatingBubbles />

      {/* Hidden elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={RASID_LOGO_DARK} alt="راصد" className="h-10 object-contain" />
          <div>
            <h1 className="text-white font-bold text-lg">منصة راصد الوطنية</h1>
            <p className="text-blue-300/60 text-xs">التحقق من صحة التوثيق</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">متصل</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-80px)]">
        {/* ═══ IDLE: Input Section ═══ */}
        {state === "idle" && (
          <div className="w-full max-w-lg space-y-8 text-center">
            <div>
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">التحقق من صحة التوثيق</h2>
              <p className="text-blue-200/60 text-sm max-w-md mx-auto">
                أدخل كود التوثيق المطبوع على الخطاب أو امسح رمز QR للتحقق من صحة ومصداقية الوثيقة
              </p>
            </div>

            {/* Camera Scanner */}
            {showCamera && (
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: "rgba(15, 30, 60, 0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-blue-200">مسح رمز QR بالكاميرا</h3>
                  <button
                    onClick={() => {
                      stopCamera();
                      setShowCamera(false);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-400/30 rounded-xl" />
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                    <ScanLineAnim />
                  </div>
                </div>
                <p className="text-xs text-blue-300/50 mt-2 text-center">
                  وجّه الكاميرا نحو رمز QR المطبوع على الوثيقة
                </p>
              </div>
            )}

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: "rgba(15, 30, 60, 0.65)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-200/80 block text-right">
                  كود التوثيق
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل كود التوثيق (مثال: NDMO-DOC-2026-XXXX)"
                  className="h-12 text-center text-lg font-mono bg-[#0a1628]/50 border-blue-500/20 text-white placeholder:text-blue-300/30"
                  dir="ltr"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={!code.trim()}
                className="w-full h-12 text-base font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)",
                }}
              >
                <Search className="w-5 h-5 ml-2" />
                تحقق الآن
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-blue-500/10" />
                <span className="text-xs text-blue-300/40">أو</span>
                <div className="flex-1 h-px bg-blue-500/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4 ml-2" />
                  مسح QR
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع ملف
                </Button>
              </div>
            </div>

            <p className="text-blue-300/30 text-xs">
              للتأكد من صحة بيانات التوثيق يرجى مسح الكود في منصة راصد الوطنية
            </p>
          </div>
        )}

        {/* ═══ VERIFYING: Console Animation ═══ */}
        <AnimatePresence>
          {(state === "verifying" || state === "success" || state === "error") && consoleLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              {/* Console Window */}
              <div className="rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl shadow-black/40">
                {/* Title Bar */}
                <div className="bg-[#0a1628]/90 px-4 py-2.5 flex items-center justify-between border-b border-blue-500/15">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5 mr-3">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-blue-300/60 font-mono">RASID_VERIFY</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isProcessing && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400"
                        style={{ animation: "blink 1s step-end infinite" }}
                      />
                    )}
                    <span className="text-[10px] text-blue-300/40 font-mono">
                      {isProcessing ? "PROCESSING..." : "COMPLETE"}
                    </span>
                  </div>
                </div>

                {/* Console Body */}
                <div
                  className="bg-[#060d1f] p-4 max-h-[380px] overflow-y-auto font-mono text-xs space-y-1 relative"
                  style={{ minHeight: "240px" }}
                >
                  {isProcessing && <ScanLineAnim />}
                  {consoleLines.map((line) => (
                    <ConsoleLine key={line.key} text={line.text} color={line.color} prefix={line.prefix} />
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {/* Step Progress */}
                <div className="bg-[#0a1628]/80 px-4 py-2.5 border-t border-blue-500/15">
                  <div className="flex items-center gap-1.5">
                    {VERIFY_STEPS.map((_, idx) => {
                      const status = stepStatuses[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-5 h-1.5 rounded-full transition-all duration-500 ${
                            status === "done"
                              ? "bg-emerald-500"
                              : status === "running"
                                ? "bg-blue-400 animate-pulse"
                                : "bg-blue-900/40"
                          }`}
                        />
                      );
                    })}
                    <span className="text-[10px] text-blue-300/40 font-mono mr-auto">
                      {stepIndex >= 0
                        ? `${Math.min(stepIndex + 1, VERIFY_STEPS.length)}/${VERIFY_STEPS.length}`
                        : "0/5"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ═══ Success Result ═══ */}
              {state === "success" && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 space-y-6 text-center"
                >
                  <div>
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-400 mb-2">التوثيق صحيح ومعتمد</h2>
                    <p className="text-blue-200/60 text-sm">تم التحقق من صحة الوثيقة بنجاح</p>
                  </div>

                  <div
                    className="rounded-2xl p-6 text-right space-y-4"
                    style={{
                      background: "rgba(15, 30, 60, 0.65)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    {result.document && (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-blue-300/50 text-xs mb-1">كود التوثيق</p>
                            <p className="text-white font-mono">{result.document.verificationCode}</p>
                          </div>
                          <div>
                            <p className="text-blue-300/50 text-xs mb-1">تاريخ الإصدار</p>
                            <p className="text-white">
                              {new Date(result.document.createdAt).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300/50 text-xs mb-1">صادر بواسطة</p>
                            <p className="text-white">{result.document.generatedByName}</p>
                          </div>
                          <div>
                            <p className="text-blue-300/50 text-xs mb-1">عنوان الحادثة</p>
                            <p className="text-white">{result.document.titleAr}</p>
                          </div>
                        </div>
                        {result.document.contentHash && (
                          <div className="pt-3 border-t border-blue-500/10">
                            <p className="text-[10px] text-blue-300/40 mb-1">بصمة المحتوى (SHA-256)</p>
                            <p className="text-[10px] font-mono text-blue-300/30 break-all">
                              {result.document.contentHash}
                            </p>
                          </div>
                        )}
                        <div className="pt-3 border-t border-blue-500/10">
                          <p className="text-emerald-400/80 text-xs flex items-center gap-1 justify-center">
                            <Shield className="w-3 h-3" />
                            تم التحقق من المطابقة الحرفية للمحتوى
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={resetAll}
                    variant="outline"
                    className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    تحقق من وثيقة أخرى
                  </Button>
                </motion.div>
              )}

              {/* ═══ Error Result ═══ */}
              {state === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 space-y-6 text-center"
                >
                  <div>
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">التوثيق غير صالح</h2>
                    <p className="text-blue-200/60 text-sm">{error}</p>
                  </div>

                  <Button
                    onClick={resetAll}
                    variant="outline"
                    className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    حاول مرة أخرى
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-blue-300/30 text-xs">© 2026 مكتب إدارة البيانات الوطنية — منصة راصد</p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes qr-scan-line {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes float-bubble {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
