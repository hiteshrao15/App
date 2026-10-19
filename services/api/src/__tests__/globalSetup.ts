// Global test setup — create test database schema
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

module.exports = async function globalSetup() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/bottlebazaar_test',
  });

  try {
    // Create test database if it doesn't exist
    const rootPool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
    });
    await rootPool.query(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = 'bottlebazaar_test' AND pid <> pg_backend_pid()
    `).catch(() => {});
    await rootPool.query(`CREATE DATABASE bottlebazaar_test`).catch(() => {});
    await rootPool.end();

    // Run schema
    const schema = fs.readFileSync(
      path.join(__dirname, '../db/migrations/001_initial_schema.sql'),
      'utf-8'
    );
    await pool.query(schema);
    console.log('✅ Test database ready');
  } catch (err: any) {
    console.log('Test DB setup note:', err.message);
  } finally {
    await pool.end();
  }
};
