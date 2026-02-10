/**
 * Dashboard — Main analytics overview
 * Dark Observatory Theme — Data glows on dark canvas
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
  ArrowUpLeft,
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
import {
  dashboardStats,
  monthlyTrends,
  sectorDistribution,
  sourceDistribution,
  leakRecords,
} from "@/lib/mockData";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/ayrInlgqp87gNdrsqHgN3t/sandbox/KjQNQlvIQMp8LacOr99cOG-img-1_1770741559000_na1fn_aGVyby1iYW5uZXI.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvYXlySW5sZ3FwODdnTmRyc3FIZ04zdC9zYW5kYm94L0tqUU5RbHZJUU1wOExhY09yOTljT0ctaW1nLTFfMTc3MDc0MTU1OTAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=LzNd-KkUgk242MpjmxkRhzQYGfK6jlnlWk2XrOz9ch7m2Mb-NAvmwp~nGMfFCelP5eHvXsHPEA~9YP0iVjrw9HS5q~pKkBqelZCiDiJMDaznPj4Yu604wiFV6jtSo1ML~GddR9SghXGbEmuCziwyq-81VNO6odsCY4XPDVlgxPBX1~zG2f7XN2BwrGBTqv12ynSxJ4vPpg2GJdy7kpIHSIn33jD0ioJCqkvjdvs3jLKfqVoYoV5-ZL3yFTy25teX0ChIDxjt6te3Q2A2aXqaSP6o2R4kTveBhxlrtrTsYdU7qZFbDOeyjsnvVuY2Dus4D7yqGWoLz30Ym2eK98xzRA__";

const statCards = [
  {
    label: "إجمالي التسريبات",
    labelEn: "Total Leaks",
    value: dashboardStats.totalLeaks,
    icon: ShieldAlert,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    trend: "+12%",
    trendUp: true,
  },
  {
    label: "السجلات المكشوفة",
    labelEn: "Exposed Records",
    value: `${(dashboardStats.totalRecords / 1000000).toFixed(1)}M`,
    icon: Database,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    trend: "+8%",
    trendUp: true,
  },
  {
    label: "مصادر الرصد النشطة",
    labelEn: "Active Monitors",
    value: dashboardStats.activeMonitors,
    icon: Radio,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    trend: "+2",
    trendUp: true,
  },
  {
    label: "بيانات شخصية مكتشفة",
    labelEn: "PII Detected",
    value: `${(dashboardStats.piiDetected / 1000000).toFixed(1)}M`,
    icon: ScanSearch,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    trend: "+15%",
    trendUp: true,
  },
  {
    label: "تنبيهات حرجة",
    labelEn: "Critical Alerts",
    value: dashboardStats.criticalAlerts,
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    trend: "-3",
    trendUp: false,
  },
  {
    label: "متوسط وقت الاستجابة",
    labelEn: "Avg Response",
    value: dashboardStats.avgResponseTime,
    icon: Clock,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    trend: "-18%",
    trendUp: false,
  },
];

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

const statusLabel = (s: string) => {
  switch (s) {
    case "new": return "جديد";
    case "analyzing": return "قيد التحليل";
    case "documented": return "موثّق";
    default: return "تم الإبلاغ";
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
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl overflow-hidden h-48 lg:h-56"
      >
        <img
          src={HERO_IMG}
          alt="NDMO Monitoring"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            منصة رصد تسريبات البيانات الشخصية
          </h1>
          <p className="text-sm lg:text-base text-gray-300 max-w-xl">
            الرصد → التوثيق → تغذية السياسات → رفع التقارير
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300">جميع الأنظمة تعمل</span>
            </div>
            <span className="text-xs text-gray-400">آخر تحديث: قبل 5 دقائق</span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.labelEn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
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
        {/* Trend chart */}
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
                    <Area
                      type="monotone"
                      dataKey="leaks"
                      name="التسريبات"
                      stroke="#06B6D4"
                      fill="url(#colorLeaks)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Source breakdown */}
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

      {/* Second row: Sector + Source pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">القطاعات المتأثرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="sector"
                      paddingAngle={2}
                    >
                      {sectorDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sectorDistribution.map((s, i) => (
                  <div key={s.sector} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-muted-foreground">{s.sector}</span>
                    <span className="text-foreground font-medium mr-auto">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Source distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">توزيع المصادر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="source"
                      paddingAngle={2}
                    >
                      {sourceDistribution.map((_, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {sourceDistribution.map((s, i) => (
                  <div key={s.source} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i] }} />
                    <span className="text-muted-foreground">{s.source}</span>
                    <span className="text-foreground font-medium mr-auto">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent alerts */}
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
                {leakRecords.slice(0, 5).map((leak) => (
                  <div
                    key={leak.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      leak.severity === "critical" ? "bg-red-400" :
                      leak.severity === "high" ? "bg-amber-400" :
                      leak.severity === "medium" ? "bg-yellow-400" : "bg-cyan-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{leak.titleAr}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityColor(leak.severity)}`}>
                          {severityLabel(leak.severity)}
                        </span>
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
