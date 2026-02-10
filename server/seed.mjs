/**
 * Seed script for NDMO Leak Monitor database
 * Run: node server/seed.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding NDMO database...");

  // Seed leaks
  await db.execute(sql`INSERT IGNORE INTO leaks (leakId, title, titleAr, source, severity, sector, sectorAr, piiTypes, recordCount, status, description, descriptionAr, detectedAt) VALUES
    ('LK-2026-001', 'Saudi Telecom Customer Database', 'قاعدة بيانات عملاء اتصالات سعودية', 'telegram', 'critical', 'Telecom', 'اتصالات', '["National ID","Phone Numbers","Full Names"]', 245000, 'analyzing', 'Large dataset containing Saudi telecom customer records with national IDs and phone numbers', 'مجموعة بيانات كبيرة تحتوي سجلات عملاء اتصالات سعودية مع أرقام الهوية والجوال', '2026-02-09 14:30:00'),
    ('LK-2026-002', 'Healthcare Records Leak', 'تسريب سجلات صحية', 'darkweb', 'critical', 'Healthcare', 'صحة', '["National ID","Medical Records","Full Names","Addresses"]', 89000, 'documented', 'Patient records from a Saudi hospital chain sold on dark web marketplace', 'سجلات مرضى من سلسلة مستشفيات سعودية معروضة للبيع في الدارك ويب', '2026-02-08 09:15:00'),
    ('LK-2026-003', 'Banking Customer Data', 'بيانات عملاء بنكية', 'telegram', 'high', 'Banking', 'بنوك', '["IBAN","Phone Numbers","Full Names"]', 52000, 'reported', 'Banking customer information shared in a Telegram channel', 'معلومات عملاء بنكية مشاركة في قناة تليجرام', '2026-02-07 18:45:00'),
    ('LK-2026-004', 'University Student Records', 'سجلات طلاب جامعية', 'paste', 'medium', 'Education', 'تعليم', '["National ID","Email","Full Names"]', 15000, 'new', 'Student records from a Saudi university posted on paste site', 'سجلات طلاب من جامعة سعودية منشورة في موقع لصق', '2026-02-06 11:20:00'),
    ('LK-2026-005', 'Government Employee Directory', 'دليل موظفين حكوميين', 'darkweb', 'high', 'Government', 'حكومة', '["National ID","Phone Numbers","Email","Job Titles"]', 31000, 'analyzing', 'Government employee directory with personal details available on dark web forum', 'دليل موظفين حكوميين مع بيانات شخصية متاح في منتدى دارك ويب', '2026-02-05 16:00:00'),
    ('LK-2026-006', 'E-commerce Customer Dump', 'تفريغ بيانات عملاء متجر إلكتروني', 'telegram', 'medium', 'Retail', 'تجزئة', '["Email","Phone Numbers","Addresses"]', 120000, 'documented', 'Customer data from a Saudi e-commerce platform shared in Telegram group', 'بيانات عملاء من منصة تجارة إلكترونية سعودية مشاركة في مجموعة تليجرام', '2026-02-04 08:30:00'),
    ('LK-2026-007', 'Insurance Policy Holders', 'حاملو وثائق التأمين', 'paste', 'high', 'Insurance', 'تأمين', '["National ID","Full Names","Policy Details"]', 43000, 'new', 'Insurance policyholder data with national IDs posted on paste site', 'بيانات حاملي وثائق تأمين مع أرقام الهوية منشورة في موقع لصق', '2026-02-03 13:10:00'),
    ('LK-2026-008', 'Iqama Holder Records', 'سجلات حاملي الإقامة', 'darkweb', 'critical', 'Government', 'حكومة', '["Iqama Number","Full Names","Employer","Phone Numbers"]', 178000, 'reported', 'Large database of Iqama holder records with employer information sold on dark web', 'قاعدة بيانات كبيرة لسجلات حاملي الإقامة مع معلومات أصحاب العمل معروضة في الدارك ويب', '2026-02-02 20:45:00')
  `);
  console.log("  ✅ Leaks seeded");

  // Seed channels
  await db.execute(sql`INSERT IGNORE INTO channels (channelId, name, platform, subscribers, status, lastActivity, leaksDetected, riskLevel) VALUES
    ('TG-001', 'KSA Data Market', 'telegram', 12400, 'active', '2026-02-09 22:15:00', 23, 'high'),
    ('TG-002', 'Saudi Leaks DB', 'telegram', 8900, 'flagged', '2026-02-09 18:30:00', 15, 'high'),
    ('TG-003', 'Gulf Data Exchange', 'telegram', 5600, 'active', '2026-02-09 14:00:00', 8, 'medium'),
    ('TG-004', 'ME Database Traders', 'telegram', 15200, 'active', '2026-02-08 21:45:00', 31, 'high'),
    ('TG-005', 'Saudi Info Hub', 'telegram', 3200, 'paused', '2026-02-07 10:20:00', 4, 'low'),
    ('TG-006', 'KSA Combo Lists', 'telegram', 7800, 'active', '2026-02-09 16:00:00', 19, 'high'),
    ('DW-001', 'BreachForums Mirror', 'darkweb', 0, 'active', '2026-02-09 20:00:00', 12, 'high'),
    ('DW-002', 'RaidForums Archive', 'darkweb', 0, 'active', '2026-02-08 15:30:00', 7, 'medium'),
    ('DW-003', 'Exploit.in Market', 'darkweb', 0, 'flagged', '2026-02-09 12:45:00', 18, 'high'),
    ('DW-004', 'XSS.is Forum', 'darkweb', 0, 'active', '2026-02-07 09:15:00', 5, 'medium'),
    ('PS-001', 'Pastebin.com', 'paste', 0, 'active', '2026-02-09 23:00:00', 9, 'medium'),
    ('PS-002', 'Ghostbin', 'paste', 0, 'active', '2026-02-09 17:30:00', 3, 'low'),
    ('PS-003', 'PrivateBin Instances', 'paste', 0, 'active', '2026-02-08 14:00:00', 6, 'medium')
  `);
  console.log("  ✅ Channels seeded");

  // Seed dark web listings
  await db.execute(sql`INSERT IGNORE INTO dark_web_listings (title, titleAr, listingSeverity, sourceName, price, recordCount, detectedAt) VALUES
    ('Saudi Healthcare DB for sale', 'عرض بيع قاعدة بيانات صحية سعودية', 'critical', 'BreachForums Mirror', '$5,000', 89000, '2026-02-08 10:00:00'),
    ('Fresh Iqama data dump', 'تفريغ بيانات إقامات حديث', 'critical', 'Exploit.in Market', '$3,500', 178000, '2026-02-07 14:00:00'),
    ('Saudi Gov Employee Directory', 'دليل موظفين حكوميين سعوديين', 'high', 'XSS.is Forum', '$2,000', 31000, '2026-02-05 09:00:00'),
    ('Leaked insurance customer data', 'بيانات عملاء تأمين مسربة', 'high', 'RaidForums Archive', '$1,200', 43000, '2026-02-03 16:00:00')
  `);
  console.log("  ✅ Dark web listings seeded");

  // Seed paste entries
  await db.execute(sql`INSERT IGNORE INTO paste_entries (filename, sourceName, fileSize, pastePiiTypes, preview, pasteStatus, detectedAt) VALUES
    ('Saudi_Student_DB_2026.txt', 'Pastebin.com', '2.4 MB', '["National ID","Email","Full Names"]', '1XXXXXXXXX | محمد أحمد | mohammed@university.sa | ...', 'flagged', '2026-02-09 08:00:00'),
    ('ksa_insurance_dump.csv', 'Ghostbin', '5.1 MB', '["National ID","Full Names","Policy Details"]', '1XXXXXXXXX | عبدالله محمد | POL-XXXXXX | ...', 'flagged', '2026-02-08 12:00:00'),
    ('combo_list_sa_2026.txt', 'PrivateBin', '890 KB', '["Email","Passwords"]', 'user@domain.sa:p@ssw0rd | ...', 'analyzing', '2026-02-07 15:00:00'),
    ('medical_records_leak.json', 'Pastebin.com', '12.3 MB', '["National ID","Medical Records","Full Names"]', '{"id": "1XXXXXXXXX", "name": "فاطمة علي", "diagnosis": "..."}', 'documented', '2026-02-06 10:00:00'),
    ('saudi_phones_2026.txt', 'Ghostbin', '1.7 MB', '["Phone Numbers","Full Names"]', '05XXXXXXXX | سارة محمد | ...', 'reported', '2026-02-05 18:00:00')
  `);
  console.log("  ✅ Paste entries seeded");

  // Seed reports
  await db.execute(sql`INSERT IGNORE INTO reports (title, titleAr, type, reportStatus, pageCount, createdAt) VALUES
    ('Quarterly Personal Data Leak Report — Q1 2026', 'التقرير الربعي لتسريبات البيانات الشخصية — الربع الأول 2026', 'quarterly', 'published', 45, '2026-01-31 00:00:00'),
    ('Monthly Report — January 2026', 'التقرير الشهري — يناير 2026', 'monthly', 'published', 18, '2026-01-31 00:00:00'),
    ('Monthly Report — February 2026 (Draft)', 'التقرير الشهري — فبراير 2026 (مسودة)', 'monthly', 'draft', 12, '2026-02-10 00:00:00'),
    ('Special Report: Healthcare Sector Leaks', 'تقرير خاص: تسريبات القطاع الصحي', 'special', 'published', 28, '2026-02-05 00:00:00')
  `);
  console.log("  ✅ Reports seeded");

  console.log("🎉 Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
