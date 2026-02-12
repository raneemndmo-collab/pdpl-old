
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "@/components/DetailModal";
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
  Info,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { ar: string; en: string; icon: typeof Shield; color: string }> = {
  root_admin: { ar: "مدير النظام الرئيسي", en: "Root Admin", icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  director: { ar: "الرئيس/المدير", en: "Director", icon: ShieldCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  vice_president: { ar: "نائب الرئيس", en: "Vice President", icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  manager: { ar: "مدير", en: "Manager", icon: UserCog, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  analyst: { ar: "محلل", en: "Analyst", icon: Eye, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  viewer: { ar: "مشاهد", en: "Viewer", icon: Eye, color: "text-muted-foreground bg-muted border-border" },
};

const STATUS_LABELS: Record<string, { ar: string; icon: typeof CheckCircle; color: string }> = {
  active: { ar: "نشط", icon: CheckCircle, color: "text-emerald-400" },
  inactive: { ar: "غير نشط", icon: XCircle, color: "text-muted-foreground" },
  suspended: { ar: "معلق", icon: UserX, color: "text-red-400" },
};

export default function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  const activeUsers = users.filter((u: any) => u.status === 'active').length;
  const rootAdmins = users.filter((u: any) => u.platformRole === 'root_admin').length;
  const mfaUsers = users.filter((u: any) => u.mfaEnabled).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={resetForm}>
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg" dir="rtl">
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
                  <label className="text-sm text-foreground">اسم المستخدم (User ID) *</label>
                  <Input
                    value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-foreground">كلمة المرور *</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-foreground">الاسم الكامل *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-foreground">الاسم المعروض *</label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-foreground">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-foreground">الجوال</label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground">الدور/الصلاحية *</label>
                <Select value={form.platformRole} onValueChange={(v) => setForm({ ...form, platformRole: v })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    {Object.entries(ROLE_LABELS).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="text-foreground">
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
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="border-border text-foreground">
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
       </motion.div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group cursor-pointer hover:scale-[1.02] transition-all" onClick={() => setActiveModal('total_users')}>
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
              <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
            </CardContent>
          </Card>
        </div>
        <div className="group cursor-pointer hover:scale-[1.02] transition-all" onClick={() => setActiveModal('active_users')}>
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{activeUsers}</p>
              <p className="text-sm text-muted-foreground">المستخدمون النشطون</p>
              <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
            </CardContent>
          </Card>
        </div>
        <div className="group cursor-pointer hover:scale-[1.02] transition-all" onClick={() => setActiveModal('root_admins')}>
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{rootAdmins}</p>
              <p className="text-sm text-muted-foreground">مدراء النظام</p>
              <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
            </CardContent>
          </Card>
        </div>
        <div className="group cursor-pointer hover:scale-[1.02] transition-all" onClick={() => setActiveModal('mfa_users')}>
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{mfaUsers}</p>
              <p className="text-sm text-muted-foreground">مستخدمو MFA</p>
              <p className="text-[9px] text-primary/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتفاصيل ←</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Table */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">قائمة المستخدمين</CardTitle>
            <div className="relative w-64">
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background border-border pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              filteredUsers.map((u: any, idx: number) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, x: -3 }}
                  className="group cursor-pointer transition-all bg-background/50 hover:bg-background rounded-lg p-4 flex items-center justify-between"
                  onClick={() => setActiveModal(`user_${u.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-bold text-foreground">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.displayName} ({u.userId})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`font-semibold text-sm flex items-center gap-2 px-3 py-1 rounded-full ${ROLE_LABELS[u.platformRole]?.color || ROLE_LABELS.viewer.color}`}>
                        {ROLE_LABELS[u.platformRole]?.icon}
                        {ROLE_LABELS[u.platformRole]?.ar || u.platformRole}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-sm flex items-center gap-2 ${STATUS_LABELS[u.status]?.color || "text-muted-foreground"}`}>
                        {STATUS_LABELS[u.status]?.icon}
                        {STATUS_LABELS[u.status]?.ar || u.status}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">آخر نشاط</p>
                      <p className="font-semibold text-sm text-foreground">{u.lastActive ? new Date(u.lastActive).toLocaleString('ar-SA') : 'غير معروف'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}><Edit className="w-4 h-4 text-blue-400" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setResetPasswordUser(u); }}><Key className="w-4 h-4 text-amber-400" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: u.id }); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DetailModal open={activeModal === 'total_users'} onClose={() => setActiveModal(null)} title="إجمالي المستخدمين" icon={<Users />}>
        <p>هذا هو العدد الإجمالي لجميع حسابات المستخدمين المسجلة في النظام، بما في ذلك الحسابات النشطة وغير النشطة والمعلقة.</p>
      </DetailModal>
      <DetailModal open={activeModal === 'active_users'} onClose={() => setActiveModal(null)} title="المستخدمون النشطون" icon={<CheckCircle />}>
        <p>يمثل هذا الرقم عدد المستخدمين الذين لديهم حالة "نشط" ويمكنهم تسجيل الدخول واستخدام النظام حاليًا.</p>
      </DetailModal>
      <DetailModal open={activeModal === 'root_admins'} onClose={() => setActiveModal(null)} title="مدراء النظام" icon={<Crown />}>
        <p>هؤلاء هم المستخدمون الذين لديهم صلاحيات "مدير النظام الرئيسي"، وهي أعلى صلاحية في النظام وتسمح بالوصول الكامل والتحكم.</p>
      </DetailModal>
      <DetailModal open={activeModal === 'mfa_users'} onClose={() => setActiveModal(null)} title="مستخدمو MFA" icon={<ShieldCheck />}>
        <p>هذا هو عدد المستخدمين الذين قاموا بتمكين المصادقة متعددة العوامل (MFA) على حساباتهم لزيادة الأمان.</p>
      </DetailModal>

      {filteredUsers.map((u: any) => (
        <DetailModal key={`modal_${u.id}`} open={activeModal === `user_${u.id}`} onClose={() => setActiveModal(null)} title={`تفاصيل المستخدم: ${u.displayName}`} icon={<Info />}>
            <div className="space-y-2" dir="rtl">
                <p><strong>الاسم الكامل:</strong> {u.name}</p>
                <p><strong>اسم المستخدم:</strong> {u.userId}</p>
                <p><strong>البريد الإلكتروني:</strong> {u.email || 'غير متوفر'}</p>
                <p><strong>الجوال:</strong> {u.mobile || 'غير متوفر'}</p>
                <p><strong>الدور:</strong> {ROLE_LABELS[u.platformRole]?.ar || u.platformRole}</p>
                <p><strong>الحالة:</strong> {STATUS_LABELS[u.status]?.ar || u.status}</p>
                <p><strong>آخر نشاط:</strong> {u.lastActive ? new Date(u.lastActive).toLocaleString('ar-SA') : 'غير معروف'}</p>
                <p><strong>MFA مفعل:</strong> {u.mfaEnabled ? 'نعم' : 'لا'}</p>
            </div>
        </DetailModal>
      ))}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم: {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editingUser.id, ...editingUser });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-foreground">الاسم الكامل</label>
                <Input
                  value={editingUser?.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground">الاسم المعروض</label>
                <Input
                  value={editingUser?.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-foreground">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground">الجوال</label>
                <Input
                  value={editingUser?.mobile || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-foreground">الدور/الصلاحية</label>
              <Select value={editingUser?.platformRole} onValueChange={(v) => setEditingUser({ ...editingUser, platformRole: v })}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-border">
                  {Object.entries(ROLE_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-foreground">
                      {val.ar} ({val.en})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500 flex-1">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ التغييرات
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="border-border text-foreground">
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور لـ {resetPasswordUser?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resetPasswordMutation.mutate({ id: resetPasswordUser.id, newPassword });
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-sm text-foreground">كلمة المرور الجديدة</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border text-foreground"
                dir="ltr"
                minLength={6}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={resetPasswordMutation.isPending} className="bg-amber-600 hover:bg-amber-500 flex-1">
                {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                إعادة التعيين
              </Button>
              <Button type="button" variant="outline" onClick={() => setResetPasswordUser(null)} className="border-border text-foreground">
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
