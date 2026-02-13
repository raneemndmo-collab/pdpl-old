/**
 * ExportCenter — مركز التصدير المتقدم
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, FileText, Table, FileSpreadsheet, X, Loader2, CheckCircle2,
  FileBarChart, ClipboardList, Shield,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ExportCenterProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
  leaks: any[];
}

type ExportFormat = "pdf" | "excel" | "csv";
type ExportTemplate = "executive" | "detailed" | "compliance";

const formatConfig: Record<ExportFormat, { icon: any; label: string; labelEn: string; color: string; bg: string }> = {
  pdf: { icon: FileText, label: "تقرير PDF", labelEn: "PDF Report", color: "text-red-400", bg: "bg-red-500/10" },
  excel: { icon: FileSpreadsheet, label: "جدول Excel", labelEn: "Excel Spreadsheet", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  csv: { icon: Table, label: "بيانات CSV", labelEn: "CSV Data", color: "text-blue-400", bg: "bg-blue-500/10" },
};

const templateConfig: Record<ExportTemplate, { icon: any; label: string; description: string }> = {
  executive: { icon: FileBarChart, label: "ملخص تنفيذي", description: "تقرير مختصر للإدارة العليا مع المؤشرات الرئيسية" },
  detailed: { icon: ClipboardList, label: "تقرير تفصيلي", description: "تقرير شامل يتضمن جميع الحوادث والتحليلات" },
  compliance: { icon: Shield, label: "تقرير الامتثال", description: "تقرير الامتثال لنظام حماية البيانات الشخصية PDPL" },
};

function generateCSV(leaks: any[]): string {
  const headers = ["العنوان", "القطاع", "المصدر", "الخطورة", "عدد السجلات", "تاريخ الاكتشاف", "الحالة"];
  const rows = leaks.map(l => [
    l.titleAr || l.title || "",
    l.sectorAr || l.sector || "",
    l.source || "",
    l.severity || "",
    l.recordCount || 0,
    l.detectedAt || "",
    l.status || "",
  ]);
  const bom = "\uFEFF";
  return bom + [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportCenter({ isOpen, onClose, stats, leaks }: ExportCenterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>("executive");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleExport = async () => {
    setExporting(true);
    setExportDone(false);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const timestamp = new Date().toISOString().slice(0, 10);
    const templateLabel = templateConfig[selectedTemplate].label;

    if (selectedFormat === "csv") {
      downloadBlob(generateCSV(leaks), `rasid-${selectedTemplate}-${timestamp}.csv`, "text/csv;charset=utf-8");
    } else if (selectedFormat === "excel") {
      const headers = ["العنوان", "القطاع", "المصدر", "الخطورة", "عدد السجلات", "تاريخ الاكتشاف"];
      const rows = leaks.map(l => [l.titleAr || l.title || "", l.sectorAr || l.sector || "", l.source || "", l.severity || "", l.recordCount || 0, l.detectedAt || ""]);
      const html = `<html dir="rtl"><head><meta charset="utf-8"></head><body><h2>منصة راصد - ${templateLabel}</h2><p>تاريخ التصدير: ${timestamp}</p><table border="1" style="border-collapse:collapse;direction:rtl"><tr>${headers.map(h => `<th style="background:#1e3a8a;color:white;padding:8px">${h}</th>`).join("")}</tr>${rows.map(r => `<tr>${r.map(c => `<td style="padding:6px">${c}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
      downloadBlob(html, `rasid-${selectedTemplate}-${timestamp}.xls`, "application/vnd.ms-excel");
    } else {
      const content = `<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl;color:#1e293b}h1{color:#1e3a8a;border-bottom:3px solid #3DB1AC;padding-bottom:10px}.stats{display:flex;gap:20px;margin:20px 0}.stat-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;flex:1;text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#1e3a8a}.stat-label{font-size:12px;color:#64748b;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e3a8a;color:white;padding:10px;text-align:right}td{padding:8px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}.footer{margin-top:30px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:15px}</style></head><body><h1>منصة راصد - ${templateLabel}</h1><p>تاريخ التصدير: ${timestamp}</p><div class="stats"><div class="stat-box"><div class="stat-value">${stats?.totalLeaks || 0}</div><div class="stat-label">إجمالي الحوادث</div></div><div class="stat-box"><div class="stat-value">${(stats?.totalRecords || 0).toLocaleString()}</div><div class="stat-label">السجلات المكشوفة</div></div><div class="stat-box"><div class="stat-value">${stats?.distinctSectors || 0}</div><div class="stat-label">القطاعات المتأثرة</div></div></div><table><tr><th>العنوان</th><th>القطاع</th><th>المصدر</th><th>الخطورة</th><th>السجلات</th></tr>${leaks.slice(0, selectedTemplate === "executive" ? 10 : 50).map(l => `<tr><td>${l.titleAr || l.title || ""}</td><td>${l.sectorAr || l.sector || ""}</td><td>${l.source || ""}</td><td>${l.severity || ""}</td><td>${(l.recordCount || 0).toLocaleString()}</td></tr>`).join("")}</table><div class="footer">تم إنشاء هذا التقرير بواسطة منصة راصد | الهيئة الوطنية للبيانات والذكاء الاصطناعي (NDMO)</div></body></html>`;
      const printWindow = window.open("", "_blank");
      if (printWindow) { printWindow.document.write(content); printWindow.document.close(); printWindow.print(); }
    }
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 bottom-0 w-[400px] max-w-[90vw] z-50 overflow-y-auto ${isDark ? "bg-[#0f172a] border-r border-white/10" : "bg-white border-r border-slate-200 shadow-2xl"}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between p-5 border-b ${isDark ? "bg-[#0f172a]/95 border-white/10 backdrop-blur-xl" : "bg-white/95 border-slate-200 backdrop-blur-xl"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-[#3DB1AC]/15" : "bg-blue-100"}`}>
                  <Download className={`w-5 h-5 ${isDark ? "text-[#3DB1AC]" : "text-blue-600"}`} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">مركز التصدير</h2>
                  <p className="text-[9px] text-muted-foreground">Export Center</p>
                </div>
              </div>
              <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-foreground mb-3">صيغة التصدير</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(formatConfig) as [ExportFormat, typeof formatConfig[ExportFormat]][]).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedFormat === key;
                    return (
                      <button key={key} onClick={() => setSelectedFormat(key)}
                        className={`p-3 rounded-xl border text-center transition-all ${isSelected
                          ? isDark ? "bg-[#3DB1AC]/10 border-[#3DB1AC]/30 ring-1 ring-[#3DB1AC]/20" : "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                          : isDark ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                        <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? config.color : "text-muted-foreground"}`} />
                        <p className="text-[10px] font-bold text-foreground">{config.label}</p>
                        <p className="text-[8px] text-muted-foreground">{config.labelEn}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground mb-3">قالب التقرير</h3>
                <div className="space-y-2">
                  {(Object.entries(templateConfig) as [ExportTemplate, typeof templateConfig[ExportTemplate]][]).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedTemplate === key;
                    return (
                      <button key={key} onClick={() => setSelectedTemplate(key)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-right transition-all ${isSelected
                          ? isDark ? "bg-[#3DB1AC]/10 border-[#3DB1AC]/30" : "bg-blue-50 border-blue-300"
                          : isDark ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? isDark ? "bg-[#3DB1AC]/20" : "bg-blue-100" : isDark ? "bg-white/5" : "bg-slate-100"}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? isDark ? "text-[#3DB1AC]" : "text-blue-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground">{config.label}</p>
                          <p className="text-[9px] text-muted-foreground">{config.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-slate-50 border border-slate-100"}`}>
                <h3 className="text-[10px] font-bold text-foreground mb-2">ملخص التصدير</h3>
                <div className="space-y-1.5 text-[10px] text-muted-foreground">
                  <div className="flex justify-between"><span>الصيغة:</span><span className="font-bold text-foreground">{formatConfig[selectedFormat].label}</span></div>
                  <div className="flex justify-between"><span>القالب:</span><span className="font-bold text-foreground">{templateConfig[selectedTemplate].label}</span></div>
                  <div className="flex justify-between"><span>عدد الحوادث:</span><span className="font-bold text-foreground">{leaks.length}</span></div>
                </div>
              </div>
              <motion.button onClick={handleExport} disabled={exporting}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${exporting ? "opacity-70 cursor-not-allowed" : ""} ${isDark ? "bg-gradient-to-r from-[#3DB1AC] to-[#6459A7] text-white" : "bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white"}`}
                whileHover={exporting ? {} : { scale: 1.02 }} whileTap={exporting ? {} : { scale: 0.98 }}>
                {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التصدير...</>
                  : exportDone ? <><CheckCircle2 className="w-4 h-4" /> تم التصدير بنجاح!</>
                  : <><Download className="w-4 h-4" /> تصدير التقرير</>}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
