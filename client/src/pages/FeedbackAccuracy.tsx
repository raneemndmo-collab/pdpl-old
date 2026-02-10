/**
 * FeedbackAccuracy — Analyst feedback and self-learning accuracy metrics
 * Precision, Recall, F1 Score tracking
 */
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Loader2,
  Brain,
  Activity,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const classLabels: Record<string, { label: string; color: string }> = {
  personal_data: { label: "بيانات شخصية", color: "text-red-400" },
  cybersecurity: { label: "أمن سيبراني", color: "text-amber-400" },
  clean: { label: "نظيف", color: "text-emerald-400" },
  unknown: { label: "غير محدد", color: "text-muted-foreground" },
};

export default function FeedbackAccuracy() {
  const { data: stats, isLoading: statsLoading } = trpc.feedback.stats.useQuery();
  const { data: entries, isLoading: entriesLoading } = trpc.feedback.list.useQuery();

  const isLoading = statsLoading || entriesLoading;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">مقاييس الدقة والتعلم</h1>
              <p className="text-xs text-muted-foreground">Feedback & Accuracy Metrics</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            نظام التعلم الذاتي — ملاحظات المحللين تحسّن دقة النظام تلقائياً
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "إجمالي التقييمات", value: stats?.total || 0, icon: BarChart3, color: "text-primary" },
              { label: "تصنيفات صحيحة", value: stats?.correct || 0, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Precision", value: `${stats?.precision || 0}%`, icon: Target, color: "text-cyan-400", subtitle: "الدقة" },
              { label: "Recall", value: `${stats?.recall || 0}%`, icon: Activity, color: "text-violet-400", subtitle: "الاستدعاء" },
              { label: "F1 Score", value: `${stats?.f1 || 0}%`, icon: Gauge, color: "text-amber-400", subtitle: "المقياس المتوازن" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gauge Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Precision (الدقة)", value: stats?.precision || 0, description: "نسبة التسريبات المكتشفة الصحيحة من إجمالي ما أعلنه النظام", color: "text-cyan-400", bg: "bg-cyan-500" },
              { label: "Recall (الاستدعاء)", value: stats?.recall || 0, description: "نسبة التسريبات الحقيقية التي اكتشفها النظام", color: "text-violet-400", bg: "bg-violet-500" },
              { label: "F1 Score", value: stats?.f1 || 0, description: "المتوسط التوافقي بين الدقة والاستدعاء", color: "text-amber-400", bg: "bg-amber-500" },
            ].map((metric) => (
              <Card key={metric.label} className="border-border">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-foreground mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground">{metric.value}%</p>
                  </div>
                  <div className="w-full h-3 rounded-full bg-secondary/50 overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${metric.bg}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feedback Entries */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                سجل ملاحظات المحللين ({entries?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!entries || entries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد ملاحظات بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">التسريب</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">تصنيف النظام</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">تصنيف المحلل</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">النتيجة</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">المحلل</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(0, 20).map((entry) => {
                        const sysClass = classLabels[entry.systemClassification] || classLabels.unknown;
                        const analystClass = classLabels[entry.analystClassification] || classLabels.unknown;
                        return (
                          <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="py-2 px-3">
                              <code className="text-xs font-mono text-primary">{entry.leakId}</code>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs ${sysClass.color}`}>{sysClass.label}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-xs ${analystClass.color}`}>{analystClass.label}</span>
                            </td>
                            <td className="py-2 px-3">
                              {entry.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">{entry.userName || "—"}</td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString("ar-SA")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
