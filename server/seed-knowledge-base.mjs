/**
 * Seed script for Knowledge Base - adds initial PDPL articles, terms, FAQs
 * Run: node server/seed-knowledge-base.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Check existing entries
const [existing] = await conn.execute("SELECT COUNT(*) as cnt FROM knowledge_base");
console.log(`Existing KB entries: ${existing[0].cnt}`);

const entries = [
  // ═══ ARTICLES ═══
  {
    category: "article",
    title: "Overview of Saudi PDPL (Personal Data Protection Law)",
    titleAr: "نظرة عامة على نظام حماية البيانات الشخصية السعودي (PDPL)",
    content: "The Saudi Personal Data Protection Law (PDPL), issued by Royal Decree M/19 dated 9/2/1443H (September 2021), is the Kingdom's comprehensive data protection framework. It regulates the collection, processing, storage, and destruction of personal data. The law applies to all entities processing personal data within Saudi Arabia or processing data of Saudi residents abroad. Key principles include: lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity, and accountability. The PDPL establishes NDMO (National Data Management Office) as the supervisory authority.",
    contentAr: "نظام حماية البيانات الشخصية السعودي (PDPL)، الصادر بالمرسوم الملكي رقم م/19 بتاريخ 9/2/1443هـ (سبتمبر 2021)، هو الإطار الشامل لحماية البيانات في المملكة. ينظم جمع ومعالجة وتخزين وإتلاف البيانات الشخصية. يسري النظام على جميع الجهات التي تعالج البيانات الشخصية داخل المملكة العربية السعودية أو تعالج بيانات المقيمين السعوديين في الخارج. المبادئ الرئيسية تشمل: المشروعية، العدالة، الشفافية، تحديد الغرض، تقليل البيانات، الدقة، تحديد مدة التخزين، النزاهة، والمساءلة. يحدد النظام مكتب إدارة البيانات الوطنية (NDMO) كجهة إشرافية.",
    tags: ["PDPL", "نظام حماية البيانات", "NDMO", "تشريعات"],
  },
  {
    category: "article",
    title: "Data Subject Rights Under PDPL",
    titleAr: "حقوق صاحب البيانات بموجب نظام حماية البيانات الشخصية",
    content: "Under PDPL, data subjects have the following rights: 1) Right to be informed about data processing purposes, 2) Right to access their personal data, 3) Right to request correction of inaccurate data, 4) Right to request destruction of data when no longer needed, 5) Right to withdraw consent at any time, 6) Right to object to automated decision-making, 7) Right to data portability, 8) Right to lodge complaints with NDMO. Controllers must respond to requests within 30 days.",
    contentAr: "بموجب نظام حماية البيانات الشخصية، يتمتع صاحب البيانات بالحقوق التالية: 1) الحق في الإعلام بأغراض معالجة البيانات، 2) الحق في الوصول إلى بياناته الشخصية، 3) الحق في طلب تصحيح البيانات غير الدقيقة، 4) الحق في طلب إتلاف البيانات عند عدم الحاجة إليها، 5) الحق في سحب الموافقة في أي وقت، 6) الحق في الاعتراض على القرارات الآلية، 7) الحق في نقل البيانات، 8) الحق في تقديم شكاوى لمكتب إدارة البيانات الوطنية. يجب على المتحكمين الاستجابة للطلبات خلال 30 يوماً.",
    tags: ["حقوق صاحب البيانات", "PDPL", "موافقة", "شكاوى"],
  },
  {
    category: "article",
    title: "PDPL Penalties and Enforcement",
    titleAr: "عقوبات وتطبيق نظام حماية البيانات الشخصية",
    content: "PDPL violations carry significant penalties: 1) Imprisonment up to 2 years and/or fines up to SAR 3 million for disclosing sensitive data, 2) Fines up to SAR 5 million for repeated violations, 3) Warning notices for minor infractions, 4) Temporary or permanent suspension of data processing activities, 5) Public disclosure of violations. NDMO has the authority to conduct audits, investigate complaints, and impose corrective measures. Organizations must report data breaches within 72 hours.",
    contentAr: "تحمل مخالفات نظام حماية البيانات الشخصية عقوبات كبيرة: 1) السجن حتى سنتين و/أو غرامات تصل إلى 3 ملايين ريال سعودي لإفشاء البيانات الحساسة، 2) غرامات تصل إلى 5 ملايين ريال للمخالفات المتكررة، 3) إنذارات للمخالفات البسيطة، 4) تعليق مؤقت أو دائم لأنشطة معالجة البيانات، 5) الإعلان العام عن المخالفات. يملك مكتب إدارة البيانات الوطنية صلاحية إجراء عمليات التدقيق والتحقيق في الشكاوى وفرض التدابير التصحيحية. يجب على المنظمات الإبلاغ عن خروقات البيانات خلال 72 ساعة.",
    tags: ["عقوبات", "غرامات", "تطبيق", "NDMO", "خروقات"],
  },
  {
    category: "article",
    title: "Cross-Border Data Transfer Rules",
    titleAr: "قواعد نقل البيانات عبر الحدود",
    content: "PDPL regulates cross-border data transfers strictly. Personal data may only be transferred outside Saudi Arabia when: 1) The receiving country provides adequate data protection, 2) Transfer is necessary for contract performance, 3) Transfer serves Saudi public interest, 4) Data subject has given explicit consent, 5) Transfer is necessary for legal proceedings. NDMO maintains a list of countries with adequate protection levels. Organizations must conduct Data Protection Impact Assessments (DPIA) before international transfers.",
    contentAr: "ينظم نظام حماية البيانات الشخصية نقل البيانات عبر الحدود بشكل صارم. لا يجوز نقل البيانات الشخصية خارج المملكة العربية السعودية إلا عندما: 1) توفر الدولة المستقبلة حماية كافية للبيانات، 2) يكون النقل ضرورياً لتنفيذ عقد، 3) يخدم النقل المصلحة العامة السعودية، 4) أعطى صاحب البيانات موافقة صريحة، 5) يكون النقل ضرورياً لإجراءات قانونية. يحتفظ مكتب إدارة البيانات الوطنية بقائمة الدول ذات مستويات الحماية الكافية. يجب على المنظمات إجراء تقييمات أثر حماية البيانات (DPIA) قبل عمليات النقل الدولية.",
    tags: ["نقل عبر الحدود", "DPIA", "موافقة", "حماية كافية"],
  },
  {
    category: "article",
    title: "Sensitive Personal Data Categories",
    titleAr: "فئات البيانات الشخصية الحساسة",
    content: "PDPL defines sensitive personal data as data requiring enhanced protection: 1) Health and medical records, 2) Genetic and biometric data, 3) Financial and credit information, 4) Religious beliefs, 5) Criminal records, 6) Ethnic or tribal origin, 7) Location data revealing movement patterns, 8) Data of minors under 18. Processing sensitive data requires explicit consent and additional safeguards. Organizations must implement enhanced security measures and conduct regular DPIAs for sensitive data processing.",
    contentAr: "يحدد نظام حماية البيانات الشخصية البيانات الشخصية الحساسة كبيانات تتطلب حماية معززة: 1) السجلات الصحية والطبية، 2) البيانات الجينية والبيومترية، 3) المعلومات المالية والائتمانية، 4) المعتقدات الدينية، 5) السجلات الجنائية، 6) الأصل العرقي أو القبلي، 7) بيانات الموقع التي تكشف أنماط الحركة، 8) بيانات القاصرين دون 18 عاماً. تتطلب معالجة البيانات الحساسة موافقة صريحة وضمانات إضافية. يجب على المنظمات تطبيق تدابير أمنية معززة وإجراء تقييمات أثر حماية البيانات بشكل منتظم.",
    tags: ["بيانات حساسة", "صحية", "بيومترية", "مالية", "قاصرين"],
  },

  // ═══ TERMS / GLOSSARY ═══
  {
    category: "glossary",
    title: "Personal Data",
    titleAr: "البيانات الشخصية",
    content: "Any data that can directly or indirectly identify a natural person, including name, ID number, address, phone number, email, photos, financial records, and online identifiers.",
    contentAr: "أي بيانات يمكن أن تحدد هوية شخص طبيعي بشكل مباشر أو غير مباشر، بما في ذلك الاسم، رقم الهوية، العنوان، رقم الهاتف، البريد الإلكتروني، الصور، السجلات المالية، والمعرفات الإلكترونية.",
    tags: ["مصطلح", "تعريف", "PII"],
  },
  {
    category: "glossary",
    title: "Data Controller",
    titleAr: "المتحكم في البيانات",
    content: "The natural or legal person that determines the purposes and means of processing personal data. The controller bears primary responsibility for PDPL compliance.",
    contentAr: "الشخص الطبيعي أو الاعتباري الذي يحدد أغراض ووسائل معالجة البيانات الشخصية. يتحمل المتحكم المسؤولية الأساسية عن الامتثال لنظام حماية البيانات الشخصية.",
    tags: ["مصطلح", "متحكم", "مسؤولية"],
  },
  {
    category: "glossary",
    title: "Data Processor",
    titleAr: "معالج البيانات",
    content: "A natural or legal person that processes personal data on behalf of the data controller. Processors must follow controller instructions and implement appropriate security measures.",
    contentAr: "شخص طبيعي أو اعتباري يعالج البيانات الشخصية نيابة عن المتحكم في البيانات. يجب على المعالجين اتباع تعليمات المتحكم وتطبيق تدابير أمنية مناسبة.",
    tags: ["مصطلح", "معالج", "أمن"],
  },
  {
    category: "glossary",
    title: "Data Breach",
    titleAr: "خرق البيانات",
    content: "An incident where personal data is accessed, disclosed, altered, or destroyed without authorization. Under PDPL, breaches must be reported to NDMO within 72 hours and affected individuals must be notified promptly.",
    contentAr: "حادثة يتم فيها الوصول إلى البيانات الشخصية أو الكشف عنها أو تغييرها أو إتلافها بدون تفويض. بموجب نظام حماية البيانات الشخصية، يجب الإبلاغ عن الخروقات لمكتب إدارة البيانات الوطنية خلال 72 ساعة ويجب إخطار الأفراد المتضررين فوراً.",
    tags: ["مصطلح", "خرق", "إبلاغ", "72 ساعة"],
  },
  {
    category: "glossary",
    title: "Data Protection Impact Assessment (DPIA)",
    titleAr: "تقييم أثر حماية البيانات (DPIA)",
    content: "A systematic process to identify, assess, and mitigate data protection risks before starting new data processing activities. Required for high-risk processing, cross-border transfers, and sensitive data handling.",
    contentAr: "عملية منهجية لتحديد وتقييم وتخفيف مخاطر حماية البيانات قبل بدء أنشطة معالجة بيانات جديدة. مطلوب للمعالجة عالية المخاطر والنقل عبر الحدود ومعالجة البيانات الحساسة.",
    tags: ["مصطلح", "DPIA", "تقييم مخاطر"],
  },
  {
    category: "glossary",
    title: "Consent",
    titleAr: "الموافقة",
    content: "A freely given, specific, informed, and unambiguous indication of the data subject's agreement to the processing of their personal data. Must be explicit for sensitive data processing.",
    contentAr: "إشارة حرة ومحددة ومستنيرة وواضحة من صاحب البيانات بالموافقة على معالجة بياناته الشخصية. يجب أن تكون صريحة لمعالجة البيانات الحساسة.",
    tags: ["مصطلح", "موافقة", "صريحة"],
  },
  {
    category: "glossary",
    title: "Dark Web",
    titleAr: "الويب المظلم (الدارك ويب)",
    content: "A part of the internet that is not indexed by standard search engines and requires special software (like Tor) to access. Often used for illegal activities including selling stolen personal data, credentials, and sensitive documents.",
    contentAr: "جزء من الإنترنت لا تفهرسه محركات البحث القياسية ويتطلب برامج خاصة (مثل Tor) للوصول إليه. يُستخدم غالباً لأنشطة غير قانونية بما في ذلك بيع البيانات الشخصية المسروقة وبيانات الاعتماد والوثائق الحساسة.",
    tags: ["مصطلح", "دارك ويب", "تور", "بيانات مسروقة"],
  },
  {
    category: "glossary",
    title: "Paste Site",
    titleAr: "مواقع اللصق (Paste Sites)",
    content: "Websites like Pastebin that allow anonymous text sharing. Frequently used by threat actors to publish leaked data samples, credential dumps, and breach announcements as proof of data theft.",
    contentAr: "مواقع مثل Pastebin تسمح بمشاركة النصوص بشكل مجهول. يستخدمها المهاجمون بشكل متكرر لنشر عينات من البيانات المسربة وتفريغات بيانات الاعتماد وإعلانات الخروقات كدليل على سرقة البيانات.",
    tags: ["مصطلح", "مواقع لصق", "تسريبات", "Pastebin"],
  },

  // ═══ FAQs ═══
  {
    category: "faq",
    title: "What is NDMO?",
    titleAr: "ما هو مكتب إدارة البيانات الوطنية (NDMO)؟",
    content: "NDMO (National Data Management Office) is the Saudi government entity responsible for supervising the implementation of the Personal Data Protection Law (PDPL). It operates under SDAIA (Saudi Data and AI Authority) and is responsible for issuing regulations, receiving complaints, conducting audits, and imposing penalties for PDPL violations.",
    contentAr: "مكتب إدارة البيانات الوطنية (NDMO) هو الجهة الحكومية السعودية المسؤولة عن الإشراف على تطبيق نظام حماية البيانات الشخصية (PDPL). يعمل تحت إشراف الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) وهو مسؤول عن إصدار اللوائح واستقبال الشكاوى وإجراء عمليات التدقيق وفرض العقوبات على مخالفات نظام حماية البيانات الشخصية.",
    tags: ["NDMO", "سدايا", "إشراف", "PDPL"],
  },
  {
    category: "faq",
    title: "What should I do when a data leak is detected?",
    titleAr: "ماذا أفعل عند اكتشاف تسريب بيانات؟",
    content: "When a data leak is detected: 1) Immediately classify the severity based on data type and volume, 2) Document the incident with evidence (screenshots, samples), 3) Report to NDMO within 72 hours, 4) Notify affected individuals, 5) Contain the breach by working with the source platform, 6) Conduct a root cause analysis, 7) Implement corrective measures, 8) Update security policies. Use Rasid platform to track and manage the entire incident lifecycle.",
    contentAr: "عند اكتشاف تسريب بيانات: 1) تصنيف مستوى الخطورة فوراً بناءً على نوع وحجم البيانات، 2) توثيق الحادثة بالأدلة (لقطات شاشة، عينات)، 3) الإبلاغ لمكتب إدارة البيانات الوطنية خلال 72 ساعة، 4) إخطار الأفراد المتضررين، 5) احتواء الخرق بالتعاون مع منصة المصدر، 6) إجراء تحليل السبب الجذري، 7) تطبيق التدابير التصحيحية، 8) تحديث سياسات الأمن. استخدم منصة راصد لتتبع وإدارة دورة حياة الحادثة بالكامل.",
    tags: ["تسريب", "إجراءات", "72 ساعة", "احتواء"],
  },
  {
    category: "faq",
    title: "How does Rasid platform monitor for data leaks?",
    titleAr: "كيف تراقب منصة راصد تسريبات البيانات؟",
    content: "Rasid platform monitors data leaks through multiple channels: 1) Dark Web monitoring - scanning underground forums and marketplaces, 2) Paste site monitoring - checking sites like Pastebin for leaked data, 3) Social media scanning - monitoring public posts for data exposure, 4) Telegram channel monitoring - tracking channels known for data trading, 5) Live scanning - real-time keyword and pattern matching across sources, 6) OSINT queries - open source intelligence gathering. The platform uses AI-powered analysis to classify severity and recommend response actions.",
    contentAr: "تراقب منصة راصد تسريبات البيانات عبر قنوات متعددة: 1) مراقبة الويب المظلم - فحص المنتديات والأسواق السرية، 2) مراقبة مواقع اللصق - فحص مواقع مثل Pastebin للبيانات المسربة، 3) فحص وسائل التواصل الاجتماعي - مراقبة المنشورات العامة لكشف البيانات، 4) مراقبة قنوات تيليجرام - تتبع القنوات المعروفة بتداول البيانات، 5) الفحص المباشر - مطابقة الكلمات المفتاحية والأنماط في الوقت الفعلي عبر المصادر، 6) استعلامات OSINT - جمع معلومات المصادر المفتوحة. تستخدم المنصة تحليلاً مدعوماً بالذكاء الاصطناعي لتصنيف مستوى الخطورة وتوصية إجراءات الاستجابة.",
    tags: ["مراقبة", "دارك ويب", "مواقع لصق", "تيليجرام", "OSINT"],
  },
  {
    category: "faq",
    title: "What types of personal data does Rasid detect?",
    titleAr: "ما أنواع البيانات الشخصية التي يكتشفها راصد؟",
    content: "Rasid detects various types of personal data including: National ID numbers, passport numbers, phone numbers, email addresses, full names, financial data (bank accounts, credit cards), medical records, biometric data, location data, employee records, customer databases, login credentials, and government documents. The platform uses pattern matching and AI to identify Saudi-specific data formats.",
    contentAr: "يكتشف راصد أنواعاً مختلفة من البيانات الشخصية بما في ذلك: أرقام الهوية الوطنية، أرقام جوازات السفر، أرقام الهواتف، عناوين البريد الإلكتروني، الأسماء الكاملة، البيانات المالية (حسابات بنكية، بطاقات ائتمان)، السجلات الطبية، البيانات البيومترية، بيانات الموقع، سجلات الموظفين، قواعد بيانات العملاء، بيانات تسجيل الدخول، والوثائق الحكومية. تستخدم المنصة مطابقة الأنماط والذكاء الاصطناعي لتحديد تنسيقات البيانات الخاصة بالمملكة العربية السعودية.",
    tags: ["أنواع بيانات", "هوية وطنية", "جواز سفر", "بيانات مالية"],
  },

  // ═══ POLICIES ═══
  {
    category: "policy",
    title: "Incident Response Policy",
    titleAr: "سياسة الاستجابة للحوادث",
    content: "All detected data leaks must follow the standardized incident response workflow: Detection → Classification → Documentation → Containment → Notification → Investigation → Remediation → Closure. Each incident must have an assigned owner, documented evidence chain, and compliance verification before closure.",
    contentAr: "يجب أن تتبع جميع تسريبات البيانات المكتشفة سير عمل الاستجابة للحوادث الموحد: الاكتشاف ← التصنيف ← التوثيق ← الاحتواء ← الإخطار ← التحقيق ← المعالجة ← الإغلاق. يجب أن يكون لكل حادثة مسؤول معين وسلسلة أدلة موثقة والتحقق من الامتثال قبل الإغلاق.",
    tags: ["سياسة", "استجابة", "حوادث", "سير عمل"],
  },
  {
    category: "policy",
    title: "Data Retention and Destruction Policy",
    titleAr: "سياسة الاحتفاظ بالبيانات وإتلافها",
    content: "Personal data must not be retained longer than necessary for its original purpose. Retention periods: Active incidents - until resolution + 5 years, Closed incidents - 7 years for audit purposes, Evidence data - as required by legal proceedings, User data - until account deletion + 30 days. Destruction must be irreversible and documented.",
    contentAr: "يجب عدم الاحتفاظ بالبيانات الشخصية لفترة أطول من اللازم لغرضها الأصلي. فترات الاحتفاظ: الحوادث النشطة - حتى الحل + 5 سنوات، الحوادث المغلقة - 7 سنوات لأغراض التدقيق، بيانات الأدلة - حسب متطلبات الإجراءات القانونية، بيانات المستخدمين - حتى حذف الحساب + 30 يوماً. يجب أن يكون الإتلاف لا رجعة فيه وموثقاً.",
    tags: ["سياسة", "احتفاظ", "إتلاف", "فترات"],
  },

  // ═══ INSTRUCTIONS ═══
  {
    category: "instruction",
    title: "How to Generate an Incident Report",
    titleAr: "كيفية إنشاء تقرير حادثة",
    content: "To generate an incident report: 1) Navigate to Reports page, 2) Click 'Generate New Report', 3) Select the incident(s) to include, 4) Choose report template (Executive Summary, Technical Detail, Compliance Report), 5) Customize sections as needed, 6) Review and approve, 7) Export as PDF or share digitally. Reports include: incident timeline, affected data types, evidence chain, risk assessment, and recommended actions.",
    contentAr: "لإنشاء تقرير حادثة: 1) انتقل إلى صفحة التقارير، 2) انقر على 'إنشاء تقرير جديد'، 3) حدد الحادثة/الحوادث المراد تضمينها، 4) اختر قالب التقرير (ملخص تنفيذي، تفاصيل تقنية، تقرير امتثال)، 5) خصص الأقسام حسب الحاجة، 6) راجع واعتمد، 7) صدّر كـ PDF أو شارك رقمياً. تتضمن التقارير: الجدول الزمني للحادثة، أنواع البيانات المتأثرة، سلسلة الأدلة، تقييم المخاطر، والإجراءات الموصى بها.",
    tags: ["تعليمات", "تقرير", "حادثة", "PDF"],
  },
  {
    category: "instruction",
    title: "How to Use Live Scan Feature",
    titleAr: "كيفية استخدام ميزة الفحص المباشر",
    content: "Live Scan allows real-time searching across dark web and paste sites: 1) Go to Live Scan page, 2) Enter search keywords (company name, domain, data patterns), 3) Select scan scope (dark web, paste sites, social media, all), 4) Click 'Start Scan', 5) Review results as they appear in real-time, 6) Click on any finding to see details, 7) Use 'Save as Incident' to convert findings to tracked incidents. Tip: Use specific identifiers like email domains or ID number patterns for better results.",
    contentAr: "يتيح الفحص المباشر البحث في الوقت الفعلي عبر الويب المظلم ومواقع اللصق: 1) انتقل إلى صفحة الفحص المباشر، 2) أدخل كلمات البحث (اسم الشركة، النطاق، أنماط البيانات)، 3) حدد نطاق الفحص (ويب مظلم، مواقع لصق، وسائل تواصل اجتماعي، الكل)، 4) انقر على 'بدء الفحص'، 5) راجع النتائج فور ظهورها في الوقت الفعلي، 6) انقر على أي نتيجة لرؤية التفاصيل، 7) استخدم 'حفظ كحادثة' لتحويل النتائج إلى حوادث متتبعة. نصيحة: استخدم معرفات محددة مثل نطاقات البريد الإلكتروني أو أنماط أرقام الهوية للحصول على نتائج أفضل.",
    tags: ["تعليمات", "فحص مباشر", "بحث", "دارك ويب"],
  },

  // ═══ REGULATIONS ═══
  {
    category: "regulation",
    title: "PDPL Article 24 - Data Breach Notification",
    titleAr: "المادة 24 من نظام حماية البيانات الشخصية - إخطار خرق البيانات",
    content: "Article 24 of PDPL mandates that data controllers must notify NDMO of any data breach that may cause harm to data subjects within 72 hours of becoming aware of the breach. The notification must include: nature of the breach, categories of data affected, approximate number of data subjects, likely consequences, and measures taken to address the breach.",
    contentAr: "تُلزم المادة 24 من نظام حماية البيانات الشخصية المتحكمين في البيانات بإخطار مكتب إدارة البيانات الوطنية بأي خرق للبيانات قد يسبب ضرراً لأصحاب البيانات خلال 72 ساعة من علمهم بالخرق. يجب أن يتضمن الإخطار: طبيعة الخرق، فئات البيانات المتأثرة، العدد التقريبي لأصحاب البيانات، العواقب المحتملة، والتدابير المتخذة لمعالجة الخرق.",
    tags: ["مادة 24", "إخطار", "72 ساعة", "خرق"],
  },
];

let inserted = 0;
for (const entry of entries) {
  const entryId = `KB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  
  // Check if similar entry exists
  const [existing] = await conn.execute(
    "SELECT id FROM knowledge_base WHERE kbTitleAr = ? LIMIT 1",
    [entry.titleAr]
  );
  
  if (existing.length > 0) {
    console.log(`  ⏭ Skipping (exists): ${entry.titleAr}`);
    continue;
  }
  
  await conn.execute(
    `INSERT INTO knowledge_base (entryId, kbTitle, kbTitleAr, kbContent, kbContentAr, kbCategory, kbTags, kbIsPublished, kbViewCount, kbHelpfulCount, kbCreatedByName, kbCreatedAt, kbUpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 'System', NOW(), NOW())`,
    [entryId, entry.title, entry.titleAr, entry.content, entry.contentAr, entry.category, JSON.stringify(entry.tags)]
  );
  inserted++;
  console.log(`  ✅ Inserted: ${entry.titleAr}`);
  
  // Small delay to ensure unique timestamps
  await new Promise(r => setTimeout(r, 10));
}

console.log(`\n✅ Done! Inserted ${inserted} new KB entries.`);

// Verify
const [final] = await conn.execute("SELECT COUNT(*) as cnt FROM knowledge_base");
console.log(`Total KB entries: ${final[0].cnt}`);

const [byCat] = await conn.execute(
  "SELECT kbCategory, COUNT(*) as cnt FROM knowledge_base GROUP BY kbCategory ORDER BY cnt DESC"
);
console.log("\nBy category:");
for (const row of byCat) {
  console.log(`  ${row.kbCategory}: ${row.cnt}`);
}

await conn.end();
