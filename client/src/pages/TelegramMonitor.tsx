/**
 * TelegramMonitor — Telegram channel monitoring view
 * All stats and channel cards are clickable with detail modals
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
  X,
  ShieldAlert,
  Clock,
  MessageSquare,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

const riskColor = (r: string) => {
  switch (r) {
    case "high": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
};

const riskLabel = (r: string) => {
  switch (r) {
    case "high": return "تأثير عالي";
    case "medium": return "تأثير متوسط";
    default: return "تأثير محدود";
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

const severityColor = (s: string) => {
  switch (s) {
    case "critical": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "high": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }
};

const severityLabel = (s: string) => {
  switch (s) {
    case "critical": return "واسع النطاق";
    case "high": return "عالي";
    case "medium": return "متوسط";
    default: return "منخفض";
  }
};

export default function TelegramMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [selectedLeak, setSelectedLeak] = useState<any>(null);

  const { data: channels, isLoading: channelsLoading } = trpc.channels.list.useQuery({ platform: "telegram" });
  const { data: leaksData, isLoading: leaksLoading } = trpc.leaks.list.useQuery({ source: "telegram" });

  const telegramChannels = channels ?? [];
  const telegramLeaks = leaksData ?? [];

  const filteredChannels = telegramChannels.filter(
    (ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChannels = telegramChannels.filter(c => c.status === "active");
  const highRiskChannels = telegramChannels.filter(c => c.riskLevel === "high");
  const totalLeaksDetected = telegramChannels.reduce((a, c) => a + (c.leaksDetected ?? 0), 0);

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

      {/* Stats row — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "allChannels", label: "قنوات مراقبة", value: telegramChannels.length, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "activeChannels", label: "قنوات نشطة", value: activeChannels.length, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "detectedLeaks", label: "تسريبات مكتشفة", value: totalLeaksDetected, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
          { key: "highRisk", label: "قنوات عالية التأثير", value: highRiskChannels.length, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
        ].map((stat, i) => (
          <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card
              className={`border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:scale-[1.02] transition-all group`}
              onClick={() => setActiveModal(stat.key)}
            >
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
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

      {/* Channels grid — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredChannels.map((channel, i) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => { setSelectedChannel(channel); setActiveModal("channelDetail"); }}
            >
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
                  <p className="text-[9px] text-primary/50">اضغط للتفاصيل ←</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Telegram leaks — clickable rows */}
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
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">التأثير</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {telegramLeaks.map((leak) => (
                    <tr
                      key={leak.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-primary">{leak.leakId}</td>
                      <td className="py-3 px-4 text-foreground">{leak.titleAr}</td>
                      <td className="py-3 px-4 text-muted-foreground">{leak.sectorAr}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{leak.recordCount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-1 rounded border ${severityColor(leak.severity)}`}>
                          {severityLabel(leak.severity)}
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

      {/* ═══ MODALS ═══ */}

      {/* All Channels Modal */}
      <DetailModal open={activeModal === "allChannels"} onClose={() => setActiveModal(null)} title="جميع القنوات المراقبة" icon={<Send className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{telegramChannels.length} قناة</p>
          {telegramChannels.map(ch => (
            <div
              key={ch.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedChannel(ch); setActiveModal("channelDetail"); }}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground">{ch.channelId} • {(ch.subscribers ?? 0).toLocaleString()} مشترك</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${riskColor(ch.riskLevel)}`}>{riskLabel(ch.riskLevel)}</span>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${statusColor(ch.status)}`} />
                <span className="text-[10px] text-muted-foreground">{statusLabel(ch.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Active Channels Modal */}
      <DetailModal open={activeModal === "activeChannels"} onClose={() => setActiveModal(null)} title="القنوات النشطة" icon={<Eye className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{activeChannels.length} قناة نشطة</p>
          {activeChannels.map(ch => (
            <div
              key={ch.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedChannel(ch); setActiveModal("channelDetail"); }}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground">{ch.channelId} • {ch.leaksDetected ?? 0} تسريب مكتشف</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${riskColor(ch.riskLevel)}`}>{riskLabel(ch.riskLevel)}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Detected Leaks Modal */}
      <DetailModal open={activeModal === "detectedLeaks"} onClose={() => setActiveModal(null)} title="التسريبات المكتشفة من تليجرام" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{telegramLeaks.length} تسريب</p>
          {telegramLeaks.map(leak => (
            <div
              key={leak.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}
            >
              <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${severityColor(leak.severity)}`}>{severityLabel(leak.severity)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{leak.titleAr}</p>
                <p className="text-[10px] text-muted-foreground">{leak.leakId} • {leak.sectorAr} • {leak.recordCount.toLocaleString()} سجل</p>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* High Risk Channels Modal */}
      <DetailModal open={activeModal === "highRisk"} onClose={() => setActiveModal(null)} title="القنوات عالية التأثير" icon={<ShieldAlert className="w-5 h-5 text-red-400" />}>
        <div className="space-y-3">
          {highRiskChannels.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">لا توجد قنوات عالية التأثير</p>
          ) : (
            <>
              <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20">
                <p className="text-xs text-red-400">{highRiskChannels.length} قناة مصنفة بتأثير عالي — تتطلب مراقبة مكثفة</p>
              </div>
              {highRiskChannels.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors"
                  onClick={() => { setSelectedChannel(ch); setActiveModal("channelDetail"); }}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ch.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(ch.subscribers ?? 0).toLocaleString()} مشترك • {ch.leaksDetected ?? 0} تسريب</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DetailModal>

      {/* Channel Detail Modal */}
      <DetailModal
        open={activeModal === "channelDetail" && !!selectedChannel}
        onClose={() => { setActiveModal(null); setSelectedChannel(null); }}
        title={selectedChannel?.name ?? "تفاصيل القناة"}
        icon={<Send className="w-5 h-5 text-cyan-400" />}
      >
        {selectedChannel && (
          <div className="space-y-4">
            {/* Channel info header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Send className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{selectedChannel.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedChannel.channelId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${statusColor(selectedChannel.status)}`} />
                  <span className="text-xs text-muted-foreground">{statusLabel(selectedChannel.status)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${riskColor(selectedChannel.riskLevel)}`}>{riskLabel(selectedChannel.riskLevel)}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
                <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-cyan-400">{(selectedChannel.subscribers ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">مشترك</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
                <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-400">{selectedChannel.leaksDetected ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">تسريبات مكتشفة</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {selectedChannel.lastActivity ? new Date(selectedChannel.lastActivity).toLocaleDateString("ar-SA") : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">آخر نشاط</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <MessageSquare className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {selectedChannel.createdAt ? new Date(selectedChannel.createdAt).toLocaleDateString("ar-SA") : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">تاريخ الإضافة</p>
              </div>
            </div>

            {/* Channel description */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">وصف القناة</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {selectedChannel.description || "قناة تليجرام مراقبة لنشاط مشبوه يتعلق ببيع أو مشاركة بيانات شخصية سعودية. يتم رصد الرسائل والملفات المشاركة بشكل آلي."}
              </p>
            </div>

            {/* Related leaks */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3">التسريبات المرتبطة بهذه القناة</h4>
              {telegramLeaks.length > 0 ? (
                <div className="space-y-2">
                  {telegramLeaks.slice(0, 5).map(leak => (
                    <div key={leak.id} className="flex items-center gap-2 p-2 rounded bg-card/50 border border-border/20">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${severityColor(leak.severity)}`}>{severityLabel(leak.severity)}</span>
                      <span className="text-xs text-foreground truncate flex-1">{leak.titleAr}</span>
                      <span className="text-[10px] text-muted-foreground">{leak.recordCount.toLocaleString()} سجل</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد تسريبات مرتبطة</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 flex-1" onClick={() => toast("تم إيقاف/تشغيل المراقبة")}>
                {selectedChannel.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {selectedChannel.status === "active" ? "إيقاف المراقبة" : "تشغيل المراقبة"}
              </Button>
              <Button variant="outline" className="gap-2 flex-1" onClick={() => toast("تم تعليم القناة")}>
                <Flag className="w-4 h-4" />
                تعليم القناة
              </Button>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Leak Detail Drilldown */}
      <LeakDetailDrilldown
        leak={selectedLeak}
        open={activeModal === "leakDetail" && !!selectedLeak}
        onClose={() => { setActiveModal(null); setSelectedLeak(null); }}
        showBackButton={true}
        onBack={() => { setActiveModal(null); setSelectedLeak(null); }}
      />
    </div>
  );
}
