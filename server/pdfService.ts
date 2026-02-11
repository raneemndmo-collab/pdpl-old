/**
 * PDF Generation Service for Incident Documentation
 * Generates professional PDF reports with QR codes and verification codes
 */
import QRCode from "qrcode";
import crypto from "crypto";

// Generate a unique verification code
export function generateVerificationCode(): string {
  const prefix = "NDMO";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
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
    width: 200,
    margin: 1,
    color: {
      dark: "#0D9488",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}

// Severity labels
const severityLabels: Record<string, string> = {
  critical: "حرج",
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
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
  reported: "تم الإبلاغ",
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

  const verifyUrl = `${verifyBaseUrl}/verify/${verificationCode}`;
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

  // Build sample data rows
  const sampleDataRows = (leak.sampleData || [])
    .slice(0, 10)
    .map((row, idx) => {
      const cells = Object.entries(row)
        .map(([key, val]) => `<td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${val}</td>`)
        .join("");
      const headers = Object.keys(row)
        .map((key) => `<th style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#475569;">${key}</th>`)
        .join("");
      return { headers, cells, idx };
    });

  const sampleHeaders = sampleDataRows.length > 0 ? `<tr>${sampleDataRows[0].headers}</tr>` : "";
  const sampleRows = sampleDataRows.map((r) => `<tr>${r.cells}</tr>`).join("");

  // Build PII types list
  const piiList = (leak.piiTypes || [])
    .map((t) => `<span style="display:inline-block;background:#0d94881a;color:#0d9488;border:1px solid #0d948833;border-radius:4px;padding:2px 8px;margin:2px;font-size:11px;">${t}</span>`)
    .join("");

  // Evidence screenshots
  const screenshotSection = (leak.screenshotUrls || [])
    .slice(0, 4)
    .map((url) => `<img src="${url}" style="width:48%;border-radius:8px;border:1px solid #e2e8f0;margin:4px;" />`)
    .join("");

  // AI Analysis section
  const aiSection = leak.aiSummaryAr
    ? `
    <div style="background:#0d94880d;border:1px solid #0d948833;border-radius:8px;padding:16px;margin-top:16px;">
      <h3 style="color:#0d9488;font-size:14px;margin:0 0 8px 0;text-align:right;">🤖 تحليل الذكاء الاصطناعي ${leak.aiConfidence ? `(ثقة: ${leak.aiConfidence}%)` : ""}</h3>
      <p style="font-size:12px;color:#334155;line-height:1.8;text-align:right;margin:0;">${leak.aiSummaryAr}</p>
      ${
        leak.aiRecommendationsAr && leak.aiRecommendationsAr.length > 0
          ? `<h4 style="color:#0d9488;font-size:12px;margin:12px 0 6px 0;text-align:right;">التوصيات:</h4>
             <ul style="margin:0;padding:0 20px 0 0;list-style:none;">
               ${leak.aiRecommendationsAr.map((r) => `<li style="font-size:11px;color:#334155;margin:4px 0;text-align:right;">• ${r}</li>`).join("")}
             </ul>`
          : ""
      }
    </div>`
    : "";

  // Evidence chain section
  const evidenceChainSection =
    leak.evidence && leak.evidence.length > 0
      ? `
    <div style="margin-top:16px;">
      <h3 style="color:#1e293b;font-size:14px;margin:0 0 8px 0;text-align:right;">🔗 سلسلة الأدلة الرقمية</h3>
      <table style="width:100%;border-collapse:collapse;direction:rtl;">
        <tr>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#475569;">#</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#475569;">النوع</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#475569;">بصمة المحتوى</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;background:#f1f5f9;color:#475569;">التاريخ</th>
        </tr>
        ${leak.evidence
          .map(
            (e) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${e.blockIndex}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${e.evidenceType}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:right;font-family:monospace;color:#6366f1;">${e.contentHash.substring(0, 16)}...</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:right;">${new Date(e.createdAt).toLocaleDateString("ar-SA")}</td>
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
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', sans-serif; background: #fff; color: #1e293b; direction: rtl; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    @media print {
      .page { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header with Logo -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0d9488;padding-bottom:20px;margin-bottom:24px;">
      <div style="text-align:right;">
        <h1 style="font-size:24px;font-weight:800;color:#0d9488;margin:0;">منصة راصد</h1>
        <p style="font-size:11px;color:#64748b;margin-top:4px;">رصد تسريبات البيانات الشخصية — مكتب إدارة البيانات الوطنية</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:2px;">National Data Management Office — Personal Data Leak Monitoring</p>
      </div>
      <div style="text-align:left;">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,#0d9488,#065f46);border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:20px;font-weight:800;">راصد</span>
        </div>
      </div>
    </div>

    <!-- Document Title -->
    <div style="background:linear-gradient(135deg,#0d94880d,#06b6d40d);border:1px solid #0d948833;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <h2 style="font-size:18px;font-weight:700;color:#0d9488;margin:0;">📋 توثيق حادثة تسريب بيانات شخصية</h2>
      <p style="font-size:12px;color:#64748b;margin-top:6px;">Incident Documentation Report</p>
      <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;flex-wrap:wrap;">
        <span style="font-size:11px;color:#475569;">📄 رقم الوثيقة: <strong style="color:#0d9488;">${documentId}</strong></span>
        <span style="font-size:11px;color:#475569;">📅 تاريخ الإصدار: <strong>${generatedAtFormatted}</strong></span>
        <span style="font-size:11px;color:#475569;">👤 أصدرها: <strong>${generatedByName}</strong></span>
      </div>
    </div>

    <!-- Incident Overview -->
    <div style="margin-bottom:24px;">
      <h3 style="color:#1e293b;font-size:16px;border-right:4px solid #0d9488;padding-right:12px;margin-bottom:12px;">معلومات الحادثة</h3>
      <table style="width:100%;border-collapse:collapse;direction:rtl;">
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;width:30%;text-align:right;">رقم التسريب</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;font-weight:600;text-align:right;font-family:monospace;color:#6366f1;">${leak.leakId}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">عنوان الحادثة</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;font-weight:600;text-align:right;">${leak.titleAr}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">مستوى الخطورة</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">
            <span style="background:${leak.severity === "critical" ? "#ef44441a" : leak.severity === "high" ? "#f59e0b1a" : leak.severity === "medium" ? "#eab3081a" : "#06b6d41a"};color:${leak.severity === "critical" ? "#ef4444" : leak.severity === "high" ? "#f59e0b" : leak.severity === "medium" ? "#eab308" : "#06b6d4"};padding:2px 10px;border-radius:4px;font-weight:600;">${severityLabels[leak.severity] || leak.severity}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">المصدر</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${sourceLabels[leak.source] || leak.source}${leak.sourcePlatform ? ` — ${leak.sourcePlatform}` : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">القطاع</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${leak.sectorAr}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">عدد السجلات المكشوفة</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#ef4444;text-align:right;">${leak.recordCount.toLocaleString()} سجل</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">الحالة</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${statusLabels[leak.status] || leak.status}</td>
        </tr>
        ${leak.threatActor ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">الجهة الفاعلة / البائع</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;color:#ef4444;font-weight:600;">${leak.threatActor}</td></tr>` : ""}
        ${leak.price ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">السعر المعروض</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${leak.price}</td></tr>` : ""}
        ${leak.breachMethodAr ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">طريقة الاختراق</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${leak.breachMethodAr}</td></tr>` : ""}
        ${leak.regionAr ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">المنطقة / المدينة</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${leak.regionAr}${leak.cityAr ? ` — ${leak.cityAr}` : ""}</td></tr>` : ""}
        ${leak.sourceUrl ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">رابط المصدر</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:11px;text-align:right;word-break:break-all;font-family:monospace;color:#6366f1;">${leak.sourceUrl}</td></tr>` : ""}
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;background:#f8fafc;color:#64748b;text-align:right;">تاريخ الرصد</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:right;">${leak.detectedAt ? new Date(leak.detectedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) : "—"}</td>
        </tr>
      </table>
    </div>

    <!-- Description -->
    ${
      leak.descriptionAr
        ? `<div style="margin-bottom:24px;">
      <h3 style="color:#1e293b;font-size:16px;border-right:4px solid #0d9488;padding-right:12px;margin-bottom:12px;">وصف الحادثة</h3>
      <p style="font-size:12px;color:#334155;line-height:1.8;text-align:right;background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;">${leak.descriptionAr}</p>
    </div>`
        : ""
    }

    <!-- PII Types -->
    <div style="margin-bottom:24px;">
      <h3 style="color:#1e293b;font-size:16px;border-right:4px solid #0d9488;padding-right:12px;margin-bottom:12px;">أنواع البيانات الشخصية المكشوفة</h3>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">${piiList}</div>
    </div>

    <!-- Sample Data -->
    ${
      sampleDataRows.length > 0
        ? `<div style="margin-bottom:24px;">
      <h3 style="color:#1e293b;font-size:16px;border-right:4px solid #ef4444;padding-right:12px;margin-bottom:12px;">⚠️ عينات من البيانات المسربة</h3>
      <p style="font-size:10px;color:#ef4444;margin-bottom:8px;text-align:right;">تنبيه: البيانات أدناه عينات توضيحية من التسريب لأغراض التوثيق فقط</p>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;direction:rtl;font-size:11px;">
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
        ? `<div style="margin-bottom:24px;">
      <h3 style="color:#1e293b;font-size:16px;border-right:4px solid #8b5cf6;padding-right:12px;margin-bottom:12px;">📸 لقطات الأدلة</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${screenshotSection}</div>
    </div>`
        : ""
    }

    <!-- AI Analysis -->
    ${aiSection}

    <!-- Evidence Chain -->
    ${evidenceChainSection}

    <!-- Verification Section -->
    <div style="margin-top:32px;border-top:2px solid #0d9488;padding-top:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="text-align:right;flex:1;">
          <h3 style="color:#0d9488;font-size:14px;margin:0 0 8px 0;">✅ التحقق من صحة الوثيقة</h3>
          <p style="font-size:11px;color:#64748b;margin:4px 0;">رقم التحقق: <strong style="color:#0d9488;font-family:monospace;font-size:13px;">${verificationCode}</strong></p>
          <p style="font-size:11px;color:#64748b;margin:4px 0;">بصمة المحتوى: <span style="font-family:monospace;font-size:10px;color:#6366f1;">${contentHash.substring(0, 32)}...</span></p>
          <p style="font-size:10px;color:#94a3b8;margin:8px 0 0 0;">امسح رمز QR أو أدخل رقم التحقق في منصة راصد للتحقق من صحة هذه الوثيقة</p>
        </div>
        <div style="text-align:center;">
          <img src="${qrDataUrl}" style="width:120px;height:120px;border-radius:8px;border:2px solid #0d948833;" />
          <p style="font-size:9px;color:#94a3b8;margin-top:4px;">امسح للتحقق</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-size:10px;color:#94a3b8;">هذه الوثيقة صادرة من منصة راصد — مكتب إدارة البيانات الوطنية (NDMO)</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:2px;">حماية البيانات الشخصية متطلب وطني</p>
      <p style="font-size:9px;color:#cbd5e1;margin-top:4px;">© ${new Date().getFullYear()} NDMO — جميع الحقوق محفوظة</p>
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
