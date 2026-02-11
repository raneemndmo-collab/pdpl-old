/**
 * PublicVerify — Public document verification page
 * No login required — accessible via /public/verify
 * Allows anyone to verify document authenticity via code, QR scan, or file upload
 */
import { useState, useRef, useEffect, useCallback } from "react";
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
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const RASID_LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/kuCEchYUSnPsbhZS.png";

// Floating bubbles for background
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
            background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.15), rgba(37,99,235,0.05))",
            animation: `float-bubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

type VerifyState = "idle" | "scanning" | "success" | "error";

// Scanning animation phases
const scanPhases = [
  { label: "جارٍ الاتصال بقاعدة البيانات...", icon: "🔗", progress: 15 },
  { label: "البحث عن كود التوثيق...", icon: "🔍", progress: 35 },
  { label: "التحقق من صحة البيانات...", icon: "🛡️", progress: 55 },
  { label: "مطابقة المحتوى الحرفي...", icon: "📄", progress: 75 },
  { label: "التحقق من سلامة التوقيع الرقمي...", icon: "🔐", progress: 90 },
  { label: "إنهاء عملية التحقق...", icon: "✅", progress: 100 },
];

// Extract NDMO verification code from text
function extractVerificationCode(text: string): string | null {
  // Match patterns like NDMO-DOC-2026-XXXX
  const match = text.match(/NDMO-DOC-\d{4}-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}

export default function PublicVerify() {
  const [, params] = useRoute("/public/verify/:code");
  const [code, setCode] = useState(params?.code || "");
  const [state, setState] = useState<VerifyState>("idle");
  const [scanPhaseIndex, setScanPhaseIndex] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-verify if code in URL
  useEffect(() => {
    if (params?.code) {
      setCode(params.code);
      handleVerify(params.code);
    }
  }, [params?.code]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const handleVerify = async (verifyCode?: string) => {
    const codeToVerify = verifyCode || code.trim();
    if (!codeToVerify) return;

    // Close camera if open
    stopCamera();
    setShowQrScanner(false);

    setState("scanning");
    setScanPhaseIndex(0);
    setResult(null);
    setError("");

    // Animate through scan phases
    for (let i = 0; i < scanPhases.length; i++) {
      setScanPhaseIndex(i);
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    }

    // Call API
    try {
      const res = await fetch(`/api/trpc/documentation.verify?input=${encodeURIComponent(JSON.stringify({ code: codeToVerify }))}`);
      const json = await res.json();
      const data = json?.result?.data;

      if (data?.valid) {
        setState("success");
        setResult(data);
      } else {
        setState("error");
        setError(data?.message || "لم يتم العثور على توثيق بهذا الكود");
      }
    } catch (err) {
      setState("error");
      setError("حدث خطأ في الاتصال بالخادم");
    }
  };

  // ─── File Upload Handler ───────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("processing");
    setUploadError("");

    try {
      // Check if it's an image file (for QR code extraction)
      if (file.type.startsWith("image/")) {
        // Create an image element to read the QR code
        const img = document.createElement("img");
        const reader = new FileReader();

        reader.onload = async (ev) => {
          img.onload = async () => {
            // Use canvas to process the image
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setUploadStatus("error");
              setUploadError("فشل في معالجة الصورة");
              return;
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try to detect QR code using the BarcodeDetector API (if available)
            if ("BarcodeDetector" in window) {
              try {
                const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
                const barcodes = await barcodeDetector.detect(img);
                if (barcodes.length > 0) {
                  const qrValue = barcodes[0].rawValue;
                  // Extract verification code from QR content
                  const extractedCode = extractVerificationCode(qrValue);
                  if (extractedCode) {
                    setCode(extractedCode);
                    setUploadStatus("idle");
                    handleVerify(extractedCode);
                    return;
                  }
                  // If QR contains a URL with the code
                  const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
                  if (urlMatch) {
                    setCode(urlMatch[1]);
                    setUploadStatus("idle");
                    handleVerify(urlMatch[1]);
                    return;
                  }
                  // Use the raw QR value as the code
                  setCode(qrValue);
                  setUploadStatus("idle");
                  handleVerify(qrValue);
                  return;
                }
              } catch (barcodeErr) {
                console.log("BarcodeDetector failed, trying fallback");
              }
            }

            // Fallback: Try to extract text from the image using OCR-like pattern matching
            // Look for NDMO-DOC pattern in the file name
            const fileNameCode = extractVerificationCode(file.name);
            if (fileNameCode) {
              setCode(fileNameCode);
              setUploadStatus("idle");
              handleVerify(fileNameCode);
              return;
            }

            // If no QR code found, show error with helpful message
            setUploadStatus("error");
            setUploadError(
              "لم يتم العثور على رمز QR في الصورة. يرجى التأكد من أن الصورة تحتوي على رمز QR واضح، أو أدخل كود التوثيق يدوياً."
            );
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        // Smart PDF text extraction using pdf.js
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          
          // Extract text from all pages
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");
            fullText += pageText + " ";
          }
          
          // Try to find NDMO-DOC verification code in extracted text
          const pdfCode = extractVerificationCode(fullText);
          if (pdfCode) {
            setCode(pdfCode);
            setUploadStatus("idle");
            handleVerify(pdfCode);
            return;
          }
          
          // Also try filename
          const fileNameCode = extractVerificationCode(file.name);
          if (fileNameCode) {
            setCode(fileNameCode);
            setUploadStatus("idle");
            handleVerify(fileNameCode);
            return;
          }
          
          setUploadStatus("error");
          setUploadError(
            "لم يتم العثور على كود توثيق (NDMO-DOC-XXXX-XXXX) في ملف PDF. يرجى التأكد من أن الملف يحتوي على كود التوثيق أو إدخاله يدوياً."
          );
        } catch (pdfErr) {
          console.error("PDF extraction error:", pdfErr);
          setUploadStatus("error");
          setUploadError("فشل في قراءة ملف PDF. يرجى التأكد من أن الملف غير تالف.");
        }
      } else {
        setUploadStatus("error");
        setUploadError("نوع الملف غير مدعوم. يرجى رفع صورة (PNG, JPG) أو ملف PDF يحتوي على كود التوثيق.");
      }
    } catch (err) {
      setUploadStatus("error");
      setUploadError("حدث خطأ أثناء معالجة الملف");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─── QR Camera Scanner ───────────────────────────
  const startQrScanner = async () => {
    setShowQrScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning for QR codes
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Use BarcodeDetector if available
        if ("BarcodeDetector" in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes.length > 0) {
              const qrValue = barcodes[0].rawValue;
              const extractedCode = extractVerificationCode(qrValue);
              if (extractedCode) {
                stopCamera();
                setShowQrScanner(false);
                setCode(extractedCode);
                handleVerify(extractedCode);
                return;
              }
              // Try URL pattern
              const urlMatch = qrValue.match(/verify\/([A-Z0-9-]+)/i);
              if (urlMatch) {
                stopCamera();
                setShowQrScanner(false);
                setCode(urlMatch[1]);
                handleVerify(urlMatch[1]);
                return;
              }
              // Use raw value
              stopCamera();
              setShowQrScanner(false);
              setCode(qrValue);
              handleVerify(qrValue);
            }
          } catch (err) {
            // BarcodeDetector not supported, continue scanning
          }
        }
      }, 500);
    } catch (err: any) {
      setShowQrScanner(false);
      if (err.name === "NotAllowedError") {
        setUploadError("تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح.");
      } else if (err.name === "NotFoundError") {
        setUploadError("لم يتم العثور على كاميرا. يرجى التأكد من توصيل الكاميرا.");
      } else {
        setUploadError("فشل في تشغيل الكاميرا. يرجى استخدام خيار رفع الملف بدلاً من ذلك.");
      }
    }
  };

  const closeQrScanner = () => {
    stopCamera();
    setShowQrScanner(false);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 30%, #132b52 60%, #0f2340 100%)",
      }}
    >
      <FloatingBubbles />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Hidden canvas for QR scanning */}
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
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
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

            {/* QR Scanner Modal */}
            {showQrScanner && (
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
                    onClick={closeQrScanner}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-400/30 rounded-xl" />
                    {/* Corner markers */}
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                    {/* Scan line */}
                    <div
                      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                      style={{ animation: "qr-scan-line 2s ease-in-out infinite" }}
                    />
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
                <label className="text-sm font-medium text-blue-200/80 block text-right">كود التوثيق</label>
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
                  onClick={startQrScanner}
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

              {/* Upload processing status */}
              {uploadStatus === "processing" && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300">جارٍ معالجة الملف واستخراج رمز QR...</span>
                </div>
              )}

              {/* Upload/Camera error message */}
              {(uploadStatus === "error" || uploadError) && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-right">
                  <p className="text-sm text-amber-300">{uploadError || uploadError}</p>
                  <button
                    onClick={() => { setUploadStatus("idle"); setUploadError(""); }}
                    className="text-xs text-blue-400 hover:underline mt-1"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>

            <p className="text-blue-300/30 text-xs">
              للتأكد من صحة بيانات التوثيق يرجى مسح الكود في منصة راصد الوطنية
            </p>
          </div>
        )}

        {/* Scanning animation */}
        {state === "scanning" && (
          <div className="w-full max-w-lg space-y-8 text-center">
            <div className="relative">
              {/* Rotating ring */}
              <div className="w-32 h-32 mx-auto relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-blue-500/20"
                  style={{ animation: "spin 3s linear infinite" }}
                />
                <div
                  className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 border-r-blue-400"
                  style={{ animation: "spin 1.5s linear infinite" }}
                />
                <div
                  className="absolute inset-4 rounded-full border-4 border-transparent border-b-cyan-400"
                  style={{ animation: "spin 2s linear infinite reverse" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-blue-400" style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }} />
                </div>
              </div>

              {/* Particle effects */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-blue-400/40"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-80px)`,
                    animation: `pulse-glow ${1 + i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">جارٍ التحقق...</h3>
              <p className="text-blue-200/60 text-sm mb-6">{scanPhases[scanPhaseIndex]?.label}</p>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-blue-900/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${scanPhases[scanPhaseIndex]?.progress || 0}%`,
                    background: "linear-gradient(90deg, #2563eb, #60a5fa, #38bdf8)",
                  }}
                />
              </div>

              {/* Phase steps */}
              <div className="mt-6 space-y-2 text-right max-w-xs mx-auto">
                {scanPhases.map((phase, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                      i < scanPhaseIndex
                        ? "text-emerald-400"
                        : i === scanPhaseIndex
                        ? "text-blue-300"
                        : "text-blue-300/20"
                    }`}
                  >
                    <span>{i < scanPhaseIndex ? "✓" : i === scanPhaseIndex ? "●" : "○"}</span>
                    <span>{phase.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Success result */}
        {state === "success" && result && (
          <div className="w-full max-w-lg space-y-6 text-center">
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
                      <p className="text-white">{new Date(result.document.createdAt).toLocaleDateString("ar-SA")}</p>
                    </div>
                    <div>
                      <p className="text-blue-300/50 text-xs mb-1">صادر بواسطة</p>
                      <p className="text-white">{result.document.generatedBy}</p>
                    </div>
                    <div>
                      <p className="text-blue-300/50 text-xs mb-1">عنوان الحادثة</p>
                      <p className="text-white">{result.document.leakTitle}</p>
                    </div>
                  </div>
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
              onClick={() => { setState("idle"); setCode(""); setResult(null); }}
              variant="outline"
              className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              تحقق من وثيقة أخرى
            </Button>
          </div>
        )}

        {/* Error result */}
        {state === "error" && (
          <div className="w-full max-w-lg space-y-6 text-center">
            <div>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">التوثيق غير صالح</h2>
              <p className="text-blue-200/60 text-sm">{error}</p>
            </div>

            <Button
              onClick={() => { setState("idle"); setCode(""); setError(""); }}
              variant="outline"
              className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              حاول مرة أخرى
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-blue-300/30 text-xs">
          © 2026 مكتب إدارة البيانات الوطنية — منصة راصد
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
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
