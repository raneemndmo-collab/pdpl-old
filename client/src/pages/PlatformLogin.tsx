import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, AlertCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const RASID_LOGO_LIGHT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/THVppkjqyLegafUm.png";
const RASID_LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/kuCEchYUSnPsbhZS.png";
const RASID_CHARACTER = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/qTFgtbWZjShuewJe.png";

export default function PlatformLogin() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { theme, toggleTheme, switchable } = useTheme();

  const utils = trpc.useUtils();

  const loginMutation = trpc.platformAuth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message || "فشل تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    loginMutation.mutate({ userId: userId.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 dot-grid opacity-50" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      {/* Theme toggle */}
      {switchable && toggleTheme && (
        <button
          onClick={toggleTheme}
          className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}

      <div className="relative w-full max-w-md z-10">
        {/* Rasid Character Mascot */}
        <div className="flex justify-center mb-4">
          <img
            src={RASID_CHARACTER}
            alt="راصد"
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
        </div>

        {/* Rasid Logo */}
        <div className="text-center mb-6">
          <img
            src={theme === "dark" ? RASID_LOGO_DARK : RASID_LOGO_LIGHT}
            alt="منصة راصد"
            className="h-28 mx-auto object-contain mb-3"
          />
          <p className="text-muted-foreground text-sm">National Data Management Office</p>
        </div>

        <Card className="bg-card/80 border-border backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold text-foreground text-center">تسجيل الدخول</h2>
            <p className="text-muted-foreground text-sm text-center">أدخل بيانات الاعتماد للوصول إلى المنصة</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">اسم المستخدم (User ID)</label>
                <Input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11"
                  dir="ltr"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كلمة المرور</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 pl-10"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg transition-all"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                هذا النظام مخصص للمستخدمين المصرح لهم فقط. أي محاولة وصول غير مصرح بها ستتم مراقبتها وتسجيلها.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-xs mt-6">
          © 2026 NDMO — مكتب إدارة البيانات الوطنية
        </p>
      </div>
    </div>
  );
}
