/**
 * PIIClassifier — PII detection and classification tool
 * Dark Observatory Theme — Uses tRPC API
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScanSearch,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Play,
  RotateCcw,
  FileText,
  Hash,
  Phone,
  Mail,
  CreditCard,
  User,
  History,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const sampleData = `محمد بن عبدالله الشمري
رقم الهوية: 1098765432
رقم الجوال: 0512345678
البريد: mohammed@company.sa

فاطمة أحمد العتيبي
رقم الإقامة: 2087654321
رقم الجوال: 0598765432
البريد: fatima@hospital.sa

عبدالرحمن سعد القحطاني
رقم الهوية: 1076543210
IBAN: SA0380000000608010167519
رقم الجوال: 0551234567`;

interface DetectedPII {
  type: string;
  typeAr: string;
  value: string;
  line: number;
  icon: React.ElementType;
  color: string;
  confidence: number;
  position: [number, number];
}

const piiRegexPatterns = [
  { type: "National ID", typeAr: "رقم الهوية الوطنية", regex: /\b1\d{9}\b/g, icon: Hash, color: "text-red-400" },
  { type: "Iqama Number", typeAr: "رقم الإقامة", regex: /\b2\d{9}\b/g, icon: FileText, color: "text-amber-400" },
  { type: "Saudi Phone", typeAr: "رقم جوال سعودي", regex: /\b05\d{8}\b/g, icon: Phone, color: "text-cyan-400" },
  { type: "Saudi Email", typeAr: "بريد إلكتروني سعودي", regex: /[\w.-]+@[\w.-]+\.sa\b/g, icon: Mail, color: "text-violet-400" },
  { type: "IBAN", typeAr: "رقم الحساب البنكي", regex: /\bSA\d{22}\b/g, icon: CreditCard, color: "text-emerald-400" },
];

const piiTypeColors: Record<string, string> = {
  "National ID": "text-red-400 bg-red-500/10 border-red-500/30",
  "Iqama Number": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "Phone Number": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "Saudi Phone": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "Email": "text-violet-400 bg-violet-500/10 border-violet-500/30",
  "Saudi Email": "text-violet-400 bg-violet-500/10 border-violet-500/30",
  "IBAN": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Full Name": "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

export default function PIIClassifier() {
  const [inputText, setInputText] = useState(sampleData);
  const [hasScanned, setHasScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [apiResults, setApiResults] = useState<{
    results: Array<{ type: string; typeAr: string; value: string; line: number }>;
    totalMatches: number;
  } | null>(null);

  const { data: history, isLoading: historyLoading } = trpc.pii.history.useQuery();
  const scanMutation = trpc.pii.scan.useMutation();

  // Local regex scan
  const detectedPII = useMemo(() => {
    if (!hasScanned) return [];
    const results: DetectedPII[] = [];
    const lines = inputText.split("\n");

    lines.forEach((line, lineIdx) => {
      piiRegexPatterns.forEach((pattern) => {
        const regex = new RegExp(pattern.regex.source, "g");
        let match;
        while ((match = regex.exec(line)) !== null) {
          results.push({
            type: pattern.type,
            typeAr: pattern.typeAr,
            value: match[0],
            line: lineIdx + 1,
            icon: pattern.icon,
            color: pattern.color,
            confidence: 0.95,
            position: [match.index, match.index + match[0].length],
          });
        }
      });
    });

    return results;
  }, [inputText, hasScanned]);

  const piiSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    detectedPII.forEach((pii) => {
      summary[pii.typeAr] = (summary[pii.typeAr] || 0) + 1;
    });
    return summary;
  }, [detectedPII]);

  const handleScan = async () => {
    if (!inputText.trim()) {
      toast.error("الرجاء إدخال نص للفحص");
      return;
    }
    setIsScanning(true);
    setHasScanned(true);
    try {
      const result = await scanMutation.mutateAsync({ text: inputText });
      setApiResults(result);
      toast.success(`تم اكتشاف ${result.totalMatches} بيانات شخصية`, {
        description: "PII detection complete",
      });
    } catch {
      // Fall back to local scan
      toast.success(`تم اكتشاف ${detectedPII.length} بيانات شخصية (محلي)`, {
        description: "PII detection complete (local)",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setInputText(sampleData);
    setHasScanned(false);
    setApiResults(null);
  };

  const matchCount = apiResults?.totalMatches ?? detectedPII.length;
  const riskScore = matchCount > 5 ? 85 : matchCount > 2 ? 60 : 30;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">مصنّف البيانات الشخصية</h1>
              <p className="text-xs text-muted-foreground">PII Classifier & Detector</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            هل يحتوي على بيانات شخصية لأفراد في المملكة؟ — محرك التصنيف التلقائي
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="scanner">الماسح التفاعلي</TabsTrigger>
          <TabsTrigger value="patterns">أنماط الكشف</TabsTrigger>
          <TabsTrigger value="history">سجل الفحوصات</TabsTrigger>
        </TabsList>

        {/* Scanner tab */}
        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    النص المدخل
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleReset} className="gap-1.5 h-7 text-xs">
                      <RotateCcw className="w-3 h-3" />
                      إعادة تعيين
                    </Button>
                    <Button size="sm" onClick={handleScan} disabled={isScanning} className="gap-1.5 h-7 text-xs bg-primary text-primary-foreground">
                      {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      فحص
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setHasScanned(false); setApiResults(null); }}
                  className="w-full h-80 p-4 rounded-lg bg-black/30 border border-border text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="الصق النص هنا لفحص البيانات الشخصية..."
                  dir="auto"
                />
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  نتائج الكشف
                  {hasScanned && (
                    <Badge variant="outline" className="mr-2 bg-primary/10 border-primary/30 text-primary text-xs">
                      {detectedPII.length} نتيجة
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasScanned ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ScanSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">اضغط "فحص" لبدء الكشف عن البيانات الشخصية</p>
                    </div>
                  </div>
                ) : isScanning ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : detectedPII.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                      <p className="text-sm">لم يتم اكتشاف بيانات شخصية</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Risk score */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border">
                      <span className="text-sm text-foreground">درجة الخطورة</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-secondary/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${riskScore}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${riskScore >= 80 ? "bg-red-500" : riskScore >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                          />
                        </div>
                        <span className={`text-sm font-bold ${riskScore >= 80 ? "text-red-400" : riskScore >= 50 ? "text-amber-400" : "text-emerald-400"}`}>
                          {riskScore}%
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(piiSummary).map(([type, count]) => (
                        <Badge key={type} variant="outline" className="bg-red-500/5 border-red-500/20 text-red-400 text-xs">
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>

                    {/* Detailed results */}
                    <div className="h-52 overflow-y-auto space-y-2">
                      {detectedPII.map((pii, i) => {
                        const Icon = pii.icon;
                        return (
                          <motion.div
                            key={`${pii.type}-${pii.value}-${i}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border"
                          >
                            <Icon className={`w-4 h-4 ${pii.color} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{pii.typeAr}</p>
                              <p className="text-[10px] text-muted-foreground">سطر {pii.line}</p>
                            </div>
                            <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">
                              {pii.value}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(pii.value);
                                toast("تم النسخ");
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {piiRegexPatterns.map((pattern, i) => {
              const Icon = pattern.icon;
              return (
                <motion.div key={pattern.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                          <Icon className={`w-4.5 h-4.5 ${pattern.color}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{pattern.typeAr}</h3>
                          <p className="text-[10px] text-muted-foreground">{pattern.type}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/30 border border-border">
                        <code className="text-xs font-mono text-primary" dir="ltr">{pattern.regex.source}</code>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* PDPL categories */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">تصنيف البيانات حسب فئات PDPL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { category: "بيانات الهوية", categoryEn: "Identity Data", items: ["رقم الهوية الوطنية", "رقم الإقامة", "رقم جواز السفر"], color: "border-red-500/30" },
                  { category: "بيانات الاتصال", categoryEn: "Contact Data", items: ["رقم الجوال", "البريد الإلكتروني", "العنوان"], color: "border-cyan-500/30" },
                  { category: "البيانات المالية", categoryEn: "Financial Data", items: ["رقم الحساب البنكي (IBAN)", "بيانات البطاقة", "السجل الائتماني"], color: "border-emerald-500/30" },
                  { category: "البيانات الحساسة", categoryEn: "Sensitive Data", items: ["السجلات الصحية", "البيانات البيومترية", "المعتقدات الدينية"], color: "border-amber-500/30" },
                ].map((cat) => (
                  <div key={cat.category} className={`p-4 rounded-lg bg-secondary/20 border ${cat.color}`}>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{cat.category}</h4>
                    <p className="text-[10px] text-muted-foreground mb-2">{cat.categoryEn}</p>
                    <ul className="space-y-1">
                      {cat.items.map((item) => (
                        <li key={item} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                سجل الفحوصات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (history && history.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">التاريخ</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">حجم النص</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">النتائج</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">الخطورة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((scan) => {
                        const matchCount = scan.totalMatches ?? (scan.results?.length ?? 0);
                        const risk = matchCount > 5 ? 85 : matchCount > 2 ? 60 : 30;
                        return (
                          <tr key={scan.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString("ar-SA") : "—"}
                            </td>
                            <td className="py-3 px-4 text-xs text-foreground">{scan.inputText.length} حرف</td>
                            <td className="py-3 px-4 text-xs text-foreground font-medium">{matchCount} نتيجة</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] px-2 py-1 rounded border ${
                                risk >= 80 ? "text-red-400 bg-red-500/10 border-red-500/30" :
                                risk >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                                "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                              }`}>
                                {risk}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد فحوصات سابقة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
