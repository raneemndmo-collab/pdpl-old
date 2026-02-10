/**
 * KnowledgeGraph — Threat Intelligence Entity Relationship Visualization
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Network,
  Loader2,
  Filter,
  Database,
  Users,
  Building2,
  Globe,
  Shield,
  AlertTriangle,
  Link2,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const nodeTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  leak: { label: "تسريب", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/20" },
  seller: { label: "بائع", icon: Users, color: "text-amber-400", bg: "bg-amber-500/20" },
  entity: { label: "جهة", icon: Building2, color: "text-blue-400", bg: "bg-blue-500/20" },
  sector: { label: "قطاع", icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  pii_type: { label: "نوع PII", icon: Shield, color: "text-violet-400", bg: "bg-violet-500/20" },
  platform: { label: "منصة", icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  campaign: { label: "حملة", icon: Network, color: "text-pink-400", bg: "bg-pink-500/20" },
};

export default function KnowledgeGraph() {
  const [filterType, setFilterType] = useState("all");

  const { data, isLoading } = trpc.knowledgeGraph.data.useQuery();

  const filteredNodes = useMemo(() => {
    if (!data?.nodes) return [];
    if (filterType === "all") return data.nodes;
    return data.nodes.filter(n => n.nodeType === filterType);
  }, [data?.nodes, filterType]);

  const filteredEdges = useMemo(() => {
    if (!data?.edges) return [];
    const nodeIds = new Set(filteredNodes.map(n => n.nodeId));
    if (filterType === "all") return data.edges;
    return data.edges.filter(e => nodeIds.has(e.sourceNodeId) || nodeIds.has(e.targetNodeId));
  }, [data?.edges, filteredNodes, filterType]);

  const stats = useMemo(() => {
    if (!data) return { nodes: 0, edges: 0, types: {} as Record<string, number> };
    const types: Record<string, number> = {};
    data.nodes.forEach(n => { types[n.nodeType] = (types[n.nodeType] || 0) + 1; });
    return { nodes: data.nodes.length, edges: data.edges.length, types };
  }, [data]);

  // Build adjacency for display
  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof filteredNodes[0]>();
    filteredNodes.forEach(n => map.set(n.nodeId, n));
    return map;
  }, [filteredNodes]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden h-40"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-pink-500/10 via-background to-background dot-grid" />
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">رسم المعرفة</h1>
              <p className="text-xs text-muted-foreground">Knowledge Graph — Threat Intelligence</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            شبكة العلاقات بين التسريبات والبائعين والجهات والقطاعات — تحليل الروابط والأنماط
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stats.nodes}</p>
                <p className="text-[10px] text-muted-foreground">عقد (Nodes)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Link2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stats.edges}</p>
                <p className="text-[10px] text-muted-foreground">علاقات (Edges)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{Object.keys(stats.types).length}</p>
                <p className="text-[10px] text-muted-foreground">أنواع العقد</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Network className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {stats.nodes > 0 ? (stats.edges / stats.nodes).toFixed(1) : "0"}
                </p>
                <p className="text-[10px] text-muted-foreground">كثافة الشبكة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">توزيع أنواع العقد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(nodeTypeConfig).map(([type, config]) => {
              const count = stats.types[type] || 0;
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === type ? "all" : type)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    filterType === type ? "border-primary bg-primary/5" : "border-border bg-secondary/20 hover:border-primary/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{count}</p>
                    <p className="text-[10px] text-muted-foreground">{config.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Nodes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Edges / Relationships */}
          {filteredEdges.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  العلاقات ({filteredEdges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredEdges.map((edge, i) => {
                    const source = nodeMap.get(edge.sourceNodeId);
                    const target = nodeMap.get(edge.targetNodeId);
                    const sourceConfig = source ? nodeTypeConfig[source.nodeType] : null;
                    const targetConfig = target ? nodeTypeConfig[target.nodeType] : null;
                    return (
                      <motion.div
                        key={edge.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-border text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          {sourceConfig && <sourceConfig.icon className={`w-3 h-3 ${sourceConfig.color}`} />}
                          <span className="font-medium text-foreground">{source?.labelAr || source?.label || edge.sourceNodeId}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-px flex-1 bg-border" />
                          <Badge variant="outline" className="text-[10px] mx-2 bg-secondary/30">
                            {edge.relationshipAr || edge.relationship}
                          </Badge>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {targetConfig && <targetConfig.icon className={`w-3 h-3 ${targetConfig.color}`} />}
                          <span className="font-medium text-foreground">{target?.labelAr || target?.label || edge.targetNodeId}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNodes.map((node, i) => {
              const config = nodeTypeConfig[node.nodeType] || nodeTypeConfig.entity;
              const Icon = config.icon;
              const connections = (data?.edges || []).filter(
                e => e.sourceNodeId === node.nodeId || e.targetNodeId === node.nodeId
              ).length;
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">{node.labelAr || node.label}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                            <span className="text-[10px] text-muted-foreground">{connections} علاقة</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
