/**
 * KnowledgeBaseAdmin — Admin page for managing the AI Knowledge Base
 * Features: CRUD for articles, FAQ, glossary, instructions, policies, regulations
 * Used by Smart Rasid AI to provide accurate domain-specific answers
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  BookMarked,
  ClipboardList,
  Shield,
  Scale,
  Tag,
  Filter,
  BarChart3,
  Loader2,
  X,
  Check,
  ChevronDown,
  Brain,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Category = "article" | "faq" | "glossary" | "instruction" | "policy" | "regulation";

const categoryConfig: Record<Category, { label: string; icon: any; color: string; gradient: string }> = {
  article: { label: "مقال", icon: FileText, color: "text-blue-400", gradient: "from-blue-500/20 to-cyan-500/20" },
  faq: { label: "سؤال شائع", icon: HelpCircle, color: "text-emerald-400", gradient: "from-emerald-500/20 to-teal-500/20" },
  glossary: { label: "مصطلح", icon: BookMarked, color: "text-amber-400", gradient: "from-amber-500/20 to-orange-500/20" },
  instruction: { label: "تعليمات", icon: ClipboardList, color: "text-violet-400", gradient: "from-violet-500/20 to-purple-500/20" },
  policy: { label: "سياسة", icon: Shield, color: "text-cyan-400", gradient: "from-cyan-500/20 to-blue-500/20" },
  regulation: { label: "لائحة", icon: Scale, color: "text-rose-400", gradient: "from-rose-500/20 to-pink-500/20" },
};

interface FormData {
  category: Category;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  tags: string;
  isPublished: boolean;
}

const emptyForm: FormData = {
  category: "article",
  title: "",
  titleAr: "",
  content: "",
  contentAr: "",
  tags: "",
  isPublished: true,
};

export default function KnowledgeBaseAdmin() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPublished, setFilterPublished] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRatings, setShowRatings] = useState(false);

  // Queries
  const entriesQuery = trpc.knowledgeBaseAdmin.list.useQuery({
    category: filterCategory || undefined,
    search: searchQuery || undefined,
    isPublished: filterPublished,
    limit: 200,
  });
  const statsQuery = trpc.knowledgeBaseAdmin.stats.useQuery();
  const ratingsQuery = trpc.aiRatings.stats.useQuery();
  const ratingsListQuery = trpc.aiRatings.list.useQuery({ limit: 20 });

  // Mutations
  const createMutation = trpc.knowledgeBaseAdmin.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المدخل بنجاح");
      entriesQuery.refetch();
      statsQuery.refetch();
      resetForm();
    },
    onError: () => toast.error("فشل في إنشاء المدخل"),
  });

  const updateMutation = trpc.knowledgeBaseAdmin.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المدخل بنجاح");
      entriesQuery.refetch();
      resetForm();
    },
    onError: () => toast.error("فشل في تحديث المدخل"),
  });

  const deleteMutation = trpc.knowledgeBaseAdmin.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المدخل بنجاح");
      entriesQuery.refetch();
      statsQuery.refetch();
      setShowDeleteConfirm(null);
    },
    onError: () => toast.error("فشل في حذف المدخل"),
  });

  const entries = entriesQuery.data || [];
  const stats = statsQuery.data;
  const ratingStats = ratingsQuery.data;

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      category: entry.category,
      title: entry.title,
      titleAr: entry.titleAr,
      content: entry.content,
      contentAr: entry.contentAr,
      tags: (entry.tags || []).join(", "),
      isPublished: entry.isPublished,
    });
    setEditingId(entry.entryId);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editingId) {
      updateMutation.mutate({
        entryId: editingId,
        category: formData.category,
        title: formData.title,
        titleAr: formData.titleAr,
        content: formData.content,
        contentAr: formData.contentAr,
        tags,
        isPublished: formData.isPublished,
      });
    } else {
      createMutation.mutate({
        category: formData.category,
        title: formData.title,
        titleAr: formData.titleAr,
        content: formData.content,
        contentAr: formData.contentAr,
        tags,
        isPublished: formData.isPublished,
      });
    }
  };

  const isFormValid = formData.titleAr && formData.contentAr && formData.title && formData.content;

  return (
    <div className="space-y-6 p-1" dir="rtl">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">قاعدة معرفة راصد الذكي</h1>
            <p className="text-sm text-muted-foreground">إدارة المقالات والمصطلحات والأسئلة الشائعة التي يستخدمها راصد الذكي</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRatings(!showRatings)}
            className="gap-2 border-amber-500/20 hover:bg-amber-500/10"
          >
            <Star className="w-4 h-4 text-amber-400" />
            تقييمات الذكاء الاصطناعي
          </Button>
          <Button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
          >
            <Plus className="w-4 h-4" />
            إضافة مدخل جديد
          </Button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="glass-card border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي المدخلات</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/[0.06]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats?.published || 0}</p>
            <p className="text-[10px] text-muted-foreground">منشور</p>
          </CardContent>
        </Card>
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <Card key={key} className="glass-card border-white/[0.06]">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${cfg.color}`}>{stats?.byCategory?.[key] || 0}</p>
              <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ AI RATINGS PANEL ═══ */}
      <AnimatePresence>
        {showRatings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass-card border-amber-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  تقييمات ردود راصد الذكي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-3xl font-bold text-amber-400">{ratingStats?.averageRating || 0}</p>
                    <div className="flex justify-center gap-0.5 my-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(ratingStats?.averageRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">متوسط التقييم</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-3xl font-bold text-foreground">{ratingStats?.totalRatings || 0}</p>
                    <p className="text-xs text-muted-foreground mt-2">إجمالي التقييمات</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-xs text-muted-foreground mb-2">توزيع التقييمات</p>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingStats?.ratingDistribution?.[star] || 0;
                      const total = ratingStats?.totalRatings || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] w-3">{star}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.05]">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-6">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Ratings */}
                {ratingsListQuery.data && ratingsListQuery.data.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">آخر التقييمات</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {ratingsListQuery.data.slice(0, 10).map((r: any) => (
                        <div key={r.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">{r.userMessage || "—"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.aiResponse?.slice(0, 80) || "—"}...</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {r.userName || "مستخدم"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في قاعدة المعرفة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-white/[0.03] border-white/[0.08]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground"
        >
          <option value="">جميع الفئات</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterPublished === undefined ? "" : filterPublished ? "true" : "false"}
          onChange={(e) => setFilterPublished(e.target.value === "" ? undefined : e.target.value === "true")}
          className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground"
        >
          <option value="">الكل</option>
          <option value="true">منشور</option>
          <option value="false">مسودة</option>
        </select>
      </div>

      {/* ═══ ENTRIES TABLE ═══ */}
      <Card className="glass-card border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-right text-xs font-medium text-muted-foreground p-3">الفئة</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">العنوان</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">الوسوم</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">المشاهدات</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">الحالة</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {entriesQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-400" />
                    <p className="text-sm text-muted-foreground mt-2">جارٍ التحميل...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد مدخلات بعد</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => { resetForm(); setShowForm(true); }}
                    >
                      <Plus className="w-4 h-4 ml-1" /> إضافة أول مدخل
                    </Button>
                  </td>
                </tr>
              ) : (
                entries.map((entry: any) => {
                  const cfg = categoryConfig[entry.category as Category] || categoryConfig.article;
                  const Icon = cfg.icon;
                  return (
                    <tr key={entry.entryId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r ${cfg.gradient} border border-white/[0.06]`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          <span className="text-xs">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium">{entry.titleAr}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.title}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(entry.tags || []).slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{entry.viewCount || 0}</span>
                      </td>
                      <td className="p-3">
                        {entry.isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Eye className="w-3 h-3" /> منشور
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <EyeOff className="w-3 h-3" /> مسودة
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-blue-500/10"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-red-500/10"
                            onClick={() => setShowDeleteConfirm(entry.entryId)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══ CREATE/EDIT DIALOG ═══ */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass-card border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingId ? "تعديل مدخل" : "إضافة مدخل جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">الفئة</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(categoryConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, category: key as Category }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        formData.category === key
                          ? `bg-gradient-to-r ${cfg.gradient} border-violet-500/30`
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className="text-[10px]">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Arabic */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">العنوان (عربي) *</label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="عنوان المدخل بالعربية"
                className="bg-white/[0.03] border-white/[0.08]"
                dir="rtl"
              />
            </div>

            {/* Title English */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">العنوان (إنجليزي) *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Entry title in English"
                className="bg-white/[0.03] border-white/[0.08]"
                dir="ltr"
              />
            </div>

            {/* Content Arabic */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">المحتوى (عربي) *</label>
              <textarea
                value={formData.contentAr}
                onChange={(e) => setFormData(prev => ({ ...prev, contentAr: e.target.value }))}
                placeholder="محتوى المدخل بالعربية..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm resize-y"
                dir="rtl"
              />
            </div>

            {/* Content English */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">المحتوى (إنجليزي) *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Entry content in English..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm resize-y"
                dir="ltr"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">الوسوم (مفصولة بفواصل)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="تسريب, بيانات شخصية, PDPL"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  formData.isPublished ? "bg-emerald-500" : "bg-white/[0.1]"
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  formData.isPublished ? "right-0.5" : "right-5"
                }`} />
              </button>
              <span className="text-sm">{formData.isPublished ? "منشور (مرئي لراصد الذكي)" : "مسودة (غير مرئي)"}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {editingId ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm glass-card border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-400">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من حذف هذا المدخل؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && deleteMutation.mutate({ entryId: showDeleteConfirm })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
