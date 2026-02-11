/**
 * ApiKeys — API Key Management for external SIEM/SOC integrations
 * Admin-only page for creating, managing, and revoking API keys
 */
import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Code2,
  Terminal,
  Info,
  Fingerprint,
  CalendarDays,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DetailModal } from "@/components/DetailModal";

export default function ApiKeys() {
  const { data, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const keys = Array.isArray(data) ? data : (data as any)?.keys ?? [];
  const stats = Array.isArray(data) ? null : (data as any)?.stats;
  const { data: permissions } = trpc.apiKeys.permissions.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      refetch();
      setNewKey(data.rawKey);
      setShowCreate(false);
      toast.success("تم إنشاء مفتاح API بنجاح");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.apiKeys.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم تحديث المفتاح");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم حذف المفتاح");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    permissions: [] as string[],
    rateLimit: 1000,
    expiresAt: "",
  });

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            إدارة مفاتيح API للتكامل مع أنظمة SIEM و SOC الخارجية
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setShowDocs(!showDocs)}
          >
            <Code2 className="w-3.5 h-3.5" />
            {showDocs ? "إخفاء التوثيق" : "توثيق API"}
          </Button>
          <Button
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            مفتاح جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="المفاتيح النشطة"
          value={stats?.activeKeys ?? 0}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          onClick={() => setActiveModal("activeKeys")}
        />
        <StatCard
          title="المفاتيح المعطلة"
          value={stats?.disabledKeys ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          onClick={() => setActiveModal("disabledKeys")}
        />
        <StatCard
          title="إجمالي الطلبات (24 ساعة)"
          value={stats?.totalRequests24h ?? 0}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          onClick={() => setActiveModal("totalRequests")}
        />
        <StatCard
          title="متوسط الصلاحيات"
          value={`${(stats?.avgPermissionsPerKey ?? 0).toFixed(1)}`}
          icon={<Shield className="w-5 h-5 text-amber-500" />}
          onClick={() => setActiveModal("avgPermissions")}
        />
      </div>

      {/* New Key Display */}
      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-400 mb-1">مفتاح API الجديد — احفظه الآن!</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  لن يتم عرض هذا المفتاح مرة أخرى. انسخه واحفظه في مكان آمن.
                </p>
                <div className="flex items-center gap-2 bg-background/80 rounded-lg p-3 font-mono text-xs text-foreground break-all">
                  <code className="flex-1">{newKey}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(newKey);
                      toast.success("تم نسخ المفتاح");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-amber-400"
                  onClick={() => setNewKey(null)}
                >
                  تم الحفظ — إغلاق
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Documentation */}
      <AnimatePresence>
        {showDocs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              توثيق API — أمثلة الاستخدام
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">المصادقة — أضف المفتاح في ترويسة Authorization:</p>
                <pre className="bg-background rounded-lg p-3 text-xs text-cyan-400 font-mono overflow-x-auto" dir="ltr">
{`curl -H "Authorization: Bearer ndmo_your_api_key_here" \\
  https://your-domain.manus.space/api/v1/leaks`}
                </pre>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">جلب التسريبات:</p>
                <pre className="bg-background rounded-lg p-3 text-xs text-cyan-400 font-mono overflow-x-auto" dir="ltr">
{`GET /api/v1/leaks
GET /api/v1/leaks?severity=critical
GET /api/v1/leaks?source=telegram`}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-6"
          >
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              إنشاء مفتاح API جديد
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">اسم المفتاح</label>
                  <input
                    type="text"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="SIEM Integration Key"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">حد الطلبات / يوم</label>
                  <input
                    type="number"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    value={form.rateLimit}
                    onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) || 1000 })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">الصلاحيات</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {permissions?.map((perm) => (
                    <button
                      key={perm.id}
                      className={`p-2 rounded-lg border text-xs text-right transition-colors ${
                        form.permissions.includes(perm.id)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:border-border"
                      }`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <p className="font-medium">{perm.labelAr}</p>
                      <p className="text-[10px] opacity-70">{perm.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>إلغاء</Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => createMutation.mutate({
                    ...form,
                    expiresAt: form.expiresAt || null,
                  })}
                  disabled={!form.name || form.permissions.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  إنشاء المفتاح
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      <div className="space-y-4">
        {keys?.map((key: any) => (
          <ApiKeyCard
            key={key.id}
            apiKey={key}
            onUpdate={updateMutation.mutate}
            onDelete={deleteMutation.mutate}
            onViewDetails={() => setActiveModal(`key_${key.id}`)}
          />
        ))}
      </div>

      {/* Modals */}
      <DetailModal
        open={activeModal === "activeKeys"}
        onClose={() => setActiveModal(null)}
        title="المفاتيح النشطة"
        icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
      >
        <p className="text-sm text-muted-foreground">هذه هي عدد مفاتيح API التي تم تفعيلها حاليًا ويمكنها الوصول إلى النظام. المفاتيح النشطة قادرة على إجراء طلبات API وفقًا للصلاحيات الممنوحة لها.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "disabledKeys"}
        onClose={() => setActiveModal(null)}
        title="المفاتيح المعطلة"
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      >
        <p className="text-sm text-muted-foreground">هذه هي عدد مفاتيح API التي تم تعطيلها. لا يمكن للمفاتيح المعطلة إجراء أي طلبات API حتى يتم إعادة تفعيلها.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "totalRequests"}
        onClose={() => setActiveModal(null)}
        title="إجمالي الطلبات (24 ساعة)"
        icon={<Activity className="w-6 h-6 text-blue-500" />}
      >
        <p className="text-sm text-muted-foreground">يمثل هذا العدد الإجمالي لطلبات API التي تم إجراؤها بواسطة جميع المفاتيح خلال الـ 24 ساعة الماضية. يساعد هذا المقياس في مراقبة استخدام النظام واكتشاف أي نشاط غير عادي.</p>
      </DetailModal>
      <DetailModal
        open={activeModal === "avgPermissions"}
        onClose={() => setActiveModal(null)}
        title="متوسط الصلاحيات لكل مفتاح"
        icon={<Shield className="w-6 h-6 text-amber-500" />}
      >
        <p className="text-sm text-muted-foreground">هذا هو متوسط عدد الصلاحيات الممنوحة لكل مفتاح API. يمكن أن يشير الرقم الأعلى إلى أن المفاتيح لديها صلاحيات واسعة، مما قد يستدعي مراجعة أمنية لضمان تطبيق مبدأ الامتياز الأقل.</p>
      </DetailModal>

      {keys?.map((key: any) => (
        <DetailModal
          key={`modal_${key.id}`}
          open={activeModal === `key_${key.id}`}
          onClose={() => setActiveModal(null)}
          title={`تفاصيل المفتاح: ${key.name}`}
          icon={<KeyRound className="w-6 h-6 text-primary" />}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">معرف المفتاح:</span>
              <span className="font-mono text-xs">{key.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">تاريخ الإنشاء:</span>
              <span>{new Date(key.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">آخر استخدام:</span>
              <span>{key.lastUsed ? new Date(key.lastUsed).toLocaleString('ar-SA') : 'لم يستخدم بعد'}</span>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /> الصلاحيات الممنوحة:</h4>
              <div className="flex flex-wrap gap-2">
                {key.permissions.map((p: string) => <span key={p} className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">{p}</span>)}
              </div>
            </div>
          </div>
        </DetailModal>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon, onClick }: { title: string; value: string | number; icon: ReactNode; onClick: () => void; }) {
  return (
    <div 
      className="bg-card/50 border border-border/50 rounded-xl p-4 group cursor-pointer hover:scale-[1.02] transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
    </div>
  );
}

function ApiKeyCard({ apiKey, onUpdate, onDelete, onViewDetails }: {
  apiKey: any;
  onUpdate: (args: { id: number, enabled: boolean }) => void;
  onDelete: (args: { id: number }) => void;
  onViewDetails: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div 
      className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-4 group cursor-pointer hover:border-primary/40 transition-colors"
      onClick={onViewDetails}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${apiKey.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="font-mono text-sm text-foreground">{apiKey.name}</p>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button
            variant={apiKey.enabled ? "outline" : "default"}
            size="sm"
            className="text-xs h-8"
            onClick={() => onUpdate({ id: apiKey.id, enabled: !apiKey.enabled })}
          >
            {apiKey.enabled ? "تعطيل" : "تفعيل"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="text-xs h-8"
            onClick={() => onDelete({ id: apiKey.id })}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Key Value */}
      <div className="flex items-center gap-2 bg-background/80 rounded-lg p-3 font-mono text-xs text-muted-foreground" onClick={e => e.stopPropagation()}>
        <code className="flex-1">
          {revealed ? apiKey.id : `${apiKey.id.substring(0, 4)}****************${apiKey.id.substring(apiKey.id.length - 4)}`}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            navigator.clipboard.writeText(apiKey.id);
            toast.success("تم نسخ المعرف");
          }}
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-left">اضغط لعرض التفاصيل ←</p>
    </div>
  );
}
