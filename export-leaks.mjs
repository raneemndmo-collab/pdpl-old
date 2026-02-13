import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const exportDir = '/home/ubuntu/ndmo-leaks-export';
if (fs.existsSync(exportDir)) fs.rmSync(exportDir, { recursive: true });
fs.mkdirSync(exportDir, { recursive: true });
fs.mkdirSync(path.join(exportDir, 'incidents'), { recursive: true });
fs.mkdirSync(path.join(exportDir, 'evidence'), { recursive: true });

const conn = await mysql.createConnection(DATABASE_URL);

// ─── 1. Export ALL leaks with ALL fields ───
console.log('📦 Extracting all leaks...');
const [leaks] = await conn.execute('SELECT * FROM leaks ORDER BY id ASC');
console.log(`   Found ${leaks.length} leaks`);

// ─── 2. Export ALL evidence chain entries ───
console.log('🔗 Extracting evidence chain...');
const [evidence] = await conn.execute('SELECT * FROM evidence_chain ORDER BY evidenceLeakId, blockIndex ASC');
console.log(`   Found ${evidence.length} evidence entries`);

// ─── 3. Export seller profiles ───
console.log('👤 Extracting seller profiles...');
const [sellers] = await conn.execute('SELECT * FROM seller_profiles ORDER BY id ASC');
console.log(`   Found ${sellers.length} seller profiles`);

// ─── 4. Export channels ───
console.log('📡 Extracting monitoring channels...');
const [channels] = await conn.execute('SELECT * FROM channels ORDER BY id ASC');
console.log(`   Found ${channels.length} channels`);

// ─── Build evidence map by leakId ───
const evidenceMap = {};
for (const ev of evidence) {
  const lid = ev.evidenceLeakId;
  if (!evidenceMap[lid]) evidenceMap[lid] = [];
  evidenceMap[lid].push(ev);
}

// ─── Build seller map by name ───
const sellerMap = {};
for (const s of sellers) {
  sellerMap[s.sellerName] = s;
}

// ─── Parse JSON fields safely ───
function safeParseJson(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return val; }
}

// ─── Format a single leak for export ───
function formatLeak(leak) {
  const ev = evidenceMap[leak.leakId] || [];
  const seller = leak.threatActor ? sellerMap[leak.threatActor] || null : null;
  
  return {
    // === Basic Info ===
    id: leak.id,
    leakId: leak.leakId,
    title: leak.title,
    titleAr: leak.titleAr,
    source: leak.source,
    severity: leak.severity,
    sector: leak.sector,
    sectorAr: leak.sectorAr,
    status: leak.status,
    recordCount: leak.recordCount,
    
    // === Descriptions ===
    description: leak.description,
    descriptionAr: leak.descriptionAr,
    
    // === PII Types ===
    piiTypes: safeParseJson(leak.piiTypes),
    
    // === Source Info ===
    sourceUrl: leak.sourceUrl,
    sourcePlatform: leak.sourcePlatform,
    threatActor: leak.threatActor,
    price: leak.leakPrice,
    breachMethod: leak.breachMethod,
    breachMethodAr: leak.breachMethodAr,
    
    // === AI Enrichment ===
    aiSeverity: leak.aiSeverity,
    aiSummary: leak.aiSummary,
    aiSummaryAr: leak.aiSummaryAr,
    aiRecommendations: safeParseJson(leak.aiRecommendations),
    aiRecommendationsAr: safeParseJson(leak.aiRecommendationsAr),
    aiConfidence: leak.aiConfidence,
    enrichedAt: leak.enrichedAt,
    
    // === Sample Data ===
    sampleData: safeParseJson(leak.sampleData),
    
    // === Screenshots ===
    screenshotUrls: safeParseJson(leak.screenshotUrls),
    
    // === Geographic Data ===
    region: leak.region,
    regionAr: leak.regionAr,
    city: leak.city,
    cityAr: leak.cityAr,
    latitude: leak.latitude,
    longitude: leak.longitude,
    
    // === Timestamps ===
    detectedAt: leak.detectedAt,
    createdAt: leak.createdAt,
    updatedAt: leak.updatedAt,
    
    // === Evidence Chain ===
    evidenceChain: ev.map(e => ({
      evidenceId: e.evidenceId,
      evidenceType: e.evidenceType,
      contentHash: e.contentHash,
      previousHash: e.previousHash,
      blockIndex: e.blockIndex,
      capturedBy: e.capturedBy,
      metadata: safeParseJson(e.evidenceMetadata),
      isVerified: e.isVerified,
      capturedAt: e.capturedAt,
    })),
    
    // === Seller Profile (if available) ===
    sellerProfile: seller ? {
      sellerId: seller.sellerId,
      name: seller.sellerName,
      aliases: safeParseJson(seller.sellerAliases),
      platforms: safeParseJson(seller.sellerPlatforms),
      totalLeaks: seller.totalLeaks,
      totalRecords: seller.sellerTotalRecords,
      riskScore: seller.sellerRiskScore,
      riskLevel: seller.sellerRiskLevel,
      sectors: safeParseJson(seller.sellerSectors),
      lastActivity: seller.sellerLastActivity,
      firstSeen: seller.sellerFirstSeen,
      notes: seller.sellerNotes,
    } : null,
  };
}

// ─── 5. Create individual incident files ───
console.log('📄 Creating individual incident files...');
const allFormatted = [];
for (const leak of leaks) {
  const formatted = formatLeak(leak);
  allFormatted.push(formatted);
  
  // Individual JSON file per incident
  const filename = `${formatted.leakId}.json`;
  fs.writeFileSync(
    path.join(exportDir, 'incidents', filename),
    JSON.stringify(formatted, null, 2),
    'utf-8'
  );
}

// ─── 6. Create master JSON file ───
console.log('📋 Creating master JSON file...');
fs.writeFileSync(
  path.join(exportDir, 'all-incidents.json'),
  JSON.stringify(allFormatted, null, 2),
  'utf-8'
);

// ─── 7. Create CSV file ───
console.log('📊 Creating CSV file...');
const csvHeaders = [
  'id', 'leakId', 'title', 'titleAr', 'source', 'severity', 'sector', 'sectorAr',
  'status', 'recordCount', 'description', 'descriptionAr',
  'piiTypes', 'sourceUrl', 'sourcePlatform', 'threatActor', 'price',
  'breachMethod', 'breachMethodAr',
  'aiSeverity', 'aiSummary', 'aiSummaryAr', 'aiConfidence',
  'aiRecommendations', 'aiRecommendationsAr',
  'sampleData', 'screenshotUrls',
  'region', 'regionAr', 'city', 'cityAr', 'latitude', 'longitude',
  'detectedAt', 'createdAt', 'updatedAt', 'enrichedAt',
  'evidenceCount'
];

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const csvRows = ['\uFEFF' + csvHeaders.join(',')]; // BOM for Arabic support
for (const leak of allFormatted) {
  const row = csvHeaders.map(h => {
    if (h === 'evidenceCount') return leak.evidenceChain?.length || 0;
    if (h === 'piiTypes') return csvEscape(leak.piiTypes);
    if (h === 'aiRecommendations') return csvEscape(leak.aiRecommendations);
    if (h === 'aiRecommendationsAr') return csvEscape(leak.aiRecommendationsAr);
    if (h === 'sampleData') return csvEscape(leak.sampleData);
    if (h === 'screenshotUrls') return csvEscape(leak.screenshotUrls);
    return csvEscape(leak[h]);
  });
  csvRows.push(row.join(','));
}
fs.writeFileSync(path.join(exportDir, 'all-incidents.csv'), csvRows.join('\n'), 'utf-8');

// ─── 8. Create evidence chain file ───
console.log('🔗 Creating evidence chain file...');
fs.writeFileSync(
  path.join(exportDir, 'evidence', 'all-evidence.json'),
  JSON.stringify(evidence.map(e => ({
    ...e,
    evidenceMetadata: safeParseJson(e.evidenceMetadata),
  })), null, 2),
  'utf-8'
);

// ─── 9. Create seller profiles file ───
console.log('👤 Creating seller profiles file...');
fs.writeFileSync(
  path.join(exportDir, 'seller-profiles.json'),
  JSON.stringify(sellers.map(s => ({
    ...s,
    sellerAliases: safeParseJson(s.sellerAliases),
    sellerPlatforms: safeParseJson(s.sellerPlatforms),
    sellerSectors: safeParseJson(s.sellerSectors),
  })), null, 2),
  'utf-8'
);

// ─── 10. Create channels file ───
console.log('📡 Creating channels file...');
fs.writeFileSync(
  path.join(exportDir, 'monitoring-channels.json'),
  JSON.stringify(channels, null, 2),
  'utf-8'
);

// ─── 11. Create summary report ───
console.log('📈 Creating summary report...');
const severityCounts = {};
const sourceCounts = {};
const sectorCounts = {};
const statusCounts = {};
let totalRecords = 0;
let withScreenshots = 0;
let withSampleData = 0;
let withAiSummary = 0;
let withEvidence = 0;
let withGeo = 0;

for (const l of allFormatted) {
  severityCounts[l.severity] = (severityCounts[l.severity] || 0) + 1;
  sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  sectorCounts[l.sectorAr || l.sector] = (sectorCounts[l.sectorAr || l.sector] || 0) + 1;
  statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  totalRecords += l.recordCount || 0;
  if (l.screenshotUrls?.length) withScreenshots++;
  if (l.sampleData?.length) withSampleData++;
  if (l.aiSummary || l.aiSummaryAr) withAiSummary++;
  if (l.evidenceChain?.length) withEvidence++;
  if (l.latitude && l.longitude) withGeo++;
}

const summary = {
  exportDate: new Date().toISOString(),
  totalIncidents: allFormatted.length,
  totalRecordsExposed: totalRecords,
  totalEvidenceEntries: evidence.length,
  totalSellerProfiles: sellers.length,
  totalChannels: channels.length,
  dataCompleteness: {
    withScreenshots,
    withSampleData,
    withAiSummary,
    withEvidence,
    withGeoCoordinates: withGeo,
  },
  breakdownBySeverity: severityCounts,
  breakdownBySource: sourceCounts,
  breakdownBySector: sectorCounts,
  breakdownByStatus: statusCounts,
};

fs.writeFileSync(
  path.join(exportDir, 'export-summary.json'),
  JSON.stringify(summary, null, 2),
  'utf-8'
);

// ─── 12. Create README ───
const readmeContent = `# تصدير حوادث تسريبات البيانات الشخصية — منصة راصد
# NDMO Personal Data Leak Incidents Export — Rasid Platform

تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' })}
Export Date: ${new Date().toISOString()}

## الإحصائيات العامة
- إجمالي الحوادث: ${allFormatted.length}
- إجمالي السجلات المكشوفة: ${totalRecords.toLocaleString('ar-SA')}
- إجمالي سلسلة الأدلة: ${evidence.length}
- إجمالي ملفات البائعين: ${sellers.length}
- إجمالي قنوات الرصد: ${channels.length}

## اكتمال البيانات
- حوادث مع لقطات شاشة: ${withScreenshots}/${allFormatted.length}
- حوادث مع بيانات عينة: ${withSampleData}/${allFormatted.length}
- حوادث مع تحليل ذكاء اصطناعي: ${withAiSummary}/${allFormatted.length}
- حوادث مع سلسلة أدلة: ${withEvidence}/${allFormatted.length}
- حوادث مع إحداثيات جغرافية: ${withGeo}/${allFormatted.length}

## توزيع الخطورة
${Object.entries(severityCounts).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

## توزيع المصادر
${Object.entries(sourceCounts).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

## توزيع الحالات
${Object.entries(statusCounts).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

## هيكل الملفات
\`\`\`
ndmo-leaks-export/
├── README.md                    ← هذا الملف
├── export-summary.json          ← ملخص الإحصائيات
├── all-incidents.json           ← جميع الحوادث (ملف رئيسي)
├── all-incidents.csv            ← جميع الحوادث بصيغة CSV
├── seller-profiles.json         ← ملفات البائعين
├── monitoring-channels.json     ← قنوات الرصد
├── incidents/                   ← حادثة واحدة لكل ملف
│   ├── LK-2026-0001.json
│   ├── LK-2026-0002.json
│   └── ... (${allFormatted.length} ملف)
└── evidence/                    ← سلسلة الأدلة
    └── all-evidence.json        ← جميع سجلات الأدلة
\`\`\`

## حقول كل حادثة
كل ملف حادثة يحتوي على:
- المعلومات الأساسية (المعرف، العنوان، المصدر، الخطورة، القطاع، الحالة)
- الوصف (عربي/إنجليزي)
- أنواع البيانات الشخصية المكشوفة (piiTypes)
- معلومات المصدر (الرابط، المنصة، الجهة الفاعلة، السعر، طريقة الاختراق)
- تحليل الذكاء الاصطناعي (الملخص، التوصيات، مستوى الثقة)
- بيانات العينة (sampleData)
- لقطات الشاشة (screenshotUrls)
- البيانات الجغرافية (المنطقة، المدينة، الإحداثيات)
- سلسلة الأدلة (evidenceChain)
- ملف البائع (sellerProfile)
- التواريخ (الاكتشاف، الإنشاء، التحديث، الإثراء)
`;

fs.writeFileSync(path.join(exportDir, 'README.md'), readmeContent, 'utf-8');

await conn.end();

console.log('\n✅ Export complete!');
console.log(`   📁 Output directory: ${exportDir}`);
console.log(`   📄 ${allFormatted.length} incidents exported`);
console.log(`   🔗 ${evidence.length} evidence entries`);
console.log(`   👤 ${sellers.length} seller profiles`);
console.log(`   📡 ${channels.length} channels`);
