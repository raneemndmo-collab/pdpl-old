/**
 * ComplianceWarningDialog — Strict compliance warning before report generation
 * Shows a formal warning about data protection responsibilities
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  FileWarning,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComplianceWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  reportType?: string;
}

export default function ComplianceWarningDialog({
  open,
  onConfirm,
  onCancel,
  reportType = "تقرير",
}: ComplianceWarningDialogProps) {
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-card border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Header */}
            <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-b border-amber-500/20 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">تنبيه أمني — إقرار مسؤولية</h3>
                  <p className="text-xs text-amber-400 mt-0.5">يرجى قراءة الإقرار بعناية قبل المتابعة</p>
                </div>
                <button onClick={onCancel} className="mr-auto p-2 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Warning Content */}
            <div className="p-5 space-y-4">
              {/* Main Warning */}
              <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      منصة <span className="text-primary font-bold">راصد</span> مُصممة لحماية البيانات الشخصية وفقاً لنظام حماية البيانات الشخصية (PDPL) ومتطلبات مكتب إدارة البيانات الوطنية (NDMO).
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      إصدار التقارير والوثائق يجب أن يكون <span className="font-bold text-amber-400">حصرياً</span> لأغراض المهام الرسمية المعتمدة في مكتب إدارة البيانات الوطنية.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-400 font-semibold">تحذير قانوني</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      أي استخدام لهذه التقارير أو الوثائق خارج نطاق المهام الرسمية المعتمدة يُعد مخالفة صريحة للأنظمة واللوائح المعمول بها، ويستوجب المساءلة النظامية وفقاً لما تنص عليه الأنظمة واللوائح ذات العلاقة.
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">
                      سيتم حفظ تفاصيل هذا الطلب (هوية المستخدم، التاريخ والوقت، نوع التقرير، والمحتوى) في سجل التدقيق الأمني للمراجعة من قبل المختصين.
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit Info */}
              <div className="bg-secondary/30 rounded-xl p-3 border border-border/30 flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-semibold">سجل التدقيق:</span> سيتم تسجيل هذا الإجراء تلقائياً بالتفاصيل الكاملة (المستخدم، التاريخ، الوقت، نوع {reportType}، المحتوى المطلوب)
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  أُقر بأنني أطلب هذا {reportType} لأغراض المهام الرسمية المعتمدة في مكتب إدارة البيانات الوطنية، وأتحمل المسؤولية الكاملة عن أي استخدام غير مصرح به.
                </span>
              </label>

              {/* Motto */}
              <div className="text-center">
                <p className="text-[11px] text-primary/70 font-semibold">
                  ❝ حماية البيانات الشخصية متطلب وطني ❞
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex items-center gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                إلغاء
              </Button>
              <Button
                className={`flex-1 gap-2 ${
                  agreed
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                disabled={!agreed}
                onClick={() => {
                  if (agreed) {
                    setAgreed(false);
                    onConfirm();
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                أوافق وأتابع الإصدار
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
