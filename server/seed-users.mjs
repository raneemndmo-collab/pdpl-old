import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const password = '15001500';
  const hash = await bcrypt.hash(password, 12);

  const users = [
    {
      userId: 'MRUHAILY',
      passwordHash: hash,
      name: 'Muhammed ALRuhaily',
      email: 'prog.muhammed@gmail.com',
      mobile: '+966553445533',
      displayName: 'Admin Rasid System',
      platformRole: 'root_admin',
      status: 'active',
    },
    {
      userId: 'aalrebdi',
      passwordHash: hash,
      name: 'Alrebdi Fahad Alrebdi',
      email: 'aalrebdi@ndmo.gov.sa',
      mobile: null,
      displayName: "NDMO's president/director",
      platformRole: 'director',
      status: 'active',
    },
    {
      userId: 'msarhan',
      passwordHash: hash,
      name: 'Mashal Abdullah Alsarhan',
      email: 'msarhan@nic.gov.sa',
      mobile: '0555113675',
      displayName: 'Vice President of NDMO',
      platformRole: 'vice_president',
      status: 'active',
    },
    {
      userId: 'malmoutaz',
      passwordHash: hash,
      name: 'Manal Mohammed Almoutaz',
      email: 'malmoutaz@ndmo.gov.sa',
      mobile: '0542087872',
      displayName: 'Manager of Smart Rasid Platform',
      platformRole: 'manager',
      status: 'active',
    },
  ];

  for (const user of users) {
    try {
      // Check if user already exists
      const [existing] = await connection.execute(
        'SELECT id FROM platform_users WHERE userId = ?',
        [user.userId]
      );
      if (existing.length > 0) {
        console.log(`User ${user.userId} already exists, updating...`);
        await connection.execute(
          `UPDATE platform_users SET 
            passwordHash = ?, name = ?, email = ?, mobile = ?, 
            displayName = ?, platformRole = ?, status = ?
          WHERE userId = ?`,
          [user.passwordHash, user.name, user.email, user.mobile,
           user.displayName, user.platformRole, user.status, user.userId]
        );
      } else {
        await connection.execute(
          `INSERT INTO platform_users (userId, passwordHash, name, email, mobile, displayName, platformRole, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.userId, user.passwordHash, user.name, user.email, user.mobile,
           user.displayName, user.platformRole, user.status]
        );
        console.log(`Created user: ${user.userId} (${user.displayName}) - Role: ${user.platformRole}`);
      }
    } catch (err) {
      console.error(`Error creating user ${user.userId}:`, err.message);
    }
  }

  console.log('\n=== Platform Users Summary ===');
  const [allUsers] = await connection.execute('SELECT userId, name, displayName, platformRole, status FROM platform_users');
  console.table(allUsers);

  await connection.end();
  console.log('\nDone!');
}

main().catch(console.error);
