/**
 * TrendPredictions — تنبؤات الذكاء الاصطناعي لاتجاهات التسريب
 * AI-Powered Trend Predictions with forecasting charts
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Brain, Sparkles, AlertTriangle,
  ChevronDown, BarChart3, Target, Zap,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface TrendPredictionsProps {
  monthlyTrend: { yearMonth: string; count: number; records: number }[];
  totalLeaks: number;
  totalRecords: number;
  newLeaks: number;
}

function analyzeData(
  monthlyTrend: { yearMonth: string; count: number; records: number }[],
  totalLeaks: number,
  totalRecords: number,
  newLeaks: number
) {
  const counts = monthlyTrend.map(m => m.count);
  const n = counts.length;
  const avgMonthly = n > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / n) : 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  counts.forEach((y, x) => { sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; });
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
  const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

  const predictedValues = counts.map((_, i) => Math.max(0, Math.round(slope * i + intercept)));
  const predictedNext3 = [0, 1, 2].map(i => Math.max(0, Math.round(slope * (n + i) + intercept)));

  const trend: "rising" | "declining" | "stable" =
    slope > 2 ? "rising" : slope < -2 ? "declining" : "stable";

  const peakIdx = counts.length > 0 ? counts.indexOf(Math.max(...counts)) : 0;
  const peakMonth = monthlyTrend[peakIdx]?.yearMonth || "";

  const riskScore = Math.min(100, Math.round(
    (newLeaks / Math.max(totalLeaks, 1)) * 40 +
    (slope > 0 ? slope * 5 : 0) +
    (totalRecords > 100000000 ? 30 : totalRecords > 10000000 ? 20 : 10)
  ));

  const confidence = Math.min(95, Math.max(30, Math.round(60 + (n - 3) * 5 - Math.abs(slope) * 0.5)));

  return { avgMonthly, predictedValues, predictedNext3, trend, peakMonth, riskScore, confidence, slope };
}

export default function TrendPredictions({ monthlyTrend, totalLeaks, totalRecords, newLeaks }: TrendPredictionsProps) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const analysis = useMemo(
    () => analyzeData(monthlyTrend, totalLeaks, totalRecords, newLeaks),
    [monthlyTrend, totalLeaks, totalRecords, newLeaks]
  );

  const trendConfig = {
    rising: { icon: TrendingUp, label: "تصاعدي", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    declining: { icon: TrendingDown, label: "تراجعي", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    stable: { icon: Minus, label: "مستقر", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  };

  const tc = trendConfig[analysis.trend];
  const TrendIcon = tc.icon;
  const maxVal = Math.max(...monthlyTrend.map(m => m.count), ...analysis.predictedNext3, 1);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "#ef4444";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#3b82f6";
    return "#10b981";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return "حرج";
    if (score >= 60) return "مرتفع";
    if (score >= 40) return "متوسط";
    return "منخفض";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border overflow-hidden ${isDark
        ? "bg-gradient-to-br from-[#0f172a]/90 to-[#1e293b]/80 border-white/[0.06] backdrop-blur-xl"
        : "bg-white/90 border-[#e2e5ef] shadow-lg shadow-blue-500/5"
      }`}
    >
      <div className="flex items-center justify-between p-5 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-gradient-to-br from-violet-500/20 to-blue-500/20" : "bg-gradient-to-br from-violet-100 to-blue-100"}`}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Brain className={`w-5 h-5 ${isDark ? "text-violet-400" : "text-violet-600"}`} />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              تنبؤات الذكاء الاصطناعي
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-muted-foreground">AI Trend Predictions & Risk Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${tc.bg} ${tc.color} ${tc.border} border`}>
            <TrendIcon className="w-3 h-3" />
            {tc.label}
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${getRiskColor(analysis.riskScore)} ${analysis.riskScore}%, transparent 0)` }}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${isDark ? "bg-[#0f172a] text-white" : "bg-white text-slate-800"}`}>
              {analysis.riskScore}
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: "المتوسط الشهري", value: analysis.avgMonthly, icon: BarChart3, color: "text-blue-400" },
                  { label: "التوقع القادم", value: analysis.predictedNext3[0], icon: Target, color: "text-violet-400" },
                  { label: "مستوى المخاطر", value: getRiskLabel(analysis.riskScore), icon: AlertTriangle, color: "text-amber-400" },
                  { label: "دقة التنبؤ", value: `${analysis.confidence}%`, icon: Zap, color: "text-amber-400" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`p-3 rounded-xl text-center ${isDark ? "bg-white/[0.03] border border-white/[0.05]" : "bg-slate-50 border border-slate-100"}`}>
                    <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-medium">الاتجاه الفعلي مقابل التوقعات</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500" /> فعلي</span>
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-violet-500 opacity-60" /> متوقع</span>
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-amber-500 opacity-40" /> تنبؤ</span>
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${isDark ? "bg-[#0a0f1e]/60" : "bg-slate-50"}`}>
                  <svg viewBox="0 0 600 180" className="w-full h-32">
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                      <line key={pct} x1="40" y1={20 + pct * 140} x2="580" y2={20 + pct * 140}
                        stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} strokeDasharray="4 4" />
                    ))}
                    {monthlyTrend.length > 1 && (
                      <motion.path
                        d={monthlyTrend.map((m, i) => {
                          const x = 40 + i * (540 / (monthlyTrend.length + 2));
                          const y = 160 - (m.count / maxVal) * 140;
                          return `${i === 0 ? "M" : "L"}${x},${y}`;
                        }).join(" ")}
                        fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
                      />
                    )}
                    {analysis.predictedValues.length > 1 && (
                      <path
                        d={analysis.predictedValues.map((v, i) => {
                          const x = 40 + i * (540 / (monthlyTrend.length + 2));
                          const y = 160 - (v / maxVal) * 140;
                          return `${i === 0 ? "M" : "L"}${x},${y}`;
                        }).join(" ")}
                        fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
                      />
                    )}
                    {monthlyTrend.map((m, i) => {
                      const x = 40 + i * (540 / (monthlyTrend.length + 2));
                      const y = 160 - (m.count / maxVal) * 140;
                      return (
                        <g key={m.yearMonth}>
                          <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke={isDark ? "#0f172a" : "#fff"} strokeWidth="2" />
                          <text x={x} y={170} textAnchor="middle" className="text-[8px]" fill={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}>{m.yearMonth.slice(5)}</text>
                        </g>
                      );
                    })}
                    {analysis.predictedNext3.map((v, i) => {
                      const startX = 40 + (monthlyTrend.length - 1) * (540 / (monthlyTrend.length + 2));
                      const x = startX + (i + 1) * (540 / (monthlyTrend.length + 2));
                      const y = 160 - (v / maxVal) * 140;
                      return <motion.circle key={`pred-${i}`} cx={x} cy={y} r="3.5" fill="#f59e0b" stroke={isDark ? "#0f172a" : "#fff"} strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 + i * 0.2 }} />;
                    })}
                  </svg>
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className={`mt-4 p-4 rounded-xl text-xs leading-relaxed ${isDark
                  ? "bg-gradient-to-r from-violet-500/5 to-blue-500/5 border border-violet-500/10 text-slate-300"
                  : "bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 text-slate-600"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-bold text-foreground text-[11px]">تحليل الذكاء الاصطناعي</span>
                </div>
                {analysis.trend === "rising" ? (
                  <p>يُظهر التحليل <strong className="text-red-400">اتجاهاً تصاعدياً</strong> في حوادث التسريب بمتوسط <strong>{analysis.avgMonthly}</strong> حادثة شهرياً. التوقع للشهر القادم هو <strong>{analysis.predictedNext3[0]}</strong> حادثة. ذروة النشاط كانت في <strong>{analysis.peakMonth}</strong>. مستوى المخاطر: <strong style={{ color: getRiskColor(analysis.riskScore) }}>{getRiskLabel(analysis.riskScore)}</strong>. يُوصى بتكثيف عمليات الرصد وتعزيز إجراءات الحماية.</p>
                ) : analysis.trend === "declining" ? (
                  <p>يُظهر التحليل <strong className="text-emerald-400">تراجعاً إيجابياً</strong> في حوادث التسريب بمتوسط <strong>{analysis.avgMonthly}</strong> حادثة شهرياً. مستوى المخاطر: <strong style={{ color: getRiskColor(analysis.riskScore) }}>{getRiskLabel(analysis.riskScore)}</strong>. يُوصى بالاستمرار في المراقبة الدورية.</p>
                ) : (
                  <p>يُظهر التحليل <strong className="text-blue-400">استقراراً نسبياً</strong> في حوادث التسريب بمتوسط <strong>{analysis.avgMonthly}</strong> حادثة شهرياً. مستوى المخاطر: <strong style={{ color: getRiskColor(analysis.riskScore) }}>{getRiskLabel(analysis.riskScore)}</strong>. يُوصى بالحفاظ على مستوى الرصد الحالي مع تحسين أدوات الكشف المبكر.</p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
