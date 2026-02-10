/**
 * seed-v5.mjs — Seed all v5 enhancement tables with rich Saudi data
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 1. Threat Rules (25 Saudi-specific rules) ───────────

const threatRules = [
  { ruleId: "TR-SA-001", name: "Saudi National ID Pattern", nameAr: "نمط رقم الهوية الوطنية السعودية", description: "Detects Saudi National ID numbers (10 digits starting with 1 or 2)", descriptionAr: "كشف أرقام الهوية الوطنية السعودية", category: "data_leak", severity: "critical", patterns: JSON.stringify(["\\\\b[12]\\\\d{9}\\\\b"]), keywords: JSON.stringify(["هوية وطنية", "National ID"]), matchCount: 342 },
  { ruleId: "TR-SA-002", name: "Saudi IBAN Detection", nameAr: "كشف أرقام IBAN السعودية", description: "Detects Saudi IBAN numbers", descriptionAr: "كشف أرقام الحسابات البنكية الدولية السعودية", category: "financial", severity: "critical", patterns: JSON.stringify(["\\\\bSA\\\\d{22}\\\\b"]), keywords: JSON.stringify(["IBAN", "آيبان"]), matchCount: 187 },
  { ruleId: "TR-SA-003", name: "Saudi Phone Number Pattern", nameAr: "نمط أرقام الهواتف السعودية", description: "Detects Saudi mobile numbers", descriptionAr: "كشف أرقام الجوال السعودية", category: "data_leak", severity: "high", patterns: JSON.stringify(["05[0-9]\\\\d{7}"]), keywords: JSON.stringify(["جوال", "mobile"]), matchCount: 891 },
  { ruleId: "TR-SA-004", name: "Absher Credentials Leak", nameAr: "تسريب بيانات اعتماد أبشر", description: "Detects Absher platform credentials", descriptionAr: "كشف بيانات اعتماد منصة أبشر", category: "credentials", severity: "critical", patterns: JSON.stringify(["absher.*password"]), keywords: JSON.stringify(["أبشر", "Absher"]), matchCount: 156 },
  { ruleId: "TR-SA-005", name: "Saudi Medical Record Number", nameAr: "رقم السجل الطبي السعودي", description: "Detects Saudi medical record numbers", descriptionAr: "كشف أرقام السجلات الطبية", category: "health", severity: "critical", patterns: JSON.stringify(["MRN[:\\\\s]?\\\\d{6,10}"]), keywords: JSON.stringify(["سجل طبي", "MRN"]), matchCount: 78 },
  { ruleId: "TR-SA-006", name: "Dark Web Saudi Data Sale", nameAr: "بيع بيانات سعودية على الدارك ويب", description: "Detects sale ads for Saudi data", descriptionAr: "كشف إعلانات بيع البيانات السعودية", category: "sale_ad", severity: "critical", patterns: JSON.stringify(["saudi.*data.*sale"]), keywords: JSON.stringify(["للبيع", "sale"]), matchCount: 234 },
  { ruleId: "TR-SA-007", name: "SQL Dump Saudi Database", nameAr: "تفريغ قاعدة بيانات SQL سعودية", description: "Detects SQL dumps with Saudi data", descriptionAr: "كشف ملفات تفريغ قواعد البيانات السعودية", category: "db_dump", severity: "high", patterns: JSON.stringify(["INSERT INTO.*saudi"]), keywords: JSON.stringify(["SQL dump", "تفريغ"]), matchCount: 145 },
  { ruleId: "TR-SA-008", name: "Government Portal Credentials", nameAr: "بيانات اعتماد البوابات الحكومية", description: "Detects leaked gov portal credentials", descriptionAr: "كشف بيانات اعتماد البوابات الحكومية", category: "government", severity: "critical", patterns: JSON.stringify(["gov\\\\.sa.*password"]), keywords: JSON.stringify(["حكومي", "نفاذ"]), matchCount: 98 },
  { ruleId: "TR-SA-009", name: "STC/Mobily/Zain Customer Data", nameAr: "بيانات عملاء شركات الاتصالات", description: "Detects telecom customer data leaks", descriptionAr: "كشف تسريبات بيانات عملاء الاتصالات", category: "telecom", severity: "high", patterns: JSON.stringify(["stc.*customer.*data"]), keywords: JSON.stringify(["STC", "موبايلي", "زين"]), matchCount: 267 },
  { ruleId: "TR-SA-010", name: "Saudi University Student Records", nameAr: "سجلات طلاب الجامعات السعودية", description: "Detects leaked student records", descriptionAr: "كشف تسريبات سجلات الطلاب", category: "education", severity: "high", patterns: JSON.stringify(["university.*saudi.*student"]), keywords: JSON.stringify(["جامعة", "طلاب"]), matchCount: 112 },
  { ruleId: "TR-SA-011", name: "Aramco/SABIC Employee Data", nameAr: "بيانات موظفي أرامكو/سابك", description: "Detects leaked employee data from major corps", descriptionAr: "كشف تسريبات بيانات الموظفين", category: "infrastructure", severity: "critical", patterns: JSON.stringify(["aramco.*employee"]), keywords: JSON.stringify(["أرامكو", "سابك"]), matchCount: 67 },
  { ruleId: "TR-SA-012", name: "RedLine Stealer Saudi Logs", nameAr: "سجلات RedLine Stealer السعودية", description: "Detects RedLine/Vidar infostealer logs", descriptionAr: "كشف سجلات برامج سرقة المعلومات", category: "credentials", severity: "critical", patterns: JSON.stringify(["redline.*\\\\.sa"]), keywords: JSON.stringify(["RedLine", "Vidar"]), matchCount: 445 },
  { ruleId: "TR-SA-013", name: "ComboList Saudi Entries", nameAr: "قوائم ComboList السعودية", description: "Detects combo lists with Saudi credentials", descriptionAr: "كشف قوائم الاختراق السعودية", category: "credentials", severity: "high", patterns: JSON.stringify([".*@.*\\\\.sa:.*"]), keywords: JSON.stringify(["ComboList", "combo"]), matchCount: 678 },
  { ruleId: "TR-SA-014", name: "Saudi Passport Number", nameAr: "رقم جواز السفر السعودي", description: "Detects Saudi passport numbers", descriptionAr: "كشف أرقام جوازات السفر السعودية", category: "data_leak", severity: "critical", patterns: JSON.stringify(["passport.*[A-Z]\\\\d{8}"]), keywords: JSON.stringify(["جواز سفر", "passport"]), matchCount: 43 },
  { ruleId: "TR-SA-015", name: "Iqama Number", nameAr: "رقم الإقامة", description: "Detects Saudi residence permit numbers", descriptionAr: "كشف أرقام الإقامة", category: "data_leak", severity: "high", patterns: JSON.stringify(["\\\\b2\\\\d{9}\\\\b"]), keywords: JSON.stringify(["إقامة", "Iqama"]), matchCount: 289 },
  { ruleId: "TR-SA-016", name: "Saudi Vehicle Registration", nameAr: "بيانات تسجيل المركبات", description: "Detects Saudi vehicle plate data", descriptionAr: "كشف بيانات لوحات السيارات", category: "data_leak", severity: "medium", patterns: JSON.stringify(["plate.*\\\\d{4}"]), keywords: JSON.stringify(["لوحة سيارة", "vehicle"]), matchCount: 56 },
  { ruleId: "TR-SA-017", name: "SADAD Payment Data", nameAr: "بيانات مدفوعات سداد", description: "Detects SADAD payment data", descriptionAr: "كشف بيانات معاملات سداد", category: "financial", severity: "high", patterns: JSON.stringify(["sadad.*payment"]), keywords: JSON.stringify(["سداد", "SADAD"]), matchCount: 34 },
  { ruleId: "TR-SA-018", name: "Saudi Real Estate Data", nameAr: "بيانات العقارات السعودية", description: "Detects leaked real estate data", descriptionAr: "كشف تسريبات بيانات العقارات", category: "financial", severity: "medium", patterns: JSON.stringify(["deed.*saudi"]), keywords: JSON.stringify(["عقار", "صك"]), matchCount: 23 },
  { ruleId: "TR-SA-019", name: "Tawakkalna Health Data", nameAr: "بيانات توكلنا الصحية", description: "Detects leaked Tawakkalna health data", descriptionAr: "كشف تسريبات البيانات الصحية من توكلنا", category: "health", severity: "critical", patterns: JSON.stringify(["tawakkalna.*health"]), keywords: JSON.stringify(["توكلنا", "Tawakkalna"]), matchCount: 89 },
  { ruleId: "TR-SA-020", name: "Saudi Insurance Policy Data", nameAr: "بيانات وثائق التأمين", description: "Detects leaked insurance data", descriptionAr: "كشف تسريبات بيانات التأمين", category: "financial", severity: "high", patterns: JSON.stringify(["insurance.*policy.*saudi"]), keywords: JSON.stringify(["تأمين", "insurance"]), matchCount: 45 },
  { ruleId: "TR-SA-021", name: "Base64 Encoded Saudi Data", nameAr: "بيانات سعودية مشفرة Base64", description: "Detects Base64-encoded Saudi PII", descriptionAr: "كشف بيانات Base64 المشفرة", category: "data_leak", severity: "medium", patterns: JSON.stringify(["[A-Za-z0-9+/]{40,}={0,2}"]), keywords: JSON.stringify(["Base64", "مشفر"]), matchCount: 167 },
  { ruleId: "TR-SA-022", name: "Arabic NER Personal Names", nameAr: "كشف الأسماء العربية الشخصية", description: "Detects Arabic personal names in leak data", descriptionAr: "كشف الأسماء الشخصية العربية في التسريبات", category: "data_leak", severity: "medium", patterns: JSON.stringify(["(محمد|عبدالله|أحمد).*\\\\d{10}"]), keywords: JSON.stringify(["اسم", "NER"]), matchCount: 534 },
  { ruleId: "TR-SA-023", name: "Saudi Credit Card BIN", nameAr: "أرقام بطاقات الائتمان السعودية", description: "Detects Saudi bank credit card BIN ranges", descriptionAr: "كشف نطاقات BIN لبطاقات الائتمان السعودية", category: "financial", severity: "critical", patterns: JSON.stringify(["\\\\b4(88|89)\\\\d{13}\\\\b"]), keywords: JSON.stringify(["بطاقة ائتمان", "credit card"]), matchCount: 123 },
  { ruleId: "TR-SA-024", name: "SCADA/ICS Saudi Infrastructure", nameAr: "أنظمة SCADA/ICS السعودية", description: "Detects exposed SCADA systems", descriptionAr: "كشف أنظمة التحكم الصناعي المكشوفة", category: "infrastructure", severity: "critical", patterns: JSON.stringify(["scada.*\\\\.sa"]), keywords: JSON.stringify(["SCADA", "ICS"]), matchCount: 12 },
  { ruleId: "TR-SA-025", name: "Saudi API Key/Token Leak", nameAr: "تسريب مفاتيح API سعودية", description: "Detects leaked API keys from Saudi services", descriptionAr: "كشف تسريبات مفاتيح API", category: "credentials", severity: "high", patterns: JSON.stringify(["api[_-]?key.*\\\\.sa"]), keywords: JSON.stringify(["API key", "مفتاح"]), matchCount: 201 },
];

for (const rule of threatRules) {
  await conn.execute(
    `INSERT IGNORE INTO threat_rules (ruleId, ruleName, ruleNameAr, ruleDescription, ruleDescriptionAr, ruleCategory, ruleSeverity, rulePatterns, ruleKeywords, ruleEnabled, ruleMatchCount, ruleCreatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW() - INTERVAL FLOOR(RAND()*180) DAY)`,
    [rule.ruleId, rule.name, rule.nameAr, rule.description, rule.descriptionAr, rule.category, rule.severity, rule.patterns, rule.keywords, rule.matchCount]
  );
}
console.log(`Seeded ${threatRules.length} threat rules`);

// ─── 2. Evidence Chain ───────────

const [leakRows] = await conn.execute("SELECT leakId FROM leaks ORDER BY RAND() LIMIT 40");
let blockIndex = 0;
let previousHash = null;
const evidenceTypes = ["text", "screenshot", "file", "metadata"];
const capturedByOptions = ["نظام الرصد التلقائي", "محلل أمني - أحمد", "محلل أمني - فهد", "نظام الذكاء الاصطناعي", "محلل أمني - نورة"];
let evidenceCount = 0;

for (const leak of leakRows) {
  const numEvidence = 2 + Math.floor(Math.random() * 4);
  for (let j = 0; j < numEvidence; j++) {
    blockIndex++;
    const hash = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    const type = evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)];
    const capturedBy = capturedByOptions[Math.floor(Math.random() * capturedByOptions.length)];
    
    await conn.execute(
      `INSERT IGNORE INTO evidence_chain (evidenceId, evidenceLeakId, evidenceType, contentHash, previousHash, blockIndex, capturedBy, isVerified, capturedAt, evidenceCreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND()*90) DAY, NOW() - INTERVAL FLOOR(RAND()*90) DAY)`,
      [`EV-${String(blockIndex).padStart(5, "0")}`, leak.leakId, type, hash, previousHash, blockIndex, capturedBy, Math.random() > 0.05 ? 1 : 0]
    );
    previousHash = hash;
    evidenceCount++;
  }
}
console.log(`Seeded ${evidenceCount} evidence chain entries`);

// ─── 3. Seller Profiles ────────────

const sellers = [
  { sellerId: "SLR-001", name: "DarkSaudi_Dealer", aliases: ["DS_Dealer", "Saudi_Data_King"], platforms: ["telegram", "darkweb"], totalLeaks: 12, totalRecords: 2500000, riskScore: 95, riskLevel: "critical", sectors: ["banking", "telecom"], notes: "بائع نشط منذ 2023 — متخصص في بيانات البنوك والاتصالات" },
  { sellerId: "SLR-002", name: "KSA_DataBroker", aliases: ["KDB_2024"], platforms: ["darkweb"], totalLeaks: 8, totalRecords: 1800000, riskScore: 88, riskLevel: "critical", sectors: ["government", "healthcare"], notes: "يستهدف القطاع الحكومي والصحي" },
  { sellerId: "SLR-003", name: "Gulf_Hacker_Pro", aliases: ["GHP", "Gulf_Cyber"], platforms: ["telegram", "darkweb", "paste"], totalLeaks: 15, totalRecords: 3200000, riskScore: 92, riskLevel: "critical", sectors: ["telecom", "education"], notes: "أكبر بائع بيانات خليجي" },
  { sellerId: "SLR-004", name: "Riyadh_Shadow", aliases: ["RS_Dark"], platforms: ["telegram"], totalLeaks: 5, totalRecords: 450000, riskScore: 72, riskLevel: "high", sectors: ["retail"], notes: "متخصص في بيانات التجزئة" },
  { sellerId: "SLR-005", name: "CyberArabia", aliases: ["CA_Leaks"], platforms: ["darkweb", "paste"], totalLeaks: 9, totalRecords: 1200000, riskScore: 85, riskLevel: "critical", sectors: ["banking", "insurance"], notes: "يبيع بيانات مالية وتأمينية" },
  { sellerId: "SLR-006", name: "Jeddah_Phantom", aliases: ["JP_2025"], platforms: ["telegram"], totalLeaks: 3, totalRecords: 280000, riskScore: 58, riskLevel: "medium", sectors: ["healthcare"], notes: "ظهر مؤخراً — يركز على البيانات الصحية" },
  { sellerId: "SLR-007", name: "Desert_Fox_Cyber", aliases: ["DFC"], platforms: ["darkweb", "telegram"], totalLeaks: 11, totalRecords: 2100000, riskScore: 90, riskLevel: "critical", sectors: ["government", "energy"], notes: "يستهدف الحكومي والطاقة — مرتبط بـ APT" },
  { sellerId: "SLR-008", name: "Dammam_Digital", aliases: ["DD_Hack"], platforms: ["paste"], totalLeaks: 2, totalRecords: 150000, riskScore: 45, riskLevel: "medium", sectors: ["education"], notes: "بائع صغير — بيانات جامعية فقط" },
  { sellerId: "SLR-009", name: "Saudi_Stealer_Logs", aliases: ["SSL"], platforms: ["telegram", "darkweb"], totalLeaks: 18, totalRecords: 5600000, riskScore: 97, riskLevel: "critical", sectors: ["banking", "telecom", "government"], notes: "أخطر بائع — يوزع سجلات InfoStealer بكميات ضخمة" },
  { sellerId: "SLR-010", name: "Mecca_Breach", aliases: ["MB_2024"], platforms: ["darkweb"], totalLeaks: 4, totalRecords: 320000, riskScore: 65, riskLevel: "high", sectors: ["tourism"], notes: "متخصص في بيانات السياحة والضيافة" },
  { sellerId: "SLR-011", name: "Najd_Cyber_Group", aliases: ["NCG"], platforms: ["telegram", "darkweb"], totalLeaks: 7, totalRecords: 980000, riskScore: 78, riskLevel: "high", sectors: ["retail", "logistics"], notes: "مجموعة منظمة — تستهدف التجزئة واللوجستيات" },
  { sellerId: "SLR-012", name: "Al_Khobar_Leak", aliases: ["AKL"], platforms: ["telegram"], totalLeaks: 2, totalRecords: 95000, riskScore: 38, riskLevel: "low", sectors: ["education"], notes: "بائع غير نشط حالياً" },
];

for (const s of sellers) {
  await conn.execute(
    `INSERT IGNORE INTO seller_profiles (sellerId, sellerName, sellerAliases, sellerPlatforms, totalLeaks, sellerTotalRecords, sellerRiskScore, sellerRiskLevel, sellerSectors, sellerNotes, sellerIsActive, sellerFirstSeen, sellerLastActivity, sellerCreatedAt, sellerUpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND()*365) DAY, NOW() - INTERVAL FLOOR(RAND()*30) DAY, NOW(), NOW())`,
    [s.sellerId, s.name, JSON.stringify(s.aliases), JSON.stringify(s.platforms), s.totalLeaks, s.totalRecords, s.riskScore, s.riskLevel, JSON.stringify(s.sectors), s.notes, s.riskScore > 40 ? 1 : 0]
  );
}
console.log(`Seeded ${sellers.length} seller profiles`);

// ─── 4. OSINT Queries ─────────────

const osintQueries = [
  { queryId: "OSINT-GD-001", name: "Saudi Gov Exposed Files", nameAr: "ملفات حكومية سعودية مكشوفة", queryType: "google_dork", category: "Government", categoryAr: "حكومي", query: 'site:*.gov.sa filetype:xlsx "password"', description: "Find exposed Excel files on Saudi gov domains", descriptionAr: "البحث عن ملفات Excel مكشوفة على النطاقات الحكومية", resultsCount: 23 },
  { queryId: "OSINT-GD-002", name: "Saudi Database Dumps", nameAr: "تفريغات قواعد بيانات سعودية", queryType: "google_dork", category: "Database", categoryAr: "قواعد بيانات", query: 'site:pastebin.com "saudi" "database"', description: "Search for Saudi database dumps on paste sites", descriptionAr: "البحث عن تفريغات قواعد بيانات سعودية", resultsCount: 45 },
  { queryId: "OSINT-GD-003", name: "Saudi National ID Leaks", nameAr: "تسريبات الهوية الوطنية", queryType: "google_dork", category: "PII", categoryAr: "بيانات شخصية", query: '"رقم الهوية" filetype:csv site:*.sa', description: "Find files containing Saudi National ID numbers", descriptionAr: "البحث عن ملفات تحتوي أرقام الهوية الوطنية", resultsCount: 12 },
  { queryId: "OSINT-GD-004", name: "Saudi Email Lists", nameAr: "قوائم البريد الإلكتروني السعودية", queryType: "google_dork", category: "Credentials", categoryAr: "بيانات اعتماد", query: 'intext:"@*.sa" filetype:txt "password"', description: "Find leaked Saudi email and password lists", descriptionAr: "البحث عن قوائم بريد إلكتروني سعودية مسربة", resultsCount: 67 },
  { queryId: "OSINT-GD-005", name: "Saudi Hospital Patient Data", nameAr: "بيانات مرضى المستشفيات", queryType: "google_dork", category: "Healthcare", categoryAr: "صحي", query: 'site:*.sa "patient" "medical record" filetype:pdf', description: "Find exposed patient records from Saudi hospitals", descriptionAr: "البحث عن سجلات مرضى مكشوفة", resultsCount: 8 },
  { queryId: "OSINT-GD-006", name: "Saudi Bank IBAN Data", nameAr: "بيانات IBAN البنوك السعودية", queryType: "google_dork", category: "Financial", categoryAr: "مالي", query: '"IBAN" "SA" filetype:csv -site:gov.sa', description: "Find exposed Saudi IBAN numbers", descriptionAr: "البحث عن أرقام IBAN سعودية مكشوفة", resultsCount: 15 },
  { queryId: "OSINT-GD-007", name: "Exposed Saudi APIs", nameAr: "واجهات API سعودية مكشوفة", queryType: "google_dork", category: "Technical", categoryAr: "تقني", query: 'site:*.sa inurl:api "swagger" OR "openapi"', description: "Find exposed API documentation on Saudi domains", descriptionAr: "البحث عن وثائق API مكشوفة", resultsCount: 34 },
  { queryId: "OSINT-GD-008", name: "Saudi Git Repositories", nameAr: "مستودعات Git سعودية", queryType: "google_dork", category: "Technical", categoryAr: "تقني", query: 'site:github.com "sa" "api_key" filetype:env', description: "Find exposed credentials in Saudi GitHub repos", descriptionAr: "البحث عن بيانات اعتماد مكشوفة في مستودعات GitHub", resultsCount: 56 },
  { queryId: "OSINT-GD-009", name: "Saudi Education Records", nameAr: "سجلات تعليمية سعودية", queryType: "google_dork", category: "Education", categoryAr: "تعليمي", query: 'site:*.edu.sa "student" "GPA" filetype:xlsx', description: "Find exposed student records", descriptionAr: "البحث عن سجلات طلاب مكشوفة", resultsCount: 19 },
  { queryId: "OSINT-GD-010", name: "Saudi Company Directories", nameAr: "أدلة الشركات السعودية", queryType: "google_dork", category: "Corporate", categoryAr: "شركات", query: 'site:linkedin.com "Saudi Arabia" "email"', description: "Find Saudi corporate directories", descriptionAr: "البحث عن أدلة الشركات السعودية", resultsCount: 234 },
  { queryId: "OSINT-SH-001", name: "Saudi Exposed MySQL", nameAr: "قواعد MySQL سعودية مكشوفة", queryType: "shodan", category: "Database", categoryAr: "قواعد بيانات", query: 'country:SA port:3306 product:"MySQL"', description: "Find exposed MySQL databases in Saudi Arabia", descriptionAr: "البحث عن قواعد MySQL مكشوفة في السعودية", resultsCount: 156 },
  { queryId: "OSINT-SH-002", name: "Saudi MongoDB Instances", nameAr: "خوادم MongoDB سعودية", queryType: "shodan", category: "Database", categoryAr: "قواعد بيانات", query: 'country:SA port:27017 product:"MongoDB"', description: "Find exposed MongoDB in Saudi Arabia", descriptionAr: "البحث عن خوادم MongoDB مكشوفة", resultsCount: 89 },
  { queryId: "OSINT-SH-003", name: "Saudi Elasticsearch", nameAr: "مجموعات Elasticsearch سعودية", queryType: "shodan", category: "Database", categoryAr: "قواعد بيانات", query: 'country:SA port:9200 product:"Elastic"', description: "Find exposed Elasticsearch in Saudi Arabia", descriptionAr: "البحث عن Elasticsearch مكشوفة", resultsCount: 42 },
  { queryId: "OSINT-SH-004", name: "Saudi Redis Servers", nameAr: "خوادم Redis سعودية", queryType: "shodan", category: "Database", categoryAr: "قواعد بيانات", query: 'country:SA port:6379 product:"Redis"', description: "Find exposed Redis in Saudi Arabia", descriptionAr: "البحث عن خوادم Redis مكشوفة", resultsCount: 67 },
  { queryId: "OSINT-SH-005", name: "Saudi SCADA Systems", nameAr: "أنظمة SCADA سعودية", queryType: "shodan", category: "Infrastructure", categoryAr: "بنية تحتية", query: 'country:SA port:502 "Modbus"', description: "Find exposed SCADA/Modbus in Saudi Arabia", descriptionAr: "البحث عن أنظمة SCADA مكشوفة", resultsCount: 23 },
  { queryId: "OSINT-SH-006", name: "Saudi RDP Servers", nameAr: "خوادم RDP سعودية", queryType: "shodan", category: "Access", categoryAr: "وصول", query: 'country:SA port:3389 "Remote Desktop"', description: "Find exposed RDP in Saudi Arabia", descriptionAr: "البحث عن خوادم RDP مكشوفة", resultsCount: 345 },
  { queryId: "OSINT-SH-007", name: "Saudi Webcams", nameAr: "كاميرات مراقبة سعودية مكشوفة", queryType: "shodan", category: "IoT", categoryAr: "إنترنت الأشياء", query: 'country:SA "Server: IP Webcam"', description: "Find exposed webcams in Saudi Arabia", descriptionAr: "البحث عن كاميرات مراقبة مكشوفة", resultsCount: 178 },
  { queryId: "OSINT-SH-008", name: "Saudi Jenkins Servers", nameAr: "خوادم Jenkins سعودية", queryType: "shodan", category: "DevOps", categoryAr: "DevOps", query: 'country:SA "X-Jenkins" "200 OK"', description: "Find exposed Jenkins in Saudi Arabia", descriptionAr: "البحث عن خوادم Jenkins مكشوفة", resultsCount: 34 },
  { queryId: "OSINT-RC-001", name: "Saudi Subdomain Enumeration", nameAr: "تعداد النطاقات الفرعية السعودية", queryType: "recon", category: "Reconnaissance", categoryAr: "استطلاع", query: "subfinder -d gov.sa -o saudi_gov_subdomains.txt", description: "Enumerate Saudi government subdomains", descriptionAr: "تعداد النطاقات الفرعية الحكومية", resultsCount: 1234 },
  { queryId: "OSINT-RC-002", name: "Saudi Certificate Transparency", nameAr: "شفافية الشهادات السعودية", queryType: "recon", category: "Reconnaissance", categoryAr: "استطلاع", query: "curl -s 'https://crt.sh/?q=%.sa&output=json'", description: "Search CT logs for Saudi domains", descriptionAr: "البحث في سجلات شفافية الشهادات", resultsCount: 5678 },
  { queryId: "OSINT-RC-003", name: "Saudi Wayback Machine", nameAr: "أرشيف الويب السعودي", queryType: "recon", category: "Reconnaissance", categoryAr: "استطلاع", query: "waybackurls *.sa | grep -E '\\.(sql|csv|xlsx)$'", description: "Find archived sensitive files", descriptionAr: "البحث عن ملفات حساسة مؤرشفة", resultsCount: 89 },
  { queryId: "OSINT-RC-004", name: "Saudi S3 Bucket Discovery", nameAr: "اكتشاف حاويات S3 سعودية", queryType: "recon", category: "Cloud", categoryAr: "سحابي", query: "python3 s3scanner.py --bucket-file saudi_buckets.txt", description: "Scan for misconfigured S3 buckets", descriptionAr: "فحص حاويات S3 المكشوفة", resultsCount: 12 },
  { queryId: "OSINT-RC-005", name: "Saudi DNS Zone Transfer", nameAr: "نقل منطقة DNS سعودية", queryType: "recon", category: "Reconnaissance", categoryAr: "استطلاع", query: "dig axfr @ns1.saudi.net.sa saudi.net.sa", description: "Attempt DNS zone transfer", descriptionAr: "محاولة نقل منطقة DNS", resultsCount: 0 },
];

for (const q of osintQueries) {
  await conn.execute(
    `INSERT IGNORE INTO osint_queries (queryId, queryName, queryNameAr, queryType, queryCategory, queryCategoryAr, queryText, queryDescription, queryDescriptionAr, queryResultsCount, queryEnabled, queryCreatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW() - INTERVAL FLOOR(RAND()*120) DAY)`,
    [q.queryId, q.name, q.nameAr, q.queryType, q.category, q.categoryAr, q.query, q.description, q.descriptionAr, q.resultsCount]
  );
}
console.log(`Seeded ${osintQueries.length} OSINT queries`);

// ─── 5. Feedback Entries ────

const classifications = ["personal_data", "cybersecurity", "clean", "unknown"];
const analystNames = ["أحمد المالكي", "فهد العتيبي", "نورة القحطاني", "سارة الشهري", "محمد الدوسري"];
let feedbackCount = 0;

for (let i = 0; i < 80; i++) {
  const leakIdx = Math.floor(Math.random() * leakRows.length);
  const sysClass = classifications[Math.floor(Math.random() * 3)];
  const isCorrect = Math.random() < 0.87;
  const analystClass = isCorrect ? sysClass : classifications[Math.floor(Math.random() * classifications.length)];
  
  await conn.execute(
    `INSERT INTO feedback_entries (feedbackLeakId, feedbackUserName, systemClassification, analystClassification, isCorrect, feedbackNotes, feedbackCreatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND()*90) DAY)`,
    [leakRows[leakIdx].leakId, analystNames[Math.floor(Math.random() * analystNames.length)], sysClass, analystClass, isCorrect ? 1 : 0, isCorrect ? null : "تصنيف النظام غير دقيق — تم تصحيحه يدوياً"]
  );
  feedbackCount++;
}
console.log(`Seeded ${feedbackCount} feedback entries`);

// ─── 6. Knowledge Graph ────────────────────────────────

// Nodes
const nodeData = [
  // Leaks (top 20)
  ...((await conn.execute("SELECT leakId, title, titleAr FROM leaks ORDER BY recordCount DESC LIMIT 20"))[0]).map(l => ({ nodeId: `leak-${l.leakId}`, nodeType: "leak", label: l.title, labelAr: l.titleAr })),
  // Sellers
  ...sellers.slice(0, 8).map(s => ({ nodeId: `seller-${s.sellerId}`, nodeType: "seller", label: s.name, labelAr: s.name })),
  // Entities
  { nodeId: "entity-aramco", nodeType: "entity", label: "Saudi Aramco", labelAr: "أرامكو السعودية" },
  { nodeId: "entity-stc", nodeType: "entity", label: "STC", labelAr: "الاتصالات السعودية" },
  { nodeId: "entity-moi", nodeType: "entity", label: "Ministry of Interior", labelAr: "وزارة الداخلية" },
  { nodeId: "entity-moh", nodeType: "entity", label: "Ministry of Health", labelAr: "وزارة الصحة" },
  { nodeId: "entity-sama", nodeType: "entity", label: "SAMA", labelAr: "مؤسسة النقد العربي السعودي" },
  { nodeId: "entity-sabic", nodeType: "entity", label: "SABIC", labelAr: "سابك" },
  { nodeId: "entity-kau", nodeType: "entity", label: "King Abdulaziz University", labelAr: "جامعة الملك عبدالعزيز" },
  { nodeId: "entity-ksu", nodeType: "entity", label: "King Saud University", labelAr: "جامعة الملك سعود" },
  // Sectors
  { nodeId: "sector-banking", nodeType: "sector", label: "Banking", labelAr: "القطاع المصرفي" },
  { nodeId: "sector-telecom", nodeType: "sector", label: "Telecom", labelAr: "الاتصالات" },
  { nodeId: "sector-healthcare", nodeType: "sector", label: "Healthcare", labelAr: "الرعاية الصحية" },
  { nodeId: "sector-government", nodeType: "sector", label: "Government", labelAr: "القطاع الحكومي" },
  { nodeId: "sector-education", nodeType: "sector", label: "Education", labelAr: "التعليم" },
  { nodeId: "sector-energy", nodeType: "sector", label: "Energy", labelAr: "الطاقة" },
  // PII Types
  { nodeId: "pii-national-id", nodeType: "pii_type", label: "National ID", labelAr: "رقم الهوية الوطنية" },
  { nodeId: "pii-phone", nodeType: "pii_type", label: "Phone Number", labelAr: "رقم الهاتف" },
  { nodeId: "pii-email", nodeType: "pii_type", label: "Email", labelAr: "البريد الإلكتروني" },
  { nodeId: "pii-iban", nodeType: "pii_type", label: "IBAN", labelAr: "رقم الحساب البنكي" },
  { nodeId: "pii-medical", nodeType: "pii_type", label: "Medical Record", labelAr: "السجل الطبي" },
  // Platforms
  { nodeId: "platform-telegram", nodeType: "platform", label: "Telegram", labelAr: "تليجرام" },
  { nodeId: "platform-darkweb", nodeType: "platform", label: "Dark Web", labelAr: "الويب المظلم" },
  { nodeId: "platform-paste", nodeType: "platform", label: "Paste Sites", labelAr: "مواقع اللصق" },
  // Campaigns
  { nodeId: "campaign-op-sandstorm", nodeType: "campaign", label: "Operation SandStorm", labelAr: "عملية العاصفة الرملية" },
  { nodeId: "campaign-gulf-breach", nodeType: "campaign", label: "Gulf Breach Campaign", labelAr: "حملة اختراق الخليج" },
  { nodeId: "campaign-falcon-eye", nodeType: "campaign", label: "Falcon Eye", labelAr: "عين الصقر" },
];

for (const n of nodeData) {
  await conn.execute(
    `INSERT IGNORE INTO knowledge_graph_nodes (nodeId, nodeType, nodeLabel, nodeLabelAr, nodeCreatedAt) VALUES (?, ?, ?, ?, NOW())`,
    [n.nodeId, n.nodeType, n.label, n.labelAr]
  );
}
console.log(`Seeded ${nodeData.length} knowledge graph nodes`);

// Edges
const edgeData = [];
const leakNodes = nodeData.filter(n => n.nodeType === "leak");
const sellerNodes = nodeData.filter(n => n.nodeType === "seller");
const entityNodes = nodeData.filter(n => n.nodeType === "entity");
const sectorNodes = nodeData.filter(n => n.nodeType === "sector");
const piiNodes = nodeData.filter(n => n.nodeType === "pii_type");
const platformNodes = nodeData.filter(n => n.nodeType === "platform");
const campaignNodes = nodeData.filter(n => n.nodeType === "campaign");

// Leak -> Seller
for (let i = 0; i < 15; i++) {
  const l = leakNodes[Math.floor(Math.random() * leakNodes.length)];
  const s = sellerNodes[Math.floor(Math.random() * sellerNodes.length)];
  edgeData.push({ source: l.nodeId, target: s.nodeId, rel: "sold_by", relAr: "بيع بواسطة", weight: Math.floor(Math.random() * 5) + 1 });
}

// Leak -> Entity
for (let i = 0; i < 20; i++) {
  const l = leakNodes[Math.floor(Math.random() * leakNodes.length)];
  const e = entityNodes[Math.floor(Math.random() * entityNodes.length)];
  edgeData.push({ source: l.nodeId, target: e.nodeId, rel: "targets", relAr: "يستهدف", weight: Math.floor(Math.random() * 3) + 1 });
}

// Entity -> Sector
for (const e of entityNodes) {
  const s = sectorNodes[Math.floor(Math.random() * sectorNodes.length)];
  edgeData.push({ source: e.nodeId, target: s.nodeId, rel: "belongs_to", relAr: "ينتمي إلى", weight: 1 });
}

// Leak -> PII Type
for (let i = 0; i < 25; i++) {
  const l = leakNodes[Math.floor(Math.random() * leakNodes.length)];
  const p = piiNodes[Math.floor(Math.random() * piiNodes.length)];
  edgeData.push({ source: l.nodeId, target: p.nodeId, rel: "contains", relAr: "يحتوي", weight: Math.floor(Math.random() * 10) + 1 });
}

// Seller -> Platform
for (const s of sellers.slice(0, 8)) {
  for (const p of s.platforms) {
    const pNode = platformNodes.find(pl => pl.nodeId === `platform-${p}`);
    if (pNode) {
      edgeData.push({ source: `seller-${s.sellerId}`, target: pNode.nodeId, rel: "operates_on", relAr: "يعمل على", weight: Math.floor(Math.random() * 5) + 1 });
    }
  }
}

// Campaign -> Leak
for (const c of campaignNodes) {
  for (let i = 0; i < 3; i++) {
    const l = leakNodes[Math.floor(Math.random() * leakNodes.length)];
    edgeData.push({ source: c.nodeId, target: l.nodeId, rel: "includes", relAr: "يتضمن", weight: Math.floor(Math.random() * 3) + 1 });
  }
}

// Campaign -> Seller
for (const c of campaignNodes) {
  const s = sellerNodes[Math.floor(Math.random() * sellerNodes.length)];
  edgeData.push({ source: c.nodeId, target: s.nodeId, rel: "attributed_to", relAr: "منسوب إلى", weight: Math.floor(Math.random() * 3) + 1 });
}

for (const e of edgeData) {
  await conn.execute(
    `INSERT INTO knowledge_graph_edges (sourceNodeId, targetNodeId, edgeRelationship, edgeRelationshipAr, edgeWeight, edgeCreatedAt) VALUES (?, ?, ?, ?, ?, NOW())`,
    [e.source, e.target, e.rel, e.relAr, e.weight]
  );
}
console.log(`Seeded ${edgeData.length} knowledge graph edges`);

console.log("\n=== V5 Seed Complete ===");
console.log(`Threat Rules: ${threatRules.length}`);
console.log(`Evidence Chain: ${evidenceCount}`);
console.log(`Seller Profiles: ${sellers.length}`);
console.log(`OSINT Queries: ${osintQueries.length}`);
console.log(`Feedback Entries: ${feedbackCount}`);
console.log(`Knowledge Graph: ${nodeData.length} nodes, ${edgeData.length} edges`);

await conn.end();
