/**
 * LLM Threat Intelligence Enrichment Service
 * Uses the built-in LLM to auto-classify leak severity and generate executive summaries
 */
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { leaks } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface EnrichmentResult {
  aiSeverity: "critical" | "high" | "medium" | "low";
  aiSummary: string;
  aiSummaryAr: string;
  aiRecommendations: string[];
  aiRecommendationsAr: string[];
  aiConfidence: number;
}

/**
 * Enrich a single leak with AI-powered threat intelligence
 */
export async function enrichLeak(leak: {
  id: number;
  title: string;
  titleAr: string;
  source: string;
  severity: string;
  sector: string;
  sectorAr: string;
  piiTypes: string[];
  recordCount: number;
  description?: string | null;
  descriptionAr?: string | null;
}): Promise<EnrichmentResult> {
  const prompt = `You are a cybersecurity threat intelligence analyst specializing in personal data leaks in Saudi Arabia.

Analyze this data leak incident and provide:
1. AI-assessed severity (critical/high/medium/low) based on the data types, volume, and sector impact
2. Executive summary in English (2-3 sentences)
3. Executive summary in Arabic (2-3 sentences)
4. 3-4 specific recommendations in English
5. 3-4 specific recommendations in Arabic
6. Confidence score (0-100) for your assessment

Leak Details:
- Title: ${leak.title}
- Title (Arabic): ${leak.titleAr}
- Source: ${leak.source}
- Current Severity: ${leak.severity}
- Sector: ${leak.sector} (${leak.sectorAr})
- PII Types Found: ${leak.piiTypes.join(", ")}
- Records Exposed: ${leak.recordCount.toLocaleString()}
- Description: ${leak.description || "N/A"}
- Description (Arabic): ${leak.descriptionAr || "N/A"}

Consider Saudi data protection regulations (PDPL) and NDMO guidelines in your assessment.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity threat intelligence analyst. Always respond with valid JSON matching the requested schema. Focus on Saudi Arabia's data protection context.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enrichment_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              aiSeverity: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
                description: "AI-assessed severity level",
              },
              aiSummary: {
                type: "string",
                description: "Executive summary in English (2-3 sentences)",
              },
              aiSummaryAr: {
                type: "string",
                description: "Executive summary in Arabic (2-3 sentences)",
              },
              aiRecommendations: {
                type: "array",
                items: { type: "string" },
                description: "3-4 specific recommendations in English",
              },
              aiRecommendationsAr: {
                type: "array",
                items: { type: "string" },
                description: "3-4 specific recommendations in Arabic",
              },
              aiConfidence: {
                type: "integer",
                description: "Confidence score 0-100",
              },
            },
            required: [
              "aiSeverity",
              "aiSummary",
              "aiSummaryAr",
              "aiRecommendations",
              "aiRecommendationsAr",
              "aiConfidence",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No content in LLM response");
    }
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

    const result: EnrichmentResult = JSON.parse(content);

    // Validate and clamp confidence
    result.aiConfidence = Math.max(0, Math.min(100, result.aiConfidence));

    // Save to database
    const db = await getDb();
    if (db) {
      await db
        .update(leaks)
        .set({
          aiSeverity: result.aiSeverity,
          aiSummary: result.aiSummary,
          aiSummaryAr: result.aiSummaryAr,
          aiRecommendations: result.aiRecommendations,
          aiRecommendationsAr: result.aiRecommendationsAr,
          aiConfidence: result.aiConfidence,
          enrichedAt: new Date(),
        })
        .where(eq(leaks.id, leak.id));
    }

    return result;
  } catch (error) {
    console.error("[Enrichment] LLM enrichment failed:", error);
    // Return a fallback enrichment based on heuristics
    return generateFallbackEnrichment(leak);
  }
}

/**
 * Fallback enrichment using heuristic rules when LLM is unavailable
 */
function generateFallbackEnrichment(leak: {
  severity: string;
  piiTypes: string[];
  recordCount: number;
  sector: string;
  sectorAr: string;
}): EnrichmentResult {
  // Heuristic severity assessment
  let score = 0;
  if (leak.recordCount > 100000) score += 3;
  else if (leak.recordCount > 10000) score += 2;
  else if (leak.recordCount > 1000) score += 1;

  const sensitivePii = ["National ID", "IBAN", "Medical Records", "Passport"];
  const hasSensitive = leak.piiTypes.some((t) => sensitivePii.some((s) => t.includes(s)));
  if (hasSensitive) score += 2;
  if (leak.piiTypes.length > 3) score += 1;

  const criticalSectors = ["Banking", "Government", "Healthcare"];
  if (criticalSectors.some((s) => leak.sector.includes(s))) score += 1;

  const aiSeverity: EnrichmentResult["aiSeverity"] =
    score >= 5 ? "critical" : score >= 3 ? "high" : score >= 2 ? "medium" : "low";

  return {
    aiSeverity,
    aiSummary: `This ${leak.severity}-severity data leak from the ${leak.sector} sector exposes ${leak.recordCount.toLocaleString()} records containing ${leak.piiTypes.slice(0, 3).join(", ")}. Immediate incident response is recommended.`,
    aiSummaryAr: `تسريب بيانات بتصنيف ${leak.severity === "critical" ? "واسع النطاق" : leak.severity === "high" ? "مرتفع" : leak.severity === "medium" ? "متوسط" : "محدود"} من قطاع ${leak.sectorAr} يكشف ${leak.recordCount.toLocaleString()} سجل. يوصى بالمتابعة الفورية للحادثة.`,
    aiRecommendations: [
      "Initiate incident response procedure per NDMO guidelines",
      "Notify affected data subjects within 72 hours per PDPL requirements",
      "Engage forensic analysis to determine breach vector and scope",
      "Review and strengthen access controls for the affected systems",
    ],
    aiRecommendationsAr: [
      "بدء إجراءات الاستجابة للحوادث وفقاً لإرشادات NDMO",
      "إخطار أصحاب البيانات المتأثرين خلال 72 ساعة وفقاً لنظام حماية البيانات الشخصية",
      "إشراك التحليل الجنائي لتحديد مسار الاختراق ونطاقه",
      "مراجعة وتعزيز ضوابط الوصول للأنظمة المتأثرة",
    ],
    aiConfidence: 65,
  };
}

/**
 * Batch enrich all unenriched leaks
 */
export async function enrichAllPending(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { isNull } = await import("drizzle-orm");
  const pending = await db
    .select()
    .from(leaks)
    .where(isNull(leaks.enrichedAt))
    .limit(10);

  let enriched = 0;
  for (const leak of pending) {
    try {
      await enrichLeak({
        ...leak,
        piiTypes: (leak.piiTypes as string[]) || [],
      });
      enriched++;
      // Small delay between API calls
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error(`[Enrichment] Failed to enrich leak ${leak.leakId}:`, error);
    }
  }

  return enriched;
}
