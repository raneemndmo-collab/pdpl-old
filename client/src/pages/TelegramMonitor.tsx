/**
 * TelegramMonitor — Telegram channel monitoring view
 * Dark Observatory Theme
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { telegramChannels, leakRecords } from "@/lib/mockData";
import { toast } from "sonner";

const TELEGRAM_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/ayrInlgqp87gNdrsqHgN3t/sandbox/KjQNQlvIQMp8LacOr99cOG-img-5_1770741559000_na1fn_dGVsZWdyYW0tbW9uaXRvcg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvYXlySW5sZ3FwODdnTmRyc3FIZ04zdC9zYW5kYm94L0tqUU5RbHZJUU1wOExhY09yOTljT0ctaW1nLTVfMTc3MDc0MTU1OTAwMF9uYTFmbl9kR1ZzWldkeVlXMHRiVzl1YVhSdmNnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=osvviapmhFH2cw3rwdEylv1Vwbuq--pod2DkvXvUuqrSzjnL1g3lwjeq5096lUcxzO9h4tU9CUwAIg1Hd7v8p~As6Z5fM-W5-0u~D8fijGLPA9oRDsPux5TUsFu57-SO~xTfuRRh74TjXikJikjEPKyib8krNfCN00U2O69wYnyMLPOMuy6u4EM3Bh28nVm2id10rz3cVm417YugZ4q-uLwOHf-PgQ2LLAGov4UVcd9cr1iNVD~Hl5p2e4-cNa9Ed64C-w3F261ILHWAWA654uosAVDiElcHhbmtzMYb-pFP~P-5P8B~McBsMUzkKLTe3Ut5J715MLpp1r~NqE5ijw__";

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
  const telegramLeaks = leakRecords.filter((l) => l.source === "telegram");

  const filteredChannels = telegramChannels.filter(
    (ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <img src={TELEGRAM_IMG} alt="Telegram Monitoring" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">رصد تليجرام</h1>
              <p className="text-xs text-gray-400">Telegram Channel Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 max-w-lg">
            مراقبة القنوات التي تبيع أو تشارك قواعد بيانات سعودية باستخدام Telethon API
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "قنوات مراقبة", value: telegramChannels.length, color: "text-cyan-400" },
          { label: "قنوات نشطة", value: telegramChannels.filter((c) => c.status === "active").length, color: "text-emerald-400" },
          { label: "تسريبات مكتشفة", value: telegramChannels.reduce((a, c) => a + c.leaksDetected, 0), color: "text-amber-400" },
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
                      <p className="text-xs text-muted-foreground">{channel.id}</p>
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
                    <p className="text-xs font-medium text-foreground">{channel.subscribers.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">مشترك</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">{channel.leaksDetected}</p>
                    <p className="text-[10px] text-muted-foreground">تسريب</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/30">
                    <Eye className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">
                      {new Date(channel.lastActivity).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
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
                    <td className="py-3 px-4 font-mono text-xs text-primary">{leak.id}</td>
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
                      {new Date(leak.detectedAt).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
