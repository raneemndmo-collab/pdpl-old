import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";
import {
  Search, FileText, Calendar, User, Filter, Download, Eye, Shield,
  ChevronLeft, ChevronRight, FileCheck, Clock, Hash, ExternalLink,
  BarChart3, FileBarChart, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";

type DocumentItem = {
  id: number;
  documentId: string;
  leakId: string;
  verificationCode: string;
  contentHash: string;
  documentType: "incident_report" | "custom_report" | "executive_summary";
  title: string;
  titleAr: string;
  generatedBy: number;
  generatedByName: string | null;
  pdfUrl: string | null;
  metadata: Record<string, unknown> | null;
  isVerified: boolean | null;
  createdAt: Date;
};

const PAGE_SIZE = 15;

const docTypeLabels: Record<string, string> = {
  incident_report: "توثيق حادثة",
  custom_report: "تقرير مخصص",
  executive_summary: "ملخص تنفيذي",
};

const docTypeColors: Record<string, string> = {
  incident_report: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  custom_report: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  executive_summary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function DocumentsRegistry() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [leakIdFilter, setLeakIdFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [drillLeakId, setDrillLeakId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = trpc.documentation.listFiltered.useQuery({
    search: search || undefined,
    employeeName: employeeFilter || undefined,
    leakId: leakIdFilter || undefined,
    documentType: typeFilter !== "all" ? typeFilter : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  const totalPages = Math.ceil(documents.length / PAGE_SIZE);
  const paged = useMemo(() => documents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [documents, page]);

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const byType = { incident_report: 0, custom_report: 0, executive_summary: 0 };
    const employees = new Set<string>();
    documents.forEach((d: DocumentItem) => {
      byType[d.documentType] = (byType[d.documentType] || 0) + 1;
      if (d.generatedByName) employees.add(d.generatedByName);
    });
    return { total, byType, uniqueEmployees: employees.size };
  }, [documents]);

  const clearFilters = () => {
    setSearch("");
    setEmployeeFilter("");
    setLeakIdFilter("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasFilters = search || employeeFilter || leakIdFilter || typeFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
              <FileBarChart className="h-6 w-6 text-teal-400" />
            </div>
            سجل التوثيقات المُصدرة
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة جميع الوثائق والتقارير التي تم إصدارها من المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1.5 border-teal-500/30 text-teal-400">
            <FileText className="h-4 w-4 ml-1" />
            {stats.total} وثيقة
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { color: "teal", icon: <FileText className="h-5 w-5 text-teal-400" />, value: stats.total, label: "إجمالي التوثيقات" },
          { color: "blue", icon: <AlertTriangle className="h-5 w-5 text-blue-400" />, value: stats.byType.incident_report, label: "توثيق حوادث" },
          { color: "purple", icon: <FileBarChart className="h-5 w-5 text-purple-400" />, value: stats.byType.custom_report + stats.byType.executive_summary, label: "تقارير مخصصة" },
          { color: "amber", icon: <User className="h-5 w-5 text-amber-400" />, value: stats.uniqueEmployees, label: "موظفين مُصدرين" },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ scale: 1.04, y: -2 }}
          >
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-${s.color}-500/15 border border-${s.color}-500/25`}>
                  {s.icon}
                </div>
                <div>
                  <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium">فلترة وبحث</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 mr-auto">
                <XCircle className="h-3 w-3 ml-1" />
                مسح الفلاتر
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالرقم أو كود التحقق أو العنوان..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pr-9 bg-background/50"
              />
            </div>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="اسم الموظف..."
                value={employeeFilter}
                onChange={(e) => { setEmployeeFilter(e.target.value); setPage(0); }}
                className="pr-9 bg-background/50"
              />
            </div>
            <div className="relative">
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="رقم الحادثة (Leak ID)..."
                value={leakIdFilter}
                onChange={(e) => { setLeakIdFilter(e.target.value); setPage(0); }}
                className="pr-9 bg-background/50"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="نوع الوثيقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="incident_report">توثيق حادثة</SelectItem>
                <SelectItem value="custom_report">تقرير مخصص</SelectItem>
                <SelectItem value="executive_summary">ملخص تنفيذي</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="من تاريخ"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="pr-9 bg-background/50"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="إلى تاريخ"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="pr-9 bg-background/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">رقم الوثيقة</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">العنوان</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">النوع</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">كود التحقق</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">الحادثة</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">المُصدر</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">الحالة</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-muted/30 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {hasFilters ? "لا توجد وثائق تطابق معايير البحث" : "لم يتم إصدار أي وثائق بعد"}
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((doc: DocumentItem, idx: number) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="p-3">
                      <span className="font-mono text-xs text-teal-400">{doc.documentId}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium line-clamp-1">{doc.titleAr || doc.title}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${docTypeColors[doc.documentType] || ""}`}>
                        {docTypeLabels[doc.documentType] || doc.documentType}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs bg-muted/30 px-2 py-0.5 rounded">{doc.verificationCode}</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDrillLeakId(doc.leakId); }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
                      >
                        {doc.leakId}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-teal-300">
                          {(doc.generatedByName || "?")[0]}
                        </div>
                        <span className="text-xs">{doc.generatedByName || "غير معروف"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="p-3">
                      {doc.isVerified !== false ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          موثق
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">
                          <XCircle className="h-3 w-3 ml-1" />
                          ملغي
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-teal-400"
                          onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {doc.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-cyan-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.pdfUrl!, "_blank");
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              عرض {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, documents.length)} من {documents.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 w-7 p-0 text-xs ${page === pageNum ? "bg-teal-600 text-white" : ""}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Document Detail Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(o) => !o && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-teal-400" />
                  تفاصيل الوثيقة
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Document Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">رقم الوثيقة</p>
                    <p className="font-mono text-sm text-teal-400">{selectedDoc.documentId}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">كود التحقق</p>
                    <p className="font-mono text-sm">{selectedDoc.verificationCode}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">نوع الوثيقة</p>
                    <Badge variant="outline" className={`text-xs ${docTypeColors[selectedDoc.documentType] || ""}`}>
                      {docTypeLabels[selectedDoc.documentType] || selectedDoc.documentType}
                    </Badge>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">الحالة</p>
                    {selectedDoc.isVerified !== false ? (
                      <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        موثق ومعتمد
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-500/15 text-red-400 border-red-500/30">
                        <XCircle className="h-3 w-3 ml-1" />
                        ملغي
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">عنوان الوثيقة</p>
                  <p className="text-sm font-medium">{selectedDoc.titleAr || selectedDoc.title}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">المُصدر</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-teal-300">
                        {(selectedDoc.generatedByName || "?")[0]}
                      </div>
                      <span className="text-sm">{selectedDoc.generatedByName || "غير معروف"}</span>
                    </div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">تاريخ الإصدار</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedDoc.createdAt).toLocaleString("ar-SA", {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leak Reference */}
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">الحادثة المرتبطة</p>
                  <button
                    onClick={() => { setSelectedDoc(null); setDrillLeakId(selectedDoc.leakId); }}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {selectedDoc.leakId} — عرض تفاصيل الحادثة
                  </button>
                </div>

                {/* Content Hash */}
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">بصمة المحتوى (Hash)</p>
                  <p className="font-mono text-[10px] text-muted-foreground break-all">{selectedDoc.contentHash}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedDoc.pdfUrl && (
                    <Button
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => window.open(selectedDoc.pdfUrl!, "_blank")}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تحميل الوثيقة
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSelectedDoc(null); setDrillLeakId(selectedDoc.leakId); }}
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    عرض الحادثة
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Leak Detail Drilldown */}
      {drillLeakId && (
        <LeakDetailDrilldown
          leak={{ leakId: drillLeakId } as any}
          open={!!drillLeakId}
          onClose={() => setDrillLeakId(null)}
        />
      )}
    </div>
  );
}
