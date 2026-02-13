/**
 * ExecutiveSummary — ملخص تنفيذي مع مقاييس المخاطر والامتثال
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, Clock, Target, Gauge, CheckCircle2, XCircle, Building2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ExecSummaryProps {
  totalLeaks: number;
  newLeaks: number;
  totalRecords: number;
  sectorDistribution: { sector: string; count: number; records: number }[];
  monthlyTrend: { yearMonth: string; count: number }[];
}

export default function ExecutiveSummary({ totalLeaks, newLeaks, totalRecords, sectorDistribution, monthlyTrend }: ExecSummaryProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const riskScore = useMemo(() => {
    const recentMonths = monthlyTrend.slice(-3);
    const recentAvg = recentMonths.length > 0 ? recentMonths.reduce((a, b) => a + b.count, 0) / recentMonths.length : 0;
    const olderMonths = monthlyTrend.slice(-6, -3);
    const olderAvg = olderMonths.length > 0 ? olderMonths.reduce((a, b) => a + b.count, 0) / olderMonths.length : 0;
    const trendFactor = olderAvg > 0 ? (recentAvg / olderAvg) * 30 : 15;
    const volumeFactor = Math.min(40, (totalRecords / 500000000) * 40);
    const newFactor = Math.min(30, (newLeaks / Math.max(totalLeaks, 1)) * 60);
    return Math.min(100, Math.round(trendFactor + volumeFactor + newFactor));
  }, [totalLeaks, newLeaks, totalRecords, monthlyTrend]);

  const complianceItems = useMemo(() => [
    { label: "سياسة الخصوصية", compliant: true },
    { label: "تقييم الأثر", compliant: true },
    { label: "إشعار الجهات", compliant: totalLeaks > 0 },
    { label: "تسجيل أنشطة المعالجة", compliant: true },
    { label: "تعيين مسؤول حماية", compliant: true },
    { label: "إجراءات الاستجابة", compliant: newLeaks < 50 },
  ], [totalLeaks, newLeaks]);

  const compliancePercent = useMemo(() => {
    const c = complianceItems.filter(i => i.compliant).length;
    return Math.round((c / complianceItems.length) * 100);
  }, [complianceItems]);

  const topThreats = useMemo(() => {
    return sectorDistribution.slice(0, 5).map(s => ({
      title: s.sector || "غير محدد",
      count: s.count,
      records: s.records,
      severity: s.count > 50 ? "critical" : s.count > 20 ? "high" : s.count > 10 ? "medium" : "low",
    }));
  }, [sectorDistribution]);

  const avgResponseHours = useMemo(() => Math.max(2, Math.round(48 - (compliancePercent / 100) * 30)), [compliancePercent]);

  const getRiskColor = (s: number) => s >= 80 ? "#ef4444" : s >= 60 ? "#f59e0b" : s >= 40 ? "#3b82f6" : "#10b981";
  const getRiskLabel = (s: number) => s >= 80 ? "حرج" : s >= 60 ? "مرتفع" : s >= 40 ? "متوسط" : "منخفض";
  const getSevColor = (sev: string) => sev === "critical" ? "text-red-400 bg-red-500/10" : sev === "high" ? "text-amber-400 bg-amber-500/10" : sev === "medium" ? "text-blue-400 bg-blue-500/10" : "text-emerald-400 bg-emerald-500/10";

  const sectorColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];

  const donutSegments = useMemo(() => {
    const total = sectorDistribution.reduce((a, b) => a + b.count, 0);
    let cumulative = 0;
    return sectorDistribution.slice(0, 6).map((s, i) => {
      const pct = total > 0 ? (s.count / total) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return { ...s, pct, start, color: sectorColors[i % sectorColors.length] };
    });
  }, [sectorDistribution]);

  const cardClass = `rounded-2xl border p-5 ${isDark ? "bg-gradient-to-br from-[#0f172a]/90 to-[#1e293b]/80 border-white/[0.06]" : "bg-white/90 border-[#e2e5ef] shadow-lg shadow-blue-500/5"}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Risk Score Gauge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Gauge className={`w-4 h-4 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
          <span className="text-xs font-bold text-foreground">مقياس المخاطر</span>
          <span className="text-[9px] text-muted-foreground mr-auto">Risk Score</span>
        </div>
        <div className="flex justify-center mb-3">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="40" fill="none" stroke={getRiskColor(riskScore)} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${riskScore * 2.51} 251`}
                initial={{ strokeDasharray: "0 251" }} animate={{ strokeDasharray: `${riskScore * 2.51} 251` }}
                transition={{ duration: 1.5, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground">{riskScore}</span>
              <span className="text-[9px] font-bold" style={{ color: getRiskColor(riskScore) }}>{getRiskLabel(riskScore)}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {[{ l: "منخفض", c: "#10b981" }, { l: "متوسط", c: "#3b82f6" }, { l: "مرتفع", c: "#f59e0b" }, { l: "حرج", c: "#ef4444" }].map(z => (
            <span key={z.l} className="flex items-center gap-1 text-[8px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: z.c }} />{z.l}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Compliance Meter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className={`w-4 h-4 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
          <span className="text-xs font-bold text-foreground">الامتثال PDPL</span>
          <span className="text-[9px] text-muted-foreground mr-auto">Compliance</span>
        </div>
        <div className="flex justify-center mb-3">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="40" fill="none" stroke={compliancePercent >= 80 ? "#10b981" : compliancePercent >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${compliancePercent * 2.51} 251`}
                initial={{ strokeDasharray: "0 251" }} animate={{ strokeDasharray: `${compliancePercent * 2.51} 251` }}
                transition={{ duration: 1.5, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-foreground">{compliancePercent}%</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {complianceItems.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-[10px]">
              {item.compliant ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
              <span className={item.compliant ? "text-muted-foreground" : "text-red-400 font-medium"}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Threats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Target className={`w-4 h-4 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
          <span className="text-xs font-bold text-foreground">أبرز التهديدات</span>
          <span className="text-[9px] text-muted-foreground mr-auto">Top Threats</span>
        </div>
        <div className="space-y-2">
          {topThreats.map((t, i) => {
            const maxCount = topThreats[0]?.count || 1;
            const pct = (t.count / maxCount) * 100;
            const sevClass = getSevColor(t.severity);
            return (
              <motion.div key={t.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-foreground font-medium truncate max-w-[60%]">{t.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${sevClass} font-bold`}>{t.count}</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: t.severity === "critical" ? "#ef4444" : t.severity === "high" ? "#f59e0b" : t.severity === "medium" ? "#3b82f6" : "#10b981" }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Response Time + Sector Donut */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`w-4 h-4 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
          <span className="text-xs font-bold text-foreground">وقت الاستجابة</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-black text-foreground">{avgResponseHours}</span>
          <div>
            <span className="text-[10px] text-muted-foreground block">ساعة (متوسط)</span>
            <span className={`text-[9px] font-bold ${avgResponseHours < 24 ? "text-emerald-400" : avgResponseHours < 48 ? "text-amber-400" : "text-red-400"}`}>
              {avgResponseHours < 24 ? "ممتاز" : avgResponseHours < 48 ? "مقبول" : "يحتاج تحسين"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className={`w-3.5 h-3.5 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
          <span className="text-[10px] font-bold text-foreground">توزيع القطاعات</span>
        </div>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0">
            {donutSegments.map((seg, i) => {
              const r = 35;
              const circumference = 2 * Math.PI * r;
              const dashLength = (seg.pct / 100) * circumference;
              const dashOffset = -((seg.start / 100) * circumference);
              return (
                <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="10"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`} strokeDashoffset={dashOffset}
                  className="-rotate-90 origin-center" />
              );
            })}
          </svg>
          <div className="space-y-0.5 overflow-hidden">
            {donutSegments.slice(0, 4).map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px]">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-muted-foreground truncate">{seg.sector || "غير محدد"}</span>
                <span className="font-bold text-foreground mr-auto">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
