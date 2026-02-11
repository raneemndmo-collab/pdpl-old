/**
 * AuditLog — Compliance audit trail page
 * Shows all user actions with filtering by category
 * Admin-only access with CSV export
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Filter,
  Search,
  Shield,
  LogIn,
  FileOutput,
  ScanSearch,
  Users,
  BarChart3,
  Activity,
  Radio,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";

const categoryConfig: Record<string, { label: string; labelEn: string; icon: React.ElementType; color: string }> = {
  auth: { label: "المصادقة", labelEn: "Auth", icon: LogIn, color: "text-blue-400 bg-blue-500/10" },
  leak: { label: "التسريبات", labelEn: "Leaks", icon: Shield, color: "text-red-400 bg-red-500/10" },
  export: { label: "التصدير", labelEn: "Export", icon: FileOutput, color: "text-emerald-400 bg-emerald-500/10" },
  pii: { label: "فحص PII", labelEn: "PII Scan", icon: ScanSearch, color: "text-purple-400 bg-purple-500/10" },
  user: { label: "المستخدمين", labelEn: "Users", icon: Users, color: "text-amber-400 bg-amber-500/10" },
  report: { label: "التقارير", labelEn: "Reports", icon: BarChart3, color: "text-cyan-400 bg-cyan-500/10" },
  system: { label: "النظام", labelEn: "System", icon: Activity, color: "text-zinc-500 bg-zinc-500/10" },
  monitoring: { label: "الرصد", labelEn: "Monitoring", icon: Radio, color: "text-teal-400 bg-teal-500/10" },
};

export default function AuditLog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: auditLogs, isLoading } = trpc.audit.list.useQuery(
    { category: selectedCategory !== "all" ? selectedCategory : undefined, limit: 200 },
    { refetchInterval: 15000 }
  );

  const { refetch: fetchCsv } = trpc.audit.exportCsv.useQuery(
    { category: selectedCategory !== "all" ? selectedCategory : undefined },
    { enabled: false }
  );

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!searchQuery) return auditLogs;
    const q = searchQuery.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        (log.details?.toLowerCase().includes(q)) ||
        (log.userName?.toLowerCase().includes(q))
    );
  }, [auditLogs, searchQuery]);

  const activeLog = useMemo(() => {
    if (!activeModal || !activeModal.startsWith("log-")) return null;
    const logId = activeModal.replace("log-", "");
    return auditLogs?.find((log) => String(log.id) === logId);
  }, [activeModal, auditLogs]);

  const handleExportCsv = async () => {
    try {
      const result = await fetchCsv();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير سجل المراجعة", { description: "Audit log exported successfully" });
      }
    } catch {
      toast.error("فشل التصدير", { description: "Export failed" });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = [
    { key: "total", label: "إجمالي السجلات", value: auditLogs?.length ?? 0, color: "text-cyan-400" },
    { key: "auth", label: "المصادقة", value: auditLogs?.filter((l) => l.category === "auth").length ?? 0, color: "text-blue-400" },
    { key: "leak", label: "التسريبات", value: auditLogs?.filter((l) => l.category === "leak").length ?? 0, color: "text-red-400" },
    { key: "export", label: "التصدير", value: auditLogs?.filter((l) => l.category === "export").length ?? 0, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">سجل المراجعة</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit Log — تتبع جميع الإجراءات للامتثال</p>
        </div>
        <Button
          onClick={handleExportCsv}
          className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          تصدير CSV
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          className={`text-xs gap-1.5 ${selectedCategory === "all" ? "" : "bg-transparent border-border"}`}
          onClick={() => setSelectedCategory("all")}
        >
          <Filter className="w-3 h-3" />
          الكل
        </Button>
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              className={`text-xs gap-1.5 ${selectedCategory === key ? "" : "bg-transparent border-border"}`}
              onClick={() => setSelectedCategory(key)}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="بحث في السجلات... Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pr-10 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            onClick={() => setActiveModal(`stat-${stat.key}`)}
            className="glass-card rounded-lg p-3 text-center cursor-pointer hover:scale-[1.02] transition-all group"
          >
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              اضغط للتفاصيل ←
            </p>
          </div>
        ))}
      </div>

      {/* Audit log table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">لا توجد سجلات</p>
            <p className="text-xs mt-1">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">الوقت</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">الفئة</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">المستخدم</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">الإجراء</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const catConfig = categoryConfig[log.category] || categoryConfig.system;
                  const CatIcon = catConfig.icon;
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setActiveModal(`log-${log.id}`)}
                      className="border-b border-border/30 hover:bg-accent/20 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${catConfig.color}`}>
                          <CatIcon className="w-3 h-3" />
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        {log.userName || (log.userId ? `User #${log.userId}` : "النظام")}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground font-mono">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate relative">
                        {log.details || "—"}
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity">... اضغط للتفاصيل</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DetailModal
        open={activeModal === "stat-total"}
        onClose={() => setActiveModal(null)}
        title="تفاصيل إجمالي السجلات"
        icon={<BarChart3 />}
      >
        <p className="text-sm text-muted-foreground">هذا الرقم يمثل العدد الإجمالي لجميع الإجراءات المسجلة في نظام المراقبة. ويشمل كل الفئات من مصادقة المستخدمين إلى أنشطة النظام.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "stat-auth"}
        onClose={() => setActiveModal(null)}
        title="تفاصيل سجلات المصادقة"
        icon={<LogIn />}
      >
        <p className="text-sm text-muted-foreground">هذا الرقم يتتبع جميع محاولات تسجيل الدخول والخروج. مراقبة هذا العدد تساعد في الكشف عن الأنشطة غير المصرح بها.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "stat-leak"}
        onClose={() => setActiveModal(null)}
        title="تفاصيل سجلات التسريبات"
        icon={<Shield />}
      >
        <p className="text-sm text-muted-foreground">يمثل هذا العدد جميع الأحداث المتعلقة بالكشف عن تسريبات البيانات المحتملة. كل سجل هنا يشير إلى تفعيل آليات الحماية.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "stat-export"}
        onClose={() => setActiveModal(null)}
        title="تفاصيل سجلات التصدير"
        icon={<FileOutput />}
      >
        <p className="text-sm text-muted-foreground">هذا الرقم يوضح عدد المرات التي تم فيها تصدير البيانات من النظام. من المهم تتبع عمليات التصدير لضمان الامتثال لسياسات البيانات.</p>
      </DetailModal>

      {activeLog && (
        <DetailModal
          open={!!activeLog}
          onClose={() => setActiveModal(null)}
          title={`تفاصيل السجل #${String(activeLog.id)}`}
          icon={<Info />}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3 text-sm font-mono dir-ltr text-left bg-muted/30 p-4 rounded-lg border border-border/50">
            <p><span className="font-bold text-primary/80">Timestamp:</span> {formatDate(activeLog.createdAt)}</p>
            <p><span className="font-bold text-primary/80">Category:</span> {activeLog.category}</p>
            <p><span className="font-bold text-primary/80">User:</span> {activeLog.userName || `ID: ${activeLog.userId}` || "System"}</p>
            <p><span className="font-bold text-primary/80">Action:</span> {activeLog.action}</p>
            <div className="break-words whitespace-pre-wrap">
              <p className="font-bold text-primary/80">Details:</p>
              <p>{activeLog.details || "No details provided."}</p>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
