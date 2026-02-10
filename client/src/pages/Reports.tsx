/**
 * Reports — Legislative reporting and policy insights
 * Dark Observatory Theme — Uses tRPC API + export
 */
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpLeft,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CHART_COLORS = ["#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const radarData = [
  { subject: "اتصالات", A: 85, fullMark: 100 },
  { subject: "صحة", A: 72, fullMark: 100 },
  { subject: "بنوك", A: 65, fullMark: 100 },
  { subject: "حكومة", A: 58, fullMark: 100 },
  { subject: "تعليم", A: 42, fullMark: 100 },
  { subject: "تجزئة", A: 35, fullMark: 100 },
];

const monthlyTrends = [
  { month: "سبتمبر", leaks: 8, records: 45000 },
  { month: "أكتوبر", leaks: 12, records: 78000 },
  { month: "نوفمبر", leaks: 15, records: 92000 },
  { month: "ديسمبر", leaks: 10, records: 65000 },
  { month: "يناير", leaks: 18, records: 120000 },
  { month: "فبراير", leaks: 7, records: 35000 },
];

const policyGaps = [
  {
    id: "PG-001",
    title: "سياسة حماية البيانات الصحية",
    titleEn: "Healthcare Data Protection Policy",
    sector: "صحة",
    urgency: "critical",
    description: "70% من التسريبات المرصودة تتضمن سجلات صحية — لا توجد سياسة قطاعية مخصصة",
    recommendation: "إصدار سياسة خاصة بحماية البيانات الصحية وفق معايير PDPL",
    progress: 25,
  },
  {
    id: "PG-002",
    title: "معايير تشفير بيانات الاتصالات",
    titleEn: "Telecom Data Encryption Standards",
    sector: "اتصالات",
    urgency: "high",
    description: "قطاع الاتصالات الأكثر تسريباً — الحاجة لمعايير تشفير إلزامية",
    recommendation: "تطوير معايير تشفير إلزامية لمشغلي الاتصالات",
    progress: 40,
  },
  {
    id: "PG-003",
    title: "إطار الإبلاغ عن الحوادث",
    titleEn: "Incident Reporting Framework",
    sector: "عام",
    urgency: "high",
    description: "لا يوجد إطار موحد لإبلاغ الجهات عن تسريبات البيانات الشخصية",
    recommendation: "إنشاء إطار إبلاغ موحد مع جداول زمنية محددة",
    progress: 60,
  },
  {
    id: "PG-004",
    title: "حماية بيانات الإقامة",
    titleEn: "Iqama Data Protection",
    sector: "حكومة",
    urgency: "medium",
    description: "تسريبات بيانات الإقامة تتزايد — الحاجة لضوابط إضافية",
    recommendation: "تعزيز ضوابط الوصول لقواعد بيانات الإقامة",
    progress: 15,
  },
];

const typeLabel = (t: string) => {
  switch (t) {
    case "monthly": return "شهري";
    case "quarterly": return "ربع سنوي";
    case "special": return "خاص";
    default: return t;
  }
};

const typeColor = (t: string) => {
  switch (t) {
    case "monthly": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "quarterly": return "text-violet-400 bg-violet-500/10 border-violet-500/30";
    case "special": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default: return "text-muted-foreground bg-secondary/50 border-border";
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

export default function Reports() {
  const { data: dbReports, isLoading } = trpc.reports.list.useQuery();
  const { refetch: fetchPdfData } = trpc.reports.exportPdf.useQuery({}, { enabled: false });

  const handleExportReport = async () => {
    try {
      const { data } = await fetchPdfData();
      if (!data) return;

      const lines = [
        data.title,
        `Generated: ${new Date(data.generatedAt).toLocaleString("ar-SA")}`,
        "",
        "=== إحصائيات عامة ===",
        `إجمالي التسريبات: ${data.stats.totalLeaks}`,
        `تنبيهات حرجة: ${data.stats.criticalAlerts}`,
        `إجمالي السجلات المكشوفة: ${data.stats.totalRecords}`,
        `أجهزة الرصد النشطة: ${data.stats.activeMonitors}`,
        `بيانات شخصية مكتشفة: ${data.stats.piiDetected}`,
        "",
        "=== ملخص التسريبات ===",
        ...data.leaksSummary.map(
          (l) =>
            `[${l.severity.toUpperCase()}] ${l.title} | المصدر: ${l.source} | القطاع: ${l.sector} | السجلات: ${l.records} | الحالة: ${l.status}`
        ),
        "",
        `إجمالي التقارير المنشأة: ${data.totalReports}`,
      ];

      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ndmo-report-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير التقرير بنجاح");
    } catch {
      toast.error("فشل تصدير التقرير");
    }
  };

  const allReports = dbReports ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            التقارير والتوصيات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تقارير دورية لصناع القرار وتوصيات تحديث السياسات
          </p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground" onClick={handleExportReport}>
          <Download className="w-4 h-4" />
          تصدير تقرير شامل
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "تقارير منشورة", value: allReports.length || 4, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "فجوات سياسات", value: policyGaps.length, icon: AlertTriangle, color: "text-amber-400" },
          { label: "توصيات نشطة", value: 12, icon: TrendingUp, color: "text-cyan-400" },
          { label: "قطاعات مراقبة", value: 6, icon: Building2, color: "text-violet-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector risk radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">مستوى المخاطر حسب القطاع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar
                      name="مستوى المخاطر"
                      dataKey="A"
                      stroke="#06B6D4"
                      fill="#06B6D4"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Records exposed monthly */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">السجلات المكشوفة شهرياً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="records" name="السجلات" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Policy gaps */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            فجوات السياسات المكتشفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policyGaps.map((gap, i) => (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-secondary/20 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{gap.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{gap.titleEn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-secondary border-border">
                      {gap.sector}
                    </Badge>
                    <span className={`text-[10px] px-2 py-1 rounded border ${
                      gap.urgency === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                      gap.urgency === "high" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                      "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                    }`}>
                      {gap.urgency === "critical" ? "عاجل" : gap.urgency === "high" ? "مهم" : "متوسط"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{gap.description}</p>
                <div className="p-2 rounded bg-primary/5 border border-primary/10 mb-3">
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <ArrowUpLeft className="w-3 h-3" />
                    <strong>التوصية:</strong> {gap.recommendation}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">التقدم:</span>
                  <Progress value={gap.progress} className="flex-1 h-1.5" />
                  <span className="text-[10px] text-foreground font-medium">{gap.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated reports from DB */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            التقارير المُنشأة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : allReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد تقارير بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{report.titleAr || report.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString("ar-SA") : "—"}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${typeColor(report.type)}`}>{typeLabel(report.type)}</Badge>
                      {report.pageCount && <span>{report.pageCount} صفحة</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleExportReport}>
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
