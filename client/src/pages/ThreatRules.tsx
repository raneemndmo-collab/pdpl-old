/**
 * ThreatRules — Threat Hunting Rules Engine
 * 25 Saudi-specific YARA-like rules for threat detection
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crosshair,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Loader2,
  Zap,
  Database,
  CreditCard,
  Lock,
  Building2,
  Heart,
  GraduationCap,
  Radio,
  Landmark,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  data_leak: { label: "تسريب بيانات", icon: Database, color: "text-red-400" },
  credentials: { label: "بيانات اعتماد", icon: Lock, color: "text-amber-400" },
  sale_ad: { label: "إعلان بيع", icon: CreditCard, color: "text-violet-400" },
  db_dump: { label: "تفريغ قاعدة بيانات", icon: Server, color: "text-cyan-400" },
  financial: { label: "مالي", icon: CreditCard, color: "text-emerald-400" },
  health: { label: "صحي", icon: Heart, color: "text-pink-400" },
  government: { label: "حكومي", icon: Landmark, color: "text-blue-400" },
  telecom: { label: "اتصالات", icon: Radio, color: "text-indigo-400" },
  education: { label: "تعليمي", icon: GraduationCap, color: "text-purple-400" },
  infrastructure: { label: "بنية تحتية", icon: Building2, color: "text-orange-400" },
};

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export default function ThreatRules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: rules, isLoading } = trpc.threatRules.list.useQuery();

  const filteredRules = (rules || []).filter((rule) => {
    const matchesSearch = !searchTerm || 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.nameAr.includes(searchTerm);
    const matchesCategory = filterCategory === "all" || rule.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: rules?.length || 0,
    enabled: rules?.filter(r => r.isEnabled).length || 0,
    critical: rules?.filter(r => r.severity === "critical").length || 0,
    totalMatches: rules?.reduce((sum, r) => sum + (r.matchCount || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-red-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">قواعد صيد التهديدات</h1>
              <p className="text-xs text-muted-foreground">Threat Hunting Rules Engine</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            25 قاعدة YARA مخصصة للسياق السعودي — كشف تلقائي للتسريبات وبيانات الاعتماد وإعلانات البيع
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي القواعد", value: stats.total, icon: Crosshair, color: "text-primary" },
          { label: "قواعد نشطة", value: stats.enabled, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "قواعد حرجة", value: stats.critical, icon: AlertTriangle, color: "text-red-400" },
          { label: "إجمالي التطابقات", value: stats.totalMatches.toLocaleString(), icon: Zap, color: "text-amber-400" },
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
            placeholder="بحث في القواعد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterCategory === "all" ? "default" : "outline"}
            onClick={() => setFilterCategory("all")}
            className="text-xs"
          >
            الكل
          </Button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <Button
              key={key}
              size="sm"
              variant={filterCategory === key ? "default" : "outline"}
              onClick={() => setFilterCategory(key)}
              className="text-xs gap-1"
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRules.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Crosshair className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">لا توجد قواعد مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRules.map((rule, i) => {
            const catConfig = categoryConfig[rule.category] || categoryConfig.data_leak;
            const CatIcon = catConfig.icon;
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border-border hover:border-primary/30 transition-colors ${!rule.isEnabled ? "opacity-50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                          <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{rule.nameAr}</h3>
                          <p className="text-[10px] text-muted-foreground">{rule.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${severityColors[rule.severity]}`}>
                          {rule.severity === "critical" ? "حرج" : rule.severity === "high" ? "عالي" : rule.severity === "medium" ? "متوسط" : "منخفض"}
                        </Badge>
                        {rule.isEnabled ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {rule.descriptionAr && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{rule.descriptionAr}</p>
                    )}

                    {/* Patterns */}
                    <div className="space-y-1.5 mb-3">
                      <p className="text-[10px] text-muted-foreground font-medium">أنماط الكشف:</p>
                      <div className="flex flex-wrap gap-1">
                        {(rule.patterns as string[] || []).slice(0, 4).map((pattern, pi) => (
                          <code key={pi} className="text-[10px] font-mono bg-black/30 text-primary/80 px-1.5 py-0.5 rounded border border-border" dir="ltr">
                            {pattern.length > 30 ? pattern.slice(0, 30) + "..." : pattern}
                          </code>
                        ))}
                        {(rule.patterns as string[] || []).length > 4 && (
                          <span className="text-[10px] text-muted-foreground">+{(rule.patterns as string[]).length - 4} أنماط أخرى</span>
                        )}
                      </div>
                    </div>

                    {/* Keywords */}
                    {rule.keywords && (rule.keywords as string[]).length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        <p className="text-[10px] text-muted-foreground font-medium">كلمات مفتاحية:</p>
                        <div className="flex flex-wrap gap-1">
                          {(rule.keywords as string[]).slice(0, 6).map((kw, ki) => (
                            <Badge key={ki} variant="outline" className="text-[10px] bg-secondary/50">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-secondary/30">
                          {catConfig.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {rule.matchCount || 0} تطابق
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{rule.ruleId}</span>
                    </div>
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
