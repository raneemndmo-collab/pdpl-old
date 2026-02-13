/**
 * NotificationBell — Enhanced Real-time notification bell with:
 * - Sound alerts based on severity level (critical/high/medium/low)
 * - Filter tabs for notification types
 * - Animated bell shake on new critical notifications
 * - Severity badge indicators with color coding
 * - Browser Push Notification support
 * - Grouped notifications by date
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  ScanSearch,
  Clock,
  Info,
  Volume2,
  VolumeX,
  Filter,
  Trash2,
  BellRing,
  Shield,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useWebSocket, type WsNotification } from "@/hooks/useWebSocket";
import { toast } from "sonner";

/* ═══ Type & Severity Maps ═══ */
const typeIcons: Record<string, React.ElementType> = {
  new_leak: ShieldAlert,
  status_change: AlertTriangle,
  scan_complete: ScanSearch,
  job_complete: Clock,
  system: Info,
};

const typeLabels: Record<string, string> = {
  new_leak: "تسريب جديد",
  status_change: "تغيير حالة",
  scan_complete: "اكتمال فحص",
  job_complete: "اكتمال مهمة",
  system: "نظام",
};

const severityConfig: Record<string, {
  text: string; bg: string; border: string; label: string; labelEn: string; glow: string;
}> = {
  critical: {
    text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30",
    label: "حرج", labelEn: "Critical", glow: "rgba(239, 68, 68, 0.3)",
  },
  high: {
    text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30",
    label: "عالي", labelEn: "High", glow: "rgba(245, 158, 11, 0.3)",
  },
  medium: {
    text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30",
    label: "متوسط", labelEn: "Medium", glow: "rgba(234, 179, 8, 0.2)",
  },
  low: {
    text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30",
    label: "منخفض", labelEn: "Low", glow: "rgba(59, 130, 246, 0.2)",
  },
  info: {
    text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30",
    label: "معلومات", labelEn: "Info", glow: "rgba(6, 182, 212, 0.2)",
  },
};

/* ═══ Sound Alert System ═══ */
const audioContextRef = { current: null as AudioContext | null };

function getAudioContext(): AudioContext {
  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContextRef.current;
}

function playAlertSound(severity: string) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sounds for different severity levels
    switch (severity) {
      case "critical":
        // Urgent alarm: rapid beeps
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case "high":
        // Warning: two-tone alert
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.35);
        break;
      case "medium":
        // Notification: gentle ding
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
        break;
      default:
        // Info: soft chime
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio not supported or blocked
  }
}

/* ═══ Browser Push Notifications ═══ */
function requestPushPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string, severity: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    const icon = severity === "critical" ? "🚨" : severity === "high" ? "⚠️" : "🔔";
    new Notification(`${icon} ${title}`, {
      body,
      tag: `rasid-${Date.now()}`,
      requireInteraction: severity === "critical",
    });
  }
}

/* ═══ Time Helpers ═══ */
function timeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 172800) return "أمس";
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function getDateGroup(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "أخرى";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "اليوم";
  if (diff === 1) return "أمس";
  if (diff < 7) return "هذا الأسبوع";
  return "أقدم";
}

/* ═══ Filter Tabs ═══ */
const filterTabs = [
  { id: "all", label: "الكل", icon: Bell },
  { id: "critical", label: "حرج", icon: Zap },
  { id: "new_leak", label: "تسريبات", icon: ShieldAlert },
  { id: "system", label: "نظام", icon: Shield },
];

/* ═══ Main Component ═══ */
export default function NotificationBell({ userId }: { userId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isShaking, setIsShaking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Real-time WebSocket notifications
  const { isConnected, lastNotification } = useWebSocket(userId);

  // Request push permission on mount
  useEffect(() => {
    requestPushPermission();
  }, []);

  // tRPC queries
  const { data: dbNotifications, refetch: refetchNotifications } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { refetchInterval: 30000 }
  );
  const { data: unreadCount, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  // Handle new real-time notifications with sound and browser push
  useEffect(() => {
    if (lastNotification) {
      const Icon = typeIcons[lastNotification.type] || Info;
      const severity = lastNotification.severity || "info";
      const config = severityConfig[severity] || severityConfig.info;

      // Show toast
      toast(lastNotification.titleAr || lastNotification.title, {
        description: lastNotification.messageAr || lastNotification.message,
        icon: <Icon className={`w-4 h-4 ${config.text}`} />,
        duration: severity === "critical" ? 10000 : 6000,
        className: severity === "critical" ? "border-red-500/30 bg-red-500/5" : undefined,
      });

      // Play sound
      if (soundEnabled) {
        playAlertSound(severity);
      }

      // Browser push notification for critical/high
      if (severity === "critical" || severity === "high") {
        showBrowserNotification(
          lastNotification.titleAr || lastNotification.title || "",
          lastNotification.messageAr || lastNotification.message || "",
          severity
        );
      }

      // Shake bell for critical
      if (severity === "critical" || severity === "high") {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 2000);
      }

      refetchNotifications();
      refetchCount();
    }
  }, [lastNotification, soundEnabled]);

  // Detect count increase and shake bell
  useEffect(() => {
    const count = unreadCount ?? 0;
    if (count > prevCountRef.current && prevCountRef.current > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 1500);
    }
    prevCountRef.current = count;
  }, [unreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unreadCount ?? 0;
  const allNotifications = dbNotifications ?? [];

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return allNotifications;
    if (activeFilter === "critical") return allNotifications.filter((n: any) => n.severity === "critical" || n.severity === "high");
    return allNotifications.filter((n: any) => n.type === activeFilter);
  }, [allNotifications, activeFilter]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof filteredNotifications> = {};
    filteredNotifications.forEach((n: any) => {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    return groups;
  }, [filteredNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button with shake animation */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={isShaking ? {
            rotate: [0, -15, 15, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1.1, 1.05, 1.05, 1, 1, 1],
          } : {}}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {isShaking ? <BellRing className="w-4 h-4 text-red-400" /> : <Bell className="w-4 h-4" />}
        </motion.div>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)" }}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
        {/* Connection indicator */}
        <span
          className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full transition-colors ${
            isConnected ? "bg-emerald-500" : "bg-zinc-400"
          }`}
          title={isConnected ? "متصل" : "غير متصل"}
        />
      </Button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-12 w-[420px] max-h-[560px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
            style={{ backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">الإشعارات</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {isConnected ? "متصل مباشرة" : "غير متصل"} · {count} غير مقروء
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Sound toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "كتم الصوت" : "تفعيل الصوت"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>
                {count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => markAllReadMutation.mutate()}
                  >
                    <CheckCheck className="w-3 h-3" />
                    قراءة الكل
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 bg-card/80 overflow-x-auto">
              {filterTabs.map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-accent/50 border border-transparent"
                    }`}
                  >
                    <TabIcon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[420px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bell className="w-10 h-10 mb-3 opacity-20" />
                  </motion.div>
                  <p className="text-sm font-medium">لا توجد إشعارات</p>
                  <p className="text-xs mt-1 text-muted-foreground/60">
                    {activeFilter !== "all" ? "جرب تغيير الفلتر" : "ستظهر الإشعارات هنا عند رصد تسريبات جديدة"}
                  </p>
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([group, notifications]) => (
                  <div key={group}>
                    {/* Date group header */}
                    <div className="sticky top-0 z-10 px-4 py-1.5 bg-card/95 backdrop-blur-sm border-b border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">{group}</span>
                    </div>
                    {(notifications as any[]).map((notif: any) => {
                      const Icon = typeIcons[notif.type] || Info;
                      const config = severityConfig[notif.severity] || severityConfig.info;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-accent/30 transition-all cursor-pointer group ${
                            !notif.isRead ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            if (!notif.isRead) {
                              markReadMutation.mutate({ notificationId: notif.id });
                            }
                          }}
                        >
                          {/* Icon with severity glow */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border}`}
                            style={!notif.isRead ? { boxShadow: `0 0 12px ${config.glow}` } : {}}
                          >
                            <Icon className={`w-4 h-4 ${config.text}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-xs font-semibold leading-relaxed ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                {notif.titleAr}
                              </p>
                              {/* Severity badge */}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${config.bg} ${config.text} border ${config.border}`}>
                                {config.label}
                              </span>
                            </div>
                            {notif.messageAr && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.messageAr}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground/50">
                                {timeAgo(notif.createdAt)}
                              </span>
                              <span className="text-[10px] text-muted-foreground/30">·</span>
                              <span className={`text-[10px] ${config.text}`}>
                                {typeLabels[notif.type] || notif.type}
                              </span>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notif.isRead && (
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 ${
                                notif.severity === "critical" ? "bg-red-500" : "bg-primary"
                              }`}
                              style={{ boxShadow: `0 0 6px ${config.glow}` }}
                            />
                          )}

                          {/* Mark as read button on hover */}
                          {!notif.isRead && (
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                markReadMutation.mutate({ notificationId: notif.id });
                              }}
                              title="تحديد كمقروء"
                            >
                              <Check className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer stats */}
            {allNotifications.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/95 text-[10px] text-muted-foreground/60">
                <span>{allNotifications.length} إشعار · {count} غير مقروء</span>
                <div className="flex items-center gap-2">
                  {/* Severity summary */}
                  {["critical", "high", "medium"].map(sev => {
                    const sevCount = allNotifications.filter((n: any) => n.severity === sev && !n.isRead).length;
                    if (sevCount === 0) return null;
                    const c = severityConfig[sev];
                    return (
                      <span key={sev} className={`flex items-center gap-1 ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.bg}`} style={{ boxShadow: `0 0 4px ${c.glow}` }} />
                        {sevCount}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
