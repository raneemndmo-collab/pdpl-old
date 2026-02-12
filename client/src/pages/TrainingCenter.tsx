import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Zap,
  FileText,
  MessageSquare,
  Star,
  Plus,
  Trash2,
  Edit,
  Upload,
  Brain,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot,
  Settings2,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

// ─── Tab Types ──────────────────────────────────────────────────
type TabId = "knowledge" | "actions" | "documents" | "feedback" | "personality";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "knowledge", label: "قاعدة المعرفة", icon: <BookOpen className="w-4 h-4" /> },
  { id: "actions", label: "الإجراءات المخصصة", icon: <Zap className="w-4 h-4" /> },
  { id: "documents", label: "مستندات التدريب", icon: <FileText className="w-4 h-4" /> },
  { id: "feedback", label: "تقييمات المستخدمين", icon: <Star className="w-4 h-4" /> },
  { id: "personality", label: "سيناريوهات الشخصية", icon: <MessageSquare className="w-4 h-4" /> },
];

// ─── Knowledge Base Tab ─────────────────────────────────────────
function KnowledgeTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", titleAr: "", content: "", contentAr: "",
    category: "article" as "article" | "faq" | "glossary" | "instruction" | "policy" | "regulation", tags: "",
  });

  const { data: entries = [], refetch } = trpc.knowledgeBaseAdmin.list.useQuery({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
  });
  const { data: stats } = trpc.knowledgeBaseAdmin.stats.useQuery();

  const createMut = trpc.knowledgeBaseAdmin.create.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); resetForm(); toast.success("تم إضافة المعرفة بنجاح"); },
  });
  const updateMut = trpc.knowledgeBaseAdmin.update.useMutation({
    onSuccess: () => { refetch(); setEditEntry(null); resetForm(); toast.success("تم تحديث المعرفة بنجاح"); },
  });
  const deleteMut = trpc.knowledgeBaseAdmin.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("تم حذف المعرفة"); },
  });

  function resetForm() {
    setForm({ title: "", titleAr: "", content: "", contentAr: "", category: "article", tags: "" });
  }

  function openEdit(entry: any) {
    setEditEntry(entry);
    setForm({
      title: entry.title || "",
      titleAr: entry.titleAr || "",
      content: entry.content || "",
      contentAr: entry.contentAr || "",
      category: entry.category || "article",
      tags: (entry.tags || []).join(", "),
    });
  }

  function handleSubmit() {
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editEntry) {
      updateMut.mutate({ entryId: editEntry.entryId, category: form.category, title: form.title, titleAr: form.titleAr, content: form.content, contentAr: form.contentAr, tags });
    } else {
      createMut.mutate({ category: form.category, title: form.title, titleAr: form.titleAr, content: form.content, contentAr: form.contentAr, tags });
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats?.total ?? 0}</div>
            <div className="text-xs text-slate-400">إجمالي المعارف</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats?.published ?? 0}</div>
            <div className="text-xs text-slate-400">منشورة</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{(stats?.total ?? 0) - (stats?.published ?? 0)}</div>
            <div className="text-xs text-slate-400">مسودة</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{Object.values(stats?.byCategory ?? {}).reduce((a: number, b: any) => a + Number(b), 0)}</div>
            <div className="text-xs text-slate-400">التصنيفات</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="بحث في قاعدة المعرفة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            <SelectItem value="article">مقال</SelectItem>
            <SelectItem value="faq">أسئلة شائعة</SelectItem>
            <SelectItem value="glossary">مصطلحات</SelectItem>
            <SelectItem value="instruction">تعليمات</SelectItem>
            <SelectItem value="policy">سياسة</SelectItem>
            <SelectItem value="regulation">لائحة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 ml-2" /> إضافة معرفة
        </Button>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {entries.map((entry: any) => (
          <Card key={entry.id} className="bg-slate-800/40 border-slate-700 hover:border-cyan-700/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{entry.titleAr || entry.title}</h3>
                    <Badge variant={entry.isPublished ? "default" : "secondary"} className="text-xs">
                      {entry.isPublished ? "منشور" : "مسودة"}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-700">
                      {entry.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{entry.contentAr || entry.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {entry.viewCount}</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => updateMut.mutate({ entryId: entry.entryId, isPublished: !entry.isPublished })}>
                    {entry.isPublished ? <XCircle className="w-4 h-4 text-yellow-400" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(entry)}>
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ entryId: entry.entryId })}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد معارف بعد</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editEntry} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditEntry(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editEntry ? "تعديل المعرفة" : "إضافة معرفة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">العنوان (EN)</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">العنوان (AR)</label>
                <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="bg-slate-800 border-slate-700" dir="rtl" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">المحتوى (EN)</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-slate-800 border-slate-700 min-h-[100px]" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">المحتوى (AR)</label>
              <Textarea value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} className="bg-slate-800 border-slate-700 min-h-[100px]" dir="rtl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">التصنيف</label>
                <Select value={form.category} onValueChange={(v: "article" | "faq" | "glossary" | "instruction" | "policy" | "regulation") => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">مقال</SelectItem>
                    <SelectItem value="faq">أسئلة شائعة</SelectItem>
                    <SelectItem value="glossary">مصطلحات</SelectItem>
                    <SelectItem value="instruction">تعليمات</SelectItem>
                    <SelectItem value="policy">سياسة</SelectItem>
                    <SelectItem value="regulation">لائحة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">الوسوم (مفصولة بفاصلة)</label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-slate-800 border-slate-700" placeholder="pdpl, خصوصية, بيانات" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-700">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-700" disabled={createMut.isPending || updateMut.isPending}>
              {editEntry ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Custom Actions Tab ─────────────────────────────────────────
function ActionsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [editAction, setEditAction] = useState<any>(null);
  const [form, setForm] = useState({
    triggerPhrase: "", triggerAliases: "",
    actionType: "custom_response" as string,
    actionTarget: "", description: "", descriptionAr: "",
    priority: 0,
  });

  const { data: actions = [], refetch } = trpc.trainingCenter.customActions.list.useQuery();
  const createMut = trpc.trainingCenter.customActions.create.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); resetForm(); toast.success("تم إنشاء الإجراء بنجاح"); },
  });
  const updateMut = trpc.trainingCenter.customActions.update.useMutation({
    onSuccess: () => { refetch(); setEditAction(null); resetForm(); toast.success("تم تحديث الإجراء"); },
  });
  const deleteMut = trpc.trainingCenter.customActions.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("تم حذف الإجراء"); },
  });

  function resetForm() {
    setForm({ triggerPhrase: "", triggerAliases: "", actionType: "custom_response", actionTarget: "", description: "", descriptionAr: "", priority: 0 });
  }

  function openEdit(action: any) {
    setEditAction(action);
    setForm({
      triggerPhrase: action.triggerPhrase || "",
      triggerAliases: (action.triggerAliases || []).join(", "),
      actionType: action.actionType || "custom_response",
      actionTarget: action.actionTarget || "",
      description: action.description || "",
      descriptionAr: action.descriptionAr || "",
      priority: action.priority || 0,
    });
  }

  function handleSubmit() {
    const aliases = form.triggerAliases.split(",").map(a => a.trim()).filter(Boolean);
    if (editAction) {
      updateMut.mutate({ actionId: editAction.actionId, triggerPhrase: form.triggerPhrase, triggerAliases: aliases, actionType: form.actionType as any, actionTarget: form.actionTarget || undefined, description: form.description || undefined, descriptionAr: form.descriptionAr || undefined, priority: form.priority });
    } else {
      createMut.mutate({ triggerPhrase: form.triggerPhrase, triggerAliases: aliases, actionType: form.actionType as any, actionTarget: form.actionTarget || undefined, description: form.description || undefined, descriptionAr: form.descriptionAr || undefined, priority: form.priority });
    }
  }

  const typeLabels: Record<string, string> = {
    call_function: "استدعاء دالة",
    custom_response: "رد مخصص",
    redirect: "إعادة توجيه",
    api_call: "استدعاء API",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">الإجراءات المخصصة</h3>
          <p className="text-sm text-slate-400">أضف إجراءات مخصصة يستجيب لها راصد الذكي تلقائياً</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 ml-2" /> إجراء جديد
        </Button>
      </div>

      <div className="space-y-3">
        {actions.map((action: any) => (
          <Card key={action.id} className="bg-slate-800/40 border-slate-700 hover:border-cyan-700/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-white">{action.triggerPhrase}</h3>
                    <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-700">
                      {typeLabels[action.actionType] || action.actionType}
                    </Badge>
                    <Badge variant={action.isActive ? "default" : "secondary"} className="text-xs">
                      {action.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{action.descriptionAr || action.description || "بدون وصف"}</p>
                  {action.triggerAliases && (action.triggerAliases as string[]).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(action.triggerAliases as string[]).map((alias: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs text-slate-400 border-slate-600">{alias}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(action)}>
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ actionId: action.actionId })}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {actions.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد إجراءات مخصصة بعد</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editAction} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditAction(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editAction ? "تعديل الإجراء" : "إجراء مخصص جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">عبارة التفعيل</label>
              <Input value={form.triggerPhrase} onChange={(e) => setForm({ ...form, triggerPhrase: e.target.value })} className="bg-slate-800 border-slate-700" dir="rtl" placeholder="مثال: ما هي سياسة الخصوصية؟" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">عبارات بديلة (مفصولة بفاصلة)</label>
              <Input value={form.triggerAliases} onChange={(e) => setForm({ ...form, triggerAliases: e.target.value })} className="bg-slate-800 border-slate-700" dir="rtl" placeholder="سياسة الخصوصية, privacy policy" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">نوع الإجراء</label>
              <Select value={form.actionType} onValueChange={(v) => setForm({ ...form, actionType: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom_response">رد مخصص</SelectItem>
                  <SelectItem value="call_function">استدعاء دالة</SelectItem>
                  <SelectItem value="redirect">إعادة توجيه</SelectItem>
                  <SelectItem value="api_call">استدعاء API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">الهدف / الرد</label>
              <Textarea value={form.actionTarget} onChange={(e) => setForm({ ...form, actionTarget: e.target.value })} className="bg-slate-800 border-slate-700 min-h-[80px]" dir="rtl" placeholder="النص الذي سيرد به راصد الذكي أو رابط الدالة" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">الوصف (AR)</label>
              <Input value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} className="bg-slate-800 border-slate-700" dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-700">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-700" disabled={createMut.isPending || updateMut.isPending}>
              {editAction ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Training Documents Tab ─────────────────────────────────────
function DocumentsTab() {
  const [showUpload, setShowUpload] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const { data: docs = [], refetch } = trpc.trainingCenter.documents.list.useQuery();
  const uploadMut = trpc.trainingCenter.documents.upload.useMutation({
    onSuccess: () => { refetch(); setShowUpload(false); setFileName(""); setFileUrl(""); toast.success("تم رفع المستند بنجاح"); },
  });
  const processMut = trpc.trainingCenter.documents.process.useMutation({
    onSuccess: () => { refetch(); toast.success("تم معالجة المستند"); },
    onError: () => { refetch(); toast.error("فشل في معالجة المستند"); },
  });
  const deleteMut = trpc.trainingCenter.documents.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("تم حذف المستند"); },
  });

  const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "في الانتظار", color: "text-yellow-400", icon: <Clock className="w-3 h-3" /> },
    processing: { label: "جاري المعالجة", color: "text-blue-400", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    completed: { label: "مكتمل", color: "text-green-400", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { label: "فشل", color: "text-red-400", icon: <XCircle className="w-3 h-3" /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">مستندات التدريب</h3>
          <p className="text-sm text-slate-400">ارفع مستندات لتدريب راصد الذكي عليها</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Upload className="w-4 h-4 ml-2" /> رفع مستند
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{docs.length}</div>
            <div className="text-xs text-slate-400">إجمالي المستندات</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{docs.filter((d: any) => d.status === "completed").length}</div>
            <div className="text-xs text-slate-400">تمت المعالجة</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{docs.filter((d: any) => d.status === "pending").length}</div>
            <div className="text-xs text-slate-400">في الانتظار</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {docs.map((doc: any) => {
          const status = statusLabels[doc.status] || statusLabels.pending;
          return (
            <Card key={doc.id} className="bg-slate-800/40 border-slate-700 hover:border-cyan-700/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-white truncate">{doc.fileName}</h3>
                      <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    {doc.extractedContent && (
                      <p className="text-sm text-slate-400 line-clamp-2 mt-1">{doc.extractedContent}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {doc.chunkCount && <span>{doc.chunkCount} أجزاء</span>}
                      <span>بواسطة: {doc.uploadedByName || "غير معروف"}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {doc.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">{doc.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => processMut.mutate({ docId: doc.docId })} disabled={processMut.isPending}>
                        <Brain className="w-4 h-4 text-purple-400" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ docId: doc.docId })}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {docs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مستندات تدريب بعد</p>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>رفع مستند تدريب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">اسم المستند</label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="bg-slate-800 border-slate-700" dir="rtl" placeholder="مثال: دليل PDPL الشامل" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">رابط المستند (URL)</label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="bg-slate-800 border-slate-700" placeholder="https://example.com/document.pdf" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-700">إلغاء</Button>
            </DialogClose>
            <Button onClick={() => uploadMut.mutate({ fileName, fileUrl })} className="bg-cyan-600 hover:bg-cyan-700" disabled={!fileName || !fileUrl || uploadMut.isPending}>
              رفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Feedback Tab ───────────────────────────────────────────────
function FeedbackTab() {
  const { data: ratings = [] } = trpc.trainingCenter.feedback.list.useQuery();
  const { data: stats } = trpc.trainingCenter.feedback.stats.useQuery();

  const distribution = stats?.distribution || {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats?.total ?? 0, label: "إجمالي التقييمات", color: "text-cyan-400", extra: null },
          { value: stats?.avgRating ?? 0, label: "متوسط التقييم", color: "text-yellow-400", extra: <Star className="w-5 h-5 fill-yellow-400" /> },
          { value: Number(distribution["5"] ?? 0) + Number(distribution["4"] ?? 0), label: "تقييمات إيجابية", color: "text-green-400", extra: null },
          { value: Number(distribution["1"] ?? 0) + Number(distribution["2"] ?? 0), label: "تقييمات سلبية", color: "text-red-400", extra: null },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color} flex items-center justify-center gap-1`}>
                  {s.extra}
                  {s.value}
                </div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Distribution Chart */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            توزيع التقييمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(distribution[String(star)] ?? 0);
              const total = stats?.total || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 justify-end">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-cyan-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-12 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Ratings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">آخر التقييمات</h3>
        {ratings.map((rating: any) => (
          <Card key={rating.id} className="bg-slate-800/40 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rating.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}`} />
                      ))}
                    </div>
                  </div>
                  {rating.feedback && <p className="text-sm text-slate-400 mt-1">{rating.feedback}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{new Date(rating.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {ratings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد تقييمات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Personality Tab ────────────────────────────────────────────
function PersonalityTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [editScenario, setEditScenario] = useState<any>(null);
  const [form, setForm] = useState({
    scenarioType: "greeting_first" as "greeting_first" | "greeting_return" | "leader_respect" | "custom",
    triggerKeyword: "",
    responseTemplate: "",
    isActive: true,
  });

  const { data: scenarios = [], refetch } = trpc.personality.scenarios.list.useQuery();
  const createMut = trpc.personality.scenarios.create.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); resetForm(); toast.success("تم إنشاء السيناريو بنجاح"); },
  });
  const updateMut = trpc.personality.scenarios.update.useMutation({
    onSuccess: () => { refetch(); setEditScenario(null); resetForm(); toast.success("تم تحديث السيناريو"); },
  });
  const deleteMut = trpc.personality.scenarios.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("تم حذف السيناريو"); },
  });

  function resetForm() {
    setForm({ scenarioType: "greeting_first", triggerKeyword: "", responseTemplate: "", isActive: true });
  }

  function openEdit(s: any) {
    setEditScenario(s);
    setForm({
      scenarioType: s.scenarioType || "greeting_first",
      triggerKeyword: s.triggerKeyword || "",
      responseTemplate: s.responseTemplate || "",
      isActive: s.isActive !== false,
    });
  }

  function handleSubmit() {
    if (editScenario) {
      updateMut.mutate({ id: editScenario.id, scenarioType: form.scenarioType, triggerKeyword: form.triggerKeyword || undefined, responseTemplate: form.responseTemplate, isActive: form.isActive });
    } else {
      createMut.mutate({ scenarioType: form.scenarioType, triggerKeyword: form.triggerKeyword || undefined, responseTemplate: form.responseTemplate, isActive: form.isActive });
    }
  }

  const typeLabels: Record<string, string> = {
    greeting_first: "تحية أولى",
    greeting_return: "تحية عودة",
    leader_respect: "احترام القيادة",
    custom: "مخصص",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">سيناريوهات الشخصية</h3>
          <p className="text-sm text-slate-400">إدارة ردود وسلوكيات راصد الذكي التلقائية</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 ml-2" /> سيناريو جديد
        </Button>
      </div>

      <div className="space-y-3">
        {scenarios.map((s: any) => (
          <Card key={s.id} className="bg-slate-800/40 border-slate-700 hover:border-cyan-700/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-700">
                      {typeLabels[s.scenarioType] || s.scenarioType}
                    </Badge>
                    <Badge variant={s.isActive ? "default" : "secondary"} className="text-xs">
                      {s.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                    <p className="text-sm text-slate-300 mt-1">{s.triggerKeyword || "بدون كلمة مفتاحية"}</p>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{s.responseTemplate}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ id: s.id })}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {scenarios.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد سيناريوهات بعد</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editScenario} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditScenario(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editScenario ? "تعديل السيناريو" : "سيناريو جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">نوع السيناريو</label>
              <Select value={form.scenarioType} onValueChange={(v: "greeting_first" | "greeting_return" | "leader_respect" | "custom") => setForm({ ...form, scenarioType: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="greeting_first">تحية أولى</SelectItem>
                    <SelectItem value="greeting_return">تحية عودة</SelectItem>
                    <SelectItem value="leader_respect">احترام القيادة</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">شرط التفعيل</label>
              <Input value={form.triggerKeyword} onChange={(e) => setForm({ ...form, triggerKeyword: e.target.value })} className="bg-slate-800 border-slate-700" dir="rtl" placeholder="مثال: الملك سلمان أو رؤية 2030" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">قالب الرد</label>
              <Textarea value={form.responseTemplate} onChange={(e) => setForm({ ...form, responseTemplate: e.target.value })} className="bg-slate-800 border-slate-700 min-h-[100px]" dir="rtl" placeholder="النص الذي سيرد به راصد الذكي" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-700">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-700" disabled={createMut.isPending || updateMut.isPending}>
              {editScenario ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Training Center Page ──────────────────────────────────
export default function TrainingCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("knowledge");

  return (
    <div className="min-h-screen p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">مركز تدريب وإدارة راصد الذكي</h1>
            <p className="text-sm text-slate-400">إدارة المعرفة والسلوكيات والتدريب لراصد الذكي</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-cyan-600/20 text-cyan-400 border border-cyan-600/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "knowledge" && <KnowledgeTab />}
        {activeTab === "actions" && <ActionsTab />}
        {activeTab === "documents" && <DocumentsTab />}
        {activeTab === "feedback" && <FeedbackTab />}
        {activeTab === "personality" && <PersonalityTab />}
      </div>
    </div>
  );
}
