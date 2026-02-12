/**
 * Dashboard — لوحة مؤشرات رصد تسريبات البيانات الشخصية
 * تصميم Ultra Premium مطابق لـ design.rasid.vip/dashboard
 * جميع البطاقات والمؤشرات قابلة للنقر مع تفاصيل كاملة
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Database, Radio, ScanSearch, TrendingUp, TrendingDown,
  Loader2, Bell, Activity, Shield, FileWarning, Target, X, Eye, Globe,
  FileText, ChevronLeft, ChevronRight, Building2, Layers, Users, Wifi,
  Zap, Server, HardDrive, RefreshCw, Settings, Fingerprint, CreditCard,
  Phone, Mail, MapPin, Hash, Calendar, BarChart3, Send, Lock, Briefcase,
  GraduationCap, Heart, Plane, ShoppingCart, Landmark, Factory, CircleDot,
  Sparkles, FileCheck, ArrowUpRight, Clock, AlertTriangle, Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";
import { DetailModal } from "@/components/DetailModal";
import { useTheme } from "@/contexts/ThemeContext";

/* ═══ PII Type Arabic Labels ═══ */
const piiTypeLabels: Record<string, string> = {
  "Phone": "رقم الهاتف", "Phone Number": "رقم الهاتف", "National ID": "رقم الهوية الوطنية",
  "Full Name": "الاسم الكامل", "Email": "البريد الإلكتروني", "Email Address": "البريد الإلكتروني",
  "Address": "العنوان", "IBAN": "رقم الآيبان", "Credit Card": "بطاقة ائتمان",
  "Passport Number": "رقم الجواز", "Date of Birth": "تاريخ الميلاد", "Iqama": "رقم الإقامة",
  "Blood Type": "فصيلة الدم", "Medical Diagnosis": "التشخيص الطبي", "Medical Records": "السجلات الطبية",
  "Medical Record": "السجل الطبي", "Medications": "الأدوية", "Insurance Number": "رقم التأمين",
  "Salary": "الراتب", "Salary History": "سجل الرواتب", "Password": "كلمة المرور",
  "Credential": "بيانات الدخول", "Biometric Data": "البيانات البيومترية", "GPS Coordinates": "إحداثيات GPS",
  "IP Address": "عنوان IP", "Bank Account": "الحساب البنكي", "Vehicle Plate": "لوحة المركبة",
  "Student ID": "رقم الطالب", "Employee ID": "رقم الموظف", "Work Permit": "تصريح العمل",
  "GPA": "المعدل التراكمي", "Order History": "سجل الطلبات", "Transaction History": "سجل المعاملات",
  "Payment Info": "معلومات الدفع", "Account Balance": "رصيد الحساب", "Wallet Balance": "رصيد المحفظة",
  "Travel Route": "مسار السفر", "Booking Reference": "مرجع الحجز", "Check-in Date": "تاريخ الوصول",
  "Education": "التعليم", "Major": "التخصص", "Skills": "المهارات", "Job Title": "المسمى الوظيفي",
  "Subscription Plan": "خطة الاشتراك", "Claim Amount": "مبلغ المطالبة", "Policy Number": "رقم الوثيقة",
  "Room Number": "رقم الغرفة", "Department": "القسم", "IMEI": "رقم IMEI",
  "Call Records": "سجل المكالمات", "Property Address": "عنوان العقار", "Contract Value": "قيمة العقد",
  "Membership ID": "رقم العضوية", "Security Clearance": "التصريح الأمني",
};
const getPiiLabel = (type: string) => piiTypeLabels[type] || type;

/* ═══ PII Icon Mapping ═══ */
const getPiiIcon = (type: string) => {
  if (type.includes("Phone") || type.includes("Call")) return Phone;
  if (type.includes("ID") || type.includes("National") || type.includes("Iqama") || type.includes("Passport")) return Fingerprint;
  if (type.includes("Email")) return Mail;
  if (type.includes("Credit") || type.includes("IBAN") || type.includes("Bank") || type.includes("Payment") || type.includes("Account") || type.includes("Wallet")) return CreditCard;
  if (type.includes("Address") || type.includes("GPS") || type.includes("Property")) return MapPin;
  if (type.includes("Medical") || type.includes("Blood") || type.includes("Medication") || type.includes("Insurance")) return Heart;
  if (type.includes("Password") || type.includes("Credential") || type.includes("Biometric") || type.includes("Security")) return Lock;
  if (type.includes("Salary") || type.includes("Employee") || type.includes("Job") || type.includes("Work") || type.includes("Department")) return Briefcase;
  if (type.includes("Student") || type.includes("GPA") || type.includes("Education") || type.includes("Major")) return GraduationCap;
  if (type.includes("Travel") || type.includes("Booking") || type.includes("Room") || type.includes("Check-in")) return Plane;
  if (type.includes("Order") || type.includes("Transaction") || type.includes("Subscription")) return ShoppingCart;
  return FileText;
};

/* ═══ Source Labels ═══ */
const sourceLabel = (s: string) => { switch (s) { case "telegram": return "تليجرام"; case "darkweb": return "دارك ويب"; default: return "موقع لصق"; } };
const sourceIcon = (s: string) => { switch (s) { case "telegram": return Send; case "darkweb": return Globe; default: return FileText; } };
const sourceColor = (s: string) => {
  switch (s) {
    case "telegram": return { text: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", fill: "#0ea5e9", glow: "rgba(14, 165, 233, 0.15)" };
    case "darkweb": return { text: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", fill: "#8b5cf6", glow: "rgba(139, 92, 246, 0.15)" };
    default: return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)" };
  }
};

/* ═══ Sector Icon Mapping ═══ */
const getSectorIcon = (sector: string) => {
  if (sector?.includes("حكوم")) return Building2;
  if (sector?.includes("صح") || sector?.includes("طب")) return Heart;
  if (sector?.includes("مصرف") || sector?.includes("بنوك") || sector?.includes("مالي")) return Landmark;
  if (sector?.includes("تعليم") || sector?.includes("جامع")) return GraduationCap;
  if (sector?.includes("اتصال") || sector?.includes("تقني")) return Wifi;
  if (sector?.includes("نقل") || sector?.includes("طيران")) return Plane;
  if (sector?.includes("تجار") || sector?.includes("تجزئ")) return ShoppingCart;
  if (sector?.includes("طاق") || sector?.includes("نفط")) return Factory;
  if (sector?.includes("توظيف") || sector?.includes("موارد")) return Briefcase;
  if (sector?.includes("تأمين")) return Shield;
  if (sector?.includes("عقار")) return Building2;
  if (sector?.includes("ضياف") || sector?.includes("سياح")) return Plane;
  if (sector?.includes("رياض") || sector?.includes("ترفيه")) return Activity;
  if (sector?.includes("بناء") || sector?.includes("مشاريع")) return Factory;
  if (sector?.includes("توصيل") || sector?.includes("طعام")) return ShoppingCart;
  return Layers;
};

/* ═══ Animated Counter ═══ */
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display.toLocaleString("en-US")}</>;
}

/* ═══ Mini Sparkline ═══ */
function MiniSparkline({ data, color = "#3b82f6", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const points = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * w,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${w} ${height} L 0 ${height} Z`;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
    </svg>
  );
}

/* ═══ Premium Radar Animation ═══ */
function RadarAnimation() {
  return (
    <div className="relative w-full aspect-square max-w-[260px] mx-auto">
      {[1, 2, 3].map((r) => (
        <motion.div
          key={r}
          className="absolute inset-0 m-auto rounded-full"
          style={{
            width: `${r * 33}%`, height: `${r * 33}%`,
            border: "1px solid",
            borderColor: "rgba(61, 177, 172, 0.12)",
          }}
          animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: r * 0.3 }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-[rgba(61,177,172,0.1)]" /></div>
      <div className="absolute inset-0 flex items-center justify-center"><div className="w-px h-full bg-[rgba(61,177,172,0.1)]" /></div>
      <motion.div className="absolute inset-0 m-auto" style={{ width: "100%", height: "100%" }} animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
        <div className="absolute top-1/2 right-1/2 h-px origin-right" style={{ width: "50%", background: "linear-gradient(to left, transparent, rgba(61, 177, 172, 0.6))" }} />
      </motion.div>
      {[
        { top: "25%", right: "30%", color: "#ef4444", delay: 0 },
        { top: "60%", right: "20%", color: "#f59e0b", delay: 0.5 },
        { top: "40%", right: "65%", color: "#10b981", delay: 1 },
        { top: "70%", right: "55%", color: "#3b82f6", delay: 1.5 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{ top: dot.top, right: dot.right, backgroundColor: dot.color, boxShadow: `0 0 12px ${dot.color}80` }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: dot.delay }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-3 h-3 rounded-full bg-[#3DB1AC]"
          style={{ boxShadow: "0 0 20px rgba(61, 177, 172, 0.5)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

/* ═══ Leak List in Modal ═══ */
function LeakListInModal({ leaks, emptyMessage = "لا توجد تسريبات" }: { leaks: any[]; emptyMessage?: string }) {
  const [selectedLeak, setSelectedLeak] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 8;
  const totalPages = Math.ceil(leaks.length / perPage);
  const pageLeaks = leaks.slice(page * perPage, (page + 1) * perPage);
  if (leaks.length === 0) return <p className="text-center text-muted-foreground text-sm py-6">{emptyMessage}</p>;
  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">{leaks.length} تسريب</p>
      <div className="space-y-2">
        {pageLeaks.map((l) => (
          <motion.div
            key={l.leakId || l.id}
            onClick={() => setSelectedLeak(l.leakId)}
            whileHover={{ x: -3, scale: 1.01 }}
            className="flex items-center gap-3 p-3 rounded-xl glass-card-premium shimmer-hover cursor-pointer bg-secondary/20 border border-border/30 hover:border-primary/20 transition-all"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center premium-icon-hover ${sourceColor(l.source).bg}`} style={{ boxShadow: `0 0 12px ${sourceColor(l.source).glow}` }}>
              {(() => { const Icon = sourceIcon(l.source); return <Icon className={`w-4 h-4 ${sourceColor(l.source).text}`} />; })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{l.titleAr || l.title}</p>
              <p className="text-[10px] text-muted-foreground">{l.sectorAr} · {(l.recordCount || 0).toLocaleString()} سجل</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">{sourceLabel(l.source)}</Badge>
          </motion.div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        </div>
      )}
      {selectedLeak && <LeakDetailDrilldown leak={{ leakId: selectedLeak }} open={true} onClose={() => setSelectedLeak(null)} />}
    </>
  );
}

/* ═══ Premium Section Header ═══ */
function SectionHeader({ icon: Icon, title, subtitle, action, onAction }: { icon: React.ElementType; title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center premium-icon-hover"
          whileHover={{ rotate: -5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <motion.button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          whileHover={{ x: -3 }}
        >
          {action}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
}

/* ═══ Premium Card Wrapper ═══ */
function PremiumCard({ children, className = "", onClick, delay = 0, glow }: { children: React.ReactNode; className?: string; onClick?: () => void; delay?: number; glow?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={`
        relative rounded-2xl border border-border/50 overflow-hidden
        bg-card/80 dark:bg-[rgba(26,37,80,0.7)]
        dark:backdrop-blur-xl dark:border-[rgba(61,177,172,0.1)]
        transition-all duration-400
        ${onClick ? "cursor-pointer hover:shadow-xl hover:scale-[1.015] hover:border-[rgba(61,177,172,0.25)] dark:hover:border-[rgba(61,177,172,0.3)] dark:hover:shadow-[0_8px_40px_rgba(61,177,172,0.08)]" : ""}
        ${className}
      `}
      style={glow ? { boxShadow: `0 0 0 1px ${glow}` } : undefined}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none shimmer-hover" />
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { data: stats, isLoading, refetch } = trpc.dashboard.stats.useQuery();
  const { data: leaks = [] } = trpc.leaks.list.useQuery();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedLeak, setSelectedLeak] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  /* ─── Derived data ─── */
  const piiDistribution = useMemo(() => stats?.piiDistribution ?? [], [stats]);
  const sectorDistribution = useMemo(() => stats?.sectorDistribution ?? [], [stats]);
  const sourceDistribution = useMemo(() => stats?.sourceDistribution ?? [], [stats]);
  const monthlyTrend = useMemo(() => stats?.monthlyTrend ?? [], [stats]);
  const recentLeaks = useMemo(() => stats?.recentLeaks ?? [], [stats]);
  const monthlyChartData = useMemo(() => monthlyTrend.map(m => m.count), [monthlyTrend]);

  /* ─── KPI Cards Config ─── */
  const kpiCards = [
    {
      key: "totalLeaks", label: "إجمالي حوادث التسريب", labelEn: "Total Incidents",
      value: stats?.totalLeaks ?? 0, icon: ShieldAlert,
      gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400",
      iconBg: "bg-blue-500/15 dark:bg-blue-500/20", glowColor: "rgba(59, 130, 246, 0.2)",
      sparkColor: "#3b82f6", trend: stats?.newLeaks ? `+${stats.newLeaks}` : "0",
      trendUp: (stats?.newLeaks ?? 0) > 0, trendLabel: "جديدة",
    },
    {
      key: "totalRecords", label: "السجلات الشخصية المكشوفة", labelEn: "Exposed Records",
      value: stats?.totalRecords ?? 0,
      displayValue: stats?.totalRecords ? stats.totalRecords >= 1000000 ? `${(stats.totalRecords / 1000000).toFixed(1)}M` : stats.totalRecords.toLocaleString() : "0",
      icon: Database,
      gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20", glowColor: "rgba(16, 185, 129, 0.2)",
      sparkColor: "#10b981", trend: "+8.1%", trendUp: true, trendLabel: "من الشهر السابق",
    },
    {
      key: "piiTypes", label: "أنواع البيانات الشخصية", labelEn: "PII Types Detected",
      value: stats?.distinctPiiTypes ?? 0, icon: Fingerprint,
      gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400",
      iconBg: "bg-amber-500/15 dark:bg-amber-500/20", glowColor: "rgba(245, 158, 11, 0.2)",
      sparkColor: "#f59e0b", trend: `${piiDistribution.length}`, trendUp: true, trendLabel: "نوع مكتشف",
    },
    {
      key: "sectors", label: "القطاعات المتأثرة", labelEn: "Affected Sectors",
      value: stats?.distinctSectors ?? 0, icon: Building2,
      gradient: "from-violet-500/20 to-violet-600/5", iconColor: "text-violet-400",
      iconBg: "bg-violet-500/15 dark:bg-violet-500/20", glowColor: "rgba(139, 92, 246, 0.2)",
      sparkColor: "#8b5cf6", trend: `${sectorDistribution.length}`, trendUp: true, trendLabel: "قطاع",
    },
  ];

  /* ─── Status Cards Config ─── */
  const statusCards = [
    { label: "تسريبات جديدة", value: stats?.newLeaks ?? 0, icon: Bell, color: "text-red-400", bg: "bg-red-500/8 dark:bg-red-500/10", glow: "rgba(239, 68, 68, 0.1)" },
    { label: "قيد التحليل", value: stats?.analyzingLeaks ?? 0, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/8 dark:bg-amber-500/10", glow: "rgba(245, 158, 11, 0.1)" },
    { label: "تم التوثيق", value: stats?.documentedLeaks ?? 0, icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/8 dark:bg-blue-500/10", glow: "rgba(59, 130, 246, 0.1)" },
    { label: "مكتملة", value: stats?.completedLeaks ?? 0, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/8 dark:bg-emerald-500/10", glow: "rgba(16, 185, 129, 0.1)" },
  ];

  /* ─── Source Cards Config ─── */
  const sourceCards = [
    { key: "telegram", label: "تليجرام", labelEn: "Telegram", value: stats?.telegramLeaks ?? 0, icon: Send, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", glow: "rgba(14, 165, 233, 0.12)" },
    { key: "darkweb", label: "دارك ويب", labelEn: "Dark Web", value: stats?.darkwebLeaks ?? 0, icon: Globe, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "rgba(139, 92, 246, 0.12)" },
    { key: "paste", label: "مواقع اللصق", labelEn: "Paste Sites", value: stats?.pasteLeaks ?? 0, icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "rgba(245, 158, 11, 0.12)" },
  ];

  /* ─── System Stats ─── */
  const systemStats = [
    { label: "قنوات الرصد", value: stats?.totalChannels ?? 0, icon: Server, color: "bg-slate-600/80" },
    { label: "قنوات نشطة", value: stats?.activeMonitors ?? 0, icon: Wifi, color: "bg-emerald-600/80" },
    { label: "تسريبات مُثرَاة بالذكاء", value: stats?.enrichedLeaks ?? 0, icon: Zap, color: "bg-amber-600/80" },
    { label: "بيانات PII مكتشفة", value: stats?.piiDetected ?? 0, icon: ScanSearch, color: "bg-cyan-600/80" },
  ];

  /* ═══ LOADING STATE ═══ */
  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card/80 dark:bg-[rgba(26,37,80,0.7)] rounded-2xl border border-border/50 dark:border-[rgba(61,177,172,0.1)] p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-4 bg-muted/50 rounded-lg" />
                <div className="w-11 h-11 bg-muted/30 rounded-xl" />
              </div>
              <div className="w-28 h-9 bg-muted/40 rounded-lg mb-3" />
              <div className="w-full h-10 bg-muted/20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center h-40 gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-8 h-8 text-primary" />
          </motion.div>
          <span className="text-sm text-muted-foreground">جاري تحميل المؤشرات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 relative">

      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgba(61,177,172,0.15)] to-[rgba(39,52,112,0.1)] flex items-center justify-center border border-[rgba(61,177,172,0.15)]"
            whileHover={{ rotate: -5, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ boxShadow: isDark ? "0 0 20px rgba(61, 177, 172, 0.15)" : "0 4px 12px rgba(39, 52, 112, 0.06)" }}
          >
            <BarChart3 className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-foreground">لوحة مؤشرات الرصد</h1>
            <p className="text-xs text-muted-foreground">مؤشرات أداء رصد تسريبات البيانات الشخصية</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(61,177,172,0.08)] border border-[rgba(61,177,172,0.15)]">
            <motion.div
              className="w-2 h-2 rounded-full bg-[#3DB1AC]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ boxShadow: "0 0 8px rgba(61, 177, 172, 0.5)" }}
            />
            <span className="text-xs text-[#3DB1AC] font-semibold">مباشر</span>
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            <Clock className="w-3 h-3 inline ml-1" />
            آخر تحديث: الآن
          </span>
          <motion.button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(61,177,172,0.1)] text-[#3DB1AC] text-xs font-semibold border border-[rgba(61,177,172,0.15)] hover:bg-[rgba(61,177,172,0.15)] transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </motion.button>
        </div>
      </motion.div>

      {/* ═══ KPI CARDS ROW ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <PremiumCard key={card.key} onClick={() => setActiveModal(card.key)} delay={idx * 0.08} className="group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 pointer-events-none`} />
              <div className="relative p-5">
                {/* Top: trend + icon */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${card.trendUp ? "text-emerald-400" : "text-red-400"}`}>{card.trend}</span>
                    {card.trendUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    <span className="text-[9px] text-muted-foreground">{card.trendLabel}</span>
                  </div>
                  <motion.div
                    className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 16px ${card.glowColor}` }}
                    whileHover={{ rotate: -8, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </motion.div>
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-foreground mb-0.5 tabular-nums premium-stat-enter">
                  {card.displayValue ? card.displayValue : <AnimatedNumber value={card.value as number} />}
                </div>

                {/* Label */}
                <p className="text-xs text-muted-foreground mb-0.5">{card.label}</p>
                <p className="text-[9px] text-muted-foreground/60">{card.labelEn}</p>

                {/* Sparkline */}
                <div className="mt-3">
                  <MiniSparkline data={monthlyChartData.length > 0 ? monthlyChartData : [3, 5, 4, 7, 6, 8]} color={card.sparkColor} />
                </div>

                {/* Click hint */}
                <p className="text-[9px] text-primary/40 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Eye className="w-3 h-3" /> اضغط لعرض التفاصيل
                </p>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {/* ═══ SECOND ROW: Status + Source Distribution ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Cards */}
        <PremiumCard delay={0.35}>
          <div className="p-5">
            <SectionHeader icon={Activity} title="حالة الحوادث" subtitle="Incident Status" />
            <div className="grid grid-cols-2 gap-3">
              {statusCards.map((sc) => {
                const SIcon = sc.icon;
                return (
                  <motion.div
                    key={sc.label}
                    className={`p-4 rounded-xl ${sc.bg} border border-transparent hover:border-border/40 transition-all`}
                    style={{ boxShadow: `0 0 12px ${sc.glow}` }}
                    whileHover={{ scale: 1.03, y: -2 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div whileHover={{ rotate: -10 }}>
                        <SIcon className={`w-4.5 h-4.5 ${sc.color}`} />
                      </motion.div>
                      <span className="text-[11px] text-muted-foreground font-medium">{sc.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground"><AnimatedNumber value={sc.value} /></p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>

        {/* Source Distribution */}
        <PremiumCard delay={0.4} onClick={() => setActiveModal("sourceDist")} className="group">
          <div className="p-5">
            <SectionHeader icon={Radio} title="مصادر الرصد" subtitle="Monitoring Sources" action="التفاصيل" onAction={() => setActiveModal("sourceDist")} />
            <div className="space-y-3">
              {sourceCards.map((sc) => {
                const SIcon = sc.icon;
                const total = stats?.totalLeaks || 1;
                const pct = Math.round((sc.value / total) * 100);
                return (
                  <motion.div
                    key={sc.key}
                    className={`flex items-center gap-3 p-3.5 rounded-xl ${sc.bg} border ${sc.border} transition-all`}
                    style={{ boxShadow: `0 0 12px ${sc.glow}` }}
                    whileHover={{ x: -3, scale: 1.01 }}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center`}
                      whileHover={{ rotate: -8 }}
                    >
                      <SIcon className={`w-5 h-5 ${sc.color}`} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold text-foreground">{sc.label}</span>
                          <span className="text-[9px] text-muted-foreground/60 mr-2">{sc.labelEn}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{sc.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: sourceColor(sc.key).fill }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{pct}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* ═══ THIRD ROW: Sectors + Radar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector Distribution */}
        <PremiumCard delay={0.5} className="lg:col-span-2">
          <div className="p-5">
            <SectionHeader icon={Building2} title="القطاعات المتأثرة" subtitle="Affected Sectors" action="عرض الكل" onAction={() => setActiveModal("sectors")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectorDistribution.slice(0, 6).map((sec) => {
                const SIcon = getSectorIcon(sec.sector || "");
                const total = stats?.totalLeaks || 1;
                const pct = Math.round((sec.count / total) * 100);
                return (
                  <motion.div
                    key={sec.sector}
                    onClick={() => setActiveModal("sectors")}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/20 dark:bg-[rgba(26,37,80,0.5)] border border-border/30 dark:border-[rgba(61,177,172,0.08)] cursor-pointer hover:border-primary/20 dark:hover:border-[rgba(61,177,172,0.25)] transition-all"
                    whileHover={{ x: -3, scale: 1.01 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-[rgba(61,177,172,0.1)] flex items-center justify-center shrink-0"
                      whileHover={{ rotate: -8 }}
                    >
                      <SIcon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground truncate">{sec.sector}</span>
                        <span className="text-xs font-bold text-primary">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{sec.count} حادثة · {sec.records.toLocaleString()} سجل</p>
                      <div className="w-full h-1 bg-muted/40 rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>

        {/* Radar */}
        <PremiumCard delay={0.6}>
          <div className="p-5">
            <SectionHeader icon={Target} title="رادار الرصد" subtitle="Live Radar" />
            <RadarAnimation />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {systemStats.map((ss) => {
                const SSIcon = ss.icon;
                return (
                  <motion.div
                    key={ss.label}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/20 dark:bg-[rgba(26,37,80,0.4)]"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className={`w-8 h-8 rounded-lg ${ss.color} flex items-center justify-center`}>
                      <SSIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{ss.value.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">{ss.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* ═══ FOURTH ROW: PII Types + Recent Leaks ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PII Types Distribution */}
        <PremiumCard delay={0.7} onClick={() => setActiveModal("piiTypes")} className="group">
          <div className="p-5">
            <SectionHeader icon={Fingerprint} title="تصنيف البيانات الشخصية المسربة" subtitle="PII Classification" action="التفاصيل" onAction={() => setActiveModal("piiTypes")} />
            <div className="space-y-2.5">
              {piiDistribution.slice(0, 8).map((pii, i) => {
                const PIcon = getPiiIcon(pii.type);
                const maxCount = piiDistribution[0]?.count || 1;
                const pct = Math.round((pii.count / maxCount) * 100);
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
                return (
                  <motion.div
                    key={pii.type}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                  >
                    <motion.div
                      className="w-8 h-8 rounded-lg bg-secondary/40 dark:bg-[rgba(26,37,80,0.5)] flex items-center justify-center shrink-0"
                      whileHover={{ rotate: -8, scale: 1.1 }}
                    >
                      <PIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-foreground truncate font-medium">{getPiiLabel(pii.type)}</span>
                        <span className="text-xs font-bold text-foreground">{pii.count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: colors[i % colors.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.1 * i }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {piiDistribution.length > 8 && (
                <p className="text-[10px] text-primary/60 text-center pt-1 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> + {piiDistribution.length - 8} نوع آخر
                </p>
              )}
            </div>
          </div>
        </PremiumCard>

        {/* Recent Leaks */}
        <PremiumCard delay={0.8}>
          <div className="p-5">
            <SectionHeader icon={Eye} title="آخر الحوادث المرصودة" subtitle="Latest Incidents" action="عرض الكل" onAction={() => setActiveModal("allLeaks")} />
            <div className="space-y-2">
              {recentLeaks.slice(0, 6).map((leak: any, idx: number) => {
                const sc = sourceColor(leak.source);
                const SIcon = sourceIcon(leak.source);
                return (
                  <motion.div
                    key={leak.leakId}
                    onClick={() => setSelectedLeak(leak.leakId)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + idx * 0.05 }}
                    whileHover={{ x: -3, scale: 1.01 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 dark:bg-[rgba(26,37,80,0.4)] border border-border/30 dark:border-[rgba(61,177,172,0.08)] cursor-pointer hover:border-primary/20 dark:hover:border-[rgba(61,177,172,0.2)] transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`} style={{ boxShadow: `0 0 10px ${sc.glow}` }}>
                      <SIcon className={`w-4 h-4 ${sc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{leak.titleAr}</p>
                      <p className="text-[10px] text-muted-foreground">{leak.sectorAr} · {(leak.recordCount || 0).toLocaleString()} سجل</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[9px]">{sourceLabel(leak.source)}</Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {leak.detectedAt ? new Date(leak.detectedAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* ═══ FIFTH ROW: Monthly Trend + Activity Log ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <PremiumCard delay={0.9} onClick={() => setActiveModal("monthlyTrend")} className="group">
          <div className="p-5">
            <SectionHeader icon={TrendingUp} title="الاتجاه الشهري" subtitle="Monthly Trend" action="التفاصيل" onAction={() => setActiveModal("monthlyTrend")} />
            <div className="space-y-2">
              {monthlyTrend.slice(-6).map((m, i) => {
                const maxCount = Math.max(...monthlyTrend.map(t => t.count), 1);
                const pct = Math.round((m.count / maxCount) * 100);
                return (
                  <div key={m.yearMonth} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0 text-left font-mono">{m.yearMonth}</span>
                    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * i }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-left">{m.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </PremiumCard>

        {/* Activity Log */}
        <PremiumCard delay={1.0} className="border-amber-500/10 dark:border-amber-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative p-5">
            <SectionHeader icon={Activity} title="سجل النشاط" subtitle="Activity Log" />
            <div className="space-y-3">
              {recentLeaks.slice(0, 5).map((leak: any, i: number) => {
                const sc = sourceColor(leak.source);
                const SIcon = sourceIcon(leak.source);
                return (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + i * 0.05 }}
                  >
                    <motion.div
                      className={`w-8 h-8 rounded-full ${sc.bg} flex items-center justify-center shrink-0 mt-0.5`}
                      whileHover={{ scale: 1.15 }}
                    >
                      <SIcon className={`w-3.5 h-3.5 ${sc.text}`} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate font-medium">رصد تسريب: {leak.titleAr}</p>
                      <p className="text-[10px] text-muted-foreground">{leak.sectorAr} · {sourceLabel(leak.source)}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {leak.detectedAt ? new Date(leak.detectedAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         DETAIL MODALS — ALL PRESERVED
         ═══════════════════════════════════════════════════════════════ */}

      {/* Total Leaks Modal */}
      <DetailModal open={activeModal === "totalLeaks"} onClose={() => setActiveModal(null)} title="تفاصيل إجمالي حوادث التسريب" icon={<ShieldAlert className="w-5 h-5 text-blue-500" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statusCards.map((sc) => {
              const SIcon = sc.icon;
              return (
                <div key={sc.label} className={`p-4 rounded-xl ${sc.bg} text-center`} style={{ boxShadow: `0 0 12px ${sc.glow}` }}>
                  <SIcon className={`w-5 h-5 ${sc.color} mx-auto mb-1`} />
                  <p className="text-xl font-bold text-foreground">{sc.value}</p>
                  <p className="text-[10px] text-muted-foreground">{sc.label}</p>
                </div>
              );
            })}
          </div>
          <h4 className="text-sm font-semibold text-foreground">جميع التسريبات</h4>
          <LeakListInModal leaks={leaks} />
        </div>
      </DetailModal>

      {/* Total Records Modal */}
      <DetailModal open={activeModal === "totalRecords"} onClose={() => setActiveModal(null)} title="تفاصيل السجلات الشخصية المكشوفة" icon={<Database className="w-5 h-5 text-emerald-500" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20" style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.08)" }}>
            <p className="text-3xl font-bold text-foreground">{(stats?.totalRecords ?? 0).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">إجمالي السجلات الشخصية المكشوفة</p>
          </div>
          <h4 className="text-sm font-semibold text-foreground">أكبر التسريبات من حيث عدد السجلات</h4>
          <LeakListInModal leaks={[...leaks].sort((a, b) => (b.recordCount || 0) - (a.recordCount || 0))} />
        </div>
      </DetailModal>

      {/* PII Types Modal */}
      <DetailModal open={activeModal === "piiTypes"} onClose={() => setActiveModal(null)} title="تفاصيل أنواع البيانات الشخصية المسربة" icon={<Fingerprint className="w-5 h-5 text-amber-500" />} maxWidth="max-w-4xl">
        <div className="space-y-3">
          {piiDistribution.map((pii, i) => {
            const PIcon = getPiiIcon(pii.type);
            const maxCount = piiDistribution[0]?.count || 1;
            const pct = Math.round((pii.count / maxCount) * 100);
            const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
            const piiLeaks = leaks.filter(l => (l.piiTypes as string[])?.includes(pii.type));
            return (
              <div key={pii.type} className="bg-secondary/20 dark:bg-[rgba(26,37,80,0.4)] rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-secondary/40 dark:bg-[rgba(26,37,80,0.5)] flex items-center justify-center">
                    <PIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{getPiiLabel(pii.type)}</h4>
                      <Badge variant="outline" className="text-[10px]">{pii.count} حادثة</Badge>
                    </div>
                    <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                  </div>
                </div>
                {piiLeaks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {piiLeaks.slice(0, 3).map(l => (
                      <p key={l.leakId} className="text-[10px] text-muted-foreground truncate">• {l.titleAr} — {l.sectorAr}</p>
                    ))}
                    {piiLeaks.length > 3 && <p className="text-[10px] text-primary">+ {piiLeaks.length - 3} حادثة أخرى</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Sectors Modal */}
      <DetailModal open={activeModal === "sectors"} onClose={() => setActiveModal(null)} title="تفاصيل القطاعات المتأثرة" icon={<Building2 className="w-5 h-5 text-violet-500" />} maxWidth="max-w-4xl">
        <div className="space-y-3">
          {sectorDistribution.map((sec) => {
            const SIcon = getSectorIcon(sec.sector || "");
            const total = stats?.totalLeaks || 1;
            const pct = Math.round((sec.count / total) * 100);
            const sectorLeaks = leaks.filter(l => l.sectorAr === sec.sector);
            return (
              <div key={sec.sector} className="bg-secondary/20 dark:bg-[rgba(26,37,80,0.4)] rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-[rgba(61,177,172,0.1)] flex items-center justify-center">
                    <SIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{sec.sector}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{sec.count} حادثة</Badge>
                        <span className="text-xs font-bold text-primary">{pct}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{sec.records.toLocaleString()} سجل مكشوف</p>
                    <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <LeakListInModal leaks={sectorLeaks} />
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Source Distribution Modal */}
      <DetailModal open={activeModal === "sourceDist"} onClose={() => setActiveModal(null)} title="تفاصيل مصادر الرصد" icon={<Radio className="w-5 h-5 text-primary" />} maxWidth="max-w-4xl">
        <div className="space-y-4">
          {sourceCards.map((sc) => {
            const SIcon = sc.icon;
            const srcLeaks = leaks.filter(l => l.source === sc.key);
            const total = stats?.totalLeaks || 1;
            const pct = Math.round((sc.value / total) * 100);
            return (
              <div key={sc.key} className="bg-secondary/20 dark:bg-[rgba(26,37,80,0.4)] rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${sc.bg} flex items-center justify-center`} style={{ boxShadow: `0 0 16px ${sc.glow}` }}>
                    <SIcon className={`w-5 h-5 ${sc.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{sc.label}</h4>
                      <Badge variant="outline" className="text-[10px]">{sc.value} تسريب — {pct}%</Badge>
                    </div>
                    <div className="w-full h-2 bg-muted/30 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sourceColor(sc.key).fill }} />
                    </div>
                  </div>
                </div>
                <LeakListInModal leaks={srcLeaks} />
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Monthly Trend Modal */}
      <DetailModal open={activeModal === "monthlyTrend"} onClose={() => setActiveModal(null)} title="تفاصيل الاتجاه الشهري" icon={<TrendingUp className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">الشهر</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">التسريبات</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">السجلات</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">التغيير</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((m, i) => {
                  const prev = i > 0 ? monthlyTrend[i - 1].count : m.count;
                  const diff = m.count - prev;
                  return (
                    <tr key={m.yearMonth} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground text-xs font-mono">{m.yearMonth}</td>
                      <td className="p-2 text-foreground font-bold text-xs">{m.count}</td>
                      <td className="p-2 text-foreground text-xs">{m.records.toLocaleString()}</td>
                      <td className={`p-2 text-xs font-semibold ${diff > 0 ? "text-red-400" : diff < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DetailModal>

      {/* All Leaks Modal */}
      <DetailModal open={activeModal === "allLeaks"} onClose={() => setActiveModal(null)} title="جميع الحوادث المرصودة" icon={<Eye className="w-5 h-5 text-primary" />} maxWidth="max-w-4xl">
        <LeakListInModal leaks={leaks} />
      </DetailModal>

      {/* Leak Detail Drilldown */}
      {selectedLeak && <LeakDetailDrilldown leak={{ leakId: selectedLeak }} open={true} onClose={() => setSelectedLeak(null)} />}
    </div>
  );
}
