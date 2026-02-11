/**
 * Shared DetailModal component — reusable across all pages
 * Professional modal with animation for showing detailed information
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function DetailModal({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className={`w-full ${maxWidth} max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-foreground font-semibold text-base">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Stat Card that opens a modal ─── */
export function ClickableStatCard({
  icon,
  iconColor,
  bgColor,
  borderColor,
  value,
  label,
  onClick,
  trend,
  trendUp,
}: {
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  value: string | number;
  label: string;
  onClick: () => void;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border ${borderColor} ${bgColor} cursor-pointer hover:scale-[1.02] transition-all group`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] ${trendUp ? "text-red-400" : "text-emerald-400"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
    </div>
  );
}

/* ─── Paginated list for modals ─── */
export function PaginatedList({
  items,
  renderItem,
  emptyMessage = "لا توجد بيانات",
  perPage = 10,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  perPage?: number;
}) {
  const [page, setPage] = React.useState(0);
  const totalPages = Math.ceil(items.length / perPage);
  const pageItems = items.slice(page * perPage, (page + 1) * perPage);

  if (items.length === 0) return <p className="text-center text-muted-foreground text-sm py-8">{emptyMessage}</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{items.length} عنصر</p>
      {pageItems.map((item, i) => renderItem(item, page * perPage + i))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

import React from "react";
