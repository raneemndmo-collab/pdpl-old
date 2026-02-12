import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Step 1: Get IDs of all pure generic leaks (no specific entity)
  const [genericLeaks] = await conn.query(`
    SELECT id FROM leaks 
    WHERE title IN (
      'Telecom Subscriber Data',
      'Saudi Banking Credentials Dump',
      'Corporate VPN Credentials',
      'Government Employee Directory',
      'Healthcare Patient Records',
      'E-commerce Customer Database',
      'University Student Records',
      'Insurance Customer Data'
    )
  `);
  
  const genericIds = genericLeaks.map(r => r.id);
  console.log(`Found ${genericIds.length} pure generic leaks to delete`);
  
  if (genericIds.length === 0) {
    console.log('Nothing to delete');
    await conn.end();
    return;
  }
  
  // Step 2: Delete related records from evidence_chain
  const placeholders = genericIds.map(() => '?').join(',');
  
  try {
    const [evResult] = await conn.query(
      `DELETE FROM evidence_chain WHERE evidenceLeakId IN (${placeholders})`,
      genericIds
    );
    console.log(`Deleted ${evResult.affectedRows} evidence_chain records`);
  } catch(e) {
    console.log('evidence_chain cleanup: ' + e.message);
  }
  
  // Step 3: Delete related incident_documents
  try {
    const [docResult] = await conn.query(
      `DELETE FROM incident_documents WHERE leakId IN (${placeholders})`,
      genericIds
    );
    console.log(`Deleted ${docResult.affectedRows} incident_documents records`);
  } catch(e) {
    console.log('incident_documents cleanup: ' + e.message);
  }
  
  // Step 4: Delete the generic leaks themselves
  const [leakResult] = await conn.query(
    `DELETE FROM leaks WHERE id IN (${placeholders})`,
    genericIds
  );
  console.log(`Deleted ${leakResult.affectedRows} generic leaks`);
  
  // Step 5: Verify remaining count
  const [remaining] = await conn.query('SELECT COUNT(*) as cnt FROM leaks');
  console.log(`Remaining leaks: ${remaining[0].cnt}`);
  
  // Step 6: Show sample of remaining leaks to verify quality
  const [sample] = await conn.query('SELECT id, title FROM leaks ORDER BY RAND() LIMIT 10');
  console.log('\nSample of remaining leaks:');
  for (const s of sample) {
    console.log(`  ${s.id}: ${s.title.substring(0, 80)}`);
  }
  
  await conn.end();
}

main().catch(console.error);
