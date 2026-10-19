// =====================================================
// Database Migration Runner
// =====================================================
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import 'dotenv/config';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bottlebazaar';
  const pool = new Pool({ connectionString });

  try {
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`  ⏭  Already applied: ${file}`);
        continue;
      }

      console.log(`  ⏳ Applying: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  ✅ Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    console.log('\n✅ All migrations completed successfully\n');
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('💡 PostgreSQL is not reachable at localhost:5432. Please ensure PostgreSQL is running.');
  }
  process.exit(1);
});
