import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, AlertCircle, Sun, Moon, Monitor, Shield, Lock, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// Full brand logos
const RASID_LOGO_LIGHT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/tSiomIdoNdNFAtOB.png";
const RASID_LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/vyIfeykxwXasuonx.png";
const RASID_CHARACTERS = {
  armsCrossedShmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/qoUheMlVnqPiZdQe.png",
  waving: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/trhmUCDmIUgvRfyf.png",
  sunglasses: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/ksSaxPLmSvrLxHAg.png",
  shmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/qnhkKZjJrOPcqgsf.png",
  handsOnHips: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/pHcUGrMdEgCexGAn.png",
  standingShmagh: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/JzZklqOoMNmtrCuP.png",
};
const RASID_CHARACTER = RASID_CHARACTERS.armsCrossedShmagh;

/* SDAIA Colors */
const SDAIA = {
  navy: "#273470",
  purple: "#6459A7",
  teal: "#3DB1AC",
  danger: "#EB3D63",
  bgDark: "#0D1529",
  cardDark: "#1A2550",
  textDark: "#E1DEF5",
};

// ─── 3D Particle Canvas Background ───────────────────────────
function ParticleBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number; y: number; z: number;
      vx: number; vy: number; vz: number;
      size: number; opacity: number;
      hue: number;
    }> = [];

    const PARTICLE_COUNT = 80;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 600 + 100,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        hue: 170 + Math.random() * 100,
      });
    }

    const orbs: Array<{
      x: number; y: number; radius: number;
      vx: number; vy: number;
      hue: number; opacity: number;
    }> = [];
    for (let i = 0; i < 5; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 120 + 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: i % 2 === 0 ? 175 + Math.random() * 15 : 255 + Math.random() * 15,
        opacity: isDark ? 0.06 + Math.random() * 0.04 : 0.03 + Math.random() * 0.03,
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.005;
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        orb.x += orb.vx + Math.sin(time * 2) * 0.2;
        orb.y += orb.vy + Math.cos(time * 1.5) * 0.2;
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        if (isDark) {
          gradient.addColorStop(0, `hsla(${orb.hue}, 70%, 50%, ${orb.opacity * 1.5})`);
          gradient.addColorStop(0.5, `hsla(${orb.hue}, 60%, 40%, ${orb.opacity * 0.5})`);
          gradient.addColorStop(1, `hsla(${orb.hue}, 50%, 30%, 0)`);
        } else {
          gradient.addColorStop(0, `hsla(${orb.hue}, 50%, 70%, ${orb.opacity * 1.5})`);
          gradient.addColorStop(0.5, `hsla(${orb.hue}, 40%, 80%, ${orb.opacity * 0.5})`);
          gradient.addColorStop(1, `hsla(${orb.hue}, 30%, 90%, 0)`);
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        if (p.z < 100) p.z = 700;
        if (p.z > 700) p.z = 100;

        const perspective = 400 / p.z;
        const screenX = (p.x - w / 2) * perspective + w / 2;
        const screenY = (p.y - h / 2) * perspective + h / 2;
        const screenSize = p.size * perspective;
        const alpha = p.opacity * (1 - p.z / 800);

        ctx.fillStyle = isDark
          ? `hsla(${p.hue}, 70%, 65%, ${alpha})`
          : `hsla(${p.hue}, 50%, 50%, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(screenSize, 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.15;
            ctx.strokeStyle = isDark
              ? `rgba(61, 177, 172, ${alpha})`
              : `rgba(39, 52, 112, ${alpha * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.save();
      ctx.globalAlpha = isDark ? 0.03 : 0.015;
      const hexSize = 40;
      const hexH = hexSize * Math.sqrt(3);
      for (let row = -1; row < h / hexH + 1; row++) {
        for (let col = -1; col < w / (hexSize * 1.5) + 1; col++) {
          const cx = col * hexSize * 1.5 + (time * 20 % (hexSize * 1.5));
          const cy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
          ctx.strokeStyle = isDark ? SDAIA.teal : SDAIA.navy;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const angle = (Math.PI / 3) * s - Math.PI / 6;
            const hx = cx + hexSize * 0.6 * Math.cos(angle);
            const hy = cy + hexSize * 0.6 * Math.sin(angle);
            if (s === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── CSS Animations ───────────────────────────
const animationStyles = `
  @keyframes logo-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1.8); }
    50% { opacity: 1; transform: scale(2); }
  }
  @keyframes logo-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes spin-slow {
    from { transform: scale(1.4) rotate(0deg); }
    to { transform: scale(1.4) rotate(360deg); }
  }
  @keyframes shield-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-3px) scale(1.1); }
  }
  @keyframes character-float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-12px) rotate(0.5deg); }
    75% { transform: translateY(6px) rotate(-0.5deg); }
  }
  @keyframes orbit-particle {
    0% { transform: translate(-50%, -50%) rotate(0deg) translateX(140px) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg) translateX(140px) rotate(-360deg); }
  }
  @keyframes scan-line {
    0% { transform: translateY(-100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(400%); opacity: 0; }
  }
  @keyframes shimmer-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

export default function PlatformLogin() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme, themeMode, toggleTheme, switchable } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isDark = theme === "dark";

  return (
    <>
      <style>{animationStyles}</style>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        dir="rtl"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${SDAIA.bgDark} 0%, #0a1230 20%, #101e45 50%, ${SDAIA.cardDark} 80%, #132040 100%)`
            : "#F0F3F8",
        }}
      >
        {/* 3D Particle Canvas */}
        <ParticleBackground isDark={isDark} />

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ overflow: "hidden" }}>
          <div
            className="absolute w-full h-px"
            style={{
              background: isDark
                ? `linear-gradient(90deg, transparent, rgba(61,177,172,0.3), transparent)`
                : `linear-gradient(90deg, transparent, rgba(39,52,112,0.08), transparent)`,
              animation: "scan-line 8s linear infinite",
            }}
          />
        </div>

        {/* Theme toggle — cycles: light → dark → auto → light */}
        {switchable && toggleTheme && (
          <button
            onClick={toggleTheme}
            className="absolute top-5 left-5 z-20 p-2.5 rounded-xl transition-all duration-300 hover:scale-110 relative"
            style={{
              background: isDark ? "rgba(61,177,172,0.08)" : "rgba(255,255,255,0.8)",
              border: isDark ? "1px solid rgba(61,177,172,0.15)" : "1px solid rgba(226,229,239,0.8)",
              backdropFilter: "blur(10px)",
              boxShadow: isDark ? "none" : "0 2px 8px rgba(39,52,112,0.06)",
            }}
            title={
              themeMode === "light" ? "الوضع الفاتح — انقر للتبديل إلى الداكن"
                : themeMode === "dark" ? "الوضع الداكن — انقر للتبديل إلى التلقائي"
                : "تلقائي (حسب النظام) — انقر للتبديل إلى الفاتح"
            }
          >
            {themeMode === "light" && <Sun className="w-5 h-5 text-amber-400" />}
            {themeMode === "dark" && <Moon className="w-5 h-5 text-amber-300" />}
            {themeMode === "auto" && (
              <>
                <Monitor className="w-5 h-5 text-[#5a6478]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
              </>
            )}
          </button>
        )}

        {/* ═══ MAIN CARD — Two-column design matching design.rasid.vip ═══ */}
        <div
          className="relative z-10 w-full max-w-5xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden"
            style={{
              boxShadow: isDark
                ? "0 25px 80px rgba(0,0,0,0.5), 0 0 120px rgba(61,177,172,0.05)"
                : "0 25px 80px rgba(39,52,112,0.12), 0 8px 32px rgba(39,52,112,0.06)",
            }}
          >
            {/* ─── RIGHT PANEL: Login Form (RTL = appears on right) ─── */}
            <div
              className="p-10 lg:p-12 flex flex-col justify-center relative"
              style={{
                background: isDark ? "rgba(26, 37, 80, 0.85)" : "#FFFFFF",
                backdropFilter: isDark ? "blur(24px)" : "none",
              }}
            >
              {/* Subtle shimmer overlay for light mode */}
              {!isDark && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      background: "linear-gradient(90deg, transparent 40%, rgba(30,58,138,0.3) 50%, transparent 60%)",
                      animation: "shimmer-slide 8s ease-in-out infinite",
                    }}
                  />
                </div>
              )}

              <div className="relative z-[1]">
                {/* Logo */}
                <div className="mb-8">
                  <div className="relative inline-block">
                    <img
                      src={isDark ? RASID_LOGO_LIGHT : RASID_LOGO_DARK}
                      alt="منصة راصد - مكتب إدارة البيانات الوطنية"
                      style={{
                        width: '240px',
                        height: 'auto',
                        filter: isDark
                          ? 'drop-shadow(0 0 15px rgba(61,177,172,0.15))'
                          : 'drop-shadow(0 2px 8px rgba(39,52,112,0.08))',
                        animation: 'logo-float 5s ease-in-out infinite',
                      }}
                    />
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-8">
                  <h1
                    className="text-2xl lg:text-3xl font-bold mb-2"
                    style={{ color: isDark ? SDAIA.textDark : "#1c2833" }}
                  >
                    تسجيل الدخول
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: isDark ? "rgba(225,222,245,0.5)" : "#7a8599" }}
                  >
                    أدخل بيانات حسابك للوصول إلى لوحة التحكم
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl text-sm"
                      style={{
                        background: isDark ? "rgba(235,61,99,0.1)" : "rgba(235,61,99,0.04)",
                        border: `1px solid rgba(235,61,99,0.15)`,
                        color: isDark ? "#fca5a5" : SDAIA.danger,
                      }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Username */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      style={{ color: isDark ? "rgba(225,222,245,0.8)" : "#374151" }}
                    >
                      اسم المستخدم
                    </label>
                    <Input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="h-12 rounded-xl transition-all duration-300 focus:ring-2"
                      style={{
                        background: isDark ? "rgba(13, 21, 41, 0.5)" : "#f8f9fc",
                        borderColor: isDark ? "rgba(61, 177, 172, 0.2)" : "#e2e5ef",
                        color: isDark ? SDAIA.textDark : "#1c2833",
                        fontSize: "14px",
                      }}
                      dir="ltr"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      style={{ color: isDark ? "rgba(225,222,245,0.8)" : "#374151" }}
                    >
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور"
                        className="h-12 pl-10 rounded-xl transition-all duration-300 focus:ring-2"
                        style={{
                          background: isDark ? "rgba(13, 21, 41, 0.5)" : "#f8f9fc",
                          borderColor: isDark ? "rgba(61, 177, 172, 0.2)" : "#e2e5ef",
                          color: isDark ? SDAIA.textDark : "#1c2833",
                          fontSize: "14px",
                        }}
                        dir="ltr"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                        style={{ color: isDark ? "rgba(225,222,245,0.5)" : "#94a3b8" }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me + Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span
                        className="text-sm"
                        style={{ color: isDark ? "rgba(225,222,245,0.5)" : "#7a8599" }}
                      >
                        تذكرني
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-sm hover:underline transition-colors"
                      style={{ color: isDark ? SDAIA.teal : "#1e3a8a" }}
                      onClick={() => {}}
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full h-12 text-base font-semibold text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, ${SDAIA.navy} 0%, ${SDAIA.purple} 50%, ${SDAIA.teal} 100%)`
                        : `linear-gradient(135deg, #1e3a8a 0%, #1e3a5f 100%)`,
                      border: "none",
                      boxShadow: isDark
                        ? "0 4px 20px rgba(61, 177, 172, 0.3), 0 0 40px rgba(100, 89, 167, 0.1)"
                        : "0 4px 20px rgba(30, 58, 138, 0.25)",
                    }}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جارٍ تسجيل الدخول...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <Lock className="w-4 h-4" />
                        دخول
                      </span>
                    )}
                  </Button>
                </form>

                {/* Security notice */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" style={{ color: isDark ? "rgba(225,222,245,0.3)" : "#94a3b8" }} />
                  <p className="text-xs" style={{ color: isDark ? "rgba(225,222,245,0.3)" : "#94a3b8" }}>
                    محمي بتشفير SSL-256 bit
                  </p>
                </div>
              </div>
            </div>

            {/* ─── LEFT PANEL: Character + Branding (RTL = appears on left) ─── */}
            <div
              className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, #0a1230 0%, ${SDAIA.bgDark} 50%, #101e45 100%)`
                  : "linear-gradient(135deg, #1e3a8a 0%, #1a2555 50%, #162050 100%)",
              }}
            >
              {/* Decorative circles */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full"
                style={{
                  background: isDark
                    ? "radial-gradient(circle, rgba(61,177,172,0.08) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
                style={{
                  background: isDark
                    ? "radial-gradient(circle, rgba(100,89,167,0.1) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
                  transform: "translate(-30%, 30%)",
                }}
              />

              {/* Dot grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Logo at top */}
              <div className="relative z-10 mb-6">
                <img
                  src={RASID_LOGO_LIGHT}
                  alt="راصد"
                  style={{
                    width: '180px',
                    height: 'auto',
                    filter: 'drop-shadow(0 0 20px rgba(61,177,172,0.15))',
                    animation: 'logo-float 5s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Character */}
              <div className="relative z-10 mb-8">
                {/* Glow behind character */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(61,177,172,0.1) 0%, transparent 60%)",
                    transform: "scale(1.3)",
                    animation: "logo-pulse 4s ease-in-out infinite",
                  }}
                />
                {/* Orbiting particles */}
                {[0, 1, 2].map((i) => {
                  const colors = [SDAIA.teal, SDAIA.purple, "#FFD700"];
                  return (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: colors[i],
                        boxShadow: `0 0 8px ${colors[i]}80`,
                        animation: `orbit-particle ${6 + i * 2}s linear infinite`,
                        animationDelay: `${i * -2}s`,
                        top: "50%",
                        left: "50%",
                      }}
                    />
                  );
                })}
                <img
                  src={RASID_CHARACTER}
                  alt="راصد"
                  className="w-72 h-72 object-contain relative z-[1]"
                  style={{
                    filter: "brightness(1.02) drop-shadow(0 0 40px rgba(61,177,172,0.12))",
                    animation: "character-float 6s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Tagline */}
              <div className="relative z-10 text-center max-w-xs">
                <p
                  className="text-lg font-semibold leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  منصة ذكية بُنيت من أجلك
                </p>
                <p
                  className="text-sm mt-2 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  ومن أجل الحفاظ على بياناتك الشخصية
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: isDark ? "rgba(225,222,245,0.25)" : "#94a3b8" }}>
            مكتب إدارة البيانات الوطنية — منصة راصد
          </p>
        </div>
      </div>
    </>
  );
}
