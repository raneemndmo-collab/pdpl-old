/**
 * DarkWebMonitor — Dark web forum/marketplace monitoring
 * All stats and listings are clickable with detail modals
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  TrendingUp,
  Loader2,
  DollarSign,
  Database,
  Eye,
  Users,
  FileText,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";

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

export default function DarkWebMonitor() {
  const { data: listings, isLoading: listingsLoading } = trpc.darkweb.listings.useQuery();
  const { data: channels, isLoading: channelsLoading } = trpc.channels.list.useQuery({ platform: "darkweb" });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const darkWebListings = listings ?? [];
  const darkWebChannels = channels ?? [];
  const isLoading = listingsLoading || channelsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Globe className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">رصد الدارك ويب</h1>
              <p className="text-xs text-muted-foreground">Dark Web Monitoring</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            مراقبة منتديات بيع البيانات وأسواق البيانات المسربة عبر شبكة Tor
          </p>
        </div>
      </motion.div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "sources", label: "مصادر مراقبة", value: darkWebChannels.length, color: "text-violet-400", borderColor: "border-violet-500/20", bgColor: "bg-violet-500/5" },
          { key: "leaks", label: "تسريبات مكتشفة", value: darkWebChannels.reduce((a, c) => a + (c.leaksDetected ?? 0), 0), color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
          { key: "listings", label: "عروض بيع نشطة", value: darkWebListings.length, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
          { key: "records", label: "سجلات مكشوفة", value: darkWebListings.reduce((s, l) => s + (l.recordCount ?? 0), 0).toLocaleString(), color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
        ].map((stat, i) => (
          <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card
              className={`border ${stat.borderColor} ${stat.bgColor} cursor-pointer hover:scale-[1.02] transition-all group`}
              onClick={() => setActiveModal(stat.key)}
            >
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monitored sources — clickable */}
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
            {darkWebChannels.map((source, i) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-violet-500/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedSource(source); setActiveModal("sourceDetail"); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{source.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{source.channelId}</p>
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
                    {source.leaksDetected ?? 0} تسريب
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] ${
                    source.riskLevel === "high" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                    source.riskLevel === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                    "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
                  }`}>
                    {source.riskLevel === "high" ? "خطورة عالية" : source.riskLevel === "medium" ? "خطورة متوسطة" : "خطورة منخفضة"}
                  </span>
                </div>
                <p className="text-[9px] text-primary/50 mt-2">اضغط للتفاصيل ←</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat intelligence feed — clickable */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            آخر عروض البيع المرصودة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {darkWebListings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-secondary/20 border border-border hover:border-red-500/20 transition-colors cursor-pointer"
                onClick={() => { setSelectedListing(listing); setActiveModal("listingDetail"); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{listing.titleAr || listing.title}</h3>
                    <p className="text-xs text-muted-foreground">{listing.title}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded border ${severityColor(listing.severity)}`}>
                    {severityLabel(listing.severity)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {listing.sourceName || "مصدر غير معروف"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {listing.detectedAt ? new Date(listing.detectedAt).toLocaleDateString("ar-SA") : "—"}
                  </span>
                  {listing.price && (
                    <span className="text-red-400 font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {listing.price}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {(listing.recordCount ?? 0).toLocaleString()} سجل
                  </span>
                </div>
                <p className="text-[9px] text-primary/50 mt-2">اضغط للتفاصيل ←</p>
              </motion.div>
            ))}
            {darkWebListings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عروض مكتشفة حالياً</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ MODALS ═══ */}

      {/* Sources Modal */}
      <DetailModal open={activeModal === "sources"} onClose={() => setActiveModal(null)} title="جميع المصادر المراقبة" icon={<Globe className="w-5 h-5 text-violet-400" />}>
        <div className="space-y-3">
          {darkWebChannels.map(ch => (
            <div
              key={ch.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedSource(ch); setActiveModal("sourceDetail"); }}
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground">{ch.channelId} • {ch.leaksDetected ?? 0} تسريب</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                ch.riskLevel === "high" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                ch.riskLevel === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
              }`}>
                {ch.riskLevel === "high" ? "عالية" : ch.riskLevel === "medium" ? "متوسطة" : "منخفضة"}
              </span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Leaks Modal */}
      <DetailModal open={activeModal === "leaks"} onClose={() => setActiveModal(null)} title="التسريبات المكتشفة من الدارك ويب" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">إجمالي {darkWebChannels.reduce((a, c) => a + (c.leaksDetected ?? 0), 0)} تسريب عبر {darkWebChannels.length} مصدر</p>
          {darkWebChannels.filter(c => (c.leaksDetected ?? 0) > 0).map(ch => (
            <div key={ch.id} className="bg-secondary/30 rounded-xl p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-foreground">{ch.name}</span>
                <Badge variant="outline" className="text-[10px] mr-auto">{ch.leaksDetected ?? 0} تسريب</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{ch.channelId}</p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Listings Modal */}
      <DetailModal open={activeModal === "listings"} onClose={() => setActiveModal(null)} title="عروض البيع النشطة" icon={<DollarSign className="w-5 h-5 text-red-400" />}>
        <div className="space-y-3">
          {darkWebListings.map(listing => (
            <div
              key={listing.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedListing(listing); setActiveModal("listingDetail"); }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${severityColor(listing.severity)}`}>{severityLabel(listing.severity)}</span>
                <span className="text-sm font-medium text-foreground truncate">{listing.titleAr || listing.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{listing.sourceName}</span>
                <span>{(listing.recordCount ?? 0).toLocaleString()} سجل</span>
                {listing.price && <span className="text-red-400">{listing.price}</span>}
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Records Modal */}
      <DetailModal open={activeModal === "records"} onClose={() => setActiveModal(null)} title="تفاصيل السجلات المكشوفة" icon={<Database className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
              <p className="text-xl font-bold text-cyan-400">{darkWebListings.reduce((s, l) => s + (l.recordCount ?? 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي السجلات</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
              <p className="text-xl font-bold text-foreground">{darkWebListings.length > 0 ? Math.round(darkWebListings.reduce((s, l) => s + (l.recordCount ?? 0), 0) / darkWebListings.length).toLocaleString() : 0}</p>
              <p className="text-[10px] text-muted-foreground">متوسط لكل عرض</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
              <p className="text-xl font-bold text-red-400">{Math.max(...darkWebListings.map(l => l.recordCount ?? 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">أكبر عرض</p>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-foreground">العروض مرتبة حسب عدد السجلات</h4>
          {[...darkWebListings].sort((a, b) => (b.recordCount ?? 0) - (a.recordCount ?? 0)).map(listing => (
            <div key={listing.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
              <span className={`text-[10px] px-2 py-0.5 rounded border ${severityColor(listing.severity)}`}>{severityLabel(listing.severity)}</span>
              <span className="text-sm text-foreground truncate flex-1">{listing.titleAr || listing.title}</span>
              <span className="text-xs font-bold text-foreground">{(listing.recordCount ?? 0).toLocaleString()} سجل</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Source Detail Modal */}
      <DetailModal
        open={activeModal === "sourceDetail" && !!selectedSource}
        onClose={() => { setActiveModal(null); setSelectedSource(null); }}
        title={selectedSource?.name ?? "تفاصيل المصدر"}
        icon={<Globe className="w-5 h-5 text-violet-400" />}
      >
        {selectedSource && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Globe className="w-7 h-7 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{selectedSource.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedSource.channelId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedSource.status === "active" ? "bg-emerald-500" :
                    selectedSource.status === "flagged" ? "bg-red-500" : "bg-yellow-500"
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {selectedSource.status === "active" ? "نشط" : selectedSource.status === "flagged" ? "مُعلَّم" : "متوقف"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
                <p className="text-xl font-bold text-amber-400">{selectedSource.leaksDetected ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">تسريبات مكتشفة</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-sm font-bold text-foreground">
                  {selectedSource.lastActivity ? new Date(selectedSource.lastActivity).toLocaleDateString("ar-SA") : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">آخر نشاط</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-sm font-bold text-foreground">{(selectedSource.subscribers ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">أعضاء</p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">وصف المصدر</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {selectedSource.description || "مصدر على الدارك ويب يتم مراقبته لنشاط مشبوه يتعلق ببيع أو مشاركة بيانات شخصية سعودية. يتم فحص المنشورات والعروض بشكل دوري."}
              </p>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Listing Detail Modal */}
      <DetailModal
        open={activeModal === "listingDetail" && !!selectedListing}
        onClose={() => { setActiveModal(null); setSelectedListing(null); }}
        title={selectedListing?.titleAr || selectedListing?.title || "تفاصيل العرض"}
        icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الخطورة</p>
                <p className={`text-sm font-bold mt-1 ${severityColor(selectedListing.severity).split(" ")[0]}`}>{severityLabel(selectedListing.severity)}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">السجلات</p>
                <p className="text-sm font-bold text-foreground mt-1">{(selectedListing.recordCount ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">السعر</p>
                <p className="text-sm font-bold text-red-400 mt-1">{selectedListing.price || "غير محدد"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">المصدر</p>
                <p className="text-sm font-bold text-foreground mt-1">{selectedListing.sourceName || "غير معروف"}</p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">تفاصيل العرض</h4>
              <p className="text-sm text-foreground font-semibold mb-1">{selectedListing.title}</p>
              {selectedListing.titleAr && <p className="text-sm text-foreground mb-2">{selectedListing.titleAr}</p>}
              <p className="text-xs text-muted-foreground">
                تاريخ الاكتشاف: {selectedListing.detectedAt ? new Date(selectedListing.detectedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "غير محدد"}
              </p>
            </div>
            {selectedListing.descriptionAr && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">الوصف</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedListing.descriptionAr}</p>
              </div>
            )}
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
              <h4 className="text-xs font-semibold text-red-400 mb-2">تحذير أمني</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                هذا العرض تم رصده على الدارك ويب ويحتوي على بيانات شخصية مسربة. يجب اتخاذ إجراءات فورية للتحقق من صحة البيانات وإبلاغ الجهات المختصة.
              </p>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
