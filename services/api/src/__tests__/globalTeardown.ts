// Global teardown
import { Pool } from 'pg';

module.exports = async function globalTeardown() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/bottlebazaar_test',
  });
  await pool.end().catch(() => {});
};
