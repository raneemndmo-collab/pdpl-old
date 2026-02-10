/**
 * Leaks — All leak records view with filtering and CSV export
 * Dark Observatory Theme — Uses tRPC API
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Download,
  Eye,
  Send,
  Globe,
  FileText,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
    case "critical": return "حرج";
    case "high": return "عالي";
    case "medium": return "متوسط";
    default: return "منخفض";
  }
};

const sourceIcon = (s: string) => {
  switch (s) {
    case "telegram": return Send;
    case "darkweb": return Globe;
    default: return FileText;
  }
};

const sourceLabel = (s: string) => {
  switch (s) {
    case "telegram": return "تليجرام";
    case "darkweb": return "دارك ويب";
    default: return "موقع لصق";
  }
};

const sourceColor = (s: string) => {
  switch (s) {
    case "telegram": return "text-cyan-400 bg-cyan-500/10";
    case "darkweb": return "text-violet-400 bg-violet-500/10";
    default: return "text-amber-400 bg-amber-500/10";
  }
};

const statusLabel = (s: string) => {
  switch (s) {
    case "new": return "جديد";
    case "analyzing": return "قيد التحليل";
    case "documented": return "موثّق";
    default: return "تم الإبلاغ";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "new": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "analyzing": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "documented": return "text-violet-400 bg-violet-500/10 border-violet-500/30";
    default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
};

export default function Leaks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leaks, isLoading } = trpc.leaks.list.useQuery({
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const { refetch: fetchExport } = trpc.leaks.exportCsv.useQuery(
    {
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    { enabled: false }
  );

  const allLeaks = leaks ?? [];

  const filteredLeaks = useMemo(() => {
    if (!searchQuery) return allLeaks;
    const q = searchQuery.toLowerCase();
    return allLeaks.filter(
      (leak) =>
        leak.titleAr.includes(q) ||
        leak.title.toLowerCase().includes(q) ||
        leak.leakId.toLowerCase().includes(q)
    );
  }, [allLeaks, searchQuery]);

  const handleExportCsv = async () => {
    try {
      const { data } = await fetchExport();
      if (data?.csv) {
        const blob = new Blob(["\uFEFF" + data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير البيانات بنجاح");
      }
    } catch {
      toast.error("فشل تصدير البيانات");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي التسريبات", value: allLeaks.length, color: "text-red-400" },
          { label: "حرجة", value: allLeaks.filter((l) => l.severity === "critical").length, color: "text-red-400" },
          { label: "قيد التحليل", value: allLeaks.filter((l) => l.status === "analyzing").length, color: "text-amber-400" },
          { label: "تم الإبلاغ", value: allLeaks.filter((l) => l.status === "reported").length, color: "text-emerald-400" },
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

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في التسريبات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-secondary/50 border-border"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="الخطورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                <SelectItem value="telegram">تليجرام</SelectItem>
                <SelectItem value="darkweb">دارك ويب</SelectItem>
                <SelectItem value="paste">مواقع لصق</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40 bg-secondary/50 border-border">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="analyzing">قيد التحليل</SelectItem>
                <SelectItem value="documented">موثّق</SelectItem>
                <SelectItem value="reported">تم الإبلاغ</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leak cards */}
      <div className="space-y-3">
        {filteredLeaks.map((leak, i) => {
          const SourceIcon = sourceIcon(leak.source);
          return (
            <motion.div
              key={leak.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 lg:w-32">
                      <span className={`text-[10px] px-2 py-1 rounded border ${severityColor(leak.severity)}`}>
                        {severityLabel(leak.severity)}
                      </span>
                      <span className="text-xs font-mono text-primary">{leak.leakId}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{leak.titleAr}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{leak.descriptionAr || leak.title}</p>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${sourceColor(leak.source)} lg:w-28`}>
                      <SourceIcon className="w-3.5 h-3.5" />
                      <span className="text-xs">{sourceLabel(leak.source)}</span>
                    </div>

                    <div className="lg:w-20">
                      <span className="text-xs text-muted-foreground">{leak.sectorAr}</span>
                    </div>

                    <div className="lg:w-24 text-left">
                      <span className="text-sm font-semibold text-foreground">{leak.recordCount.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground mr-1">سجل</span>
                    </div>

                    <span className={`text-[10px] px-2 py-1 rounded border ${statusColor(leak.status)} lg:w-24 text-center`}>
                      {statusLabel(leak.status)}
                    </span>

                    <span className="text-xs text-muted-foreground lg:w-24">
                      {leak.detectedAt ? new Date(leak.detectedAt).toLocaleDateString("ar-SA") : "—"}
                    </span>

                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast("تفاصيل التسريب قريباً")}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                    {((leak.piiTypes as string[]) || []).map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredLeaks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد تسريبات تطابق معايير البحث</p>
        </div>
      )}
    </div>
  );
}
