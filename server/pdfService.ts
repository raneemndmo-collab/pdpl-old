/**
 * PDF Generation Service for Incident Documentation
 * Ultra Premium official document design with "سري جداً" classification
 * Generates professional HTML reports with QR codes and verification codes
 */
import QRCode from "qrcode";
import crypto from "crypto";

// Generate a unique verification code
export function generateVerificationCode(): string {
  const prefix = "NDMO-DOC";
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// Generate a unique document ID
export function generateDocumentId(): string {
  return `DOC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

// Generate content hash for integrity verification
export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Generate QR code as data URL
export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 220,
    margin: 1,
    color: {
      dark: "#0a2540",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}

// Impact classification labels (replacing severity)
const impactLabels: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  critical: { ar: "واسع النطاق", en: "Widespread", color: "#dc2626", bg: "#dc26261a" },
  high: { ar: "مرتفع التأثير", en: "High Impact", color: "#ea580c", bg: "#ea580c1a" },
  medium: { ar: "متوسط التأثير", en: "Medium Impact", color: "#d97706", bg: "#d977061a" },
  low: { ar: "محدود التأثير", en: "Limited Impact", color: "#0d9488", bg: "#0d94881a" },
};

const sourceLabels: Record<string, string> = {
  telegram: "تليجرام",
  darkweb: "دارك ويب",
  paste: "موقع لصق",
};

const statusLabels: Record<string, string> = {
  new: "جديد",
  analyzing: "قيد التحليل",
  documented: "موثّق",
  reported: "مكتمل",
};

interface LeakData {
  leakId: string;
  titleAr: string;
  title: string;
  source: string;
  severity: string;
  sector: string;
  sectorAr: string;
  piiTypes: string[];
  recordCount: number;
  status: string;
  description?: string | null;
  descriptionAr?: string | null;
  threatActor?: string | null;
  price?: string | null;
  breachMethod?: string | null;
  breachMethodAr?: string | null;
  sourceUrl?: string | null;
  sourcePlatform?: string | null;
  regionAr?: string | null;
  cityAr?: string | null;
  detectedAt?: Date | string | null;
  sampleData?: Array<Record<string, string>> | null;
  screenshotUrls?: string[] | null;
  aiSummaryAr?: string | null;
  aiRecommendationsAr?: string[] | null;
  aiConfidence?: number | null;
  enrichedAt?: Date | string | null;
  evidence?: Array<{
    evidenceType: string;
    contentHash: string;
    blockIndex: number;
    createdAt: Date | string;
  }>;
}

export interface DocumentationResult {
  documentId: string;
  verificationCode: string;
  contentHash: string;
  htmlContent: string;
  leakId: string;
  title: string;
  titleAr: string;
  generatedAt: string;
}

export async function generateIncidentDocumentation(
  leak: LeakData,
  generatedByName: string,
  verifyBaseUrl: string
): Promise<DocumentationResult> {
  const documentId = generateDocumentId();
  const verificationCode = generateVerificationCode();
  const generatedAt = new Date().toISOString();
  const generatedAtFormatted = new Date().toLocaleString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Riyadh",
  });
  const hijriDate = new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const verifyUrl = `${verifyBaseUrl}/public/verify/${verificationCode}`;
  const qrDataUrl = await generateQRCode(verifyUrl);

  // Build content string for hashing
  const contentForHash = JSON.stringify({
    documentId,
    verificationCode,
    leakId: leak.leakId,
    title: leak.titleAr,
    severity: leak.severity,
    recordCount: leak.recordCount,
    generatedAt,
    generatedByName,
  });
  const contentHash = generateContentHash(contentForHash);

  // Impact classification
  const impact = impactLabels[leak.severity] || impactLabels.medium;

  // Build sample data rows
  const sampleDataRows = (leak.sampleData || [])
    .slice(0, 10)
    .map((row, idx) => {
      const cells = Object.entries(row)
        .map(([key, val]) => `<td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:11px;text-align:right;color:#334155;">${val}</td>`)
        .join("");
      const headers = Object.keys(row)
        .map((key) => `<th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;background:#0a25400d;color:#0a2540;font-weight:600;">${key}</th>`)
        .join("");
      return { headers, cells, idx };
    });

  const sampleHeaders = sampleDataRows.length > 0 ? `<tr>${sampleDataRows[0].headers}</tr>` : "";
  const sampleRows = sampleDataRows.map((r) => `<tr style="background:${r.idx % 2 === 0 ? '#fff' : '#f8fafc'}">${r.cells}</tr>`).join("");

  // Build PII types list
  const piiList = (leak.piiTypes || [])
    .map((t) => `<span style="display:inline-block;background:#0a25400d;color:#0a2540;border:1px solid #0a254020;border-radius:6px;padding:4px 12px;margin:3px;font-size:11px;font-weight:500;">${t}</span>`)
    .join("");

  // Evidence screenshots
  const screenshotSection = (leak.screenshotUrls || [])
    .slice(0, 4)
    .map((url) => `<img src="${url}" style="width:47%;border-radius:8px;border:2px solid #0a254015;margin:4px;box-shadow:0 2px 8px rgba(0,0,0,0.08);" />`)
    .join("");

  // AI Analysis section
  const aiSection = leak.aiSummaryAr
    ? `
    <div style="background:linear-gradient(135deg,#0a25400a,#0d94880a);border:1px solid #0a254020;border-radius:12px;padding:20px;margin-top:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:28px;height:28px;background:#0d94881a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
        <h3 style="color:#0a2540;font-size:14px;margin:0;font-weight:700;">تحليل الذكاء الاصطناعي ${leak.aiConfidence ? `<span style="font-size:11px;color:#0d9488;font-weight:500;">(نسبة الثقة: ${leak.aiConfidence}%)</span>` : ""}</h3>
      </div>
      <p style="font-size:12px;color:#334155;line-height:2;text-align:right;margin:0;">${leak.aiSummaryAr}</p>
      ${
        leak.aiRecommendationsAr && leak.aiRecommendationsAr.length > 0
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #0a254015;">
             <h4 style="color:#0a2540;font-size:12px;margin:0 0 8px 0;text-align:right;font-weight:600;">التوصيات:</h4>
             <ul style="margin:0;padding:0 20px 0 0;list-style:none;">
               ${leak.aiRecommendationsAr.map((r) => `<li style="font-size:11px;color:#334155;margin:6px 0;text-align:right;padding-right:12px;border-right:2px solid #0d9488;">• ${r}</li>`).join("")}
             </ul>
           </div>`
          : ""
      }
    </div>`
    : "";

  // Evidence chain section
  const evidenceChainSection =
    leak.evidence && leak.evidence.length > 0
      ? `
    <div style="margin-top:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:28px;height:28px;background:#6366f11a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;">🔗</div>
        <h3 style="color:#0a2540;font-size:14px;margin:0;font-weight:700;">سلسلة الأدلة الرقمية</h3>
      </div>
      <table style="width:100%;border-collapse:collapse;direction:rtl;">
        <tr>
          <th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;background:#0a25400d;color:#0a2540;font-weight:600;">#</th>
          <th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;background:#0a25400d;color:#0a2540;font-weight:600;">النوع</th>
          <th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;background:#0a25400d;color:#0a2540;font-weight:600;">بصمة المحتوى</th>
          <th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;background:#0a25400d;color:#0a2540;font-weight:600;">التاريخ</th>
        </tr>
        ${leak.evidence
          .map(
            (e, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
            <td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:11px;text-align:right;font-weight:600;">${e.blockIndex}</td>
            <td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:11px;text-align:right;">${e.evidenceType}</td>
            <td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:10px;text-align:right;font-family:monospace;color:#6366f1;">${e.contentHash.substring(0, 20)}...</td>
            <td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.1);font-size:11px;text-align:right;">${new Date(e.createdAt).toLocaleDateString("ar-SA")}</td>
          </tr>`
          )
          .join("")}
      </table>
    </div>`
      : "";

  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', sans-serif; background: #fff; color: #1e293b; direction: rtl; }
    .page { max-width: 820px; margin: 0 auto; padding: 0; position: relative; }
    @media print {
      .page { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- WATERMARK: سري جداً diagonal repeating across entire page -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);white-space:nowrap;">
        <div style="font-size:80px;font-weight:900;color:rgba(220,38,38,0.04);letter-spacing:20px;line-height:180px;">
          سري جداً &nbsp; TOP SECRET &nbsp; سري جداً<br/>
          TOP SECRET &nbsp; سري جداً &nbsp; TOP SECRET<br/>
          سري جداً &nbsp; TOP SECRET &nbsp; سري جداً<br/>
          TOP SECRET &nbsp; سري جداً &nbsp; TOP SECRET<br/>
          سري جداً &nbsp; TOP SECRET &nbsp; سري جداً<br/>
          TOP SECRET &nbsp; سري جداً &nbsp; TOP SECRET
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TOP CLASSIFICATION BANNER                                  -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c);padding:8px 24px;text-align:center;position:relative;z-index:1;">
      <p style="color:#fecaca;font-size:11px;font-weight:700;letter-spacing:3px;margin:0;">
        ⛔ سري جداً — TOP SECRET — تصنيف: مقيّد ⛔
      </p>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DOCUMENT HEADER                                            -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="background:linear-gradient(180deg,#0a2540 0%,#0c3054 100%);padding:28px 32px;position:relative;z-index:1;">
      <!-- Subtle pattern overlay -->
      <div style="position:absolute;inset:0;opacity:0.03;background-image:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,1) 30px,rgba(255,255,255,1) 31px);pointer-events:none;"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
        <div style="text-align:right;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.1);border-radius:12px;border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:16px;font-weight:900;">راصد</span>
            </div>
            <div>
              <h1 style="font-size:22px;font-weight:900;color:white;margin:0;letter-spacing:0.5px;">منصة راصد الوطنية</h1>
              <p style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">National Data Management Office — Rasid Platform</p>
            </div>
          </div>
          <p style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">رصد وتوثيق تسريبات البيانات الشخصية</p>
        </div>
        <div style="text-align:left;">
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;">
            <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">رقم الوثيقة</p>
            <p style="font-size:12px;color:white;font-family:monospace;font-weight:700;margin:4px 0 0 0;">${documentId}</p>
          </div>
        </div>
      </div>

      <!-- Document meta bar -->
      <div style="display:flex;gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;position:relative;z-index:1;">
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;flex:1;min-width:120px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">تاريخ الإصدار (ميلادي)</p>
          <p style="font-size:11px;color:white;font-weight:600;margin:2px 0 0 0;">${generatedAtFormatted}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;flex:1;min-width:120px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">تاريخ الإصدار (هجري)</p>
          <p style="font-size:11px;color:white;font-weight:600;margin:2px 0 0 0;">${hijriDate}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;flex:1;min-width:120px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">صادر بواسطة</p>
          <p style="font-size:11px;color:white;font-weight:600;margin:2px 0 0 0;">${generatedByName}</p>
        </div>
        <div style="background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);border-radius:8px;padding:8px 14px;">
          <p style="font-size:9px;color:#fca5a5;margin:0;">التصنيف</p>
          <p style="font-size:11px;color:#fecaca;font-weight:800;margin:2px 0 0 0;">⛔ سري جداً</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DOCUMENT TITLE                                             -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:24px 32px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5,#f0f9ff);border-bottom:2px solid #0a254015;position:relative;z-index:1;">
      <div style="text-align:center;">
        <h2 style="font-size:20px;font-weight:900;color:#0a2540;margin:0;">توثيق حادثة تسريب بيانات شخصية</h2>
        <p style="font-size:11px;color:#64748b;margin-top:4px;">Personal Data Leak Incident Documentation Report</p>
        <div style="width:60px;height:3px;background:linear-gradient(90deg,#0d9488,#06b6d4);margin:12px auto 0;border-radius:2px;"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- CONTENT BODY                                               -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:24px 32px;position:relative;z-index:1;">

      <!-- Incident Overview Table -->
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:4px;height:24px;background:linear-gradient(180deg,#0a2540,#0d9488);border-radius:2px;"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:800;">معلومات الحادثة</h3>
        </div>
        <table style="width:100%;border-collapse:collapse;direction:rtl;border-radius:12px;overflow:hidden;border:1px solid #0a254015;">
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;width:30%;text-align:right;font-weight:500;">رقم التسريب</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;font-weight:700;text-align:right;font-family:monospace;color:#6366f1;">${leak.leakId}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">عنوان الحادثة</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:13px;font-weight:700;text-align:right;color:#0a2540;">${leak.titleAr}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">تصنيف الحادثة</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;">
              <span style="display:inline-block;background:${impact.bg};color:${impact.color};border:1px solid ${impact.color}33;border-radius:6px;padding:3px 12px;font-size:11px;font-weight:700;">${impact.ar}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">المصدر</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;">${sourceLabels[leak.source] || leak.source}${leak.sourcePlatform ? ` — ${leak.sourcePlatform}` : ""}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">القطاع</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;font-weight:600;">${leak.sectorAr}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">عدد السجلات المكشوفة</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:14px;font-weight:900;color:#dc2626;text-align:right;">${leak.recordCount.toLocaleString()} سجل</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">حالة التوثيق</td>
            <td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;">
              <span style="display:inline-block;background:#0d94881a;color:#0d9488;border:1px solid #0d948833;border-radius:6px;padding:3px 12px;font-size:11px;font-weight:600;">${statusLabels[leak.status] || leak.status}</span>
            </td>
          </tr>
          ${leak.threatActor ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">الجهة الفاعلة / البائع</td><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;color:#dc2626;font-weight:700;">${leak.threatActor}</td></tr>` : ""}
          ${leak.price ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">السعر المعروض</td><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;font-weight:600;">${leak.price}</td></tr>` : ""}
          ${leak.breachMethodAr ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">طريقة التسريب</td><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;">${leak.breachMethodAr}</td></tr>` : ""}
          ${leak.regionAr ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">المنطقة / المدينة</td><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;text-align:right;">${leak.regionAr}${leak.cityAr ? ` — ${leak.cityAr}` : ""}</td></tr>` : ""}
          ${leak.sourceUrl ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">رابط المصدر</td><td style="padding:10px 16px;border-bottom:1px solid #0a254010;font-size:11px;text-align:right;word-break:break-all;font-family:monospace;color:#6366f1;">${leak.sourceUrl}</td></tr>` : ""}
          <tr>
            <td style="padding:10px 16px;font-size:12px;background:#0a25400a;color:#64748b;text-align:right;font-weight:500;">تاريخ الرصد</td>
            <td style="padding:10px 16px;font-size:12px;text-align:right;">${leak.detectedAt ? new Date(leak.detectedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) : "—"}</td>
          </tr>
        </table>
      </div>

      <!-- Description -->
      ${
        leak.descriptionAr
          ? `<div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:4px;height:24px;background:linear-gradient(180deg,#0a2540,#0d9488);border-radius:2px;"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:800;">وصف الحادثة</h3>
        </div>
        <p style="font-size:12px;color:#334155;line-height:2;text-align:right;background:#f8fafc;padding:20px;border-radius:12px;border:1px solid #0a254010;">${leak.descriptionAr}</p>
      </div>`
          : ""
      }

      <!-- PII Types -->
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:4px;height:24px;background:linear-gradient(180deg,#dc2626,#ea580c);border-radius:2px;"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:800;">أنواع البيانات الشخصية المكشوفة</h3>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${piiList}</div>
      </div>

      <!-- Sample Data -->
      ${
        sampleDataRows.length > 0
          ? `<div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:4px;height:24px;background:linear-gradient(180deg,#dc2626,#991b1b);border-radius:2px;"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:800;">عينات من البيانات المسربة</h3>
        </div>
        <div style="background:#fef2f2;border:1px solid #dc262620;border-radius:8px;padding:10px 14px;margin-bottom:12px;">
          <p style="font-size:10px;color:#dc2626;margin:0;font-weight:600;">⚠️ تنبيه: البيانات أدناه عينات توضيحية من التسريب لأغراض التوثيق الرسمي فقط — يُمنع نسخها أو مشاركتها</p>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;direction:rtl;font-size:11px;border:1px solid #0a254015;border-radius:12px;overflow:hidden;">
            ${sampleHeaders}
            ${sampleRows}
          </table>
        </div>
      </div>`
          : ""
      }

      <!-- Evidence Screenshots -->
      ${
        screenshotSection
          ? `<div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <div style="width:4px;height:24px;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:2px;"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:800;">لقطات الأدلة</h3>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${screenshotSection}</div>
      </div>`
          : ""
      }

      <!-- AI Analysis -->
      ${aiSection}

      <!-- Evidence Chain -->
      ${evidenceChainSection}

    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- VERIFICATION & QR CODE SECTION                             -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="margin:0 32px;padding:24px;background:linear-gradient(135deg,#0a2540,#0c3054);border-radius:16px;position:relative;z-index:1;overflow:hidden;">
      <!-- Pattern overlay -->
      <div style="position:absolute;inset:0;opacity:0.03;background-image:repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(255,255,255,1) 20px,rgba(255,255,255,1) 21px);pointer-events:none;"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;position:relative;z-index:1;">
        <div style="text-align:right;flex:1;min-width:250px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <div style="width:32px;height:32px;background:rgba(13,148,136,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:16px;">✅</span>
            </div>
            <h3 style="color:white;font-size:15px;margin:0;font-weight:800;">التحقق من صحة الوثيقة</h3>
          </div>

          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;margin-bottom:10px;">
            <p style="font-size:10px;color:rgba(255,255,255,0.4);margin:0;">كود التحقق</p>
            <p style="font-size:16px;color:#5eead4;font-family:monospace;font-weight:800;margin:4px 0 0 0;letter-spacing:1px;">${verificationCode}</p>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 16px;margin-bottom:10px;">
            <p style="font-size:10px;color:rgba(255,255,255,0.4);margin:0;">بصمة المحتوى (SHA-256)</p>
            <p style="font-size:10px;color:rgba(255,255,255,0.6);font-family:monospace;margin:4px 0 0 0;word-break:break-all;">${contentHash}</p>
          </div>

          <p style="font-size:10px;color:rgba(255,255,255,0.3);margin:0;">
            امسح رمز QR أو أدخل كود التحقق في منصة راصد للتحقق من صحة ومصداقية هذه الوثيقة
          </p>
        </div>

        <div style="text-align:center;">
          <div style="background:white;border-radius:12px;padding:8px;display:inline-block;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <img src="${qrDataUrl}" style="width:140px;height:140px;border-radius:8px;" />
          </div>
          <p style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:8px;">امسح للتحقق من صحة الوثيقة</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- LEGAL DISCLAIMER                                           -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="margin:20px 32px;padding:16px;background:#fef2f2;border:1px solid #dc262615;border-radius:12px;position:relative;z-index:1;">
      <div style="display:flex;align-items:start;gap:10px;">
        <span style="font-size:16px;margin-top:2px;">⚠️</span>
        <div>
          <p style="font-size:11px;color:#991b1b;font-weight:700;margin:0;">إخلاء مسؤولية وتحذير قانوني</p>
          <p style="font-size:10px;color:#7f1d1d;line-height:1.8;margin:6px 0 0 0;">
            هذه الوثيقة صادرة من منصة راصد التابعة لمكتب إدارة البيانات الوطنية وتحتوي على بيانات مصنفة. أي استخدام أو نسخ أو توزيع لهذه الوثيقة خارج نطاق المهام الرسمية المعتمدة يُعد مخالفة صريحة للأنظمة واللوائح المعمول بها ويستوجب المساءلة النظامية.
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- FOOTER                                                     -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:20px 32px;text-align:center;position:relative;z-index:1;">
      <div style="width:100%;height:1px;background:linear-gradient(90deg,transparent,#0a254030,transparent);margin-bottom:16px;"></div>
      <p style="font-size:11px;color:#0a2540;font-weight:700;margin:0;">منصة راصد — مكتب إدارة البيانات الوطنية (NDMO)</p>
      <p style="font-size:10px;color:#64748b;margin-top:4px;">Rasid Platform — National Data Management Office</p>
      <p style="font-size:11px;color:#0d9488;font-weight:600;margin-top:8px;">❝ حماية البيانات الشخصية متطلب وطني ❞</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:8px;">© ${new Date().getFullYear()} NDMO — جميع الحقوق محفوظة | هذه الوثيقة محمية بموجب نظام حماية البيانات الشخصية</p>
    </div>

    <!-- BOTTOM CLASSIFICATION BANNER -->
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c);padding:8px 24px;text-align:center;position:relative;z-index:1;">
      <p style="color:#fecaca;font-size:11px;font-weight:700;letter-spacing:3px;margin:0;">
        ⛔ سري جداً — TOP SECRET — تصنيف: مقيّد ⛔
      </p>
    </div>

  </div>
</body>
</html>`;

  return {
    documentId,
    verificationCode,
    contentHash,
    htmlContent,
    leakId: leak.leakId,
    title: leak.title,
    titleAr: leak.titleAr,
    generatedAt,
  };
}
