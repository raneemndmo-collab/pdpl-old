/**
 * Master seed runner — clears existing data and inserts all realistic Saudi-only data
 * Column names match the actual database schema exactly
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Import leak data
const { leaks: mainLeaks } = await import("./seed-massive.mjs");
const { extraLeaks } = await import("./seed-extra-leaks.mjs");
const allLeaks = [...mainLeaks, ...extraLeaks];

async function clearAll() {
  console.log("🗑️  Clearing all data...");
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  const tables = [
    "alert_history","alert_rules","alert_contacts","scheduled_reports","api_keys",
    "retention_policies","audit_log","notifications","monitoring_jobs",
    "pii_scans","reports","paste_entries","dark_web_listings","leaks","channels"
  ];
  for (const t of tables) {
    try { await conn.query(`TRUNCATE TABLE \`${t}\``); } catch(e) { console.log(`  skip ${t}`); }
  }
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("✅ All data cleared");
}

// ============================================================
// CHANNELS — actual column names: channelId, name, platform, subscribers, status, lastActivity, leaksDetected, riskLevel
// ============================================================
async function seedChannels() {
  console.log("📡 Seeding channels...");
  const channels = [
    // Telegram channels
    { channelId: "CH-TG-001", name: "Saudi Leaks تسريبات سعودية", platform: "telegram", subscribers: 45000, status: "flagged", lastActivity: new Date("2026-02-10"), leaksDetected: 18, riskLevel: "high" },
    { channelId: "CH-TG-002", name: "KSA Data Dumps", platform: "telegram", subscribers: 28000, status: "active", lastActivity: new Date("2026-02-09"), leaksDetected: 12, riskLevel: "high" },
    { channelId: "CH-TG-003", name: "Gulf Hackers الخليج", platform: "telegram", subscribers: 67000, status: "flagged", lastActivity: new Date("2026-02-10"), leaksDetected: 24, riskLevel: "high" },
    { channelId: "CH-TG-004", name: "InfoStealer Logs SA", platform: "telegram", subscribers: 15000, status: "active", lastActivity: new Date("2026-02-08"), leaksDetected: 8, riskLevel: "medium" },
    { channelId: "CH-TG-005", name: "Combo Lists KSA", platform: "telegram", subscribers: 32000, status: "flagged", lastActivity: new Date("2026-02-10"), leaksDetected: 15, riskLevel: "high" },
    { channelId: "CH-TG-006", name: "Saudi Gov Leaks حكومي", platform: "telegram", subscribers: 9500, status: "active", lastActivity: new Date("2026-02-07"), leaksDetected: 6, riskLevel: "medium" },
    { channelId: "CH-TG-007", name: "Banking Data SA", platform: "telegram", subscribers: 11000, status: "active", lastActivity: new Date("2026-02-06"), leaksDetected: 4, riskLevel: "medium" },
    { channelId: "CH-TG-008", name: "Healthcare Dumps KSA", platform: "telegram", subscribers: 7500, status: "active", lastActivity: new Date("2026-02-05"), leaksDetected: 3, riskLevel: "low" },
    // Dark Web forums
    { channelId: "CH-DW-001", name: "BreachForums — Saudi Section", platform: "darkweb", subscribers: 0, status: "flagged", lastActivity: new Date("2026-02-10"), leaksDetected: 22, riskLevel: "high" },
    { channelId: "CH-DW-002", name: "XSS.is — KSA Threads", platform: "darkweb", subscribers: 0, status: "active", lastActivity: new Date("2026-02-09"), leaksDetected: 14, riskLevel: "high" },
    { channelId: "CH-DW-003", name: "Exploit.in — Saudi Market", platform: "darkweb", subscribers: 0, status: "active", lastActivity: new Date("2026-02-08"), leaksDetected: 9, riskLevel: "high" },
    { channelId: "CH-DW-004", name: "RaidForums Archive — SA", platform: "darkweb", subscribers: 0, status: "active", lastActivity: new Date("2026-01-15"), leaksDetected: 7, riskLevel: "medium" },
    { channelId: "CH-DW-005", name: "LeakBase — Saudi Data", platform: "darkweb", subscribers: 0, status: "active", lastActivity: new Date("2026-02-07"), leaksDetected: 5, riskLevel: "medium" },
    // Paste sites
    { channelId: "CH-PS-001", name: "Pastebin — Saudi PII", platform: "paste", subscribers: 0, status: "active", lastActivity: new Date("2026-02-10"), leaksDetected: 11, riskLevel: "high" },
    { channelId: "CH-PS-002", name: "Ghostbin — KSA Dumps", platform: "paste", subscribers: 0, status: "active", lastActivity: new Date("2026-02-09"), leaksDetected: 6, riskLevel: "medium" },
    { channelId: "CH-PS-003", name: "PrivateBin — SA Credentials", platform: "paste", subscribers: 0, status: "active", lastActivity: new Date("2026-02-08"), leaksDetected: 4, riskLevel: "medium" },
    { channelId: "CH-PS-004", name: "JustPaste.it — Saudi Data", platform: "paste", subscribers: 0, status: "active", lastActivity: new Date("2026-02-06"), leaksDetected: 3, riskLevel: "low" },
  ];
  for (const ch of channels) {
    await conn.query(
      "INSERT INTO `channels` (`channelId`,`name`,`platform`,`subscribers`,`status`,`lastActivity`,`leaksDetected`,`riskLevel`) VALUES (?,?,?,?,?,?,?,?)",
      [ch.channelId, ch.name, ch.platform, ch.subscribers, ch.status, ch.lastActivity, ch.leaksDetected, ch.riskLevel]
    );
  }
  console.log(`✅ ${channels.length} channels seeded`);
}

// ============================================================
// LEAKS — 85 records from seed-massive.mjs + seed-extra-leaks.mjs
// Columns: leakId, title, titleAr, source, severity, sector, sectorAr, piiTypes, recordCount, status, description, descriptionAr, aiSeverity, aiSummary, aiSummaryAr, aiRecommendations, aiRecommendationsAr, aiConfidence, enrichedAt, region, regionAr, city, cityAr, latitude, longitude, detectedAt
// ============================================================
async function seedLeaks() {
  console.log(`🔓 Seeding ${allLeaks.length} leaks...`);
  let count = 0;
  for (const l of allLeaks) {
    try {
      await conn.query(
        `INSERT INTO leaks (leakId, title, titleAr, source, severity, sector, sectorAr, piiTypes, recordCount, status, description, descriptionAr, aiSeverity, aiSummary, aiSummaryAr, aiRecommendations, aiRecommendationsAr, aiConfidence, enrichedAt, region, regionAr, city, cityAr, latitude, longitude, detectedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          l.leakId, l.title, l.titleAr, l.source, l.severity,
          l.sector, l.sectorAr,
          typeof l.piiTypes === "string" ? l.piiTypes : JSON.stringify(l.piiTypes || []),
          l.recordCount || 0, l.status || "new",
          l.description || null, l.descriptionAr || null,
          l.aiSeverity || null, l.aiSummary || null, l.aiSummaryAr || null,
          l.aiRecommendations ? (typeof l.aiRecommendations === "string" ? l.aiRecommendations : JSON.stringify(l.aiRecommendations)) : null,
          l.aiRecommendationsAr ? (typeof l.aiRecommendationsAr === "string" ? l.aiRecommendationsAr : JSON.stringify(l.aiRecommendationsAr)) : null,
          l.aiConfidence || null, l.enrichedAt || null,
          l.region || null, l.regionAr || null, l.city || null, l.cityAr || null,
          l.latitude || null, l.longitude || null,
          l.detectedAt || new Date(),
        ]
      );
      count++;
    } catch (e) {
      console.error(`  ⚠️  Failed: ${l.leakId} ${l.title?.substring(0,40)}... — ${e.message}`);
    }
  }
  console.log(`✅ ${count}/${allLeaks.length} leaks seeded`);
}

// ============================================================
// DARK WEB LISTINGS — columns: title, titleAr, listingSeverity, sourceChannelId, sourceName, price, recordCount, detectedAt
// ============================================================
async function seedDarkWebListings() {
  console.log("🕸️  Seeding dark web listings...");
  const listings = [
    { title: "Saudi MoFA 1.4M Employee Records", titleAr: "1.4 مليون سجل موظف وزارة الخارجية", listingSeverity: "critical", sourceName: "BreachForums", price: "$50,000", recordCount: 1400000, detectedAt: new Date("2024-01-13") },
    { title: "KSA Health Platform — 7M Patient DB", titleAr: "منصة صحية سعودية — 7 مليون سجل مريض", listingSeverity: "critical", sourceName: "Exploit.in", price: "$75,000", recordCount: 7000000, detectedAt: new Date("2024-02-20") },
    { title: "Saudi Aramco Contractor Credentials", titleAr: "بيانات اعتماد مقاولي أرامكو", listingSeverity: "critical", sourceName: "XSS.is", price: "$120,000", recordCount: 500000, detectedAt: new Date("2024-03-15") },
    { title: "STC 2.3M Customer Records", titleAr: "2.3 مليون سجل عميل STC", listingSeverity: "critical", sourceName: "BreachForums", price: "$40,000", recordCount: 2300000, detectedAt: new Date("2024-03-15") },
    { title: "Al Rajhi Bank Customer Data", titleAr: "بيانات عملاء مصرف الراجحي", listingSeverity: "critical", sourceName: "Exploit.in", price: "$90,000", recordCount: 850000, detectedAt: new Date("2024-04-10") },
    { title: "Saudi Airlines Passenger Records", titleAr: "سجلات ركاب الخطوط السعودية", listingSeverity: "high", sourceName: "BreachForums", price: "$35,000", recordCount: 1200000, detectedAt: new Date("2024-05-20") },
    { title: "NEOM Worker Database", titleAr: "قاعدة بيانات عمال نيوم", listingSeverity: "high", sourceName: "XSS.is", price: "$25,000", recordCount: 450000, detectedAt: new Date("2024-06-01") },
    { title: "Hajj 2025 Pilgrim Records", titleAr: "سجلات حجاج 2025", listingSeverity: "critical", sourceName: "BreachForums", price: "$30,000", recordCount: 750000, detectedAt: new Date("2025-07-15") },
    { title: "GOSI Social Insurance Data", titleAr: "بيانات التأمينات الاجتماعية", listingSeverity: "critical", sourceName: "XSS.is", price: "$55,000", recordCount: 920000, detectedAt: new Date("2025-03-10") },
    { title: "Saudi University Student Records", titleAr: "سجلات طلاب جامعات سعودية", listingSeverity: "high", sourceName: "LeakBase", price: "$15,000", recordCount: 380000, detectedAt: new Date("2025-01-20") },
    { title: "Absher Platform Credentials", titleAr: "بيانات اعتماد منصة أبشر", listingSeverity: "critical", sourceName: "BreachForums", price: "$200,000", recordCount: 3200000, detectedAt: new Date("2025-05-01") },
    { title: "Saudi Real Estate Registry", titleAr: "سجل العقارات السعودي", listingSeverity: "high", sourceName: "Exploit.in", price: "$45,000", recordCount: 560000, detectedAt: new Date("2025-06-15") },
    { title: "Tawakkalna Health Data", titleAr: "بيانات توكلنا الصحية", listingSeverity: "critical", sourceName: "XSS.is", price: "$80,000", recordCount: 2100000, detectedAt: new Date("2025-04-20") },
    { title: "Saudi Electricity Company Records", titleAr: "سجلات شركة الكهرباء السعودية", listingSeverity: "medium", sourceName: "LeakBase", price: "$12,000", recordCount: 290000, detectedAt: new Date("2025-08-10") },
    { title: "Mobily Customer Database", titleAr: "قاعدة بيانات عملاء موبايلي", listingSeverity: "high", sourceName: "BreachForums", price: "$28,000", recordCount: 1500000, detectedAt: new Date("2025-09-01") },
  ];
  for (const dw of listings) {
    await conn.query(
      "INSERT INTO `dark_web_listings` (`title`,`titleAr`,`listingSeverity`,`sourceName`,`price`,`recordCount`,`detectedAt`) VALUES (?,?,?,?,?,?,?)",
      [dw.title, dw.titleAr, dw.listingSeverity, dw.sourceName, dw.price, dw.recordCount, dw.detectedAt]
    );
  }
  console.log(`✅ ${listings.length} dark web listings seeded`);
}

// ============================================================
// PASTE ENTRIES — columns: filename, sourceName, fileSize, pastePiiTypes, preview, pasteStatus, detectedAt
// ============================================================
async function seedPasteEntries() {
  console.log("📋 Seeding paste entries...");
  const pastes = [
    { filename: "saudi_national_ids_2024.txt", sourceName: "Pastebin", fileSize: "4.2 MB", pastePiiTypes: JSON.stringify(["National ID","Full Name"]), preview: "1087654321 | محمد أحمد الشهري\n2198765432 | فاطمة علي القحطاني\n1034567890 | عبدالله خالد العتيبي...", pasteStatus: "documented", detectedAt: new Date("2024-06-15") },
    { filename: "stc_customers_dump.csv", sourceName: "Ghostbin", fileSize: "128 MB", pastePiiTypes: JSON.stringify(["Phone","National ID","Email","IMEI"]), preview: "0551234567,1087654321,user@stc.sa,358240051111110\n0569876543,2198765432,customer@stc.sa,358240052222220...", pasteStatus: "reported", detectedAt: new Date("2024-03-20") },
    { filename: "mofa_employees_leak.json", sourceName: "PrivateBin", fileSize: "890 MB", pastePiiTypes: JSON.stringify(["Full Name","National ID","Email","Phone","Job Title"]), preview: "{\"name\":\"أحمد محمد\",\"id\":\"1087654321\",\"email\":\"ahmed@mofa.gov.sa\",\"dept\":\"الشؤون القنصلية\"}...", pasteStatus: "reported", detectedAt: new Date("2024-01-14") },
    { filename: "rajhi_bank_accounts.sql", sourceName: "Pastebin", fileSize: "2.1 GB", pastePiiTypes: JSON.stringify(["IBAN","National ID","Full Name","Account Balance"]), preview: "INSERT INTO accounts VALUES ('SA0380000000608010167519','1087654321','محمد الشهري',125000.50)...", pasteStatus: "documented", detectedAt: new Date("2024-04-12") },
    { filename: "absher_credentials_combo.txt", sourceName: "JustPaste.it", fileSize: "56 MB", pastePiiTypes: JSON.stringify(["National ID","Password","Email"]), preview: "1087654321:P@ssw0rd123:user@gmail.com\n2198765432:Qwerty456:ahmed@outlook.sa...", pasteStatus: "flagged", detectedAt: new Date("2025-05-02") },
    { filename: "hajj_2025_pilgrims.csv", sourceName: "Pastebin", fileSize: "340 MB", pastePiiTypes: JSON.stringify(["Passport","Full Name","Phone","Nationality"]), preview: "A12345678,محمد أحمد,+966551234567,SA\nB98765432,فاطمة علي,+966569876543,SA...", pasteStatus: "reported", detectedAt: new Date("2025-07-16") },
    { filename: "gosi_insurance_records.json", sourceName: "Ghostbin", fileSize: "1.5 GB", pastePiiTypes: JSON.stringify(["National ID","Salary","Employer","Insurance Number"]), preview: "{\"nationalId\":\"1087654321\",\"salary\":15000,\"employer\":\"أرامكو\",\"insuranceNo\":\"GOSI-2024-001\"}...", pasteStatus: "documented", detectedAt: new Date("2025-03-11") },
    { filename: "saudi_medical_records.xml", sourceName: "PrivateBin", fileSize: "780 MB", pastePiiTypes: JSON.stringify(["National ID","Medical History","Blood Type","Medications"]), preview: "<patient><id>1087654321</id><diagnosis>Type 2 Diabetes</diagnosis><blood>O+</blood></patient>...", pasteStatus: "flagged", detectedAt: new Date("2025-09-15") },
    { filename: "neom_workers_passports.csv", sourceName: "Pastebin", fileSize: "210 MB", pastePiiTypes: JSON.stringify(["Passport","Full Name","Nationality","Visa Number"]), preview: "C45678901,عمر حسن,PK,VISA-2024-45678\nD56789012,راجيش كومار,IN,VISA-2024-56789...", pasteStatus: "documented", detectedAt: new Date("2024-06-02") },
    { filename: "saudi_vehicle_registry.txt", sourceName: "JustPaste.it", fileSize: "95 MB", pastePiiTypes: JSON.stringify(["National ID","License Plate","Vehicle VIN"]), preview: "1087654321 | أ ب ت 1234 | 1HGBH41JXMN109186\n2198765432 | ه و ز 5678 | 2HGBH41JXMN209287...", pasteStatus: "analyzing", detectedAt: new Date("2025-11-20") },
    { filename: "tawakkalna_health_dump.json", sourceName: "Ghostbin", fileSize: "2.8 GB", pastePiiTypes: JSON.stringify(["National ID","Vaccination Status","PCR Results","Health Conditions"]), preview: "{\"id\":\"1087654321\",\"vaccinated\":true,\"doses\":3,\"lastPCR\":\"negative\",\"conditions\":[\"none\"]}...", pasteStatus: "reported", detectedAt: new Date("2025-04-21") },
    { filename: "saudi_electricity_bills.csv", sourceName: "Pastebin", fileSize: "67 MB", pastePiiTypes: JSON.stringify(["National ID","Address","Account Number","Consumption"]), preview: "1087654321,شارع الملك فهد الرياض,SEC-2024-001234,1250 kWh...", pasteStatus: "flagged", detectedAt: new Date("2025-08-11") },
  ];
  for (const p of pastes) {
    await conn.query(
      "INSERT INTO `paste_entries` (`filename`,`sourceName`,`fileSize`,`pastePiiTypes`,`preview`,`pasteStatus`,`detectedAt`) VALUES (?,?,?,?,?,?,?)",
      [p.filename, p.sourceName, p.fileSize, p.pastePiiTypes, p.preview, p.pasteStatus, p.detectedAt]
    );
  }
  console.log(`✅ ${pastes.length} paste entries seeded`);
}

// ============================================================
// REPORTS — columns: title, titleAr, type, reportStatus, pageCount, fileUrl
// ============================================================
async function seedReports() {
  console.log("📊 Seeding reports...");
  const reports = [
    { title: "Q4 2025 — Saudi Data Breach Landscape Report", titleAr: "تقرير مشهد تسريبات البيانات السعودية — الربع الرابع 2025", type: "quarterly", reportStatus: "published", pageCount: 48 },
    { title: "Q3 2025 — Threat Intelligence Summary", titleAr: "ملخص استخبارات التهديدات — الربع الثالث 2025", type: "quarterly", reportStatus: "published", pageCount: 42 },
    { title: "January 2026 — Monthly Monitoring Report", titleAr: "تقرير المراقبة الشهري — يناير 2026", type: "monthly", reportStatus: "published", pageCount: 28 },
    { title: "December 2025 — Monthly Monitoring Report", titleAr: "تقرير المراقبة الشهري — ديسمبر 2025", type: "monthly", reportStatus: "published", pageCount: 25 },
    { title: "Special Report — Ministry of Foreign Affairs Breach Analysis", titleAr: "تقرير خاص — تحليل اختراق وزارة الخارجية", type: "special", reportStatus: "published", pageCount: 35 },
    { title: "Special Report — Aramco Contractor Data Exposure", titleAr: "تقرير خاص — تعرض بيانات مقاولي أرامكو", type: "special", reportStatus: "published", pageCount: 22 },
    { title: "Q2 2025 — PDPL Compliance Assessment", titleAr: "تقييم الامتثال لنظام حماية البيانات الشخصية — الربع الثاني 2025", type: "quarterly", reportStatus: "published", pageCount: 55 },
    { title: "Special Report — Hajj 2025 Data Protection Review", titleAr: "تقرير خاص — مراجعة حماية بيانات الحج 2025", type: "special", reportStatus: "published", pageCount: 30 },
    { title: "February 2026 — Monthly Monitoring Report", titleAr: "تقرير المراقبة الشهري — فبراير 2026", type: "monthly", reportStatus: "draft", pageCount: 0 },
    { title: "Q1 2025 — Annual Threat Landscape", titleAr: "مشهد التهديدات السنوي — الربع الأول 2025", type: "quarterly", reportStatus: "published", pageCount: 62 },
  ];
  for (const r of reports) {
    await conn.query(
      "INSERT INTO `reports` (`title`,`titleAr`,`type`,`reportStatus`,`pageCount`) VALUES (?,?,?,?,?)",
      [r.title, r.titleAr, r.type, r.reportStatus, r.pageCount]
    );
  }
  console.log(`✅ ${reports.length} reports seeded`);
}

// ============================================================
// PII SCANS — columns: userId, inputText, results, totalMatches
// ============================================================
async function seedPiiScans() {
  console.log("🔍 Seeding PII scans...");
  const scans = [
    { userId: 1, inputText: "تم العثور على أرقام هوية وطنية: 1087654321، 2198765432 وأرقام هواتف: 0551234567، 0569876543 في تسريب قاعدة بيانات STC", totalMatches: 4, results: JSON.stringify([{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1087654321",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"2198765432",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"0551234567",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"0569876543",line:1}]) },
    { userId: 1, inputText: "بيانات مصرفية مسربة تحتوي على IBAN: SA0380000000608010167519 وأرقام هوية: 1034567890 مع عناوين بريد: ahmed@example.sa", totalMatches: 3, results: JSON.stringify([{type:"IBAN",typeAr:"رقم الآيبان",value:"SA0380000000608010167519",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1034567890",line:1},{type:"Email",typeAr:"بريد إلكتروني",value:"ahmed@example.sa",line:1}]) },
    { userId: 1, inputText: "فحص تسريب وزارة الصحة: أرقام هوية 1123456789، 2234567890، 1098765432 مع أرقام هواتف 0541112233، 0559998877، 0567654321 وعناوين بريد patient1@moh.gov.sa", totalMatches: 7, results: JSON.stringify([{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1123456789",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"2234567890",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1098765432",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"0541112233",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"0559998877",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"0567654321",line:1},{type:"Email",typeAr:"بريد إلكتروني",value:"patient1@moh.gov.sa",line:1}]) },
    { userId: 1, inputText: "تحليل بيانات InfoStealer: بريد إلكتروني user@alrajhi.com.sa كلمة مرور P@ssw0rd123 رقم هوية 1045678901 IBAN SA4420000001234567891234", totalMatches: 4, results: JSON.stringify([{type:"Email",typeAr:"بريد إلكتروني",value:"user@alrajhi.com.sa",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1045678901",line:1},{type:"IBAN",typeAr:"رقم الآيبان",value:"SA4420000001234567891234",line:1}]) },
    { userId: 1, inputText: "مسح بيانات تسريب أبشر: 1056789012، 1067890123، 1078901234، 2089012345، 2090123456 — أرقام هوية مع بيانات اعتماد مخترقة", totalMatches: 5, results: JSON.stringify([{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1056789012",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1067890123",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"1078901234",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"2089012345",line:1},{type:"National ID",typeAr:"رقم الهوية الوطنية",value:"2090123456",line:1}]) },
    { userId: 1, inputText: "فحص تسريب بيانات الحج 2025: جوازات سفر A12345678، B98765432 مع أرقام هواتف +966551234567، +966569876543 وبريد pilgrim@hajj.sa", totalMatches: 5, results: JSON.stringify([{type:"Phone",typeAr:"رقم الهاتف",value:"+966551234567",line:1},{type:"Phone",typeAr:"رقم الهاتف",value:"+966569876543",line:1},{type:"Email",typeAr:"بريد إلكتروني",value:"pilgrim@hajj.sa",line:1}]) },
  ];
  for (const s of scans) {
    await conn.query(
      "INSERT INTO `pii_scans` (`userId`,`inputText`,`results`,`totalMatches`) VALUES (?,?,?,?)",
      [s.userId, s.inputText, s.results, s.totalMatches]
    );
  }
  console.log(`✅ ${scans.length} PII scans seeded`);
}

// ============================================================
// MONITORING JOBS — columns: jobId, jobName, jobNameAr, jobPlatform, cronExpression, jobStatus, lastRunAt, nextRunAt, lastResult, leaksFound, totalRuns
// ============================================================
async function seedMonitoringJobs() {
  console.log("⏰ Seeding monitoring jobs...");
  const jobs = [
    { jobId: "JOB-TG-001", jobName: "Telegram Channel Monitor", jobNameAr: "مراقب قنوات تيليجرام", jobPlatform: "telegram", cronExpression: "*/15 * * * *", jobStatus: "active", lastRunAt: new Date("2026-02-10T16:45:00"), nextRunAt: new Date("2026-02-10T17:00:00"), lastResult: "Scanned 8 channels, 2450 messages. Found 1 new leak.", leaksFound: 18, totalRuns: 1248 },
    { jobId: "JOB-DW-001", jobName: "Dark Web Forum Scanner", jobNameAr: "ماسح منتديات الويب المظلم", jobPlatform: "darkweb", cronExpression: "*/30 * * * *", jobStatus: "active", lastRunAt: new Date("2026-02-10T16:30:00"), nextRunAt: new Date("2026-02-10T17:00:00"), lastResult: "Scanned 5 forums, 890 threads. Found 3 new listings.", leaksFound: 22, totalRuns: 624 },
    { jobId: "JOB-PS-001", jobName: "Paste Site Monitor", jobNameAr: "مراقب مواقع اللصق", jobPlatform: "paste", cronExpression: "*/20 * * * *", jobStatus: "active", lastRunAt: new Date("2026-02-10T16:40:00"), nextRunAt: new Date("2026-02-10T17:00:00"), lastResult: "Scanned 4 sites, 1560 pastes. Found 2 new entries.", leaksFound: 11, totalRuns: 936 },
    { jobId: "JOB-ALL-001", jobName: "Full Sweep", jobNameAr: "مسح شامل", jobPlatform: "all", cronExpression: "0 */2 * * *", jobStatus: "active", lastRunAt: new Date("2026-02-10T16:00:00"), nextRunAt: new Date("2026-02-10T18:00:00"), lastResult: "Full sweep: 17 sources, 15600 records scanned. 4 new leaks detected. AI enrichment triggered.", leaksFound: 51, totalRuns: 312 },
  ];
  for (const j of jobs) {
    await conn.query(
      "INSERT INTO `monitoring_jobs` (`jobId`,`jobName`,`jobNameAr`,`jobPlatform`,`cronExpression`,`jobStatus`,`lastRunAt`,`nextRunAt`,`lastResult`,`leaksFound`,`totalRuns`) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [j.jobId, j.jobName, j.jobNameAr, j.jobPlatform, j.cronExpression, j.jobStatus, j.lastRunAt, j.nextRunAt, j.lastResult, j.leaksFound, j.totalRuns]
    );
  }
  console.log(`✅ ${jobs.length} monitoring jobs seeded`);
}

// ============================================================
// NOTIFICATIONS — columns: notificationType, notifTitle, notifTitleAr, notifMessage, notifMessageAr, notifSeverity, isRead, relatedId
// ============================================================
async function seedNotifications() {
  console.log("🔔 Seeding notifications...");
  const notifs = [
    { notificationType: "new_leak", notifTitle: "تسريب بيانات جديد — وزارة الخارجية", notifTitleAr: "تسريب بيانات جديد — وزارة الخارجية", notifMessage: "Detected 1.4M employee records from Ministry of Foreign Affairs on BreachForums", notifMessageAr: "تم اكتشاف 1.4 مليون سجل موظف من وزارة الخارجية على BreachForums", notifSeverity: "critical", isRead: false, relatedId: "LK-2024-0001" },
    { notificationType: "new_leak", notifTitle: "تسريب بيانات جديد — STC", notifTitleAr: "تسريب بيانات جديد — STC", notifMessage: "Detected 2.3M STC customer records for sale on Exploit.in", notifMessageAr: "تم اكتشاف 2.3 مليون سجل عميل STC معروض للبيع على Exploit.in", notifSeverity: "critical", isRead: false, relatedId: "LK-2024-0026" },
    { notificationType: "scan_complete", notifTitle: "اكتمال المسح الشامل", notifTitleAr: "اكتمال المسح الشامل", notifMessage: "Full sweep completed — 4 new leaks detected across 12 sources", notifMessageAr: "تم إكمال المسح الشامل — 4 تسريبات جديدة مكتشفة عبر 12 مصدر", notifSeverity: "high", isRead: true },
    { notificationType: "status_change", notifTitle: "تحديث حالة — تسريب مصرف الراجحي", notifTitleAr: "تحديث حالة — تسريب مصرف الراجحي", notifMessage: "Al Rajhi Bank leak status changed from 'analyzing' to 'reported'", notifMessageAr: "تم تغيير حالة تسريب مصرف الراجحي من 'قيد التحقيق' إلى 'مبلّغ'", notifSeverity: "high", isRead: true },
    { notificationType: "new_leak", notifTitle: "تسريب بيانات جديد — بيانات حجاج 2025", notifTitleAr: "تسريب بيانات جديد — بيانات حجاج 2025", notifMessage: "750,000 Hajj pilgrim records detected for sale at $30,000", notifMessageAr: "تم اكتشاف 750,000 سجل حاج معروض للبيع بسعر $30,000", notifSeverity: "critical", isRead: true },
    { notificationType: "system", notifTitle: "اكتمال إثراء AI", notifTitleAr: "اكتمال إثراء AI", notifMessage: "AI enrichment completed for 12 new leaks — 4 classified as critical", notifMessageAr: "تم إثراء 12 تسريب جديد بتحليل الذكاء الاصطناعي — 4 مصنفة كحرجة", notifSeverity: "medium", isRead: true },
    { notificationType: "system", notifTitle: "تنبيه — محاولة وصول غير مصرح", notifTitleAr: "تنبيه — محاولة وصول غير مصرح", notifMessage: "15 unauthorized API access attempts detected in the last hour", notifMessageAr: "تم اكتشاف 15 محاولة وصول غير مصرح لواجهة API خلال الساعة الأخيرة", notifSeverity: "high", isRead: true },
    { notificationType: "new_leak", notifTitle: "تسريب جديد — التأمينات الاجتماعية", notifTitleAr: "تسريب جديد — التأمينات الاجتماعية", notifMessage: "920,000 GOSI records detected on XSS.is", notifMessageAr: "تم اكتشاف 920,000 سجل تأمينات اجتماعية على XSS.is", notifSeverity: "critical", isRead: true },
    { notificationType: "system", notifTitle: "تنفيذ سياسة الاحتفاظ", notifTitleAr: "تنفيذ سياسة الاحتفاظ", notifMessage: "Retention policy executed — 1,250 audit records archived", notifMessageAr: "تم أرشفة 1,250 سجل تدقيق أقدم من 90 يوم", notifSeverity: "info", isRead: true },
    { notificationType: "scan_complete", notifTitle: "اكتمال فحص PII", notifTitleAr: "اكتمال فحص PII", notifMessage: "PII scan completed — 24 personal data matches found in 5 new leaks", notifMessageAr: "تم فحص 5 تسريبات جديدة — إجمالي 24 تطابق بيانات شخصية مكتشف", notifSeverity: "medium", isRead: true },
    { notificationType: "new_leak", notifTitle: "تسريب جديد — منصة أبشر", notifTitleAr: "تسريب جديد — منصة أبشر", notifMessage: "3.2M Absher credentials detected on BreachForums", notifMessageAr: "تم اكتشاف 3.2 مليون بيانات اعتماد أبشر على BreachForums", notifSeverity: "critical", isRead: true },
    { notificationType: "new_leak", notifTitle: "تسريب جديد — أرامكو", notifTitleAr: "تسريب جديد — أرامكو", notifMessage: "500K Aramco contractor records detected on XSS.is", notifMessageAr: "تم اكتشاف 500,000 سجل مقاول أرامكو على XSS.is", notifSeverity: "critical", isRead: true },
  ];
  for (const n of notifs) {
    await conn.query(
      "INSERT INTO `notifications` (`notificationType`,`notifTitle`,`notifTitleAr`,`notifMessage`,`notifMessageAr`,`notifSeverity`,`isRead`,`relatedId`) VALUES (?,?,?,?,?,?,?,?)",
      [n.notificationType, n.notifTitle, n.notifTitleAr, n.notifMessage, n.notifMessageAr, n.notifSeverity, n.isRead, n.relatedId || null]
    );
  }
  console.log(`✅ ${notifs.length} notifications seeded`);
}

// ============================================================
// ALERT CONTACTS — columns: contactName, contactNameAr, contactEmail, contactPhone, contactRole, contactRoleAr, isActive
// ============================================================
async function seedAlertContacts() {
  console.log("📧 Seeding alert contacts...");
  const contacts = [
    { contactName: "م. عبدالله الشهري", contactNameAr: "م. عبدالله الشهري", contactEmail: "a.alshehri@ndmo.gov.sa", contactPhone: "+966501234567", contactRole: "CISO", contactRoleAr: "مدير أمن المعلومات", isActive: true },
    { contactName: "م. سارة القحطاني", contactNameAr: "م. سارة القحطاني", contactEmail: "s.alqahtani@ndmo.gov.sa", contactPhone: "+966509876543", contactRole: "Senior Threat Analyst", contactRoleAr: "محللة تهديدات أولى", isActive: true },
    { contactName: "م. فهد العتيبي", contactNameAr: "م. فهد العتيبي", contactEmail: "f.alotaibi@ndmo.gov.sa", contactPhone: "+966505551234", contactRole: "Incident Response Manager", contactRoleAr: "مدير الاستجابة للحوادث", isActive: true },
    { contactName: "د. نورة الدوسري", contactNameAr: "د. نورة الدوسري", contactEmail: "n.aldosari@sdaia.gov.sa", contactPhone: "+966507778899", contactRole: "Compliance Director", contactRoleAr: "مديرة الامتثال", isActive: true },
    { contactName: "م. خالد المطيري", contactNameAr: "م. خالد المطيري", contactEmail: "k.almutairi@ndmo.gov.sa", contactPhone: "+966503334455", contactRole: "Security Analyst", contactRoleAr: "محلل أمني", isActive: true },
  ];
  for (const c of contacts) {
    await conn.query(
      "INSERT INTO `alert_contacts` (`contactName`,`contactNameAr`,`contactEmail`,`contactPhone`,`contactRole`,`contactRoleAr`,`isActive`) VALUES (?,?,?,?,?,?,?)",
      [c.contactName, c.contactNameAr, c.contactEmail, c.contactPhone, c.contactRole, c.contactRoleAr, c.isActive]
    );
  }
  console.log(`✅ ${contacts.length} alert contacts seeded`);
}

// ============================================================
// ALERT RULES — columns: ruleName, ruleNameAr, severityThreshold, alertChannel, isEnabled
// ============================================================
async function seedAlertRules() {
  console.log("📋 Seeding alert rules...");
  const rules = [
    { ruleName: "تنبيه التسريبات الحرجة", ruleNameAr: "تنبيه التسريبات الحرجة", severityThreshold: "critical", alertChannel: "both", isEnabled: true },
    { ruleName: "تنبيه التسريبات عالية الخطورة", ruleNameAr: "تنبيه التسريبات عالية الخطورة", severityThreshold: "high", alertChannel: "email", isEnabled: true },
    { ruleName: "تنبيه SMS للحوادث الحرجة", ruleNameAr: "تنبيه SMS للحوادث الحرجة", severityThreshold: "critical", alertChannel: "sms", isEnabled: true },
    { ruleName: "تنبيه الويب المظلم", ruleNameAr: "تنبيه الويب المظلم", severityThreshold: "high", alertChannel: "email", isEnabled: true },
  ];
  for (const r of rules) {
    await conn.query(
      "INSERT INTO `alert_rules` (`ruleName`,`ruleNameAr`,`severityThreshold`,`alertChannel`,`isEnabled`) VALUES (?,?,?,?,?)",
      [r.ruleName, r.ruleNameAr, r.severityThreshold, r.alertChannel, r.isEnabled]
    );
  }
  console.log(`✅ ${rules.length} alert rules seeded`);
}

// ============================================================
// ALERT HISTORY — columns: ruleId, contactId, alertContactName, deliveryChannel, alertSubject, alertBody, deliveryStatus, alertLeakId, sentAt
// ============================================================
async function seedAlertHistory() {
  console.log("📨 Seeding alert history...");
  const history = [
    { ruleId: 1, contactId: 1, alertContactName: "م. عبدالله الشهري", deliveryChannel: "email", alertSubject: "تنبيه حرج — تسريب وزارة الخارجية", alertBody: "تم اكتشاف تسريب 1.4 مليون سجل", deliveryStatus: "sent", alertLeakId: "LK-2024-0001", sentAt: new Date("2024-01-13T14:31:00") },
    { ruleId: 3, contactId: 3, alertContactName: "م. فهد العتيبي", deliveryChannel: "sms", alertSubject: "تنبيه SMS — تسريب وزارة الخارجية", alertBody: "تسريب حرج: 1.4M سجل MoFA", deliveryStatus: "sent", alertLeakId: "LK-2024-0001", sentAt: new Date("2024-01-13T14:31:30") },
    { ruleId: 1, contactId: 2, alertContactName: "م. سارة القحطاني", deliveryChannel: "email", alertSubject: "تنبيه حرج — تسريب STC", alertBody: "تم اكتشاف 2.3 مليون سجل عميل STC", deliveryStatus: "sent", alertLeakId: "LK-2024-0026", sentAt: new Date("2024-03-15T12:16:00") },
    { ruleId: 2, contactId: 4, alertContactName: "د. نورة الدوسري", deliveryChannel: "email", alertSubject: "تنبيه — تسريب بيانات الحج", alertBody: "تم اكتشاف 750,000 سجل حاج", deliveryStatus: "sent", alertLeakId: "LK-2025-0015", sentAt: new Date("2025-07-15T08:21:00") },
    { ruleId: 1, contactId: 1, alertContactName: "م. عبدالله الشهري", deliveryChannel: "email", alertSubject: "تنبيه حرج — التأمينات الاجتماعية", alertBody: "تم اكتشاف 920,000 سجل GOSI", deliveryStatus: "sent", alertLeakId: "LK-2025-0010", sentAt: new Date("2025-03-10T11:01:00") },
    { ruleId: 3, contactId: 1, alertContactName: "م. عبدالله الشهري", deliveryChannel: "sms", alertSubject: "SMS — تسريب GOSI", alertBody: "تسريب حرج: 920K سجل GOSI", deliveryStatus: "sent", alertLeakId: "LK-2025-0010", sentAt: new Date("2025-03-10T11:01:30") },
    { ruleId: 2, contactId: 5, alertContactName: "م. خالد المطيري", deliveryChannel: "email", alertSubject: "تنبيه — تسريب أرامكو", alertBody: "تم اكتشاف بيانات مقاولي أرامكو", deliveryStatus: "failed", alertLeakId: "LK-2024-0003", sentAt: new Date("2024-03-15T09:15:00") },
    { ruleId: 1, contactId: 2, alertContactName: "م. سارة القحطاني", deliveryChannel: "email", alertSubject: "تنبيه حرج — منصة أبشر", alertBody: "تم اكتشاف 3.2 مليون بيانات اعتماد أبشر", deliveryStatus: "sent", alertLeakId: "LK-2025-0013", sentAt: new Date("2025-05-01T16:30:00") },
  ];
  for (const h of history) {
    await conn.query(
      "INSERT INTO `alert_history` (`ruleId`,`contactId`,`alertContactName`,`deliveryChannel`,`alertSubject`,`alertBody`,`deliveryStatus`,`alertLeakId`,`sentAt`) VALUES (?,?,?,?,?,?,?,?,?)",
      [h.ruleId, h.contactId, h.alertContactName, h.deliveryChannel, h.alertSubject, h.alertBody, h.deliveryStatus, h.alertLeakId, h.sentAt]
    );
  }
  console.log(`✅ ${history.length} alert history entries seeded`);
}

// ============================================================
// RETENTION POLICIES — columns: retentionEntity, entityLabel, entityLabelAr, retentionDays, archiveAction, isEnabled, recordsArchived
// ============================================================
async function seedRetentionPolicies() {
  console.log("🗄️  Seeding retention policies...");
  const policies = [
    { retentionEntity: "leaks", entityLabel: "Leak Records", entityLabelAr: "سجلات التسريبات", retentionDays: 730, archiveAction: "archive", isEnabled: true, recordsArchived: 0 },
    { retentionEntity: "audit_logs", entityLabel: "Audit Logs", entityLabelAr: "سجلات التدقيق", retentionDays: 365, archiveAction: "archive", isEnabled: true, recordsArchived: 1250 },
    { retentionEntity: "notifications", entityLabel: "Notifications", entityLabelAr: "الإشعارات", retentionDays: 90, archiveAction: "delete", isEnabled: true, recordsArchived: 450 },
    { retentionEntity: "pii_scans", entityLabel: "PII Scans", entityLabelAr: "فحوصات البيانات الشخصية", retentionDays: 180, archiveAction: "archive", isEnabled: true, recordsArchived: 85 },
    { retentionEntity: "paste_entries", entityLabel: "Paste Entries", entityLabelAr: "إدخالات مواقع اللصق", retentionDays: 365, archiveAction: "archive", isEnabled: true, recordsArchived: 120 },
  ];
  for (const p of policies) {
    await conn.query(
      "INSERT INTO `retention_policies` (`retentionEntity`,`entityLabel`,`entityLabelAr`,`retentionDays`,`archiveAction`,`isEnabled`,`recordsArchived`) VALUES (?,?,?,?,?,?,?)",
      [p.retentionEntity, p.entityLabel, p.entityLabelAr, p.retentionDays, p.archiveAction, p.isEnabled, p.recordsArchived]
    );
  }
  console.log(`✅ ${policies.length} retention policies seeded`);
}

// ============================================================
// AUDIT LOG — columns: userId, userName, action, auditCategory, details, ipAddress
// ============================================================
async function seedAuditLog() {
  console.log("📝 Seeding audit log...");
  const logs = [
    { userName: "م. عبدالله الشهري", action: "login", auditCategory: "auth", details: "تسجيل دخول ناجح — م. عبدالله الشهري (CISO)", ipAddress: "10.0.1.100" },
    { userName: "م. عبدالله الشهري", action: "enrich_leak", auditCategory: "enrichment", details: "إثراء AI لتسريب وزارة الخارجية LK-2024-0001 — تصنيف: حرج", ipAddress: "10.0.1.100" },
    { userName: "م. عبدالله الشهري", action: "export_leaks_csv", auditCategory: "export", details: "تصدير 85 سجل تسريب بصيغة CSV", ipAddress: "10.0.1.100" },
    { userName: "م. سارة القحطاني", action: "login", auditCategory: "auth", details: "تسجيل دخول ناجح — م. سارة القحطاني (محللة تهديدات)", ipAddress: "10.0.2.50" },
    { userName: "م. سارة القحطاني", action: "pii_scan", auditCategory: "pii", details: "فحص PII — 7 تطابقات مكتشفة في تسريب وزارة الصحة", ipAddress: "10.0.2.50" },
    { userName: "م. سارة القحطاني", action: "update_leak_status", auditCategory: "leak", details: "تحديث حالة تسريب مصرف الراجحي LK-2024-0005 إلى 'مبلّغ'", ipAddress: "10.0.2.50" },
    { userName: "م. فهد العتيبي", action: "login", auditCategory: "auth", details: "تسجيل دخول ناجح — م. فهد العتيبي (مدير الاستجابة)", ipAddress: "10.0.3.25" },
    { userName: "م. فهد العتيبي", action: "trigger_full_sweep", auditCategory: "monitoring", details: "تشغيل يدوي لمهمة المسح الشامل JOB-ALL-001", ipAddress: "10.0.3.25" },
    { userName: "م. عبدالله الشهري", action: "create_alert_rule", auditCategory: "alert", details: "إنشاء قاعدة تنبيه جديدة — تنبيه SMS للحوادث الحرجة", ipAddress: "10.0.1.100" },
    { userName: "م. عبدالله الشهري", action: "generate_report", auditCategory: "report", details: "إنشاء تقرير ربع سنوي Q4 2025", ipAddress: "10.0.1.100" },
    { userName: "م. عبدالله الشهري", action: "create_api_key", auditCategory: "api", details: "إنشاء مفتاح API جديد — تكامل SIEM IBM QRadar", ipAddress: "10.0.1.100" },
    { userName: "د. نورة الدوسري", action: "login", auditCategory: "auth", details: "تسجيل دخول ناجح — د. نورة الدوسري (مديرة الامتثال)", ipAddress: "10.0.4.10" },
    { userName: "د. نورة الدوسري", action: "run_retention_policy", auditCategory: "retention", details: "تنفيذ سياسة الاحتفاظ — أرشفة 1,250 سجل تدقيق أقدم من 365 يوم", ipAddress: "10.0.4.10" },
    { userName: "م. خالد المطيري", action: "login", auditCategory: "auth", details: "تسجيل دخول ناجح — م. خالد المطيري (محلل أمني)", ipAddress: "10.0.5.75" },
    { userName: "م. خالد المطيري", action: "view_threat_map", auditCategory: "system", details: "عرض خريطة التهديدات — تركيز على منطقة الرياض والمنطقة الشرقية", ipAddress: "10.0.5.75" },
    { userName: "م. عبدالله الشهري", action: "update_user_role", auditCategory: "user", details: "تحديث صلاحيات م. خالد المطيري من viewer إلى analyst", ipAddress: "10.0.1.100" },
    { userName: "م. سارة القحطاني", action: "export_report_pdf", auditCategory: "export", details: "تصدير تقرير SAMA القطاعي بصيغة PDF", ipAddress: "10.0.2.50" },
    { userName: "م. فهد العتيبي", action: "enrich_bulk", auditCategory: "enrichment", details: "إثراء AI جماعي — 12 تسريب تم إثراؤها بنجاح", ipAddress: "10.0.3.25" },
    { userName: "النظام", action: "scheduled_report_generated", auditCategory: "report", details: "تم إنشاء التقرير الأسبوعي التلقائي — ملخص التسريبات", ipAddress: "127.0.0.1" },
    { userName: "النظام", action: "monitoring_job_completed", auditCategory: "monitoring", details: "اكتمال مهمة مراقبة تيليجرام — 2450 رسالة مفحوصة، 1 تسريب جديد", ipAddress: "127.0.0.1" },
  ];
  for (const l of logs) {
    await conn.query(
      "INSERT INTO `audit_log` (`userName`,`action`,`auditCategory`,`details`,`ipAddress`) VALUES (?,?,?,?,?)",
      [l.userName, l.action, l.auditCategory, l.details, l.ipAddress]
    );
  }
  console.log(`✅ ${logs.length} audit log entries seeded`);
}

// ============================================================
// API KEYS — columns: apiKeyName, keyHash, keyPrefix, permissions, rateLimit, isActive, lastUsedAt, expiresAt
// ============================================================
async function seedApiKeys() {
  console.log("🔑 Seeding API keys...");
  const keys = [
    { apiKeyName: "تكامل SIEM — IBM QRadar", keyPrefix: "ndmo_sk_qr", permissions: JSON.stringify(["read:leaks","read:channels"]), rateLimit: 1000, isActive: true, lastUsedAt: new Date("2026-02-10T16:00:00"), expiresAt: new Date("2026-08-10") },
    { apiKeyName: "تكامل SOC — Splunk", keyPrefix: "ndmo_sk_sp", permissions: JSON.stringify(["read:leaks","read:channels","read:reports"]), rateLimit: 2000, isActive: true, lastUsedAt: new Date("2026-02-10T15:30:00"), expiresAt: new Date("2026-12-31") },
    { apiKeyName: "لوحة معلومات تنفيذية", keyPrefix: "ndmo_sk_ex", permissions: JSON.stringify(["read:leaks","read:reports"]), rateLimit: 500, isActive: true, lastUsedAt: new Date("2026-02-09T10:00:00"), expiresAt: new Date("2027-02-10") },
  ];
  for (const k of keys) {
    const hash = crypto.createHash("sha256").update(k.keyPrefix + crypto.randomBytes(16).toString("hex")).digest("hex");
    await conn.query(
      "INSERT INTO `api_keys` (`apiKeyName`,`keyHash`,`keyPrefix`,`permissions`,`rateLimit`,`isActive`,`lastUsedAt`,`expiresAt`) VALUES (?,?,?,?,?,?,?,?)",
      [k.apiKeyName, hash, k.keyPrefix, k.permissions, k.rateLimit, k.isActive, k.lastUsedAt, k.expiresAt]
    );
  }
  console.log(`✅ ${keys.length} API keys seeded`);
}

// ============================================================
// SCHEDULED REPORTS — columns: scheduledReportName, scheduledReportNameAr, frequency, reportTemplate, recipientIds, isEnabled, lastRunAt, nextRunAt, totalRuns
// ============================================================
async function seedScheduledReports() {
  console.log("📅 Seeding scheduled reports...");
  const reports = [
    { scheduledReportName: "تقرير أسبوعي — ملخص التسريبات", scheduledReportNameAr: "تقرير أسبوعي — ملخص التسريبات", frequency: "weekly", reportTemplate: "executive_summary", recipientIds: JSON.stringify([1,2,3]), isEnabled: true, lastRunAt: new Date("2026-02-07T06:00:00"), nextRunAt: new Date("2026-02-14T06:00:00"), totalRuns: 24 },
    { scheduledReportName: "تقرير شهري — تحليل التهديدات", scheduledReportNameAr: "تقرير شهري — تحليل التهديدات", frequency: "monthly", reportTemplate: "full_detail", recipientIds: JSON.stringify([1,4]), isEnabled: true, lastRunAt: new Date("2026-02-01T06:00:00"), nextRunAt: new Date("2026-03-01T06:00:00"), totalRuns: 8 },
    { scheduledReportName: "تقرير ربع سنوي — الامتثال لـ PDPL", scheduledReportNameAr: "تقرير ربع سنوي — الامتثال لـ PDPL", frequency: "quarterly", reportTemplate: "compliance", recipientIds: JSON.stringify([1,2,3,4,5]), isEnabled: true, lastRunAt: new Date("2026-01-01T06:00:00"), nextRunAt: new Date("2026-04-01T06:00:00"), totalRuns: 4 },
  ];
  for (const r of reports) {
    await conn.query(
      "INSERT INTO `scheduled_reports` (`scheduledReportName`,`scheduledReportNameAr`,`frequency`,`reportTemplate`,`recipientIds`,`isEnabled`,`lastRunAt`,`nextRunAt`,`totalRuns`) VALUES (?,?,?,?,?,?,?,?,?)",
      [r.scheduledReportName, r.scheduledReportNameAr, r.frequency, r.reportTemplate, r.recipientIds, r.isEnabled, r.lastRunAt, r.nextRunAt, r.totalRuns]
    );
  }
  console.log(`✅ ${reports.length} scheduled reports seeded`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  try {
    await clearAll();
    await seedChannels();
    await seedLeaks();
    await seedDarkWebListings();
    await seedPasteEntries();
    await seedReports();
    await seedPiiScans();
    await seedMonitoringJobs();
    await seedNotifications();
    await seedAlertContacts();
    await seedAlertRules();
    await seedAlertHistory();
    await seedRetentionPolicies();
    await seedAuditLog();
    await seedApiKeys();
    await seedScheduledReports();

    // Summary
    const counts = {};
    for (const t of ["leaks","channels","dark_web_listings","paste_entries","reports","pii_scans","monitoring_jobs","notifications","audit_log","alert_contacts","alert_rules","alert_history","retention_policies","api_keys","scheduled_reports"]) {
      const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${t}\``);
      counts[t] = rows[0].c;
    }
    console.log("\n🎉 === SEED COMPLETE ===");
    for (const [t, c] of Object.entries(counts)) {
      console.log(`  ${t}: ${c}`);
    }
    console.log("========================\n");
  } catch (e) {
    console.error("❌ Seed failed:", e);
  } finally {
    await conn.end();
  }
}

main();
