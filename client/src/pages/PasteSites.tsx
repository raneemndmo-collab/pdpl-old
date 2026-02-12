/**
 * PasteSites — Paste site monitoring view
 * Dark Observatory Theme — Uses tRPC API
 */
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  Eye,
  Loader2,
  Info,
  Server,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

const statusStyle = (s: string) => {
  switch (s) {
    case "flagged": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "analyzing": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "documented": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
};

const statusText = (s: string) => {
  switch (s) {
    case "flagged": return "مُعلَّم";
    case "analyzing": return "قيد التحليل";
    case "documented": return "موثّق";
    default: return "تم التوثيق";
  }
};

export default function PasteSites() {
  const { data: pastes, isLoading: pastesLoading } = trpc.pastes.list.useQuery();
  const { data: channels, isLoading: channelsLoading } = trpc.channels.list.useQuery({ platform: "paste" });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [drillLeak, setDrillLeak] = useState<any>(null);

  const pasteEntries = pastes ?? [];
  const pasteChannels = channels ?? [];
  const isLoading = pastesLoading || channelsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { id: "monitored-sites", label: "مواقع مراقبة", value: pasteChannels.length, color: "text-amber-400", icon: Server, description: "إجمالي عدد مواقع اللصق التي تتم مراقبتها حاليًا بحثًا عن تسريبات محتملة." },
    { id: "pastes-found", label: "لصقات مرصودة", value: pasteEntries.length, color: "text-cyan-400", icon: ScanLine, description: "إجمالي عدد اللصقات (Pastes) التي تم رصدها عبر جميع المواقع المراقبة." },
    { id: "analyzing", label: "قيد التحليل", value: pasteEntries.filter((p) => p.status === "analyzing").length, color: "text-violet-400", icon: Loader2, description: "عدد اللصقات التي يتم تحليلها حاليًا لتحديد ما إذا كانت تحتوي على بيانات حساسة." },
    { id: "flagged", label: "موثّقة", value: pasteEntries.filter((p) => p.status === "flagged").length, color: "text-red-400", icon: ShieldAlert, description: "عدد اللصقات التي تم تحديدها على أنها تحتوي على بيانات شخصية مسربة وتم توثيقها." },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-amber-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">رصد مواقع اللصق</h1>
              <p className="text-xs text-muted-foreground">Paste Sites Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            مراقبة Pastebin وبدائله حيث تُنشر كثير من التسريبات الأولية
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => setActiveModal(`stat-${stat.id}`)}>
              <Card className="border-border group-hover:border-primary/30 transition-colors">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monitored sites */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pasteChannels.map((source, i) => (
          <motion.div key={source.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => setActiveModal(`channel-${source.id}`)}>
              <Card className="border-border group-hover:border-amber-500/30 transition-colors h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-foreground">{source.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${source.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="text-[10px] text-muted-foreground">{source.status === "active" ? "نشط" : "متوقف"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{source.leaksDetected ?? 0} تسريب مكتشف</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${
                        source.riskLevel === "high" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                        source.riskLevel === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                        "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      }`}>
                        {source.riskLevel === "high" ? "عالي" : source.riskLevel === "medium" ? "متوسط" : "منخفض"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity self-center">اضغط للتفاصيل ←</p>
                </CardContent>
              </Card>
            </div>
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
            {pasteEntries.map((paste, i) => (
              <motion.div
                key={paste.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-secondary/20 border border-border hover:border-amber-500/20 transition-colors group cursor-pointer"
                onClick={() => setActiveModal(`paste-${paste.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-mono font-semibold text-foreground">{paste.filename}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {paste.sourceName}
                      </span>
                      {paste.fileSize && <span>{paste.fileSize}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {paste.detectedAt ? new Date(paste.detectedAt).toLocaleDateString("ar-SA") : "—"}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded border ${statusStyle(paste.status)}`}>
                    {statusText(paste.status)}
                  </span>
                </div>

                {/* PII types found */}
                {paste.piiTypes && (paste.piiTypes as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(paste.piiTypes as string[]).map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px] bg-red-500/5 border-red-500/20 text-red-400">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Preview */}
                {paste.preview && (
                  <div className="p-2 rounded bg-black/30 border border-border">
                    <code className="text-[11px] text-muted-foreground font-mono break-all">{paste.preview}</code>
                  </div>
                )}
                <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">اضغط للتفاصيل ←</p>
              </motion.div>
            ))}
            {pasteEntries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد لصقات مكتشفة حالياً</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {stats.map(stat => (
        <DetailModal
          key={`modal-stat-${stat.id}`}
          open={activeModal === `stat-${stat.id}`}
          onClose={() => setActiveModal(null)}
          title={stat.label}
          icon={stat.icon && <stat.icon className={`w-6 h-6 ${stat.color}`} />}
        >
          <div className="p-4 text-center">
            <p className={`text-5xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-4">{stat.description}</p>
          </div>
        </DetailModal>
      ))}

      {pasteChannels.map(channel => (
        <DetailModal
          key={`modal-channel-${channel.id}`}
          open={activeModal === `channel-${channel.id}`}
          onClose={() => setActiveModal(null)}
          title={channel.name}
          icon={<FileText className="w-6 h-6 text-amber-400" />}
        >
          <div className="p-4 space-y-4 text-sm">
            <p>تفاصيل الموقع المُرَاقب <span className="font-mono">{channel.name}</span>.</p>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">الحالة</p>
                    <p className="font-bold text-lg">{channel.status === "active" ? "نشط" : "متوقف"}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">مستوى التأثير</p>
                    <p className="font-bold text-lg">{channel.riskLevel === "high" ? "عالي" : channel.riskLevel === "medium" ? "متوسط" : "منخفض"}</p>
                </div>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">التسريبات المكتشفة</p>
                <p className="font-bold text-2xl text-cyan-400">{channel.leaksDetected ?? 0}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast.info("زيارة الموقع", { description: "هذه الميزة قيد التطوير" })}>
              زيارة الموقع <ExternalLink className="w-3 h-3 mr-2" />
            </Button>
          </div>
        </DetailModal>
      ))}

      {pasteEntries.map(paste => (
        <DetailModal
          key={`modal-paste-${paste.id}`}
          open={activeModal === `paste-${paste.id}`}
          onClose={() => setActiveModal(null)}
          title="تفاصيل اللصقة"
          icon={<FileText className="w-6 h-6 text-cyan-400" />}
          maxWidth="max-w-2xl"
        >
          <div className="p-4 space-y-3 text-sm">
            <h3 className="font-mono text-lg text-primary">{paste.filename}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
                <span className="flex items-center gap-1.5"><Server className="w-3 h-3" /> {paste.sourceName}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(paste.detectedAt).toLocaleString("ar-SA")}</span>
                {paste.fileSize && <span className="flex items-center gap-1.5"><Info className="w-3 h-3" /> {paste.fileSize}</span>}
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">الحالة</span>
                <span className={`font-semibold ${statusStyle(paste.status)}`}>{statusText(paste.status)}</span>
            </div>
            {paste.piiTypes && (paste.piiTypes as string[]).length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">البيانات الحساسة المكتشفة:</h4>
                    <div className="flex flex-wrap gap-2">
                        {(paste.piiTypes as string[]).map(type => (
                            <Badge key={type} variant="destructive" className="text-xs">{type}</Badge>
                        ))}
                    </div>
                </div>
            )}
            {paste.preview && (
                <div>
                    <h4 className="font-semibold mb-2">معاينة المحتوى:</h4>
                    <div className="p-3 rounded bg-black/50 border border-border max-h-48 overflow-y-auto">
                        <code className="text-xs text-muted-foreground font-mono break-all whitespace-pre-wrap">{paste.preview}</code>
                    </div>
                </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => toast.info("فتح المصدر", { description: "هذه الميزة قيد التطوير" })}>
              فتح المصدر الأصلي <ExternalLink className="w-3 h-3 mr-2" />
            </Button>
          </div>
        </DetailModal>
      ))}

      {/* Leak Detail Drilldown */}
      <LeakDetailDrilldown
        leak={drillLeak}
        open={!!drillLeak}
        onClose={() => setDrillLeak(null)}
        showBackButton={true}
        onBack={() => setDrillLeak(null)}
      />
    </div>
  );
}
