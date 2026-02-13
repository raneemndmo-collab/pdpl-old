/**
 * WorldHeatmap — خريطة مصادر التهديدات العالمية
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface WorldHeatmapProps {
  leaks: any[];
}

const COUNTRY_DATA: Record<string, { nameAr: string; nameEn: string; x: number; y: number; region: string }> = {
  SA: { nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia", x: 57, y: 48, region: "middle_east" },
  AE: { nameAr: "الإمارات", nameEn: "UAE", x: 60, y: 49, region: "middle_east" },
  EG: { nameAr: "مصر", nameEn: "Egypt", x: 50, y: 47, region: "middle_east" },
  TR: { nameAr: "تركيا", nameEn: "Turkey", x: 52, y: 38, region: "middle_east" },
  IR: { nameAr: "إيران", nameEn: "Iran", x: 60, y: 42, region: "middle_east" },
  IQ: { nameAr: "العراق", nameEn: "Iraq", x: 57, y: 42, region: "middle_east" },
  PK: { nameAr: "باكستان", nameEn: "Pakistan", x: 65, y: 44, region: "asia" },
  IN: { nameAr: "الهند", nameEn: "India", x: 68, y: 48, region: "asia" },
  CN: { nameAr: "الصين", nameEn: "China", x: 75, y: 38, region: "asia" },
  RU: { nameAr: "روسيا", nameEn: "Russia", x: 65, y: 25, region: "europe" },
  UA: { nameAr: "أوكرانيا", nameEn: "Ukraine", x: 52, y: 32, region: "europe" },
  DE: { nameAr: "ألمانيا", nameEn: "Germany", x: 44, y: 32, region: "europe" },
  NL: { nameAr: "هولندا", nameEn: "Netherlands", x: 43, y: 30, region: "europe" },
  GB: { nameAr: "بريطانيا", nameEn: "UK", x: 40, y: 30, region: "europe" },
  US: { nameAr: "أمريكا", nameEn: "USA", x: 20, y: 38, region: "americas" },
  BR: { nameAr: "البرازيل", nameEn: "Brazil", x: 28, y: 60, region: "americas" },
  NG: { nameAr: "نيجيريا", nameEn: "Nigeria", x: 44, y: 55, region: "africa" },
  ID: { nameAr: "إندونيسيا", nameEn: "Indonesia", x: 78, y: 55, region: "asia" },
  KR: { nameAr: "كوريا الجنوبية", nameEn: "South Korea", x: 80, y: 36, region: "asia" },
};

const REGIONS: Record<string, string> = {
  all: "العالم", middle_east: "الشرق الأوسط", asia: "آسيا", europe: "أوروبا", americas: "الأمريكتين", africa: "أفريقيا",
};

export default function WorldHeatmap({ leaks }: WorldHeatmapProps) {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const countryStats = useMemo(() => {
    const map = new Map<string, { leakCount: number; recordCount: number; sources: Set<string> }>();
    leaks.forEach(leak => {
      const src = leak.source || "unknown";
      const countryCodes: string[] = [];
      if (leak.sourceCountry) countryCodes.push(leak.sourceCountry);
      else {
        if (src === "telegram") countryCodes.push("RU", "SA", "AE", "IR");
        else if (src === "dark_web") countryCodes.push("RU", "US", "NL", "DE", "UA");
        else if (src === "paste") countryCodes.push("US", "GB", "DE", "CN");
        else countryCodes.push("SA");
      }
      countryCodes.forEach(code => {
        const existing = map.get(code) || { leakCount: 0, recordCount: 0, sources: new Set<string>() };
        existing.leakCount += 1;
        existing.recordCount += leak.recordCount || 0;
        existing.sources.add(src);
        map.set(code, existing);
      });
    });
    return map;
  }, [leaks]);

  const maxLeaks = useMemo(() => {
    let max = 0;
    countryStats.forEach(v => { if (v.leakCount > max) max = v.leakCount; });
    return max || 1;
  }, [countryStats]);

  const filteredCountries = useMemo(() => {
    return Object.entries(COUNTRY_DATA).filter(([_, data]) =>
      selectedRegion === "all" || data.region === selectedRegion
    );
  }, [selectedRegion]);

  const getHeatColor = (count: number) => {
    const intensity = count / maxLeaks;
    if (intensity > 0.7) return { fill: "#ef4444", glow: "rgba(239,68,68,0.4)" };
    if (intensity > 0.4) return { fill: "#f59e0b", glow: "rgba(245,158,11,0.3)" };
    if (intensity > 0.15) return { fill: "#3b82f6", glow: "rgba(59,130,246,0.3)" };
    return { fill: "#10b981", glow: "rgba(16,185,129,0.3)" };
  };

  const ranking = useMemo(() => {
    return Array.from(countryStats.entries())
      .map(([code, stats]) => ({ code, leakCount: stats.leakCount, recordCount: stats.recordCount, name: COUNTRY_DATA[code]?.nameAr || code }))
      .sort((a, b) => b.leakCount - a.leakCount)
      .slice(0, 8);
  }, [countryStats]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`rounded-2xl border overflow-hidden ${isDark
        ? "bg-gradient-to-br from-[#0f172a]/90 to-[#1e293b]/80 border-white/[0.06] backdrop-blur-xl"
        : "bg-white/90 border-[#e2e5ef] shadow-lg shadow-blue-500/5"}`}>
      <div className="flex flex-wrap items-center justify-between p-4 gap-2">
        <div className="flex items-center gap-2">
          <motion.div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/15" : "bg-blue-100"}`}
            animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity }}>
            <Globe className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-foreground">خريطة مصادر التهديدات</h3>
            <p className="text-[9px] text-muted-foreground">Global Threat Sources Heatmap</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(REGIONS).map(([key, label]) => (
            <button key={key} onClick={() => setSelectedRegion(key)}
              className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all ${selectedRegion === key
                ? isDark ? "bg-[#3DB1AC]/20 text-[#3DB1AC]" : "bg-blue-100 text-blue-700"
                : isDark ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className={`relative rounded-xl overflow-hidden ${isDark ? "bg-[#0a0f1e]/80" : "bg-slate-50"}`} style={{ height: "360px" }}>
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.3, 2.5))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-white hover:bg-slate-100 text-slate-700 shadow-sm"}`}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.7))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-white hover:bg-slate-100 text-slate-700 shadow-sm"}`}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <svg viewBox="0 0 100 80" className="w-full h-full" style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.3s ease" }}>
            {[20, 40, 60].map(y => (
              <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="1 2" />
            ))}
            {[20, 40, 60, 80].map(x => (
              <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="80" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="1 2" />
            ))}
            {filteredCountries.map(([code, data]) => {
              const stats = countryStats.get(code);
              const count = stats?.leakCount || 0;
              const heat = getHeatColor(count);
              const baseSize = Math.max(1.5, Math.min(6, (count / maxLeaks) * 6 + 1.5));
              const isHovered = hoveredCountry === code;
              return (
                <g key={code} onMouseEnter={() => setHoveredCountry(code)} onMouseLeave={() => setHoveredCountry(null)} style={{ cursor: "pointer" }}>
                  {count > 0 && (
                    <motion.circle cx={data.x} cy={data.y} r={baseSize * 2} fill={heat.glow} opacity={0.3}
                      animate={{ r: [baseSize * 1.8, baseSize * 2.5, baseSize * 1.8], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }} />
                  )}
                  <motion.circle cx={data.x} cy={data.y} r={baseSize}
                    fill={count > 0 ? heat.fill : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
                    stroke={isHovered ? "#fff" : "none"} strokeWidth={isHovered ? 0.3 : 0}
                    animate={isHovered ? { r: baseSize * 1.3 } : { r: baseSize }} transition={{ duration: 0.2 }} />
                  <text x={data.x} y={data.y + baseSize + 2.5} textAnchor="middle" className="text-[2.5px] font-bold"
                    fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"}>{code}</text>
                </g>
              );
            })}
          </svg>

          <AnimatePresence>
            {hoveredCountry && COUNTRY_DATA[hoveredCountry] && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                className={`absolute top-3 right-3 p-3 rounded-xl z-20 ${isDark ? "bg-[#1e293b]/95 border border-white/10 backdrop-blur-xl" : "bg-white/95 border border-slate-200 shadow-lg"}`}>
                <p className="text-xs font-bold text-foreground">{COUNTRY_DATA[hoveredCountry].nameAr}</p>
                <p className="text-[9px] text-muted-foreground">{COUNTRY_DATA[hoveredCountry].nameEn}</p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[10px] text-foreground">الحوادث: <strong>{countryStats.get(hoveredCountry)?.leakCount || 0}</strong></p>
                  <p className="text-[10px] text-foreground">السجلات: <strong>{(countryStats.get(hoveredCountry)?.recordCount || 0).toLocaleString()}</strong></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1 rounded-lg ${isDark ? "bg-[#0f172a]/80" : "bg-white/80"}`}>
            {[{ label: "منخفض", color: "#10b981" }, { label: "متوسط", color: "#3b82f6" }, { label: "مرتفع", color: "#f59e0b" }, { label: "حرج", color: "#ef4444" }].map(l => (
              <span key={l.label} className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />{l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-foreground">ترتيب الدول حسب عدد الحوادث</span>
        </div>
        <div className="space-y-1.5">
          {ranking.slice(0, 5).map((country, i) => {
            const heat = getHeatColor(country.leakCount);
            const pct = (country.leakCount / maxLeaks) * 100;
            return (
              <motion.div key={country.code} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-4 text-center font-bold">{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: heat.fill }} />
                <span className="text-[10px] text-foreground font-medium flex-1">{country.name}</span>
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: heat.fill }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} />
                </div>
                <span className="text-[9px] font-bold text-foreground w-8 text-left">{country.leakCount}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
