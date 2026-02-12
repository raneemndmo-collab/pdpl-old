import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  Archive,
  Clock,
  Database,
  HardDrive,
  Play,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";

const entityIcons: Record<string, React.ReactNode> = {
  leaks: <Shield className="w-5 h-5 text-red-400" />,
  audit_logs: <Database className="w-5 h-5 text-blue-400" />,
  notifications: <Clock className="w-5 h-5 text-amber-400" />,
  pii_scans: <HardDrive className="w-5 h-5 text-purple-400" />,
  paste_entries: <Archive className="w-5 h-5 text-cyan-400" />,
};

export default function DataRetention() {
  const [executing, setExecuting] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: policies = [], refetch } = trpc.retention.list.useQuery();
  const updatePolicy = trpc.retention.update.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث سياسة الاحتفاظ"); },
    onError: () => toast.error("فشل تحديث السياسة"),
  });
  const executeAll = trpc.retention.execute.useMutation({
    onSuccess: (results) => {
      refetch();
      const total = results.reduce((sum, r) => sum + r.recordsProcessed, 0);
      toast.success(`تم تنفيذ السياسات: ${total} سجل تمت معالجته`);
      setExecuting(false);
    },
    onError: () => { toast.error("فشل تنفيذ السياسات"); setExecuting(false); },
  });

  const handleExecute = () => {
    if (confirm("هل أنت متأكد من تنفيذ جميع سياسات الاحتفاظ النشطة؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      setExecuting(true);
      executeAll.mutate();
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div 
          className="group cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => setActiveModal("main_header")}
        >
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <Archive className="w-6 h-6 text-purple-400" />
            </div>
            سياسات الاحتفاظ بالبيانات
          </h1>
          <p className="text-muted-foreground mt-1">إدارة قواعد الأرشفة التلقائية للحفاظ على أداء قاعدة البيانات والامتثال</p>
          <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
        </div>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground rounded-xl font-medium text-sm transition-all disabled:opacity-50"
        >
          {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          تنفيذ السياسات الآن
        </button>
      </motion.div>

      {/* Info Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-amber-200 text-sm font-medium">ملاحظة حول سياسات الاحتفاظ</p>
          <p className="text-amber-200/70 text-xs mt-1">
            السياسات المفعّلة ستقوم تلقائياً بحذف أو أرشفة السجلات القديمة وفقاً لفترة الاحتفاظ المحددة.
            تأكد من مراجعة الإعدادات قبل التفعيل. يتم تنفيذ السياسات يدوياً عند الضغط على "تنفيذ السياسات الآن".
          </p>
        </div>
      </motion.div>

      {/* Policies Grid */}
      <div className="grid gap-4">
        {policies.map((policy, idx) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`bg-secondary/60 backdrop-blur border rounded-xl p-6 transition-all ${
              policy.isEnabled ? "border-purple-500/30 hover:border-purple-500/50" : "border-border hover:border-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  policy.isEnabled
                    ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30"
                    : "bg-border/30 border border-border"
                }`}>
                  {entityIcons[policy.entity] || <Database className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <div 
                    className="group cursor-pointer hover:scale-[1.02] transition-all"
                    onClick={() => setActiveModal(`policy_${policy.id}_title`)}
                  >
                    <h3 className="text-foreground font-semibold text-lg">{policy.entityLabelAr}</h3>
                    <p className="text-muted-foreground text-sm">{policy.entityLabel}</p>
                    <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    {/* Retention Days */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">فترة الاحتفاظ:</span>
                      <select
                        value={policy.retentionDays}
                        onChange={(e) => updatePolicy.mutate({ id: policy.id, retentionDays: Number(e.target.value) })}
                        className="bg-border/50 border border-border rounded-lg px-2 py-1 text-sm text-foreground"
                      >
                        <option value={30}>30 يوم</option>
                        <option value={90}>90 يوم</option>
                        <option value={180}>180 يوم</option>
                        <option value={365}>سنة</option>
                        <option value={730}>سنتين</option>
                        <option value={1095}>3 سنوات</option>
                      </select>
                    </div>

                    {/* Archive Action */}
                    <div className="flex items-center gap-2">
                      {policy.archiveAction === "delete" ? (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      ) : (
                        <Archive className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-sm text-foreground">الإجراء:</span>
                      <select
                        value={policy.archiveAction}
                        onChange={(e) => updatePolicy.mutate({ id: policy.id, archiveAction: e.target.value as "delete" | "archive" })}
                        className="bg-border/50 border border-border rounded-lg px-2 py-1 text-sm text-foreground"
                      >
                        <option value="archive">أرشفة</option>
                        <option value="delete">حذف</option>
                      </select>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {policy.lastRunAt && (
                      <div 
                        className="group cursor-pointer hover:scale-[1.02] transition-all flex items-center gap-1"
                        onClick={() => setActiveModal(`policy_${policy.id}_lastrun`)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        آخر تنفيذ: {new Date(policy.lastRunAt).toLocaleString("ar-SA")}
                        <p className="text-[9px] text-primary/50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                      </div>
                    )}
                    <div 
                      className="group cursor-pointer hover:scale-[1.02] transition-all flex items-center gap-1"
                      onClick={() => setActiveModal(`policy_${policy.id}_records`)}
                    >
                      <Database className="w-3 h-3" />
                      {policy.recordsArchived?.toLocaleString() ?? 0} سجل تمت معالجته
                      <p className="text-[9px] text-primary/50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => updatePolicy.mutate({ id: policy.id, isEnabled: !policy.isEnabled })}
                className={`p-2 rounded-lg transition-all ${
                  policy.isEnabled
                    ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "text-muted-foreground bg-border/30 hover:bg-border/50"
                }`}
                title={policy.isEnabled ? "تعطيل" : "تفعيل"}
              >
                {policy.isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
            <DetailModal
              open={activeModal === `policy_${policy.id}_title`}
              onClose={() => setActiveModal(null)}
              title={`تفاصيل سياسة: ${policy.entityLabelAr}`}
              icon={entityIcons[policy.entity] || <Database />}
            >
              <p>هذه السياسة تدير الاحتفاظ بالبيانات لنوع السجلات: {policy.entityLabelAr}.</p>
              <p>الإعداد الحالي هو الاحتفاظ بالبيانات لمدة {policy.retentionDays} يومًا، ثم يتم {policy.archiveAction === "delete" ? "حذفها" : "أرشفتها"}.</p>
            </DetailModal>
            <DetailModal
              open={activeModal === `policy_${policy.id}_lastrun`}
              onClose={() => setActiveModal(null)}
              title="تفاصيل آخر تنفيذ"
              icon={<CheckCircle />}
            >
              <p>تم تنفيذ هذه السياسة آخر مرة في: {policy.lastRunAt ? new Date(policy.lastRunAt).toLocaleString("ar-SA") : "لم تنفذ بعد"}.</p>
              <p>يقوم التنفيذ بمعالجة السجلات التي انتهت فترة احتفاظها.</p>
            </DetailModal>
            <DetailModal
              open={activeModal === `policy_${policy.id}_records`}
              onClose={() => setActiveModal(null)}
              title="تفاصيل السجلات المعالجة"
              icon={<Database />}
            >
              <p>مجموع السجلات التي تمت معالجتها بواسطة هذه السياسة هو: {policy.recordsArchived?.toLocaleString() ?? 0}.</p>
              <p>هذا العدد يمثل إجمالي السجلات التي تم حذفها أو أرشفتها منذ إنشاء السياسة.</p>
            </DetailModal>
          </motion.div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد سياسات احتفاظ بعد</p>
        </div>
      )}

      <DetailModal
        open={activeModal === "main_header"}
        onClose={() => setActiveModal(null)}
        title="حول سياسات الاحتفاظ بالبيانات"
        icon={<Archive />}
      >
        <p>تساعد سياسات الاحتفاظ بالبيانات على إدارة دورة حياة بياناتك تلقائيًا. يمكنك تعيين قواعد لأرشفة أو حذف السجلات القديمة للحفاظ على أداء قاعدة البيانات والامتثال للوائح.</p>
        <p>يمكنك تفعيل أو تعطيل كل سياسة على حدة، وتحديد فترة الاحتفاظ والإجراء المطلوب (حذف أو أرشفة).</p>
      </DetailModal>
    </div>
  );
}
