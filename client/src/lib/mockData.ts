/**
 * Mock data for the NDMO Leak Monitor platform
 * Simulates real monitoring data for demonstration
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
    id: "LK-2026-001",
    title: "Saudi Telecom Customer Database",
    titleAr: "قاعدة بيانات عملاء اتصالات سعودية",
    source: "telegram",
    severity: "critical",
    sector: "Telecom",
    sectorAr: "اتصالات",
    piiTypes: ["National ID", "Phone Numbers", "Full Names"],
    recordCount: 245000,
    detectedAt: "2026-02-09T14:30:00",
    status: "analyzing",
    description: "Large dataset containing Saudi telecom customer records with national IDs and phone numbers",
    descriptionAr: "مجموعة بيانات كبيرة تحتوي سجلات عملاء اتصالات سعودية مع أرقام الهوية والجوال",
  },
  {
    id: "LK-2026-002",
    title: "Healthcare Records Leak",
    titleAr: "تسريب سجلات صحية",
    source: "darkweb",
    severity: "critical",
    sector: "Healthcare",
    sectorAr: "صحة",
    piiTypes: ["National ID", "Medical Records", "Full Names", "Addresses"],
    recordCount: 89000,
    detectedAt: "2026-02-08T09:15:00",
    status: "documented",
    description: "Patient records from a Saudi hospital chain sold on dark web marketplace",
    descriptionAr: "سجلات مرضى من سلسلة مستشفيات سعودية معروضة للبيع في الدارك ويب",
  },
  {
    id: "LK-2026-003",
    title: "Banking Customer Data",
    titleAr: "بيانات عملاء بنكية",
    source: "telegram",
    severity: "high",
    sector: "Banking",
    sectorAr: "بنوك",
    piiTypes: ["IBAN", "Phone Numbers", "Full Names"],
    recordCount: 52000,
    detectedAt: "2026-02-07T18:45:00",
    status: "reported",
    description: "Banking customer information shared in a Telegram channel",
    descriptionAr: "معلومات عملاء بنكية مشاركة في قناة تليجرام",
  },
  {
    id: "LK-2026-004",
    title: "University Student Records",
    titleAr: "سجلات طلاب جامعية",
    source: "paste",
    severity: "medium",
    sector: "Education",
    sectorAr: "تعليم",
    piiTypes: ["National ID", "Email", "Full Names"],
    recordCount: 15000,
    detectedAt: "2026-02-06T11:20:00",
    status: "new",
    description: "Student records from a Saudi university posted on paste site",
    descriptionAr: "سجلات طلاب من جامعة سعودية منشورة في موقع لصق",
  },
  {
    id: "LK-2026-005",
    title: "Government Employee Directory",
    titleAr: "دليل موظفين حكوميين",
    source: "darkweb",
    severity: "high",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["National ID", "Phone Numbers", "Email", "Job Titles"],
    recordCount: 31000,
    detectedAt: "2026-02-05T16:00:00",
    status: "analyzing",
    description: "Government employee directory with personal details available on dark web forum",
    descriptionAr: "دليل موظفين حكوميين مع بيانات شخصية متاح في منتدى دارك ويب",
  },
  {
    id: "LK-2026-006",
    title: "E-commerce Customer Dump",
    titleAr: "تفريغ بيانات عملاء متجر إلكتروني",
    source: "telegram",
    severity: "medium",
    sector: "Retail",
    sectorAr: "تجزئة",
    piiTypes: ["Email", "Phone Numbers", "Addresses"],
    recordCount: 120000,
    detectedAt: "2026-02-04T08:30:00",
    status: "documented",
    description: "Customer data from a Saudi e-commerce platform shared in Telegram group",
    descriptionAr: "بيانات عملاء من منصة تجارة إلكترونية سعودية مشاركة في مجموعة تليجرام",
  },
  {
    id: "LK-2026-007",
    title: "Insurance Policy Holders",
    titleAr: "حاملو وثائق التأمين",
    source: "paste",
    severity: "high",
    sector: "Insurance",
    sectorAr: "تأمين",
    piiTypes: ["National ID", "Full Names", "Policy Details"],
    recordCount: 43000,
    detectedAt: "2026-02-03T13:10:00",
    status: "new",
    description: "Insurance policyholder data with national IDs posted on paste site",
    descriptionAr: "بيانات حاملي وثائق تأمين مع أرقام الهوية منشورة في موقع لصق",
  },
  {
    id: "LK-2026-008",
    title: "Iqama Holder Records",
    titleAr: "سجلات حاملي الإقامة",
    source: "darkweb",
    severity: "critical",
    sector: "Government",
    sectorAr: "حكومة",
    piiTypes: ["Iqama Number", "Full Names", "Employer", "Phone Numbers"],
    recordCount: 178000,
    detectedAt: "2026-02-02T20:45:00",
    status: "reported",
    description: "Large database of Iqama holder records with employer information sold on dark web",
    descriptionAr: "قاعدة بيانات كبيرة لسجلات حاملي الإقامة مع معلومات أصحاب العمل معروضة في الدارك ويب",
  },
];

export const telegramChannels: MonitoringChannel[] = [
  { id: "TG-001", name: "KSA Data Market", platform: "Telegram", subscribers: 12400, status: "active", lastActivity: "2026-02-09T22:15:00", leaksDetected: 23, riskLevel: "high" },
  { id: "TG-002", name: "Saudi Leaks DB", platform: "Telegram", subscribers: 8900, status: "flagged", lastActivity: "2026-02-09T18:30:00", leaksDetected: 15, riskLevel: "high" },
  { id: "TG-003", name: "Gulf Data Exchange", platform: "Telegram", subscribers: 5600, status: "active", lastActivity: "2026-02-09T14:00:00", leaksDetected: 8, riskLevel: "medium" },
  { id: "TG-004", name: "ME Database Traders", platform: "Telegram", subscribers: 15200, status: "active", lastActivity: "2026-02-08T21:45:00", leaksDetected: 31, riskLevel: "high" },
  { id: "TG-005", name: "Saudi Info Hub", platform: "Telegram", subscribers: 3200, status: "paused", lastActivity: "2026-02-07T10:20:00", leaksDetected: 4, riskLevel: "low" },
  { id: "TG-006", name: "KSA Combo Lists", platform: "Telegram", subscribers: 7800, status: "active", lastActivity: "2026-02-09T16:00:00", leaksDetected: 19, riskLevel: "high" },
];

export const darkWebSources: MonitoringChannel[] = [
  { id: "DW-001", name: "BreachForums Mirror", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-09T20:00:00", leaksDetected: 12, riskLevel: "high" },
  { id: "DW-002", name: "RaidForums Archive", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-08T15:30:00", leaksDetected: 7, riskLevel: "medium" },
  { id: "DW-003", name: "Exploit.in Market", platform: "Dark Web", subscribers: 0, status: "flagged", lastActivity: "2026-02-09T12:45:00", leaksDetected: 18, riskLevel: "high" },
  { id: "DW-004", name: "XSS.is Forum", platform: "Dark Web", subscribers: 0, status: "active", lastActivity: "2026-02-07T09:15:00", leaksDetected: 5, riskLevel: "medium" },
];

export const pasteSources: MonitoringChannel[] = [
  { id: "PS-001", name: "Pastebin.com", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-09T23:00:00", leaksDetected: 9, riskLevel: "medium" },
  { id: "PS-002", name: "Ghostbin", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-09T17:30:00", leaksDetected: 3, riskLevel: "low" },
  { id: "PS-003", name: "PrivateBin Instances", platform: "Paste", subscribers: 0, status: "active", lastActivity: "2026-02-08T14:00:00", leaksDetected: 6, riskLevel: "medium" },
];

export const piiPatterns: PIIMatch[] = [
  { type: "National ID", typeAr: "رقم الهوية الوطنية", pattern: "1\\d{9}", count: 342500, sample: "10XXXXXXXX", category: "Identity" },
  { type: "Iqama Number", typeAr: "رقم الإقامة", pattern: "2\\d{9}", count: 178200, sample: "20XXXXXXXX", category: "Identity" },
  { type: "Saudi Phone", typeAr: "رقم جوال سعودي", pattern: "05\\d{8}", count: 523000, sample: "05XXXXXXXX", category: "Contact" },
  { type: "Saudi Email", typeAr: "بريد إلكتروني سعودي", pattern: ".*@.*\\.sa", count: 89400, sample: "user@domain.sa", category: "Contact" },
  { type: "IBAN", typeAr: "رقم الحساب البنكي", pattern: "SA\\d{22}", count: 45600, sample: "SA0000XXXXXXXXXXXX", category: "Financial" },
  { type: "Arabic Full Name", typeAr: "الاسم الكامل بالعربية", pattern: "NER Detection", count: 412000, sample: "محمد بن عبدالله", category: "Personal" },
];

export const monthlyTrends = [
  { month: "سبتمبر", monthEn: "Sep", leaks: 18, records: 120000, telegram: 10, darkweb: 5, paste: 3 },
  { month: "أكتوبر", monthEn: "Oct", leaks: 24, records: 185000, telegram: 14, darkweb: 6, paste: 4 },
  { month: "نوفمبر", monthEn: "Nov", leaks: 31, records: 245000, telegram: 18, darkweb: 8, paste: 5 },
  { month: "ديسمبر", monthEn: "Dec", leaks: 22, records: 167000, telegram: 12, darkweb: 7, paste: 3 },
  { month: "يناير", monthEn: "Jan", leaks: 35, records: 312000, telegram: 20, darkweb: 9, paste: 6 },
  { month: "فبراير", monthEn: "Feb", leaks: 28, records: 276000, telegram: 16, darkweb: 8, paste: 4 },
];

export const sectorDistribution = [
  { sector: "اتصالات", sectorEn: "Telecom", count: 42, percentage: 26 },
  { sector: "صحة", sectorEn: "Healthcare", count: 35, percentage: 22 },
  { sector: "بنوك", sectorEn: "Banking", count: 28, percentage: 17 },
  { sector: "حكومة", sectorEn: "Government", count: 24, percentage: 15 },
  { sector: "تعليم", sectorEn: "Education", count: 18, percentage: 11 },
  { sector: "تجزئة", sectorEn: "Retail", count: 14, percentage: 9 },
];

export const sourceDistribution = [
  { source: "تليجرام", sourceEn: "Telegram", count: 89, percentage: 55 },
  { source: "الدارك ويب", sourceEn: "Dark Web", count: 42, percentage: 26 },
  { source: "مواقع اللصق", sourceEn: "Paste Sites", count: 30, percentage: 19 },
];

export const severityStats = {
  critical: 12,
  high: 28,
  medium: 45,
  low: 76,
};

export const dashboardStats = {
  totalLeaks: 161,
  totalRecords: 1305000,
  activeMonitors: 13,
  piiDetected: 1590700,
  criticalAlerts: 12,
  avgResponseTime: "2.4h",
};
