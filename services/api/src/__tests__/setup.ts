// =====================================================
// Test Environment Setup
// =====================================================
import 'dotenv/config';

// Override to test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bottlebazaar_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.LOG_LEVEL = 'silent';
