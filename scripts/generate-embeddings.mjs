/**
 * Generate Embeddings for Knowledge Base Entries
 * 
 * This script generates vector embeddings for all published knowledge base entries
 * that don't already have embeddings. Uses the Forge API embeddings endpoint.
 * 
 * Usage: node scripts/generate-embeddings.mjs
 */

import 'dotenv/config';

const EMBEDDING_MODEL = "text-embedding-ada-002";

// Resolve API URL and key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

// Dynamic import for mysql2
const mysql = await import('mysql2/promise');

const EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

console.log("🔗 Embeddings API URL:", EMBEDDINGS_URL);
console.log("🔗 Database URL:", DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

/**
 * Prepare text for embedding
 */
function prepareEmbeddingText(entry) {
  const parts = [
    `[${entry.kbCategory}]`,
    entry.kbTitleAr || entry.kbTitle,
    entry.kbContentAr || entry.kbContent,
  ];

  if (entry.kbTags) {
    try {
      const tags = typeof entry.kbTags === 'string' ? JSON.parse(entry.kbTags) : entry.kbTags;
      if (Array.isArray(tags) && tags.length > 0) {
        parts.push(`العلامات: ${tags.join(", ")}`);
      }
    } catch {}
  }

  return parts.join("\n");
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  const truncated = text.substring(0, 30000);
  
  const response = await fetch(EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: truncated,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embeddings API failed: ${response.status} – ${errorText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

async function main() {
  console.log("\n🚀 Starting embedding generation for knowledge base entries...\n");

  // Connect to database
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get all published entries without embeddings
    const [rows] = await connection.execute(
      `SELECT entryId, kbCategory, kbTitle, kbTitleAr, kbContent, kbContentAr, kbTags, kbEmbedding 
       FROM knowledge_base 
       WHERE kbIsPublished = 1`
    );

    console.log(`📊 Found ${rows.length} published knowledge base entries`);

    const withoutEmbeddings = rows.filter(r => !r.kbEmbedding);
    const withEmbeddings = rows.filter(r => r.kbEmbedding);

    console.log(`✅ ${withEmbeddings.length} entries already have embeddings`);
    console.log(`⏳ ${withoutEmbeddings.length} entries need embeddings\n`);

    if (withoutEmbeddings.length === 0) {
      console.log("🎉 All entries already have embeddings! Nothing to do.");
      return;
    }

    let generated = 0;
    let failed = 0;

    for (const entry of withoutEmbeddings) {
      try {
        const text = prepareEmbeddingText(entry);
        console.log(`  📝 [${generated + failed + 1}/${withoutEmbeddings.length}] Generating embedding for: ${entry.kbTitleAr || entry.kbTitle}`);
        
        const embedding = await generateEmbedding(text);
        
        // Store embedding as JSON
        await connection.execute(
          `UPDATE knowledge_base SET kbEmbedding = ?, kbEmbeddingModel = ? WHERE entryId = ?`,
          [JSON.stringify(embedding), EMBEDDING_MODEL, entry.entryId]
        );
        
        generated++;
        console.log(`     ✅ Done (${embedding.length} dimensions)`);
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        failed++;
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 Embedding Generation Summary:`);
    console.log(`   Total entries: ${rows.length}`);
    console.log(`   Already had embeddings: ${withEmbeddings.length}`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Coverage: ${Math.round(((withEmbeddings.length + generated) / rows.length) * 100)}%`);
    console.log(`${'═'.repeat(50)}\n`);

    if (generated > 0) {
      console.log("🎉 Embeddings generated successfully! Semantic search is now active.");
    }
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
