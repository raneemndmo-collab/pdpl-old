/**
 * TelegramMonitor — Telegram channel monitoring view
 * Dark Observatory Theme — Uses tRPC API
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Users,
  AlertTriangle,
  Eye,
  Pause,
  Play,
  Flag,
  Search,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const riskColor = (r: string) => {
  switch (r) {
    case "high": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
};

const riskLabel = (r: string) => {
  switch (r) {
    case "high": return "خطورة عالية";
    case "medium": return "خطورة متوسطة";
    default: return "خطورة منخفضة";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "active": return "bg-emerald-500";
    case "paused": return "bg-yellow-500";
    default: return "bg-red-500";
  }
};

const statusLabel = (s: string) => {
  switch (s) {
    case "active": return "نشط";
    case "paused": return "متوقف";
    default: return "مُعلَّم";
  }
};

export default function TelegramMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: channels, isLoading: channelsLoading } = trpc.channels.list.useQuery({ platform: "telegram" });
  const { data: leaksData, isLoading: leaksLoading } = trpc.leaks.list.useQuery({ source: "telegram" });

  const telegramChannels = channels ?? [];
  const telegramLeaks = leaksData ?? [];

  const filteredChannels = telegramChannels.filter(
    (ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Send className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">رصد تليجرام</h1>
              <p className="text-xs text-muted-foreground">Telegram Channel Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            مراقبة القنوات التي تبيع أو تشارك قواعد بيانات سعودية باستخدام Telethon API
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "قنوات مراقبة", value: telegramChannels.length, color: "text-cyan-400" },
          { label: "قنوات نشطة", value: telegramChannels.filter((c) => c.status === "active").length, color: "text-emerald-400" },
          { label: "تسريبات مكتشفة", value: telegramChannels.reduce((a, c) => a + (c.leaksDetected ?? 0), 0), color: "text-amber-400" },
          { label: "قنوات عالية الخطورة", value: telegramChannels.filter((c) => c.riskLevel === "high").length, color: "text-red-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في القنوات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-secondary/50 border-border"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast("تحديث البيانات...", { description: "Refreshing data..." })}>
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => toast("الفلاتر قريباً", { description: "Filters coming soon" })}>
          <Filter className="w-4 h-4" />
          فلترة
        </Button>
      </div>

      {/* Channels grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredChannels.map((channel, i) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{channel.name}</h3>
                      <p className="text-xs text-muted-foreground">{channel.channelId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusColor(channel.status)}`} />
                    <span className="text-xs text-muted-foreground">{statusLabel(channel.status)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <Users className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">{(channel.subscribers ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">مشترك</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">{channel.leaksDetected ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">تسريب</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <Eye className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">
                      {channel.lastActivity ? new Date(channel.lastActivity).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">آخر نشاط</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-1 rounded border ${riskColor(channel.riskLevel)}`}>
                    {riskLabel(channel.riskLevel)}
                  </span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast("تم إيقاف/تشغيل المراقبة")}>
                      {channel.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast("تم تعليم القناة")}>
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Telegram leaks */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">أحدث تسريبات تليجرام</CardTitle>
        </CardHeader>
        <CardContent>
          {leaksLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">المعرّف</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">العنوان</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">القطاع</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">السجلات</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">الخطورة</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {telegramLeaks.map((leak) => (
                    <tr key={leak.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-primary">{leak.leakId}</td>
                      <td className="py-3 px-4 text-foreground">{leak.titleAr}</td>
                      <td className="py-3 px-4 text-muted-foreground">{leak.sectorAr}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{leak.recordCount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-1 rounded border ${
                          leak.severity === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                          leak.severity === "high" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                          "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                        }`}>
                          {leak.severity === "critical" ? "حرج" : leak.severity === "high" ? "عالي" : "متوسط"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {leak.detectedAt ? new Date(leak.detectedAt).toLocaleDateString("ar-SA") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keywords being monitored */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">كلمات البحث المراقبة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["بيانات سعودية", "قاعدة بيانات", "KSA data", "Saudi database", "تسريب بيانات", "Saudi leak", "هوية وطنية", "أرقام جوال", "سجلات صحية", "بيانات بنكية", "Saudi PII", "KSA dump"].map((keyword) => (
              <Badge key={keyword} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
