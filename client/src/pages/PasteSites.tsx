/**
 * PasteSites — Paste site monitoring view
 * Dark Observatory Theme
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { pasteSources, leakRecords } from "@/lib/mockData";
import { toast } from "sonner";

const MONITORING_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/ayrInlgqp87gNdrsqHgN3t/sandbox/KjQNQlvIQMp8LacOr99cOG-img-2_1770741552000_na1fn_bW9uaXRvcmluZy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvYXlySW5sZ3FwODdnTmRyc3FIZ04zdC9zYW5kYm94L0tqUU5RbHZJUU1wOExhY09yOTljT0ctaW1nLTJfMTc3MDc0MTU1MjAwMF9uYTFmbl9iVzl1YVhSdmNtbHVaeTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=frhqqizSMeYNto8O8xA3vNJs0ReDy-rGcZbRrsU66rxRYE1Jbxo5hvau5-rWhDKAoojw991zbAdbJ-Wfkwo2YmsBip7BJ4Bl-22rvHH3NVdDBDbyNf5PNxCvMaFg-SQ8mvnZfIgWB-4XnGeJ3BrxwkCa9gkYKBhCIQTipfx5f1ZnYaNWxK7rWTNGyHyUx~vr-JWWfoDt-IYZ~JZyktzhBhf~quiyWfDRgTLUvBOVbUlUMw7uWIRdzlxyGJCJvO3KZp4K7u5-G9pYVR1p-jIk7CfxvO9FLlWfV7iV11fXkRog7dCTPy8RHoHXINeY5Y81FW8wdvZNM5d7ydS5lTTRMw__";

const pasteLeaks = leakRecords.filter((l) => l.source === "paste");

const recentPastes = [
  {
    id: "PST-001",
    title: "Saudi_Student_DB_2026.txt",
    site: "Pastebin.com",
    size: "2.4 MB",
    date: "2026-02-09T23:15:00",
    piiFound: true,
    piiTypes: ["National ID", "Email", "Full Names"],
    preview: "1XXXXXXXXX | محمد أحمد | mohammed@university.sa | ...",
    status: "flagged",
  },
  {
    id: "PST-002",
    title: "ksa_insurance_dump.csv",
    site: "Ghostbin",
    size: "5.1 MB",
    date: "2026-02-08T14:30:00",
    piiFound: true,
    piiTypes: ["National ID", "Full Names", "Policy Details"],
    preview: "1XXXXXXXXX | عبدالله محمد | POL-XXXXXX | ...",
    status: "flagged",
  },
  {
    id: "PST-003",
    title: "combo_list_sa_2026.txt",
    site: "PrivateBin",
    size: "890 KB",
    date: "2026-02-07T09:45:00",
    piiFound: true,
    piiTypes: ["Email", "Passwords"],
    preview: "user@domain.sa:p@ssw0rd | ...",
    status: "analyzing",
  },
  {
    id: "PST-004",
    title: "medical_records_leak.json",
    site: "Pastebin.com",
    size: "12.3 MB",
    date: "2026-02-06T16:20:00",
    piiFound: true,
    piiTypes: ["National ID", "Medical Records", "Full Names"],
    preview: '{"id": "1XXXXXXXXX", "name": "فاطمة علي", "diagnosis": "..."}',
    status: "documented",
  },
  {
    id: "PST-005",
    title: "saudi_phones_2026.txt",
    site: "Ghostbin",
    size: "1.7 MB",
    date: "2026-02-05T11:00:00",
    piiFound: true,
    piiTypes: ["Phone Numbers", "Full Names"],
    preview: "05XXXXXXXX | سارة محمد | ...",
    status: "reported",
  },
];

export default function PasteSites() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <img src={MONITORING_IMG} alt="Paste Sites Monitoring" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">رصد مواقع اللصق</h1>
              <p className="text-xs text-gray-400">Paste Sites Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 max-w-lg">
            مراقبة Pastebin وبدائله حيث تُنشر كثير من التسريبات الأولية
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "مواقع مراقبة", value: pasteSources.length, color: "text-amber-400" },
          { label: "لصقات مرصودة", value: recentPastes.length, color: "text-cyan-400" },
          { label: "تحتوي PII", value: recentPastes.filter((p) => p.piiFound).length, color: "text-red-400" },
          { label: "تم التوثيق", value: recentPastes.filter((p) => p.status === "documented" || p.status === "reported").length, color: "text-emerald-400" },
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

      {/* Monitored sites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pasteSources.map((source, i) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border hover:border-amber-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-semibold text-foreground">{source.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">نشط</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{source.leaksDetected} تسريب مكتشف</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] ${
                    source.riskLevel === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                    {source.riskLevel === "medium" ? "متوسط" : "منخفض"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent pastes */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            أحدث اللصقات المرصودة
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => toast("جاري التحديث...")}>
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPastes.map((paste, i) => (
              <motion.div
                key={paste.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-secondary/20 border border-border hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-mono font-semibold text-foreground">{paste.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {paste.site}
                      </span>
                      <span>{paste.size}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(paste.date).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded border ${
                    paste.status === "flagged" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                    paste.status === "analyzing" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                    paste.status === "documented" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" :
                    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                    {paste.status === "flagged" ? "مُعلَّم" :
                     paste.status === "analyzing" ? "قيد التحليل" :
                     paste.status === "documented" ? "موثّق" : "تم الإبلاغ"}
                  </span>
                </div>

                {/* PII types found */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {paste.piiTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-[10px] bg-red-500/5 border-red-500/20 text-red-400">
                      {type}
                    </Badge>
                  ))}
                </div>

                {/* Preview */}
                <div className="p-2 rounded bg-black/30 border border-border">
                  <code className="text-[11px] text-muted-foreground font-mono break-all">{paste.preview}</code>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
