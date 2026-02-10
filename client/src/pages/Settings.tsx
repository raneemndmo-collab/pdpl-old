/**
 * Settings — Platform configuration
 * Dark Observatory Theme
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
  Mail,
  Clock,
  Save,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Settings() {
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

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="monitoring">مصادر الرصد</TabsTrigger>
          <TabsTrigger value="notifications">التنبيهات</TabsTrigger>
          <TabsTrigger value="api">مفاتيح API</TabsTrigger>
          <TabsTrigger value="team">الفريق</TabsTrigger>
        </TabsList>

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
                  <div>
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

              <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                <Label className="text-sm font-medium text-foreground mb-2 block">البريد الإلكتروني للتنبيهات</Label>
                <Input
                  type="email"
                  placeholder="alerts@ndmo.gov.sa"
                  className="bg-secondary/50 border-border"
                  dir="ltr"
                />
              </div>

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
                { label: "SpyCloud API Key", placeholder: "spycloud_key", desc: "مفتاح SpyCloud لرصد التسريبات" },
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

        {/* Team */}
        <TabsContent value="team" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                فريق العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "أحمد محمد الشمري", role: "مدير المنصة", email: "ahmed@ndmo.gov.sa", status: "active" },
                  { name: "سارة عبدالله العتيبي", role: "محلل بيانات", email: "sara@ndmo.gov.sa", status: "active" },
                  { name: "خالد سعد القحطاني", role: "مهندس أمن", email: "khalid@ndmo.gov.sa", status: "active" },
                  { name: "نورة فهد الدوسري", role: "باحث سياسات", email: "noura@ndmo.gov.sa", status: "away" },
                ].map((member) => (
                  <div key={member.email} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20 border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role} — {member.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-xs text-muted-foreground">{member.status === "active" ? "متصل" : "بعيد"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
