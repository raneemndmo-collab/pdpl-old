/**
 * SellerProfiles — Track and score data sellers across platforms
 * All stats and seller cards are clickable with detail modals
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserX,
  AlertTriangle,
  TrendingUp,
  Search,
  Loader2,
  Shield,
  Eye,
  Globe,
  Send,
  FileText,
  Activity,
  Calendar,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { DetailModal } from "@/components/DetailModal";

const riskColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const riskLabels: Record<string, string> = {
  critical: "حرج",
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
};

const platformIcons: Record<string, React.ElementType> = {
  telegram: Send,
  darkweb: Globe,
  paste: FileText,
};

export default function SellerProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);

  const { data: sellers, isLoading } = trpc.sellers.list.useQuery(
    filterRisk !== "all" ? { riskLevel: filterRisk } : undefined
  );

  const filteredSellers = (sellers || []).filter((s) => {
    if (!searchTerm) return true;
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.aliases as string[] || []).some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const stats = {
    total: sellers?.length || 0,
    critical: sellers?.filter(s => s.riskLevel === "critical").length || 0,
    active: sellers?.filter(s => s.isActive).length || 0,
    totalLeaks: sellers?.reduce((sum, s) => sum + (s.totalLeaks || 0), 0) || 0,
  };

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
              <UserX className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ملفات البائعين</h1>
              <p className="text-xs text-muted-foreground">Seller Profiles & Risk Scoring</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            تتبع بائعي البيانات عبر المنصات — تصنيف المخاطر وربط الأسماء المستعارة
          </p>
        </div>
      </motion.div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "total", label: "إجمالي البائعين", value: stats.total, icon: UserX, color: "text-primary", borderColor: "border-primary/20", bgColor: "bg-primary/5" },
          { key: "critical", label: "بائعون حرجون", value: stats.critical, icon: AlertTriangle, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
          { key: "active", label: "بائعون نشطون", value: stats.active, icon: Activity, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "totalLeaks", label: "تسريبات مرتبطة", value: stats.totalLeaks, icon: TrendingUp, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الاسم المستعار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "critical", "high", "medium", "low"].map((level) => (
            <Button
              key={level}
              size="sm"
              variant={filterRisk === level ? "default" : "outline"}
              onClick={() => setFilterRisk(level)}
              className="text-xs"
            >
              {level === "all" ? "الكل" : riskLabels[level]}
            </Button>
          ))}
        </div>
      </div>

      {/* Sellers List — clickable */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredSellers.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <UserX className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">لا يوجد بائعون مطابقون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSellers.map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="border-border hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedSeller(seller); setActiveModal("sellerDetail"); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        seller.riskLevel === "critical" ? "bg-red-500/20" :
                        seller.riskLevel === "high" ? "bg-amber-500/20" :
                        "bg-secondary"
                      }`}>
                        <UserX className={`w-5 h-5 ${
                          seller.riskLevel === "critical" ? "text-red-400" :
                          seller.riskLevel === "high" ? "text-amber-400" :
                          "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{seller.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono">{seller.sellerId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${riskColors[seller.riskLevel]}`}>
                        {riskLabels[seller.riskLevel]}
                      </Badge>
                      {seller.isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Risk Score Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">درجة الخطورة</span>
                      <span className="text-xs font-bold text-foreground">{seller.riskScore}/100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${seller.riskScore}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          (seller.riskScore || 0) >= 80 ? "bg-red-500" :
                          (seller.riskScore || 0) >= 60 ? "bg-amber-500" :
                          (seller.riskScore || 0) >= 40 ? "bg-yellow-500" :
                          "bg-emerald-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span>{seller.totalLeaks || 0} تسريب</span>
                      <span>{(seller.totalRecords || 0).toLocaleString()} سجل</span>
                    </div>
                    <span className="text-[9px] text-primary/50">اضغط للتفاصيل ←</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Total Sellers Modal */}
      <DetailModal open={activeModal === "total"} onClose={() => setActiveModal(null)} title="إجمالي البائعين" icon={<UserX className="w-5 h-5 text-primary" />}>
        <div className="space-y-3">
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">بائع مرصود</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["critical", "high", "medium", "low"].map(level => (
              <div key={level} className={`rounded-xl p-3 border text-center ${riskColors[level]}`}>
                <p className="text-xl font-bold">{sellers?.filter(s => s.riskLevel === level).length || 0}</p>
                <p className="text-[10px]">{riskLabels[level]}</p>
              </div>
            ))}
          </div>
        </div>
      </DetailModal>

      {/* Critical Sellers Modal */}
      <DetailModal open={activeModal === "critical"} onClose={() => setActiveModal(null)} title="البائعون الحرجون" icon={<AlertTriangle className="w-5 h-5 text-red-400" />}>
        <div className="space-y-3">
          {sellers?.filter(s => s.riskLevel === "critical").map(seller => (
            <div
              key={seller.id}
              className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors"
              onClick={() => { setSelectedSeller(seller); setActiveModal("sellerDetail"); }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{seller.name}</span>
                <span className="text-sm font-bold text-red-400">{seller.riskScore}/100</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{seller.totalLeaks} تسريب • {(seller.totalRecords || 0).toLocaleString()} سجل</p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Active Sellers Modal */}
      <DetailModal open={activeModal === "active"} onClose={() => setActiveModal(null)} title="البائعون النشطون" icon={<Activity className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            <p className="text-xs text-muted-foreground">بائع نشط حالياً</p>
          </div>
          {sellers?.filter(s => s.isActive).map(seller => (
            <div
              key={seller.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => { setSelectedSeller(seller); setActiveModal("sellerDetail"); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-foreground">{seller.name}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${riskColors[seller.riskLevel]}`}>{riskLabels[seller.riskLevel]}</Badge>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Total Leaks Modal */}
      <DetailModal open={activeModal === "totalLeaks"} onClose={() => setActiveModal(null)} title="التسريبات المرتبطة بالبائعين" icon={<TrendingUp className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.totalLeaks}</p>
            <p className="text-xs text-muted-foreground">تسريب مرتبط</p>
          </div>
          {sellers?.sort((a, b) => (b.totalLeaks || 0) - (a.totalLeaks || 0)).slice(0, 10).map(seller => (
            <div key={seller.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{seller.name}</p>
                <p className="text-[10px] text-muted-foreground">{(seller.totalRecords || 0).toLocaleString()} سجل</p>
              </div>
              <span className="text-lg font-bold text-amber-400">{seller.totalLeaks || 0}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Seller Detail Modal */}
      <DetailModal
        open={activeModal === "sellerDetail" && !!selectedSeller}
        onClose={() => { setActiveModal(null); setSelectedSeller(null); }}
        title={selectedSeller?.name || "تفاصيل البائع"}
        icon={<UserX className="w-5 h-5 text-amber-400" />}
        maxWidth="max-w-2xl"
      >
        {selectedSeller && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedSeller.riskLevel === "critical" ? "bg-red-500/20" :
                selectedSeller.riskLevel === "high" ? "bg-amber-500/20" :
                "bg-secondary"
              }`}>
                <UserX className={`w-7 h-7 ${
                  selectedSeller.riskLevel === "critical" ? "text-red-400" :
                  selectedSeller.riskLevel === "high" ? "text-amber-400" :
                  "text-muted-foreground"
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedSeller.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedSeller.sellerId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[10px] ${riskColors[selectedSeller.riskLevel]}`}>
                    {riskLabels[selectedSeller.riskLevel]}
                  </Badge>
                  {selectedSeller.isActive && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      نشط
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">درجة الخطورة</p>
                <p className={`text-xl font-bold mt-1 ${
                  (selectedSeller.riskScore || 0) >= 80 ? "text-red-400" :
                  (selectedSeller.riskScore || 0) >= 60 ? "text-amber-400" :
                  "text-emerald-400"
                }`}>{selectedSeller.riskScore}/100</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التسريبات</p>
                <p className="text-xl font-bold text-foreground mt-1">{selectedSeller.totalLeaks || 0}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">السجلات</p>
                <p className="text-lg font-bold text-foreground mt-1">{(selectedSeller.totalRecords || 0).toLocaleString()}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">آخر نشاط</p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {selectedSeller.lastActivity ? new Date(selectedSeller.lastActivity).toLocaleDateString("ar-SA") : "—"}
                </p>
              </div>
            </div>

            {/* Aliases */}
            {selectedSeller.aliases && (selectedSeller.aliases as string[]).length > 0 && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">الأسماء المستعارة</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedSeller.aliases as string[]).map((alias: string, ai: number) => (
                    <Badge key={ai} variant="outline" className="text-xs">{alias}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">المنصات النشطة</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedSeller.platforms as string[]).map((platform: string) => {
                  const PIcon = platformIcons[platform] || Globe;
                  return (
                    <div key={platform} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground">
                      <PIcon className="w-4 h-4 text-primary" />
                      {platform === "telegram" ? "تليجرام" : platform === "darkweb" ? "الدارك ويب" : platform}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {selectedSeller.notes && (
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ملاحظات</h4>
                <p className="text-sm text-foreground leading-relaxed">{selectedSeller.notes}</p>
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
