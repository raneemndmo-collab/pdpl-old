/**
 * EvidenceChain — SHA-256 blockchain-like evidence integrity verification
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Shield,
  CheckCircle2,
  XCircle,
  Hash,
  FileText,
  Image,
  Database,
  Loader2,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  text: { label: "نص", icon: FileText, color: "text-cyan-400" },
  screenshot: { label: "لقطة شاشة", icon: Image, color: "text-violet-400" },
  file: { label: "ملف", icon: Database, color: "text-emerald-400" },
  metadata: { label: "بيانات وصفية", icon: Hash, color: "text-amber-400" },
};

export default function EvidenceChain() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: evidence, isLoading } = trpc.evidence.list.useQuery();
  const { data: stats } = trpc.evidence.stats.useQuery();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-violet-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">سلسلة الأدلة الرقمية</h1>
              <p className="text-xs text-muted-foreground">Evidence Chain — SHA-256 Integrity Verification</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            سلسلة بلوكتشين مصغرة لضمان سلامة الأدلة — كل دليل مرتبط بالسابق عبر SHA-256
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الأدلة", value: stats?.total || 0, icon: Database, color: "text-primary" },
          { label: "أدلة موثقة", value: stats?.verified || 0, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "نسبة التحقق", value: stats?.total ? `${Math.round(((stats?.verified || 0) / stats.total) * 100)}%` : "0%", icon: Shield, color: "text-cyan-400" },
          { label: "أنواع الأدلة", value: Object.keys(stats?.types || {}).length, icon: FileText, color: "text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evidence Type Breakdown */}
      {stats?.types && Object.keys(stats.types).length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">توزيع أنواع الأدلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.types).map(([type, count]) => {
                const config = typeConfig[type] || typeConfig.metadata;
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{count as number}</p>
                      <p className="text-[10px] text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chain Visualization */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !evidence || evidence.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Link2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">لا توجد أدلة مسجلة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            سلسلة الأدلة ({evidence.length} كتلة)
          </h3>
          {evidence.map((entry, i) => {
            const config = typeConfig[entry.evidenceType] || typeConfig.metadata;
            const Icon = config.icon;
            const isExpanded = expandedId === entry.evidenceId;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className={`border-border hover:border-primary/30 transition-colors ${!entry.isVerified ? "border-red-500/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* Block index indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.isVerified ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            <span className="text-sm font-bold text-foreground">#{entry.blockIndex}</span>
                          </div>
                          {i < evidence.length - 1 && (
                            <div className="w-0.5 h-6 bg-border mt-1" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span className="text-sm font-semibold text-foreground">{config.label}</span>
                            <Badge variant="outline" className="text-[10px]">{entry.leakId}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.isVerified ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {entry.isVerified ? "تم التحقق" : "فشل التحقق"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {entry.capturedBy && `• ${entry.capturedBy}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setExpandedId(isExpanded ? null : entry.evidenceId)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-border space-y-2"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-2 rounded bg-black/30 border border-border">
                            <p className="text-[10px] text-muted-foreground mb-1">Content Hash (SHA-256):</p>
                            <code className="text-[10px] font-mono text-primary break-all" dir="ltr">{entry.contentHash}</code>
                          </div>
                          {entry.previousHash && (
                            <div className="p-2 rounded bg-black/30 border border-border">
                              <p className="text-[10px] text-muted-foreground mb-1">Previous Hash:</p>
                              <code className="text-[10px] font-mono text-amber-400 break-all" dir="ltr">{entry.previousHash}</code>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                            <span>Evidence ID: <code className="font-mono text-foreground">{entry.evidenceId}</code></span>
                            <span>التقاط: {new Date(entry.capturedAt).toLocaleString("ar-SA")}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
