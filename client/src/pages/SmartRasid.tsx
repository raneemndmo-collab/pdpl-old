import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";
import {
  Brain,
  Send,
  Search,
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  Database,
  RefreshCw,
  Sparkles,
  Clock,
  Zap,
  Globe,
  Eye,
  TrendingUp,
  Loader2,
  MessageSquare,
  Plus,
  History,
  Bot,
  Network,
  Users,
  MapPin,
  Crosshair,
  Link2,
  Mic,
  Paperclip,
  ChevronDown,
  Wand2,
  Activity,
  BookOpen,
  Layers,
  Terminal,
  Cpu,
  Copy,
  Check,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  rating?: number;
  userQuery?: string; // The user's original question for this response
}

const quickCommands = [
  { label: "ملخص لوحة المعلومات", icon: BarChart3, gradient: "from-cyan-500 to-blue-600", query: "أعطني ملخص شامل للوحة المعلومات مع تحليل" },
  { label: "تسريبات حرجة", icon: AlertTriangle, gradient: "from-red-500 to-rose-600", query: "ما هي التسريبات الحرجة الحالية؟ أعطني تفاصيل كل واحد" },
  { label: "تحليل شامل", icon: TrendingUp, gradient: "from-emerald-500 to-teal-600", query: "أجرِ تحليل شامل للاتجاهات: توزيع الخطورة والمصادر والقطاعات" },
  { label: "حالة الحماية", icon: Shield, gradient: "from-amber-500 to-orange-600", query: "ما حالة حماية البيانات الشخصية؟ وما مستوى التهديدات الحالي والتوصيات؟" },
  { label: "البائعون المرصودون", icon: Users, gradient: "from-purple-500 to-violet-600", query: "أعطني تقرير عن البائعين المرصودين ومستوى خطرهم" },
  { label: "خريطة التهديدات", icon: MapPin, gradient: "from-indigo-500 to-blue-600", query: "اعرض خريطة التهديدات الجغرافية والتوزيع حسب المناطق" },
  { label: "الأدلة الرقمية", icon: Link2, gradient: "from-teal-500 to-cyan-600", query: "ما حالة سلسلة الأدلة الرقمية؟ كم دليل محفوظ؟" },
  { label: "قواعد الكشف", icon: Crosshair, gradient: "from-pink-500 to-rose-600", query: "اعرض قواعد صيد التهديدات النشطة وأداءها" },
];

const capabilities = [
  { icon: BarChart3, label: "تحليل لوحة القيادة", desc: "إحصائيات وتقارير شاملة", gradient: "from-cyan-500/20 to-blue-500/20" },
  { icon: Search, label: "البحث في التسريبات", desc: "بحث متقدم بكل الفلاتر", gradient: "from-emerald-500/20 to-teal-500/20" },
  { icon: Shield, label: "حماية البيانات", desc: "نظام PDPL والتوصيات", gradient: "from-amber-500/20 to-orange-500/20" },
  { icon: Globe, label: "الدارك ويب واللصق", desc: "رصد المصادر المظلمة", gradient: "from-blue-500/20 to-indigo-500/20" },
  { icon: Users, label: "البائعون والتهديدات", desc: "ملفات تعريف المهددين", gradient: "from-purple-500/20 to-violet-500/20" },
  { icon: Network, label: "رسم المعرفة", desc: "شبكة العلاقات والروابط", gradient: "from-pink-500/20 to-rose-500/20" },
  { icon: FileText, label: "التقارير والتوثيق", desc: "إنشاء ومراجعة التقارير", gradient: "from-indigo-500/20 to-blue-500/20" },
  { icon: Activity, label: "المراقبة والتنبيهات", desc: "حالة مهام الرصد", gradient: "from-teal-500/20 to-cyan-500/20" },
  { icon: Crosshair, label: "صيد التهديدات", desc: "قواعد YARA-like", gradient: "from-red-500/20 to-rose-500/20" },
  { icon: Link2, label: "سلسلة الأدلة", desc: "توثيق وحفظ الأدلة", gradient: "from-orange-500/20 to-amber-500/20" },
  { icon: BookOpen, label: "الدليل الإرشادي", desc: "شرح المفاهيم والإجراءات", gradient: "from-violet-500/20 to-purple-500/20" },
  { icon: Database, label: "صحة النظام", desc: "حالة المنصة والبنية", gradient: "from-slate-500/20 to-gray-500/20" },
];

// Tool name to Arabic label mapping
const toolLabels: Record<string, string> = {
  query_leaks: "استعلام التسريبات",
  get_leak_details: "تفاصيل التسريب",
  get_dashboard_stats: "إحصائيات لوحة القيادة",
  get_channels_info: "معلومات القنوات",
  get_monitoring_status: "حالة المراقبة",
  get_alert_info: "معلومات التنبيهات",
  get_sellers_info: "البائعون المرصودون",
  get_evidence_info: "الأدلة الرقمية",
  get_threat_rules_info: "قواعد التهديدات",
  get_darkweb_pastes: "الدارك ويب واللصق",
  get_feedback_accuracy: "مقاييس الدقة",
  get_knowledge_graph: "رسم المعرفة",
  get_osint_info: "استخبارات OSINT",
  get_reports_info: "التقارير",
  get_threat_map: "خريطة التهديدات",
  get_audit_log: "سجل المراجعة",
  get_system_health: "صحة النظام",
  analyze_trends: "تحليل الاتجاهات",
  get_platform_guide: "الدليل الإرشادي",
};

export default function SmartRasid() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drillLeakId, setDrillLeakId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ratingHover, setRatingHover] = useState<{ msgId: string; star: number } | null>(null);

  const rateMutation = trpc.aiRatings.rate.useMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const chatMutation = trpc.smartRasid.chat.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // Debounced suggestions
  const fetchSuggestions = useCallback(async (partial: string) => {
    if (partial.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/trpc/smartRasid.suggestions?input=${encodeURIComponent(JSON.stringify({ partial }))}`);
      const data = await res.json();
      const result = data?.result?.data;
      if (result?.suggestions?.length > 0) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
    suggestionsTimeoutRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const sendMessage = async (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const history = messages.slice(-16).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await chatMutation.mutateAsync({
        message: msg,
        history: history as Array<{ role: "user" | "assistant"; content: string }>,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: (typeof result.response === 'string' ? result.response : '') as string,
        timestamp: new Date(),
        toolsUsed: (result as any).toolsUsed,
        userQuery: msg,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleRating = async (msg: ChatMessage, star: number) => {
    try {
      await rateMutation.mutateAsync({
        messageId: msg.id,
        rating: star,
        userMessage: msg.userQuery || "",
        aiResponse: msg.content,
        toolsUsed: msg.toolsUsed || [],
      });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, rating: star } : m));
      toast.success(`تم التقييم بنجاح (${star}/5)`);
    } catch {
      toast.error("فشل في حفظ التقييم");
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("تم النسخ");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  // Extract leak IDs from message content for drill-down
  const extractLeakIds = (content: string): string[] => {
    const matches = content.match(/LK-\d{4}-\d{4}/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* ═══ HEADER — Frosted Glass ═══ */}
      <div className="flex-shrink-0 border-b border-white/[0.06] dark:bg-[oklch(0.12_0.04_278_/_60%)] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {/* AI Avatar with glow */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25 dark:shadow-[0_4px_20px_oklch(0.55_0.25_285_/_30%)]">
                <Brain className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-[oklch(0.12_0.04_278)] dark:shadow-[0_0_6px_oklch(0.72_0.17_160_/_50%)]" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                راصد الذكي
                <span className="text-[10px] font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  v5.5
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                المساعد الذكي الشامل — مطّلع على كل بيانات ووظائف المنصة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-violet-500/30 text-muted-foreground hover:text-foreground text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </motion.button>
          </div>
        </div>

        {/* Quick Commands — Scrollable chips */}
        <div className="flex items-center gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3 h-3" />
            أوامر سريعة
          </span>
          {quickCommands.map((cmd, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => sendMessage(cmd.query)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-violet-500/25 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-all"
            >
              <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${cmd.gradient} flex items-center justify-center`}>
                <cmd.icon className="w-2.5 h-2.5 text-white" />
              </div>
              {cmd.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ CHAT AREA ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.length === 0 ? (
          /* ═══ WELCOME SCREEN ═══ */
          <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
            {/* AI Brain Icon with orbital animation */}
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-12px] rounded-3xl border border-violet-500/10 border-dashed"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-24px] rounded-3xl border border-purple-500/5 border-dashed"
              />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-500/30 dark:shadow-[0_8px_40px_oklch(0.55_0.25_285_/_35%)]">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border-[3px] border-[oklch(0.12_0.04_278)] shadow-lg shadow-emerald-500/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              مرحباً بك في <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">راصد الذكي</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mb-8 text-center max-w-lg"
            >
              المساعد الذكي الشامل لمنصة راصد — مطّلع على جميع البيانات والوظائف، قادر على التحليل والإجابة والتنفيذ
            </motion.p>

            {/* Capabilities Grid — Glass Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] dark:bg-[oklch(0.13_0.04_278_/_40%)] backdrop-blur-xl p-5 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-violet-400" />
                <p className="text-sm font-medium text-foreground">قدرات المساعد الذكي</p>
                <span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-full">
                  19 أداة متصلة
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {capabilities.map((cap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br ${cap.gradient} border border-white/[0.04] hover:border-violet-500/20 transition-all cursor-default group`}
                  >
                    <cap.icon className="w-4 h-4 text-foreground/80 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-foreground block truncate">{cap.label}</span>
                      <span className="text-[9px] text-muted-foreground block truncate">{cap.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Action Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full"
            >
              <p className="text-xs text-muted-foreground mb-3 text-center">ابدأ بأحد هذه الأوامر أو اكتب أي سؤال</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickCommands.slice(0, 4).map((cmd, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(cmd.query)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-violet-500/25 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cmd.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <cmd.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{cmd.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ═══ MESSAGE LIST ═══ */
          <>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Brain className="w-4.5 h-4.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {user?.name?.charAt(0) || (user as any)?.displayName?.charAt(0) || "م"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] lg:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Tool usage indicator */}
                  {msg.role === "assistant" && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {msg.toolsUsed.map((tool, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15"
                        >
                          <Terminal className="w-2.5 h-2.5" />
                          {toolLabels[tool] || tool}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 relative group ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 text-foreground"
                        : "bg-white/[0.03] dark:bg-[oklch(0.14_0.04_278_/_50%)] border border-white/[0.06] text-foreground"
                    }`}
                  >
                    {/* Copy button */}
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10"
                      title="نسخ"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>

                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_table]:text-xs [&_th]:bg-white/5 [&_td]:border-white/5 [&_th]:border-white/5 [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-1.5">
                        <Streamdown>{msg.content}</Streamdown>
                        {/* Clickable Leak IDs */}
                        {extractLeakIds(msg.content).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-2">
                            <span className="text-[10px] text-muted-foreground">عرض تفاصيل:</span>
                            {extractLeakIds(msg.content).map(id => (
                              <button
                                key={id}
                                onClick={() => setDrillLeakId(id)}
                                className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/15 transition-colors font-mono"
                              >
                                {id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>

                  {/* Timestamp + Rating */}
                  <div className={`flex items-center gap-1.5 mt-1.5 ${msg.role === "user" ? "justify-end" : "justify-between"}`}>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/60">{formatTime(msg.timestamp)}</span>
                      {msg.role === "assistant" && (
                        <span className="text-[10px] text-emerald-500/70 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> مكتمل
                        </span>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-0.5" onMouseLeave={() => setRatingHover(null)}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isActive = msg.rating ? star <= msg.rating : (ratingHover?.msgId === msg.id && star <= ratingHover.star);
                          return (
                            <button
                              key={star}
                              onClick={() => !msg.rating && handleRating(msg, star)}
                              onMouseEnter={() => !msg.rating && setRatingHover({ msgId: msg.id, star })}
                              className={`transition-all duration-150 ${msg.rating ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
                              title={msg.rating ? `تم التقييم: ${msg.rating}/5` : `تقييم ${star}/5`}
                              disabled={!!msg.rating}
                            >
                              <Star
                                className={`w-3.5 h-3.5 transition-colors ${
                                  isActive
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-muted-foreground/30 hover:text-amber-400/50'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestions */}
                  {msg.role === "assistant" && msg.id === messages[messages.length - 1]?.id && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {getFollowUpSuggestions(msg.content).map((suggestion, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => sendMessage(suggestion)}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-violet-500/20 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator — Animated */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Brain className="w-4.5 h-4.5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white/[0.03] dark:bg-[oklch(0.14_0.04_278_/_50%)] border border-white/[0.06] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-violet-400" />
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-purple-400" />
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-violet-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">جارٍ التحليل والاستعلام...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ═══ INPUT AREA — Frosted Glass ═══ */}
      <div className="flex-shrink-0 border-t border-white/[0.06] dark:bg-[oklch(0.12_0.04_278_/_60%)] backdrop-blur-2xl p-4">
        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-2 bg-[oklch(0.14_0.04_278_/_90%)] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-right px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-colors flex items-center gap-2 border-b border-white/[0.04] last:border-0"
                >
                  <Search className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                  if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="اسأل راصد الذكي أي شيء عن المنصة..."
                rows={1}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none overflow-hidden"
                disabled={isLoading}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white disabled:opacity-30 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </motion.button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              RASID AI v5.5 — 19 أداة متصلة · 27 جدول بيانات
            </p>
            <p className="text-[10px] text-muted-foreground/40">
              Enter للإرسال · Shift+Enter لسطر جديد
            </p>
          </div>
        </div>
      </div>

      {/* Leak Detail Drilldown */}
      <LeakDetailDrilldown
        leak={drillLeakId ? { leakId: drillLeakId } : null}
        open={!!drillLeakId}
        onClose={() => setDrillLeakId(null)}
      />
    </div>
  );
}

// Generate follow-up suggestions based on the last assistant message
function getFollowUpSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lower = content.toLowerCase();

  if (lower.includes("تسريب") || lower.includes("leak")) {
    suggestions.push("تفاصيل أكثر عن التسريبات الحرجة");
    suggestions.push("ما التوصيات الأمنية؟");
  }
  if (lower.includes("ملخص") || lower.includes("لوحة") || lower.includes("إحصائي")) {
    suggestions.push("تحليل الاتجاهات الشهرية");
    suggestions.push("مقارنة بالفترة السابقة");
  }
  if (lower.includes("تقرير")) {
    suggestions.push("تفاصيل التقارير المجدولة");
    suggestions.push("سجل التوثيقات الرسمية");
  }
  if (lower.includes("حماية") || lower.includes("pdpl") || lower.includes("خصوصية") || lower.includes("تهديد")) {
    suggestions.push("ما مواد PDPL ذات الصلة؟");
    suggestions.push("أفضل الممارسات الأمنية");
  }
  if (lower.includes("بائع") || lower.includes("seller")) {
    suggestions.push("البائعون عالي الخطورة");
    suggestions.push("الأدلة الرقمية المرتبطة");
  }
  if (lower.includes("تحليل") || lower.includes("اتجاه") || lower.includes("trend")) {
    suggestions.push("توزيع التسريبات حسب القطاع");
    suggestions.push("أنواع PII الأكثر تسريباً");
  }

  if (suggestions.length === 0) {
    suggestions.push("ملخص لوحة المعلومات");
    suggestions.push("تحليل شامل");
    suggestions.push("دليل استخدام المنصة");
  }

  return suggestions.slice(0, 3);
}
