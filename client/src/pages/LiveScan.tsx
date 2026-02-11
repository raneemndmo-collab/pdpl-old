import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
  FileText,
  AlertTriangle,
  Database,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Mail,
  Key,
  Phone,
  CreditCard,
  Radar,
  Activity,
  Target,
  Eye,
  Save,
  Download,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface ScanTarget {
  type: "email" | "domain" | "keyword" | "phone" | "national_id";
  value: string;
}

interface ScanResult {
  id: string;
  source: string;
  sourceIcon: string;
  type: "breach" | "paste" | "certificate" | "exposure" | "darkweb";
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  details: Record<string, any>;
  timestamp: Date;
  url?: string;
  affectedRecords?: number;
  dataTypes?: string[];
}

interface ScanProgress {
  source: string;
  status: "scanning" | "completed" | "error" | "skipped";
  message: string;
  resultsCount: number;
  timestamp: Date;
}

// ============================================================
// Constants
// ============================================================

const TARGET_TYPES = [
  { value: "email" as const, label: "بريد إلكتروني", icon: Mail, placeholder: "example@domain.com" },
  { value: "domain" as const, label: "نطاق", icon: Globe, placeholder: "example.com" },
  { value: "keyword" as const, label: "كلمة مفتاحية", icon: Key, placeholder: "اسم جهة أو كلمة بحث" },
  { value: "phone" as const, label: "رقم هاتف", icon: Phone, placeholder: "+966XXXXXXXXX" },
  { value: "national_id" as const, label: "رقم هوية", icon: CreditCard, placeholder: "1XXXXXXXXX" },
];

const SCAN_SOURCES = [
  { id: "xposedornot", name: "XposedOrNot", desc: "فحص تسريبات البريد الإلكتروني", icon: ShieldAlert, color: "text-red-400" },
  { id: "crtsh", name: "crt.sh", desc: "شفافية الشهادات واكتشاف النطاقات", icon: Globe, color: "text-blue-400" },
  { id: "psbdmp", name: "PSBDMP", desc: "البحث في تفريغات مواقع اللصق", icon: FileText, color: "text-yellow-400" },
  { id: "googledork", name: "Google Dorking", desc: "استعلامات بحث ذكية", icon: Search, color: "text-green-400" },
  { id: "breachdirectory", name: "BreachDirectory", desc: "قاعدة بيانات التسريبات العامة", icon: Database, color: "text-purple-400" },
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "حرج", color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" },
  high: { label: "عالي", color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/30" },
  medium: { label: "متوسط", color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30" },
  low: { label: "منخفض", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  info: { label: "معلومات", color: "text-gray-400", bg: "bg-gray-500/20 border-gray-500/30" },
};

const SOURCE_ICON_MAP: Record<string, any> = {
  "shield-alert": ShieldAlert,
  "file-text": FileText,
  globe: Globe,
  "alert-triangle": AlertTriangle,
  database: Database,
  brain: Brain,
  search: Search,
};

// ============================================================
// Component
// ============================================================

export default function LiveScan() {
  const { user } = useAuth();
  const [targetType, setTargetType] = useState<ScanTarget["type"]>("email");
  const [targetValue, setTargetValue] = useState("");
  const [enabledSources, setEnabledSources] = useState<string[]>(SCAN_SOURCES.map((s) => s.id));
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("setup");
  const [scanHistory, setScanHistory] = useState<Array<{ target: string; type: string; findings: number; date: Date }>>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const executeMutation = trpc.liveScan.execute.useMutation();
  const quickMutation = trpc.liveScan.quick.useMutation();
  const saveAsLeakMutation = trpc.liveScan.saveAsLeak.useMutation();
  const saveAllMutation = trpc.liveScan.saveAllAsLeaks.useMutation();
  const [savedResults, setSavedResults] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const saveResultAsLeak = async (result: ScanResult) => {
    try {
      const res = await saveAsLeakMutation.mutateAsync({
        scanResult: {
          id: result.id,
          source: result.source,
          type: result.type,
          severity: result.severity,
          title: result.title,
          description: result.description,
          details: result.details,
          url: result.url,
          affectedRecords: result.affectedRecords,
          dataTypes: result.dataTypes,
        },
        targetValue,
        targetType,
      });
      setSavedResults(prev => new Set(prev).add(result.id));
      toast.success(`\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062d\u0627\u062f\u062b\u0629: ${res.leakId}`);
    } catch (e: any) {
      toast.error(`\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062d\u0641\u0638: ${e.message}`);
    }
  };

  const saveAllResults = async () => {
    if (scanResults.length === 0) return;
    setSavingAll(true);
    try {
      const unsaved = scanResults.filter(r => !savedResults.has(r.id));
      if (unsaved.length === 0) {
        toast.info("\u062c\u0645\u064a\u0639 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0645\u062d\u0641\u0648\u0638\u0629 \u0628\u0627\u0644\u0641\u0639\u0644");
        return;
      }
      const res = await saveAllMutation.mutateAsync({
        scanResults: unsaved.map(r => ({
          id: r.id,
          source: r.source,
          type: r.type,
          severity: r.severity,
          title: r.title,
          description: r.description,
          details: r.details,
          url: r.url,
          affectedRecords: r.affectedRecords,
          dataTypes: r.dataTypes,
        })),
        targetValue,
        targetType,
      });
      const newSaved = new Set(savedResults);
      unsaved.forEach(r => newSaved.add(r.id));
      setSavedResults(newSaved);
      toast.success(`\u062a\u0645 \u062d\u0641\u0638 ${res.savedCount} \u062d\u0627\u062f\u062b\u0629 \u062a\u0633\u0631\u064a\u0628 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a`);
    } catch (e: any) {
      toast.error(`\u062e\u0637\u0623: ${e.message}`);
    } finally {
      setSavingAll(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setEnabledSources((prev) => (prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]));
  };

  const startScan = async () => {
    if (!targetValue.trim()) {
      toast.error("يرجى إدخال قيمة للمسح");
      return;
    }
    if (enabledSources.length === 0) {
      toast.error("يرجى تحديد مصدر واحد على الأقل");
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setScanProgress([]);
    setScanCompleted(false);
    setActiveTab("results");

    try {
      const session = await executeMutation.mutateAsync({
        targets: [{ type: targetType, value: targetValue.trim() }],
        sources: enabledSources,
      });

      setScanResults(session.results as ScanResult[]);
      setScanProgress(session.progress as ScanProgress[]);
      setScanCompleted(true);
      setScanHistory((prev) => [
        { target: targetValue, type: targetType, findings: session.totalFindings, date: new Date() },
        ...prev.slice(0, 9),
      ]);

      if (session.totalFindings > 0) {
        toast.warning(`تم اكتشاف ${session.totalFindings} تهديد!`);
      } else {
        toast.success("لم يتم اكتشاف أي تهديدات");
      }
    } catch (error: any) {
      toast.error(`خطأ في المسح: ${error.message}`);
      setScanCompleted(true);
    } finally {
      setIsScanning(false);
    }
  };

  const quickScanAction = async () => {
    if (!targetValue.trim()) {
      toast.error("يرجى إدخال قيمة للمسح السريع");
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setScanProgress([]);
    setScanCompleted(false);
    setActiveTab("results");

    try {
      const session = await quickMutation.mutateAsync({
        value: targetValue.trim(),
        type: targetType,
      });

      setScanResults(session.results as ScanResult[]);
      setScanProgress(session.progress as ScanProgress[]);
      setScanCompleted(true);
      setScanHistory((prev) => [
        { target: targetValue, type: targetType, findings: session.totalFindings, date: new Date() },
        ...prev.slice(0, 9),
      ]);

      if (session.totalFindings > 0) {
        toast.warning(`تم اكتشاف ${session.totalFindings} تهديد!`);
      } else {
        toast.success("لم يتم اكتشاف أي تهديدات");
      }
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
      setScanCompleted(true);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSourceIcon = (iconName: string) => {
    return SOURCE_ICON_MAP[iconName] || Shield;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const criticalCount = scanResults.filter((r) => r.severity === "critical").length;
  const highCount = scanResults.filter((r) => r.severity === "high").length;
  const mediumCount = scanResults.filter((r) => r.severity === "medium").length;
  const lowCount = scanResults.filter((r) => r.severity === "low" || r.severity === "info").length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20">
              <Radar className="w-6 h-6 text-purple-400" />
            </div>
            المسح والفحص المباشر
          </h1>
          <p className="text-sm text-white/50 mt-1">فحص حقيقي ومباشر عن تسريبات البيانات الشخصية عبر مصادر متعددة</p>
        </div>
        {scanHistory.length > 0 && (
          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
            <Activity className="w-3 h-3 ml-1" />
            {scanHistory.length} عملية مسح
          </Badge>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="setup" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Target className="w-4 h-4 ml-1" />
            إعداد المسح
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Eye className="w-4 h-4 ml-1" />
            النتائج
            {scanResults.length > 0 && (
              <Badge variant="secondary" className="mr-2 bg-purple-500/20 text-purple-300 text-xs">
                {scanResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Clock className="w-4 h-4 ml-1" />
            السجل
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* Setup Tab */}
        {/* ============================================================ */}
        <TabsContent value="setup" className="space-y-6 mt-4">
          {/* Target Input */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              هدف المسح
            </h2>

            {/* Target Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TARGET_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  onClick={() => setTargetType(tt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    targetType === tt.value
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  <tt.icon className="w-4 h-4" />
                  {tt.label}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={TARGET_TYPES.find((t) => t.value === targetType)?.placeholder}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base pr-4 pl-12"
                  dir="ltr"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isScanning) startScan();
                  }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              </div>
              <Button
                onClick={startScan}
                disabled={isScanning || !targetValue.trim()}
                className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ المسح...
                  </>
                ) : (
                  <>
                    <Radar className="w-4 h-4 ml-2" />
                    بدء المسح
                  </>
                )}
              </Button>
              <Button
                onClick={quickScanAction}
                disabled={isScanning || !targetValue.trim()}
                variant="outline"
                className="h-12 px-4 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                <Zap className="w-4 h-4 ml-1" />
                سريع
              </Button>
            </div>
          </div>

          {/* Sources Selection */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                مصادر المسح
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnabledSources(SCAN_SOURCES.map((s) => s.id))}
                  className="text-xs text-white/50 hover:text-white"
                >
                  تحديد الكل
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEnabledSources([])}
                  className="text-xs text-white/50 hover:text-white"
                >
                  إلغاء الكل
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SCAN_SOURCES.map((source) => {
                const isEnabled = enabledSources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
                      isEnabled
                        ? "bg-white/10 border-purple-500/30"
                        : "bg-white/5 border-white/10 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className={`mt-0.5 ${isEnabled ? "text-green-400" : "text-white/30"}`}>
                      {isEnabled ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <source.icon className={`w-4 h-4 ${source.color}`} />
                        <span className="font-medium text-white text-sm">{source.name}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{source.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="glass-card rounded-2xl p-4 border-blue-500/20 bg-blue-500/5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-blue-300 font-medium">مسح حقيقي ومباشر</p>
                <p className="text-xs text-white/50 mt-1">
                  يتم إجراء المسح عبر واجهات برمجية حقيقية (APIs) متصلة بمصادر بيانات التسريبات العالمية. النتائج فعلية وليست تجريبية.
                  يشمل المسح: فحص تسريبات البريد الإلكتروني، اكتشاف النطاقات الفرعية، البحث في مواقع اللصق، واستعلامات بحث ذكية.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* Results Tab */}
        {/* ============================================================ */}
        <TabsContent value="results" className="space-y-4 mt-4" ref={resultsRef}>
          {/* Scanning Animation */}
          {isScanning && (
            <div className="glass-card rounded-2xl p-8 text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-purple-500/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full border-4 border-purple-500/40 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">جارٍ المسح الحقيقي...</h3>
              <p className="text-sm text-white/50">يتم فحص "{targetValue}" عبر {enabledSources.length} مصدر</p>

              {/* Live Progress */}
              <div className="space-y-2 mt-4 max-w-md mx-auto text-right">
                {SCAN_SOURCES.filter((s) => enabledSources.includes(s.id)).map((source) => (
                  <div key={source.id} className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-3 h-3 text-purple-400 animate-spin shrink-0" />
                    <span className="text-white/60">{source.name}</span>
                    <span className="text-white/30 text-xs">— {source.desc}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-3 h-3 text-purple-400 animate-spin shrink-0" />
                  <span className="text-white/60">التحليل الذكي</span>
                  <span className="text-white/30 text-xs">— تحليل بالذكاء الاصطناعي</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {scanCompleted && scanResults.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card rounded-xl p-4 border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-white/50">حرج</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{criticalCount}</span>
                </div>
                <div className="glass-card rounded-xl p-4 border-orange-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-white/50">عالي</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-400">{highCount}</span>
                </div>
                <div className="glass-card rounded-xl p-4 border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white/50">متوسط</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-400">{mediumCount}</span>
                </div>
                <div className="glass-card rounded-xl p-4 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/50">منخفض / معلومات</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{lowCount}</span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  مراحل المسح
                </h3>
                <div className="space-y-2">
                  {scanProgress.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {p.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      ) : p.status === "error" ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : p.status === "skipped" ? (
                        <XCircle className="w-4 h-4 text-white/30 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                      )}
                      <span className="text-white/70 font-medium min-w-[100px]">{p.source}</span>
                      <span className="text-white/40 flex-1">{p.message}</span>
                      {p.resultsCount > 0 && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                          {p.resultsCount}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  النتائج المفصّلة ({scanResults.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                  onClick={saveAllResults}
                  disabled={savingAll || scanResults.length === 0 || savedResults.size === scanResults.length}
                >
                  {savingAll ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : savedResults.size === scanResults.length && scanResults.length > 0 ? (
                    <CheckCheck className="w-4 h-4 ml-1" />
                  ) : (
                    <Download className="w-4 h-4 ml-1" />
                  )}
                  {savedResults.size === scanResults.length && scanResults.length > 0
                    ? "تم حفظ الكل"
                    : `حفظ الكل كحوادث (${scanResults.length - savedResults.size})`}
                </Button>
              </div>

                {scanResults.map((result) => {
                  const isExpanded = expandedResults.has(result.id);
                  const sevConfig = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.info;
                  const IconComp = getSourceIcon(result.sourceIcon);

                  return (
                    <div
                      key={result.id}
                      className={`glass-card rounded-xl border ${sevConfig.bg} overflow-hidden transition-all`}
                    >
                      <button
                        onClick={() => toggleExpand(result.id)}
                        className="w-full p-4 flex items-start gap-3 text-right"
                      >
                        <div className={`p-2 rounded-lg ${sevConfig.bg} shrink-0`}>
                          <IconComp className={`w-5 h-5 ${sevConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${sevConfig.bg} ${sevConfig.color} border-current`}>
                              {sevConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-white/10 text-white/50">
                              {result.source}
                            </Badge>
                            {result.affectedRecords && (
                              <Badge variant="outline" className="text-xs border-white/10 text-white/50">
                                {result.affectedRecords.toLocaleString()} سجل
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-white mt-1.5">{result.title}</h4>
                          <p className="text-xs text-white/50 mt-1 line-clamp-2">{result.description}</p>
                        </div>
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-white/30" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/30" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                          {/* Data Types */}
                          {result.dataTypes && result.dataTypes.length > 0 && (
                            <div>
                              <span className="text-xs text-white/40 block mb-1">البيانات المكشوفة:</span>
                              <div className="flex flex-wrap gap-1">
                                {result.dataTypes.map((dt, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-red-500/20 text-red-300">
                                    {dt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details */}
                          <div>
                            <span className="text-xs text-white/40 block mb-1">التفاصيل:</span>
                            <pre
                              className="text-xs text-white/60 bg-black/30 rounded-lg p-3 overflow-x-auto max-h-48"
                              dir="ltr"
                            >
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {result.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-white/10 text-white/60"
                                onClick={() => window.open(result.url, "_blank")}
                              >
                                <ExternalLink className="w-3 h-3 ml-1" />
                                فتح المصدر
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-white/10 text-white/60"
                              onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                            >
                              <Copy className="w-3 h-3 ml-1" />
                              نسخ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs ${
                                savedResults.has(result.id)
                                  ? "border-green-500/30 text-green-300 bg-green-500/10"
                                  : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                              }`}
                              onClick={() => saveResultAsLeak(result)}
                              disabled={savedResults.has(result.id) || saveAsLeakMutation.isPending}
                            >
                              {savedResults.has(result.id) ? (
                                <CheckCheck className="w-3 h-3 ml-1" />
                              ) : saveAsLeakMutation.isPending ? (
                                <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3 ml-1" />
                              )}
                              {savedResults.has(result.id) ? "تم الحفظ" : "حفظ كحادثة"}
                            </Button>
                          </div>

                          {/* Google Dork Queries */}
                          {result.details?.queries && (
                            <div>
                              <span className="text-xs text-white/40 block mb-2">استعلامات البحث الذكية:</span>
                              <div className="space-y-1">
                                {result.details.queries.map((q: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                                    <code className="text-xs text-green-300 flex-1" dir="ltr">
                                      {q}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(q)}
                                    >
                                      <Copy className="w-3 h-3 text-white/40" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank")
                                      }
                                    >
                                      <ExternalLink className="w-3 h-3 text-white/40" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Subdomains */}
                          {result.details?.subdomains && (
                            <div>
                              <span className="text-xs text-white/40 block mb-2">
                                النطاقات الفرعية المكتشفة ({result.details.totalSubdomains}):
                              </span>
                              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                {result.details.subdomains.map((sd: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs border-blue-500/20 text-blue-300" dir="ltr">
                                    {sd}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Recommendations */}
                          {result.details?.recommendations && (
                            <div>
                              <span className="text-xs text-white/40 block mb-2">التوصيات:</span>
                              <ul className="space-y-1">
                                {result.details.recommendations.map((rec: string, i: number) => (
                                  <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* No Results */}
          {scanCompleted && scanResults.length === 0 && !isScanning && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">لم يتم اكتشاف أي تسريبات</h3>
              <p className="text-sm text-white/50 mt-2">لم يتم العثور على أي بيانات مسربة مرتبطة بالهدف المحدد</p>
            </div>
          )}

          {/* Empty State */}
          {!scanCompleted && !isScanning && scanResults.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Radar className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white/50">لم يتم إجراء أي مسح بعد</h3>
              <p className="text-sm text-white/30 mt-2">انتقل إلى تبويب "إعداد المسح" لبدء فحص جديد</p>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* History Tab */}
        {/* ============================================================ */}
        <TabsContent value="history" className="mt-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              سجل عمليات المسح
            </h3>

            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">لا توجد عمليات مسح سابقة في هذه الجلسة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Search className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-white font-medium">{h.target}</span>
                      <span className="text-xs text-white/40 mr-2">
                        ({TARGET_TYPES.find((t) => t.value === h.type)?.label})
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        h.findings > 0
                          ? "border-red-500/30 text-red-300"
                          : "border-green-500/30 text-green-300"
                      }
                    >
                      {h.findings > 0 ? `${h.findings} تهديد` : "آمن"}
                    </Badge>
                    <span className="text-xs text-white/30">{h.date.toLocaleTimeString("ar-SA")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
