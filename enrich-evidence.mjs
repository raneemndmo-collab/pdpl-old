import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Evidence metadata templates based on type
const screenshotMetadata = [
  { url: "https://evidence-archive.rasid.sa/screenshots/darkweb-forum-post.png", description: "لقطة شاشة لمنشور في منتدى الويب المظلم يعرض البيانات للبيع", resolution: "1920x1080", captureMethod: "Tor Browser Screenshot", platform: "BreachForums" },
  { url: "https://evidence-archive.rasid.sa/screenshots/telegram-channel-leak.png", description: "لقطة شاشة لقناة تليجرام تنشر عينة من البيانات المسربة", resolution: "1440x900", captureMethod: "Telegram Desktop", platform: "Telegram" },
  { url: "https://evidence-archive.rasid.sa/screenshots/paste-site-dump.png", description: "لقطة شاشة لموقع لصق يحتوي على بيانات مسربة", resolution: "1920x1080", captureMethod: "Browser Screenshot", platform: "Pastebin" },
  { url: "https://evidence-archive.rasid.sa/screenshots/seller-profile.png", description: "لقطة شاشة لملف البائع على منصة البيع في الويب المظلم", resolution: "1920x1080", captureMethod: "Tor Browser Screenshot", platform: "XSS Forum" },
  { url: "https://evidence-archive.rasid.sa/screenshots/data-sample-preview.png", description: "لقطة شاشة لعينة البيانات المعروضة مع إخفاء المعلومات الحساسة", resolution: "1440x900", captureMethod: "Secure Viewer", platform: "Evidence Portal" },
];

const textMetadata = [
  { content: "عينة من البيانات المسربة تحتوي على: الاسم الكامل، رقم الهوية الوطنية، رقم الجوال، البريد الإلكتروني", sampleSize: "50 سجل", encoding: "UTF-8", language: "ar/en", redacted: true },
  { content: "نص إعلان البيع على المنتدى: 'Fresh Saudi database - verified - bulk discount available'", sampleSize: "إعلان كامل", encoding: "UTF-8", language: "en", redacted: false },
  { content: "محادثة مع البائع تكشف عن مصدر البيانات وطريقة الحصول عليها", sampleSize: "15 رسالة", encoding: "UTF-8", language: "en/ar", redacted: true },
  { content: "تحليل هيكل البيانات يكشف عن حقول: national_id, full_name, phone, email, address, dob", sampleSize: "تحليل الهيكل", encoding: "UTF-8", language: "en", redacted: false },
  { content: "سجل DNS ونتائج WHOIS للنطاق المستخدم في استضافة البيانات المسربة", sampleSize: "تقرير كامل", encoding: "UTF-8", language: "en", redacted: false },
];

const fileMetadata = [
  { filename: "leaked_database_sample.csv", fileSize: "2.4 MB", mimeType: "text/csv", sha256: "a1b2c3d4e5f6...", recordCount: 5000, containsPII: true, storageLocation: "S3 Encrypted Vault" },
  { filename: "darkweb_listing_archive.html", fileSize: "156 KB", mimeType: "text/html", sha256: "f6e5d4c3b2a1...", recordCount: null, containsPII: false, storageLocation: "S3 Encrypted Vault" },
  { filename: "telegram_export.json", fileSize: "8.7 MB", mimeType: "application/json", sha256: "1a2b3c4d5e6f...", recordCount: 12000, containsPII: true, storageLocation: "S3 Encrypted Vault" },
  { filename: "seller_communication_log.txt", fileSize: "45 KB", mimeType: "text/plain", sha256: "6f5e4d3c2b1a...", recordCount: null, containsPII: false, storageLocation: "S3 Encrypted Vault" },
  { filename: "breach_forensic_report.pdf", fileSize: "1.2 MB", mimeType: "application/pdf", sha256: "b2c3d4e5f6a1...", recordCount: null, containsPII: false, storageLocation: "S3 Encrypted Vault" },
];

const metadataTemplates = [
  { sourceUrl: "hxxps://breachforums[.]st/Thread-Saudi-DB-Fresh", discoveryMethod: "Automated Crawler", threatActor: "unknown", priceUSD: 500, currency: "BTC", verified: true, firstSeenDate: "2024-01-15", lastSeenDate: "2024-02-01" },
  { sourceUrl: "t.me/saudi_leaks_channel", discoveryMethod: "Telegram Monitor Bot", threatActor: "DataHunterSA", priceUSD: 0, currency: "Free", verified: true, firstSeenDate: "2024-03-10", lastSeenDate: "2024-03-10" },
  { sourceUrl: "hxxps://xss[.]is/threads/saudi-healthcare", discoveryMethod: "Dark Web Scanner", threatActor: "MedDataSeller", priceUSD: 2000, currency: "XMR", verified: true, firstSeenDate: "2024-05-20", lastSeenDate: "2024-06-15" },
  { sourceUrl: "pastebin.com/XXXXXXXX", discoveryMethod: "Paste Monitor", threatActor: "anonymous", priceUSD: 0, currency: "Free", verified: false, firstSeenDate: "2024-07-01", lastSeenDate: "2024-07-01" },
  { sourceUrl: "hxxps://raidforums[.]to/saudi-telecom-dump", discoveryMethod: "OSINT Tool", threatActor: "TelecomHacker99", priceUSD: 1500, currency: "BTC", verified: true, firstSeenDate: "2024-08-12", lastSeenDate: "2024-09-01" },
];

// Update all evidence records with metadata
const [allEvidence] = await conn.query('SELECT id, evidenceType, evidenceLeakId FROM evidence_chain WHERE evidenceMetadata IS NULL ORDER BY id');
console.log(`Found ${allEvidence.length} evidence records without metadata`);

let updated = 0;
for (const ev of allEvidence) {
  let metadata;
  switch (ev.evidenceType) {
    case 'screenshot':
      metadata = screenshotMetadata[ev.id % screenshotMetadata.length];
      break;
    case 'text':
      metadata = textMetadata[ev.id % textMetadata.length];
      break;
    case 'file':
      metadata = fileMetadata[ev.id % fileMetadata.length];
      break;
    case 'metadata':
      metadata = metadataTemplates[ev.id % metadataTemplates.length];
      break;
  }
  
  if (metadata) {
    await conn.query('UPDATE evidence_chain SET evidenceMetadata = ? WHERE id = ?', [JSON.stringify(metadata), ev.id]);
    updated++;
  }
}

console.log(`Updated ${updated} evidence records with metadata`);

// Now add evidence for leaks that don't have any (57 leaks without evidence)
const [leaksWithoutEvidence] = await conn.query(`
  SELECT l.leakId, l.source, l.severity, l.sector, l.titleAr, l.recordCount 
  FROM leaks l 
  LEFT JOIN evidence_chain ec ON l.leakId = ec.evidenceLeakId 
  WHERE ec.id IS NULL
  ORDER BY l.id
`);
console.log(`\nFound ${leaksWithoutEvidence.length} leaks without evidence`);

const capturedByOptions = [
  "محلل أمني - فهد", "محلل أمني - أحمد", "محلل أمني - سارة", 
  "نظام الرصد الآلي", "فريق التحقيق الرقمي", "محلل تهديدات - خالد",
  "محلل أمني - نورة", "فريق الاستجابة للحوادث"
];

let evidenceCounter = 155; // Start after existing evidence
let newEvidence = 0;

for (const leak of leaksWithoutEvidence) {
  const numEvidence = 2 + Math.floor(Math.random() * 3); // 2-4 evidence per leak
  let previousHash = null;
  
  for (let i = 0; i < numEvidence; i++) {
    const types = ['metadata', 'screenshot', 'text', 'file'];
    const evidenceType = types[i % types.length];
    const hash = Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    const capturedBy = capturedByOptions[Math.floor(Math.random() * capturedByOptions.length)];
    
    let metadata;
    switch (evidenceType) {
      case 'screenshot':
        metadata = screenshotMetadata[evidenceCounter % screenshotMetadata.length];
        break;
      case 'text':
        metadata = textMetadata[evidenceCounter % textMetadata.length];
        break;
      case 'file':
        metadata = fileMetadata[evidenceCounter % fileMetadata.length];
        break;
      case 'metadata':
        metadata = metadataTemplates[evidenceCounter % metadataTemplates.length];
        break;
    }
    
    const capturedDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    
    await conn.query(`
      INSERT INTO evidence_chain (evidenceId, evidenceLeakId, evidenceType, contentHash, previousHash, blockIndex, capturedBy, evidenceMetadata, isVerified, capturedAt, evidenceCreatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())
    `, [
      `EV-${String(evidenceCounter).padStart(5, '0')}`,
      leak.leakId,
      evidenceType,
      hash,
      previousHash,
      i + 1,
      capturedBy,
      JSON.stringify(metadata),
      capturedDate
    ]);
    
    previousHash = hash;
    evidenceCounter++;
    newEvidence++;
  }
}

console.log(`Created ${newEvidence} new evidence records`);

// Verify final counts
const [finalCount] = await conn.query('SELECT COUNT(*) as c FROM evidence_chain');
const [finalLeaksWithEvidence] = await conn.query('SELECT COUNT(DISTINCT evidenceLeakId) as c FROM evidence_chain');
const [withMetadata] = await conn.query('SELECT COUNT(*) as c FROM evidence_chain WHERE evidenceMetadata IS NOT NULL');
console.log(`\nFinal: ${finalCount[0].c} total evidence, ${finalLeaksWithEvidence[0].c} leaks covered, ${withMetadata[0].c} with metadata`);

await conn.end();
console.log('Done!');
