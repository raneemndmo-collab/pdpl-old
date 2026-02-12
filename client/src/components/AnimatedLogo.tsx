/**
 * AnimatedLogo — Ultra Premium animated logo with orbital rings and glow
 * Uses official Rasid logo with creative motion effects
 */
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

// Full brand logos (with "منصة راصد" + "مكتب إدارة البيانات الوطنية")
const RASID_LOGO_LIGHT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/tSiomIdoNdNFAtOB.png"; // Cream+Gold for dark bg
const RASID_LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/vyIfeykxwXasuonx.png"; // Navy+Gold for light bg

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showOrbits?: boolean;
  className?: string;
}

export default function AnimatedLogo({ size = "md", showOrbits = true, className = "" }: AnimatedLogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sizeMap = {
    sm: { logo: 36, container: 50, orbit1: 22, orbit2: 28 },
    md: { logo: 48, container: 65, orbit1: 30, orbit2: 38 },
    lg: { logo: 80, container: 110, orbit1: 48, orbit2: 60 },
    xl: { logo: 140, container: 180, orbit1: 80, orbit2: 100 },
  };

  const s = sizeMap[size];
  const logoSrc = isDark ? RASID_LOGO_DARK : RASID_LOGO_LIGHT;

  const C = {
    accent: isDark ? "#3DB1AC" : "#273470",
    purple: isDark ? "#6459A7" : "#6459A7",
    accentGlow: isDark ? "rgba(61, 177, 172, 0.25)" : "rgba(39, 52, 112, 0.08)",
    orbitBorder: isDark ? "rgba(61, 177, 172, 0.12)" : "rgba(39, 52, 112, 0.06)",
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: s.container, height: s.container }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Outer orbital ring */}
      {showOrbits && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.container,
            height: s.container,
            border: `1px dashed ${C.orbitBorder}`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: C.accent,
              top: -3,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: `0 0 10px ${C.accentGlow}`,
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* Inner orbital ring */}
      {showOrbits && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.container * 0.75,
            height: s.container * 0.75,
            border: `1px dashed ${isDark ? "rgba(99, 74, 181, 0.1)" : "rgba(74, 122, 181, 0.05)"}`,
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: C.purple,
              bottom: -2,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: `0 0 8px ${C.purple}`,
            }}
          />
        </motion.div>
      )}

      {/* Breathing glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s.logo * 1.2,
          height: s.logo * 1.2,
          background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo image */}
      <motion.img
        src={logoSrc}
        alt="راصد"
        className="relative z-10"
        style={{ width: s.logo, height: "auto", objectFit: "contain" }}
        animate={{
          filter: [
            `drop-shadow(0 0 6px ${C.accentGlow})`,
            `drop-shadow(0 0 18px ${C.accentGlow})`,
            `drop-shadow(0 0 6px ${C.accentGlow})`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
