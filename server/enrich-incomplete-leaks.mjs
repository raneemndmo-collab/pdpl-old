/**
 * Enrich all 32 incomplete leak incidents with full details
 * - sampleData (realistic fake PII samples)
 * - sourceUrl
 * - screenshotUrls
 * - threatActor
 * - leakPrice
 * - breachMethod / breachMethodAr
 * - sourcePlatform
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ═══════════════════════════════════════════════════════
// ENRICHMENT DATA — Organized by leak category
// ═══════════════════════════════════════════════════════

const enrichmentMap = {
  // ── Paste Student Records (لصق سجلات الطلاب) ──
  "paste_students": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف شخصي" },
      { "الحقل": "الاسم الكامل", "القيمة": "فهد أحمد العتيبي", "النوع": "بيانات شخصية" },
      { "الحقل": "البريد الجامعي", "القيمة": "fahd.a@university.edu.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "المعدل التراكمي", "القيمة": "3.XX", "النوع": "بيانات أكاديمية" },
      { "الحقل": "التخصص", "القيمة": "هندسة حاسب", "النوع": "بيانات أكاديمية" },
      { "الحقل": "رقم الهاتف", "القيمة": "05XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "تاريخ الميلاد", "القيمة": "199X-XX-XX", "النوع": "بيانات شخصية" },
      { "الحقل": "الرقم الجامعي", "القيمة": "44XXXXXXX", "النوع": "معرف مؤسسي" }
    ]),
    sourceUrl: "https://ghostbin.example/paste/ksa_university_students_2024",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_paste_students.png"]),
    threatActor: "Unknown Paste Uploader",
    leakPrice: "مجاني — منشور علنياً",
    breachMethod: "Database dump uploaded to paste site — likely from SQL injection or insider access",
    breachMethodAr: "تفريغ قاعدة بيانات تم رفعه إلى موقع لصق — على الأرجح من حقن SQL أو وصول داخلي",
    sourcePlatform: "Ghostbin"
  },

  // ── Bulk Saudi National ID Sale (بيع جملة لأرقام هوية وطنية سعودية) ──
  "darkweb_national_ids": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "عبدالله محمد الشهري", "النوع": "بيانات شخصية" },
      { "الحقل": "تاريخ الميلاد", "القيمة": "1985-XX-XX", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "المنطقة", "القيمة": "الرياض", "النوع": "بيانات جغرافية" },
      { "الحقل": "الحالة الاجتماعية", "القيمة": "متزوج", "النوع": "بيانات شخصية" },
      { "الحقل": "جهة العمل", "القيمة": "قطاع خاص", "النوع": "بيانات وظيفية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/saudi-national-ids-bulk",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_darkweb_ids.png"]),
    threatActor: "SaudiLeaks_Pro",
    leakPrice: "$8,500 — بيع جملة",
    breachMethod: "Aggregated from multiple government service breaches — compiled and sold as bulk package",
    breachMethodAr: "تجميع من عدة اختراقات لخدمات حكومية — تم تجميعها وبيعها كحزمة جملة",
    sourcePlatform: "BreachForums"
  },

  // ── Utility Customer Data (بيانات عملاء المرافق) ──
  "paste_utility": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الحساب", "القيمة": "XXXXXXXXXX", "النوع": "معرف خدمي" },
      { "الحقل": "الاسم الكامل", "القيمة": "نورة سعد القحطاني", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "العنوان", "القيمة": "الرياض، حي XXXXX، شارع XXXXX", "النوع": "بيانات جغرافية" },
      { "الحقل": "رقم العداد", "القيمة": "MXXXXXXXX", "النوع": "معرف خدمي" },
      { "الحقل": "رقم الهاتف", "القيمة": "05XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "متوسط الاستهلاك", "القيمة": "XXX كيلوواط/شهر", "النوع": "بيانات استهلاك" }
    ]),
    sourceUrl: "https://pastebin.example/raw/ksa_utility_customers",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_paste_utility.png"]),
    threatActor: "DataDumper_KSA",
    leakPrice: "مجاني — منشور علنياً",
    breachMethod: "Customer database exported via compromised admin panel — uploaded to paste site",
    breachMethodAr: "تصدير قاعدة بيانات العملاء عبر لوحة تحكم مخترقة — رُفع إلى موقع لصق",
    sourcePlatform: "Pastebin"
  },

  // ── Employee Credentials Leak (تسريب بيانات اعتماد الموظفين) ──
  "paste_credentials": {
    sampleData: JSON.stringify([
      { "الحقل": "البريد الإلكتروني", "القيمة": "m.ahmed@company.com.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "كلمة المرور", "القيمة": "********** (مشفرة MD5)", "النوع": "بيانات اعتماد" },
      { "الحقل": "الاسم الكامل", "القيمة": "محمد أحمد الغامدي", "النوع": "بيانات شخصية" },
      { "الحقل": "المسمى الوظيفي", "القيمة": "مدير تقنية المعلومات", "النوع": "بيانات وظيفية" },
      { "الحقل": "رقم الهاتف الداخلي", "القيمة": "XXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "آخر تسجيل دخول", "القيمة": "2025-XX-XX XX:XX", "النوع": "بيانات نشاط" }
    ]),
    sourceUrl: "https://privatebin.example/paste/ksa_employee_creds",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_paste_creds.png"]),
    threatActor: "InfoStealer_Bot",
    leakPrice: "مجاني — منشور علنياً",
    breachMethod: "Credentials harvested by RedLine infostealer malware — compiled and posted on paste site",
    breachMethodAr: "بيانات اعتماد تم جمعها بواسطة برمجية سرقة معلومات RedLine — تم تجميعها ونشرها في موقع لصق",
    sourcePlatform: "PrivateBin"
  },

  // ── iHR International HR Database (تسريب قاعدة بيانات شركة iHR) ──
  "LK-2025-R001": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "خالد عبدالرحمن المطيري", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "khalid.m@company.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "المسمى الوظيفي", "القيمة": "مهندس برمجيات أول", "النوع": "بيانات وظيفية" },
      { "الحقل": "الراتب الشهري", "القيمة": "XX,XXX ريال", "النوع": "بيانات مالية" },
      { "الحقل": "تاريخ التعيين", "القيمة": "2021-XX-XX", "النوع": "بيانات وظيفية" },
      { "الحقل": "رقم الآيبان", "القيمة": "SA84XXXXXXXXXXXXXXXXXX", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/ihr-saudi-454k-profiles",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_ihr_darkweb.png"]),
    threatActor: "GhostR",
    leakPrice: "$25,000",
    breachMethod: "API exploitation and unauthorized database access — 454,000 employee profiles extracted",
    breachMethodAr: "استغلال واجهة برمجة التطبيقات والوصول غير المصرح به لقاعدة البيانات — استخراج 454,000 ملف شخصي",
    sourcePlatform: "BreachForums"
  },

  // ── Saudi Caller ID App (تسريب تطبيق دليل السعودي) ──
  "LK-2024-R002": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "سارة محمد الدوسري", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "sara.d@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "الموقع الجغرافي", "القيمة": "جدة، المملكة العربية السعودية", "النوع": "بيانات جغرافية" },
      { "الحقل": "نوع الجهاز", "القيمة": "iPhone 14 Pro", "النوع": "بيانات تقنية" },
      { "الحقل": "تاريخ التسجيل", "القيمة": "2023-XX-XX", "النوع": "بيانات نشاط" },
      { "الحقل": "سجل المكالمات", "القيمة": "XXX مكالمة", "النوع": "بيانات اتصال" }
    ]),
    sourceUrl: "http://exploit.example/thread/saudi-caller-id-585gb",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_callerid_darkweb.png"]),
    threatActor: "DataVault_ME",
    leakPrice: "$45,000",
    breachMethod: "Full database dump — 585GB of user data including call logs, contacts, and location history",
    breachMethodAr: "تفريغ كامل لقاعدة البيانات — 585 جيجابايت من بيانات المستخدمين تشمل سجلات المكالمات وجهات الاتصال وسجل المواقع",
    sourcePlatform: "Exploit.in"
  },

  // ── GlobeMed Healthcare (تسريب بيانات GlobeMed السعودية) ──
  "LK-2021-R003": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "فاطمة علي القحطاني", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم بوليصة التأمين", "القيمة": "POL-XXXXXXX", "النوع": "بيانات تأمينية" },
      { "الحقل": "التشخيص الطبي", "القيمة": "XXXXX (مشفر)", "النوع": "بيانات صحية" },
      { "الحقل": "فصيلة الدم", "القيمة": "X+", "النوع": "بيانات صحية" },
      { "الحقل": "اسم المستشفى", "القيمة": "مستشفى XXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "تاريخ الزيارة", "القيمة": "2021-XX-XX", "النوع": "بيانات صحية" },
      { "الحقل": "المبلغ المطالب به", "القيمة": "X,XXX ريال", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/globemed-saudi-201gb",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_globemed_darkweb.png"]),
    threatActor: "MedLeaks",
    leakPrice: "$35,000",
    breachMethod: "Healthcare system breach — 201GB of patient records including medical history and insurance claims",
    breachMethodAr: "اختراق نظام رعاية صحية — 201 جيجابايت من سجلات المرضى تشمل التاريخ الطبي ومطالبات التأمين",
    sourcePlatform: "BreachForums"
  },

  // ── Riyadh Airport Employee Data ──
  "LK-2024-R004": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الموظف", "القيمة": "EMP-XXXX", "النوع": "معرف مؤسسي" },
      { "الحقل": "الاسم الكامل", "القيمة": "عبدالعزيز سعد الحربي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "a.alharbi@airport.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "القسم", "القيمة": "العمليات الأرضية", "النوع": "بيانات وظيفية" },
      { "الحقل": "مستوى التصريح الأمني", "القيمة": "المستوى X", "النوع": "بيانات أمنية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/riyadh-airport-864-records",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_airport_darkweb.png"]),
    threatActor: "AirportInsider_SA",
    leakPrice: "$3,500",
    breachMethod: "Internal database export — likely insider threat with admin access to HR system",
    breachMethodAr: "تصدير قاعدة بيانات داخلية — على الأرجح تهديد داخلي بوصول إداري لنظام الموارد البشرية",
    sourcePlatform: "BreachForums"
  },

  // ── Government Health Entity Patient Records ──
  "LK-2024-R005": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "هند عبدالله العنزي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الملف الطبي", "القيمة": "MRN-XXXXXXX", "النوع": "معرف صحي" },
      { "الحقل": "التشخيص", "القيمة": "XXXXX (مشفر ICD-10)", "النوع": "بيانات صحية" },
      { "الحقل": "الأدوية الموصوفة", "القيمة": "XXXXX mg", "النوع": "بيانات صحية" },
      { "الحقل": "اسم الطبيب المعالج", "القيمة": "د. XXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "تاريخ آخر زيارة", "القيمة": "2024-XX-XX", "النوع": "بيانات صحية" }
    ]),
    sourceUrl: "http://exploit.example/thread/saudi-gov-health-patient-data",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_health_gov_darkweb.png"]),
    threatActor: "HealthData_Broker",
    leakPrice: "$18,000",
    breachMethod: "Exploitation of unpatched healthcare information system — patient records extracted via SQL injection",
    breachMethodAr: "استغلال نظام معلومات صحي غير محدث — استخراج سجلات المرضى عبر حقن SQL",
    sourcePlatform: "Exploit.in"
  },

  // ── Saudi Pharmaceutical Health Platform (7M records) ──
  "LK-2024-R006": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "أحمد خالد الزهراني", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "ahmed.z@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "الوصفة الطبية", "القيمة": "Rx-XXXXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "اسم الصيدلية", "القيمة": "صيدلية XXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "تاريخ الصرف", "القيمة": "2024-XX-XX", "النوع": "بيانات صحية" },
      { "الحقل": "المبلغ المدفوع", "القيمة": "XXX ريال", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/saudi-pharma-7m-records",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_pharma_darkweb.png"]),
    threatActor: "PharmaSeller",
    leakPrice: "$15,000",
    breachMethod: "Full SQL database dump from pharmaceutical platform — 7 million user records with prescription data",
    breachMethodAr: "تفريغ كامل لقاعدة بيانات SQL من منصة صيدلانية — 7 ملايين سجل مستخدم مع بيانات الوصفات الطبية",
    sourcePlatform: "BreachForums"
  },

  // ── Saudi Recruitment Platform (150K applicants) ──
  "LK-2025-R007": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "ريم سلطان العمري", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "رقم جواز السفر", "القيمة": "EXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "reem.s@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "السيرة الذاتية", "القيمة": "ملف PDF مرفق", "النوع": "بيانات شخصية" },
      { "الحقل": "المؤهل العلمي", "القيمة": "بكالوريوس XXXXX", "النوع": "بيانات أكاديمية" },
      { "الحقل": "سنوات الخبرة", "القيمة": "X سنوات", "النوع": "بيانات وظيفية" }
    ]),
    sourceUrl: "https://t.me/example_channel/saudi_recruitment_leak",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_recruitment_telegram.png"]),
    threatActor: "KSA_DataBroker",
    leakPrice: "$8,000",
    breachMethod: "Recruitment platform database breach — 150,000 job applicant records with CVs and personal documents",
    breachMethodAr: "اختراق قاعدة بيانات منصة توظيف — 150,000 سجل متقدم للوظائف مع السير الذاتية والوثائق الشخصية",
    sourcePlatform: "Telegram"
  },

  // ── Middle East Delivery Platform (1,845 records) ──
  "LK-2025-R008": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "محمد عبدالرحمن السبيعي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "m.alsubaie@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "العنوان", "القيمة": "الرياض، حي XXXXX", "النوع": "بيانات جغرافية" },
      { "الحقل": "سجل الطلبات", "القيمة": "XXX طلب", "النوع": "بيانات نشاط" },
      { "الحقل": "بيانات الدفع", "القيمة": "بطاقة **** XXXX", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://xss.example/thread/delivery-platform-saudi-1845",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_delivery_darkweb.png"]),
    threatActor: "DeliveryLeaker",
    leakPrice: "$1,200",
    breachMethod: "API vulnerability exploitation — user data extracted through insecure endpoints",
    breachMethodAr: "استغلال ثغرة في واجهة برمجة التطبيقات — استخراج بيانات المستخدمين عبر نقاط نهاية غير آمنة",
    sourcePlatform: "XSS.is"
  },

  // ── Saudi Games Visitors & Athletes (passports + IBAN) ──
  "LK-2025-R009": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "أحمد بن عبدالله العلي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم جواز السفر", "القيمة": "EXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "رقم الآيبان", "القيمة": "SA84XXXXXXXXXXXXXXXXXX", "النوع": "بيانات مالية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "ahmad.ali@example.com", "النوع": "بيانات اتصال" },
      { "الحقل": "نوع التذكرة", "القيمة": "VIP — XXXXX ريال", "النوع": "بيانات مالية" },
      { "الحقل": "رياضة المشاركة", "القيمة": "XXXXX", "النوع": "بيانات نشاط" }
    ]),
    sourceUrl: "https://t.me/example_channel/saudi_games_data",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_games_telegram.png"]),
    threatActor: "SportLeaks_KSA",
    leakPrice: "$12,000",
    breachMethod: "Event management system breach — visitor and athlete data including passports and financial information",
    breachMethodAr: "اختراق نظام إدارة الفعاليات — بيانات الزوار والرياضيين تشمل جوازات السفر والمعلومات المالية",
    sourcePlatform: "Telegram"
  },

  // ── Saudi E-Commerce Admin Access (66K customers) ──
  "LK-2025-R010": {
    sampleData: JSON.stringify([
      { "الحقل": "البريد الإلكتروني", "القيمة": "customer@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "الاسم الكامل", "القيمة": "لمى فيصل الراشد", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "عنوان الشحن", "القيمة": "جدة، حي XXXXX", "النوع": "بيانات جغرافية" },
      { "الحقل": "سجل المشتريات", "القيمة": "XX طلب — X,XXX ريال", "النوع": "بيانات مالية" },
      { "الحقل": "بيانات البطاقة", "القيمة": "**** **** **** XXXX", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://xss.example/thread/saudi-ecommerce-admin-access",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_ecommerce_darkweb.png"]),
    threatActor: "ShopBreaker",
    leakPrice: "$600",
    breachMethod: "Admin panel access sold — full control over e-commerce platform with 66,000+ customer records",
    breachMethodAr: "بيع وصول لوحة التحكم — سيطرة كاملة على منصة تجارة إلكترونية مع أكثر من 66,000 سجل عميل",
    sourcePlatform: "XSS.is"
  },

  // ── King Saud University (800+ records) ──
  "LK-2024-R011": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "عبدالرحمن سعود الشمري", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "البريد الجامعي", "القيمة": "a.alshammari@ksu.edu.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "الرقم الجامعي", "القيمة": "44XXXXXXX", "النوع": "معرف مؤسسي" },
      { "الحقل": "الكلية", "القيمة": "كلية XXXXX", "النوع": "بيانات أكاديمية" },
      { "الحقل": "المعدل التراكمي", "القيمة": "X.XX", "النوع": "بيانات أكاديمية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/ksu-employee-student-800",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_ksu_darkweb.png"]),
    threatActor: "EduLeaks_SA",
    leakPrice: "$2,500",
    breachMethod: "University system breach — employee and student records extracted from academic information system",
    breachMethodAr: "اختراق نظام جامعي — استخراج سجلات الموظفين والطلاب من نظام المعلومات الأكاديمي",
    sourcePlatform: "BreachForums"
  },

  // ── Virgin Mobile Saudi ──
  "LK-2020-R012": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "الاسم الكامل", "القيمة": "تركي ناصر القرني", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "نوع الباقة", "القيمة": "باقة XXXXX — XXX ريال/شهر", "النوع": "بيانات خدمية" },
      { "الحقل": "تاريخ الاشتراك", "القيمة": "2019-XX-XX", "النوع": "بيانات نشاط" },
      { "الحقل": "استهلاك البيانات", "القيمة": "XX جيجابايت/شهر", "النوع": "بيانات نشاط" }
    ]),
    sourceUrl: "http://raidforums.example/thread/virgin-mobile-saudi",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_virgin_darkweb.png"]),
    threatActor: "TelecomLeaker",
    leakPrice: "$7,500",
    breachMethod: "Telecom system breach — employee and customer data including subscriber details and usage patterns",
    breachMethodAr: "اختراق نظام اتصالات — بيانات الموظفين والعملاء تشمل تفاصيل المشتركين وأنماط الاستخدام",
    sourcePlatform: "RaidForums Archive"
  },

  // ── Al Hilal Saudi Club ──
  "LK-2025-R013": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "بندر عبدالله الشهراني", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم العضوية", "القيمة": "HFC-XXXXXXX", "النوع": "معرف مؤسسي" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "bandar.s@email.com", "النوع": "بيانات اتصال" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "نوع العضوية", "القيمة": "ذهبية — X,XXX ريال/سنة", "النوع": "بيانات مالية" },
      { "الحقل": "بيانات الدفع", "القيمة": "**** XXXX", "النوع": "بيانات مالية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/alhilal-club-sensitive-data",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_hilal_darkweb.png"]),
    threatActor: "SportHacker_ME",
    leakPrice: "$4,000",
    breachMethod: "Club management system breach — member data and internal documents exposed",
    breachMethodAr: "اختراق نظام إدارة النادي — كشف بيانات الأعضاء والوثائق الداخلية",
    sourcePlatform: "BreachForums"
  },

  // ── Nafees Healthcare Platform ──
  "LK-2026-R014": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "منال خالد الحارثي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "الحالة الصحية", "القيمة": "XXXXX (مشفر)", "النوع": "بيانات صحية" },
      { "الحقل": "الوصفة الطبية", "القيمة": "Rx-XXXXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "اسم المستشفى", "القيمة": "مستشفى XXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "رقم التأمين", "القيمة": "INS-XXXXXXX", "النوع": "بيانات تأمينية" }
    ]),
    sourceUrl: "http://breachforums.example/thread/nafees-healthcare-saudi",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_nafees_darkweb.png"]),
    threatActor: "HealthVault_SA",
    leakPrice: "$20,000",
    breachMethod: "Healthcare platform database breach — patient records with medical history and prescriptions",
    breachMethodAr: "اختراق قاعدة بيانات منصة رعاية صحية — سجلات المرضى مع التاريخ الطبي والوصفات",
    sourcePlatform: "BreachForums"
  },

  // ── Tatweer Buildings Internal Documents ──
  "LK-2025-R015": {
    sampleData: JSON.stringify([
      { "الحقل": "اسم الموظف", "القيمة": "يوسف إبراهيم النعيمي", "النوع": "بيانات شخصية" },
      { "الحقل": "المسمى الوظيفي", "القيمة": "مدير مشروع", "النوع": "بيانات وظيفية" },
      { "الحقل": "البريد الإلكتروني", "القيمة": "y.alnaimi@tatweer.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "اسم المشروع", "القيمة": "مشروع XXXXX", "النوع": "بيانات مؤسسية" },
      { "الحقل": "قيمة العقد", "القيمة": "X,XXX,XXX ريال", "النوع": "بيانات مالية" },
      { "الحقل": "حالة المشروع", "القيمة": "قيد التنفيذ", "النوع": "بيانات مؤسسية" }
    ]),
    sourceUrl: "http://exploit.example/thread/tatweer-buildings-internal",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_tatweer_darkweb.png"]),
    threatActor: "ConstructionLeaks",
    leakPrice: "$4,000",
    breachMethod: "Internal document leak — employee data and project details exposed via compromised file server",
    breachMethodAr: "تسريب وثائق داخلية — كشف بيانات الموظفين وتفاصيل المشاريع عبر خادم ملفات مخترق",
    sourcePlatform: "Exploit.in"
  },

  // ── Health Sector Patient Records (Telegram) ──
  "telecom_health_patients": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "الاسم الكامل", "القيمة": "عائشة محمد البقمي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الملف الطبي", "القيمة": "MRN-XXXXXXX", "النوع": "معرف صحي" },
      { "الحقل": "التشخيص", "القيمة": "XXXXX", "النوع": "بيانات صحية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "فصيلة الدم", "القيمة": "X+", "النوع": "بيانات صحية" }
    ]),
    sourceUrl: "https://t.me/example_channel/health_sector_patients",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_health_telegram.png"]),
    threatActor: "HealthData_TG",
    leakPrice: "$5,000",
    breachMethod: "Hospital database breach — patient records shared on Telegram channel",
    breachMethodAr: "اختراق قاعدة بيانات مستشفى — مشاركة سجلات المرضى في قناة تليجرام",
    sourcePlatform: "Telegram"
  },

  // ── Telecom Subscriber Data (Telegram) ──
  "telecom_subscribers": {
    sampleData: JSON.stringify([
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "الاسم الكامل", "القيمة": "سلطان فهد المالكي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "نوع الباقة", "القيمة": "باقة XXXXX", "النوع": "بيانات خدمية" },
      { "الحقل": "تاريخ التفعيل", "القيمة": "202X-XX-XX", "النوع": "بيانات نشاط" },
      { "الحقل": "رقم IMEI", "القيمة": "XXXXXXXXXXXXXXX", "النوع": "بيانات تقنية" }
    ]),
    sourceUrl: "https://t.me/example_channel/telecom_subscribers_data",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_telecom_telegram.png"]),
    threatActor: "TelecomDumper_SA",
    leakPrice: "$6,000",
    breachMethod: "Telecom subscriber database breach — customer records shared on Telegram",
    breachMethodAr: "اختراق قاعدة بيانات مشتركي اتصالات — مشاركة سجلات العملاء في تليجرام",
    sourcePlatform: "Telegram"
  },

  // ── Government Employee Directory (Telegram) ──
  "gov_employee_directory": {
    sampleData: JSON.stringify([
      { "الحقل": "الاسم الكامل", "القيمة": "ماجد عبدالعزيز الرشيدي", "النوع": "بيانات شخصية" },
      { "الحقل": "رقم الهوية الوطنية", "القيمة": "1XXXXXXXXX", "النوع": "معرف وطني" },
      { "الحقل": "البريد الحكومي", "القيمة": "m.alrashidi@ministry.gov.sa", "النوع": "بيانات اتصال" },
      { "الحقل": "المسمى الوظيفي", "القيمة": "مدير إدارة XXXXX", "النوع": "بيانات وظيفية" },
      { "الحقل": "اسم الوزارة", "القيمة": "وزارة XXXXX", "النوع": "بيانات حكومية" },
      { "الحقل": "رقم الهاتف", "القيمة": "+9665XXXXXXXX", "النوع": "بيانات اتصال" },
      { "الحقل": "الدرجة الوظيفية", "القيمة": "المرتبة XX", "النوع": "بيانات وظيفية" }
    ]),
    sourceUrl: "https://t.me/example_channel/gov_employee_directory",
    screenshotUrls: JSON.stringify(["https://files.manuscdn.com/user_upload_by_module/session_file/310519663296955420/leak_gov_telegram.png"]),
    threatActor: "GovLeaks_SA",
    leakPrice: "$15,000",
    breachMethod: "Government HR system breach — multi-ministry employee directory shared on Telegram",
    breachMethodAr: "اختراق نظام موارد بشرية حكومي — مشاركة دليل موظفين من عدة وزارات في تليجرام",
    sourcePlatform: "Telegram"
  }
};

// ═══════════════════════════════════════════════════════
// APPLY ENRICHMENT
// ═══════════════════════════════════════════════════════

console.log("🔄 Starting enrichment of incomplete leak incidents...\n");

// Get all leaks missing sampleData
const [incompleteLeaks] = await conn.execute(
  `SELECT id, leakId, titleAr, source FROM leaks WHERE sampleData IS NULL ORDER BY id`
);

console.log(`Found ${incompleteLeaks.length} incomplete leaks to enrich.\n`);

let enriched = 0;
let skipped = 0;

for (const leak of incompleteLeaks) {
  let data = null;

  // Match by leakId first (for R-series leaks)
  if (enrichmentMap[leak.leakId]) {
    data = enrichmentMap[leak.leakId];
  }
  // Match by title pattern
  else if (leak.titleAr.includes("سجلات الطلاب")) {
    data = enrichmentMap["paste_students"];
  }
  else if (leak.titleAr.includes("أرقام هوية وطنية")) {
    data = enrichmentMap["darkweb_national_ids"];
  }
  else if (leak.titleAr.includes("عملاء المرافق")) {
    data = enrichmentMap["paste_utility"];
  }
  else if (leak.titleAr.includes("بيانات اعتماد الموظفين")) {
    data = enrichmentMap["paste_credentials"];
  }
  else if (leak.titleAr.includes("سجلات مرضى")) {
    data = enrichmentMap["telecom_health_patients"];
  }
  else if (leak.titleAr.includes("مشتركي الاتصالات")) {
    data = enrichmentMap["telecom_subscribers"];
  }
  else if (leak.titleAr.includes("موظفي القطاع الحكومي") || leak.titleAr.includes("دليل موظفي")) {
    data = enrichmentMap["gov_employee_directory"];
  }

  if (data) {
    await conn.execute(
      `UPDATE leaks SET 
        sampleData = ?,
        sourceUrl = ?,
        screenshotUrls = ?,
        threatActor = ?,
        leakPrice = ?,
        breachMethod = ?,
        breachMethodAr = ?,
        sourcePlatform = ?
      WHERE id = ?`,
      [
        data.sampleData,
        data.sourceUrl,
        data.screenshotUrls,
        data.threatActor,
        data.leakPrice,
        data.breachMethod,
        data.breachMethodAr,
        data.sourcePlatform,
        leak.id
      ]
    );
    enriched++;
    console.log(`  ✅ Enriched: ${leak.leakId} — ${leak.titleAr}`);
  } else {
    skipped++;
    console.log(`  ⚠️ No match found: ${leak.leakId} — ${leak.titleAr} (source: ${leak.source})`);
  }
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`✅ Enrichment complete: ${enriched} enriched, ${skipped} skipped`);
console.log(`═══════════════════════════════════════════════════════`);

// Verify completeness
const [remaining] = await conn.execute(
  `SELECT COUNT(*) as count FROM leaks WHERE sampleData IS NULL`
);
console.log(`\nRemaining incomplete leaks: ${remaining[0].count}`);

await conn.end();
