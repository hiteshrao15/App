// =====================================================
// Audit Log Service
// =====================================================
import { getPool } from '../db/pool';
import { UserRole } from '../middleware/auth';
import { logger } from '../utils/logger';

interface AuditEntry {
  action: string;
  actorId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  requestId?: string;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO audit_logs (action, actor_id, actor_role, target_type, target_id, metadata, ip_address, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8)`,
      [
        entry.action,
        entry.actorId || null,
        entry.actorRole || null,
        entry.targetType || null,
        entry.targetId || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress || null,
        entry.requestId || null,
      ]
    );
  } catch (err) {
    // Audit failures must not crash the main request
    logger.error({ err }, 'Failed to write audit log');
  }
}
