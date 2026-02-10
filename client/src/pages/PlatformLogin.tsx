import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function PlatformLogin() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(16,185,129,0.1) 50px, rgba(16,185,129,0.1) 51px),
                           repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(16,185,129,0.1) 50px, rgba(16,185,129,0.1) 51px)`,
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NDMO</h1>
          <p className="text-emerald-400 text-lg">منصة رصد تسريبات البيانات الشخصية</p>
          <p className="text-slate-400 text-sm mt-1">National Data Management Office</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold text-white text-center">تسجيل الدخول</h2>
            <p className="text-slate-400 text-sm text-center">أدخل بيانات الاعتماد للوصول إلى المنصة</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">اسم المستخدم (User ID)</label>
                <Input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                  dir="ltr"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-11 pl-10"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all"
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

            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 text-center">
                هذا النظام مخصص للمستخدمين المصرح لهم فقط. أي محاولة وصول غير مصرح بها ستتم مراقبتها وتسجيلها.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 NDMO — مكتب إدارة البيانات الوطنية
        </p>
      </div>
    </div>
  );
}
