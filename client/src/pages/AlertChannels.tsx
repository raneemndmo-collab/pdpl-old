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
import { DetailModal } from "@/components/DetailModal";
import LeakDetailDrilldown from "@/components/LeakDetailDrilldown";

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
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [drillLeakId, setDrillLeakId] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
            قنوات التنبيه
          </h1>
          <p className="text-muted-foreground mt-1">إدارة قنوات البريد الإلكتروني والرسائل النصية للتنبيهات</p>
        </div>
      </div>

      {/* Stats Cards — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "sent", label: "تنبيهات مرسلة", value: stats?.totalSent ?? 0, icon: CheckCircle, color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
          { key: "failed", label: "تنبيهات فاشلة", value: stats?.totalFailed ?? 0, icon: XCircle, color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/5" },
          { key: "activeRules", label: "قواعد نشطة", value: stats?.activeRules ?? 0, icon: Shield, color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
          { key: "activeContacts", label: "جهات اتصال نشطة", value: stats?.activeContacts ?? 0, icon: Users, color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
        ].map((stat) => (
          <div
            key={stat.key}
            className={`${stat.bgColor} backdrop-blur border ${stat.borderColor} rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group`}
            onClick={() => setActiveModal(stat.key)}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</div>
            <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="text-xs bg-border/50 px-2 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-secondary/60 backdrop-blur border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => { setSelectedEntry(contact); setActiveModal("contactDetail"); }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">{contact.nameAr || contact.name}</h3>
                    <p className="text-muted-foreground text-sm">{contact.roleAr || contact.role}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {((contact.channels as string[]) || []).map((ch) => (
                        <span key={ch} className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-foreground border border-border">
                          {ch === "email" ? "بريد إلكتروني" : "رسالة نصية"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleContact.mutate({ id: contact.id, isActive: !contact.isActive })}
                    className={`p-2 rounded-lg transition-all ${
                      contact.isActive
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-muted-foreground bg-border/30 hover:bg-border/50"
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
            <div className="text-center py-12 text-muted-foreground">
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
              className="bg-secondary/60 backdrop-blur border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => { setSelectedEntry(rule); setActiveModal("ruleDetail"); }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">{rule.nameAr || rule.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[rule.severityThreshold]}`}>
                        {rule.severityThreshold === "critical" ? "واسع النطاق" : rule.severityThreshold === "high" ? "مرتفع" : rule.severityThreshold === "medium" ? "متوسط" : "محدود"} وأعلى
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-foreground border border-border">
                        {rule.channel === "email" ? "بريد" : rule.channel === "sms" ? "رسالة" : "الكل"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {((rule.recipients as number[]) || []).length} مستلم
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleRule.mutate({ id: rule.id, isEnabled: !rule.isEnabled })}
                    className={`p-2 rounded-lg transition-all ${
                      rule.isEnabled
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-muted-foreground bg-border/30 hover:bg-border/50"
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
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد قواعد تنبيه بعد</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab — clickable rows */}
      {activeTab === "history" && (
        <div className="bg-secondary/60 backdrop-blur border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">الحالة</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">المستلم</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">القناة</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">الموضوع</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">التسريب</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-4">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => { setSelectedEntry(entry); setActiveModal("historyDetail"); }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[entry.status]}
                        <span className="text-xs text-foreground">
                          {entry.status === "sent" ? "مرسل" : entry.status === "failed" ? "فشل" : "قيد الانتظار"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{entry.contactName}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-foreground">
                        {entry.channel === "email" ? "بريد" : "رسالة"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground max-w-xs truncate">{entry.subject}</td>
                    <td className="p-4 text-sm text-cyan-400 font-mono">{entry.leakId || "—"}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {entry.sentAt ? new Date(entry.sentAt).toLocaleString("ar-SA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد سجل تنبيهات بعد</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Sent Alerts Modal */}
      <DetailModal open={activeModal === "sent"} onClose={() => setActiveModal(null)} title="التنبيهات المرسلة بنجاح" icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}>
        <div className="space-y-3">
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats?.totalSent ?? 0}</p>
            <p className="text-xs text-muted-foreground">تنبيه مرسل بنجاح</p>
          </div>
          {history.filter(h => h.status === "sent").slice(0, 10).map(entry => (
            <div key={entry.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-sm text-foreground">{entry.subject}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{entry.contactName} • {entry.sentAt ? new Date(entry.sentAt).toLocaleString("ar-SA") : "—"}</p>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Failed Alerts Modal */}
      <DetailModal open={activeModal === "failed"} onClose={() => setActiveModal(null)} title="التنبيهات الفاشلة" icon={<XCircle className="w-5 h-5 text-red-400" />}>
        <div className="space-y-3">
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
            <p className="text-2xl font-bold text-red-400">{stats?.totalFailed ?? 0}</p>
            <p className="text-xs text-muted-foreground">تنبيه فاشل</p>
          </div>
          {history.filter(h => h.status === "failed").slice(0, 10).map(entry => (
            <div key={entry.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-3 h-3 text-red-400" />
                <span className="text-sm text-foreground">{entry.subject}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{entry.contactName} • {entry.sentAt ? new Date(entry.sentAt).toLocaleString("ar-SA") : "—"}</p>
            </div>
          ))}
          {history.filter(h => h.status === "failed").length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد تنبيهات فاشلة</p>
          )}
        </div>
      </DetailModal>

      {/* Active Rules Modal */}
      <DetailModal open={activeModal === "activeRules"} onClose={() => setActiveModal(null)} title="القواعد النشطة" icon={<Shield className="w-5 h-5 text-cyan-400" />}>
        <div className="space-y-3">
          {rules.filter(r => r.isEnabled).map(rule => (
            <div key={rule.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground">{rule.nameAr || rule.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${severityColors[rule.severityThreshold]}`}>
                  {rule.severityThreshold === "critical" ? "واسع النطاق" : rule.severityThreshold === "high" ? "مرتفع" : "متوسط"} وأعلى
                </span>
                <span className="text-[10px] text-muted-foreground">{((rule.recipients as number[]) || []).length} مستلم</span>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Active Contacts Modal */}
      <DetailModal open={activeModal === "activeContacts"} onClose={() => setActiveModal(null)} title="جهات الاتصال النشطة" icon={<Users className="w-5 h-5 text-amber-400" />}>
        <div className="space-y-3">
          {contacts.filter(c => c.isActive).map(contact => (
            <div key={contact.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{contact.nameAr || contact.name}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.roleAr || contact.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {contact.email && <span className="text-[10px] text-muted-foreground">{contact.email}</span>}
                    {contact.phone && <span className="text-[10px] text-muted-foreground">{contact.phone}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* Contact Detail Modal */}
      <DetailModal
        open={activeModal === "contactDetail" && !!selectedEntry}
        onClose={() => { setActiveModal(null); setSelectedEntry(null); }}
        title={selectedEntry?.nameAr || selectedEntry?.name || "تفاصيل جهة الاتصال"}
        icon={<Users className="w-5 h-5 text-cyan-400" />}
      >
        {selectedEntry && activeModal === "contactDetail" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedEntry.nameAr || selectedEntry.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedEntry.roleAr || selectedEntry.role}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded border mt-1 inline-block ${
                  selectedEntry.isActive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-red-400 bg-red-500/10 border-red-500/30"
                }`}>{selectedEntry.isActive ? "نشط" : "غير نشط"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">البريد الإلكتروني</p>
                <p className="text-sm text-foreground">{selectedEntry.email || "—"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">رقم الجوال</p>
                <p className="text-sm text-foreground font-mono">{selectedEntry.phone || "—"}</p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2">قنوات التنبيه</p>
              <div className="flex gap-2">
                {((selectedEntry.channels as string[]) || []).map((ch: string) => (
                  <span key={ch} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {ch === "email" ? "بريد إلكتروني" : "رسالة نصية"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailModal>

      {/* Rule Detail Modal */}
      <DetailModal
        open={activeModal === "ruleDetail" && !!selectedEntry}
        onClose={() => { setActiveModal(null); setSelectedEntry(null); }}
        title={selectedEntry?.nameAr || selectedEntry?.name || "تفاصيل القاعدة"}
        icon={<Zap className="w-5 h-5 text-amber-400" />}
      >
        {selectedEntry && activeModal === "ruleDetail" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الحد الأدنى للتأثير</p>
                <span className={`text-sm font-bold mt-1 inline-block px-2 py-0.5 rounded border ${severityColors[selectedEntry.severityThreshold]}`}>
                  {selectedEntry.severityThreshold === "critical" ? "واسع النطاق" : selectedEntry.severityThreshold === "high" ? "مرتفع" : "متوسط"}
                </span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">القناة</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {selectedEntry.channel === "email" ? "بريد" : selectedEntry.channel === "sms" ? "رسالة" : "الكل"}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">المستلمين</p>
                <p className="text-sm font-bold text-foreground mt-1">{((selectedEntry.recipients as number[]) || []).length}</p>
              </div>
            </div>
            <div className={`rounded-xl p-3 border ${selectedEntry.isEnabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <p className={`text-sm font-medium ${selectedEntry.isEnabled ? "text-emerald-400" : "text-red-400"}`}>
                {selectedEntry.isEnabled ? "القاعدة مفعّلة وتعمل" : "القاعدة معطّلة"}
              </p>
            </div>
          </div>
        )}
      </DetailModal>

      {/* History Detail Modal */}
      <DetailModal
        open={activeModal === "historyDetail" && !!selectedEntry}
        onClose={() => { setActiveModal(null); setSelectedEntry(null); }}
        title="تفاصيل التنبيه"
        icon={<History className="w-5 h-5 text-primary" />}
      >
        {selectedEntry && activeModal === "historyDetail" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {statusIcons[selectedEntry.status]}
                  <span className="text-sm font-bold text-foreground">
                    {selectedEntry.status === "sent" ? "مرسل" : selectedEntry.status === "failed" ? "فشل" : "قيد الانتظار"}
                  </span>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">المستلم</p>
                <p className="text-sm font-bold text-foreground mt-1">{selectedEntry.contactName}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">القناة</p>
                <p className="text-sm font-bold text-foreground mt-1">{selectedEntry.channel === "email" ? "بريد" : "رسالة"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {selectedEntry.sentAt ? new Date(selectedEntry.sentAt).toLocaleString("ar-SA") : "—"}
                </p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">الموضوع</h4>
              <p className="text-sm text-foreground">{selectedEntry.subject}</p>
            </div>
            {selectedEntry.leakId && (
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setDrillLeakId(selectedEntry.leakId)}>
                <p className="text-xs text-muted-foreground">التسريب المرتبط</p>
                <p className="text-sm font-mono text-primary mt-1">{selectedEntry.leakId}</p>
                <p className="text-[10px] text-primary/60 mt-1">اضغط لعرض تفاصيل التسريب</p>
              </div>
            )}
          </div>
        )}
      </DetailModal>
      <LeakDetailDrilldown leak={drillLeakId ? { leakId: drillLeakId } : null} open={!!drillLeakId} onClose={() => setDrillLeakId(null)} />
    </div>
  );
}
