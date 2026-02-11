/**
 * ThreatMap — Interactive geographic visualization of leak origins
 * All stats, regions, and leak entries are clickable with detail modals
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Eye,
  Filter,
  Loader2,
  Building2,
  Globe,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DetailModal } from "@/components/DetailModal";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

const REGION_POSITIONS: Record<string, { x: number; y: number }> = {
  "Riyadh": { x: 55, y: 52 },
  "Eastern Province": { x: 72, y: 48 },
  "Makkah": { x: 28, y: 60 },
  "Madinah": { x: 30, y: 48 },
  "Asir": { x: 32, y: 75 },
  "Tabuk": { x: 22, y: 30 },
  "Hail": { x: 42, y: 35 },
  "Qassim": { x: 48, y: 40 },
  "Jazan": { x: 28, y: 82 },
  "Najran": { x: 48, y: 78 },
  "Al Baha": { x: 28, y: 68 },
  "Northern Borders": { x: 50, y: 22 },
  "Al Jouf": { x: 35, y: 22 },
};

const severityColors = {
  critical: { bg: "bg-red-500", text: "text-red-400", ring: "ring-red-500/30", fill: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  high: { bg: "bg-amber-500", text: "text-amber-400", ring: "ring-amber-500/30", fill: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  medium: { bg: "bg-cyan-500", text: "text-cyan-400", ring: "ring-cyan-500/30", fill: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  low: { bg: "bg-emerald-500", text: "text-emerald-400", ring: "ring-emerald-500/30", fill: "#10b981", glow: "rgba(16,185,129,0.4)" },
};

const sevLabels: Record<string, string> = { critical: "حرج", high: "عالي", medium: "متوسط", low: "منخفض" };

export default function ThreatMap() {
  const { data, isLoading } = trpc.threatMap.data.useQuery();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [hoveredLeak, setHoveredLeak] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedLeak, setSelectedLeak] = useState<any>(null);
  const [selectedRegionDetail, setSelectedRegionDetail] = useState<any>(null);

  const filteredLeaks = useMemo(() => {
    if (!data?.leaks) return [];
    let filtered = data.leaks;
    if (severityFilter !== "all") {
      filtered = filtered.filter((l) => l.severity === severityFilter);
    }
    if (selectedRegion) {
      filtered = filtered.filter((l) => l.region === selectedRegion);
    }
    return filtered;
  }, [data?.leaks, severityFilter, selectedRegion]);

  const regionStats = useMemo(() => {
    if (!data?.regions) return [];
    return data.regions.sort((a, b) => b.count - a.count);
  }, [data?.regions]);

  const totalLeaks = data?.leaks?.length ?? 0;
  const totalRecords = data?.leaks?.reduce((sum, l) => sum + l.recordCount, 0) ?? 0;
  const criticalCount = data?.leaks?.filter((l) => l.severity === "critical").length ?? 0;
  const regionsAffected = data?.regions?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "totalLeaks", label: "إجمالي التسريبات", value: totalLeaks, icon: Shield, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "critical", label: "تسريبات حرجة", value: criticalCount, icon: AlertTriangle, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
          { key: "regions", label: "المناطق المتأثرة", value: regionsAffected, icon: MapPin, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
          { key: "records", label: "السجلات المتأثرة", value: totalRecords.toLocaleString(), icon: Activity, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
        ].map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group`}
            onClick={() => setActiveModal(stat.key)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
            <p className="text-[9px] text-primary/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
          </motion.div>
        ))}
      </div>

      {/* Severity Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground ml-1">تصفية حسب الخطورة:</span>
        {["all", "critical", "high", "medium", "low"].map((sev) => (
          <Button
            key={sev}
            variant={severityFilter === sev ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSeverityFilter(sev)}
          >
            {sev === "all" ? "الكل" : sevLabels[sev]}
          </Button>
        ))}
        {selectedRegion && (
          <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => setSelectedRegion(null)}>
            إلغاء تحديد المنطقة ✕
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="xl:col-span-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            خريطة التهديدات — المملكة العربية السعودية
          </h3>

          <div className="relative w-full" style={{ paddingBottom: "80%" }}>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0 0 20px rgba(6,182,212,0.1))" }}>
              <path
                d="M 15 25 L 35 15 L 55 18 L 75 22 L 80 30 L 78 45 L 75 55 L 70 60 L 65 55 L 60 58 L 55 65 L 50 75 L 45 80 L 35 85 L 25 80 L 20 70 L 22 60 L 25 55 L 20 45 L 15 35 Z"
                fill="rgba(6,182,212,0.05)"
                stroke="rgba(6,182,212,0.3)"
                strokeWidth="0.5"
              />
              {[20, 30, 40, 50, 60, 70, 80].map((y) => (
                <line key={`h${y}`} x1="10" y1={y} x2="85" y2={y} stroke="rgba(6,182,212,0.05)" strokeWidth="0.2" />
              ))}
              {[20, 30, 40, 50, 60, 70].map((x) => (
                <line key={`v${x}`} x1={x} y1="10" x2={x} y2="90" stroke="rgba(6,182,212,0.05)" strokeWidth="0.2" />
              ))}

              {regionStats.map((region) => {
                const pos = REGION_POSITIONS[region.region];
                if (!pos) return null;
                const maxSeverity = region.critical > 0 ? "critical" : region.high > 0 ? "high" : region.medium > 0 ? "medium" : "low";
                const colors = severityColors[maxSeverity];
                const isSelected = selectedRegion === region.region;
                const size = Math.max(2, Math.min(5, region.count * 1.5));

                return (
                  <g key={region.region} className="cursor-pointer" onClick={() => { setSelectedRegionDetail(region); setActiveModal("regionDetail"); }}>
                    <circle cx={pos.x} cy={pos.y} r={size + 2} fill="none" stroke={colors.fill} strokeWidth="0.3" opacity={isSelected ? 0.8 : 0.4}>
                      <animate attributeName="r" values={`${size + 1};${size + 4};${size + 1}`} dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={pos.x} cy={pos.y} r={size} fill={colors.fill} opacity={isSelected ? 0.9 : 0.6} stroke={isSelected ? "#fff" : colors.fill} strokeWidth={isSelected ? 0.5 : 0.2} />
                    <text x={pos.x} y={pos.y + 0.8} textAnchor="middle" fill="white" fontSize="2.5" fontWeight="bold">{region.count}</text>
                    <text x={pos.x} y={pos.y - size - 1.5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="2">{region.regionAr}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <div key={sev} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${severityColors[sev].bg}`} />
                <span className="text-xs text-muted-foreground">{sevLabels[sev]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Region Details Panel */}
        <div className="space-y-4">
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              ترتيب المناطق حسب التسريبات
            </h3>
            <div className="space-y-2">
              {regionStats.map((region, i) => {
                const maxCount = regionStats[0]?.count || 1;
                const pct = Math.round((region.count / maxCount) * 100);
                const isSelected = selectedRegion === region.region;
                return (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/15 border border-primary/30" : "hover:bg-accent/30"
                    }`}
                    onClick={() => { setSelectedRegionDetail(region); setActiveModal("regionDetail"); }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{region.regionAr}</span>
                      <span className="text-xs text-muted-foreground">{region.count} تسريب</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          region.critical > 0 ? "bg-red-500" : region.high > 0 ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      {region.critical > 0 && <span className="text-[10px] text-red-400">{region.critical} حرج</span>}
                      {region.high > 0 && <span className="text-[10px] text-amber-400">{region.high} عالي</span>}
                      {region.medium > 0 && <span className="text-[10px] text-cyan-400">{region.medium} متوسط</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {selectedRegion
                ? `تسريبات ${regionStats.find((r) => r.region === selectedRegion)?.regionAr || selectedRegion}`
                : "أحدث التسريبات"}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredLeaks.slice(0, 10).map((leak, i) => {
                const colors = severityColors[leak.severity as keyof typeof severityColors] || severityColors.medium;
                return (
                  <motion.div
                    key={leak.leakId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      hoveredLeak === i ? "border-primary/40 bg-primary/5" : "border-border/30 bg-background/50"
                    }`}
                    onMouseEnter={() => setHoveredLeak(i)}
                    onMouseLeave={() => setHoveredLeak(null)}
                    onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{leak.titleAr}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {leak.cityAr} • {leak.sectorAr} • {leak.recordCount?.toLocaleString()} سجل
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg}/20 ${colors.text} font-medium flex-shrink-0`}>
                        {sevLabels[leak.severity] || leak.severity}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {filteredLeaks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد تسريبات مطابقة</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Total Leaks Modal */}
      <DetailModal open={activeModal === "totalLeaks"} onClose={() => setActiveModal(null)} title="إجمالي التسريبات على الخريطة" icon={<Shield className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-3">
          <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
            <p className="text-2xl font-bold text-cyan-400">{totalLeaks}</p>
            <p className="text-xs text-muted-foreground">تسريب مرصود جغرافياً</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["critical", "high", "medium", "low"] as const).map(sev => (
              <div key={sev} className={`rounded-xl p-3 border text-center ${severityColors[sev].bg}/10 ${severityColors[sev].text} border-current/20`}>
                <p className="text-xl font-bold">{data?.leaks?.filter(l => l.severity === sev).length || 0}</p>
                <p className="text-[10px]">{sevLabels[sev]}</p>
              </div>
            ))}
          </div>
        </div>
      </DetailModal>

      {/* Critical Leaks Modal */}
      <DetailModal open={activeModal === "critical"} onClose={() => setActiveModal(null)} title="التسريبات الحرجة" icon={<AlertTriangle className="w-5 h-5 text-red-400" />}>
        <div className="space-y-3">
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">تسريب حرج</p>
          </div>
          {data?.leaks?.filter(l => l.severity === "critical").map(leak => (
            <div key={leak.leakId} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}>
              <p className="text-sm font-medium text-foreground">{leak.titleAr}</p>
              <p className="text-[10px] text-muted-foreground">{leak.cityAr} • {leak.sectorAr} • {leak.recordCount?.toLocaleString()} سجل</p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Regions Affected Modal */}
      <DetailModal open={activeModal === "regions"} onClose={() => setActiveModal(null)} title="المناطق المتأثرة" icon={<MapPin className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
            <p className="text-2xl font-bold text-amber-400">{regionsAffected}</p>
            <p className="text-xs text-muted-foreground">منطقة متأثرة</p>
          </div>
          {regionStats.map(region => (
            <div key={region.region} className="p-3 rounded-lg bg-secondary/30 border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setSelectedRegionDetail(region); setActiveModal("regionDetail"); }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{region.regionAr}</span>
                <span className="text-sm font-bold text-foreground">{region.count}</span>
              </div>
              <div className="flex gap-2 mt-1">
                {region.critical > 0 && <span className="text-[10px] text-red-400">{region.critical} حرج</span>}
                {region.high > 0 && <span className="text-[10px] text-amber-400">{region.high} عالي</span>}
                {region.medium > 0 && <span className="text-[10px] text-cyan-400">{region.medium} متوسط</span>}
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Records Affected Modal */}
      <DetailModal open={activeModal === "records"} onClose={() => setActiveModal(null)} title="السجلات المتأثرة" icon={<Activity className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
            <p className="text-2xl font-bold text-emerald-400">{totalRecords.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">سجل متأثر</p>
          </div>
          {data?.leaks?.sort((a, b) => b.recordCount - a.recordCount).slice(0, 10).map(leak => (
            <div key={leak.leakId} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}>
              <div>
                <p className="text-sm text-foreground">{leak.titleAr}</p>
                <p className="text-[10px] text-muted-foreground">{leak.cityAr} • {leak.sectorAr}</p>
              </div>
              <span className="text-lg font-bold text-emerald-400">{leak.recordCount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Region Detail Modal */}
      <DetailModal
        open={activeModal === "regionDetail" && !!selectedRegionDetail}
        onClose={() => { setActiveModal(null); setSelectedRegionDetail(null); }}
        title={`منطقة ${selectedRegionDetail?.regionAr || ""}`}
        icon={<MapPin className="w-5 h-5 text-primary" />}
        maxWidth="max-w-2xl"
      >
        {selectedRegionDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">إجمالي التسريبات</p>
                <p className="text-xl font-bold text-foreground mt-1">{selectedRegionDetail.count}</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
                <p className="text-xs text-muted-foreground">حرج</p>
                <p className="text-xl font-bold text-red-400 mt-1">{selectedRegionDetail.critical || 0}</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
                <p className="text-xs text-muted-foreground">عالي</p>
                <p className="text-xl font-bold text-amber-400 mt-1">{selectedRegionDetail.high || 0}</p>
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-3 border border-cyan-500/20 text-center">
                <p className="text-xs text-muted-foreground">متوسط</p>
                <p className="text-xl font-bold text-cyan-400 mt-1">{selectedRegionDetail.medium || 0}</p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">التسريبات في هذه المنطقة</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data?.leaks?.filter(l => l.region === selectedRegionDetail.region).map(leak => {
                  const colors = severityColors[leak.severity as keyof typeof severityColors] || severityColors.medium;
                  return (
                    <div key={leak.leakId} className="p-2.5 rounded-lg border border-border/30 bg-background/50 cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => { setSelectedLeak(leak); setActiveModal("leakDetail"); }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-foreground">{leak.titleAr}</p>
                          <p className="text-[10px] text-muted-foreground">{leak.cityAr} • {leak.sectorAr} • {leak.recordCount?.toLocaleString()} سجل</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg}/20 ${colors.text}`}>{sevLabels[leak.severity]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Leak Detail Modal */}
      <LeakDetailDrilldown
        leak={selectedLeak}
        open={activeModal === "leakDetail" && !!selectedLeak}
        onClose={() => { setActiveModal(null); setSelectedLeak(null); }}
        showBackButton={true}
        onBack={() => { setActiveModal(null); setSelectedLeak(null); }}
      />
    </div>
  );
}
