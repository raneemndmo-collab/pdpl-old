/**
 * NotificationBadge — Ultra Premium animated badge with urgency levels
 * Adapted from design.rasid.vip reference
 */
import { motion } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
  urgency?: "normal" | "warning" | "critical";
  showRipple?: boolean;
  size?: "sm" | "md" | "lg";
}

const URGENCY_COLORS = {
  normal: {
    bg: "rgba(74, 122, 181, 0.18)",
    text: "#4A7AB5",
    ring: "rgba(74, 122, 181, 0.3)",
  },
  warning: {
    bg: "rgba(255, 193, 7, 0.18)",
    text: "#FFC107",
    ring: "rgba(255, 193, 7, 0.3)",
  },
  critical: {
    bg: "rgba(235, 61, 99, 0.18)",
    text: "#EB3D63",
    ring: "rgba(235, 61, 99, 0.3)",
  },
};

const SIZES = {
  sm: { badge: "min-w-[16px] h-[16px] text-[9px] px-1", offset: "-top-1 -left-1" },
  md: { badge: "min-w-[20px] h-[20px] text-[10px] px-1.5", offset: "-top-1.5 -left-1.5" },
  lg: { badge: "min-w-[24px] h-[24px] text-[11px] px-2", offset: "-top-2 -left-2" },
};

export default function NotificationBadge({
  count,
  urgency = "normal",
  showRipple = false,
  size = "sm",
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const colors = URGENCY_COLORS[urgency];
  const sizeConfig = SIZES[size];
  const displayCount = count > 99 ? "99+" : count;

  return (
    <div className={`absolute ${sizeConfig.offset} z-10`}>
      {/* Ripple effect for critical/active */}
      {showRipple && urgency === "critical" && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: colors.ring }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Badge */}
      <motion.span
        className={`
          relative flex items-center justify-center rounded-full font-bold
          ${sizeConfig.badge}
        `}
        style={{
          background: colors.bg,
          color: colors.text,
          boxShadow: `0 0 8px ${colors.ring}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        {displayCount}
      </motion.span>
    </div>
  );
}
