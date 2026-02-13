/**
 * MonthlyComparison — Month-over-Month comparison panel
 * Shows visual comparison between current and previous month metrics
 * with animated bars, delta indicators, and mini sparklines
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  ShieldAlert,
  Database,
  Radio,
  Globe,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

/* ═══ Helpers ═══ */
function calcDelta(current: number, previous: number): { value: number; percent: number; direction: "up" | "down" | "same" } {
  const diff = current - previous;
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((diff / previous) * 100);
  return {
    value: Math.abs(diff),
    percent: Math.abs(percent),
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
  };
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/* ═══ Delta Badge ═══ */
function DeltaBadge({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  const delta = calcDelta(current, previous);
  // For leaks, "up" is bad (red), "down" is good (green)
  // For resolved, "up" is good (green), "down" is bad (red) - use inverse
  const isPositive = inverse ? delta.direction === "up" : delta.direction === "down";
  const isNegative = inverse ? delta.direction === "down" : delta.direction === "up";

  if (delta.direction === "same") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded-full">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        isPositive
          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
          : isNegative
          ? "text-red-400 bg-red-500/10 border border-red-500/20"
          : "text-slate-400 bg-slate-500/10"
      }`}
    >
      {delta.direction === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {delta.percent}%
    </motion.span>
  );
}

/* ═══ Comparison Bar ═══ */
function ComparisonBar({ label, current, previous, icon: Icon, color }: {
  label: string; current: number; previous: number; icon: React.ElementType; color: string;
}) {
  const max = Math.max(current, previous, 1);
  const currentPct = (current / max) * 100;
  const prevPct = (previous / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <DeltaBadge current={current} previous={previous} />
      </div>
      <div className="space-y-1.5">
        {/* Current month bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 text-left">الحالي</span>
          <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-blue-500 relative"
            >
              <div className="absolute inset-0 bg-white/10 rounded-full" />
            </motion.div>
          </div>
          <span className="text-xs font-bold text-foreground w-12 text-left tabular-nums">{formatNumber(current)}</span>
        </div>
        {/* Previous month bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 text-left">السابق</span>
          <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prevPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full bg-gradient-to-l from-slate-400 to-slate-500 relative opacity-60"
            >
              <div className="absolute inset-0 bg-white/5 rounded-full" />
            </motion.div>
          </div>
          <span className="text-xs font-medium text-muted-foreground w-12 text-left tabular-nums">{formatNumber(previous)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Mini Sparkline ═══ */
function MiniSparkline({ data, color = "#3DB1AC", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const width = 200;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (v / max) * (height - 4),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
      )}
    </svg>
  );
}

/* ═══ Sector Comparison ═══ */
function SectorComparison({ currentSectors, prevSectors }: {
  currentSectors: { sector: string | null; count: number }[];
  prevSectors: { sector: string | null; count: number }[];
}) {
  const allSectors = useMemo(() => {
    const sectorMap = new Map<string, { current: number; previous: number }>();
    currentSectors.forEach(s => {
      const name = s.sector || "غير محدد";
      sectorMap.set(name, { current: s.count, previous: 0 });
    });
    prevSectors.forEach(s => {
      const name = s.sector || "غير محدد";
      const existing = sectorMap.get(name) || { current: 0, previous: 0 };
      existing.previous = s.count;
      sectorMap.set(name, existing);
    });
    return Array.from(sectorMap.entries())
      .sort((a, b) => (b[1].current + b[1].previous) - (a[1].current + a[1].previous))
      .slice(0, 6);
  }, [currentSectors, prevSectors]);

  const maxVal = Math.max(...allSectors.map(([, v]) => Math.max(v.current, v.previous)), 1);

  return (
    <div className="space-y-3">
      {allSectors.map(([sector, vals], idx) => (
        <motion.div
          key={sector}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center gap-3"
        >
          <span className="text-[11px] text-muted-foreground w-24 truncate text-left" title={sector}>
            {sector}
          </span>
          <div className="flex-1 flex items-center gap-1">
            {/* Current bar */}
            <div className="flex-1 h-4 bg-muted/20 rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(vals.current / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="h-full bg-gradient-to-l from-cyan-500 to-blue-500 rounded-sm"
              />
            </div>
            {/* Previous bar (faded) */}
            <div className="flex-1 h-4 bg-muted/20 rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(vals.previous / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: idx * 0.05 + 0.1 }}
                className="h-full bg-gradient-to-l from-slate-400 to-slate-500 rounded-sm opacity-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-20">
            <span className="text-[10px] font-bold text-cyan-400 tabular-nums">{vals.current}</span>
            <span className="text-[10px] text-muted-foreground/40">/</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{vals.previous}</span>
            <DeltaBadge current={vals.current} previous={vals.previous} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══ Main Component ═══ */
export default function MonthlyComparison() {
  const { data, isLoading } = trpc.dashboard.monthlyComparison.useQuery();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted/20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { currentMonth, previousMonth } = data;

  // KPI comparison cards
  const kpiItems = [
    {
      label: "إجمالي التسريبات",
      labelEn: "Total Leaks",
      current: currentMonth.totalLeaks,
      previous: previousMonth.totalLeaks,
      icon: ShieldAlert,
      color: "text-red-400 bg-red-500/10",
    },
    {
      label: "السجلات المكشوفة",
      labelEn: "Exposed Records",
      current: currentMonth.totalRecords,
      previous: previousMonth.totalRecords,
      icon: Database,
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      label: "حوادث حرجة",
      labelEn: "Critical Incidents",
      current: currentMonth.criticalCount,
      previous: previousMonth.criticalCount,
      icon: Zap,
      color: "text-red-400 bg-red-500/10",
    },
    {
      label: "تم حلها",
      labelEn: "Resolved",
      current: currentMonth.resolvedCount,
      previous: previousMonth.resolvedCount,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10",
      inverse: true,
    },
  ];

  // Source comparison
  const sourceItems = [
    { label: "تيليجرام", current: currentMonth.telegramCount, previous: previousMonth.telegramCount, icon: Radio, color: "text-blue-400 bg-blue-500/10" },
    { label: "الويب المظلم", current: currentMonth.darkwebCount, previous: previousMonth.darkwebCount, icon: Globe, color: "text-purple-400 bg-purple-500/10" },
    { label: "مواقع اللصق", current: currentMonth.pasteCount, previous: previousMonth.pasteCount, icon: FileText, color: "text-yellow-400 bg-yellow-500/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between"
        style={{ background: isDark ? "rgba(13, 21, 41, 0.5)" : "rgba(22, 42, 84, 0.03)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
            <Calendar className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">المقارنة الشهرية</h3>
            <p className="text-[11px] text-muted-foreground">
              {currentMonth.name} {currentMonth.year} مقابل {previousMonth.name} {previousMonth.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-3 h-1.5 rounded-full bg-gradient-to-l from-cyan-500 to-blue-500" />
            <span className="text-muted-foreground">{currentMonth.name}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-3 h-1.5 rounded-full bg-slate-400/50" />
            <span className="text-muted-foreground">{previousMonth.name}</span>
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiItems.map((item, idx) => {
            const delta = calcDelta(item.current, item.previous);
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card rounded-xl p-4 border border-border/50 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <DeltaBadge current={item.current} previous={item.previous} inverse={item.inverse} />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-foreground tabular-nums">{formatNumber(item.current)}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {item.label}
                    <span className="text-muted-foreground/40">|</span>
                    <span className="tabular-nums">{formatNumber(item.previous)} سابقاً</span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Source Comparison Bars */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            مقارنة المصادر
          </h4>
          <div className="space-y-4">
            {sourceItems.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ComparisonBar {...item} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Daily Trend Sparklines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                {currentMonth.name} - النشاط اليومي
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {currentMonth.daily.length} يوم
              </span>
            </div>
            <MiniSparkline data={currentMonth.daily.map(d => d.count)} color="#3DB1AC" height={50} />
          </div>
          <div className="glass-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                {previousMonth.name} - النشاط اليومي
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {previousMonth.daily.length} يوم
              </span>
            </div>
            <MiniSparkline data={previousMonth.daily.map(d => d.count)} color="#94A3B8" height={50} />
          </div>
        </div>

        {/* Sector Comparison */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            مقارنة القطاعات
            <span className="text-[10px] text-muted-foreground/50 font-normal">(الحالي / السابق)</span>
          </h4>
          <SectorComparison currentSectors={currentMonth.sectors} prevSectors={previousMonth.sectors} />
        </div>

        {/* Overall Summary */}
        <div className="glass-card rounded-xl p-4 border border-border/50"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(61, 177, 172, 0.05), rgba(59, 130, 246, 0.05))"
              : "linear-gradient(135deg, rgba(22, 42, 84, 0.03), rgba(61, 177, 172, 0.03))",
          }}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const leakDelta = calcDelta(currentMonth.totalLeaks, previousMonth.totalLeaks);
              const isImproving = leakDelta.direction === "down";
              return (
                <>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isImproving ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {isImproving ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">
                      {isImproving
                        ? `تحسن بنسبة ${leakDelta.percent}% في عدد التسريبات`
                        : leakDelta.direction === "up"
                        ? `ارتفاع بنسبة ${leakDelta.percent}% في عدد التسريبات`
                        : "لا تغيير في عدد التسريبات"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {currentMonth.name}: {currentMonth.totalLeaks} تسريب ({formatNumber(currentMonth.totalRecords)} سجل)
                      {" · "}
                      {previousMonth.name}: {previousMonth.totalLeaks} تسريب ({formatNumber(previousMonth.totalRecords)} سجل)
                    </p>
                  </div>
                  <div className={`text-2xl font-bold tabular-nums ${
                    isImproving ? "text-emerald-400" : leakDelta.direction === "up" ? "text-red-400" : "text-slate-400"
                  }`}>
                    {leakDelta.direction === "up" ? "+" : leakDelta.direction === "down" ? "-" : ""}{leakDelta.value}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
