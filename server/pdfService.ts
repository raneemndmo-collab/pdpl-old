/**
 * PDF Generation Service for Incident Documentation
 * Ultra Premium official document design with "سري جداً" classification
 * Generates professional HTML reports with QR codes and verification codes
 * Uses Puppeteer for server-side PDF rendering with perfect Arabic support
 */
import QRCode from "qrcode";
import crypto from "crypto";
import { generatePdfFromHtml } from "./pdfGenerator";
import { RASID_LOGO_DARK_BASE64, RASID_LOGO_LIGHT_BASE64 } from "./logoBase64";

// ─── Logo URLs (CDN for web, Base64 for PDF) ───────────────────────────────────
const RASID_LOGO_DARK_BG = RASID_LOGO_DARK_BASE64;
const RASID_LOGO_LIGHT_BG = RASID_LOGO_LIGHT_BASE64;

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

// Impact classification labels
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
  pdfBuffer: Buffer | null;
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
  const sampleDataRows = (leak.sampleData || []).slice(0, 10).map((row, idx) => {
    const cells = Object.entries(row)
      .map(
        ([, val]) =>
          `<td style="padding:8px 12px;border:1px solid rgba(10,37,64,0.08);font-size:11px;text-align:right;color:#334155;">${val}</td>`
      )
      .join("");
    const headers = Object.keys(row)
      .map(
        (key) =>
          `<th style="padding:8px 12px;border:1px solid rgba(10,37,64,0.08);font-size:10px;text-align:right;background:#f1f5f9;color:#0a2540;font-weight:700;">${key}</th>`
      )
      .join("");
    return { headers, cells, idx };
  });

  const sampleHeaders = sampleDataRows.length > 0 ? `<tr>${sampleDataRows[0].headers}</tr>` : "";
  const sampleRows = sampleDataRows
    .map((r) => `<tr style="background:${r.idx % 2 === 0 ? "#fff" : "#f8fafc"}">${r.cells}</tr>`)
    .join("");

  // Build PII types list
  const piiList = (leak.piiTypes || [])
    .map(
      (t) =>
        `<span style="display:inline-block;background:#f1f5f9;color:#0a2540;border:1px solid #e2e8f0;border-radius:6px;padding:4px 12px;margin:3px;font-size:11px;font-weight:600;">${t}</span>`
    )
    .join("");

  // Evidence screenshots
  const screenshotSection = (leak.screenshotUrls || [])
    .slice(0, 4)
    .map(
      (url) =>
        `<img src="${url}" style="width:47%;border-radius:8px;border:2px solid #e2e8f0;margin:4px;box-shadow:0 2px 8px rgba(0,0,0,0.06);" />`
    )
    .join("");

  // AI Analysis section
  const aiSection = leak.aiSummaryAr
    ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:24px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:4px;height:24px;background:linear-gradient(180deg,#0d9488,#06b6d4);border-radius:2px;"></div>
        <h3 style="color:#0a2540;font-size:15px;margin:0;font-weight:800;">تحليل الذكاء الاصطناعي ${leak.aiConfidence ? `<span style="font-size:11px;color:#0d9488;font-weight:500;margin-right:8px;">(نسبة الثقة: ${leak.aiConfidence}%)</span>` : ""}</h3>
      </div>
      <p style="font-size:12px;color:#334155;line-height:2.2;text-align:right;margin:0;">${leak.aiSummaryAr}</p>
      ${
        leak.aiRecommendationsAr && leak.aiRecommendationsAr.length > 0
          ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;">
             <h4 style="color:#0a2540;font-size:12px;margin:0 0 10px 0;text-align:right;font-weight:700;">التوصيات:</h4>
             <ul style="margin:0;padding:0;list-style:none;">
               ${leak.aiRecommendationsAr.map((r) => `<li style="font-size:11px;color:#334155;margin:8px 0;text-align:right;padding-right:14px;border-right:3px solid #0d9488;line-height:1.8;">${r}</li>`).join("")}
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
    <div style="margin-top:24px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <div style="width:4px;height:24px;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:2px;"></div>
        <h3 style="color:#0a2540;font-size:15px;margin:0;font-weight:800;">سلسلة الأدلة الرقمية</h3>
      </div>
      <table style="width:100%;border-collapse:collapse;direction:rtl;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <th style="padding:10px 14px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#0a2540;font-weight:700;">#</th>
          <th style="padding:10px 14px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#0a2540;font-weight:700;">النوع</th>
          <th style="padding:10px 14px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#0a2540;font-weight:700;">بصمة المحتوى</th>
          <th style="padding:10px 14px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#0a2540;font-weight:700;">التاريخ</th>
        </tr>
        ${leak.evidence
          .map(
            (e, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:8px 14px;border:1px solid #e2e8f0;font-size:11px;text-align:right;font-weight:700;">${e.blockIndex}</td>
            <td style="padding:8px 14px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${e.evidenceType}</td>
            <td style="padding:8px 14px;border:1px solid #e2e8f0;font-size:10px;text-align:right;font-family:'Courier New',monospace;color:#6366f1;">${e.contentHash.substring(0, 24)}...</td>
            <td style="padding:8px 14px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${new Date(e.createdAt).toLocaleDateString("ar-SA")}</td>
          </tr>`
          )
          .join("")}
      </table>
    </div>`
      : "";

  // ─── Build the full HTML document ───────────────────────────
  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Kufi Arabic', 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', sans-serif;
      background: #fff;
      color: #1e293b;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 0;
      position: relative;
    }
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      .page { padding: 0; }
      .no-print { display: none !important; }
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .section-bar {
      width: 4px;
      height: 26px;
      border-radius: 2px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .info-table td {
      padding: 11px 18px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      text-align: right;
      vertical-align: middle;
    }
    .info-table .label-cell {
      background: #f8fafc;
      color: #64748b;
      width: 32%;
      font-weight: 600;
      font-size: 12px;
    }
    .info-table .value-cell {
      font-weight: 600;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- WATERMARK -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);white-space:nowrap;">
        <div style="font-size:72px;font-weight:900;color:rgba(220,38,38,0.035);letter-spacing:20px;line-height:200px;">
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
    <!-- TOP CLASSIFICATION BANNER -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c);padding:10px 24px;text-align:center;position:relative;z-index:1;">
      <p style="color:#fecaca;font-size:12px;font-weight:800;letter-spacing:4px;margin:0;">
        سري جداً — TOP SECRET — تصنيف: مقيّد
      </p>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DOCUMENT HEADER WITH LOGO -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="background:linear-gradient(180deg,#0a2540 0%,#0c3054 100%);padding:28px 36px;position:relative;z-index:1;">
      <div style="position:absolute;inset:0;opacity:0.04;background-image:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,1) 30px,rgba(255,255,255,1) 31px);pointer-events:none;"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
        <div style="text-align:right;flex:1;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
            <img src="${RASID_LOGO_DARK_BG}" alt="منصة راصد" style="height:56px;object-fit:contain;" />
            <div style="width:1px;height:40px;background:rgba(255,255,255,0.15);"></div>
            <div>
              <p style="font-size:14px;color:white;font-weight:800;margin:0;">منصة راصد الوطنية</p>
              <p style="font-size:10px;color:rgba(255,255,255,0.5);margin:3px 0 0 0;">National Data Management Office — Rasid Platform</p>
            </div>
          </div>
          <p style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;padding-right:2px;">رصد وتوثيق تسريبات البيانات الشخصية</p>
        </div>
        <div style="text-align:left;">
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:14px 18px;">
            <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">رقم الوثيقة</p>
            <p style="font-size:13px;color:white;font-family:'Courier New',monospace;font-weight:800;margin:4px 0 0 0;letter-spacing:0.5px;">${documentId}</p>
          </div>
        </div>
      </div>

      <!-- Document meta bar -->
      <div style="display:flex;gap:12px;margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;position:relative;z-index:1;">
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;flex:1;min-width:130px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">تاريخ الإصدار (ميلادي)</p>
          <p style="font-size:11px;color:white;font-weight:700;margin:3px 0 0 0;">${generatedAtFormatted}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;flex:1;min-width:130px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">تاريخ الإصدار (هجري)</p>
          <p style="font-size:11px;color:white;font-weight:700;margin:3px 0 0 0;">${hijriDate}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;flex:1;min-width:130px;">
          <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">صادر بواسطة</p>
          <p style="font-size:11px;color:white;font-weight:700;margin:3px 0 0 0;">${generatedByName}</p>
        </div>
        <div style="background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);border-radius:8px;padding:10px 14px;">
          <p style="font-size:9px;color:#fca5a5;margin:0;">التصنيف</p>
          <p style="font-size:12px;color:#fecaca;font-weight:900;margin:3px 0 0 0;">سري جداً</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DOCUMENT TITLE -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:26px 36px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5,#f0f9ff);border-bottom:2px solid #e2e8f0;position:relative;z-index:1;">
      <div style="text-align:center;">
        <h2 style="font-size:21px;font-weight:900;color:#0a2540;margin:0;">توثيق حادثة تسريب بيانات شخصية</h2>
        <p style="font-size:11px;color:#64748b;margin-top:5px;font-weight:500;">Personal Data Leak Incident Documentation Report</p>
        <div style="width:60px;height:3px;background:linear-gradient(90deg,#0d9488,#06b6d4);margin:14px auto 0;border-radius:2px;"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- CONTENT BODY -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:28px 36px;position:relative;z-index:1;">

      <!-- Incident Overview Table -->
      <div style="margin-bottom:28px;">
        <div class="section-title">
          <div class="section-bar" style="background:linear-gradient(180deg,#0a2540,#0d9488);"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:900;">معلومات الحادثة</h3>
        </div>
        <table class="info-table">
          <tr>
            <td class="label-cell">رقم التسريب</td>
            <td class="value-cell" style="font-family:'Courier New',monospace;color:#6366f1;font-weight:800;">${leak.leakId}</td>
          </tr>
          <tr>
            <td class="label-cell">عنوان الحادثة</td>
            <td class="value-cell" style="font-size:13px;font-weight:800;color:#0a2540;">${leak.titleAr}</td>
          </tr>
          <tr>
            <td class="label-cell">تصنيف الحادثة</td>
            <td class="value-cell">
              <span class="badge" style="background:${impact.bg};color:${impact.color};border:1px solid ${impact.color}33;">${impact.ar}</span>
            </td>
          </tr>
          <tr>
            <td class="label-cell">المصدر</td>
            <td class="value-cell">${sourceLabels[leak.source] || leak.source}${leak.sourcePlatform ? ` — ${leak.sourcePlatform}` : ""}</td>
          </tr>
          <tr>
            <td class="label-cell">القطاع</td>
            <td class="value-cell" style="font-weight:700;">${leak.sectorAr}</td>
          </tr>
          <tr>
            <td class="label-cell">عدد السجلات المكشوفة</td>
            <td class="value-cell" style="font-size:15px;font-weight:900;color:#dc2626;">${leak.recordCount.toLocaleString()} سجل</td>
          </tr>
          <tr>
            <td class="label-cell">حالة التوثيق</td>
            <td class="value-cell">
              <span class="badge" style="background:#0d94881a;color:#0d9488;border:1px solid #0d948833;">${statusLabels[leak.status] || leak.status}</span>
            </td>
          </tr>
          ${leak.threatActor ? `<tr><td class="label-cell">الجهة الفاعلة / البائع</td><td class="value-cell" style="color:#dc2626;font-weight:800;">${leak.threatActor}</td></tr>` : ""}
          ${leak.price ? `<tr><td class="label-cell">السعر المعروض</td><td class="value-cell" style="font-weight:700;">${leak.price}</td></tr>` : ""}
          ${leak.breachMethodAr ? `<tr><td class="label-cell">طريقة التسريب</td><td class="value-cell">${leak.breachMethodAr}</td></tr>` : ""}
          ${leak.regionAr ? `<tr><td class="label-cell">المنطقة / المدينة</td><td class="value-cell">${leak.regionAr}${leak.cityAr ? ` — ${leak.cityAr}` : ""}</td></tr>` : ""}
          ${leak.sourceUrl ? `<tr><td class="label-cell">رابط المصدر</td><td class="value-cell" style="font-size:10px;word-break:break-all;font-family:'Courier New',monospace;color:#6366f1;">${leak.sourceUrl}</td></tr>` : ""}
          <tr>
            <td class="label-cell">تاريخ الرصد</td>
            <td class="value-cell">${leak.detectedAt ? new Date(leak.detectedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) : "—"}</td>
          </tr>
        </table>
      </div>

      <!-- Description -->
      ${
        leak.descriptionAr
          ? `<div style="margin-bottom:28px;page-break-inside:avoid;">
        <div class="section-title">
          <div class="section-bar" style="background:linear-gradient(180deg,#0a2540,#0d9488);"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:900;">وصف الحادثة</h3>
        </div>
        <p style="font-size:12px;color:#334155;line-height:2.2;text-align:right;background:#f8fafc;padding:20px;border-radius:10px;border:1px solid #e2e8f0;">${leak.descriptionAr}</p>
      </div>`
          : ""
      }

      <!-- PII Types -->
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <div class="section-title">
          <div class="section-bar" style="background:linear-gradient(180deg,#dc2626,#ea580c);"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:900;">أنواع البيانات الشخصية المكشوفة</h3>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${piiList}</div>
      </div>

      <!-- Sample Data -->
      ${
        sampleDataRows.length > 0
          ? `<div style="margin-bottom:28px;page-break-inside:avoid;">
        <div class="section-title">
          <div class="section-bar" style="background:linear-gradient(180deg,#dc2626,#991b1b);"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:900;">عينات من البيانات المسربة</h3>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
          <p style="font-size:10px;color:#dc2626;margin:0;font-weight:700;">تنبيه: البيانات أدناه عينات توضيحية من التسريب لأغراض التوثيق الرسمي فقط — يُمنع نسخها أو مشاركتها</p>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;direction:rtl;font-size:11px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
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
          ? `<div style="margin-bottom:28px;page-break-inside:avoid;">
        <div class="section-title">
          <div class="section-bar" style="background:linear-gradient(180deg,#6366f1,#8b5cf6);"></div>
          <h3 style="color:#0a2540;font-size:16px;margin:0;font-weight:900;">لقطات الأدلة</h3>
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
    <!-- VERIFICATION & QR CODE SECTION -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="margin:0 36px;padding:26px;background:linear-gradient(135deg,#0a2540,#0c3054);border-radius:14px;position:relative;z-index:1;overflow:hidden;page-break-inside:avoid;">
      <div style="position:absolute;inset:0;opacity:0.03;background-image:repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(255,255,255,1) 20px,rgba(255,255,255,1) 21px);pointer-events:none;"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;position:relative;z-index:1;">
        <div style="text-align:right;flex:1;min-width:250px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <div style="width:34px;height:34px;background:rgba(13,148,136,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:18px;color:#5eead4;">✓</span>
            </div>
            <h3 style="color:white;font-size:16px;margin:0;font-weight:900;">التحقق من صحة الوثيقة</h3>
          </div>

          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
            <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">كود التحقق</p>
            <p style="font-size:17px;color:#5eead4;font-family:'Courier New',monospace;font-weight:900;margin:5px 0 0 0;letter-spacing:1.5px;">${verificationCode}</p>
          </div>

          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 18px;margin-bottom:12px;">
            <p style="font-size:9px;color:rgba(255,255,255,0.4);margin:0;">بصمة المحتوى (SHA-256)</p>
            <p style="font-size:9px;color:rgba(255,255,255,0.55);font-family:'Courier New',monospace;margin:5px 0 0 0;word-break:break-all;line-height:1.6;">${contentHash}</p>
          </div>

          <p style="font-size:10px;color:rgba(255,255,255,0.35);margin:0;line-height:1.8;">
            امسح رمز QR أو أدخل كود التحقق في منصة راصد للتحقق من صحة ومصداقية هذه الوثيقة
          </p>
        </div>

        <div style="text-align:center;">
          <div style="background:white;border-radius:12px;padding:10px;display:inline-block;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
            <img src="${qrDataUrl}" style="width:150px;height:150px;border-radius:6px;" />
          </div>
          <p style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:10px;">امسح للتحقق من صحة الوثيقة</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- LEGAL DISCLAIMER -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="margin:24px 36px;padding:18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;position:relative;z-index:1;page-break-inside:avoid;">
      <div style="display:flex;align-items:start;gap:12px;">
        <div style="width:28px;height:28px;background:#dc26261a;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
          <span style="font-size:14px;color:#dc2626;">!</span>
        </div>
        <div>
          <p style="font-size:12px;color:#991b1b;font-weight:800;margin:0;">إخلاء مسؤولية وتحذير قانوني</p>
          <p style="font-size:10px;color:#7f1d1d;line-height:2;margin:8px 0 0 0;">
            هذه الوثيقة صادرة من منصة راصد التابعة لمكتب إدارة البيانات الوطنية وتحتوي على بيانات مصنفة. أي استخدام أو نسخ أو توزيع لهذه الوثيقة خارج نطاق المهام الرسمية المعتمدة يُعد مخالفة صريحة للأنظمة واللوائح المعمول بها ويستوجب المساءلة النظامية.
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- FOOTER -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div style="padding:22px 36px;text-align:center;position:relative;z-index:1;">
      <div style="width:100%;height:1px;background:linear-gradient(90deg,transparent,#cbd5e1,transparent);margin-bottom:18px;"></div>
      <img src="${RASID_LOGO_LIGHT_BG}" alt="منصة راصد" style="height:36px;object-fit:contain;margin-bottom:10px;" />
      <p style="font-size:11px;color:#0d9488;font-weight:700;margin-top:10px;">❝ حماية البيانات الشخصية متطلب وطني ❞</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:8px;">© ${new Date().getFullYear()} NDMO — جميع الحقوق محفوظة | هذه الوثيقة محمية بموجب نظام حماية البيانات الشخصية</p>
    </div>

    <!-- BOTTOM CLASSIFICATION BANNER -->
    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c);padding:10px 24px;text-align:center;position:relative;z-index:1;">
      <p style="color:#fecaca;font-size:12px;font-weight:800;letter-spacing:4px;margin:0;">
        سري جداً — TOP SECRET — تصنيف: مقيّد
      </p>
    </div>

  </div>
</body>
</html>`;

  // Generate PDF using Puppeteer
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generatePdfFromHtml(htmlContent);
  } catch (err) {
    console.error("[PDF] Puppeteer PDF generation failed:", err);
    // pdfBuffer stays null, client can fallback to HTML
  }

  return {
    documentId,
    verificationCode,
    contentHash,
    htmlContent,
    pdfBuffer,
    leakId: leak.leakId,
    title: leak.title,
    titleAr: leak.titleAr,
    generatedAt,
  };
}
