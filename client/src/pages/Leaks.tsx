/**
 * Leaks — All leak records view with filtering, CSV export, and comprehensive detail modals
 * Uses tRPC API with evidence chain integration
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Download,
  Eye,
  Send,
  Globe,
  FileText,
  Loader2,
  Brain,
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  Shield,
  Camera,
  Hash,
  MapPin,
  Calendar,
  User,
  Link2,
  Database,
  Lock,
  FileCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Fingerprint,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const severityColor = (s: string) => {
  switch (s) {
    case "critical": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "high": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }
};

const severityLabel = (s: string) => {
  switch (s) {
    case "critical": return "حرج";
    case "high": return "عالي";
    case "medium": return "متوسط";
    default: return "منخفض";
  }
};

const sourceIcon = (s: string) => {
  switch (s) {
    case "telegram": return Send;
    case "darkweb": return Globe;
    default: return FileText;
  }
};

const sourceLabel = (s: string) => {
  switch (s) {
    case "telegram": return "تليجرام";
    case "darkweb": return "دارك ويب";
    default: return "موقع لصق";
  }
};

const sourceColor = (s: string) => {
  switch (s) {
    case "telegram": return "text-cyan-400 bg-cyan-500/10";
    case "darkweb": return "text-violet-400 bg-violet-500/10";
    default: return "text-amber-400 bg-amber-500/10";
  }
};

const statusLabel = (s: string) => {
  switch (s) {
    case "new": return "جديد";
    case "analyzing": return "قيد التحليل";
    case "documented": return "موثّق";
    default: return "تم الإبلاغ";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "new": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "analyzing": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "documented": return "text-violet-400 bg-violet-500/10 border-violet-500/30";
    default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
};

const evidenceTypeIcon = (t: string) => {
  switch (t) {
    case "screenshot": return Camera;
    case "text": return FileText;
    case "file": return FileCheck;
    case "metadata": return Database;
    default: return FileText;
  }
};

const evidenceTypeLabel = (t: string) => {
  switch (t) {
    case "screenshot": return "لقطة شاشة";
    case "text": return "نص";
    case "file": return "ملف";
    case "metadata": return "بيانات وصفية";
    default: return t;
  }
};

/* ─── Stats Detail Modal ─── */
function StatsDetailModal({ open, onClose, title, leaks }: { open: boolean; onClose: () => void; title: string; leaks: any[] }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border p-4 rounded-t-2xl flex items-center justify-between">
            <h3 className="text-foreground font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {leaks.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات</p>}
            {leaks.map((leak) => (
              <div key={leak.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${severityColor(leak.severity)}`}>
                  {severityLabel(leak.severity)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{leak.titleAr}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{leak.leakId} — {leak.sectorAr} — {leak.recordCount.toLocaleString()} سجل</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${statusColor(leak.status)}`}>
                  {statusLabel(leak.status)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Leaks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leaks, isLoading } = trpc.leaks.list.useQuery({
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const { refetch: fetchExport } = trpc.leaks.exportCsv.useQuery(
    {
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    { enabled: false }
  );

  const [selectedLeak, setSelectedLeak] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "ai">("overview");
  const [statsModal, setStatsModal] = useState<{ title: string; leaks: any[] } | null>(null);
  const utils = trpc.useUtils();

  // Fetch detail with evidence when a leak is selected
  const { data: leakDetail, isLoading: detailLoading } = trpc.leaks.detail.useQuery(
    { leakId: selectedLeak! },
    { enabled: !!selectedLeak }
  );

  const enrichMutation = trpc.enrichment.enrichLeak.useMutation({
    onSuccess: (result) => {
      toast.success(`تم إثراء التسريب بنجاح (ثقة: ${result.aiConfidence}%)`);
      setEnrichingId(null);
      utils.leaks.list.invalidate();
      if (selectedLeak) utils.leaks.detail.invalidate({ leakId: selectedLeak });
    },
    onError: () => {
      toast.error("فشل إثراء التسريب بالذكاء الاصطناعي");
      setEnrichingId(null);
    },
  });

  const handleEnrich = (leakId: string) => {
    setEnrichingId(leakId);
    enrichMutation.mutate({ leakId });
  };

  const allLeaks = leaks ?? [];

  const filteredLeaks = useMemo(() => {
    if (!searchQuery) return allLeaks;
    const q = searchQuery.toLowerCase();
    return allLeaks.filter(
      (leak) =>
        leak.titleAr.includes(q) ||
        leak.title.toLowerCase().includes(q) ||
        leak.leakId.toLowerCase().includes(q)
    );
  }, [allLeaks, searchQuery]);

  const handleExportCsv = async () => {
    try {
      const { data } = await fetchExport();
      if (data?.csv) {
        const blob = new Blob(["\uFEFF" + data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير البيانات بنجاح");
      }
    } catch {
      toast.error("فشل تصدير البيانات");
    }
  };

  // Stats data for clickable cards
  const statsData = useMemo(() => [
    { label: "إجمالي التسريبات", value: allLeaks.length, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5", icon: ShieldAlert, filter: () => allLeaks },
    { label: "حرجة", value: allLeaks.filter((l) => l.severity === "critical").length, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5", icon: AlertTriangle, filter: () => allLeaks.filter((l) => l.severity === "critical") },
    { label: "قيد التحليل", value: allLeaks.filter((l) => l.status === "analyzing").length, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5", icon: Clock, filter: () => allLeaks.filter((l) => l.status === "analyzing") },
    { label: "تم الإبلاغ", value: allLeaks.filter((l) => l.status === "reported").length, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5", icon: CheckCircle, filter: () => allLeaks.filter((l) => l.status === "reported") },
  ], [allLeaks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className={`border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:scale-[1.02] transition-all`}
                onClick={() => setStatsModal({ title: stat.label, leaks: stat.filter() })}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-[10px] text-primary/60 mt-1">اضغط للتفاصيل</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في التسريبات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-secondary/50 border-border"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="الخطورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                <SelectItem value="telegram">تليجرام</SelectItem>
                <SelectItem value="darkweb">دارك ويب</SelectItem>
                <SelectItem value="paste">مواقع لصق</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="analyzing">قيد التحليل</SelectItem>
                <SelectItem value="documented">موثّق</SelectItem>
                <SelectItem value="reported">تم الإبلاغ</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leak cards */}
      <div className="space-y-3">
        {filteredLeaks.map((leak, i) => {
          const SourceIcon = sourceIcon(leak.source);
          return (
            <motion.div
              key={leak.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="border-border hover:border-primary/30 transition-all cursor-pointer hover:shadow-lg"
                onClick={() => { setSelectedLeak(leak.leakId); setActiveTab("overview"); }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 lg:w-32">
                      <span className={`text-[10px] px-2 py-1 rounded border ${severityColor(leak.severity)}`}>
                        {severityLabel(leak.severity)}
                      </span>
                      <span className="text-xs font-mono text-primary">{leak.leakId}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{leak.titleAr}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{leak.descriptionAr || leak.title}</p>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${sourceColor(leak.source)} lg:w-28`}>
                      <SourceIcon className="w-3.5 h-3.5" />
                      <span className="text-xs">{sourceLabel(leak.source)}</span>
                    </div>

                    <div className="lg:w-20">
                      <span className="text-xs text-muted-foreground">{leak.sectorAr}</span>
                    </div>

                    <div className="lg:w-24 text-left">
                      <span className="text-sm font-semibold text-foreground">{leak.recordCount.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground mr-1">سجل</span>
                    </div>

                    <span className={`text-[10px] px-2 py-1 rounded border ${statusColor(leak.status)} lg:w-24 text-center`}>
                      {statusLabel(leak.status)}
                    </span>

                    <span className="text-xs text-muted-foreground lg:w-24">
                      {leak.detectedAt ? new Date(leak.detectedAt).toLocaleDateString("ar-SA") : "—"}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {leak.enrichedAt && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); setSelectedLeak(leak.leakId); setActiveTab("overview"); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!leak.enrichedAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); handleEnrich(leak.leakId); }}
                          disabled={enrichingId === leak.leakId}
                        >
                          {enrichingId === leak.leakId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                    {((leak.piiTypes as string[]) || []).map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ Comprehensive Leak Detail Modal ═══ */}
      <AnimatePresence>
        {selectedLeak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedLeak(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {detailLoading || !leakDetail ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-muted-foreground mr-3">جاري تحميل التفاصيل...</span>
                </div>
              ) : (
                <>
                  {/* ── Modal Header ── */}
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border p-5 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30">
                          <ShieldAlert className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-foreground font-bold text-lg">{leakDetail.titleAr}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{leakDetail.leakId}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${severityColor(leakDetail.severity)}`}>
                              {severityLabel(leakDetail.severity)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColor(leakDetail.status)}`}>
                              {statusLabel(leakDetail.status)}
                            </span>
                            {leakDetail.enrichedAt && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                <Brain className="w-3 h-3" /> مُحلّل بالذكاء الاصطناعي
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedLeak(null)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="flex gap-1 mt-4 bg-secondary/50 rounded-lg p-1">
                      {[
                        { key: "overview" as const, label: "نظرة عامة", icon: Eye },
                        { key: "evidence" as const, label: `الأدلة (${leakDetail.evidence?.length ?? 0})`, icon: Shield },
                        { key: "ai" as const, label: "تحليل AI", icon: Brain },
                      ].map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                              activeTab === tab.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            <TabIcon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* ═══ OVERVIEW TAB ═══ */}
                    {activeTab === "overview" && (
                      <>
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">المصدر</p>
                            </div>
                            <div className={`flex items-center gap-1.5 ${sourceColor(leakDetail.source)}`}>
                              {(() => { const Icon = sourceIcon(leakDetail.source); return <Icon className="w-3.5 h-3.5" />; })()}
                              <span className="text-sm font-medium">{sourceLabel(leakDetail.source)}</span>
                            </div>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Database className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">السجلات المكشوفة</p>
                            </div>
                            <p className="text-sm font-bold text-red-400">{leakDetail.recordCount.toLocaleString()}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">تاريخ الاكتشاف</p>
                            </div>
                            <p className="text-sm text-foreground">{leakDetail.detectedAt ? new Date(leakDetail.detectedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">القطاع / المنطقة</p>
                            </div>
                            <p className="text-sm text-foreground">{leakDetail.sectorAr}</p>
                            {leakDetail.regionAr && <p className="text-[10px] text-muted-foreground mt-0.5">{leakDetail.regionAr} {leakDetail.cityAr ? `— ${leakDetail.cityAr}` : ""}</p>}
                          </div>
                        </div>

                        {/* Full Description */}
                        <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            وصف الحادثة
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">{leakDetail.descriptionAr || "لا يوجد وصف متاح"}</p>
                          {leakDetail.description && leakDetail.description !== leakDetail.descriptionAr && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <p className="text-[10px] text-muted-foreground mb-1">English Description</p>
                              <p className="text-xs text-muted-foreground leading-relaxed" dir="ltr">{leakDetail.description}</p>
                            </div>
                          )}
                        </div>

                        {/* PII Types */}
                        {((leakDetail.piiTypes as string[]) || []).length > 0 && (
                          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                              <Fingerprint className="w-3.5 h-3.5" />
                              أنواع البيانات الشخصية المكشوفة ({(leakDetail.piiTypes as string[]).length} نوع)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {((leakDetail.piiTypes as string[]) || []).map((type) => (
                                <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                                  <Lock className="w-3 h-3 text-red-400 shrink-0" />
                                  <span className="text-xs text-foreground">{type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Incident Timeline */}
                        <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            الجدول الزمني للحادثة
                          </h4>
                          <div className="space-y-3 relative before:absolute before:right-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                            {[
                              { date: leakDetail.detectedAt, label: "تم اكتشاف التسريب", color: "bg-red-400" },
                              { date: leakDetail.createdAt, label: "تم تسجيل الحادثة في النظام", color: "bg-cyan-400" },
                              ...(leakDetail.enrichedAt ? [{ date: leakDetail.enrichedAt, label: "تم تحليل التسريب بالذكاء الاصطناعي", color: "bg-purple-400" }] : []),
                              { date: leakDetail.updatedAt, label: `الحالة الحالية: ${statusLabel(leakDetail.status)}`, color: leakDetail.status === "reported" ? "bg-emerald-400" : "bg-amber-400" },
                            ].filter(e => e.date).map((event, idx) => (
                              <div key={idx} className="flex items-start gap-3 pr-1">
                                <div className={`w-3.5 h-3.5 rounded-full ${event.color} shrink-0 mt-0.5 ring-2 ring-card z-10`} />
                                <div>
                                  <p className="text-xs text-foreground">{event.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{new Date(event.date!).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ═══ EVIDENCE TAB ═══ */}
                    {activeTab === "evidence" && (
                      <>
                        {(leakDetail.evidence?.length ?? 0) === 0 ? (
                          <div className="text-center py-12">
                            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">لا توجد أدلة مسجلة لهذا التسريب</p>
                          </div>
                        ) : (
                          <>
                            {/* Evidence Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {["screenshot", "text", "file", "metadata"].map((type) => {
                                const count = leakDetail.evidence?.filter((e: any) => e.evidenceType === type).length ?? 0;
                                const Icon = evidenceTypeIcon(type);
                                return (
                                  <div key={type} className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                                    <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                                    <p className="text-lg font-bold text-foreground">{count}</p>
                                    <p className="text-[10px] text-muted-foreground">{evidenceTypeLabel(type)}</p>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Evidence Chain */}
                            <div className="space-y-3">
                              {leakDetail.evidence?.map((ev: any, idx: number) => {
                                const Icon = evidenceTypeIcon(ev.evidenceType);
                                const meta = ev.evidenceMetadata as Record<string, any> | null;
                                return (
                                  <div key={ev.id} className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <Icon className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono text-primary">{ev.evidenceId}</span>
                                          <Badge variant="outline" className="text-[10px]">{evidenceTypeLabel(ev.evidenceType)}</Badge>
                                          {ev.isVerified && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                              <CheckCircle className="w-2.5 h-2.5" /> موثّق
                                            </span>
                                          )}
                                          <span className="text-[10px] text-muted-foreground mr-auto">Block #{ev.blockIndex}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                          <User className="w-3 h-3" />
                                          {ev.capturedBy || "غير محدد"}
                                          <span className="mx-1">•</span>
                                          <Calendar className="w-3 h-3" />
                                          {ev.capturedAt ? new Date(ev.capturedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Hash Info */}
                                    <div className="bg-card/50 rounded-lg p-2.5 border border-border/30 mb-2">
                                      <div className="flex items-center gap-2 text-[10px]">
                                        <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">SHA-256:</span>
                                        <span className="font-mono text-foreground truncate">{ev.contentHash}</span>
                                      </div>
                                      {ev.previousHash && (
                                        <div className="flex items-center gap-2 text-[10px] mt-1">
                                          <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                          <span className="text-muted-foreground">السابق:</span>
                                          <span className="font-mono text-muted-foreground truncate">{ev.previousHash}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Metadata Details */}
                                    {meta && Object.keys(meta).length > 0 && (
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        {Object.entries(meta).map(([key, value]) => (
                                          <div key={key} className="bg-card/30 rounded-lg p-2 border border-border/20">
                                            <p className="text-[9px] text-muted-foreground mb-0.5">{key}</p>
                                            <p className="text-[11px] text-foreground truncate" dir={typeof value === 'string' && /^[a-zA-Z]/.test(value) ? 'ltr' : 'rtl'}>
                                              {typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : String(value)}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* ═══ AI ANALYSIS TAB ═══ */}
                    {activeTab === "ai" && (
                      <>
                        {leakDetail.enrichedAt ? (
                          <>
                            {/* AI Confidence & Severity */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20 text-center">
                                <Brain className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                                <p className="text-2xl font-bold text-purple-400">{leakDetail.aiConfidence}%</p>
                                <p className="text-[10px] text-muted-foreground mt-1">مستوى الثقة</p>
                              </div>
                              <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 text-center">
                                <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                                <p className={`text-lg font-bold ${severityColor(leakDetail.aiSeverity || leakDetail.severity).split(' ')[0]}`}>
                                  {severityLabel(leakDetail.aiSeverity || leakDetail.severity)}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">تقييم الخطورة AI</p>
                              </div>
                              <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 text-center">
                                <Calendar className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                                <p className="text-sm font-medium text-foreground">
                                  {leakDetail.enrichedAt ? new Date(leakDetail.enrichedAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "—"}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">تاريخ التحليل</p>
                              </div>
                            </div>

                            {/* AI Summary */}
                            <div className="bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-xl p-4 border border-purple-500/20">
                              <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                الملخص التنفيذي
                              </h4>
                              <p className="text-sm text-foreground leading-relaxed">{leakDetail.aiSummaryAr || leakDetail.aiSummary || "لا يوجد ملخص"}</p>
                            </div>

                            {/* AI Recommendations */}
                            {((leakDetail.aiRecommendationsAr as string[]) || (leakDetail.aiRecommendations as string[]) || []).length > 0 && (
                              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  التوصيات ({((leakDetail.aiRecommendationsAr as string[]) || (leakDetail.aiRecommendations as string[]) || []).length})
                                </h4>
                                <div className="space-y-2">
                                  {((leakDetail.aiRecommendationsAr as string[]) || (leakDetail.aiRecommendations as string[]) || []).map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                                      </div>
                                      <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12">
                            {enrichingId === leakDetail.leakId ? (
                              <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                <span className="text-foreground text-sm">جاري تحليل التسريب بالذكاء الاصطناعي...</span>
                              </div>
                            ) : (
                              <div>
                                <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                                <p className="text-muted-foreground text-sm mb-4">لم يتم إثراء هذا التسريب بالذكاء الاصطناعي بعد</p>
                                <Button
                                  onClick={() => handleEnrich(leakDetail.leakId)}
                                  className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  إثراء بالذكاء الاصطناعي
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Detail Modal */}
      <StatsDetailModal
        open={!!statsModal}
        onClose={() => setStatsModal(null)}
        title={statsModal?.title ?? ""}
        leaks={statsModal?.leaks ?? []}
      />

      {filteredLeaks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد تسريبات تطابق معايير البحث</p>
        </div>
      )}
    </div>
  );
}
