/**
 * Reports — Legislative reporting and policy insights
 * All stats, charts, policy gaps, and reports are clickable with detail modals
 */
import { useState } from "react";
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
  Send,
  FileWarning,
  Scale,
  Timer,
  Info,
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
import { DetailModal } from "@/components/DetailModal";
import ComplianceWarningDialog from "@/components/ComplianceWarningDialog";
import ReportCustomizer from "@/components/ReportCustomizer";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

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
    details: "تم رصد 42 حادثة تسريب تتضمن سجلات صحية خلال الأشهر الستة الماضية. تشمل البيانات المسربة: السجلات الطبية، نتائج الفحوصات المخبرية، الوصفات الطبية، وبيانات التأمين الصحي. القطاع الصحي يفتقر حالياً لسياسة مخصصة تتوافق مع متطلبات PDPL.",
    affectedEntities: ["المستشفيات الحكومية", "المستشفيات الخاصة", "شركات التأمين الصحي", "المختبرات الطبية"],
    timeline: "Q2 2026",
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
    details: "قطاع الاتصالات يمثل 35% من إجمالي التسريبات المرصودة. البيانات المسربة تشمل: أرقام الجوال، سجلات المكالمات، بيانات الموقع الجغرافي، ومعلومات الفوترة. المعايير الحالية لا تفرض مستوى تشفير محدد.",
    affectedEntities: ["STC", "Mobily", "Zain", "مشغلو MVNO"],
    timeline: "Q3 2026",
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
    details: "حالياً لا يوجد إطار موحد يلزم الجهات بالإبلاغ عن حوادث تسريب البيانات خلال فترة زمنية محددة. هذا يؤدي لتأخر الاستجابة وزيادة الأضرار. الإطار المقترح يشمل: إبلاغ خلال 72 ساعة، تصنيف الحوادث، وخطة استجابة.",
    affectedEntities: ["جميع الجهات الحكومية", "القطاع الخاص", "الجهات التنظيمية"],
    timeline: "Q1 2026",
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
    details: "بيانات الإقامة (أرقام الإقامة، بيانات الكفيل، تواريخ الانتهاء) تظهر بشكل متزايد في عروض البيع على الدارك ويب. 18 حادثة تسريب خلال الربع الأخير تضمنت بيانات إقامة.",
    affectedEntities: ["وزارة الداخلية", "الجوازات", "وزارة الموارد البشرية"],
    timeline: "Q4 2026",
  },
];

const recommendations = [
  { id: 1, title: "تطبيق التشفير الإلزامي للبيانات الحساسة", sector: "عام", priority: "عاجل", status: "قيد التنفيذ" },
  { id: 2, title: "إنشاء فريق استجابة وطني لحوادث التسريب", sector: "عام", priority: "عاجل", status: "مكتمل" },
  { id: 3, title: "تحديث معايير PDPL للقطاع الصحي", sector: "صحة", priority: "مهم", status: "قيد المراجعة" },
  { id: 4, title: "إلزام مشغلي الاتصالات بتقارير أمنية ربع سنوية", sector: "اتصالات", priority: "مهم", status: "قيد التنفيذ" },
  { id: 5, title: "تطوير نظام إنذار مبكر للتسريبات", sector: "عام", priority: "عاجل", status: "قيد التنفيذ" },
  { id: 6, title: "برنامج توعية وطني لحماية البيانات", sector: "عام", priority: "متوسط", status: "مخطط" },
  { id: 7, title: "ضوابط مشاركة البيانات بين الجهات", sector: "حكومة", priority: "مهم", status: "قيد المراجعة" },
  { id: 8, title: "معايير أمان تطبيقات الجوال", sector: "تقنية", priority: "مهم", status: "مخطط" },
  { id: 9, title: "تدقيق أمني دوري للبنية التحتية", sector: "عام", priority: "عاجل", status: "قيد التنفيذ" },
  { id: 10, title: "إطار حوكمة البيانات الوطني", sector: "عام", priority: "عاجل", status: "قيد المراجعة" },
  { id: 11, title: "تصنيف البيانات حسب مستوى الحساسية", sector: "عام", priority: "مهم", status: "مكتمل" },
  { id: 12, title: "آلية تعويض المتضررين من التسريبات", sector: "قانوني", priority: "متوسط", status: "مخطط" },
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
      <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-lg">
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
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedGap, setSelectedGap] = useState<typeof policyGaps[0] | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportCustomizer, setShowReportCustomizer] = useState(false);
  const [showComplianceWarning, setShowComplianceWarning] = useState(false);
  const [drillLeak, setDrillLeak] = useState<any>(null);

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
        <div className="flex gap-2">
          <Button className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white" onClick={() => setShowReportCustomizer(true)}>
            <FileText className="w-4 h-4" />
            إنشاء تقرير مخصص
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowComplianceWarning(true)}>
            <Download className="w-4 h-4" />
            تصدير سريع
          </Button>
        </div>
      </div>

      {/* Key metrics — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "reports", label: "تقارير منشورة", value: allReports.length || 4, icon: CheckCircle2, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "gaps", label: "فجوات سياسات", value: policyGaps.length, icon: AlertTriangle, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
          { key: "recommendations", label: "توصيات نشطة", value: 12, icon: TrendingUp, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "sectors", label: "قطاعات مراقبة", value: 6, icon: Building2, color: "text-violet-400", borderColor: "border-violet-500/20", bgColor: "bg-violet-500/5" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className={`border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:scale-[1.02] transition-all group`}
                onClick={() => setActiveModal(stat.key)}
              >
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
                  <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveModal("radarChart")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                مستوى المخاطر حسب القطاع
                <span className="text-[9px] text-primary/50">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(128,128,128,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "currentColor" }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar name="مستوى المخاطر" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveModal("barChart")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                السجلات المكشوفة شهرياً
                <span className="text-[9px] text-primary/50">اضغط للتفاصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
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

      {/* Policy gaps — clickable */}
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
                className="p-4 rounded-lg bg-secondary/20 border border-border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => { setSelectedGap(gap); setActiveModal("gapDetail"); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{gap.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{gap.titleEn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-secondary border-border">{gap.sector}</Badge>
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
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">التقدم:</span>
                  <Progress value={gap.progress} className="flex-1 h-1.5" />
                  <span className="text-[10px] text-foreground font-medium">{gap.progress}%</span>
                </div>
                <p className="text-[9px] text-primary/50 mt-2">اضغط للتفاصيل والتوصيات ←</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated reports from DB — clickable */}
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
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => { setSelectedReport(report); setActiveModal("reportDetail"); }}
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
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleExportReport(); }}>
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ MODALS ═══ */}

      {/* Reports Modal */}
      <DetailModal open={activeModal === "reports"} onClose={() => setActiveModal(null)} title="التقارير المنشورة" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{allReports.length || 4} تقرير منشور</p>
          {allReports.map(report => (
            <div
              key={report.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedReport(report); setActiveModal("reportDetail"); }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{report.titleAr || report.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString("ar-SA") : "—"}</span>
                <Badge variant="outline" className={`text-[10px] ${typeColor(report.type)}`}>{typeLabel(report.type)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Policy Gaps Modal */}
      <DetailModal open={activeModal === "gaps"} onClose={() => setActiveModal(null)} title="فجوات السياسات" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          {policyGaps.map(gap => (
            <div
              key={gap.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedGap(gap); setActiveModal("gapDetail"); }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  gap.urgency === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                  gap.urgency === "high" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  {gap.urgency === "critical" ? "عاجل" : gap.urgency === "high" ? "مهم" : "متوسط"}
                </span>
                <span className="text-sm font-medium text-foreground">{gap.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{gap.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={gap.progress} className="flex-1 h-1" />
                <span className="text-[10px] text-foreground">{gap.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Recommendations Modal */}
      <DetailModal open={activeModal === "recommendations"} onClose={() => setActiveModal(null)} title="التوصيات النشطة" icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
              <p className="text-xl font-bold text-emerald-400">{recommendations.filter(r => r.status === "مكتمل").length}</p>
              <p className="text-[10px] text-muted-foreground">مكتملة</p>
            </div>
            <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
              <p className="text-xl font-bold text-cyan-400">{recommendations.filter(r => r.status === "قيد التنفيذ").length}</p>
              <p className="text-[10px] text-muted-foreground">قيد التنفيذ</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
              <p className="text-xl font-bold text-amber-400">{recommendations.filter(r => r.status === "مخطط").length}</p>
              <p className="text-[10px] text-muted-foreground">مخطط</p>
            </div>
          </div>
          {recommendations.map(rec => (
            <div key={rec.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  rec.status === "مكتمل" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                  rec.status === "قيد التنفيذ" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" :
                  rec.status === "قيد المراجعة" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                  "text-muted-foreground bg-secondary/50 border-border"
                }`}>{rec.status}</span>
                <Badge variant="outline" className="text-[10px]">{rec.sector}</Badge>
              </div>
              <p className="text-sm text-foreground">{rec.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1">الأولوية: {rec.priority}</p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Sectors Modal */}
      <DetailModal open={activeModal === "sectors"} onClose={() => setActiveModal(null)} title="القطاعات المراقبة" icon={<Building2 className="w-5 h-5 text-violet-400" />}>
        <div className="space-y-3">
          {radarData.map(sector => (
            <div key={sector.subject} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">{sector.subject}</h4>
                <span className={`text-sm font-bold ${
                  sector.A >= 70 ? "text-red-400" : sector.A >= 50 ? "text-amber-400" : "text-emerald-400"
                }`}>{sector.A}%</span>
              </div>
              <Progress value={sector.A} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-2">
                {sector.A >= 70 ? "مستوى مخاطر عالي — يتطلب إجراءات فورية" :
                 sector.A >= 50 ? "مستوى مخاطر متوسط — يتطلب مراقبة مكثفة" :
                 "مستوى مخاطر منخفض — المراقبة الدورية كافية"}
              </p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Radar Chart Detail Modal */}
      <DetailModal open={activeModal === "radarChart"} onClose={() => setActiveModal(null)} title="تفاصيل مخاطر القطاعات" icon={<Shield className="w-5 h-5 text-cyan-400" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(128,128,128,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "currentColor" }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar name="مستوى المخاطر" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {radarData.map(sector => (
              <div key={sector.subject} className={`p-3 rounded-xl border text-center ${
                sector.A >= 70 ? "bg-red-500/5 border-red-500/20" :
                sector.A >= 50 ? "bg-amber-500/5 border-amber-500/20" :
                "bg-emerald-500/5 border-emerald-500/20"
              }`}>
                <p className="text-sm font-bold text-foreground">{sector.subject}</p>
                <p className={`text-2xl font-bold ${
                  sector.A >= 70 ? "text-red-400" : sector.A >= 50 ? "text-amber-400" : "text-emerald-400"
                }`}>{sector.A}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {sector.A >= 70 ? "خطورة عالية" : sector.A >= 50 ? "خطورة متوسطة" : "خطورة منخفضة"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DetailModal>

      {/* Bar Chart Detail Modal */}
      <DetailModal open={activeModal === "barChart"} onClose={() => setActiveModal(null)} title="تفاصيل السجلات المكشوفة شهرياً" icon={<BarChart3 className="w-5 h-5 text-cyan-400" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="records" name="السجلات" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leaks" name="التسريبات" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">الشهر</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">عدد التسريبات</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">السجلات المكشوفة</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">التغير</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((m, i) => (
                  <tr key={m.month} className="border-b border-border/30">
                    <td className="py-2 px-3 text-foreground font-medium">{m.month}</td>
                    <td className="py-2 px-3 text-foreground">{m.leaks}</td>
                    <td className="py-2 px-3 text-foreground">{m.records.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      {i > 0 ? (
                        <span className={m.records > monthlyTrends[i-1].records ? "text-red-400" : "text-emerald-400"}>
                          {m.records > monthlyTrends[i-1].records ? "↑" : "↓"} {Math.abs(Math.round((m.records - monthlyTrends[i-1].records) / monthlyTrends[i-1].records * 100))}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DetailModal>

      {/* Gap Detail Modal */}
      <DetailModal
        open={activeModal === "gapDetail" && !!selectedGap}
        onClose={() => { setActiveModal(null); setSelectedGap(null); }}
        title={selectedGap?.title ?? "تفاصيل الفجوة"}
        icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
      >
        {selectedGap && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{selectedGap.sector}</Badge>
              <span className={`text-[10px] px-2 py-1 rounded border ${
                selectedGap.urgency === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                selectedGap.urgency === "high" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
              }`}>
                {selectedGap.urgency === "critical" ? "عاجل" : selectedGap.urgency === "high" ? "مهم" : "متوسط"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{selectedGap.id}</span>
            </div>
            <p className="text-xs text-muted-foreground">{selectedGap.titleEn}</p>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">التحليل التفصيلي</h4>
              <p className="text-sm text-foreground leading-relaxed">{selectedGap.details}</p>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <ArrowUpLeft className="w-3 h-3" />
                التوصية
              </h4>
              <p className="text-sm text-foreground">{selectedGap.recommendation}</p>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">الجهات المتأثرة</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedGap.affectedEntities.map(entity => (
                  <Badge key={entity} variant="outline" className="text-[10px]">{entity}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">نسبة الإنجاز</p>
                <p className="text-2xl font-bold text-foreground mt-1">{selectedGap.progress}%</p>
                <Progress value={selectedGap.progress} className="h-2 mt-2" />
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الموعد المستهدف</p>
                <p className="text-lg font-bold text-foreground mt-1">{selectedGap.timeline}</p>
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Report Detail Modal */}
      <DetailModal
        open={activeModal === "reportDetail" && !!selectedReport}
        onClose={() => { setActiveModal(null); setSelectedReport(null); }}
        title={selectedReport?.titleAr || selectedReport?.title || "تفاصيل التقرير"}
        icon={<FileText className="w-5 h-5 text-primary" />}
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">النوع</p>
                <p className="text-sm font-bold text-foreground mt-1">{typeLabel(selectedReport.type)}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الصفحات</p>
                <p className="text-sm font-bold text-foreground mt-1">{selectedReport.pageCount || "—"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleDateString("ar-SA") : "—"}
                </p>
              </div>
            </div>
            {selectedReport.summaryAr && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ملخص التقرير</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedReport.summaryAr}</p>
              </div>
            )}
            <Button className="w-full gap-2" onClick={() => setShowComplianceWarning(true)}>
              <Download className="w-4 h-4" />
              تصدير هذا التقرير
            </Button>
          </div>
        )}
      </DetailModal>

      {/* Report Customizer */}
      <ReportCustomizer
        open={showReportCustomizer}
        onClose={() => setShowReportCustomizer(false)}
      />

      {/* Compliance Warning for Quick Export */}
      <ComplianceWarningDialog
        open={showComplianceWarning}
        onConfirm={() => {
          setShowComplianceWarning(false);
          handleExportReport();
        }}
        onCancel={() => setShowComplianceWarning(false)}
        reportType="التقرير"
      />

      {/* Leak Detail Drilldown */}
      <LeakDetailDrilldown
        leak={drillLeak}
        open={!!drillLeak}
        onClose={() => setDrillLeak(null)}
        showBackButton={true}
        onBack={() => setDrillLeak(null)}
      />
    </div>
  );
}
