import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #0D1529 0%, #0a1230 30%, #101e45 60%, #1A2550 100%)",
      }}
    >
      {/* Aurora background effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61, 177, 172, 0.08), transparent 60%), " +
            "radial-gradient(ellipse 60% 40% at 80% 20%, rgba(100, 89, 167, 0.06), transparent 50%), " +
            "radial-gradient(ellipse 50% 30% at 20% 80%, rgba(39, 52, 112, 0.08), transparent 50%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(61, 177, 172, 0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <Card
        className="w-full max-w-lg mx-4 border-0 relative overflow-hidden"
        style={{
          background: "rgba(26, 37, 80, 0.7)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(61, 177, 172, 0.12)",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4), 0 0 80px rgba(61, 177, 172, 0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute w-full"
            style={{
              height: "30%",
              background: "linear-gradient(transparent, rgba(61, 177, 172, 0.04), transparent)",
              animation: "scan-line 4s ease-in-out infinite",
            }}
          />
        </div>

        <CardContent className="pt-10 pb-10 text-center relative z-[1]">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(235, 61, 99, 0.15) 0%, transparent 70%)",
                  transform: "scale(2)",
                  animation: "breathing-glow 3s ease-in-out infinite",
                }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(235, 61, 99, 0.1)",
                  border: "1px solid rgba(235, 61, 99, 0.2)",
                }}
              >
                <AlertCircle className="h-10 w-10" style={{ color: "#EB3D63" }} />
              </div>
            </div>
          </div>

          <h1
            className="text-6xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #3DB1AC, #6459A7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </h1>

          <h2 className="text-xl font-semibold mb-4" style={{ color: "#E1DEF5" }}>
            الصفحة غير موجودة
          </h2>

          <p className="mb-8 leading-relaxed text-sm" style={{ color: "rgba(225, 222, 245, 0.5)" }}>
            عذراً، الصفحة التي تبحث عنها غير موجودة.
            <br />
            ربما تم نقلها أو حذفها.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="text-white px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #273470 0%, #6459A7 50%, #3DB1AC 100%)",
                border: "none",
                boxShadow: "0 4px 20px rgba(61, 177, 172, 0.25)",
              }}
            >
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="rounded-xl transition-all duration-300"
              style={{
                background: "rgba(61, 177, 172, 0.08)",
                borderColor: "rgba(61, 177, 172, 0.15)",
                color: "#3DB1AC",
              }}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              الصفحة السابقة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyframes for scan-line and breathing-glow */}
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes breathing-glow {
          0%, 100% { opacity: 0.3; transform: scale(2); }
          50% { opacity: 0.6; transform: scale(2.2); }
        }
      `}</style>
    </div>
  );
}
