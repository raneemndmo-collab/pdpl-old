/**
 * DashboardLayout — Dark Observatory Theme
 * RTL-first sidebar layout with NDMO branding
 * Collapsible sidebar with icon+label navigation
 */
import { useState } from "react";
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
  Menu,
  X,
  Bell,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NavItem {
  label: string;
  labelEn: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { label: "لوحة القيادة", labelEn: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "رصد تليجرام", labelEn: "Telegram", icon: Send, path: "/telegram" },
  { label: "الدارك ويب", labelEn: "Dark Web", icon: Globe, path: "/darkweb" },
  { label: "مواقع اللصق", labelEn: "Paste Sites", icon: FileText, path: "/paste-sites" },
  { label: "مصنّف PII", labelEn: "PII Classifier", icon: ScanSearch, path: "/pii-classifier" },
  { label: "التسريبات", labelEn: "Leaks", icon: ShieldAlert, path: "/leaks" },
  { label: "التقارير", labelEn: "Reports", icon: BarChart3, path: "/reports" },
  { label: "الإعدادات", labelEn: "Settings", icon: Settings, path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = navItems.find((item) => item.path === location);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full
          bg-sidebar border-l border-sidebar-border
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          right-0 lg:right-auto
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold text-foreground whitespace-nowrap">NDMO</h1>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">رصد تسريبات البيانات</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                    transition-colors duration-200 group relative
                    ${isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-l-full"
                    />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute right-14 bg-popover text-popover-foreground text-xs py-1 px-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mobile close */}
        <button
          className="absolute top-4 left-4 lg:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30">
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
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => toast("البحث المتقدم قريباً", { description: "Advanced search coming soon" })}
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
              onClick={() => toast("الإشعارات قريباً", { description: "Notifications coming soon" })}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse-glow" />
            </Button>

            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
              <span className="text-xs text-emerald-400 font-medium">نشط</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
