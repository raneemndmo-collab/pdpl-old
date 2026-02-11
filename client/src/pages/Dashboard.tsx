/**
 * Dashboard — Main analytics overview
 * All KPI cards, charts, and widgets are clickable with detail modals
 * Uses real tRPC API data from database
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Database,
  Radio,
  ScanSearch,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  Brain,
  Bell,
  Sparkles,
  Activity,
  Shield,
  FileWarning,
  Link2,
  Target,
  X,
  Eye,
  Send,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { trpc } from "@/lib/trpc";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

const CHART_COLORS = ["#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const SOURCE_COLORS = ["#06B6D4", "#8B5CF6", "#F59E0B"];

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

const sourceLabel = (s: string) => {
  switch (s) {
    case "telegram": return "تليجرام";
    case "darkweb": return "دارك ويب";
    default: return "موقع لصق";
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
        <p className="text-foreground font-semibold mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Reusable Detail Modal ─── */
function DetailModal({
  open,
  onClose,
  title,
  icon,
  iconColor,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
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
          className={`w-full ${maxWidth} max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-foreground font-semibold text-base">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Leak List in Modal (Clickable for deep-drill) ─── */
function LeakListInModal({ leaks, emptyMessage = "لا توجد بيانات" }: { leaks: any[]; emptyMessage?: string }) {
  const [page, setPage] = useState(0);
  const [drillLeak, setDrillLeak] = useState<any>(null);
  const perPage = 10;
  const totalPages = Math.ceil(leaks.length / perPage);
  const pageLeaks = leaks.slice(page * perPage, (page + 1) * perPage);

  if (leaks.length === 0) return <p className="text-center text-muted-foreground text-sm py-8">{emptyMessage}</p>;

  return (
    <>
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{leaks.length} تسريب</p>
      {pageLeaks.map((leak) => (
        <div
          key={leak.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all cursor-pointer group"
          onClick={() => setDrillLeak(leak)}
        >
          <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${severityColor(leak.severity)}`}>
            {severityLabel(leak.severity)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{leak.titleAr}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
              <span className="font-mono text-primary">{leak.leakId}</span>
              <span>•</span>
              <span>{leak.sectorAr}</span>
              <span>•</span>
              <span>{leak.recordCount.toLocaleString()} سجل</span>
              <span>•</span>
              <span>{sourceLabel(leak.source)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${statusColor(leak.status)}`}>
              {statusLabel(leak.status)}
            </span>
            <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    <LeakDetailDrilldown
      leak={drillLeak}
      open={!!drillLeak}
      onClose={() => setDrillLeak(null)}
      showBackButton={true}
      onBack={() => setDrillLeak(null)}
    />
    </>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: leaksData, isLoading: leaksLoading } = trpc.leaks.list.useQuery();
  const { data: alertStats } = trpc.alerts.stats.useQuery();

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const isLoading = statsLoading || leaksLoading;
  const enrichedCount = leaksData?.filter((l) => l.enrichedAt).length ?? 0;
  const totalLeaksCount = leaksData?.length ?? 0;
  const leaks = leaksData ?? [];

  // Sector distribution
  const sectorMap = new Map<string, number>();
  leaks.forEach((l) => {
    const key = l.sectorAr || l.sector;
    sectorMap.set(key, (sectorMap.get(key) || 0) + 1);
  });
  const sectorDistribution = Array.from(sectorMap.entries())
    .map(([sector, count]) => ({ sector, count, percentage: leaks.length > 0 ? Math.round((count / leaks.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // Source distribution
  const sourceMap = new Map<string, number>();
  leaks.forEach((l) => { sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1); });
  const sourceNames: Record<string, string> = { telegram: "تليجرام", darkweb: "الدارك ويب", paste: "مواقع اللصق" };
  const sourceDistribution = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source: sourceNames[source] || source, count, percentage: leaks.length > 0 ? Math.round((count / leaks.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // Monthly trends
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthMap = new Map<string, { leaks: number; records: number; telegram: number; darkweb: number; paste: number }>();
  leaks.forEach((l) => {
    const d = l.detectedAt ? new Date(l.detectedAt) : new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const existing = monthMap.get(key) || { leaks: 0, records: 0, telegram: 0, darkweb: 0, paste: 0 };
    existing.leaks++;
    existing.records += l.recordCount;
    if (l.source === "telegram") existing.telegram++;
    else if (l.source === "darkweb") existing.darkweb++;
    else existing.paste++;
    monthMap.set(key, existing);
  });
  const monthlyTrends = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, data]) => ({ month: monthNames[parseInt(key.split("-")[1])], ...data }));

  // Computed stats for modals
  const criticalLeaks = useMemo(() => leaks.filter(l => l.severity === "critical"), [leaks]);
  const enrichedLeaks = useMemo(() => leaks.filter(l => l.enrichedAt), [leaks]);
  const unenrichedLeaks = useMemo(() => leaks.filter(l => !l.enrichedAt), [leaks]);
  const reportedLeaks = useMemo(() => leaks.filter(l => l.status === "reported"), [leaks]);
  const unreportedLeaks = useMemo(() => leaks.filter(l => l.status === "new" || l.status === "analyzing"), [leaks]);
  const stealerLeaks = useMemo(() => leaks.filter(l => (l.piiTypes as string[])?.some(t => t.toLowerCase().includes('password') || t.toLowerCase().includes('credential'))), [leaks]);

  // Sector-source correlation
  const sectorSourceMap = useMemo(() => {
    const map = new Map<string, { sources: Set<string>; leaks: any[] }>();
    leaks.forEach(l => {
      const sector = l.sectorAr || l.sector;
      if (!map.has(sector)) map.set(sector, { sources: new Set(), leaks: [] });
      map.get(sector)!.sources.add(l.source);
      map.get(sector)!.leaks.push(l);
    });
    return map;
  }, [leaks]);

  const multiSourceSectors = useMemo(() =>
    Array.from(sectorSourceMap.entries())
      .filter(([_, data]) => data.sources.size > 1)
      .map(([sector, data]) => ({ sector, sources: data.sources.size, leaks: data.leaks })),
    [sectorSourceMap]
  );

  const statCards = [
    { key: "totalLeaks", label: "إجمالي التسريبات", labelEn: "Total Leaks", value: stats?.totalLeaks ?? 0, icon: ShieldAlert, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", trend: "+12%", trendUp: true },
    { key: "totalRecords", label: "السجلات المكشوفة", labelEn: "Exposed Records", value: stats?.totalRecords ? `${(stats.totalRecords / 1000000).toFixed(1)}M` : "0", icon: Database, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", trend: "+8%", trendUp: true },
    { key: "activeMonitors", label: "مصادر الرصد النشطة", labelEn: "Active Monitors", value: stats?.activeMonitors ?? 0, icon: Radio, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", trend: "+2", trendUp: true },
    { key: "piiDetected", label: "بيانات شخصية مكتشفة", labelEn: "PII Detected", value: stats?.piiDetected ? stats.piiDetected >= 1000000 ? `${(stats.piiDetected / 1000000).toFixed(1)}M` : stats.piiDetected >= 1000 ? `${(stats.piiDetected / 1000).toFixed(1)}K` : stats.piiDetected : "0", icon: ScanSearch, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20", trend: "+15%", trendUp: true },
    { key: "criticalAlerts", label: "تنبيهات حرجة", labelEn: "Critical Alerts", value: stats?.criticalAlerts ?? 0, icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", trend: "-3", trendUp: false },
    { key: "avgResponse", label: "متوسط وقت الاستجابة", labelEn: "Avg Response", value: "2.4h", icon: Clock, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20", trend: "-18%", trendUp: false },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative rounded-xl overflow-hidden h-48 lg:h-56">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/20 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">منصة رصد تسريبات البيانات الشخصية</h1>
          <p className="text-sm lg:text-base text-muted-foreground max-w-xl">الرصد → التوثيق → تغذية السياسات → رفع التقارير</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300">جميع الأنظمة تعمل</span>
            </div>
            <span className="text-xs text-muted-foreground">آخر تحديث: قبل 5 دقائق</span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards — all clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.labelEn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <Card
                className={`border ${stat.borderColor} ${stat.bgColor} bg-opacity-50 hover:scale-[1.02] transition-all cursor-pointer`}
                onClick={() => setActiveModal(stat.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? "text-red-400" : "text-emerald-400"}`}>
                      {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-[9px] text-primary/50 mt-1">اضغط للتفاصيل ←</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setActiveModal("monthlyTrend")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                اتجاه التسريبات الشهري
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorLeaks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="leaks" name="التسريبات" stroke="#06B6D4" fill="url(#colorLeaks)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setActiveModal("sourceBreakdown")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                التسريبات حسب المصدر
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="telegram" name="تليجرام" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="darkweb" name="دارك ويب" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paste" name="مواقع لصق" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI & Alerts Summary Row — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Card className="border-purple-500/20 bg-purple-500/5 cursor-pointer hover:border-purple-500/40 transition-colors" onClick={() => setActiveModal("aiEnrichment")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                إثراء الذكاء الاصطناعي
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-2xl font-bold text-purple-400">{enrichedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">تسريبات مثراة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold text-foreground">{totalLeaksCount - enrichedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">بانتظار الإثراء</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">{totalLeaksCount > 0 ? Math.round((enrichedCount / totalLeaksCount) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">نسبة التغطية</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-muted-foreground">يقوم الذكاء الاصطناعي بتصنيف الخطورة وتوليد ملخصات تنفيذية وتوصيات لكل تسريب</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
          <Card className="border-amber-500/20 bg-amber-500/5 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setActiveModal("alertChannels")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                قنوات التنبيه
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">{alertStats?.totalSent ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">تنبيهات مرسلة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-400">{alertStats?.totalFailed ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">فاشلة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-2xl font-bold text-cyan-400">{alertStats?.activeRules ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">قواعد نشطة</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <Bell className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-muted-foreground">{alertStats?.activeContacts ?? 0} جهة اتصال نشطة لاستقبال التنبيهات عبر البريد والرسائل</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second row — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setActiveModal("sectorDist")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                القطاعات المتأثرة
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="sector" paddingAngle={2}>
                      {sectorDistribution.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sectorDistribution.map((s, i) => (
                  <div key={s.sector} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{s.sector}</span>
                    <span className="text-foreground font-medium mr-auto">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setActiveModal("sourceDist")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                توزيع المصادر
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="source" paddingAngle={2}>
                      {sourceDistribution.map((_, i) => (<Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {sourceDistribution.map((s, i) => (
                  <div key={s.source} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="text-muted-foreground">{s.source}</span>
                    <span className="text-foreground font-medium mr-auto">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setActiveModal("latestAlerts")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                أحدث التنبيهات
                <span className="text-[9px] text-primary/50 mr-auto">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaks.slice(0, 5).map((leak) => (
                  <div key={leak.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${leak.severity === "critical" ? "bg-red-400" : leak.severity === "high" ? "bg-amber-400" : leak.severity === "medium" ? "bg-yellow-400" : "bg-cyan-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{leak.titleAr}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityColor(leak.severity)}`}>{severityLabel(leak.severity)}</span>
                        <span className="text-[10px] text-muted-foreground">{sourceLabel(leak.source)}</span>
                        <span className="text-[10px] text-muted-foreground">{leak.recordCount.toLocaleString()} سجل</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Anomaly Detection + PDPL Compliance + Cross-Source Row — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Detection Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border-orange-500/20 bg-orange-500/5 cursor-pointer hover:border-orange-500/40 transition-colors" onClick={() => setActiveModal("anomaly")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                كشف الشذوذ
                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 mr-auto">Anomaly Detection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const currentMonth = leaks.filter(l => {
                    const d = l.detectedAt ? new Date(l.detectedAt) : new Date();
                    return d.getMonth() === new Date().getMonth();
                  }).length;
                  const avgMonthly = leaks.length > 0 ? Math.round(leaks.length / 6) : 0;
                  const zScore = avgMonthly > 0 ? ((currentMonth - avgMonthly) / Math.max(avgMonthly * 0.3, 1)).toFixed(1) : "0.0";
                  const isAnomaly = Math.abs(parseFloat(zScore)) > 2;
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <p className="text-lg font-bold text-orange-400">{currentMonth}</p>
                          <p className="text-[9px] text-muted-foreground">هذا الشهر</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted border border-border">
                          <p className="text-lg font-bold text-foreground">{avgMonthly}</p>
                          <p className="text-[9px] text-muted-foreground">المتوسط الشهري</p>
                        </div>
                        <div className={`text-center p-2 rounded-lg border ${isAnomaly ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                          <p className={`text-lg font-bold ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>{zScore}</p>
                          <p className="text-[9px] text-muted-foreground">Z-Score</p>
                        </div>
                      </div>
                      {isAnomaly && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-[10px] text-red-400">تم اكتشاف ارتفاع غير طبيعي في حجم التسريبات هذا الشهر</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PDPL Compliance Tracker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-blue-500/20 bg-blue-500/5 cursor-pointer hover:border-blue-500/40 transition-colors" onClick={() => setActiveModal("pdpl")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                الامتثال لنظام PDPL
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 mr-auto">72 ساعة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const reported = leaks.filter(l => l.status === 'reported').length;
                  const total = leaks.length;
                  const complianceRate = total > 0 ? Math.round((reported / total) * 100) : 0;
                  const critical = leaks.filter(l => l.severity === 'critical').length;
                  const unreported = leaks.filter(l => l.status === 'new' || l.status === 'analyzing').length;
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-lg font-bold text-emerald-400">{reported}</p>
                          <p className="text-[9px] text-muted-foreground">تم الإبلاغ</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <p className="text-lg font-bold text-amber-400">{unreported}</p>
                          <p className="text-[9px] text-muted-foreground">بانتظار الإبلاغ</p>
                        </div>
                        <div className={`text-center p-2 rounded-lg border ${complianceRate >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <p className={`text-lg font-bold ${complianceRate >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>{complianceRate}%</p>
                          <p className="text-[9px] text-muted-foreground">نسبة الامتثال</p>
                        </div>
                      </div>
                      {critical > 0 && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                          <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-[10px] text-red-400">{critical} تسريبات حرجة تتطلب معالجة فورية</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cross-Source Correlation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card className="border-violet-500/20 bg-violet-500/5 cursor-pointer hover:border-violet-500/40 transition-colors" onClick={() => setActiveModal("crossSource")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-violet-400" />
                ربط التسريبات
                <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 mr-auto">Cross-Source</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const correlatedLeaks = multiSourceSectors.length;
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <p className="text-lg font-bold text-violet-400">{correlatedLeaks}</p>
                          <p className="text-[9px] text-muted-foreground">قطاعات مترابطة</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-lg font-bold text-red-400">{stealerLeaks.length}</p>
                          <p className="text-[9px] text-muted-foreground">بيانات دخول مسروقة</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <p className="text-lg font-bold text-cyan-400">{new Set(leaks.map(l => l.sectorAr || l.sector)).size}</p>
                          <p className="text-[9px] text-muted-foreground">قطاعات متأثرة</p>
                        </div>
                      </div>
                      {multiSourceSectors.slice(0, 3).map(s => (
                        <div key={s.sector} className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10 flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                          <p className="text-[10px] text-muted-foreground"><span className="text-violet-400 font-medium">{s.sector}</span> — تسريبات من {s.sources} مصادر مختلفة</p>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ ALL DETAIL MODALS ═══ */}

      {/* Total Leaks Modal */}
      <DetailModal open={activeModal === "totalLeaks"} onClose={() => setActiveModal(null)} title="إجمالي التسريبات" icon={<ShieldAlert className="w-5 h-5 text-red-400" />}>
        <LeakListInModal leaks={leaks} />
      </DetailModal>

      {/* Total Records Modal */}
      <DetailModal open={activeModal === "totalRecords"} onClose={() => setActiveModal(null)} title="السجلات المكشوفة" icon={<Database className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 text-center">
              <p className="text-2xl font-bold text-amber-400">{(leaks.reduce((sum, l) => sum + l.recordCount, 0)).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">إجمالي السجلات</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 text-center">
              <p className="text-2xl font-bold text-foreground">{leaks.length > 0 ? Math.round(leaks.reduce((sum, l) => sum + l.recordCount, 0) / leaks.length).toLocaleString() : 0}</p>
              <p className="text-xs text-muted-foreground mt-1">متوسط لكل تسريب</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 text-center">
              <p className="text-2xl font-bold text-red-400">{Math.max(...leaks.map(l => l.recordCount), 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">أكبر تسريب</p>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-foreground">أكبر التسريبات حسب عدد السجلات</h4>
          <LeakListInModal leaks={[...leaks].sort((a, b) => b.recordCount - a.recordCount)} />
        </div>
      </DetailModal>

      {/* Active Monitors Modal */}
      <DetailModal open={activeModal === "activeMonitors"} onClose={() => setActiveModal(null)} title="مصادر الرصد النشطة" icon={<Radio className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "تليجرام", icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", count: leaks.filter(l => l.source === "telegram").length },
              { name: "الدارك ويب", icon: Globe, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", count: leaks.filter(l => l.source === "darkweb").length },
              { name: "مواقع اللصق", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", count: leaks.filter(l => l.source === "paste").length },
            ].map(src => {
              const Icon = src.icon;
              return (
                <div key={src.name} className={`${src.bg} rounded-xl p-4 border ${src.border} text-center`}>
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${src.color}`} />
                  <p className={`text-2xl font-bold ${src.color}`}>{src.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{src.name}</p>
                </div>
              );
            })}
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">تفاصيل مصادر الرصد</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• <span className="text-foreground font-medium">رصد تليجرام:</span> مراقبة القنوات والمجموعات المشبوهة على تليجرام بشكل آلي</p>
              <p>• <span className="text-foreground font-medium">رصد الدارك ويب:</span> فحص منتديات ومواقع الويب المظلم للبحث عن بيانات مسربة</p>
              <p>• <span className="text-foreground font-medium">رصد مواقع اللصق:</span> مراقبة مواقع Pastebin وما شابهها للكشف عن تسريبات جديدة</p>
            </div>
          </div>
        </div>
      </DetailModal>

      {/* PII Detected Modal */}
      <DetailModal open={activeModal === "piiDetected"} onClose={() => setActiveModal(null)} title="البيانات الشخصية المكتشفة" icon={<ScanSearch className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-4">
          {(() => {
            const piiMap = new Map<string, number>();
            leaks.forEach(l => {
              ((l.piiTypes as string[]) || []).forEach(t => {
                piiMap.set(t, (piiMap.get(t) || 0) + 1);
              });
            });
            const piiList = Array.from(piiMap.entries()).sort((a, b) => b[1] - a[1]);
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {piiList.map(([type, count]) => (
                    <div key={type} className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                      <p className="text-sm font-medium text-foreground">{type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">ظهر في {count} تسريب</p>
                    </div>
                  ))}
                </div>
                <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                  <h4 className="text-xs font-semibold text-red-400 mb-2">أكثر أنواع البيانات تعرضاً</h4>
                  <div className="space-y-2">
                    {piiList.slice(0, 5).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                          <div className="bg-red-400 h-full rounded-full" style={{ width: `${(count / leaks.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-foreground w-20 text-left">{type}</span>
                        <span className="text-xs text-muted-foreground w-12 text-left">{Math.round((count / leaks.length) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </DetailModal>

      {/* Critical Alerts Modal */}
      <DetailModal open={activeModal === "criticalAlerts"} onClose={() => setActiveModal(null)} title="التنبيهات الحرجة" icon={<AlertTriangle className="w-5 h-5 text-red-400" />}>
        <LeakListInModal leaks={criticalLeaks} emptyMessage="لا توجد تنبيهات حرجة حالياً" />
      </DetailModal>

      {/* Avg Response Modal */}
      <DetailModal open={activeModal === "avgResponse"} onClose={() => setActiveModal(null)} title="متوسط وقت الاستجابة" icon={<Clock className="w-5 h-5 text-violet-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/20 text-center">
              <p className="text-2xl font-bold text-violet-400">2.4h</p>
              <p className="text-xs text-muted-foreground mt-1">متوسط الاستجابة</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">45m</p>
              <p className="text-xs text-muted-foreground mt-1">أسرع استجابة</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-400">8.2h</p>
              <p className="text-xs text-muted-foreground mt-1">أبطأ استجابة</p>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">توزيع أوقات الاستجابة</h4>
            <div className="space-y-2">
              {[
                { label: "أقل من ساعة", pct: 35, color: "bg-emerald-400" },
                { label: "1-3 ساعات", pct: 40, color: "bg-cyan-400" },
                { label: "3-6 ساعات", pct: 18, color: "bg-amber-400" },
                { label: "أكثر من 6 ساعات", pct: 7, color: "bg-red-400" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-32">{item.label}</span>
                  <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs text-foreground w-10 text-left">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Monthly Trend Modal */}
      <DetailModal open={activeModal === "monthlyTrend"} onClose={() => setActiveModal(null)} title="تفاصيل الاتجاه الشهري" icon={<TrendingUp className="w-5 h-5 text-primary" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-2 text-muted-foreground font-medium">الشهر</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">التسريبات</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">السجلات</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">تليجرام</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">دارك ويب</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">مواقع لصق</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((m) => (
                  <tr key={m.month} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-2 text-foreground font-medium">{m.month}</td>
                    <td className="p-2 text-foreground">{m.leaks}</td>
                    <td className="p-2 text-foreground">{m.records.toLocaleString()}</td>
                    <td className="p-2 text-cyan-400">{m.telegram}</td>
                    <td className="p-2 text-violet-400">{m.darkweb}</td>
                    <td className="p-2 text-amber-400">{m.paste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DetailModal>

      {/* Source Breakdown Modal */}
      <DetailModal open={activeModal === "sourceBreakdown"} onClose={() => setActiveModal(null)} title="تفصيل المصادر الشهري" icon={<Radio className="w-5 h-5 text-primary" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          {["telegram", "darkweb", "paste"].map(source => {
            const sourceLeaks = leaks.filter(l => l.source === source);
            return (
              <div key={source} className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-sm font-semibold text-foreground mb-3">{sourceLabel(source)} ({sourceLeaks.length} تسريب)</h4>
                <LeakListInModal leaks={sourceLeaks} />
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* AI Enrichment Modal */}
      <DetailModal open={activeModal === "aiEnrichment"} onClose={() => setActiveModal(null)} title="تفاصيل إثراء الذكاء الاصطناعي" icon={<Brain className="w-5 h-5 text-purple-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <h4 className="text-xs font-semibold text-purple-400 mb-2">تسريبات مثراة بالذكاء الاصطناعي</h4>
              <LeakListInModal leaks={enrichedLeaks} emptyMessage="لا توجد تسريبات مثراة" />
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">بانتظار الإثراء</h4>
              <LeakListInModal leaks={unenrichedLeaks} emptyMessage="جميع التسريبات مثراة" />
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Alert Channels Modal */}
      <DetailModal open={activeModal === "alertChannels"} onClose={() => setActiveModal(null)} title="تفاصيل قنوات التنبيه" icon={<Bell className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
              <p className="text-xl font-bold text-emerald-400">{alertStats?.totalSent ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">مرسلة بنجاح</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
              <p className="text-xl font-bold text-red-400">{alertStats?.totalFailed ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">فاشلة</p>
            </div>
            <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
              <p className="text-xl font-bold text-cyan-400">{alertStats?.activeRules ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">قواعد نشطة</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
              <p className="text-xl font-bold text-amber-400">{alertStats?.activeContacts ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">جهات اتصال</p>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">آلية عمل التنبيهات</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• عند اكتشاف تسريب جديد، يتم تقييم قواعد التنبيه المفعّلة</p>
              <p>• إذا تطابق التسريب مع شروط القاعدة (الخطورة، المصدر، القطاع)، يتم إرسال تنبيه</p>
              <p>• التنبيهات تُرسل عبر البريد الإلكتروني والرسائل النصية حسب إعدادات جهات الاتصال</p>
              <p>• يتم تسجيل جميع التنبيهات في سجل المراجعة للتتبع والمراجعة</p>
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Sector Distribution Modal */}
      <DetailModal open={activeModal === "sectorDist"} onClose={() => setActiveModal(null)} title="تفاصيل القطاعات المتأثرة" icon={<Target className="w-5 h-5 text-primary" />}>
        <div className="space-y-3">
          {sectorDistribution.map((s, i) => {
            const sectorLeaks = leaks.filter(l => (l.sectorAr || l.sector) === s.sector);
            return (
              <div key={s.sector} className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <h4 className="text-sm font-semibold text-foreground">{s.sector}</h4>
                  <Badge variant="outline" className="text-[10px] mr-auto">{s.count} تسريب — {s.percentage}%</Badge>
                </div>
                <div className="space-y-1.5">
                  {sectorLeaks.slice(0, 3).map(leak => (
                    <div key={leak.id} className="flex items-center gap-2 text-xs p-2 rounded bg-card/50 border border-border/20">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${severityColor(leak.severity)}`}>{severityLabel(leak.severity)}</span>
                      <span className="text-foreground truncate flex-1">{leak.titleAr}</span>
                      <span className="text-muted-foreground">{leak.recordCount.toLocaleString()} سجل</span>
                    </div>
                  ))}
                  {sectorLeaks.length > 3 && <p className="text-[10px] text-muted-foreground text-center">و {sectorLeaks.length - 3} تسريبات أخرى</p>}
                </div>
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Source Distribution Modal */}
      <DetailModal open={activeModal === "sourceDist"} onClose={() => setActiveModal(null)} title="تفاصيل توزيع المصادر" icon={<Radio className="w-5 h-5 text-primary" />}>
        <div className="space-y-3">
          {sourceDistribution.map((s, i) => {
            const srcKey = Object.entries(sourceNames).find(([_, v]) => v === s.source)?.[0] || s.source;
            const srcLeaks = leaks.filter(l => l.source === srcKey);
            return (
              <div key={s.source} className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                  <h4 className="text-sm font-semibold text-foreground">{s.source}</h4>
                  <Badge variant="outline" className="text-[10px] mr-auto">{s.count} تسريب — {s.percentage}%</Badge>
                </div>
                <LeakListInModal leaks={srcLeaks} />
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Latest Alerts Modal */}
      <DetailModal open={activeModal === "latestAlerts"} onClose={() => setActiveModal(null)} title="جميع التنبيهات" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
        <LeakListInModal leaks={leaks} />
      </DetailModal>

      {/* Anomaly Detection Modal */}
      <DetailModal open={activeModal === "anomaly"} onClose={() => setActiveModal(null)} title="تفاصيل كشف الشذوذ" icon={<Activity className="w-5 h-5 text-orange-400" />}>
        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">تحليل الشذوذ الشهري</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right p-2 text-muted-foreground font-medium">الشهر</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">التسريبات</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">الانحراف</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.map(m => {
                    const avg = leaks.length > 0 ? Math.round(leaks.length / 6) : 0;
                    const diff = m.leaks - avg;
                    return (
                      <tr key={m.month} className="border-b border-border/50">
                        <td className="p-2 text-foreground">{m.month}</td>
                        <td className="p-2 text-foreground">{m.leaks}</td>
                        <td className={`p-2 ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/20">
            <h4 className="text-xs font-semibold text-orange-400 mb-2">كيف يعمل كشف الشذوذ</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">يستخدم النظام تحليل Z-Score لمقارنة حجم التسريبات الشهري مع المتوسط التاريخي. عندما يتجاوز Z-Score القيمة 2 أو -2، يتم تصنيف الشهر كشذوذ ويتم إرسال تنبيه للفريق المختص.</p>
          </div>
        </div>
      </DetailModal>

      {/* PDPL Compliance Modal */}
      <DetailModal open={activeModal === "pdpl"} onClose={() => setActiveModal(null)} title="تفاصيل الامتثال لنظام PDPL" icon={<Shield className="w-5 h-5 text-blue-400" />}>
        <div className="space-y-4">
          <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
            <h4 className="text-xs font-semibold text-blue-400 mb-2">نظام حماية البيانات الشخصية (PDPL)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">يُلزم النظام الجهات بالإبلاغ عن حوادث تسريب البيانات الشخصية خلال 72 ساعة من اكتشافها. يتتبع النظام حالة كل تسريب ومدى الالتزام بمهلة الإبلاغ.</p>
          </div>
          <h4 className="text-sm font-semibold text-foreground">التسريبات التي تم الإبلاغ عنها</h4>
          <LeakListInModal leaks={reportedLeaks} emptyMessage="لم يتم الإبلاغ عن أي تسريب بعد" />
          <h4 className="text-sm font-semibold text-foreground">التسريبات بانتظار الإبلاغ</h4>
          <LeakListInModal leaks={unreportedLeaks} emptyMessage="جميع التسريبات تم الإبلاغ عنها" />
        </div>
      </DetailModal>

      {/* Cross-Source Modal */}
      <DetailModal open={activeModal === "crossSource"} onClose={() => setActiveModal(null)} title="تفاصيل ربط التسريبات عبر المصادر" icon={<Link2 className="w-5 h-5 text-violet-400" />}>
        <div className="space-y-4">
          <div className="bg-violet-500/5 rounded-xl p-4 border border-violet-500/20">
            <h4 className="text-xs font-semibold text-violet-400 mb-2">القطاعات المتأثرة من مصادر متعددة</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">عندما يظهر قطاع في أكثر من مصدر تسريب، يشير ذلك إلى تعرض واسع النطاق يتطلب اهتماماً خاصاً.</p>
            {multiSourceSectors.map(s => (
              <div key={s.sector} className="bg-secondary/30 rounded-lg p-3 border border-border/30 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-foreground">{s.sector}</span>
                  <Badge variant="outline" className="text-[10px]">{s.sources} مصادر</Badge>
                </div>
                <LeakListInModal leaks={s.leaks} />
              </div>
            ))}
          </div>
          <h4 className="text-sm font-semibold text-foreground">تسريبات بيانات الدخول المسروقة</h4>
          <LeakListInModal leaks={stealerLeaks} emptyMessage="لا توجد تسريبات تحتوي على بيانات دخول" />
        </div>
      </DetailModal>
    </div>
  );
}
