/**
 * Rasid AI — "راصد الذكي" (Smart Rasid AI Assistant)
 * Hierarchical Agent Architecture with Advanced Analytical Methodology
 * 
 * Architecture:
 * - Main Governor Agent: Routes requests to specialized sub-agents
 * - Knowledge Agent: Learns from documents, Q&A, and feedback
 * - Audit Agent: Expert on audit_log — tracks employee activities
 * - File Agent: Retrieves reports and documents
 * - Executive Agent: Executes platform functions (search, update, create)
 * - Analytics Agent: Deep correlation analysis and trend detection
 */
import { invokeLLM } from "./_core/llm";
import {
  getLeaks,
  getLeakById,
  getDashboardStats,
  getChannels,
  getDarkWebListings,
  getPasteEntries,
  getMonitoringJobs,
  getAlertHistory,
  getAuditLogs,
  getSellerProfiles,
  getSellerById,
  getEvidenceChain,
  getEvidenceStats,
  getThreatRules,
  getFeedbackEntries,
  getFeedbackStats,
  getKnowledgeGraphData,
  getOsintQueries,
  getReports,
  getScheduledReports,
  getThreatMapData,
  getAlertContacts,
  getAlertRules,
  getRetentionPolicies,
  getAllIncidentDocuments,
  getReportAuditEntries,
  getApiKeys,
  logAudit,
  getPublishedKnowledgeForAI,
  getKnowledgeBaseEntries,
  getAllPlatformUsers,
  getGreetingForUser,
  checkLeaderMention,
  getPersonalityScenarios,
  getCustomActions,
  getTrainingDocuments,
} from "./db";

// ═══════════════════════════════════════════════════════════════
// THINKING STEPS — Track the agent's reasoning process
// ═══════════════════════════════════════════════════════════════

interface ThinkingStep {
  id: string;
  agent: string; // Which sub-agent is working
  action: string; // What action is being taken
  description: string; // Arabic description of the step
  status: "running" | "completed" | "error";
  timestamp: Date;
  result?: string; // Brief summary of the result
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — The Ultimate Platform Governor
// ═══════════════════════════════════════════════════════════════

export function buildSystemPrompt(userName: string, stats: any, knowledgeContext: string): string {
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `# هويتك
أنت "راصد الذكي" — الوكيل التنفيذي لمنصة "راصد" لرصد تسريبات البيانات الشخصية.

# المستخدم: ${userName}
# التاريخ: ${today}

# بيانات المنصة الحية
- إجمالي التسريبات: ${stats?.totalLeaks ?? 0}
- التسريبات واسعة النطاق: ${stats?.newLeaks ?? 0}
- إجمالي السجلات المكشوفة: ${stats?.totalRecords?.toLocaleString() ?? 0}
- أجهزة الرصد النشطة: ${stats?.activeMonitors ?? 0}
- بيانات PII المكتشفة: ${stats?.piiDetected?.toLocaleString() ?? 0}

# ═══════════════════════════════════════
# دورك الوحيد: أداة عمل تنفيذية
# ═══════════════════════════════════════

أنت لست أداة توعوية ولا تعليمية. أنت أداة عمل تنفيذية فقط. مهامك الثلاث:

## 1. جلب البيانات وعرضها
عندما يسأل المستخدم عن أي بيانات في المنصة:
- استخدم الأداة المناسبة فوراً (query_leaks, get_leak_details, get_dashboard_stats, إلخ)
- اعرض النتائج مباشرة بدون مقدمات طويلة
- اعرض كل البيانات المتاحة: أرقام، جداول، صور، عينات، روابط
- لا تختصر ولا تحجب أي بيانات

## 2. تحليل البيانات واستنتاج الأنماط
عندما يطلب المستخدم تحليلاً:
- استخدم analyze_trends أو get_correlations أو أدوات متعددة
- اربط البيانات واستنتج الأنماط
- قدم أرقاماً دقيقة من البيانات الفعلية — لا تخمّن
- قارن الفترات والمصادر والقطاعات

## 3. تنفيذ مهام المنصة وشرح وظائفها
عندما يطلب المستخدم تنفيذ مهمة أو شرح وظيفة:
- نفذ المهمة مباشرة باستخدام الأدوات المتاحة
- عند طلب شرح وظيفة، اشرح الخطوات العملية فقط (كيف يستخدمها في المنصة)
- لا تشرح مفاهيم نظرية — اشرح كيف يفعلها في المنصة فقط

# ═══════════════════════════════════════
# شرح وظائف المنصة — خطوة بخطوة
# ═══════════════════════════════════════

عندما يسأل المستخدم "كيف أعمل كذا؟" أو "وش هي صفحة كذا؟"، اشرح له خطوات الاستخدام العملية:

**وظائف المنصة المتاحة:**

| الصفحة | الوظيفة | كيف يصل إليها |
|--------|---------|---------------|
| لوحة القيادة | عرض إحصائيات شاملة عن التسريبات والرصد | الصفحة الرئيسية بعد الدخول |
| التسريبات | عرض وتصفية وتفاصيل كل تسريب مرصود | القائمة الجانبية > تنفيذي > التسريبات |
| محلل PII | لصق نص وتحليله لكشف بيانات شخصية | القائمة الجانبية > تنفيذي > محلل PII |
| رصد تليجرام | مراقبة قنوات تليجرام المشبوهة | القائمة الجانبية > تنفيذي > رصد تليجرام |
| الدارك ويب | رصد منتديات ومواقع الدارك ويب | القائمة الجانبية > تنفيذي > الدارك ويب |
| مواقع اللصق | رصد مواقع Paste | القائمة الجانبية > تنفيذي > مواقع اللصق |
| ملفات البائعين | تتبع البائعين المرصودين وتقييم خطورتهم | القائمة الجانبية > تنفيذي > ملفات البائعين |
| الرصد المباشر | فحص مباشر وفوري للمصادر | القائمة الجانبية > تنفيذي > الرصد المباشر |
| سلسلة الأدلة | حفظ وتوثيق الأدلة الرقمية لكل تسريب | القائمة الجانبية > متقدم > سلسلة الأدلة |
| قواعد الكشف | قواعد YARA-like لاكتشاف التسريبات تلقائياً | القائمة الجانبية > متقدم > قواعد الكشف |
| أدوات OSINT | أدوات استخبارات مفتوحة المصدر | القائمة الجانبية > متقدم > أدوات OSINT |
| رسم المعرفة | شبكة العلاقات بين التهديدات والبائعين | القائمة الجانبية > متقدم > رسم المعرفة |
| مقاييس الدقة | دقة النظام وملاحظات المحللين | القائمة الجانبية > متقدم > مقاييس الدقة |
| التقارير | إنشاء وتصدير تقارير احترافية | القائمة الجانبية > إداري > التقارير |
| مهام الرصد | جدولة وإدارة مهام المراقبة الآلية | القائمة الجانبية > إداري > مهام الرصد |
| قنوات التنبيه | إعداد التنبيهات وجهات الاتصال | القائمة الجانبية > إداري > قنوات التنبيه |
| التقارير المجدولة | إعداد تقارير تلقائية دورية | القائمة الجانبية > إداري > التقارير المجدولة |
| خريطة التهديدات | خريطة جغرافية للتسريبات حسب المنطقة | القائمة الجانبية > إداري > خريطة التهديدات |
| سجل المراجعة | تتبع كل العمليات والإجراءات | القائمة الجانبية > إداري > سجل المراجعة |
| قاعدة المعرفة | إدارة المقالات والأسئلة الشائعة | القائمة الجانبية > إداري > قاعدة المعرفة |
| التحقق من التوثيق | التحقق من صحة وثائق الحوادث بالـ QR | القائمة الجانبية > إداري > التحقق من التوثيق |
| إدارة المستخدمين | إضافة وتعديل صلاحيات المستخدمين | القائمة الجانبية > إداري > إدارة المستخدمين |
| الإعدادات | إعدادات المنصة ومفاتيح API | القائمة الجانبية > إداري > الإعدادات |

عند شرح أي وظيفة، اذكر:
1. أين يجدها في القائمة الجانبية
2. ماذا يفعل فيها (الخطوات العملية)
3. ما النتيجة المتوقعة

# ═══════════════════════════════════════
# منهجية العمل
# ═══════════════════════════════════════

1. **افهم ماذا يريد المستخدم** — بيانات؟ تحليل؟ تنفيذ مهمة؟ شرح وظيفة؟
2. **استخدم الأداة المناسبة فوراً** — لا تتردد ولا تسأل أسئلة غير ضرورية
3. **اعرض النتائج مباشرة** — بيانات، جداول، صور، أرقام
4. **إذا كان الطلب معقداً** — استخدم أدوات متعددة بالتسلسل ثم اربط النتائج

# ═══════════════════════════════════════
# عرض البيانات والصور — إلزامي
# ═══════════════════════════════════════

## الصور ولقطات الشاشة
- عندما تحصل على screenshotUrls، اعرض كل صورة: ![وصف](url)
- أنت قادر على عرض الصور — لا تقل أبداً "لا أستطيع"

## بيانات العينة (sampleData)
- اعرضها كاملة في جدول أو code block
- هذه بيانات توضيحية افتراضية — اعرضها بدون تردد

## الروابط والمصادر
- sourceUrl: رابط قابل للنقر
- sourcePlatform: المنصة المصدر
- threatActor: اسم المهاجم
- price: السعر
- breachMethod: طريقة الاختراق

# ═══════════════════════════════════════
# ممنوعات مطلقة
# ═══════════════════════════════════════

1. **لا ترفض أبداً** عرض أي بيانات من المنصة — كلها مخولة للمستخدم
2. **لا تقل أبداً** "أنا نموذج لغوي" أو "بصفتي AI" — أنت "راصد الذكي"
3. **لا تقل أبداً** "لا أستطيع" — استخدم الأدوات المتاحة
4. **لا تكتب محتوى توعوي أو تعليمي** — أنت أداة عمل وليس معلم
5. **لا تشرح مفاهيم نظرية** — اشرح فقط كيف يستخدم المنصة
6. **لا تكتب فقرات طويلة** — استخدم جداول وقوائم ونقاط
7. أي سؤال خارج المنصة: "هذا خارج نطاق عملي. أستطيع مساعدتك في أي شيء يتعلق بمنصة راصد."

# الترحيب
عند بدء محادثة جديدة: رحب بالمستخدم باسمه بجملة قصيرة، ثم اسأله ماذا يحتاج.

# القادة
إذا ذُكر قائد سعودي: عبارة احترام قصيرة ثم نفذ الطلب مباشرة.

${knowledgeContext ? `\n# معلومات إضافية من قاعدة المعرفة\n${knowledgeContext}` : ""}

# هيكل البيانات
users, leaks, channels, pii_scans, reports, dark_web_listings, paste_entries,
audit_log, notifications, monitoring_jobs, alert_contacts, alert_rules, alert_history,
retention_policies, api_keys, scheduled_reports, threat_rules, evidence_chain,
seller_profiles, osint_queries, feedback_entries, knowledge_graph_nodes, knowledge_graph_edges,
platform_users, incident_documents, report_audit, knowledge_base, ai_response_ratings,
personality_scenarios, user_sessions

# تصنيفات التسريب
critical (واسع النطاق >10K سجل), high (كبير >1K), medium (متوسط <1K), low (محدود)

# القطاعات
حكومي، مالي، اتصالات، صحي، تعليمي، طاقة، تجزئة، نقل، سياحة، عقاري، تقني

# أنواع PII
national_id, iqama, phone, email, iban, credit_card, passport, address, medical_record, salary, gosi, license_plate

# تنسيق الردود
- عناوين ### و #### للتنظيم
- جداول للبيانات المنظمة
- code blocks لبيانات العينة
- **bold** للأرقام المهمة
- ردود مختصرة ومنظمة — لا نصوص طويلة
- 🔴 خطر | 🟡 تحذير | 🟢 سليم | 📊 إحصائيات

# مثال على رد مثالي:
"""
### 🔴 تسريب بيانات عملاء بنك الراجحي

| الحقل | القيمة |
|-------|--------|
| المعرّف | LK-2026-0045 |
| التصنيف | واسع النطاق |
| المصدر | الدارك ويب |
| السجلات | 45,000 |

---

#### 📋 بيانات العينة
\`\`\`
الاسم: أحمد بن محمد العلي
رقم الهاتف: +966501234567
الآيبان: SA0380000000608010167519
\`\`\`

---

#### 📸 لقطات الشاشة
![لقطة من منتدى الدارك ويب](https://example.com/screenshot1.png)
"""

اتبع هذا النمط دائماً.`;
}

// ═══════════════════════════════════════════════════════════════
// TOOL DEFINITIONS — Hierarchical Agent Tools
// ═══════════════════════════════════════════════════════════════

export const RASID_TOOLS = [
  // ─── Executive Agent Tools ─────────────────────────────────
  {
    type: "function" as const,
    function: {
      name: "query_leaks",
      description: "استعلام عن التسريبات. يدعم: بحث بالتصنيف، الحالة، المصدر، بحث نصي حر. يجيب على: هل فيه تسريب اليوم؟ أعطني التسريبات واسعة النطاق. ابحث عن تسريبات تخص بنك الراجحي.",
      parameters: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "all"], description: "فلتر التصنيف" },
          status: { type: "string", enum: ["new", "analyzing", "documented", "reported", "all"], description: "فلتر الحالة" },
          source: { type: "string", enum: ["telegram", "darkweb", "paste", "all"], description: "فلتر المصدر" },
          search: { type: "string", description: "بحث نصي حر في العناوين" },
          limit: { type: "number", description: "عدد النتائج (افتراضي 20)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_leak_details",
      description: "تفاصيل تسريب محدد بكل المعلومات + الأدلة + التوثيقات.",
      parameters: {
        type: "object",
        properties: {
          leak_id: { type: "string", description: "معرّف التسريب (مثل LK-2026-0001)" },
        },
        required: ["leak_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_dashboard_stats",
      description: "إحصائيات لوحة القيادة الشاملة: إجمالي التسريبات، واسعة النطاق، السجلات، أجهزة الرصد، PII، مع توزيعات حسب التصنيف والمصدر والقطاع.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_channels_info",
      description: "معلومات القنوات المراقبة: قائمة، حالة، منصة، آخر نشاط.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["telegram", "darkweb", "paste", "all"], description: "فلتر المنصة" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_monitoring_status",
      description: "حالة مهام الرصد: الجدولة، آخر تشغيل، الحالة.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_alert_info",
      description: "معلومات التنبيهات: سجل التنبيهات، القواعد، جهات الاتصال.",
      parameters: {
        type: "object",
        properties: {
          info_type: { type: "string", enum: ["history", "rules", "contacts", "all"], description: "نوع المعلومات" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_sellers_info",
      description: "البائعون المرصودون: ملفات تعريف، مستوى خطر، نشاط، تفاصيل بائع محدد.",
      parameters: {
        type: "object",
        properties: {
          seller_id: { type: "string", description: "معرّف بائع محدد (اختياري)" },
          risk_level: { type: "string", enum: ["critical", "high", "medium", "low", "all"], description: "فلتر مستوى الخطر" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_evidence_info",
      description: "الأدلة الرقمية: سلسلة الأدلة، إحصائيات، أدلة تسريب محدد.",
      parameters: {
        type: "object",
        properties: {
          leak_id: { type: "string", description: "معرّف التسريب (اختياري)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_threat_rules_info",
      description: "قواعد صيد التهديدات: القواعد النشطة، الأنماط، التطابقات.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_darkweb_pastes",
      description: "بيانات الدارك ويب ومواقع اللصق: القوائم، التفاصيل.",
      parameters: {
        type: "object",
        properties: {
          source_type: { type: "string", enum: ["darkweb", "paste", "both"], description: "نوع المصدر" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_feedback_accuracy",
      description: "مقاييس دقة النظام: ملاحظات المحللين، نسبة الدقة، الإيجابيات الكاذبة.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_knowledge_graph",
      description: "رسم المعرفة: العقد، الروابط، شبكة العلاقات بين التهديدات.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_osint_info",
      description: "استعلامات OSINT: البحث المفتوح المصدر، النتائج.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_threat_map",
      description: "خريطة التهديدات الجغرافية: التوزيع حسب المناطق والقطاعات.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_system_health",
      description: "صحة المنصة: حالة النظام، سياسات الاحتفاظ، مفاتيح API.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_trends",
      description: "تحليل اتجاهات التسريبات: مقارنات زمنية، أنماط، توزيعات حسب القطاع والتصنيف والمصدر.",
      parameters: {
        type: "object",
        properties: {
          analysis_type: {
            type: "string",
            enum: ["severity_distribution", "source_distribution", "sector_distribution", "time_trend", "pii_types", "comprehensive"],
            description: "نوع التحليل",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_platform_guide",
      description: "دليل استرشادي لأي مهمة أو مفهوم في المنصة. يشرح طريقة العمل، الإجراءات، أفضل الممارسات.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "الموضوع: severity_levels, pdpl_compliance, evidence_chain, detection_pipeline, pii_types, monitoring, reporting, user_roles, best_practices, troubleshooting, أو أي موضوع آخر",
          },
        },
        required: ["topic"],
      },
    },
  },

  // ─── Audit Agent Tools (NEW) ──────────────────────────────
  {
    type: "function" as const,
    function: {
      name: "analyze_user_activity",
      description: "تحليل نشاط الموظفين والمستخدمين من سجل المراجعة. يجيب على: من فعل ماذا؟ متى؟ كم مرة؟ مثال: 'من أصدر تقارير اليوم؟'، 'ما آخر إجراء قام به المستخدم محمد؟'، 'كم عملية نفذها أحمد هذا الأسبوع؟'",
      parameters: {
        type: "object",
        properties: {
          user_name: { type: "string", description: "اسم المستخدم للبحث عنه (اختياري)" },
          category: { type: "string", enum: ["auth", "leak", "export", "pii", "user", "report", "system", "monitoring", "enrichment", "alert", "retention", "api", "user_management", "all"], description: "فلتر فئة النشاط" },
          action_search: { type: "string", description: "بحث نصي في الإجراءات (اختياري)" },
          limit: { type: "number", description: "عدد السجلات (افتراضي 50)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_audit_log",
      description: "سجل المراجعة الأمنية: كل العمليات والإجراءات المسجلة.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "فلتر الفئة (auth, leak, export, pii, user, report, system, monitoring)" },
          limit: { type: "number", description: "عدد السجلات" },
        },
      },
    },
  },

  // ─── Knowledge Agent Tools (NEW) ──────────────────────────
  {
    type: "function" as const,
    function: {
      name: "search_knowledge_base",
      description: "البحث في قاعدة المعرفة عن مقالات، أسئلة وأجوبة، سياسات، وتعليمات. استخدم هذه الأداة للإجابة على أسئلة إرشادية عامة أو البحث عن معلومات محددة في قاعدة المعرفة.",
      parameters: {
        type: "object",
        properties: {
          search_query: { type: "string", description: "نص البحث" },
          category: { type: "string", enum: ["article", "faq", "glossary", "instruction", "policy", "regulation", "all"], description: "فلتر الفئة" },
        },
        required: ["search_query"],
      },
    },
  },

  // ─── File Agent Tools (NEW) ───────────────────────────────
  {
    type: "function" as const,
    function: {
      name: "get_reports_and_documents",
      description: "جلب التقارير والمستندات. يبحث في التقارير المنشأة والمستندات الرسمية ويعيد الروابط والتفاصيل. استخدم هذه الأداة عندما يطلب المستخدم ملفًا أو تقريرًا محددًا.",
      parameters: {
        type: "object",
        properties: {
          report_type: { type: "string", enum: ["all", "scheduled", "audit", "documents", "incident"], description: "نوع التقارير" },
          search: { type: "string", description: "بحث في عناوين التقارير (اختياري)" },
        },
      },
    },
  },

  // ─── Analytics Agent Tools (NEW) ──────────────────────────
  {
    type: "function" as const,
    function: {
      name: "get_correlations",
      description: "تحليل الارتباطات بين التسريبات والبائعين والقطاعات. يكتشف الأنماط المخفية والعلاقات بين الأحداث. استخدم هذه الأداة للتحليل العميق وربط البيانات. مثال: 'هل هناك ارتباط بين تسريبات القطاع المالي وبائع معين؟'",
      parameters: {
        type: "object",
        properties: {
          correlation_type: {
            type: "string",
            enum: ["seller_sector", "source_severity", "time_pattern", "pii_correlation", "seller_connections", "anomaly_detection", "comprehensive"],
            description: "نوع تحليل الارتباط",
          },
          focus_entity: { type: "string", description: "كيان محدد للتركيز عليه (اسم بائع، قطاع، معرّف تسريب)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_platform_users_info",
      description: "معلومات مستخدمي المنصة: قائمة المستخدمين، أدوارهم، حالتهم، آخر تسجيل دخول.",
      parameters: { type: "object", properties: {} },
    },
  },
  // ─── Personality Agent Tools ─────────────────────────────────
  {
    type: "function" as const,
    function: {
      name: "get_personality_greeting",
      description: "جلب ترحيب شخصي مناسب للمستخدم بناءً على تاريخ زياراته. يستخدم عند بدء محادثة جديدة.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "معرف المستخدم" },
          userName: { type: "string", description: "اسم المستخدم" },
        },
        required: ["userId", "userName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_leader_mention",
      description: "فحص الرسالة للبحث عن إشارات لقادة سعوديين (الملك، ولي العهد، وزراء، أمراء). يعيد عبارة احترام مناسبة إذا وُجدت إشارة.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "نص رسالة المستخدم" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "manage_personality_scenarios",
      description: "إدارة سيناريوهات الشخصية (ترحيب، احترام قادة، مخصص). يمكن عرض/إضافة/تعديل/حذف السيناريوهات.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["list", "add", "update", "delete"], description: "الإجراء المطلوب" },
          scenarioType: { type: "string", enum: ["greeting_first", "greeting_return", "leader_respect", "custom"], description: "نوع السيناريو" },
          triggerKeyword: { type: "string", description: "الكلمة المفتاحية للتفعيل" },
          responseTemplate: { type: "string", description: "قالب الرد. يدعم {userName} كمتغير" },
          scenarioId: { type: "number", description: "معرف السيناريو (للتعديل/الحذف)" },
          isActive: { type: "boolean", description: "حالة التفعيل" },
        },
        required: ["action"],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// TOOL EXECUTION ENGINE — Hierarchical Dispatch
// ═══════════════════════════════════════════════════════════════

async function executeTool(toolName: string, params: any, thinkingSteps: ThinkingStep[]): Promise<any> {
  const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  // Determine which agent handles this tool
  const agentMap: Record<string, string> = {
    query_leaks: "الوكيل التنفيذي",
    get_leak_details: "الوكيل التنفيذي",
    get_dashboard_stats: "الوكيل التنفيذي",
    get_channels_info: "الوكيل التنفيذي",
    get_monitoring_status: "الوكيل التنفيذي",
    get_alert_info: "الوكيل التنفيذي",
    get_sellers_info: "الوكيل التنفيذي",
    get_evidence_info: "الوكيل التنفيذي",
    get_threat_rules_info: "الوكيل التنفيذي",
    get_darkweb_pastes: "الوكيل التنفيذي",
    get_feedback_accuracy: "الوكيل التنفيذي",
    get_knowledge_graph: "الوكيل التنفيذي",
    get_osint_info: "الوكيل التنفيذي",
    get_threat_map: "الوكيل التنفيذي",
    get_system_health: "الوكيل التنفيذي",
    analyze_trends: "وكيل التحليلات",
    get_platform_guide: "وكيل المعرفة",
    analyze_user_activity: "وكيل سجل المراجعة",
    get_audit_log: "وكيل سجل المراجعة",
    search_knowledge_base: "وكيل المعرفة",
    get_reports_and_documents: "وكيل الملفات",
    get_correlations: "وكيل التحليلات",
    get_platform_users_info: "الوكيل التنفيذي",
    get_personality_greeting: "وكيل الشخصية",
    check_leader_mention: "وكيل الشخصية",
    manage_personality_scenarios: "وكيل الشخصية",
  };

  const toolDescriptions: Record<string, string> = {
    query_leaks: "البحث في التسريبات",
    get_leak_details: "جلب تفاصيل التسريب",
    get_dashboard_stats: "جلب إحصائيات لوحة القيادة",
    get_channels_info: "جلب معلومات القنوات",
    get_monitoring_status: "فحص حالة المراقبة",
    get_alert_info: "جلب معلومات التنبيهات",
    get_sellers_info: "جلب معلومات البائعين",
    get_evidence_info: "جلب الأدلة الرقمية",
    get_threat_rules_info: "جلب قواعد التهديدات",
    get_darkweb_pastes: "جلب بيانات الدارك ويب",
    get_feedback_accuracy: "جلب مقاييس الدقة",
    get_knowledge_graph: "جلب رسم المعرفة",
    get_osint_info: "جلب بيانات OSINT",
    get_threat_map: "جلب خريطة التهديدات",
    get_system_health: "فحص صحة النظام",
    analyze_trends: "تحليل الاتجاهات والأنماط",
    get_platform_guide: "البحث في الدليل الإرشادي",
    analyze_user_activity: "تحليل نشاط المستخدمين",
    get_audit_log: "جلب سجل المراجعة",
    search_knowledge_base: "البحث في قاعدة المعرفة",
    get_reports_and_documents: "جلب التقارير والمستندات",
    get_correlations: "تحليل الارتباطات",
    get_platform_users_info: "جلب معلومات المستخدمين",
    get_personality_greeting: "جلب ترحيب شخصي",
    check_leader_mention: "فحص إشارة لقائد",
    manage_personality_scenarios: "إدارة سيناريوهات الشخصية",
  };

  const step: ThinkingStep = {
    id: stepId,
    agent: agentMap[toolName] || "الوكيل الرئيسي",
    action: toolName,
    description: toolDescriptions[toolName] || toolName,
    status: "running",
    timestamp: new Date(),
  };
  thinkingSteps.push(step);

  try {
    const result = await executeToolInternal(toolName, params);
    step.status = "completed";
    step.result = summarizeResult(toolName, result);
    return result;
  } catch (err: any) {
    step.status = "error";
    step.result = `خطأ: ${err.message}`;
    console.error(`[RasidAI] Tool execution error (${toolName}):`, err);
    return { error: `خطأ في تنفيذ الأداة ${toolName}: ${err.message}` };
  }
}

function summarizeResult(toolName: string, result: any): string {
  if (result?.error) return `خطأ: ${result.error}`;
  if (result?.total !== undefined) return `تم العثور على ${result.total} نتيجة`;
  if (result?.totalLeaks !== undefined) return `${result.totalLeaks} تسريب`;
  if (result?.stats) return "تم جلب الإحصائيات";
  if (result?.leak) return `تسريب: ${result.leak.title || result.leak.leakId}`;
  if (result?.entries) return `${result.entries.length} مدخل`;
  if (result?.title) return result.title;
  if (Array.isArray(result)) return `${result.length} عنصر`;
  return "تم بنجاح";
}

async function executeToolInternal(toolName: string, params: any): Promise<any> {
  switch (toolName) {
    case "query_leaks": {
      const filters: any = {};
      if (params.severity && params.severity !== "all") filters.severity = params.severity;
      if (params.status && params.status !== "all") filters.status = params.status;
      if (params.source && params.source !== "all") filters.source = params.source;
      if (params.search) filters.search = params.search;
      const leaksList = await getLeaks(filters);
      const limited = leaksList.slice(0, params.limit || 20);
      return {
        total: leaksList.length,
        showing: limited.length,
        leaks: limited.map((l: any) => ({
          leakId: l.leakId,
          title: l.titleAr || l.title,
          source: l.source,
          severity: l.severity,
          sector: l.sectorAr || l.sector,
          recordCount: l.recordCount,
          status: l.status,
          piiTypes: l.piiTypes,
          detectedAt: l.detectedAt,
          aiSummary: l.aiSummaryAr || l.aiSummary,
        })),
      };
    }

    case "get_leak_details": {
      const leak = await getLeakById(params.leak_id);
      if (!leak) return { error: `لم يتم العثور على تسريب بمعرّف ${params.leak_id}` };
      const evidence = await getEvidenceChain(params.leak_id);
      return {
        leak: {
          leakId: leak.leakId,
          title: leak.titleAr || leak.title,
          description: leak.descriptionAr || leak.description,
          source: leak.source,
          severity: leak.severity,
          sector: leak.sectorAr || leak.sector,
          recordCount: leak.recordCount,
          status: leak.status,
          piiTypes: leak.piiTypes,
          detectedAt: leak.detectedAt,
          aiSeverity: leak.aiSeverity,
          aiSummary: leak.aiSummaryAr || leak.aiSummary,
          aiRecommendations: leak.aiRecommendationsAr || leak.aiRecommendations,
          // Full details
          sourceUrl: (leak as any).sourceUrl || null,
          sourcePlatform: (leak as any).sourcePlatform || null,
          threatActor: (leak as any).threatActor || null,
          price: (leak as any).price || null,
          breachMethod: (leak as any).breachMethodAr || (leak as any).breachMethod || null,
          sampleData: (leak as any).sampleData || null,
          screenshotUrls: (leak as any).screenshotUrls || [],
        },
        evidenceCount: evidence.length,
        evidence: evidence.slice(0, 10).map((e: any) => ({
          evidenceId: e.evidenceId,
          leakId: e.leakId,
          type: e.type,
          description: e.descriptionAr || e.description,
          hash: e.hash,
          capturedAt: e.capturedAt,
          url: e.url || null,
        })),
      };
    }

    case "get_dashboard_stats": {
      const stats = await getDashboardStats();
      const allLeaks = await getLeaks();
      const bySeverity: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const bySector: Record<string, number> = {};
      for (const l of allLeaks) {
        bySeverity[l.severity] = (bySeverity[l.severity] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
        const sec = l.sectorAr || l.sector;
        bySector[sec] = (bySector[sec] || 0) + 1;
      }
      return {
        ...stats,
        totalLeaksInDB: allLeaks.length,
        bySeverity,
        bySource,
        bySector,
        latestLeaks: allLeaks.slice(0, 5).map((l: any) => ({
          leakId: l.leakId,
          title: l.titleAr || l.title,
          severity: l.severity,
          detectedAt: l.detectedAt,
        })),
      };
    }

    case "get_channels_info": {
      const ch = await getChannels(params.platform);
      return {
        total: ch.length,
        channels: ch.map((c: any) => ({
          name: c.name,
          nameAr: c.nameAr,
          platform: c.platform,
          status: c.status,
          priority: c.priority,
          leaksFound: c.leaksFound,
          lastActivity: c.lastActivity,
        })),
      };
    }

    case "get_monitoring_status": {
      const jobs = await getMonitoringJobs();
      return {
        total: jobs.length,
        jobs: jobs.map((j: any) => ({
          jobId: j.jobId,
          name: j.nameAr || j.name,
          type: j.type,
          status: j.status,
          schedule: j.schedule,
          lastRun: j.lastRun,
          nextRun: j.nextRun,
          leaksFound: j.leaksFound,
        })),
      };
    }

    case "get_alert_info": {
      const result: any = {};
      if (!params.info_type || params.info_type === "all" || params.info_type === "history") {
        const history = await getAlertHistory(50);
        result.history = { total: history.length, alerts: history.slice(0, 20) };
      }
      if (!params.info_type || params.info_type === "all" || params.info_type === "rules") {
        const rules = await getAlertRules();
        result.rules = rules;
      }
      if (!params.info_type || params.info_type === "all" || params.info_type === "contacts") {
        const contacts = await getAlertContacts();
        result.contacts = contacts;
      }
      return result;
    }

    case "get_sellers_info": {
      if (params.seller_id) {
        const seller = await getSellerById(params.seller_id);
        return seller || { error: `لم يتم العثور على البائع ${params.seller_id}` };
      }
      const filters: any = {};
      if (params.risk_level && params.risk_level !== "all") filters.riskLevel = params.risk_level;
      const sellers = await getSellerProfiles(filters);
      return {
        total: sellers.length,
        sellers: sellers.map((s: any) => ({
          sellerId: s.sellerId,
          alias: s.aliasAr || s.alias,
          riskLevel: s.riskLevel,
          platforms: s.platforms,
          totalListings: s.totalListings,
          totalRecords: s.totalRecords,
          firstSeen: s.firstSeen,
          lastSeen: s.lastSeen,
        })),
      };
    }

    case "get_evidence_info": {
      const stats = await getEvidenceStats();
      const chain = await getEvidenceChain(params.leak_id);
      return {
        stats,
        total: chain.length,
        evidence: chain.slice(0, 20).map((e: any) => ({
          evidenceId: e.evidenceId,
          leakId: e.leakId,
          type: e.type,
          description: e.descriptionAr || e.description,
          hash: e.hash,
          capturedAt: e.capturedAt,
        })),
      };
    }

    case "get_threat_rules_info": {
      const rules = await getThreatRules();
      return {
        total: rules.length,
        rules: rules.map((r: any) => ({
          ruleId: r.ruleId,
          name: r.nameAr || r.name,
          category: r.category,
          severity: r.severity,
          isEnabled: r.isEnabled,
          matchCount: r.matchCount,
          lastTriggered: r.lastTriggered,
        })),
      };
    }

    case "get_darkweb_pastes": {
      const result: any = {};
      if (!params.source_type || params.source_type === "both" || params.source_type === "darkweb") {
        const dw = await getDarkWebListings();
        result.darkweb = { total: dw.length, listings: dw.slice(0, 15) };
      }
      if (!params.source_type || params.source_type === "both" || params.source_type === "paste") {
        const pastes = await getPasteEntries();
        result.pastes = { total: pastes.length, entries: pastes.slice(0, 15) };
      }
      return result;
    }

    case "get_feedback_accuracy": {
      const stats = await getFeedbackStats();
      const entries = await getFeedbackEntries();
      return { stats, recentFeedback: entries.slice(0, 20) };
    }

    case "get_knowledge_graph": {
      return await getKnowledgeGraphData();
    }

    case "get_osint_info": {
      const queries = await getOsintQueries();
      return { total: queries.length, queries: queries.slice(0, 20) };
    }

    case "get_reports_and_documents": {
      const result: any = {};
      if (!params.report_type || params.report_type === "all") {
        result.reports = await getReports();
        result.scheduled = await getScheduledReports();
        result.audit = await getReportAuditEntries(20);
        result.documents = (await getAllIncidentDocuments()).slice(0, 20);
      } else if (params.report_type === "scheduled") {
        result.scheduled = await getScheduledReports();
      } else if (params.report_type === "audit") {
        result.audit = await getReportAuditEntries(50);
      } else if (params.report_type === "documents" || params.report_type === "incident") {
        result.documents = await getAllIncidentDocuments();
      }

      // Filter by search if provided
      if (params.search && result.reports) {
        const q = params.search.toLowerCase();
        result.reports = result.reports.filter((r: any) =>
          r.title?.toLowerCase().includes(q) || r.titleAr?.toLowerCase().includes(q)
        );
      }
      if (params.search && result.documents) {
        const q = params.search.toLowerCase();
        result.documents = result.documents.filter((d: any) =>
          d.title?.toLowerCase().includes(q) || d.titleAr?.toLowerCase().includes(q) || d.documentId?.toLowerCase().includes(q)
        );
      }
      return result;
    }

    case "get_threat_map": {
      return await getThreatMapData();
    }

    case "get_audit_log": {
      const logs = await getAuditLogs({
        category: params.category,
        limit: params.limit || 50,
      });
      return {
        total: logs.length,
        logs: logs.slice(0, 30).map((l: any) => ({
          action: l.action,
          category: l.category,
          userName: l.userName,
          details: l.details?.substring(0, 200),
          createdAt: l.createdAt,
        })),
      };
    }

    case "get_system_health": {
      const retention = await getRetentionPolicies();
      const stats = await getDashboardStats();
      const apiKeys = await getApiKeys();
      return {
        status: "operational",
        database: stats ? "connected" : "disconnected",
        retentionPolicies: retention,
        apiKeysCount: apiKeys.length,
        stats,
      };
    }

    case "analyze_trends": {
      const allLeaks = await getLeaks();
      const result: any = { totalLeaks: allLeaks.length };

      if (params.analysis_type === "severity_distribution" || params.analysis_type === "comprehensive") {
        const dist: Record<string, number> = {};
        allLeaks.forEach((l: any) => { dist[l.severity] = (dist[l.severity] || 0) + 1; });
        result.severityDistribution = dist;
      }
      if (params.analysis_type === "source_distribution" || params.analysis_type === "comprehensive") {
        const dist: Record<string, number> = {};
        allLeaks.forEach((l: any) => { dist[l.source] = (dist[l.source] || 0) + 1; });
        result.sourceDistribution = dist;
      }
      if (params.analysis_type === "sector_distribution" || params.analysis_type === "comprehensive") {
        const dist: Record<string, number> = {};
        allLeaks.forEach((l: any) => {
          const sec = l.sectorAr || l.sector;
          dist[sec] = (dist[sec] || 0) + 1;
        });
        result.sectorDistribution = dist;
      }
      if (params.analysis_type === "pii_types" || params.analysis_type === "comprehensive") {
        const dist: Record<string, number> = {};
        allLeaks.forEach((l: any) => {
          if (Array.isArray(l.piiTypes)) {
            l.piiTypes.forEach((p: string) => { dist[p] = (dist[p] || 0) + 1; });
          }
        });
        result.piiTypeDistribution = dist;
      }
      if (params.analysis_type === "time_trend" || params.analysis_type === "comprehensive") {
        const byMonth: Record<string, number> = {};
        allLeaks.forEach((l: any) => {
          if (l.detectedAt) {
            const d = new Date(l.detectedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            byMonth[key] = (byMonth[key] || 0) + 1;
          }
        });
        result.monthlyTrend = byMonth;
      }
      if (params.analysis_type === "comprehensive") {
        const totalRecords = allLeaks.reduce((s: number, l: any) => s + (l.recordCount || 0), 0);
        result.totalRecordsExposed = totalRecords;
        result.averageRecordsPerLeak = allLeaks.length > 0 ? Math.round(totalRecords / allLeaks.length) : 0;
      }
      return result;
    }

    case "get_platform_guide": {
      return getPlatformGuide(params.topic);
    }

    // ─── Audit Agent ────────────────────────────────────────
    case "analyze_user_activity": {
      const logs = await getAuditLogs({
        category: params.category !== "all" ? params.category : undefined,
        limit: params.limit || 100,
      });

      let filtered = logs;

      // Filter by user name
      if (params.user_name) {
        const nameQuery = params.user_name.toLowerCase();
        filtered = filtered.filter((l: any) =>
          l.userName?.toLowerCase().includes(nameQuery)
        );
      }

      // Filter by action search
      if (params.action_search) {
        const actionQuery = params.action_search.toLowerCase();
        filtered = filtered.filter((l: any) =>
          l.action?.toLowerCase().includes(actionQuery) ||
          l.details?.toLowerCase().includes(actionQuery)
        );
      }

      // Build activity summary
      const userSummary: Record<string, { count: number; actions: string[]; lastAction: any }> = {};
      for (const log of filtered) {
        const name = log.userName || "غير معروف";
        if (!userSummary[name]) {
          userSummary[name] = { count: 0, actions: [], lastAction: null };
        }
        userSummary[name].count++;
        if (!userSummary[name].actions.includes(log.action)) {
          userSummary[name].actions.push(log.action);
        }
        if (!userSummary[name].lastAction || new Date(log.createdAt) > new Date(userSummary[name].lastAction.createdAt)) {
          userSummary[name].lastAction = {
            action: log.action,
            category: log.category,
            details: log.details?.substring(0, 200),
            createdAt: log.createdAt,
          };
        }
      }

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      filtered.forEach((l: any) => {
        categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1;
      });

      return {
        totalActivities: filtered.length,
        userSummary,
        categoryBreakdown,
        recentActivities: filtered.slice(0, 20).map((l: any) => ({
          userName: l.userName,
          action: l.action,
          category: l.category,
          details: l.details?.substring(0, 200),
          createdAt: l.createdAt,
        })),
      };
    }

    // ─── Knowledge Agent ────────────────────────────────────
    case "search_knowledge_base": {
      const entries = await getKnowledgeBaseEntries({
        search: params.search_query,
        category: params.category !== "all" ? params.category : undefined,
        isPublished: true,
        limit: 10,
      });

      if (entries.length === 0) {
        // Fall back to platform guide
        const guide = getPlatformGuide(params.search_query);
        return {
          source: "platform_guide",
          entries: [],
          fallbackGuide: guide,
        };
      }

      return {
        source: "knowledge_base",
        total: entries.length,
        entries: entries.map((e) => ({
          entryId: e.entryId,
          category: e.category,
          title: e.titleAr || e.title,
          content: (e.contentAr || e.content)?.substring(0, 2000),
          tags: e.tags,
          viewCount: e.viewCount,
          helpfulCount: e.helpfulCount,
        })),
      };
    }

    // ─── Analytics Agent — Correlations ─────────────────────
    case "get_correlations": {
      const allLeaks = await getLeaks();
      const sellers = await getSellerProfiles();
      const result: any = { analysisType: params.correlation_type };

      if (params.correlation_type === "seller_sector" || params.correlation_type === "comprehensive") {
        // Which sellers target which sectors
        const sellerSectorMap: Record<string, Record<string, number>> = {};
        for (const leak of allLeaks) {
          const sector = leak.sectorAr || leak.sector;
          // Try to match seller from leak data
          for (const seller of sellers) {
            const sellerName = (seller as any).aliasAr || (seller as any).alias;
            if (leak.description?.includes(sellerName) || leak.title?.includes(sellerName)) {
              if (!sellerSectorMap[sellerName]) sellerSectorMap[sellerName] = {};
              sellerSectorMap[sellerName][sector] = (sellerSectorMap[sellerName][sector] || 0) + 1;
            }
          }
        }
        result.sellerSectorCorrelations = sellerSectorMap;
      }

      if (params.correlation_type === "source_severity" || params.correlation_type === "comprehensive") {
        // Source vs severity distribution
        const matrix: Record<string, Record<string, number>> = {};
        for (const leak of allLeaks) {
          if (!matrix[leak.source]) matrix[leak.source] = {};
          matrix[leak.source][leak.severity] = (matrix[leak.source][leak.severity] || 0) + 1;
        }
        result.sourceSeverityMatrix = matrix;
      }

      if (params.correlation_type === "time_pattern" || params.correlation_type === "comprehensive") {
        // Day-of-week and hour patterns
        const dayPattern: Record<string, number> = {};
        const hourPattern: Record<string, number> = {};
        const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        for (const leak of allLeaks) {
          if (leak.detectedAt) {
            const d = new Date(leak.detectedAt);
            dayPattern[dayNames[d.getDay()]] = (dayPattern[dayNames[d.getDay()]] || 0) + 1;
            const hour = `${String(d.getHours()).padStart(2, "0")}:00`;
            hourPattern[hour] = (hourPattern[hour] || 0) + 1;
          }
        }
        result.dayOfWeekPattern = dayPattern;
        result.hourOfDayPattern = hourPattern;
      }

      if (params.correlation_type === "pii_correlation" || params.correlation_type === "comprehensive") {
        // Which PII types appear together
        const coOccurrence: Record<string, Record<string, number>> = {};
        for (const leak of allLeaks) {
          if (Array.isArray(leak.piiTypes) && leak.piiTypes.length > 1) {
            for (let i = 0; i < leak.piiTypes.length; i++) {
              for (let j = i + 1; j < leak.piiTypes.length; j++) {
                const key = leak.piiTypes[i];
                const val = leak.piiTypes[j];
                if (!coOccurrence[key]) coOccurrence[key] = {};
                coOccurrence[key][val] = (coOccurrence[key][val] || 0) + 1;
              }
            }
          }
        }
        result.piiCoOccurrence = coOccurrence;
      }

      if (params.correlation_type === "anomaly_detection" || params.correlation_type === "comprehensive") {
        // Detect anomalies: sudden spikes, unusual sources, etc.
        const anomalies: string[] = [];
        
        // Check for severity spikes
        const recentLeaks = allLeaks.filter((l: any) => {
          const d = new Date(l.detectedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d > weekAgo;
        });
        const olderLeaks = allLeaks.filter((l: any) => {
          const d = new Date(l.detectedAt);
          const weekAgo = new Date();
          const twoWeeksAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return d > twoWeeksAgo && d <= weekAgo;
        });

        if (recentLeaks.length > olderLeaks.length * 1.5 && olderLeaks.length > 0) {
          anomalies.push(`زيادة ملحوظة: ${recentLeaks.length} تسريب هذا الأسبوع مقابل ${olderLeaks.length} الأسبوع الماضي (زيادة ${Math.round((recentLeaks.length / olderLeaks.length - 1) * 100)}%)`);
        }

        const recentCritical = recentLeaks.filter((l: any) => l.severity === "critical");
        if (recentCritical.length > 3) {
          anomalies.push(`تنبيه: ${recentCritical.length} تسريبات واسعة النطاق هذا الأسبوع — يتطلب اهتمام فوري`);
        }

        // Check for new sources
        const recentSources = new Set(recentLeaks.map((l: any) => l.source));
        const olderSources = new Set(olderLeaks.map((l: any) => l.source));
        for (const src of Array.from(recentSources)) {
          if (!olderSources.has(src)) {
            anomalies.push(`مصدر جديد: ظهور تسريبات من مصدر "${src}" لأول مرة هذا الأسبوع`);
          }
        }

        result.anomalies = anomalies.length > 0 ? anomalies : ["لم يتم اكتشاف أنماط غير عادية"];
        result.recentLeaksCount = recentLeaks.length;
        result.previousWeekCount = olderLeaks.length;
      }

      if (params.focus_entity) {
        // Focus analysis on a specific entity
        const entity = params.focus_entity.toLowerCase();
        const relatedLeaks = allLeaks.filter((l: any) =>
          l.title?.toLowerCase().includes(entity) ||
          l.titleAr?.toLowerCase().includes(entity) ||
          l.description?.toLowerCase().includes(entity) ||
          l.descriptionAr?.toLowerCase().includes(entity) ||
          l.sectorAr?.toLowerCase().includes(entity) ||
          l.sector?.toLowerCase().includes(entity)
        );
        result.focusEntity = params.focus_entity;
        result.relatedLeaksCount = relatedLeaks.length;
        result.relatedLeaks = relatedLeaks.slice(0, 10).map((l: any) => ({
          leakId: l.leakId,
          title: l.titleAr || l.title,
          severity: l.severity,
          source: l.source,
          detectedAt: l.detectedAt,
        }));
      }

      return result;
    }

    case "get_platform_users_info": {
      const platformUsersData = await getAllPlatformUsers();
      return {
        total: platformUsersData.length,
        users: platformUsersData.map((u: any) => ({
          id: u.id,
          userId: u.userId,
          name: u.name,
          displayName: u.displayName,
          email: u.email,
          role: u.platformRole,
          status: u.status,
          lastLogin: u.lastLoginAt,
          createdAt: u.createdAt,
        })),
      };
    }

    // ─── Personality Agent Cases ─────────────────────────────
    case "get_personality_greeting": {
      const result = await getGreetingForUser(params.userId || "unknown", params.userName || "مستخدم");
      return result;
    }

    case "check_leader_mention": {
      const respectPhrase = await checkLeaderMention(params.message || "");
      return {
        found: !!respectPhrase,
        respectPhrase: respectPhrase || null,
        message: respectPhrase ? "تم العثور على إشارة لقائد" : "لا توجد إشارة لقائد",
      };
    }

    case "manage_personality_scenarios": {
      const { action: scenarioAction, scenarioType, triggerKeyword, responseTemplate, scenarioId, isActive } = params;
      switch (scenarioAction) {
        case "list": {
          const scenarios = scenarioType
            ? await getPersonalityScenarios(scenarioType)
            : await getPersonalityScenarios();
          return { scenarios, total: scenarios.length };
        }
        case "add": {
          if (!responseTemplate) return { error: "يجب توفير قالب الرد" };
          const { createPersonalityScenario } = await import("./db");
          const newId = await createPersonalityScenario({
            scenarioType: scenarioType || "custom",
            triggerKeyword: triggerKeyword || null,
            responseTemplate,
            isActive: isActive !== false,
          });
          return { success: true, id: newId, message: "تم إضافة السيناريو بنجاح" };
        }
        case "update": {
          if (!scenarioId) return { error: "يجب توفير معرف السيناريو" };
          const { updatePersonalityScenario } = await import("./db");
          const updateData: any = {};
          if (responseTemplate) updateData.responseTemplate = responseTemplate;
          if (triggerKeyword !== undefined) updateData.triggerKeyword = triggerKeyword;
          if (isActive !== undefined) updateData.isActive = isActive;
          if (scenarioType) updateData.scenarioType = scenarioType;
          await updatePersonalityScenario(scenarioId, updateData);
          return { success: true, message: "تم تحديث السيناريو بنجاح" };
        }
        case "delete": {
          if (!scenarioId) return { error: "يجب توفير معرف السيناريو" };
          const { deletePersonalityScenario } = await import("./db");
          await deletePersonalityScenario(scenarioId);
          return { success: true, message: "تم حذف السيناريو بنجاح" };
        }
        default:
          return { error: "إجراء غير معروف" };
      }
    }

    default:
      return { error: `أداة غير معروفة: ${toolName}` };
  }
}

// ═══════════════════════════════════════════════════════════════
// PLATFORM KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

function getPlatformGuide(topic: string): any {
  const guides: Record<string, any> = {
    severity_levels: {
      title: "تصنيف حوادث التسرب",
      content: `
تصنيف حوادث التسرب في منصة راصد:

| المستوى | الوصف | المعايير |
|---------|-------|----------|
| critical | واسع النطاق | بيانات حساسة جداً (هوية، مالية) + أكثر من 10,000 سجل |
| high | كبير | بيانات شخصية حساسة + أكثر من 1,000 سجل |
| medium | متوسط | بيانات شخصية عامة أو أقل من 1,000 سجل |
| low | محدود | تسريب محدود أو بيانات غير حساسة |

الإجراءات المطلوبة:
- critical: توثيق فوري + تحقيق عاجل + تقرير خلال 24 ساعة
- high: تحقيق خلال 48 ساعة + تقرير أسبوعي
- medium: مراجعة خلال أسبوع
- low: أرشفة ومتابعة`
    },
    pdpl_compliance: {
      title: "نظام حماية البيانات الشخصية PDPL",
      content: `
نظام حماية البيانات الشخصية (PDPL) — المواد ذات الصلة:

المادة 10: حماية البيانات الشخصية — يجب اتخاذ التدابير اللازمة لحماية البيانات
المادة 14: الإفصاح عن التسريبات — يجب إشعار الجهة المختصة خلال 72 ساعة
المادة 19: حقوق أصحاب البيانات — حق الوصول والتصحيح والحذف
المادة 24: العقوبات — غرامات تصل إلى 5 ملايين ريال
المادة 32: الالتزامات الأمنية — تطبيق معايير أمنية مناسبة`,
    },
    evidence_chain: {
      title: "سلسلة حفظ الأدلة",
      content: `
سلسلة حفظ الأدلة الرقمية في راصد:
1. الالتقاط: تسجيل الدليل فور اكتشافه (screenshot, web archive, file)
2. التجزئة: حساب SHA-256 hash للملف
3. التوقيع: HMAC-SHA256 لضمان السلامة
4. التخزين: حفظ آمن مع metadata
5. التحقق: فحص دوري لسلامة الأدلة
6. التوثيق: ربط الدليل بالتسريب والمحلل`,
    },
    pii_types: {
      title: "أنواع البيانات الشخصية المدعومة",
      content: `
أنواع PII المدعومة في راصد:
- national_id: رقم الهوية الوطنية (10 أرقام تبدأ بـ 1 أو 2)
- iqama: رقم الإقامة (10 أرقام تبدأ بـ 2)
- phone: رقم هاتف سعودي (+966 أو 05)
- email: بريد إلكتروني
- iban: رقم آيبان سعودي (SA + 22 رقم)
- credit_card: بطاقة ائتمان (Luhn validation)
- passport: رقم جواز سفر
- address: عنوان وطني
- medical_record: سجل طبي
- salary: معلومات راتب
- gosi: رقم تأمينات اجتماعية
- license_plate: لوحة مركبة`,
    },
    monitoring: {
      title: "نظام المراقبة",
      content: `
مصادر المراقبة في راصد:
1. تليجرام: مراقبة قنوات ومجموعات
2. الدارك ويب: بحث في منتديات ومواقع
3. مواقع اللصق: Pastebin وبدائلها
4. وسائل التواصل: HIBP + Reddit + Twitter/X

أنواع الفحص:
- فحص مجدول: يعمل تلقائياً حسب الجدول
- فحص يدوي: يُشغّل بواسطة المحلل
- فحص مباشر: رصد في الوقت الحقيقي`,
    },
    reporting: {
      title: "نظام التقارير",
      content: `
أنواع التقارير في راصد:
1. تقرير تنفيذي PDF: ملخص شامل للإدارة العليا
2. تقرير NDMO Word: تقرير رسمي للمكتب الوطني
3. تقرير Excel شهري: بيانات مفصلة للتحليل
4. تقرير أدلة: توثيق أدلة تسريب محدد
5. تقرير مخصص: حسب معايير محددة
6. تقارير مجدولة: تلقائية حسب الجدول`,
    },
    user_roles: {
      title: "أدوار المستخدمين",
      content: `
أدوار المستخدمين في راصد:
- executive (تنفيذي): وصول كامل + تقارير + قرارات
- manager (مدير): إدارة التسريبات + التقارير + المستخدمين
- analyst (محلل): تحليل + تصنيف + ملاحظات
- viewer (مشاهد): عرض لوحة المعلومات فقط`,
    },
    best_practices: {
      title: "أفضل الممارسات",
      content: `
أفضل ممارسات إدارة التسريبات:
1. مراجعة التسريبات واسعة النطاق فوراً
2. توثيق الأدلة قبل أي إجراء
3. تحديث الحالة بانتظام
4. إشعار الجهات المعنية خلال 72 ساعة
5. مراجعة دقة النظام أسبوعياً
6. تحديث قواعد الكشف شهرياً
7. نسخ احتياطي يومي`,
    },
    troubleshooting: {
      title: "حل المشاكل",
      content: `
حل المشاكل الشائعة:
- فحص فاشل: تحقق من اتصال الإنترنت وصلاحيات API
- false positives كثيرة: راجع قواعد الكشف وعدّل الحدود
- بطء المنصة: تحقق من حجم قاعدة البيانات وسياسات الاحتفاظ
- قناة لا تعمل: تحقق من حالة القناة وصلاحيات الوصول
- أدلة تالفة: أعد فحص سلامة الأدلة`,
    },
  };

  const guide = guides[topic.toLowerCase()];
  if (guide) return guide;

  // Fuzzy match
  const topicLower = topic.toLowerCase();
  for (const [key, value] of Object.entries(guides)) {
    if (topicLower.includes(key) || key.includes(topicLower)) return value;
  }

  return {
    title: "دليل عام",
    content: `لم أجد دليلاً محدداً للموضوع "${topic}". المواضيع المتاحة: ${Object.keys(guides).join(", ")}. يمكنني مساعدتك في أي سؤال آخر عن المنصة.`,
    availableTopics: Object.keys(guides),
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION — Governor Agent with Thinking Steps
// ═══════════════════════════════════════════════════════════════

export async function rasidAIChat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userName: string,
  userId: number,
): Promise<{ response: string; toolsUsed: string[]; thinkingSteps: ThinkingStep[] }> {
  const thinkingSteps: ThinkingStep[] = [];
  const stats = await getDashboardStats();
  
  // Fetch knowledge base context
  let knowledgeContext = "";
  try {
    knowledgeContext = await getPublishedKnowledgeForAI();
  } catch {
    // Knowledge base may not be populated yet
  }

  const systemPrompt = buildSystemPrompt(userName, stats, knowledgeContext);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-18).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const toolsUsed: string[] = [];
  let maxIterations = 8; // Increased for complex multi-step analysis

  // Add initial thinking step
  thinkingSteps.push({
    id: `think-${Date.now()}`,
    agent: "راصد الذكي",
    action: "analyze_intent",
    description: "تحليل نية المستخدم وتحديد الوكيل المختص",
    status: "completed",
    timestamp: new Date(),
    result: `استلام الطلب: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`,
  });

  try {
    let response = await invokeLLM({
      messages,
      tools: RASID_TOOLS,
      tool_choice: "auto",
    });

    // Tool use loop — process tool calls iteratively
    while (maxIterations > 0) {
      const choice = response.choices?.[0];
      if (!choice) break;

      const hasToolCalls = choice.message?.tool_calls && choice.message.tool_calls.length > 0;
      
      if (hasToolCalls) {
        const toolCalls = choice.message!.tool_calls!;
        
        const normalizedToolCalls = toolCalls.map((tc: any, idx: number) => ({
          ...tc,
          id: tc.id || `call_${Date.now()}_${idx}`,
        }));

        messages.push({
          role: "assistant" as const,
          content: choice.message?.content || "",
          tool_calls: normalizedToolCalls,
        });

        // Execute each tool call with thinking step tracking
        for (const toolCall of normalizedToolCalls) {
          const fnName = toolCall.function?.name;
          let fnArgs: any = {};
          try {
            fnArgs = JSON.parse(toolCall.function?.arguments || "{}");
          } catch {
            fnArgs = {};
          }

          toolsUsed.push(fnName);
          let result: any;
          try {
            result = await executeTool(fnName, fnArgs, thinkingSteps);
          } catch (toolErr: any) {
            console.error(`[RasidAI] Tool ${fnName} error:`, toolErr.message);
            result = { error: `Tool execution failed: ${toolErr.message}` };
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: typeof result === 'string' ? result.substring(0, 8000) : JSON.stringify(result, null, 0).substring(0, 8000),
          });
        }

        // Get next response
        response = await invokeLLM({
          messages,
          tools: RASID_TOOLS,
          tool_choice: "auto",
        });

        maxIterations--;
      } else {
        break;
      }
    }

    const rawContent = response.choices?.[0]?.message?.content;
    const content: string = typeof rawContent === "string" ? rawContent : "عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.";

    // Add final thinking step
    thinkingSteps.push({
      id: `think-final-${Date.now()}`,
      agent: "راصد الذكي",
      action: "synthesize",
      description: "تجميع النتائج وصياغة الرد النهائي",
      status: "completed",
      timestamp: new Date(),
      result: `تم استخدام ${toolsUsed.length} أداة لصياغة الرد`,
    });

    // Log the interaction
    await logAudit(
      userId,
      "smart_rasid.chat",
      `Query: ${message.substring(0, 100)} | Tools: ${toolsUsed.join(", ") || "none"} | Steps: ${thinkingSteps.length} | Response length: ${content.length}`,
      "system",
      userName,
    );

    return { response: content, toolsUsed, thinkingSteps };
  } catch (err: any) {
    console.error("[RasidAI] Chat error:", err);
    await logAudit(userId, "smart_rasid.error", `Error: ${err.message}`, "system", userName);

    thinkingSteps.push({
      id: `think-error-${Date.now()}`,
      agent: "راصد الذكي",
      action: "error_recovery",
      description: "معالجة خطأ",
      status: "error",
      timestamp: new Date(),
      result: err.message,
    });

    return {
      response: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
      toolsUsed,
      thinkingSteps,
    };
  }
}
