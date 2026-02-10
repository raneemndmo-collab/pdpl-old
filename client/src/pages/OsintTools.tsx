/**
 * OsintTools — Google Dorks, Shodan queries, recon plans for Saudi data
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  Search,
  Globe,
  Server,
  Terminal,
  Copy,
  Loader2,
  ExternalLink,
  Filter,
  Eye,
  Database,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  google_dork: { label: "Google Dork", icon: Search, color: "text-blue-400" },
  shodan: { label: "Shodan", icon: Server, color: "text-red-400" },
  recon: { label: "Recon", icon: Radar, color: "text-emerald-400" },
  spiderfoot: { label: "SpiderFoot", icon: Globe, color: "text-violet-400" },
};

export default function OsintTools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("all");

  const { data: queries, isLoading } = trpc.osint.list.useQuery(
    activeType !== "all" ? { queryType: activeType } : undefined
  );

  const filteredQueries = (queries || []).filter((q) => {
    if (!searchTerm) return true;
    return q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.nameAr.includes(searchTerm) ||
      q.query.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: queries?.length || 0,
    google: queries?.filter(q => q.queryType === "google_dork").length || 0,
    shodan: queries?.filter(q => q.queryType === "shodan").length || 0,
    recon: queries?.filter(q => q.queryType === "recon").length || 0,
  };

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    toast.success("تم نسخ الاستعلام");
  };

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
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Radar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">أدوات OSINT</h1>
              <p className="text-xs text-muted-foreground">Open Source Intelligence Tools</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            استعلامات Google Dorks و Shodan مخصصة للبيانات السعودية — 43+ استعلام جاهز للاستخدام
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الاستعلامات", value: stats.total, icon: Database, color: "text-primary" },
          { label: "Google Dorks", value: stats.google, icon: Search, color: "text-blue-400" },
          { label: "Shodan", value: stats.shodan, icon: Server, color: "text-red-400" },
          { label: "Recon", value: stats.recon, icon: Radar, color: "text-emerald-400" },
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
            placeholder="بحث في الاستعلامات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={activeType === "all" ? "default" : "outline"} onClick={() => setActiveType("all")} className="text-xs">الكل</Button>
          {Object.entries(typeConfig).map(([key, config]) => (
            <Button
              key={key}
              size="sm"
              variant={activeType === key ? "default" : "outline"}
              onClick={() => setActiveType(key)}
              className="text-xs gap-1"
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Queries List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredQueries.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Radar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">لا توجد استعلامات مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((query, i) => {
            const config = typeConfig[query.queryType] || typeConfig.google_dork;
            const Icon = config.icon;
            return (
              <motion.div
                key={query.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{query.nameAr}</h3>
                          <p className="text-[10px] text-muted-foreground">{query.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                        {query.categoryAr && (
                          <Badge variant="outline" className="text-[10px] bg-secondary/30">{query.categoryAr}</Badge>
                        )}
                      </div>
                    </div>

                    {query.descriptionAr && (
                      <p className="text-xs text-muted-foreground mb-2">{query.descriptionAr}</p>
                    )}

                    {/* Query box */}
                    <div className="relative p-3 rounded-lg bg-black/30 border border-border group">
                      <code className="text-xs font-mono text-primary break-all" dir="ltr">{query.query}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 left-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyQuery(query.query)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground font-mono">{query.queryId}</span>
                      {query.resultsCount !== null && query.resultsCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">{query.resultsCount} نتيجة</span>
                      )}
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
