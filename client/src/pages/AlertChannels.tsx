import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Mail,
  Phone,
  Bell,
  Users,
  Shield,
  Plus,
  ToggleLeft,
  ToggleRight,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  sent: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-amber-400" />,
};

export default function AlertChannels() {
  const [activeTab, setActiveTab] = useState<"contacts" | "rules" | "history">("contacts");

  const { data: contacts = [], refetch: refetchContacts } = trpc.alerts.contacts.list.useQuery();
  const { data: rules = [], refetch: refetchRules } = trpc.alerts.rules.list.useQuery();
  const { data: history = [] } = trpc.alerts.history.useQuery();
  const { data: stats } = trpc.alerts.stats.useQuery();

  const toggleContact = trpc.alerts.contacts.update.useMutation({
    onSuccess: () => { refetchContacts(); toast.success("تم تحديث جهة الاتصال"); },
  });
  const toggleRule = trpc.alerts.rules.update.useMutation({
    onSuccess: () => { refetchRules(); toast.success("تم تحديث القاعدة"); },
  });
  const deleteContact = trpc.alerts.contacts.delete.useMutation({
    onSuccess: () => { refetchContacts(); toast.success("تم حذف جهة الاتصال"); },
  });
  const deleteRule = trpc.alerts.rules.delete.useMutation({
    onSuccess: () => { refetchRules(); toast.success("تم حذف القاعدة"); },
  });

  const tabs = [
    { id: "contacts" as const, label: "جهات الاتصال", labelEn: "Contacts", icon: Users, count: contacts.length },
    { id: "rules" as const, label: "قواعد التنبيه", labelEn: "Alert Rules", icon: Shield, count: rules.length },
    { id: "history" as const, label: "سجل التنبيهات", labelEn: "Alert History", icon: History, count: history.length },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
            قنوات التنبيه
          </h1>
          <p className="text-gray-400 mt-1">إدارة قنوات البريد الإلكتروني والرسائل النصية للتنبيهات</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "تنبيهات مرسلة", value: stats?.totalSent ?? 0, icon: CheckCircle, color: "text-emerald-400" },
          { label: "تنبيهات فاشلة", value: stats?.totalFailed ?? 0, icon: XCircle, color: "text-red-400" },
          { label: "قواعد نشطة", value: stats?.activeRules ?? 0, icon: Shield, color: "text-cyan-400" },
          { label: "جهات اتصال نشطة", value: stats?.activeContacts ?? 0, icon: Users, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{contact.nameAr || contact.name}</h3>
                    <p className="text-gray-400 text-sm">{contact.roleAr || contact.role}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {((contact.channels as string[]) || []).map((ch) => (
                        <span
                          key={ch}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/50"
                        >
                          {ch === "email" ? "📧 بريد" : "📱 رسالة"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleContact.mutate({ id: contact.id, isActive: !contact.isActive })}
                    className={`p-2 rounded-lg transition-all ${
                      contact.isActive
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-gray-500 bg-gray-700/30 hover:bg-gray-700/50"
                    }`}
                    title={contact.isActive ? "تعطيل" : "تفعيل"}
                  >
                    {contact.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => { if (confirm("هل أنت متأكد من حذف جهة الاتصال؟")) deleteContact.mutate({ id: contact.id }); }}
                    className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد جهات اتصال بعد</p>
            </div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{rule.nameAr || rule.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[rule.severityThreshold]}`}>
                        {rule.severityThreshold === "critical" ? "حرج" : rule.severityThreshold === "high" ? "عالي" : rule.severityThreshold === "medium" ? "متوسط" : "منخفض"} وأعلى
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/50">
                        {rule.channel === "email" ? "📧 بريد" : rule.channel === "sms" ? "📱 رسالة" : "📧📱 الكل"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {((rule.recipients as number[]) || []).length} مستلم
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule.mutate({ id: rule.id, isEnabled: !rule.isEnabled })}
                    className={`p-2 rounded-lg transition-all ${
                      rule.isEnabled
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-gray-500 bg-gray-700/30 hover:bg-gray-700/50"
                    }`}
                    title={rule.isEnabled ? "تعطيل" : "تفعيل"}
                  >
                    {rule.isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => { if (confirm("هل أنت متأكد من حذف القاعدة؟")) deleteRule.mutate({ id: rule.id }); }}
                    className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد قواعد تنبيه بعد</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-right text-xs text-gray-400 font-medium p-4">الحالة</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">المستلم</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">القناة</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">الموضوع</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">التسريب</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[entry.status]}
                        <span className="text-xs text-gray-300">
                          {entry.status === "sent" ? "مرسل" : entry.status === "failed" ? "فشل" : "قيد الانتظار"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white">{entry.contactName}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">
                        {entry.channel === "email" ? "📧 بريد" : "📱 رسالة"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-300 max-w-xs truncate">{entry.subject}</td>
                    <td className="p-4 text-sm text-cyan-400 font-mono">{entry.leakId || "—"}</td>
                    <td className="p-4 text-xs text-gray-400">
                      {entry.sentAt ? new Date(entry.sentAt).toLocaleString("ar-SA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد سجل تنبيهات بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
