/**
 * ScheduledReports — Automated compliance report scheduling
 * Manage weekly/monthly/quarterly automated report generation
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useNdmoAuth } from "@/hooks/useNdmoAuth";
import { DetailModal } from "@/components/DetailModal";

const frequencyLabels: Record<string, { ar: string; en: string }> = {
  weekly: { ar: "أسبوعي", en: "Weekly" },
  monthly: { ar: "شهري", en: "Monthly" },
  quarterly: { ar: "ربع سنوي", en: "Quarterly" },
};

const templateLabels: Record<string, { ar: string; en: string; icon: string }> = {
  executive_summary: { ar: "ملخص تنفيذي", en: "Executive Summary", icon: "📊" },
  full_detail: { ar: "تقرير مفصل", en: "Full Detail", icon: "📋" },
  compliance: { ar: "تقرير الامتثال", en: "Compliance", icon: "✅" },
  sector_analysis: { ar: "تحليل القطاعات", en: "Sector Analysis", icon: "📈" },
};

export default function ScheduledReports() {
  const { isAdmin } = useNdmoAuth();
  const { data: reports, isLoading, refetch } = trpc.scheduledReports.list.useQuery();
  const createMutation = trpc.scheduledReports.create.useMutation({
    onSuccess: () => { refetch(); toast.success("تم إنشاء التقرير المجدول"); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.scheduledReports.update.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث التقرير"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("تم حذف التقرير"); },
    onError: (e) => toast.error(e.message),
  });
  const runNowMutation = trpc.scheduledReports.runNow.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`تم تنفيذ ${data.generated} تقرير(ات) بنجاح`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    name: "",
    nameAr: "",
    frequency: "weekly" as "weekly" | "monthly" | "quarterly",
    template: "executive_summary" as "executive_summary" | "full_detail" | "compliance" | "sector_analysis",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            إدارة التقارير التلقائية التي يتم إنشاؤها وإرسالها حسب الجدول الزمني
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-xs"
                onClick={() => runNowMutation.mutate()}
                disabled={runNowMutation.isPending}
              >
                {runNowMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                تنفيذ الآن
              </Button>
              <Button
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                تقرير جديد
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            إنشاء تقرير مجدول جديد
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">اسم التقرير (English)</label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="Weekly Executive Summary"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">اسم التقرير (عربي)</label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="ملخص تنفيذي أسبوعي"
                value={newReport.nameAr}
                onChange={(e) => setNewReport({ ...newReport, nameAr: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">التكرار</label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                value={newReport.frequency}
                onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value as any })}
              >
                {Object.entries(frequencyLabels).map(([key, val]) => (
                  <option key={key} value={key}>{val.ar} ({val.en})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">القالب</label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                value={newReport.template}
                onChange={(e) => setNewReport({ ...newReport, template: e.target.value as any })}
              >
                {Object.entries(templateLabels).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.ar}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => createMutation.mutate(newReport)}
              disabled={!newReport.name || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              إنشاء
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports?.map((report, i) => {
          const freq = frequencyLabels[report.frequency] || { ar: report.frequency, en: report.frequency };
          const tmpl = templateLabels[report.template] || { ar: report.template, en: report.template, icon: "📄" };
          const nextRun = report.nextRunAt ? new Date(report.nextRunAt) : null;
          const lastRun = report.lastRunAt ? new Date(report.lastRunAt) : null;

          return (
            <div key={report.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card/60 backdrop-blur-sm border rounded-xl p-5 group cursor-pointer hover:scale-[1.02] transition-all ${
                  report.isEnabled ? "border-border/50" : "border-border/30 opacity-60"
                }`}
                onClick={() => setActiveModal(`report-${report.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tmpl.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{report.nameAr || report.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{report.name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    report.isEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"
                  }`}>
                    {report.isEnabled ? "نشط" : "متوقف"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>التكرار: <span className="text-foreground">{freq.ar}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    <span>القالب: <span className="text-foreground">{tmpl.ar}</span></span>
                  </div>
                  {lastRun && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>آخر تنفيذ: <span className="text-foreground">{lastRun.toLocaleDateString("ar-SA")}</span></span>
                    </div>
                  )}
                  {nextRun && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>التنفيذ القادم: <span className="text-foreground">{nextRun.toLocaleDateString("ar-SA")}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>عدد التنفيذات: <span className="text-foreground font-bold">{report.totalRuns ?? 0}</span></span>
                  </div>
                </div>

                <p className="text-[9px] text-primary/50 mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  اضغط للتفاصيل ←
                </p>

                {isAdmin && (
                  <div className="flex gap-2 pt-3 mt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs h-8"
                      onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: report.id, isEnabled: !report.isEnabled }); }}
                      disabled={updateMutation.isPending}
                    >
                      {report.isEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {report.isEnabled ? "إيقاف" : "تفعيل"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs h-8 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("هل أنت متأكد من حذف هذا التقرير المجدول؟")) {
                          deleteMutation.mutate({ id: report.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
              <DetailModal
                open={activeModal === `report-${report.id}`}
                onClose={() => setActiveModal(null)}
                title={report.nameAr || report.name}
                icon={<span className="text-2xl">{tmpl.icon}</span>}
              >
                <div className="space-y-4 text-sm rtl">
                  <p className="text-muted-foreground text-center -mt-2 mb-4">{report.name}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-black/10 dark:bg-white/5 p-4 rounded-lg">
                    <div className="font-semibold text-muted-foreground">الحالة</div>
                    <div className={`font-bold ${report.isEnabled ? "text-emerald-400" : "text-zinc-400"}`}>
                      {report.isEnabled ? "نشط" : "متوقف"}
                    </div>
                    <div className="font-semibold text-muted-foreground">التكرار</div>
                    <div>{freq.ar} ({freq.en})</div>
                    <div className="font-semibold text-muted-foreground">قالب التقرير</div>
                    <div>{tmpl.ar}</div>
                    <div className="font-semibold text-muted-foreground">إجمالي التنفيذات</div>
                    <div className="font-mono font-bold text-lg">{report.totalRuns ?? 0}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="font-semibold text-muted-foreground">تاريخ الإنشاء</div>
                    <div>{new Date(report.createdAt).toLocaleString("ar-SA", { dateStyle: 'short', timeStyle: 'short' })}</div>
                    {lastRun && (
                      <>
                        <div className="font-semibold text-muted-foreground">آخر تنفيذ</div>
                        <div>{lastRun.toLocaleString("ar-SA", { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </>
                    )}
                    {nextRun && (
                      <>
                        <div className="font-semibold text-muted-foreground">التنفيذ القادم</div>
                        <div>{nextRun.toLocaleString("ar-SA", { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </>
                    )}
                  </div>
                </div>
              </DetailModal>
            </div>
          );
        })}
      </div>

      {(!reports || reports.length === 0) && (
        <div className="text-center py-12">
          <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">لا توجد تقارير مجدولة</p>
          <p className="text-xs text-muted-foreground mt-1">أنشئ تقريراً مجدولاً لبدء التقارير التلقائية</p>
        </div>
      )}
    </div>
  );
}
