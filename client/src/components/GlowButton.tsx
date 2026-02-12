/**
 * GlowButton — Ultra Premium animated button with glow effects
 * Adapted from design.rasid.vip reference
 */
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: {
    dark: {
      bg: "linear-gradient(135deg, rgba(74, 122, 181, 0.25), rgba(99, 74, 181, 0.2))",
      border: "rgba(74, 122, 181, 0.35)",
      glow: "0 0 20px rgba(74, 122, 181, 0.25), 0 0 40px rgba(74, 122, 181, 0.1)",
      hoverGlow: "0 0 30px rgba(74, 122, 181, 0.4), 0 0 60px rgba(74, 122, 181, 0.15)",
      text: "#E8E6F5",
    },
    light: {
      bg: "linear-gradient(135deg, rgba(30, 58, 95, 0.08), rgba(74, 122, 181, 0.12))",
      border: "rgba(30, 58, 95, 0.15)",
      glow: "0 2px 8px rgba(30, 58, 95, 0.08)",
      hoverGlow: "0 4px 16px rgba(30, 58, 95, 0.12)",
      text: "#1E3A5F",
    },
  },
  secondary: {
    dark: {
      bg: "linear-gradient(135deg, rgba(99, 74, 181, 0.2), rgba(147, 74, 181, 0.15))",
      border: "rgba(99, 74, 181, 0.3)",
      glow: "0 0 15px rgba(99, 74, 181, 0.2)",
      hoverGlow: "0 0 25px rgba(99, 74, 181, 0.35)",
      text: "#E8E6F5",
    },
    light: {
      bg: "linear-gradient(135deg, rgba(99, 74, 181, 0.06), rgba(147, 74, 181, 0.08))",
      border: "rgba(99, 74, 181, 0.12)",
      glow: "0 2px 8px rgba(99, 74, 181, 0.06)",
      hoverGlow: "0 4px 16px rgba(99, 74, 181, 0.1)",
      text: "#634AB5",
    },
  },
  danger: {
    dark: {
      bg: "linear-gradient(135deg, rgba(235, 61, 99, 0.2), rgba(235, 61, 99, 0.12))",
      border: "rgba(235, 61, 99, 0.3)",
      glow: "0 0 15px rgba(235, 61, 99, 0.2)",
      hoverGlow: "0 0 25px rgba(235, 61, 99, 0.35)",
      text: "#FFB4C2",
    },
    light: {
      bg: "linear-gradient(135deg, rgba(235, 61, 99, 0.06), rgba(235, 61, 99, 0.1))",
      border: "rgba(235, 61, 99, 0.15)",
      glow: "0 2px 8px rgba(235, 61, 99, 0.08)",
      hoverGlow: "0 4px 16px rgba(235, 61, 99, 0.12)",
      text: "#EB3D63",
    },
  },
  success: {
    dark: {
      bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.12))",
      border: "rgba(16, 185, 129, 0.3)",
      glow: "0 0 15px rgba(16, 185, 129, 0.2)",
      hoverGlow: "0 0 25px rgba(16, 185, 129, 0.35)",
      text: "#A7F3D0",
    },
    light: {
      bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(16, 185, 129, 0.1))",
      border: "rgba(16, 185, 129, 0.15)",
      glow: "0 2px 8px rgba(16, 185, 129, 0.08)",
      hoverGlow: "0 4px 16px rgba(16, 185, 129, 0.12)",
      text: "#059669",
    },
  },
  ghost: {
    dark: {
      bg: "transparent",
      border: "rgba(74, 122, 181, 0.1)",
      glow: "none",
      hoverGlow: "0 0 15px rgba(74, 122, 181, 0.15)",
      text: "#B8B5D0",
    },
    light: {
      bg: "transparent",
      border: "rgba(30, 58, 95, 0.06)",
      glow: "none",
      hoverGlow: "0 2px 8px rgba(30, 58, 95, 0.06)",
      text: "#4A5568",
    },
  },
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-base gap-2.5 rounded-xl",
};

export default function GlowButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  className = "",
  fullWidth = false,
}: GlowButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = VARIANTS[variant][isDark ? "dark" : "light"];

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center font-semibold
        overflow-hidden transition-all duration-300
        ${SIZES[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.glow,
        color: colors.text,
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={
        disabled
          ? {}
          : {
              scale: 1.03,
              boxShadow: colors.hoverGlow,
              borderColor: isDark ? "rgba(74, 122, 181, 0.5)" : "rgba(30, 58, 95, 0.25)",
            }
      }
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)"} 50%, transparent 60%)`,
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
      />

      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
