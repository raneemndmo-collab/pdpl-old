/**
 * NotificationBell — Real-time notification bell with dropdown panel
 * Shows unread count badge, dropdown list, and toast alerts for new notifications
 */
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useWebSocket, type WsNotification } from "@/hooks/useWebSocket";
import { toast } from "sonner";

const typeIcons: Record<string, React.ElementType> = {
  new_leak: ShieldAlert,
  status_change: AlertTriangle,
  scan_complete: ScanSearch,
  job_complete: Clock,
  system: Info,
};

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10",
  high: "text-amber-400 bg-amber-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  low: "text-blue-400 bg-blue-500/10",
  info: "text-cyan-400 bg-cyan-500/10",
};

function timeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعة`;
  return `${Math.floor(diff / 86400)} يوم`;
}

export default function NotificationBell({ userId }: { userId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time WebSocket notifications
  const { isConnected, lastNotification } = useWebSocket(userId);

  // tRPC queries
  const { data: dbNotifications, refetch: refetchNotifications } = trpc.notifications.list.useQuery(
    { limit: 30 },
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

  // Show toast for new real-time notifications
  useEffect(() => {
    if (lastNotification) {
      const Icon = typeIcons[lastNotification.type] || Info;
      toast(lastNotification.titleAr || lastNotification.title, {
        description: lastNotification.messageAr || lastNotification.message,
        icon: <Icon className="w-4 h-4" />,
        duration: 6000,
      });
      refetchNotifications();
      refetchCount();
    }
  }, [lastNotification]);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
        {/* Connection indicator */}
        <span
          className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-zinc-400"
          }`}
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
            className="absolute left-0 top-12 w-[380px] max-h-[480px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">الإشعارات</h3>
                {count > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                    {count}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
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

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[400px]">
              {allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">لا توجد إشعارات</p>
                  <p className="text-xs mt-1">No notifications yet</p>
                </div>
              ) : (
                allNotifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Info;
                  const colorClass = severityColors[notif.severity] || severityColors.info;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer ${
                        !notif.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (!notif.isRead) {
                          markReadMutation.mutate({ notificationId: notif.id });
                        }
                      }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-relaxed ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.titleAr}
                        </p>
                        {notif.messageAr && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.messageAr}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
