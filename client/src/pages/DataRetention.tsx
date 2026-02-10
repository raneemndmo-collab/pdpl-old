import { useState } from "react";
import { trpc } from "@/lib/trpc";
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

const entityIcons: Record<string, React.ReactNode> = {
  leaks: <Shield className="w-5 h-5 text-red-400" />,
  audit_logs: <Database className="w-5 h-5 text-blue-400" />,
  notifications: <Clock className="w-5 h-5 text-amber-400" />,
  pii_scans: <HardDrive className="w-5 h-5 text-purple-400" />,
  paste_entries: <Archive className="w-5 h-5 text-cyan-400" />,
};

export default function DataRetention() {
  const [executing, setExecuting] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <Archive className="w-6 h-6 text-purple-400" />
            </div>
            سياسات الاحتفاظ بالبيانات
          </h1>
          <p className="text-gray-400 mt-1">إدارة قواعد الأرشفة التلقائية للحفاظ على أداء قاعدة البيانات والامتثال</p>
        </div>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50"
        >
          {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          تنفيذ السياسات الآن
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-amber-200 text-sm font-medium">ملاحظة حول سياسات الاحتفاظ</p>
          <p className="text-amber-200/70 text-xs mt-1">
            السياسات المفعّلة ستقوم تلقائياً بحذف أو أرشفة السجلات القديمة وفقاً لفترة الاحتفاظ المحددة.
            تأكد من مراجعة الإعدادات قبل التفعيل. يتم تنفيذ السياسات يدوياً عند الضغط على "تنفيذ السياسات الآن".
          </p>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid gap-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className={`bg-gray-800/60 backdrop-blur border rounded-xl p-6 transition-all ${
              policy.isEnabled ? "border-purple-500/30 hover:border-purple-500/50" : "border-gray-700/50 hover:border-gray-600/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  policy.isEnabled
                    ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30"
                    : "bg-gray-700/30 border border-gray-600/50"
                }`}>
                  {entityIcons[policy.entity] || <Database className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{policy.entityLabelAr}</h3>
                  <p className="text-gray-400 text-sm">{policy.entityLabel}</p>

                  <div className="flex items-center gap-4 mt-3">
                    {/* Retention Days */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-300">فترة الاحتفاظ:</span>
                      <select
                        value={policy.retentionDays}
                        onChange={(e) => updatePolicy.mutate({ id: policy.id, retentionDays: Number(e.target.value) })}
                        className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-sm text-white"
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
                      <span className="text-sm text-gray-300">الإجراء:</span>
                      <select
                        value={policy.archiveAction}
                        onChange={(e) => updatePolicy.mutate({ id: policy.id, archiveAction: e.target.value as "delete" | "archive" })}
                        className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-sm text-white"
                      >
                        <option value="archive">أرشفة</option>
                        <option value="delete">حذف</option>
                      </select>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {policy.lastRunAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        آخر تنفيذ: {new Date(policy.lastRunAt).toLocaleString("ar-SA")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {policy.recordsArchived?.toLocaleString() ?? 0} سجل تمت معالجته
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => updatePolicy.mutate({ id: policy.id, isEnabled: !policy.isEnabled })}
                className={`p-2 rounded-lg transition-all ${
                  policy.isEnabled
                    ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "text-gray-500 bg-gray-700/30 hover:bg-gray-700/50"
                }`}
                title={policy.isEnabled ? "تعطيل" : "تفعيل"}
              >
                {policy.isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد سياسات احتفاظ بعد</p>
        </div>
      )}
    </div>
  );
}
