/**
 * EvidenceChain — SHA-256 blockchain-like evidence integrity verification
 * All stats and evidence blocks are clickable with detail modals
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
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DetailModal } from "@/components/DetailModal";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  text: { label: "نص", icon: FileText, color: "text-cyan-400" },
  screenshot: { label: "لقطة شاشة", icon: Image, color: "text-violet-400" },
  file: { label: "ملف", icon: Database, color: "text-emerald-400" },
  metadata: { label: "بيانات وصفية", icon: Hash, color: "text-amber-400" },
};

export default function EvidenceChain() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [drillLeakId, setDrillLeakId] = useState<string | null>(null);

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

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "total", label: "إجمالي الأدلة", value: stats?.total || 0, icon: Database, color: "text-primary", borderColor: "border-primary/20", bgColor: "bg-primary/5" },
          { key: "verified", label: "أدلة موثقة", value: stats?.verified || 0, icon: CheckCircle2, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "verifyRate", label: "نسبة التحقق", value: stats?.total ? `${Math.round(((stats?.verified || 0) / stats.total) * 100)}%` : "0%", icon: Shield, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "types", label: "أنواع الأدلة", value: Object.keys(stats?.types || {}).length, icon: FileText, color: "text-violet-400", borderColor: "border-violet-500/20", bgColor: "bg-violet-500/5" },
        ].map((stat, i) => (
          <motion.div key={stat.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card
              className={`border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:scale-[1.02] transition-all group`}
              onClick={() => setActiveModal(stat.key)}
            >
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
                <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Evidence Type Breakdown — clickable */}
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
                  <div
                    key={type}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setActiveModal(`type_${type}`)}
                  >
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

      {/* Chain Visualization — clickable blocks */}
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
                <Card
                  className={`border-border hover:border-primary/30 transition-colors cursor-pointer ${!entry.isVerified ? "border-red-500/30" : ""}`}
                  onClick={() => { setSelectedEvidence(entry); setActiveModal("evidenceDetail"); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
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
                          {(entry as any).metadata?.description && (
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{(entry as any).metadata.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : entry.evidenceId); }}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-border space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-2 rounded bg-secondary/50 border border-border">
                            <p className="text-[10px] text-muted-foreground mb-1">Content Hash (SHA-256):</p>
                            <code className="text-[10px] font-mono text-primary break-all" dir="ltr">{entry.contentHash}</code>
                          </div>
                          {entry.previousHash && (
                            <div className="p-2 rounded bg-secondary/50 border border-border">
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

      {/* ═══ MODALS ═══ */}

      {/* Total Evidence Modal */}
      <DetailModal open={activeModal === "total"} onClose={() => setActiveModal(null)} title="إجمالي الأدلة الرقمية" icon={<Database className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-center">
            <p className="text-3xl font-bold text-primary">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">دليل رقمي مسجل</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats?.types || {}).map(([type, count]) => {
              const config = typeConfig[type] || typeConfig.metadata;
              const Icon = config.icon;
              return (
                <div key={type} className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <div>
                    <p className="text-sm font-bold text-foreground">{count as number}</p>
                    <p className="text-[10px] text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            الأدلة الرقمية تشمل لقطات شاشة، ملفات نصية، بيانات وصفية، وملفات مرفقة. كل دليل مرتبط بتسريب محدد ومحمي بتشفير SHA-256.
          </p>
        </div>
      </DetailModal>

      {/* Verified Evidence Modal */}
      <DetailModal open={activeModal === "verified"} onClose={() => setActiveModal(null)} title="الأدلة الموثقة" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats?.verified || 0}</p>
              <p className="text-[10px] text-muted-foreground">موثقة</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-400">{(stats?.total || 0) - (stats?.verified || 0)}</p>
              <p className="text-[10px] text-muted-foreground">غير موثقة</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            يتم التحقق من سلامة كل دليل عبر مقارنة تجزئة SHA-256 المخزنة مع التجزئة المحسوبة. الأدلة الموثقة تؤكد عدم العبث بالبيانات منذ لحظة التقاطها.
          </p>
        </div>
      </DetailModal>

      {/* Verify Rate Modal */}
      <DetailModal open={activeModal === "verifyRate"} onClose={() => setActiveModal(null)} title="نسبة التحقق من الأدلة" icon={<Shield className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-4">
          <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20 text-center">
            <p className="text-3xl font-bold text-cyan-400">
              {stats?.total ? `${Math.round(((stats?.verified || 0) / stats.total) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-muted-foreground">نسبة التحقق الكلية</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">آلية التحقق</h4>
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> حساب تجزئة SHA-256 للمحتوى الأصلي</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> ربط كل كتلة بالكتلة السابقة عبر Previous Hash</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> التحقق الدوري من سلامة السلسلة</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> تسجيل الطابع الزمني وهوية المُلتقط</li>
            </ul>
          </div>
        </div>
      </DetailModal>

      {/* Evidence Types Modal */}
      <DetailModal open={activeModal === "types"} onClose={() => setActiveModal(null)} title="أنواع الأدلة" icon={<FileText className="w-5 h-5 text-violet-400" />}>
        <div className="space-y-3">
          {Object.entries(typeConfig).map(([type, config]) => {
            const Icon = config.icon;
            const count = (stats?.types as any)?.[type] || 0;
            return (
              <div key={type} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-secondary`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{count} دليل</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {type === "text" && "أدلة نصية تتضمن محتوى الرسائل والمنشورات المرتبطة بالتسريب"}
                  {type === "screenshot" && "لقطات شاشة توثق عروض البيع والمحادثات على المنصات"}
                  {type === "file" && "ملفات مرفقة تحتوي على عينات من البيانات المسربة"}
                  {type === "metadata" && "بيانات وصفية تشمل معلومات المصدر والتوقيت والموقع"}
                </p>
              </div>
            );
          })}
        </div>
      </DetailModal>

      {/* Evidence Type Filter Modals */}
      {Object.keys(typeConfig).map(type => {
        const config = typeConfig[type];
        const Icon = config.icon;
        const filteredEvidence = evidence?.filter(e => e.evidenceType === type) || [];
        return (
          <DetailModal
            key={type}
            open={activeModal === `type_${type}`}
            onClose={() => setActiveModal(null)}
            title={`أدلة من نوع: ${config.label}`}
            icon={<Icon className={`w-5 h-5 ${config.color}`} />}
          >
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{filteredEvidence.length}</p>
                <p className="text-xs text-muted-foreground">دليل من نوع {config.label}</p>
              </div>
              {filteredEvidence.slice(0, 15).map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => { setSelectedEvidence(entry); setActiveModal("evidenceDetail"); }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary">#{entry.blockIndex}</span>
                    <Badge variant="outline" className="text-[10px]">{entry.leakId}</Badge>
                    {entry.isVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(entry.capturedAt).toLocaleString("ar-SA")}</p>
                </div>
              ))}
            </div>
          </DetailModal>
        );
      })}

      {/* Evidence Detail Modal */}
      <DetailModal
        open={activeModal === "evidenceDetail" && !!selectedEvidence}
        onClose={() => { setActiveModal(null); setSelectedEvidence(null); }}
        title={`دليل رقمي #${selectedEvidence?.blockIndex || ""}`}
        icon={<Link2 className="w-5 h-5 text-violet-400" />}
        maxWidth="max-w-2xl"
      >
        {selectedEvidence && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الكتلة</p>
                <p className="text-lg font-bold text-foreground">#{selectedEvidence.blockIndex}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">النوع</p>
                <p className="text-sm font-bold text-foreground">{(typeConfig[selectedEvidence.evidenceType] || typeConfig.metadata).label}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التحقق</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {selectedEvidence.isVerified ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400">موثق</span></>
                  ) : (
                    <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-red-400">غير موثق</span></>
                  )}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التسريب</p>
                <p className="text-sm font-bold text-primary font-mono">{selectedEvidence.leakId}</p>
              </div>
            </div>

            {(selectedEvidence as any).metadata?.description && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">الوصف</h4>
                <p className="text-sm text-foreground leading-relaxed">{(selectedEvidence as any).metadata.description}</p>
              </div>
            )}

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">التشفير والتحقق</h4>
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">Content Hash (SHA-256):</p>
                <code className="text-[10px] font-mono text-primary break-all" dir="ltr">{selectedEvidence.contentHash}</code>
              </div>
              {selectedEvidence.previousHash && (
                <div className="p-2 rounded bg-secondary/50 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Previous Hash:</p>
                  <code className="text-[10px] font-mono text-amber-400 break-all" dir="ltr">{selectedEvidence.previousHash}</code>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> المُلتقط</p>
                <p className="text-sm text-foreground mt-1">{selectedEvidence.capturedBy || "—"}</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> تاريخ الالتقاط</p>
                <p className="text-sm text-foreground mt-1">{new Date(selectedEvidence.capturedAt).toLocaleString("ar-SA")}</p>
              </div>
            </div>

            {(selectedEvidence as any).metadata && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">البيانات الوصفية</h4>
                <div className="space-y-2">
                  {Object.entries((selectedEvidence as any).metadata).filter(([k]) => k !== "description").map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground font-mono text-[10px]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deep-drill: View full leak details */}
            <button
              onClick={() => setDrillLeakId(selectedEvidence.leakId)}
              className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-center"
            >
              <span className="text-xs text-primary font-medium">عرض تفاصيل التسريب الكاملة ({selectedEvidence.leakId}) ←</span>
            </button>
          </div>
        )}
      </DetailModal>

      {/* Leak Detail Drilldown from Evidence */}
      <LeakDetailDrilldown
        leak={drillLeakId ? { leakId: drillLeakId } : null}
        open={!!drillLeakId}
        onClose={() => setDrillLeakId(null)}
        showBackButton={true}
        onBack={() => setDrillLeakId(null)}
      />
    </div>
  );
}
