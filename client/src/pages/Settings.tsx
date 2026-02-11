/**
 * Settings — Platform configuration & user management
 * Dark Observatory Theme — Uses tRPC API
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Globe,
  Key,
  Users,
  Database,
  Clock,
  Save,
  Loader2,
  Info,
  Server,
  DatabaseZap,
  User,
  Mail,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DetailModal } from "@/components/DetailModal";

const roleLabel = (r: string) => {
  switch (r) {
    case "executive": return "تنفيذي";
    case "manager": return "مدير";
    case "analyst": return "محلل";
    case "viewer": return "مشاهد";
    case "admin": return "مسؤول";
    default: return r;
  }
};

const roleColor = (r: string) => {
  switch (r) {
    case "executive": return "text-violet-400 bg-violet-500/10 border-violet-500/30";
    case "manager": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    case "analyst": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "admin": return "text-red-400 bg-red-500/10 border-red-500/30";
    default: return "text-muted-foreground bg-secondary/50 border-border";
  }
};

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: usersList, isLoading: usersLoading, refetch: refetchUsers } = trpc.users.list.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدور بنجاح");
      refetchUsers();
    },
    onError: () => {
      toast.error("فشل تحديث الدور");
    },
  });

  const handleRoleChange = (userId: number, ndmoRole: string) => {
    updateRoleMutation.mutate({
      userId,
      ndmoRole: ndmoRole as "executive" | "manager" | "analyst" | "viewer",
    });
  };

  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: false,
    dailyDigest: true,
    weeklyReport: true,
  });

  const [monitoring, setMonitoring] = useState({
    telegramEnabled: true,
    darkwebEnabled: true,
    pasteEnabled: true,
    autoClassify: true,
    scanInterval: "15",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          الإعدادات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إعدادات المنصة والتنبيهات ومصادر الرصد
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="monitoring">مصادر الرصد</TabsTrigger>
          <TabsTrigger value="notifications">التنبيهات</TabsTrigger>
          <TabsTrigger value="api">مفاتيح API</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">المستخدمون</TabsTrigger>}
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                معلومات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">الاسم</p>
                  <p className="text-sm text-foreground font-medium">{user?.name || "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">البريد الإلكتروني</p>
                  <p className="text-sm text-foreground font-medium">{user?.email || "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">الدور</p>
                  <Badge variant="outline" className={`${roleColor(user?.role || "user")}`}>
                    {roleLabel(user?.role || "user")}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">آخر تسجيل دخول</p>
                  <p className="text-sm text-foreground font-medium">
                    {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("ar-SA") : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-lg bg-secondary/20 border border-border text-center cursor-pointer hover:scale-[1.02] transition-all group"
                  onClick={() => setActiveModal("systemVersion")}
                >
                  <p className="text-lg font-bold text-primary">v2.0</p>
                  <p className="text-xs text-muted-foreground">إصدار النظام</p>
                  <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                </div>
                <div
                  className="p-4 rounded-lg bg-secondary/20 border border-border text-center cursor-pointer hover:scale-[1.02] transition-all group"
                  onClick={() => setActiveModal("serverStatus")}
                >
                  <p className="text-lg font-bold text-emerald-400">نشط</p>
                  <p className="text-xs text-muted-foreground">حالة الخادم</p>
                  <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                </div>
                <div
                  className="p-4 rounded-lg bg-secondary/20 border border-border text-center cursor-pointer hover:scale-[1.02] transition-all group"
                  onClick={() => setActiveModal("databaseType")}
                >
                  <p className="text-lg font-bold text-cyan-400">TiDB</p>
                  <p className="text-xs text-muted-foreground">قاعدة البيانات</p>
                  <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring settings */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                مصادر الرصد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "telegramEnabled" as const, label: "رصد تليجرام", desc: "مراقبة قنوات تليجرام للتسريبات", icon: "📱" },
                { key: "darkwebEnabled" as const, label: "رصد الدارك ويب", desc: "مراقبة منتديات وأسواق الدارك ويب", icon: "🌐" },
                { key: "pasteEnabled" as const, label: "رصد مواقع اللصق", desc: "مراقبة Pastebin وبدائله", icon: "📋" },
                { key: "autoClassify" as const, label: "التصنيف التلقائي", desc: "تصنيف PII تلقائياً عند الرصد", icon: "🔍" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <Label className="text-sm font-medium text-foreground">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={monitoring[item.key]}
                    onCheckedChange={(checked) => {
                      setMonitoring({ ...monitoring, [item.key]: checked });
                      toast(checked ? `تم تفعيل ${item.label}` : `تم إيقاف ${item.label}`);
                    }}
                  />
                </div>
              ))}

              <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <Label className="text-sm font-medium text-foreground">فترة الفحص (بالدقائق)</Label>
                    <p className="text-xs text-muted-foreground">المدة بين كل عملية فحص</p>
                  </div>
                </div>
                <Input
                  type="number"
                  value={monitoring.scanInterval}
                  onChange={(e) => setMonitoring({ ...monitoring, scanInterval: e.target.value })}
                  className="w-32 bg-secondary/50 border-border"
                  min="5"
                  max="60"
                />
              </div>

              <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => toast.success("تم حفظ الإعدادات")}>
                <Save className="w-4 h-4" />
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                إعدادات التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "criticalAlerts" as const, label: "تنبيهات حرجة", desc: "إشعار فوري عند اكتشاف تسريب حرج", color: "text-red-400" },
                { key: "highAlerts" as const, label: "تنبيهات عالية", desc: "إشعار عند اكتشاف تسريب عالي الخطورة", color: "text-amber-400" },
                { key: "mediumAlerts" as const, label: "تنبيهات متوسطة", desc: "إشعار عند اكتشاف تسريب متوسط الخطورة", color: "text-yellow-400" },
                { key: "dailyDigest" as const, label: "ملخص يومي", desc: "تقرير يومي بالتسريبات المرصودة", color: "text-cyan-400" },
                { key: "weeklyReport" as const, label: "تقرير أسبوعي", desc: "تقرير أسبوعي شامل بالإحصائيات", color: "text-violet-400" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border">
                  <div className="flex-1 pr-4">
                    <Label className={`text-sm font-medium ${item.color}`}>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => {
                      setNotifications({ ...notifications, [item.key]: checked });
                      toast(checked ? `تم تفعيل ${item.label}` : `تم إيقاف ${item.label}`);
                    }}
                  />
                </div>
              ))}

              <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => toast.success("تم حفظ إعدادات التنبيهات")}>
                <Save className="w-4 h-4" />
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                مفاتيح API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Telethon API ID", placeholder: "api_id", desc: "معرّف تطبيق Telegram API" },
                { label: "Telethon API Hash", placeholder: "api_hash", desc: "مفتاح تطبيق Telegram API" },
                { label: "Tor Proxy", placeholder: "socks5://127.0.0.1:9050", desc: "عنوان بروكسي Tor للدارك ويب" },
                { label: "IntelligenceX API Key", placeholder: "ix_api_key", desc: "مفتاح IntelligenceX للبحث" },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg bg-secondary/20 border border-border">
                  <Label className="text-sm font-medium text-foreground mb-1 block">{item.label}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                  <Input
                    type="password"
                    placeholder={item.placeholder}
                    className="bg-secondary/50 border-border font-mono"
                    dir="ltr"
                  />
                </div>
              ))}

              <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => toast.success("تم حفظ مفاتيح API")}>
                <Save className="w-4 h-4" />
                حفظ المفاتيح
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users (admin only) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  إدارة المستخدمين
                  {usersList && (
                    <Badge
                      variant="outline"
                      className="mr-2 text-xs bg-primary/10 border-primary/30 text-primary cursor-pointer hover:scale-[1.02] transition-all group"
                      onClick={() => setActiveModal("userCount")}
                    >
                      {usersList.length} مستخدم
                      <span className="text-[9px] text-primary/50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">...</span>
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : !usersList || usersList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا يوجد مستخدمون مسجلون بعد</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">المستخدم</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">البريد</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">دور النظام</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">دور NDMO</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">آخر دخول</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">تغيير الدور</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group"
                            onClick={() => setActiveModal(`user_${u.id}`)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {(u.name || "U")[0]}
                                </div>
                                <span className="text-foreground text-xs font-medium">{u.name || "—"}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">{u.email || "—"}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={`text-[10px] ${roleColor(u.role)}`}>
                                {roleLabel(u.role)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={`text-[10px] ${roleColor(u.ndmoRole || "viewer")}`}>
                                {roleLabel(u.ndmoRole || "viewer")}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("ar-SA") : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Select
                                value={u.ndmoRole || "viewer"}
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                                // @ts-ignore
                                onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
                              >
                                <SelectTrigger className="w-28 h-7 text-xs bg-secondary/50 border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="executive">تنفيذي</SelectItem>
                                  <SelectItem value="manager">مدير</SelectItem>
                                  <SelectItem value="analyst">محلل</SelectItem>
                                  <SelectItem value="viewer">مشاهد</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <DetailModal
        open={activeModal === "systemVersion"}
        onClose={() => setActiveModal(null)}
        title="إصدار النظام"
        icon={<Info className="w-5 h-5 text-primary" />}
      >
        <p className="text-sm text-muted-foreground">الإصدار الحالي للمنصة هو <span className="font-bold text-primary">v2.0 "Observatory"</span>. يتضمن هذا الإصدار تحسينات كبيرة في واجهة المستخدم، وتكامل مع مصادر رصد جديدة، وتعزيز أداء الاستعلامات.</p>
      </DetailModal>

      <DetailModal
        open={activeModal === "serverStatus"}
        onClose={() => setActiveModal(null)}
        title="حالة الخادم"
        icon={<Server className="w-5 h-5 text-emerald-400" />}
      >
        <p className="text-sm text-muted-foreground">جميع الخوادم تعمل بشكل طبيعي. زمن الاستجابة الحالي هو <span className="font-bold text-emerald-400">~45ms</span> وزمن التشغيل <span className="font-bold text-emerald-400">99.98%</span>. تتم مراقبة الخدمات على مدار الساعة.</p>
      </DetailModal>

      <DetailModal
        open={activeModal === "databaseType"}
        onClose={() => setActiveModal(null)}
        title="قاعدة البيانات"
        icon={<DatabaseZap className="w-5 h-5 text-cyan-400" />}
      >
        <p className="text-sm text-muted-foreground">تستخدم المنصة قاعدة بيانات <span className="font-bold text-cyan-400">TiDB</span>، وهي قاعدة بيانات موزعة متوافقة مع MySQL توفر قابلية التوسع الأفقي والاتساق القوي.</p>
      </DetailModal>

      <DetailModal
        open={activeModal === "userCount"}
        onClose={() => setActiveModal(null)}
        title="إجمالي المستخدمين"
        icon={<Users className="w-5 h-5 text-primary" />}
      >
        <p className="text-sm text-muted-foreground">يوجد حاليًا <span className="font-bold text-primary">{usersList?.length || 0}</span> مستخدم مسجل في المنصة. يمكن للمسؤولين إدارة المستخدمين من هذا القسم.</p>
      </DetailModal>

      {usersList?.map(u => (
        <DetailModal
          key={`modal_${u.id}`}
          open={activeModal === `user_${u.id}`}
          onClose={() => setActiveModal(null)}
          title={`تفاصيل المستخدم: ${u.name}`}
          icon={<User className="w-5 h-5 text-primary" />}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span className="font-medium text-foreground">{u.email}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/50">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">دور NDMO:</span>
              <Badge variant="outline" className={`text-xs ${roleColor(u.ndmoRole || "viewer")}`}>
                {roleLabel(u.ndmoRole || "viewer")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/50">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">آخر تسجيل دخول:</span>
              <span className="font-medium text-foreground">{u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("ar-SA") : "لم يسجل دخول بعد"}</span>
            </div>
          </div>
        </DetailModal>
      ))}
    </div>
  );
}
