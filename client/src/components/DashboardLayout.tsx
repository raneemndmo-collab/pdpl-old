/**
 * DashboardLayout — SDAIA Ultra Premium Design System
 * RTL-first sidebar with SDAIA official colors (#273470, #6459A7, #3DB1AC)
 * Glassmorphism, scan-line effects, and premium animations
 * - Mobile: auto-close sidebar on nav item click
 * - Groups: collapsed by default, only active group expanded
 * - Root Admin protection: AI control pages only visible to mruhaily
 */
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Send,
  Globe,
  FileText,
  ScanSearch,
  ShieldAlert,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  Search,
  Shield,
  LogIn,
  LogOut,
  Users,
  Loader2,
  Radio,
  ScrollText,
  Bell,
  Archive,
  Map,
  CalendarClock,
  KeyRound,
  Crosshair,
  Link2,
  UserX,
  Radar,
  Brain,
  Network,
  Sun,
  Moon,
  Bot,
  CheckCircle2,
  Scan,
  FileCheck,
  FileBarChart,
  Sparkles,
  BookOpen,
  HeartHandshake,
  GraduationCap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNdmoAuth } from "@/hooks/useNdmoAuth";
import { getLoginUrl } from "@/const";
import NotificationBell from "./NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { Redirect } from "wouter";
import ParticleField from "@/components/ParticleField";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* SDAIA Official FULL Logo URLs (with "منصة راصد" + "مكتب إدارة البيانات الوطنية") */
const FULL_LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/vyIfeykxwXasuonx.png";
const FULL_LOGO_LIGHT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/tSiomIdoNdNFAtOB.png";
const RASID_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/ziWPuMClYqvYmkJG.png";

/** Root Admin userId — protected from any modifications */
const ROOT_ADMIN_USER_ID = "mruhaily";

interface NavItem {
  label: string;
  labelEn: string;
  icon: React.ElementType;
  path: string;
  requiresAuth?: boolean;
  minRole?: string;
  /** Only visible to root admin (mruhaily) */
  rootAdminOnly?: boolean;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "command",
    label: "قيادي",
    labelEn: "Command",
    icon: LayoutDashboard,
    items: [
      { label: "لوحة القيادة", labelEn: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "التقارير", labelEn: "Reports", icon: BarChart3, path: "/reports" },
      { label: "خريطة التهديدات", labelEn: "Threat Map", icon: Map, path: "/threat-map" },
      { label: "راصد الذكي", labelEn: "Smart Rasid", icon: Bot, path: "/smart-rasid" },
    ],
  },
  {
    id: "monitoring",
    label: "أدوات الرصد",
    labelEn: "Monitoring Tools",
    icon: Activity,
    items: [
      { label: "الرصد المباشر", labelEn: "Live Scan", icon: Scan, path: "/live-scan" },
      { label: "رصد تليجرام", labelEn: "Telegram", icon: Send, path: "/telegram" },
      { label: "الدارك ويب", labelEn: "Dark Web", icon: Globe, path: "/darkweb" },
      { label: "مواقع اللصق", labelEn: "Paste Sites", icon: FileText, path: "/paste-sites" },
      { label: "مهام الرصد", labelEn: "Monitoring Jobs", icon: Radio, path: "/monitoring-jobs" },
    ],
  },
  {
    id: "operational",
    label: "تنفيذي",
    labelEn: "Operational",
    icon: ShieldAlert,
    items: [
      { label: "التسريبات", labelEn: "Leaks", icon: ShieldAlert, path: "/leaks" },
      { label: "ملفات البائعين", labelEn: "Seller Profiles", icon: UserX, path: "/seller-profiles" },
      { label: "قنوات التنبيه", labelEn: "Alert Channels", icon: Bell, path: "/alert-channels" },
      { label: "التقارير المجدولة", labelEn: "Scheduled Reports", icon: CalendarClock, path: "/scheduled-reports" },
    ],
  },
  {
    id: "advanced",
    label: "متقدم",
    labelEn: "Advanced",
    icon: Brain,
    items: [
      { label: "مصنّف PII", labelEn: "PII Classifier", icon: ScanSearch, path: "/pii-classifier" },
      { label: "سلسلة الأدلة", labelEn: "Evidence Chain", icon: Link2, path: "/evidence-chain" },
      { label: "قواعد صيد التهديدات", labelEn: "Threat Rules", icon: Crosshair, path: "/threat-rules" },
      { label: "أدوات OSINT", labelEn: "OSINT Tools", icon: Radar, path: "/osint-tools" },
      { label: "رسم المعرفة", labelEn: "Knowledge Graph", icon: Network, path: "/knowledge-graph" },
      { label: "مقاييس الدقة", labelEn: "Accuracy Metrics", icon: Brain, path: "/feedback-accuracy" },
      { label: "التحقق من التوثيق", labelEn: "Verify Document", icon: FileCheck, path: "/verify" },
    ],
  },
  {
    id: "admin",
    label: "النظام",
    labelEn: "System",
    icon: Shield,
    items: [
      { label: "مفاتيح API", labelEn: "API Keys", icon: KeyRound, path: "/api-keys", requiresAuth: true, minRole: "admin" },
      { label: "الاحتفاظ بالبيانات", labelEn: "Data Retention", icon: Archive, path: "/data-retention", requiresAuth: true, minRole: "admin" },
      { label: "سجل المراجعة", labelEn: "Audit Log", icon: ScrollText, path: "/audit-log", requiresAuth: true, minRole: "admin" },
      { label: "إدارة المستخدمين", labelEn: "Users", icon: Users, path: "/user-management", requiresAuth: true, minRole: "admin" },
      { label: "سجل التوثيقات", labelEn: "Documents", icon: FileBarChart, path: "/documents-registry", requiresAuth: true, minRole: "admin" },
    ],
  },
  {
    id: "ai_control",
    label: "تحكم راصد الذكي",
    labelEn: "AI Control",
    icon: Sparkles,
    items: [
      { label: "قاعدة المعرفة", labelEn: "Knowledge Base", icon: BookOpen, path: "/knowledge-base", requiresAuth: true, rootAdminOnly: true },
      { label: "سيناريوهات الشخصية", labelEn: "Personality", icon: HeartHandshake, path: "/personality-scenarios", requiresAuth: true, rootAdminOnly: true },
      { label: "مركز التدريب", labelEn: "Training Center", icon: GraduationCap, path: "/training-center", requiresAuth: true, rootAdminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

const roleLabels: Record<string, string> = {
  executive: "تنفيذي",
  manager: "مدير",
  analyst: "محلل",
  viewer: "مشاهد",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, loading, logout, isAdmin, ndmoRole } = useNdmoAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  // Get the platform userId for root admin check
  const platformUserId = (user as any)?.userId ?? "";
  const isRootAdmin = platformUserId === ROOT_ADMIN_USER_ID;

  // Determine which group is active based on current location
  const activeGroupId = navGroups.find((g) =>
    g.items.some((item) => item.path === location)
  )?.id;

  // Groups default to collapsed, only active group is expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      initial[g.id] = false; // All collapsed by default
    });
    if (activeGroupId) {
      initial[activeGroupId] = true; // Expand active group
    }
    return initial;
  });

  // Update expanded groups when location changes
  useEffect(() => {
    if (activeGroupId) {
      setExpandedGroups((prev) => {
        // Only expand the active group if it's not already expanded
        if (prev[activeGroupId]) return prev;
        return { ...prev, [activeGroupId]: true };
      });
    }
  }, [activeGroupId]);

  const currentPage = allNavItems.find((item) => item.path === location);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    playClick();
  };

  // Close mobile sidebar on navigation
  const handleNavClick = useCallback(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen]);

  const isItemVisible = (item: NavItem) => {
    // Root admin only items
    if (item.rootAdminOnly && !isRootAdmin) return false;
    if (!item.requiresAuth) return true;
    if (!isAuthenticated) return false;
    if (item.minRole === "admin" && !isAdmin) return false;
    return true;
  };

  const isGroupVisible = (group: NavGroup) => {
    return group.items.some(isItemVisible);
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => item.path === location);
  };

  const isDark = theme === "dark";
  // In light mode sidebar is white, in dark mode it's dark — use appropriate logo
  const logoSrc = isDark ? FULL_LOGO_LIGHT : FULL_LOGO_DARK;
  const { playClick, playHover } = useSoundEffects();

  // Redirect unauthenticated users to login page
  if (!loading && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ═══ AURORA BACKGROUND — SDAIA Navy/Teal ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 dark:block hidden">
        <div
          className="absolute top-0 right-0 w-[60%] h-[50%] opacity-25"
          style={{
            background: "radial-gradient(ellipse at 70% 20%, rgba(61, 177, 172, 0.3), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[50%] h-[40%] opacity-20"
          style={{
            background: "radial-gradient(ellipse at 30% 80%, rgba(39, 52, 112, 0.25), transparent 60%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] opacity-10"
          style={{
            background: "radial-gradient(ellipse at center, rgba(100, 89, 167, 0.2), transparent 50%)",
          }}
        />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══ SIDEBAR — SDAIA Frosted Glass ═══ */}
      <aside
        className={`
          fixed lg:relative z-50 h-full
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? "w-[72px]" : "w-[270px]"}
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          right-0 lg:right-auto
          bg-sidebar
          backdrop-blur-2xl
          ${isDark ? 'border-l border-[rgba(61,177,172,0.08)]' : 'border-l border-[#e2e5ef]'}
        `}
      >
        {/* Logo area — Full Brand Logo with Creative Effects */}
        <div className={`flex items-center justify-center px-2 py-8 ${isDark ? 'border-b border-[rgba(61,177,172,0.1)]' : 'border-b border-[#edf0f7]'}`} style={{ minHeight: collapsed ? '72px' : '200px' }}>
          <motion.div
            className="relative flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ width: collapsed ? '52px' : '100%', height: collapsed ? '52px' : '180px' }}
          >
            {/* Orbiting glow ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: collapsed ? '60px' : 'calc(100% + 16px)',
                height: collapsed ? '60px' : '190px',
                border: isDark ? '1px solid rgba(61, 177, 172, 0.12)' : '1px solid rgba(30, 58, 138, 0.06)',
                animation: 'breathing-glow 4s ease-in-out infinite',
                boxShadow: isDark ? '0 0 30px rgba(61, 177, 172, 0.1), inset 0 0 30px rgba(100, 89, 167, 0.06)' : '0 0 20px rgba(30, 58, 138, 0.04)',
              }}
            />
            {/* Floating particles around logo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={`absolute w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3DB1AC]' : 'bg-[#3b82f6]'}`} style={{ top: '8%', right: '12%', opacity: isDark ? 0.5 : 0.25, animation: 'orbit 6s linear infinite' }} />
              <div className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-[#6459A7]' : 'bg-[#1e3a8a]'}`} style={{ bottom: '15%', left: '8%', opacity: isDark ? 0.4 : 0.2, animation: 'orbit 8s linear infinite reverse' }} />
              <div className={`absolute w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3DB1AC]' : 'bg-[#3b82f6]'}`} style={{ top: '50%', left: '3%', opacity: isDark ? 0.3 : 0.15, animation: 'orbit 10s linear infinite' }} />
              <div className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-[#6459A7]' : 'bg-[#1e3a8a]'}`} style={{ top: '20%', left: '50%', opacity: isDark ? 0.25 : 0.12, animation: 'orbit 12s linear infinite reverse' }} />
            </div>
            {/* Logo image */}
            <img
              src={logoSrc}
              alt="منصة راصد - مكتب إدارة البيانات الوطنية"
              className="relative z-10 object-contain"
              style={{
                width: collapsed ? '44px' : '100%',
                height: collapsed ? '44px' : '170px',
                maxWidth: '260px',
                filter: isDark ? 'drop-shadow(0 0 15px rgba(61, 177, 172, 0.25)) drop-shadow(0 0 40px rgba(100, 89, 167, 0.12))' : 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.08))',
                animation: 'logo-float 5s ease-in-out infinite',
              }}
            />
          </motion.div>
        </div>

        {/* Data flow line under logo */}
        <div className="data-flow-line mx-4 opacity-50" />

        {/* Navigation with groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navGroups.filter(isGroupVisible).map((group) => {
            const isExpanded = expandedGroups[group.id];
            const isActive = isGroupActive(group);
            const GroupIcon = group.icon;
            const visibleItems = group.items.filter(isItemVisible);

            return (
              <div key={group.id} className="mb-1">
                {/* Group header */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg
                      text-xs font-semibold uppercase tracking-wider
                      transition-all duration-200
                      ${isActive
                        ? isDark ? "text-[#3DB1AC] bg-[rgba(61,177,172,0.08)]" : "text-[#1e3a8a] bg-[rgba(30,58,138,0.06)]"
                        : isDark ? "text-[#D4DDEF]/60 hover:text-[#D4DDEF] hover:bg-[rgba(61,177,172,0.06)]" : "text-[#5a6478] hover:text-[#1c2833] hover:bg-[rgba(30,58,138,0.04)]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <GroupIcon className="w-3.5 h-3.5" />
                      <span>{group.label}</span>
                      <span className="text-[9px] opacity-60 font-normal normal-case">{group.labelEn}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </button>
                ) : (
                  <div className={`h-px ${isDark ? 'bg-[rgba(61,177,172,0.08)]' : 'bg-[#edf0f7]'} mx-2 my-2`} />
                )}

                {/* Group items */}
                <AnimatePresence initial={false}>
                  {(isExpanded || collapsed) && (
                    <motion.div
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={collapsed ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`space-y-0.5 ${collapsed ? "" : "mt-1 mr-2"}`}>
                        {visibleItems.map((item) => {
                          const isItemActive = location === item.path;
                          const Icon = item.icon;
                          return (
                            <Link key={item.path} href={item.path} onClick={() => { handleNavClick(); playClick(); }}>
                              <motion.div
                                whileHover={{ x: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                                  transition-all duration-200 group relative
                                  ${isItemActive
                                    ? isDark ? "bg-[rgba(61,177,172,0.12)] border border-[rgba(61,177,172,0.25)] text-[#3DB1AC]" : "bg-[rgba(30,58,138,0.06)] border border-[rgba(30,58,138,0.12)] text-[#1e3a8a]"
                                    : isDark ? "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-[rgba(61,177,172,0.06)]" : "text-[#5a6478] hover:text-[#1c2833] hover:bg-[rgba(30,58,138,0.04)]"
                                  }
                                `}
                              >
                                {/* Active indicator bar */}
                                {isItemActive && (
                                  <motion.div
                                    layoutId="activeNav"
                                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 ${isDark ? 'bg-[#3DB1AC]' : 'bg-[#1e3a8a]'} rounded-l-full`}
                                    style={{ boxShadow: isDark ? '0 0 8px rgba(61, 177, 172, 0.4)' : '0 0 6px rgba(30, 58, 138, 0.2)' }}
                                  />
                                )}
                                <motion.div whileHover={{ rotate: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isItemActive ? (isDark ? "text-[#3DB1AC]" : "text-[#1e3a8a]") : ""}`} />
                                </motion.div>
                                {!collapsed && (
                                  <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                                )}
                                {/* Root admin badge */}
                                {!collapsed && item.rootAdminOnly && (
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 mr-auto">
                                    ROOT
                                  </span>
                                )}
                                {collapsed && (
                                  <div className={`absolute right-14 ${isDark ? 'bg-[rgba(26,37,80,0.9)] text-[#E1DEF5] border-[rgba(61,177,172,0.15)]' : 'bg-white text-[#1c2833] border-[#e2e5ef]'} backdrop-blur-xl text-xs py-1 px-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border`}>
                                    {item.label}
                                  </div>
                                )}
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User profile / login at bottom */}
        <div className={`p-3 ${isDark ? 'border-t border-[rgba(61,177,172,0.1)]' : 'border-t border-[#edf0f7]'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-[#3DB1AC]/50' : 'text-[#1e3a8a]/50'}`} />
            </div>
          ) : isAuthenticated && user ? (
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-[rgba(61,177,172,0.15)] border-[rgba(61,177,172,0.25)]' : 'bg-[rgba(30,58,138,0.08)] border-[rgba(30,58,138,0.15)]'} flex items-center justify-center flex-shrink-0 border`}>
                <span className={`text-xs font-bold ${isDark ? 'text-[#3DB1AC]' : 'text-[#1e3a8a]'}`}>
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${isDark ? 'text-[#D4DDEF]' : 'text-[#1c2833]'} truncate`}>{user.name || "مستخدم"}</p>
                  <p className={`text-[10px] ${isDark ? 'text-[#D4DDEF]/50' : 'text-[#5a6478]'} truncate`}>
                    {isRootAdmin ? "مدير النظام الرئيسي" : roleLabels[ndmoRole] || ndmoRole}
                    {isAdmin && !isRootAdmin && " (مشرف)"}
                    {isRootAdmin && " (Root)"}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${isDark ? 'text-[#D4DDEF]/50 hover:text-[#D4DDEF]' : 'text-[#5a6478] hover:text-[#1c2833]'}`}
                  onClick={() => {
                    logout();
                    toast("تم تسجيل الخروج");
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <a href="/login">
              <Button
                variant="outline"
                size="sm"
                className={`gap-2 text-xs w-full ${isDark ? 'border-[rgba(61,177,172,0.2)] hover:bg-[rgba(61,177,172,0.1)] text-[#D4DDEF]' : 'border-[#d8dce8] hover:bg-[rgba(30,58,138,0.04)] text-[#1c2833]'} ${collapsed ? "px-0 justify-center" : ""}`}
              >
                <LogIn className="w-3.5 h-3.5" />
                {!collapsed && "تسجيل الدخول"}
              </Button>
            </a>
          )}
        </div>

        {/* Collapse toggle */}
        <div className={`p-2 ${isDark ? 'border-t border-[rgba(61,177,172,0.1)]' : 'border-t border-[#edf0f7]'} hidden lg:block`}>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-center ${isDark ? 'text-[#D4DDEF]/40 hover:text-[#D4DDEF]' : 'text-[#5a6478] hover:text-[#1c2833]'}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mobile close */}
        <button
          className={`absolute top-4 left-4 lg:hidden ${isDark ? 'text-[#D4DDEF]/50 hover:text-[#D4DDEF]' : 'text-[#5a6478] hover:text-[#1c2833]'}`}
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top header — SDAIA frosted glass */}
        <header className={`h-16 flex items-center justify-between px-4 lg:px-6 backdrop-blur-xl sticky top-0 z-30 ${isDark ? 'border-b border-[rgba(61,177,172,0.08)] bg-[rgba(13,21,41,0.7)]' : 'border-b border-[#e2e5ef] bg-white/90'}`}>
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {currentPage?.label || "لوحة القيادة"}
              </h2>
              <p className="text-xs text-muted-foreground">{currentPage?.labelEn || "Dashboard"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {switchable && toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground dark:hover:bg-[rgba(61,177,172,0.08)]"
                onClick={() => { toggleTheme(); playClick(); }}
                title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}

            {/* Search — link to Smart Rasid */}
            <Link href="/smart-rasid">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground dark:hover:bg-[rgba(61,177,172,0.08)]"
                title="البحث الذكي"
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            {/* Real-time Notifications */}
            <NotificationBell userId={user?.id} />

            {/* Status indicator — SDAIA teal glow */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-[rgba(61,177,172,0.08)] border-[rgba(61,177,172,0.2)]' : 'bg-[rgba(30,58,138,0.04)] border-[rgba(30,58,138,0.12)]'} border`}>
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3DB1AC]' : 'bg-[#10b981]'} animate-pulse-glow`} style={{ boxShadow: isDark ? '0 0 6px rgba(61, 177, 172, 0.5)' : '0 0 4px rgba(16, 185, 129, 0.4)' }} />
              <span className={`text-xs font-medium ${isDark ? 'text-[#3DB1AC]' : 'text-[#10b981]'}`}>نشط</span>
            </div>
          </div>
        </header>

        {/* Page content with particle background */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <ParticleField count={30} className="z-0" />
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/** Export ROOT_ADMIN_USER_ID for use in other components */
export { ROOT_ADMIN_USER_ID };
