/**
 * ComplianceWarningDialog — Ultra Premium secret-level compliance warning
 * Dramatic security-themed dialog with animations, official stamps, and national feel
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Scale,
  Fingerprint,
  Eye,
  FileWarning,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RASID_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/tSiomIdoNdNFAtOB.png"; // Full brand logo (cream+gold for dark bg)

interface ComplianceWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  reportType?: string;
}

/* ─── Animated Security Particles ─── */
function SecurityParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0
              ? "rgba(239, 68, 68, 0.4)"
              : i % 3 === 1
              ? "rgba(245, 158, 11, 0.4)"
              : "rgba(59, 130, 246, 0.3)",
            animation: `compliance-particle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Rotating Security Ring ─── */
function SecurityRing() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Outer rotating ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "2px solid transparent",
          borderTopColor: "rgba(239, 68, 68, 0.6)",
          borderRightColor: "rgba(245, 158, 11, 0.4)",
          animation: "compliance-spin 3s linear infinite",
        }}
      />
      {/* Middle counter-rotating ring */}
      <div
        className="absolute inset-2 rounded-full"
        style={{
          border: "2px solid transparent",
          borderBottomColor: "rgba(239, 68, 68, 0.4)",
          borderLeftColor: "rgba(245, 158, 11, 0.3)",
          animation: "compliance-spin 2s linear infinite reverse",
        }}
      />
      {/* Inner pulsing ring */}
      <div
        className="absolute inset-4 rounded-full"
        style={{
          border: "1px solid rgba(239, 68, 68, 0.3)",
          animation: "compliance-pulse-ring 2s ease-in-out infinite",
        }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-400" style={{ animation: "compliance-icon-pulse 2s ease-in-out infinite" }} />
        </div>
      </div>
      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: i % 2 === 0 ? "rgba(239, 68, 68, 0.6)" : "rgba(245, 158, 11, 0.5)",
            top: "50%",
            left: "50%",
            transform: `rotate(${deg}deg) translateY(-46px)`,
            animation: `compliance-orbit-dot ${2 + i * 0.3}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Scan Line Effect ─── */
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), rgba(245, 158, 11, 0.2), transparent)",
          animation: "compliance-scan-line 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function ComplianceWarningDialog({
  open,
  onConfirm,
  onCancel,
  reportType = "تقرير",
}: ComplianceWarningDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (open) {
      setAgreed(false);
      setShowContent(false);
      // Dramatic entrance delay
      const t = setTimeout(() => setShowContent(true), 400);
      // Update time
      setCurrentTime(
        new Date().toLocaleString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Riyadh",
        })
      );
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          {/* Dramatic dark overlay with vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)",
              backdropFilter: "blur(12px)",
            }}
          />

          {/* Red ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 60%)",
            }}
          />

          <SecurityParticles />

          <motion.div
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280, delay: 0.1 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, rgba(15, 10, 20, 0.98) 0%, rgba(20, 12, 15, 0.98) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              boxShadow: "0 0 60px rgba(239, 68, 68, 0.1), 0 0 120px rgba(239, 68, 68, 0.05), 0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            <ScanLine />

            {/* ═══ TOP SECRET STAMP BANNER ═══ */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative overflow-hidden"
            >
              {/* Red-to-dark gradient header */}
              <div
                className="px-6 py-5"
                style={{
                  background: "linear-gradient(135deg, rgba(127, 29, 29, 0.5) 0%, rgba(153, 27, 27, 0.3) 30%, rgba(20, 12, 15, 0.9) 100%)",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {/* Corner security markers */}
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-red-500/40 rounded-tr" />
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-red-500/40 rounded-tl" />

                <div className="flex items-center gap-4">
                  <SecurityRing />
                  <div className="flex-1 min-w-0">
                    {/* سري جداً stamp */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="px-3 py-1 rounded-md text-xs font-bold tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(185, 28, 28, 0.4))",
                          border: "1px solid rgba(239, 68, 68, 0.5)",
                          color: "#fca5a5",
                          letterSpacing: "0.15em",
                          animation: "compliance-stamp-glow 2s ease-in-out infinite",
                        }}
                      >
                        ⛔ سري جداً — TOP SECRET
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">إقرار مسؤولية وتعهد رسمي</h3>
                    <p className="text-[11px] text-red-300/60 mt-1">
                      Official Responsibility Acknowledgment — NDMO Classification: Restricted
                    </p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors self-start"
                  >
                    <X className="w-4 h-4 text-red-300/50" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ═══ CONTENT BODY ═══ */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="px-6 py-5 space-y-4"
                >
                  {/* Platform Identity */}
                  <div className="flex items-center justify-center gap-3 py-3">
                    <img src={RASID_LOGO} alt="منصة راصد" className="w-16 h-auto object-contain" style={{ animation: "compliance-icon-pulse 3s ease-in-out infinite", filter: 'drop-shadow(0 0 8px rgba(61,177,172,0.15))' }} />
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">منصة راصد — مكتب إدارة البيانات الوطنية</p>
                      <p className="text-[10px] text-red-300/40">National Data Management Office — Rasid Platform</p>
                    </div>
                  </div>

                  {/* ─── Main Warning Block ─── */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-4 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.05))",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    {/* Diagonal security pattern */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.03]"
                      style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(239,68,68,1) 20px, rgba(239,68,68,1) 21px)`,
                      }}
                    />
                    <div className="relative flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" style={{ animation: "compliance-icon-pulse 2s ease-in-out infinite" }} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-white leading-relaxed font-medium">
                          هذا الإجراء يتضمن إصدار <span className="text-red-400 font-bold">{reportType}</span> يحتوي على بيانات شخصية مصنفة.
                          المنصة مُصممة لحماية البيانات الشخصية وفقاً لـ<span className="text-amber-400 font-semibold">نظام حماية البيانات الشخصية (PDPL)</span>.
                        </p>
                        <p className="text-sm text-red-200/80 leading-relaxed">
                          إصدار الوثائق والتقارير يجب أن يكون <span className="font-bold text-red-400 underline underline-offset-2 decoration-red-400/40">حصرياً</span> لأغراض المهام الرسمية المعتمدة.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* ─── Legal Warning Block ─── */}
                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="rounded-xl p-4 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(185, 28, 28, 0.1), rgba(127, 29, 29, 0.08))",
                      border: "1px solid rgba(185, 28, 28, 0.25)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-900/30 border border-red-800/30 flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5 text-red-300" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-red-300 font-bold">تحذير قانوني</p>
                          <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                            LEGAL NOTICE
                          </div>
                        </div>
                        <p className="text-xs text-red-100/70 leading-relaxed">
                          أي استخدام لهذه الوثائق خارج نطاق المهام الرسمية المعتمدة يُعد <span className="text-red-400 font-semibold">مخالفة صريحة</span> للأنظمة واللوائح المعمول بها، ويستوجب المساءلة النظامية الكاملة وفقاً لما تنص عليه الأنظمة واللوائح ذات العلاقة.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* ─── Audit Trail Notice ─── */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{
                      background: "rgba(30, 20, 40, 0.5)",
                      border: "1px solid rgba(100, 80, 120, 0.2)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-4 h-4 text-violet-400" style={{ animation: "compliance-icon-pulse 2.5s ease-in-out infinite" }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-violet-300/80 font-medium">سجل التدقيق الأمني — Audit Trail</p>
                      <p className="text-[10px] text-violet-200/50">
                        سيتم تسجيل: هوية المستخدم • التاريخ والوقت • نوع {reportType} • المحتوى • عنوان IP
                      </p>
                    </div>
                    <div className="mr-auto text-[9px] text-violet-300/30 font-mono whitespace-nowrap">
                      {currentTime}
                    </div>
                  </motion.div>

                  {/* ─── Monitoring Notice ─── */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center justify-center gap-4 py-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-amber-400/50" />
                      <span className="text-[9px] text-amber-300/40">مراقبة مستمرة</span>
                    </div>
                    <div className="w-px h-3 bg-amber-500/20" />
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400/50" />
                      <span className="text-[9px] text-amber-300/40">تشفير شامل</span>
                    </div>
                    <div className="w-px h-3 bg-amber-500/20" />
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3 text-amber-400/50" />
                      <span className="text-[9px] text-amber-300/40">توقيع رقمي</span>
                    </div>
                  </motion.div>

                  {/* ─── Agreement Checkbox ─── */}
                  <motion.label
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-all duration-300 ${
                      agreed
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-red-500/15 bg-red-500/[0.02] hover:border-red-500/30"
                    }`}
                    style={{ border: `1px solid ${agreed ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.15)"}` }}
                  >
                    <div className={`relative w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all duration-300 ${
                      agreed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-red-400/40 bg-transparent"
                    }`}>
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {agreed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 15, stiffness: 400 }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-white/90 leading-relaxed block">
                        أُقر وأتعهد بأنني أطلب هذا <span className="text-red-400 font-bold">{reportType}</span> لأغراض المهام الرسمية المعتمدة حصرياً في مكتب إدارة البيانات الوطنية، وأتحمل المسؤولية القانونية الكاملة عن أي استخدام غير مصرح به لهذه الوثيقة.
                      </span>
                      <span className="text-[10px] text-red-300/40 block mt-1">
                        I acknowledge this {reportType} is strictly for NDMO official duties and accept full legal responsibility.
                      </span>
                    </div>
                  </motion.label>

                  {/* ─── National Motto ─── */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center py-1"
                  >
                    <p className="text-[11px] font-semibold" style={{ color: "rgba(239, 68, 68, 0.5)" }}>
                      ❝ حماية البيانات الشخصية متطلب وطني ❞
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ ACTIONS ═══ */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="px-6 py-4 flex items-center gap-3"
              style={{
                borderTop: "1px solid rgba(239, 68, 68, 0.1)",
                background: "rgba(10, 5, 15, 0.5)",
              }}
            >
              <Button
                variant="outline"
                className="flex-1 h-11 border-red-500/20 text-red-300/70 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
                onClick={onCancel}
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button
                className={`flex-1 h-11 gap-2 font-semibold transition-all duration-500 ${
                  agreed
                    ? "text-white shadow-lg"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                }`}
                style={
                  agreed
                    ? {
                        background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)",
                        boxShadow: "0 0 20px rgba(5, 150, 105, 0.3), 0 4px 12px rgba(0,0,0,0.3)",
                      }
                    : {}
                }
                disabled={!agreed}
                onClick={() => {
                  if (agreed) {
                    setAgreed(false);
                    onConfirm();
                  }
                }}
              >
                {agreed ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    أوافق وأتعهد — متابعة الإصدار
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    يرجى الموافقة على الإقرار أولاً
                  </>
                )}
              </Button>
            </motion.div>

            {/* Corner security markers on dialog */}
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-red-500/20 rounded-br pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-red-500/20 rounded-bl pointer-events-none" />
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes compliance-particle {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-30px) scale(1); }
        }
        @keyframes compliance-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes compliance-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes compliance-icon-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes compliance-orbit-dot {
          0%, 100% { opacity: 0.3; transform: rotate(var(--start-deg, 0deg)) translateY(-46px) scale(0.8); }
          50% { opacity: 1; transform: rotate(var(--start-deg, 0deg)) translateY(-46px) scale(1.3); }
        }
        @keyframes compliance-scan-line {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes compliance-stamp-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.1); }
          50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.25); }
        }
      `}</style>
    </AnimatePresence>
  );
}
