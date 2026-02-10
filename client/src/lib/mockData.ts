/**
 * Fallback data for the NDMO Leak Monitor platform
 * Based on real Saudi Arabian data breach incidents
 * Used only when API is unavailable — primary data comes from tRPC API
 */

export interface LeakRecord {
  id: string;
  title: string;
  titleAr: string;
  source: "telegram" | "darkweb" | "paste";
  severity: "critical" | "high" | "medium" | "low";
  sector: string;
  sectorAr: string;
  piiTypes: string[];
  recordCount: number;
  detectedAt: string;
  status: "new" | "analyzing" | "documented" | "reported";
  description: string;
  descriptionAr: string;
}

export interface MonitoringChannel {
  id: string;
  name: string;
  platform: string;
  subscribers: number;
  status: "active" | "paused" | "flagged";
  lastActivity: string;
  leaksDetected: number;
  riskLevel: "high" | "medium" | "low";
}

export interface PIIMatch {
  type: string;
  typeAr: string;
  pattern: string;
  count: number;
  sample: string;
  category: string;
}

export const leakRecords: LeakRecord[] = [
  {
    id: "LK-2024-0001",
    title: "Ministry of Foreign Affairs — 1.4M Employee Records",
    titleAr: "وزارة الخارجية — 1.4 مليون سجل موظف",
    source: "darkweb",
    severity: "critical",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["National ID", "Full Name", "Email", "Phone", "Job Title", "Diplomatic Credentials"],
    recordCount: 1400000,
    detectedAt: "2024-01-13T14:30:00",
    status: "reported",
    description: "Massive breach of Saudi Ministry of Foreign Affairs employee database posted on BreachForums by threat actor 'IntelBroker'. Contains 1.4M records including diplomatic credentials, national IDs, and personal contact information.",
    descriptionAr: "اختراق ضخم لقاعدة بيانات موظفي وزارة الخارجية السعودية نُشر على BreachForums بواسطة مهاجم 'IntelBroker'. يحتوي على 1.4 مليون سجل تشمل بيانات اعتماد دبلوماسية وأرقام هوية ومعلومات اتصال شخصية.",
  },
  {
    id: "LK-2024-0003",
    title: "Saudi Aramco — Contractor Data Exposure",
    titleAr: "أرامكو السعودية — تعرض بيانات المقاولين",
    source: "darkweb",
    severity: "critical",
    sector: "Energy",
    sectorAr: "طاقة",
    piiTypes: ["National ID", "Passport", "Full Name", "Email", "Security Clearance"],
    recordCount: 500000,
    detectedAt: "2024-03-15T09:00:00",
    status: "documented",
    description: "Contractor and employee data from Saudi Aramco's third-party vendor system exposed on XSS.is forum. Includes security clearance levels and access credentials.",
    descriptionAr: "بيانات مقاولين وموظفين من نظام مورد خارجي لأرامكو السعودية تم كشفها على منتدى XSS.is. تشمل مستويات التصريح الأمني وبيانات الوصول.",
  },
  {
    id: "LK-2024-0005",
    title: "Al Rajhi Bank — Customer Financial Data",
    titleAr: "مصرف الراجحي — بيانات عملاء مالية",
    source: "darkweb",
    severity: "critical",
    sector: "Banking",
    sectorAr: "بنوك",
    piiTypes: ["IBAN", "National ID", "Full Name", "Account Balance", "Transaction History"],
    recordCount: 850000,
    detectedAt: "2024-04-10T11:20:00",
    status: "reported",
    description: "Customer financial records from Al Rajhi Bank including IBANs, account balances, and transaction histories offered for sale at $90,000 on Exploit.in.",
    descriptionAr: "سجلات مالية لعملاء مصرف الراجحي تشمل أرقام آيبان وأرصدة حسابات وتاريخ المعاملات معروضة للبيع بسعر 90,000 دولار على Exploit.in.",
  },
  {
    id: "LK-2024-0026",
    title: "STC — 2.3M Customer Records",
    titleAr: "STC — 2.3 مليون سجل عميل",
    source: "telegram",
    severity: "critical",
    sector: "Telecom",
    sectorAr: "اتصالات",
    piiTypes: ["National ID", "Phone", "Email", "IMEI", "Address"],
    recordCount: 2300000,
    detectedAt: "2024-03-15T12:15:00",
    status: "documented",
    description: "Massive STC customer database leaked on Telegram channel 'KSA Data Dumps'. Contains 2.3M records with national IDs, phone numbers, IMEI numbers, and billing addresses.",
    descriptionAr: "تسريب ضخم لقاعدة بيانات عملاء STC على قناة تيليجرام 'KSA Data Dumps'. يحتوي على 2.3 مليون سجل مع أرقام هوية وأرقام هواتف وأرقام IMEI وعناوين الفوترة.",
  },
  {
    id: "LK-2025-0010",
    title: "GOSI — Social Insurance Records",
    titleAr: "التأمينات الاجتماعية — سجلات التأمين",
    source: "darkweb",
    severity: "critical",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["National ID", "Salary", "Employer", "Insurance Number"],
    recordCount: 920000,
    detectedAt: "2025-03-10T11:00:00",
    status: "analyzing",
    description: "920,000 GOSI social insurance records detected on XSS.is forum. Contains salary information, employer details, and insurance numbers for Saudi workers.",
    descriptionAr: "تم اكتشاف 920,000 سجل تأمينات اجتماعية على منتدى XSS.is. يحتوي على معلومات الرواتب وتفاصيل أصحاب العمل وأرقام التأمين للعمال السعوديين.",
  },
  {
    id: "LK-2025-0013",
    title: "Absher Platform — 3.2M Credentials",
    titleAr: "منصة أبشر — 3.2 مليون بيانات اعتماد",
    source: "darkweb",
    severity: "critical",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["National ID", "Password", "Email", "Phone"],
    recordCount: 3200000,
    detectedAt: "2025-05-01T16:30:00",
    status: "new",
    description: "3.2M Absher platform credentials detected on BreachForums. Combo list format with national IDs, passwords, and associated email addresses.",
    descriptionAr: "تم اكتشاف 3.2 مليون بيانات اعتماد منصة أبشر على BreachForums. بصيغة Combo List مع أرقام هوية وكلمات مرور وعناوين بريد إلكتروني مرتبطة.",
  },
  {
    id: "LK-2025-0015",
    title: "Hajj 2025 — Pilgrim Records",
    titleAr: "حج 2025 — سجلات الحجاج",
    source: "telegram",
    severity: "critical",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["Passport", "Full Name", "Phone", "Nationality", "Health Records"],
    recordCount: 750000,
    detectedAt: "2025-07-15T08:20:00",
    status: "documented",
    description: "750,000 Hajj pilgrim records from the 2025 season detected for sale at $30,000. Contains passport numbers, health records, and personal details.",
    descriptionAr: "تم اكتشاف 750,000 سجل حاج من موسم 2025 معروض للبيع بسعر 30,000 دولار. يحتوي على أرقام جوازات سفر وسجلات صحية وبيانات شخصية.",
  },
  {
    id: "LK-2025-0020",
    title: "Tawakkalna — Health Data Exposure",
    titleAr: "توكلنا — تعرض البيانات الصحية",
    source: "darkweb",
    severity: "critical",
    sector: "Healthcare",
    sectorAr: "صحة",
    piiTypes: ["National ID", "Vaccination Status", "PCR Results", "Health Conditions"],
    recordCount: 2100000,
    detectedAt: "2025-04-20T14:00:00",
    status: "analyzing",
    description: "2.1M Tawakkalna health records detected on XSS.is. Includes vaccination status, PCR results, and health conditions linked to national IDs.",
    descriptionAr: "تم اكتشاف 2.1 مليون سجل صحي من توكلنا على XSS.is. يشمل حالة التطعيم ونتائج PCR والحالات الصحية مرتبطة بأرقام الهوية.",
  },
];

export const telegramChannels: MonitoringChannel[] = [
  { id: "CH-TG-001", name: "Saudi Leaks تسريبات سعودية", platform: "Telegram", subscribers: 45000, status: "flagged", lastActivity: "2026-02-10T16:00:00", leaksDetected: 18, riskLevel: "high" },
  { id: "CH-TG-002", name: "KSA Data Dumps", platform: "Telegram", subscribers: 28000, status: "active", lastActivity: "2026-02-09T14:00:00", leaksDetected: 12, riskLevel: "high" },
  { id: "CH-TG-003", name: "Gulf Hackers الخليج", platform: "Telegram", subscribers: 67000, status: "flagged", lastActivity: "2026-02-10T10:00:00", leaksDetected: 24, riskLevel: "high" },
  { id: "CH-TG-004", name: "InfoStealer Logs SA", platform: "Telegram", subscribers: 15000, status: "active", lastActivity: "2026-02-08T18:00:00", leaksDetected: 8, riskLevel: "medium" },
  { id: "CH-TG-005", name: "Combo Lists KSA", platform: "Telegram", subscribers: 32000, status: "flagged", lastActivity: "2026-02-10T12:00:00", leaksDetected: 15, riskLevel: "high" },
  { id: "CH-TG-006", name: "Saudi Gov Leaks حكومي", platform: "Telegram", subscribers: 9500, status: "active", lastActivity: "2026-02-07T09:00:00", leaksDetected: 6, riskLevel: "medium" },
  { id: "CH-TG-007", name: "Banking Data SA", platform: "Telegram", subscribers: 11000, status: "active", lastActivity: "2026-02-06T15:00:00", leaksDetected: 4, riskLevel: "medium" },
  { id: "CH-TG-008", name: "Healthcare Dumps KSA", platform: "Telegram", subscribers: 7500, status: "active", lastActivity: "2026-02-05T11:00:00", leaksDetected: 3, riskLevel: "low" },
];

export const darkWebSources: MonitoringChannel[] = [
  { id: "CH-DW-001", name: "BreachForums — Saudi Section", platform: "Dark Web", subscribers: 0, status: "flagged", lastActivity: "2026-02-10T20:00:00", leaksDetected: 22, riskLevel: "high" },
  { id: "CH-DW-002", name: "XSS.is — KSA Threads", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-09T15:00:00", leaksDetected: 14, riskLevel: "high" },
  { id: "CH-DW-003", name: "Exploit.in — Saudi Market", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-08T12:00:00", leaksDetected: 9, riskLevel: "high" },
  { id: "CH-DW-004", name: "RaidForums Archive — SA", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-01-15T09:00:00", leaksDetected: 7, riskLevel: "medium" },
  { id: "CH-DW-005", name: "LeakBase — Saudi Data", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-07T18:00:00", leaksDetected: 5, riskLevel: "medium" },
];

export const pasteSources: MonitoringChannel[] = [
  { id: "CH-PS-001", name: "Pastebin — Saudi PII", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-10T23:00:00", leaksDetected: 11, riskLevel: "high" },
  { id: "CH-PS-002", name: "Ghostbin — KSA Dumps", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-09T17:00:00", leaksDetected: 6, riskLevel: "medium" },
  { id: "CH-PS-003", name: "PrivateBin — SA Credentials", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-08T14:00:00", leaksDetected: 4, riskLevel: "medium" },
  { id: "CH-PS-004", name: "JustPaste.it — Saudi Data", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-06T10:00:00", leaksDetected: 3, riskLevel: "low" },
];

export const piiPatterns: PIIMatch[] = [
  { type: "National ID", typeAr: "رقم الهوية الوطنية", pattern: "1\\d{9}", count: 4850000, sample: "10XXXXXXXX", category: "Identity" },
  { type: "Iqama Number", typeAr: "رقم الإقامة", pattern: "2\\d{9}", count: 1920000, sample: "20XXXXXXXX", category: "Identity" },
  { type: "Saudi Phone", typeAr: "رقم جوال سعودي", pattern: "05\\d{8}", count: 6340000, sample: "05XXXXXXXX", category: "Contact" },
  { type: "Saudi Email", typeAr: "بريد إلكتروني سعودي", pattern: ".*@.*\\.sa", count: 1280000, sample: "user@domain.sa", category: "Contact" },
  { type: "IBAN", typeAr: "رقم الحساب البنكي", pattern: "SA\\d{22}", count: 895000, sample: "SA0000XXXXXXXXXXXX", category: "Financial" },
  { type: "Passport", typeAr: "رقم جواز السفر", pattern: "[A-Z]\\d{8}", count: 750000, sample: "A12345678", category: "Identity" },
  { type: "Arabic Full Name", typeAr: "الاسم الكامل بالعربية", pattern: "NER Detection", count: 5120000, sample: "محمد بن عبدالله", category: "Personal" },
  { type: "Medical Record", typeAr: "سجل طبي", pattern: "MRN-\\d+", count: 2100000, sample: "MRN-XXXXXXX", category: "Health" },
];

export const monthlyTrends = [
  { month: "سبتمبر", monthEn: "Sep", leaks: 8, records: 1850000, telegram: 4, darkweb: 3, paste: 1 },
  { month: "أكتوبر", monthEn: "Oct", leaks: 11, records: 2450000, telegram: 5, darkweb: 4, paste: 2 },
  { month: "نوفمبر", monthEn: "Nov", leaks: 14, records: 3200000, telegram: 7, darkweb: 4, paste: 3 },
  { month: "ديسمبر", monthEn: "Dec", leaks: 9, records: 1920000, telegram: 4, darkweb: 3, paste: 2 },
  { month: "يناير", monthEn: "Jan", leaks: 16, records: 4100000, telegram: 8, darkweb: 5, paste: 3 },
  { month: "فبراير", monthEn: "Feb", leaks: 12, records: 3500000, telegram: 6, darkweb: 4, paste: 2 },
];

export const sectorDistribution = [
  { sector: "حكومة", sectorEn: "Government", count: 28, percentage: 33 },
  { sector: "اتصالات", sectorEn: "Telecom", count: 14, percentage: 16 },
  { sector: "بنوك", sectorEn: "Banking", count: 12, percentage: 14 },
  { sector: "صحة", sectorEn: "Healthcare", count: 10, percentage: 12 },
  { sector: "طاقة", sectorEn: "Energy", count: 8, percentage: 9 },
  { sector: "تعليم", sectorEn: "Education", count: 6, percentage: 7 },
  { sector: "تجزئة", sectorEn: "Retail", count: 4, percentage: 5 },
  { sector: "تأمين", sectorEn: "Insurance", count: 3, percentage: 4 },
];

export const sourceDistribution = [
  { source: "تليجرام", sourceEn: "Telegram", count: 35, percentage: 41 },
  { source: "الدارك ويب", sourceEn: "Dark Web", count: 32, percentage: 38 },
  { source: "مواقع اللصق", sourceEn: "Paste Sites", count: 18, percentage: 21 },
];

export const severityStats = {
  critical: 28,
  high: 24,
  medium: 19,
  low: 14,
};

export const dashboardStats = {
  totalLeaks: 85,
  totalRecords: 28500000,
  activeMonitors: 17,
  piiDetected: 23255000,
  criticalAlerts: 28,
  avgResponseTime: "1.8h",
};
