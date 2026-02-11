import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const CDN_BASE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420";

// CDN URLs for screenshots
const SCREENSHOTS = {
  darkweb_mofa: `${CDN_BASE}/FjGhsGbEQUSQatiG.png`,
  darkweb_pharma: `${CDN_BASE}/YLtXlhtgYgzVfmOz.png`,
  darkweb_aramco: `${CDN_BASE}/rhkfrpsVPizRYztw.png`,
  darkweb_banking: `${CDN_BASE}/KPxDowyzumVitIRT.png`,
  darkweb_telecom: `${CDN_BASE}/ROSwryvCWZnNIVrX.png`,
  darkweb_ecommerce: `${CDN_BASE}/FDTzVZnlAXdAWUft.png`,
  darkweb_insurance: `${CDN_BASE}/oyLwVfXHLuQoOHrw.png`,
  telegram_gov: `${CDN_BASE}/bqijSEdZJJbgeXjV.png`,
  telegram_edu: `${CDN_BASE}/pDqHBHkCSIvwfiTW.png`,
  telegram_health: `${CDN_BASE}/CGMkucXUWNJfaGfI.png`,
  telegram_realestate: `${CDN_BASE}/cZZqPOSZkDpKMihP.png`,
  paste_credentials: `${CDN_BASE}/HEpxkhGeRGaneOnI.png`,
  paste_national_ids: `${CDN_BASE}/CkMqQLaNEaOlaLdE.png`,
  paste_ecommerce: `${CDN_BASE}/LkypBkgYpogxtiKG.png`,
};

// Saudi first names
const MALE_NAMES = ["عبدالله", "محمد", "أحمد", "خالد", "سعد", "فهد", "سلطان", "عمر", "بندر", "تركي", "ناصر", "فيصل", "سلمان", "عبدالرحمن", "ماجد", "يوسف", "حمد", "عادل", "مشعل", "نايف"];
const FEMALE_NAMES = ["نورة", "سارة", "فاطمة", "هند", "ريم", "منال", "غادة", "لمياء", "عائشة", "رنا", "لينا", "مريم", "هيا", "نوف", "دانة", "العنود", "جواهر", "أمل", "وفاء", "ابتسام"];
const FAMILY_NAMES = ["الشهري", "العتيبي", "الحربي", "القحطاني", "الدوسري", "الغامدي", "المالكي", "الزهراني", "السبيعي", "الرشيدي", "العنزي", "المطيري", "السهلي", "الحارثي", "الشمري", "القرني", "العمري", "البلوي", "الجهني", "الثبيتي"];
const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الطائف", "تبوك", "أبها", "بريدة", "حائل", "الخبر", "نجران", "جازان", "ينبع", "الجبيل"];
const DISTRICTS = ["حي النرجس", "حي الياسمين", "حي العليا", "حي السلامة", "حي الحمراء", "حي الروضة", "حي المروج", "حي الملقا", "حي الصحافة", "حي العزيزية", "حي الشفا", "حي النسيم"];
const BANKS = ["الراجحي", "الأهلي", "سامبا", "الإنماء", "الرياض", "البلاد", "الجزيرة", "العربي"];
const TELECOM = ["STC", "Mobily", "Zain"];
const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const DIAGNOSES = ["سكري نوع 2", "ضغط مرتفع", "حساسية موسمية", "التهاب مفاصل", "أزمة ربو", "قصور الغدة الدرقية", "فقر دم", "صداع نصفي مزمن", "كسر في اليد", "التهاب رئوي"];
const MEDICATIONS = ["Metformin 500mg", "Amlodipine 5mg", "Cetirizine 10mg", "Ibuprofen 400mg", "Omeprazole 20mg", "Paracetamol 500mg", "Amoxicillin 500mg", "Atorvastatin 20mg"];
const INSURANCE = ["BUPA", "Tawuniya", "Medgulf", "AXA", "Malath", "ACIG", "Walaa", "Al Rajhi Takaful"];
const UNIVERSITIES = ["جامعة الملك سعود", "جامعة الملك فهد للبترول والمعادن", "جامعة الملك عبدالعزيز", "جامعة الإمام محمد بن سعود", "جامعة أم القرى", "جامعة الملك خالد"];
const MAJORS = ["هندسة حاسب", "طب بشري", "إدارة أعمال", "صيدلة", "هندسة كهربائية", "محاسبة", "قانون", "علوم حاسب", "هندسة مدنية", "تمريض"];
const JOB_TITLES = ["مستشار", "محلل", "مدير إدارة", "مهندس", "محاسب", "مبرمج", "مدير مشروع", "أخصائي", "مشرف", "سكرتير"];
const GOVT_ENTITIES = ["وزارة الخارجية", "وزارة الداخلية", "وزارة الصحة", "وزارة التعليم", "وزارة المالية", "وزارة العدل", "وزارة الموارد البشرية", "هيئة الاتصالات", "هيئة الزكاة والضريبة"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone() { return `05${randInt(10000000, 99999999)}`; }
function randId() { return `10${randInt(10000000, 99999999)}`; }
function randCard() { return `${rand(["4","5"])}XXX-XXXX-XXXX-${randInt(1000, 9999)}`; }
function randEmail(name) { return `${name.split(" ")[0].charAt(0).toLowerCase()}.${name.split(" ").pop().substring(0,3).toLowerCase()}***@${rand(["gmail.com","hotmail.com","yahoo.com","outlook.com"])}`; }
function randGovEmail(name) { return `${name.split(" ")[0].charAt(0).toLowerCase()}.${name.split(" ").pop().substring(0,2).toLowerCase()}***@${rand(["mofa.gov.sa","moi.gov.sa","moh.gov.sa","moe.gov.sa","mof.gov.sa"])}` }
function randName() { return `${rand(Math.random() > 0.5 ? MALE_NAMES : FEMALE_NAMES)} ${rand(MALE_NAMES)} ${rand(FAMILY_NAMES)}`; }

// Sample data generators per category
function generateGovSamples() {
  return Array.from({length: 8}, () => {
    const name = randName();
    return {
      "الاسم الكامل": name,
      "رقم الهوية": randId(),
      "رقم الجوال": randPhone(),
      "البريد الوظيفي": randGovEmail(name),
      "المسمى الوظيفي": rand(JOB_TITLES),
      "الجهة": rand(GOVT_ENTITIES),
      "الراتب": `${randInt(10, 45)},${randInt(100,999)} SAR`
    };
  });
}

function generateHealthSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "رقم الهوية": randId(),
    "الجوال": randPhone(),
    "المدينة": rand(CITIES),
    "فصيلة الدم": rand(BLOOD_TYPES),
    "التشخيص": rand(DIAGNOSES),
    "الأدوية": rand(MEDICATIONS),
    "التأمين": `${rand(INSURANCE)}-XXXX${randInt(100,999)}`
  }));
}

function generateBankingSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "رقم الهوية": randId(),
    "رقم البطاقة": randCard(),
    "الرصيد": `${randInt(5, 250)},${randInt(100,999)} SAR`,
    "البنك": rand(BANKS),
    "الجوال": randPhone()
  }));
}

function generateTelecomSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "رقم الهوية": randId(),
    "رقم الجوال": randPhone(),
    "IMEI": `35${randInt(1000000000, 9999999999)}`,
    "الباقة": rand(["مفوتر 300", "مفوتر 500", "مسبقة الدفع", "بيانات 100GB", "عائلية", "أعمال"]),
    "المشغل": rand(TELECOM)
  }));
}

function generateEduSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "الرقم الجامعي": `${randInt(43,45)}${randInt(10000,99999)}`,
    "التخصص": rand(MAJORS),
    "المعدل": (Math.random() * 2 + 3).toFixed(2),
    "الجوال": randPhone(),
    "الجامعة": rand(UNIVERSITIES)
  }));
}

function generateEcommerceSamples() {
  return Array.from({length: 8}, () => {
    const name = randName();
    return {
      "الاسم": name,
      "البريد": randEmail(name),
      "الجوال": randPhone(),
      "العنوان": `${rand(CITIES)} - ${rand(DISTRICTS)}`,
      "البطاقة": randCard(),
      "آخر طلب": `${randInt(1,28)}/${randInt(1,12)}/2024`
    };
  });
}

function generateInsuranceSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "رقم الهوية": randId(),
    "رقم البوليصة": `INS-${randInt(1000,9999)}-${randInt(1000,9999)}`,
    "نوع التغطية": rand(["شامل عائلي", "فردي VIP", "تأمين سيارات", "تأمين سفر", "تأمين طبي"]),
    "المطالبات": `${randInt(0,8)} مطالبات`,
    "القسط السنوي": `${randInt(2, 15)},${randInt(100,999)} SAR`
  }));
}

function generateCredentialSamples() {
  return Array.from({length: 8}, () => {
    const name = randName();
    return {
      "البريد": randEmail(name),
      "كلمة المرور": `${rand(["P@ss","Qwerty","Admin","Saudi","Riyadh","Jeddah"])}${randInt(100,999)}!`,
      "الاسم": name,
      "الجوال": randPhone()
    };
  });
}

function generateContractorSamples() {
  return Array.from({length: 8}, () => ({
    "اسم الموظف": randName(),
    "رقم الهوية": randId(),
    "الشركة المقاولة": rand(["شركة المباني", "مجموعة بن لادن", "شركة سعودي أوجيه", "شركة الراشد", "مجموعة الزامل"]),
    "المسمى": rand(["مهندس ميداني", "فني صيانة", "مشرف مشروع", "محاسب", "سائق"]),
    "الراتب": `${randInt(5, 25)},${randInt(100,999)} SAR`,
    "رقم العقد": `CON-${randInt(10000,99999)}`
  }));
}

function generateRealEstateSamples() {
  return Array.from({length: 8}, () => ({
    "الاسم": randName(),
    "رقم الهوية": randId(),
    "الجوال": randPhone(),
    "نوع العقار": rand(["فيلا", "شقة", "أرض", "دوبلكس", "عمارة سكنية"]),
    "المدينة": rand(CITIES),
    "القيمة": `${randInt(300, 5000)},000 SAR`,
    "حالة القرض": rand(["نشط", "مسدد", "متعثر", "قيد المراجعة"])
  }));
}

function generateNationalIdSamples() {
  return Array.from({length: 8}, () => ({
    "رقم الهوية": randId(),
    "الاسم الكامل": randName(),
    "رقم الجوال": randPhone(),
    "المدينة": rand(CITIES),
    "تاريخ الميلاد": `${randInt(1,28)}/${randInt(1,12)}/${randInt(1970,2000)}`
  }));
}

// Breach methods
const BREACH_METHODS = [
  { en: "SQL Injection", ar: "حقن SQL" },
  { en: "Phishing Attack", ar: "هجوم تصيد إلكتروني" },
  { en: "Insider Threat", ar: "تهديد داخلي" },
  { en: "API Vulnerability", ar: "ثغرة في واجهة برمجة التطبيقات" },
  { en: "Ransomware Attack", ar: "هجوم فدية" },
  { en: "Third-party Contractor Breach", ar: "اختراق عبر مقاول طرف ثالث" },
  { en: "Misconfigured Cloud Storage", ar: "تخزين سحابي غير مؤمن" },
  { en: "Zero-day Exploit", ar: "استغلال ثغرة يوم الصفر" },
  { en: "Brute Force Attack", ar: "هجوم القوة الغاشمة" },
  { en: "Social Engineering", ar: "هندسة اجتماعية" },
  { en: "Credential Stuffing", ar: "حشو بيانات الاعتماد" },
  { en: "Supply Chain Attack", ar: "هجوم سلسلة التوريد" },
  { en: "Unpatched Server Vulnerability", ar: "ثغرة خادم غير محدث" },
  { en: "DNS Hijacking", ar: "اختطاف DNS" },
  { en: "Man-in-the-Middle Attack", ar: "هجوم الوسيط" },
];

// Source platforms
const SOURCE_PLATFORMS = [
  { name: "BreachForums", url: "https://breachforums.st/Thread-" },
  { name: "XSS.is", url: "https://xss.is/threads/" },
  { name: "Exploit.in", url: "https://exploit.in/topic/" },
  { name: "RaidForums Archive", url: "https://raidforums.com/Thread-" },
  { name: "Telegram Channel", url: "https://t.me/" },
  { name: "Pastebin", url: "https://pastebin.com/" },
  { name: "Dark Web Marketplace", url: "http://darkmarket" },
  { name: "Dread Forum", url: "http://dread/" },
];

// Threat actors
const THREAT_ACTORS = [
  "zelda", "DataMerchant_SA", "ZeroX", "CreditKing_ME", "TelecomLeaker",
  "ShopHacker_SA", "InsureLeaks", "GhostData", "SandStorm_APT", "DarkFalcon",
  "CyberPhantom", "DataBroker_Gulf", "NightOwl_Hack", "DesertViper", "SilentBreach",
  "InfoTrader_ME", "BlackHat_SA", "CryptoLeaker", "NetShadow", "ByteThief"
];

// Prices
const PRICES = [
  "$500", "$1,000", "$2,500", "$5,000", "$8,000", "$10,000", "$12,000",
  "$15,000", "$20,000", "$25,000", "$50,000", "Free (sample)", "$3,500",
  "$7,500", "0.5 BTC", "1 BTC", "2 BTC", "5 BTC", "$100,000", "Negotiable"
];

// Category-specific data mapping
const CATEGORY_CONFIG = {
  government: {
    sampleFn: generateGovSamples,
    screenshots: [SCREENSHOTS.darkweb_mofa, SCREENSHOTS.telegram_gov],
    platforms: ["BreachForums", "XSS.is", "Telegram Channel"],
    breachMethods: [0, 2, 3, 6, 11], // indices into BREACH_METHODS
  },
  healthcare: {
    sampleFn: generateHealthSamples,
    screenshots: [SCREENSHOTS.darkweb_pharma, SCREENSHOTS.telegram_health],
    platforms: ["BreachForums", "Exploit.in", "Dark Web Marketplace"],
    breachMethods: [0, 3, 6, 12],
  },
  financial: {
    sampleFn: generateBankingSamples,
    screenshots: [SCREENSHOTS.darkweb_banking, SCREENSHOTS.paste_credentials],
    platforms: ["BreachForums", "XSS.is", "Pastebin"],
    breachMethods: [0, 1, 8, 10, 14],
  },
  telecom: {
    sampleFn: generateTelecomSamples,
    screenshots: [SCREENSHOTS.darkweb_telecom, SCREENSHOTS.telegram_gov],
    platforms: ["BreachForums", "Telegram Channel", "Exploit.in"],
    breachMethods: [2, 3, 9, 11],
  },
  education: {
    sampleFn: generateEduSamples,
    screenshots: [SCREENSHOTS.telegram_edu, SCREENSHOTS.paste_national_ids],
    platforms: ["Telegram Channel", "Pastebin", "BreachForums"],
    breachMethods: [0, 6, 8, 12],
  },
  ecommerce: {
    sampleFn: generateEcommerceSamples,
    screenshots: [SCREENSHOTS.darkweb_ecommerce, SCREENSHOTS.paste_ecommerce],
    platforms: ["BreachForums", "Pastebin", "Dark Web Marketplace"],
    breachMethods: [0, 1, 3, 10],
  },
  insurance: {
    sampleFn: generateInsuranceSamples,
    screenshots: [SCREENSHOTS.darkweb_insurance, SCREENSHOTS.telegram_realestate],
    platforms: ["BreachForums", "XSS.is", "Dread Forum"],
    breachMethods: [0, 2, 3, 6],
  },
  energy: {
    sampleFn: generateContractorSamples,
    screenshots: [SCREENSHOTS.darkweb_aramco, SCREENSHOTS.paste_national_ids],
    platforms: ["BreachForums", "XSS.is", "Dark Web Marketplace"],
    breachMethods: [5, 7, 11, 12],
  },
  realestate: {
    sampleFn: generateRealEstateSamples,
    screenshots: [SCREENSHOTS.telegram_realestate, SCREENSHOTS.paste_ecommerce],
    platforms: ["Telegram Channel", "Pastebin", "BreachForums"],
    breachMethods: [0, 2, 6, 9],
  },
  credentials: {
    sampleFn: generateCredentialSamples,
    screenshots: [SCREENSHOTS.paste_credentials, SCREENSHOTS.paste_national_ids],
    platforms: ["Pastebin", "Telegram Channel", "BreachForums"],
    breachMethods: [1, 8, 10, 14],
  },
  national_id: {
    sampleFn: generateNationalIdSamples,
    screenshots: [SCREENSHOTS.paste_national_ids, SCREENSHOTS.telegram_gov],
    platforms: ["Pastebin", "Telegram Channel", "BreachForums"],
    breachMethods: [0, 2, 6, 9],
  },
};

// Map leak categories to config
function getCategoryForLeak(leak) {
  const title = (leak.title || "").toLowerCase();
  const desc = (leak.description || "").toLowerCase();
  const sector = (leak.sector || "").toLowerCase();
  
  if (sector.includes("government") || title.includes("ministry") || title.includes("government") || title.includes("وزارة")) return "government";
  if (sector.includes("healthcare") || title.includes("health") || title.includes("patient") || title.includes("hospital") || title.includes("pharma")) return "healthcare";
  if (sector.includes("financial") || sector.includes("banking") || title.includes("bank") || title.includes("credit") || title.includes("financial")) return "financial";
  if (sector.includes("telecom") || title.includes("telecom") || title.includes("stc") || title.includes("mobily") || title.includes("zain")) return "telecom";
  if (sector.includes("education") || title.includes("university") || title.includes("student") || title.includes("education")) return "education";
  if (sector.includes("retail") || sector.includes("ecommerce") || title.includes("e-commerce") || title.includes("customer") || title.includes("shop")) return "ecommerce";
  if (sector.includes("insurance") || title.includes("insurance") || title.includes("policyholder")) return "insurance";
  if (sector.includes("energy") || title.includes("aramco") || title.includes("oil") || title.includes("contractor")) return "energy";
  if (title.includes("real estate") || title.includes("property") || title.includes("عقار")) return "realestate";
  if (title.includes("credential") || title.includes("password") || title.includes("login")) return "credentials";
  if (title.includes("national id") || title.includes("identity") || title.includes("هوية")) return "national_id";
  
  // Default based on random
  const cats = Object.keys(CATEGORY_CONFIG);
  return cats[Math.floor(Math.random() * cats.length)];
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all leaks
  const [leaks] = await conn.query('SELECT id, leakId, title, description, sector, sectorAr, recordCount FROM leaks ORDER BY id');
  console.log(`📊 Found ${leaks.length} leaks to enrich`);
  
  let updated = 0;
  
  for (const leak of leaks) {
    const category = getCategoryForLeak(leak);
    const config = CATEGORY_CONFIG[category];
    
    // Generate sample data
    const sampleData = config.sampleFn();
    
    // Pick breach method
    const bmIdx = config.breachMethods[Math.floor(Math.random() * config.breachMethods.length)];
    const breachMethod = BREACH_METHODS[bmIdx];
    
    // Pick source platform
    const platformName = config.platforms[Math.floor(Math.random() * config.platforms.length)];
    const platform = SOURCE_PLATFORMS.find(p => p.name === platformName) || SOURCE_PLATFORMS[0];
    const sourceUrl = platform.url + randInt(10000, 99999);
    
    // Pick screenshots (2-3 per leak)
    const screenshots = [...config.screenshots];
    // Add one more random screenshot
    const allScreenshots = Object.values(SCREENSHOTS);
    screenshots.push(allScreenshots[Math.floor(Math.random() * allScreenshots.length)]);
    const uniqueScreenshots = [...new Set(screenshots)];
    
    // Pick threat actor
    const threatActor = rand(THREAT_ACTORS);
    
    // Pick price
    const price = rand(PRICES);
    
    await conn.query(
      `UPDATE leaks SET 
        sampleData = ?,
        sourceUrl = ?,
        sourcePlatform = ?,
        screenshotUrls = ?,
        threatActor = ?,
        leakPrice = ?,
        breachMethod = ?,
        breachMethodAr = ?
      WHERE id = ?`,
      [
        JSON.stringify(sampleData),
        sourceUrl,
        platformName,
        JSON.stringify(uniqueScreenshots),
        threatActor,
        price,
        breachMethod.en,
        breachMethod.ar,
        leak.id
      ]
    );
    
    updated++;
    if (updated % 20 === 0) {
      console.log(`  ✅ Updated ${updated}/${leaks.length} leaks...`);
    }
  }
  
  console.log(`\n✅ Successfully enriched ${updated} leaks with:`);
  console.log(`  📋 Sample PII data (8 records each)`);
  console.log(`  📸 Screenshot URLs (2-3 per leak)`);
  console.log(`  🔗 Source URLs`);
  console.log(`  🏴‍☠️ Threat actor names`);
  console.log(`  💰 Prices`);
  console.log(`  🔓 Breach methods (EN + AR)`);
  
  // Verify
  const [sample] = await conn.query('SELECT leakId, threatActor, sourcePlatform, breachMethod, breachMethodAr, leakPrice, JSON_LENGTH(sampleData) as sampleCount, JSON_LENGTH(screenshotUrls) as screenshotCount FROM leaks LIMIT 5');
  console.log('\n📋 Sample verification:');
  sample.forEach(s => {
    console.log(`  ${s.leakId}: actor=${s.threatActor}, platform=${s.sourcePlatform}, method=${s.breachMethodAr}, price=${s.leakPrice}, samples=${s.sampleCount}, screenshots=${s.screenshotCount}`);
  });
  
  await conn.end();
}

main().catch(console.error);
