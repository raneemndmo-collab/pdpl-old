import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Shield,
  ShieldCheck,
  Crown,
  UserCog,
  Eye,
  UserX,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { ar: string; en: string; icon: typeof Shield; color: string }> = {
  root_admin: { ar: "مدير النظام الرئيسي", en: "Root Admin", icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  director: { ar: "الرئيس/المدير", en: "Director", icon: ShieldCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  vice_president: { ar: "نائب الرئيس", en: "Vice President", icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  manager: { ar: "مدير", en: "Manager", icon: UserCog, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  analyst: { ar: "محلل", en: "Analyst", icon: Eye, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  viewer: { ar: "مشاهد", en: "Viewer", icon: Eye, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const STATUS_LABELS: Record<string, { ar: string; icon: typeof CheckCircle; color: string }> = {
  active: { ar: "نشط", icon: CheckCircle, color: "text-emerald-400" },
  inactive: { ar: "غير نشط", icon: XCircle, color: "text-slate-400" },
  suspended: { ar: "معلق", icon: UserX, color: "text-red-400" },
};

export default function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Form state
  const [form, setForm] = useState({
    userId: "",
    password: "",
    name: "",
    email: "",
    mobile: "",
    displayName: "",
    platformRole: "analyst" as string,
  });

  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.userManagement.list.useQuery();

  const createMutation = trpc.userManagement.create.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      setShowCreateDialog(false);
      resetForm();
      toast.success("تم إنشاء المستخدم بنجاح");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.userManagement.update.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      setEditingUser(null);
      toast.success("تم تحديث المستخدم بنجاح");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.userManagement.delete.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      toast.success("تم حذف المستخدم");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetPasswordMutation = trpc.userManagement.resetPassword.useMutation({
    onSuccess: () => {
      setResetPasswordUser(null);
      setNewPassword("");
      toast.success("تم إعادة تعيين كلمة المرور");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({ userId: "", password: "", name: "", email: "", mobile: "", displayName: "", platformRole: "analyst" });
  };

  const filteredUsers = users.filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.userId?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            إدارة المستخدمين
          </h1>
          <p className="text-slate-400 mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={resetForm}>
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  userId: form.userId,
                  password: form.password,
                  name: form.name,
                  email: form.email || undefined,
                  mobile: form.mobile || undefined,
                  displayName: form.displayName,
                  platformRole: form.platformRole as any,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">اسم المستخدم (User ID) *</label>
                  <Input
                    value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">كلمة المرور *</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الاسم الكامل *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الاسم المعروض *</label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الجوال</label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">الدور/الصلاحية *</label>
                <Select value={form.platformRole} onValueChange={(v) => setForm({ ...form, platformRole: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {Object.entries(ROLE_LABELS).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="text-white">
                        {val.ar} ({val.en})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 flex-1">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  إنشاء المستخدم
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-600 text-slate-300">
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-sm text-slate-400">إجمالي المستخدمين</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{users.filter((u: any) => u.status === "active").length}</p>
            <p className="text-sm text-slate-400">نشط</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{users.filter((u: any) => ["root_admin", "director"].includes(u.platformRole)).length}</p>
            <p className="text-sm text-slate-400">مسؤولون</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{users.filter((u: any) => u.lastLoginAt).length}</p>
            <p className="text-sm text-slate-400">سجلوا دخولاً</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="بحث بالاسم أو معرف المستخدم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800/50 border-slate-700/50 text-white pr-10"
        />
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-lg">قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد مستخدمون</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">المستخدم</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">User ID</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">البريد</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">الجوال</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">الدور</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">الحالة</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">آخر دخول</th>
                    <th className="text-right text-sm font-medium text-slate-400 py-3 px-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => {
                    const role = ROLE_LABELS[u.platformRole] || ROLE_LABELS.viewer;
                    const status = STATUS_LABELS[u.status] || STATUS_LABELS.active;
                    const RoleIcon = role.icon;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 px-3">
                          <div>
                            <p className="text-white font-medium text-sm">{u.name}</p>
                            <p className="text-slate-400 text-xs">{u.displayName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <code className="text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded" dir="ltr">{u.userId}</code>
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-300" dir="ltr">{u.email || "—"}</td>
                        <td className="py-3 px-3 text-sm text-slate-300" dir="ltr">{u.mobile || "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${role.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {role.ar}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-sm ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.ar}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-400">
                          {u.lastLoginAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(u.lastLoginAt).toLocaleDateString("ar-SA")}
                            </span>
                          ) : "لم يسجل دخولاً"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400"
                              onClick={() => setEditingUser(u)}
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-amber-400"
                              onClick={() => { setResetPasswordUser(u); setNewPassword(""); }}
                              title="إعادة تعيين كلمة المرور"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف المستخدم ${u.name}؟`)) {
                                  deleteMutation.mutate({ id: u.id });
                                }
                              }}
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم: {editingUser?.name}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editingUser.id,
                  name: formData.get("name") as string,
                  displayName: formData.get("displayName") as string,
                  email: formData.get("email") as string,
                  mobile: formData.get("mobile") as string,
                  platformRole: formData.get("platformRole") as any,
                  status: formData.get("status") as any,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الاسم الكامل</label>
                  <Input name="name" defaultValue={editingUser.name} className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الاسم المعروض</label>
                  <Input name="displayName" defaultValue={editingUser.displayName} className="bg-slate-800 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">البريد الإلكتروني</label>
                  <Input name="email" defaultValue={editingUser.email || ""} className="bg-slate-800 border-slate-600 text-white" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الجوال</label>
                  <Input name="mobile" defaultValue={editingUser.mobile || ""} className="bg-slate-800 border-slate-600 text-white" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الدور</label>
                  <select name="platformRole" defaultValue={editingUser.platformRole} className="w-full h-10 rounded-md bg-slate-800 border border-slate-600 text-white px-3 text-sm">
                    {Object.entries(ROLE_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.ar}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">الحالة</label>
                  <select name="status" defaultValue={editingUser.status} className="w-full h-10 rounded-md bg-slate-800 border border-slate-600 text-white px-3 text-sm">
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500 flex-1">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  حفظ التعديلات
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="border-slate-600 text-slate-300">
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          {resetPasswordUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetPasswordMutation.mutate({ id: resetPasswordUser.id, newPassword });
              }}
              className="space-y-4"
            >
              <p className="text-sm text-slate-400">
                إعادة تعيين كلمة المرور للمستخدم: <strong className="text-white">{resetPasswordUser.name}</strong>
              </p>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  dir="ltr"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={resetPasswordMutation.isPending} className="bg-amber-600 hover:bg-amber-500 flex-1">
                  {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  إعادة التعيين
                </Button>
                <Button type="button" variant="outline" onClick={() => setResetPasswordUser(null)} className="border-slate-600 text-slate-300">
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
