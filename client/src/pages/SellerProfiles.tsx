/**
 * SellerProfiles — Track and score data sellers across platforms
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي البائعين", value: stats.total, icon: UserX, color: "text-primary" },
          { label: "بائعون حرجون", value: stats.critical, icon: AlertTriangle, color: "text-red-400" },
          { label: "بائعون نشطون", value: stats.active, icon: Activity, color: "text-emerald-400" },
          { label: "تسريبات مرتبطة", value: stats.totalLeaks, icon: TrendingUp, color: "text-amber-400" },
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

      {/* Sellers List */}
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
              <Card className="border-border hover:border-primary/30 transition-colors">
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

                  {/* Aliases */}
                  {seller.aliases && (seller.aliases as string[]).length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground mb-1">أسماء مستعارة:</p>
                      <div className="flex flex-wrap gap-1">
                        {(seller.aliases as string[]).map((alias, ai) => (
                          <Badge key={ai} variant="outline" className="text-[10px] bg-secondary/30">{alias}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="mb-3">
                    <p className="text-[10px] text-muted-foreground mb-1">المنصات:</p>
                    <div className="flex gap-2">
                      {(seller.platforms as string[]).map((platform) => {
                        const PIcon = platformIcons[platform] || Globe;
                        return (
                          <div key={platform} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <PIcon className="w-3 h-3" />
                            {platform}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span>{seller.totalLeaks || 0} تسريب</span>
                      <span>{(seller.totalRecords || 0).toLocaleString()} سجل</span>
                    </div>
                    {seller.lastActivity && (
                      <span className="text-[10px] text-muted-foreground">
                        آخر نشاط: {new Date(seller.lastActivity).toLocaleDateString("ar-SA")}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {seller.notes && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-secondary/20 border border-border">
                      {seller.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
