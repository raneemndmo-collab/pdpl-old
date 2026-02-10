/**
 * Dashboard — Main analytics overview
 * Dark Observatory Theme — Data glows on dark canvas
 * Uses real tRPC API data from database
 */
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const sourceIcon = (s: string) => {
  switch (s) {
    case "telegram": return "تليجرام";
    case "darkweb": return "دارك ويب";
    default: return "موقع لصق";
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-sm">
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: leaksData, isLoading: leaksLoading } = trpc.leaks.list.useQuery();
  const { data: alertStats } = trpc.alerts.stats.useQuery();

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

  const statCards = [
    { label: "إجمالي التسريبات", labelEn: "Total Leaks", value: stats?.totalLeaks ?? 0, icon: ShieldAlert, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", trend: "+12%", trendUp: true },
    { label: "السجلات المكشوفة", labelEn: "Exposed Records", value: stats?.totalRecords ? `${(stats.totalRecords / 1000000).toFixed(1)}M` : "0", icon: Database, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", trend: "+8%", trendUp: true },
    { label: "مصادر الرصد النشطة", labelEn: "Active Monitors", value: stats?.activeMonitors ?? 0, icon: Radio, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", trend: "+2", trendUp: true },
    { label: "بيانات شخصية مكتشفة", labelEn: "PII Detected", value: stats?.piiDetected ? stats.piiDetected >= 1000000 ? `${(stats.piiDetected / 1000000).toFixed(1)}M` : stats.piiDetected >= 1000 ? `${(stats.piiDetected / 1000).toFixed(1)}K` : stats.piiDetected : "0", icon: ScanSearch, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20", trend: "+15%", trendUp: true },
    { label: "تنبيهات حرجة", labelEn: "Critical Alerts", value: stats?.criticalAlerts ?? 0, icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", trend: "-3", trendUp: false },
    { label: "متوسط وقت الاستجابة", labelEn: "Avg Response", value: "2.4h", icon: Clock, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20", trend: "-18%", trendUp: false },
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.labelEn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <Card className={`border ${stat.borderColor} ${stat.bgColor} bg-opacity-50 hover:scale-[1.02] transition-transform`}>
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
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                اتجاه التسريبات الشهري
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
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                التسريبات حسب المصدر
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

      {/* AI & Alerts Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                إثراء الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-2xl font-bold text-purple-400">{enrichedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">تسريبات مثراة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  <p className="text-2xl font-bold text-gray-300">{totalLeaksCount - enrichedCount}</p>
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
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                قنوات التنبيه
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

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">القطاعات المتأثرة</CardTitle></CardHeader>
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
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">توزيع المصادر</CardTitle></CardHeader>
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
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                أحدث التنبيهات
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
                        <span className="text-[10px] text-muted-foreground">{sourceIcon(leak.source)}</span>
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
    </div>
  );
}
