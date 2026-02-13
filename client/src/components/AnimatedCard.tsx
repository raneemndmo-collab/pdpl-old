/**
 * AnimatedCard — Reusable premium card with entrance animations and hover effects
 * Used across all platform pages for consistent motion design
 * Matches design.rasid.vip quality with glassmorphism and glow effects
 */
import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  /** Entrance animation variant */
  variant?: "fadeUp" | "fadeRight" | "fadeLeft" | "scaleIn" | "slideUp";
  /** Enable hover glow border effect */
  glow?: boolean;
  /** Custom glow color */
  glowColor?: string;
  /** Disable hover scale */
  noHoverScale?: boolean;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.88 },
    visible: { opacity: 1, scale: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
};

export function AnimatedCard({
  children,
  className = "",
  onClick,
  delay = 0,
  variant = "fadeUp",
  glow = false,
  glowColor,
  noHoverScale = false,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[variant]}
      transition={{
        delay,
        duration: 0.55,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={onClick}
      whileHover={
        noHoverScale
          ? undefined
          : {
              scale: onClick ? 1.015 : 1.005,
              y: -2,
              transition: { duration: 0.25, ease: "easeOut" },
            }
      }
      className={`
        relative rounded-2xl border overflow-hidden
        bg-white dark:bg-[rgba(26,37,80,0.7)]
        border-[#e2e5ef] dark:border-[rgba(61,177,172,0.1)]
        shadow-[0_1px_3px_rgba(39,52,112,0.04)] dark:shadow-none
        backdrop-blur-xl
        transition-[border-color,box-shadow] duration-400
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={
        glow && glowColor
          ? { boxShadow: `0 0 0 1px ${glowColor}, 0 4px 20px ${glowColor}` }
          : undefined
      }
    >
      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 pointer-events-none shimmer-hover" />
      {children}
    </motion.div>
  );
}

/** Animated stat number with count-up and pop effect */
export function AnimatedStat({
  value,
  duration = 1500,
  className = "",
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {prefix}{display.toLocaleString("en-US")}{suffix}
    </motion.span>
  );
}

/** Section header with animated icon */
export function AnimatedSectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-[rgba(61,177,172,0.12)] flex items-center justify-center"
          whileHover={{ rotate: -8, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <motion.button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          whileHover={{ x: -3 }}
        >
          {action}
        </motion.button>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
