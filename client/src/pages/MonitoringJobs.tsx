/**
 * MonitoringJobs — Scheduled background monitoring job dashboard
 * All stats and job cards are clickable with detail modals
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Play,
  Pause,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Globe,
  Send,
  FileText,
  Activity,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";

const platformIcons: Record<string, React.ElementType> = {
  telegram: Send,
  darkweb: Globe,
  paste: FileText,
  all: Activity,
};

const platformLabels: Record<string, { ar: string; en: string }> = {
  telegram: { ar: "تليجرام", en: "Telegram" },
  darkweb: { ar: "الدارك ويب", en: "Dark Web" },
  paste: { ar: "مواقع اللصق", en: "Paste Sites" },
  all: { ar: "جميع المنصات", en: "All Platforms" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "نشط", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  paused: { label: "متوقف", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Pause },
  running: { label: "قيد التشغيل", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Loader2 },
  error: { label: "خطأ", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
};

function formatDate(date: Date | string | null) {
  if (!date) return "لم يتم التشغيل بعد";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function MonitoringJobs() {
  const { data: jobs, isLoading, refetch } = trpc.jobs.list.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const triggerMutation = trpc.jobs.trigger.useMutation({
    onSuccess: (_, vars) => {
      toast.success("تم تشغيل المهمة", { description: `Job ${vars.jobId} triggered` });
      refetch();
    },
    onError: () => {
      toast.error("فشل تشغيل المهمة", { description: "Failed to trigger job" });
    },
  });

  const toggleMutation = trpc.jobs.toggleStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "active" ? "تم استئناف المهمة" : "تم إيقاف المهمة",
        { description: `Job ${vars.jobId} ${vars.status === "active" ? "resumed" : "paused"}` }
      );
      refetch();
    },
  });

  // Listen for real-time job updates
  const { lastJobUpdate } = useWebSocket();
  useEffect(() => {
    if (lastJobUpdate) {
      refetch();
    }
  }, [lastJobUpdate]);

  // Summary stats
  const activeJobs = jobs?.filter((j) => j.status === "active").length ?? 0;
  const totalRuns = jobs?.reduce((sum, j) => sum + (j.totalRuns ?? 0), 0) ?? 0;
  const totalLeaksFound = jobs?.reduce((sum, j) => sum + (j.leaksFound ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">مهام الرصد المجدولة</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoring Jobs — إدارة مهام الفحص التلقائي</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent border-border"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </Button>
      </div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "activeJobs", label: "المهام النشطة", labelEn: "Active Jobs", value: activeJobs, icon: Radio, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "totalRuns", label: "إجمالي التشغيلات", labelEn: "Total Runs", value: totalRuns, icon: RefreshCw, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "leaksFound", label: "تسريبات مكتشفة", labelEn: "Leaks Found", value: totalLeaksFound, icon: AlertTriangle, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
          { key: "totalJobs", label: "إجمالي المهام", labelEn: "Total Jobs", value: jobs?.length ?? 0, icon: Clock, color: "text-purple-400", borderColor: "border-purple-500/20", bgColor: "bg-purple-500/5" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group`}
              onClick={() => setActiveModal(stat.key)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-secondary`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold text-foreground`}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
              <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
            </motion.div>
          );
        })}
      </div>

      {/* Jobs list — clickable */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-secondary/30 border border-border rounded-xl p-12 text-center">
          <Radio className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">لا توجد مهام مجدولة</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job, idx) => {
            const PlatformIcon = platformIcons[job.platform] || Activity;
            const platLabel = platformLabels[job.platform] || platformLabels.all;
            const statusConf = statusConfig[job.status] || statusConfig.active;
            const StatusIcon = statusConf.icon;
            const isRunning = job.status === "running";

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-secondary/30 border border-border rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => { setSelectedJob(job); setActiveModal("jobDetail"); }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Job info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <PlatformIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{job.nameAr}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusConf.color}`}>
                          <StatusIcon className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                          {statusConf.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {platLabel.ar}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {job.cronExpression}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs bg-transparent border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      onClick={() => triggerMutation.mutate({ jobId: job.jobId })}
                      disabled={isRunning || triggerMutation.isPending}
                    >
                      {isRunning ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      تشغيل يدوي
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 text-xs bg-transparent border-border ${
                        job.status === "active"
                          ? "hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
                          : "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                      }`}
                      onClick={() =>
                        toggleMutation.mutate({
                          jobId: job.jobId,
                          status: job.status === "active" ? "paused" : "active",
                        })
                      }
                      disabled={isRunning}
                    >
                      {job.status === "active" ? (
                        <>
                          <Pause className="w-3 h-3" />
                          إيقاف
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          استئناف
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Job details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/30">
                  <div>
                    <p className="text-[10px] text-muted-foreground">آخر تشغيل</p>
                    <p className="text-xs text-foreground mt-0.5">{formatDate(job.lastRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">إجمالي التشغيلات</p>
                    <p className="text-xs text-foreground mt-0.5 font-bold">{job.totalRuns ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">تسريبات مكتشفة</p>
                    <p className="text-xs text-amber-400 mt-0.5 font-bold">{job.leaksFound ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">آخر نتيجة</p>
                    <p className="text-xs text-foreground mt-0.5 truncate">{job.lastResult || "—"}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Active Jobs Modal */}
      <DetailModal open={activeModal === "activeJobs"} onClose={() => setActiveModal(null)} title="المهام النشطة" icon={<Radio className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
            <p className="text-2xl font-bold text-emerald-400">{activeJobs}</p>
            <p className="text-xs text-muted-foreground">مهمة نشطة</p>
          </div>
          {jobs?.filter(j => j.status === "active").map(job => {
            const PIcon = platformIcons[job.platform] || Activity;
            return (
              <div key={job.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setSelectedJob(job); setActiveModal("jobDetail"); }}>
                <div className="flex items-center gap-2 mb-1">
                  <PIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{job.nameAr}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{platformLabels[job.platform]?.ar} • {job.cronExpression}</p>
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Total Runs Modal */}
      <DetailModal open={activeModal === "totalRuns"} onClose={() => setActiveModal(null)} title="إجمالي التشغيلات" icon={<RefreshCw className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-3">
          <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
            <p className="text-2xl font-bold text-cyan-400">{totalRuns}</p>
            <p className="text-xs text-muted-foreground">تشغيل إجمالي</p>
          </div>
          {jobs?.sort((a, b) => (b.totalRuns ?? 0) - (a.totalRuns ?? 0)).map(job => (
            <div key={job.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{job.nameAr}</p>
                <p className="text-[10px] text-muted-foreground">آخر تشغيل: {formatDate(job.lastRunAt)}</p>
              </div>
              <span className="text-lg font-bold text-cyan-400">{job.totalRuns ?? 0}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Leaks Found Modal */}
      <DetailModal open={activeModal === "leaksFound"} onClose={() => setActiveModal(null)} title="التسريبات المكتشفة بواسطة المهام" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
            <p className="text-2xl font-bold text-amber-400">{totalLeaksFound}</p>
            <p className="text-xs text-muted-foreground">تسريب مكتشف</p>
          </div>
          {jobs?.filter(j => (j.leaksFound ?? 0) > 0).sort((a, b) => (b.leaksFound ?? 0) - (a.leaksFound ?? 0)).map(job => (
            <div key={job.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{job.nameAr}</p>
                <p className="text-[10px] text-muted-foreground">{platformLabels[job.platform]?.ar}</p>
              </div>
              <span className="text-lg font-bold text-amber-400">{job.leaksFound ?? 0}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Total Jobs Modal */}
      <DetailModal open={activeModal === "totalJobs"} onClose={() => setActiveModal(null)} title="جميع المهام" icon={<Clock className="w-5 h-5 text-purple-400" />}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
              <p className="text-xl font-bold text-emerald-400">{jobs?.filter(j => j.status === "active").length ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">نشطة</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
              <p className="text-xl font-bold text-amber-400">{jobs?.filter(j => j.status === "paused").length ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">متوقفة</p>
            </div>
          </div>
          {jobs?.map(job => {
            const sc = statusConfig[job.status] || statusConfig.active;
            return (
              <div key={job.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setSelectedJob(job); setActiveModal("jobDetail"); }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{job.nameAr}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${sc.color}`}>{sc.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Job Detail Modal */}
      <DetailModal
        open={activeModal === "jobDetail" && !!selectedJob}
        onClose={() => { setActiveModal(null); setSelectedJob(null); }}
        title={selectedJob?.nameAr || "تفاصيل المهمة"}
        icon={<Activity className="w-5 h-5 text-primary" />}
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              {(() => { const PI = platformIcons[selectedJob.platform] || Activity; return <PI className="w-8 h-8 text-primary" />; })()}
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedJob.nameAr}</h3>
                <p className="text-xs text-muted-foreground">{selectedJob.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <span className={`text-sm font-bold mt-1 inline-block px-2 py-0.5 rounded border ${(statusConfig[selectedJob.status] || statusConfig.active).color}`}>
                  {(statusConfig[selectedJob.status] || statusConfig.active).label}
                </span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">المنصة</p>
                <p className="text-sm font-bold text-foreground mt-1">{platformLabels[selectedJob.platform]?.ar || selectedJob.platform}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التشغيلات</p>
                <p className="text-lg font-bold text-cyan-400 mt-1">{selectedJob.totalRuns ?? 0}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التسريبات</p>
                <p className="text-lg font-bold text-amber-400 mt-1">{selectedJob.leaksFound ?? 0}</p>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">الجدول الزمني</h4>
              <p className="text-sm text-foreground font-mono">{selectedJob.cronExpression}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
                <p className="text-xs text-muted-foreground">آخر تشغيل</p>
                <p className="text-sm text-foreground mt-1">{formatDate(selectedJob.lastRunAt)}</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
                <p className="text-xs text-muted-foreground">آخر نتيجة</p>
                <p className="text-sm text-foreground mt-1">{selectedJob.lastResult || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
