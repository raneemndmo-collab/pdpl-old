/**
 * ActivityFeed — تغذية الأنشطة الحية
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ShieldAlert, ScanSearch, Bell, FileCheck, Radio, ChevronDown,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ActivityFeedProps {
  leaks: any[];
  maxItems?: number;
}

type EventType = "leak_detected" | "scan_completed" | "alert_triggered" | "status_changed" | "report_generated";

interface FeedEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  severity: string;
  timestamp: Date;
}

const eventConfig: Record<EventType, { icon: any; color: string; bg: string; label: string }> = {
  leak_detected: { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", label: "تسريب مكتشف" },
  scan_completed: { icon: ScanSearch, color: "text-blue-400", bg: "bg-blue-500/10", label: "فحص مكتمل" },
  alert_triggered: { icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10", label: "تنبيه" },
  status_changed: { icon: FileCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "تحديث حالة" },
  report_generated: { icon: Radio, color: "text-violet-400", bg: "bg-violet-500/10", label: "تقرير" },
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

export default function ActivityFeed({ leaks, maxItems = 15 }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<EventType | "all">("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const events = useMemo<FeedEvent[]>(() => {
    const items: FeedEvent[] = [];
    leaks.forEach((leak, i) => {
      items.push({
        id: `leak-${leak.leakId || i}`,
        type: "leak_detected",
        title: leak.titleAr || leak.title || "تسريب بيانات",
        description: `${leak.sectorAr || leak.sector || "غير محدد"} · ${(leak.recordCount || 0).toLocaleString()} سجل`,
        severity: leak.severity || "medium",
        timestamp: new Date(leak.detectedAt || Date.now() - i * 3600000),
      });
      if (i % 3 === 0) {
        items.push({
          id: `scan-${i}`,
          type: "scan_completed",
          title: `فحص ${leak.source || "مصدر"} مكتمل`,
          description: `تم فحص ${Math.floor(Math.random() * 500 + 100)} عنصر`,
          severity: "low",
          timestamp: new Date(leak.detectedAt ? new Date(leak.detectedAt).getTime() - 1800000 : Date.now() - i * 3600000 - 1800000),
        });
      }
      if (leak.severity === "critical" || leak.severity === "high") {
        items.push({
          id: `alert-${i}`,
          type: "alert_triggered",
          title: `تنبيه: ${leak.titleAr || leak.title || "حادثة"}`,
          description: `مستوى الخطورة: ${leak.severity === "critical" ? "حرج" : "مرتفع"}`,
          severity: leak.severity,
          timestamp: new Date(leak.detectedAt ? new Date(leak.detectedAt).getTime() + 300000 : Date.now() - i * 3600000 + 300000),
        });
      }
    });
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [leaks]);

  const filteredEvents = useMemo(() => {
    const filtered = filter === "all" ? events : events.filter(e => e.type === filter);
    return expanded ? filtered.slice(0, maxItems * 2) : filtered.slice(0, maxItems);
  }, [events, filter, expanded, maxItems]);

  const sevDot = (sev: string) => sev === "critical" ? "bg-red-500" : sev === "high" ? "bg-amber-500" : sev === "medium" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`rounded-2xl border overflow-hidden ${isDark
        ? "bg-gradient-to-br from-[#0f172a]/90 to-[#1e293b]/80 border-white/[0.06] backdrop-blur-xl"
        : "bg-white/90 border-[#e2e5ef] shadow-lg shadow-blue-500/5"}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <motion.div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/15" : "bg-emerald-100"}`}
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Activity className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-foreground">تغذية الأنشطة</h3>
            <p className="text-[9px] text-muted-foreground">Live Activity Feed · {events.length} حدث</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "leak_detected", "alert_triggered", "scan_completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${filter === f
                ? isDark ? "bg-[#3DB1AC]/20 text-[#3DB1AC]" : "bg-blue-100 text-blue-700"
                : isDark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100"}`}>
              {f === "all" ? "الكل" : f === "leak_detected" ? "تسريبات" : f === "alert_triggered" ? "تنبيهات" : "فحوصات"}
            </button>
          ))}
        </div>
      </div>
      <div className={`px-4 pb-4 space-y-1 max-h-[400px] overflow-y-auto`}>
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, i) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;
            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-default ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground font-medium truncate">{event.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sevDot(event.severity)}`} />
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{event.description}</p>
                </div>
                <span className="text-[8px] text-muted-foreground whitespace-nowrap shrink-0">{relativeTime(event.timestamp)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {events.length > maxItems && (
        <button onClick={() => setExpanded(!expanded)}
          className={`w-full py-2.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors border-t ${isDark ? "border-white/5 text-slate-400 hover:bg-white/[0.03]" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}>
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "عرض أقل" : `عرض المزيد (${events.length - maxItems} حدث)`}
        </button>
      )}
    </motion.div>
  );
}
