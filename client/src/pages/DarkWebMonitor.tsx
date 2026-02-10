/**
 * DarkWebMonitor — Dark web forum/marketplace monitoring
 * Dark Observatory Theme
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  AlertTriangle,
  Eye,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { darkWebSources, leakRecords } from "@/lib/mockData";
import { toast } from "sonner";

const DARKWEB_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/ayrInlgqp87gNdrsqHgN3t/sandbox/KjQNQlvIQMp8LacOr99cOG-img-4_1770741557000_na1fn_ZGFyay13ZWItbW9uaXRvcg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvYXlySW5sZ3FwODdnTmRyc3FIZ04zdC9zYW5kYm94L0tqUU5RbHZJUU1wOExhY09yOTljT0ctaW1nLTRfMTc3MDc0MTU1NzAwMF9uYTFmbl9aR0Z5YXkxM1pXSXRiVzl1YVhSdmNnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=jWbIISSHH6Q5thdIvfg0Px8jvFYzYDYb0vpwUhgWF847rQuFDWRa4zwuVPKF5qxDkgUWcnhQVJFGy-Tl0n2qk6Y87S1L7NpLBZcTIVf2ARhUM551GM02kqClHLamjvewMxLnhzcLN-~u8tDY3SEGreqT~fhb~wN77y-Uto6gLF4FsIIqKkC28CfWIuFaHvOC9x8mWrKLvrpSeJHaytglE8JuGv1gci~omQIbNT4tqfJZZ2y4aQkpGRpsUJ4rS57qDSYCYkTBSxFi6WP6JwRfcKEaAsLqL~JPE7DYrQJY5DlVmJu3UWIRwKArV6M9AoDiuccGfPqAwo~BvU1OILPwGQ__";

const darkwebLeaks = leakRecords.filter((l) => l.source === "darkweb");

const threatIntel = [
  {
    id: "TI-001",
    title: "عرض بيع قاعدة بيانات صحية سعودية",
    titleEn: "Saudi Healthcare DB for sale",
    forum: "BreachForums Mirror",
    price: "$5,000",
    date: "2026-02-08",
    severity: "critical",
    records: "89,000",
  },
  {
    id: "TI-002",
    title: "تفريغ بيانات إقامات حديث",
    titleEn: "Fresh Iqama data dump",
    forum: "Exploit.in Market",
    price: "$3,500",
    date: "2026-02-07",
    severity: "critical",
    records: "178,000",
  },
  {
    id: "TI-003",
    title: "دليل موظفين حكوميين سعوديين",
    titleEn: "Saudi Gov Employee Directory",
    forum: "XSS.is Forum",
    price: "$2,000",
    date: "2026-02-05",
    severity: "high",
    records: "31,000",
  },
  {
    id: "TI-004",
    title: "بيانات عملاء تأمين مسربة",
    titleEn: "Leaked insurance customer data",
    forum: "RaidForums Archive",
    price: "$1,200",
    date: "2026-02-03",
    severity: "high",
    records: "43,000",
  },
];

export default function DarkWebMonitor() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <img src={DARKWEB_IMG} alt="Dark Web Monitoring" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">رصد الدارك ويب</h1>
              <p className="text-xs text-gray-400">Dark Web Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 max-w-lg">
            مراقبة منتديات بيع البيانات وأسواق البيانات المسربة عبر شبكة Tor
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "مصادر مراقبة", value: darkWebSources.length, color: "text-violet-400" },
          { label: "تسريبات مكتشفة", value: darkWebSources.reduce((a, c) => a + c.leaksDetected, 0), color: "text-amber-400" },
          { label: "عروض بيع نشطة", value: threatIntel.length, color: "text-red-400" },
          { label: "سجلات مكشوفة", value: "341K", color: "text-cyan-400" },
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

      {/* Monitored sources */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            المصادر المراقبة
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => toast("جاري التحديث...")}>
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {darkWebSources.map((source, i) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{source.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{source.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      source.status === "active" ? "bg-emerald-500" :
                      source.status === "flagged" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    <span className="text-[10px] text-muted-foreground">
                      {source.status === "active" ? "نشط" : source.status === "flagged" ? "مُعلَّم" : "متوقف"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {source.leaksDetected} تسريب
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] ${
                    source.riskLevel === "high" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                    "text-amber-400 bg-amber-500/10 border-amber-500/30"
                  }`}>
                    {source.riskLevel === "high" ? "خطورة عالية" : "خطورة متوسطة"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat intelligence feed */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            آخر عروض البيع المرصودة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {threatIntel.map((intel, i) => (
              <motion.div
                key={intel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg bg-secondary/20 border border-border hover:border-red-500/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{intel.title}</h3>
                    <p className="text-xs text-muted-foreground">{intel.titleEn}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded border ${
                    intel.severity === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                    "text-amber-400 bg-amber-500/10 border-amber-500/30"
                  }`}>
                    {intel.severity === "critical" ? "حرج" : "عالي"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {intel.forum}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {intel.date}
                  </span>
                  <span className="text-red-400 font-medium">{intel.price}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {intel.records} سجل
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
