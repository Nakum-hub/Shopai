// =============================================================================
// Audit Log Database Helpers
// =============================================================================
// Provides typed database access for the AuditLog model.
// All functions are defensive — they never throw and return safe defaults.
//
// Dependencies:
// - Prisma client from @/lib/db
// - AuditLog model in prisma/schema.prisma
// =============================================================================

import { db } from '@/lib/db';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Input data for creating an audit log entry */
export interface AuditLogInput {
  actorId?: string | null;
  actorType?: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  level?: 'info' | 'warn' | 'critical';
  details?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  correlationId?: string | null;
}

/** Query filters for searching audit logs */
export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  level?: string;
  startDate?: Date;
  endDate?: Date;
  correlationId?: string;
  sessionId?: string;
}

/** Paginated result for audit log queries */
export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** A single audit log entry as returned from the database */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorId: string | null;
  actorType: string;
  action: string;
  resource: string;
  resourceId: string | null;
  level: string;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  sessionId: string | null;
  correlationId: string | null;
}

/** Summary statistics for audit logs within a time period */
export interface AuditLogSummary {
  period: string;
  total: number;
  byAction: Record<string, number>;
  byLevel: Record<string, number>;
  byResource: Record<string, number>;
  byActorType: Record<string, number>;
  topActors: Array<{ actorId: string | null; count: number }>;
}

// -----------------------------------------------------------------------------
// Write Operations
// -----------------------------------------------------------------------------

/**
 * Write a single audit log entry to the database.
 * If the write fails, returns false but does not throw.
 *
 * @param data - The audit log input data
 * @returns true if written successfully, false otherwise
 */
export async function writeAuditLog(data: AuditLogInput): Promise<boolean> {
  try {
    await db.auditLog.create({
      data: {
        actorId: data.actorId ?? null,
        actorType: data.actorType || 'anonymous',
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        level: data.level || 'info',
        details: data.details ? JSON.stringify(data.details) : null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        sessionId: data.sessionId ?? null,
        correlationId: data.correlationId ?? null,
      },
    });
    return true;
  } catch (error) {
    console.error('[AuditDB] Failed to write audit log:', error);
    return false;
  }
}

/**
 * Write multiple audit log entries in a single batch transaction.
 * Uses createMany for efficiency. Failed entries are silently skipped.
 *
 * @param entries - Array of audit log input data
 * @returns Number of entries successfully written
 */
export async function writeAuditLogBatch(entries: AuditLogInput[]): Promise<number> {
  if (entries.length === 0) return 0;

  try {
    const result = await db.auditLog.createMany({
      data: entries.map((entry) => ({
        actorId: entry.actorId ?? null,
        actorType: entry.actorType || 'anonymous',
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        level: entry.level || 'info',
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        sessionId: entry.sessionId ?? null,
        correlationId: entry.correlationId ?? null,
      })),
      skipDuplicates: true,
    });
    return result.count;
  } catch (error) {
    console.error('[AuditDB] Failed to write audit log batch:', error);
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Query Operations
// -----------------------------------------------------------------------------

/**
 * Query audit logs with pagination and optional filters.
 * Returns a paginated result set.
 *
 * @param filters - Optional query filters
 * @param page - Page number (1-indexed, default 1)
 * @param pageSize - Number of entries per page (default 50, max 200)
 * @param orderBy - Sort order for results (default: timestamp desc)
 */
export async function queryAuditLogs(
  filters?: AuditLogFilters,
  page: number = 1,
  pageSize: number = 50,
  orderBy: 'timestamp_asc' | 'timestamp_desc' | 'action_asc' | 'action_desc' = 'timestamp_desc'
): Promise<AuditLogResult> {
  try {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(200, Math.max(1, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where: Record<string, unknown> = {};

    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.level) where.level = filters.level;
    if (filters?.correlationId) where.correlationId = filters.correlationId;
    if (filters?.sessionId) where.sessionId = filters.sessionId;

    if (filters?.startDate || filters?.endDate) {
      const timestampFilter: Record<string, unknown> = {};
      if (filters.startDate) timestampFilter.gte = filters.startDate;
      if (filters.endDate) timestampFilter.lte = filters.endDate;
      where.timestamp = timestampFilter;
    }

    const orderField = orderBy.split('_')[0] as 'timestamp' | 'action';
    const orderDir = orderBy.includes('_desc') ? 'desc' : 'asc';

    const [entries, total] = await Promise.all([
      db.auditLog.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { [orderField]: orderDir },
        skip,
        take: safePageSize,
      }),
      db.auditLog.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    return {
      entries: entries as AuditLogEntry[],
      total,
      page: safePage,
      pageSize: safePageSize,
      hasMore: skip + safePageSize < total,
    };
  } catch (error) {
    console.error('[AuditDB] Failed to query audit logs:', error);
    return {
      entries: [],
      total: 0,
      page: Math.max(1, page),
      pageSize: Math.min(200, Math.max(1, pageSize)),
      hasMore: false,
    };
  }
}

/**
 * Find audit logs by actor ID with pagination.
 *
 * @param actorId - The actor's ID to search for
 * @param page - Page number (1-indexed)
 * @param pageSize - Entries per page
 */
export async function findByActor(
  actorId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AuditLogResult> {
  return queryAuditLogs({ actorId }, page, pageSize);
}

/**
 * Find audit logs by resource type and optional resource ID.
 *
 * @param resource - Resource type (e.g., "storefront", "user")
 * @param resourceId - Optional specific resource ID
 * @param page - Page number (1-indexed)
 * @param pageSize - Entries per page
 */
export async function findByResource(
  resource: string,
  resourceId?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AuditLogResult> {
  return queryAuditLogs({ resource, resourceId }, page, pageSize);
}

/**
 * Find audit logs by action type.
 *
 * @param action - The action to search for (e.g., "storefront.create")
 * @param page - Page number (1-indexed)
 * @param pageSize - Entries per page
 */
export async function findByAction(
  action: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AuditLogResult> {
  return queryAuditLogs({ action }, page, pageSize);
}

/**
 * Find audit logs within a date range.
 *
 * @param start - Start date (inclusive)
 * @param end - End date (inclusive)
 * @param page - Page number (1-indexed)
 * @param pageSize - Entries per page
 */
export async function findByDateRange(
  start: Date,
  end: Date,
  page: number = 1,
  pageSize: number = 50
): Promise<AuditLogResult> {
  return queryAuditLogs({ startDate: start, endDate: end }, page, pageSize);
}

// -----------------------------------------------------------------------------
// Summary / Aggregation
// -----------------------------------------------------------------------------

/**
 * Get summary statistics for audit logs within a time period.
 *
 * @param period - Time period: '1h', '24h', '7d', '30d', 'all'
 * @returns Summary object with counts by action, level, resource, and top actors
 */
export async function getAuditSummary(period: string = '24h'): Promise<AuditLogSummary> {
  try {
    const startDate = getStartDateFromPeriod(period);

    const where = startDate
      ? { timestamp: { gte: startDate } }
      : {};

    const [
      total,
      entries,
    ] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        select: {
          action: true,
          level: true,
          resource: true,
          actorType: true,
          actorId: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 10000, // Cap for aggregation performance
      }),
    ]);

    const byAction: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byActorType: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};

    for (const entry of entries) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
      byResource[entry.resource] = (byResource[entry.resource] || 0) + 1;
      byActorType[entry.actorType] = (byActorType[entry.actorType] || 0) + 1;

      if (entry.actorId) {
        actorCounts[entry.actorId] = (actorCounts[entry.actorId] || 0) + 1;
      }
    }

    // Sort top actors by count descending, take top 10
    const topActors = Object.entries(actorCounts)
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period,
      total,
      byAction,
      byLevel,
      byResource,
      byActorType,
      topActors,
    };
  } catch (error) {
    console.error('[AuditDB] Failed to get audit summary:', error);
    return {
      period,
      total: 0,
      byAction: {},
      byLevel: {},
      byResource: {},
      byActorType: {},
      topActors: [],
    };
  }
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

/**
 * Delete audit log entries older than the specified number of days.
 * Runs in batches of 1000 for safety.
 *
 * @param olderThanDays - Delete entries older than this many days (default 90)
 * @returns Number of entries deleted
 */
export async function cleanupAuditLogs(olderThanDays: number = 90): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await db.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoff },
      },
    });

    return result.count;
  } catch (error) {
    console.error('[AuditDB] Failed to cleanup audit logs:', error);
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Export Helpers
// -----------------------------------------------------------------------------

/**
 * Export audit logs to JSON format (array of objects).
 *
 * @param filters - Optional query filters
 * @param limit - Max entries to export (default 1000)
 */
export async function exportToJson(
  filters?: AuditLogFilters,
  limit: number = 1000
): Promise<string> {
  try {
    const result = await queryAuditLogs(filters, 1, Math.min(limit, 5000));
    return JSON.stringify(result.entries, null, 2);
  } catch (error) {
    console.error('[AuditDB] Failed to export audit logs to JSON:', error);
    return '[]';
  }
}

/**
 * Export audit logs to CSV format.
 * Columns: timestamp, actorId, actorType, action, resource, resourceId,
 *          level, details, ip, sessionId, correlationId
 *
 * @param filters - Optional query filters
 * @param limit - Max entries to export (default 1000)
 */
export async function exportToCsv(
  filters?: AuditLogFilters,
  limit: number = 1000
): Promise<string> {
  try {
    const result = await queryAuditLogs(filters, 1, Math.min(limit, 5000));

    if (result.entries.length === 0) {
      return 'timestamp,actorId,actorType,action,resource,resourceId,level,details,ip,sessionId,correlationId';
    }

    const headers = [
      'timestamp', 'actorId', 'actorType', 'action', 'resource',
      'resourceId', 'level', 'details', 'ip', 'sessionId', 'correlationId',
    ];

    const rows = result.entries.map((entry) => {
      const safeDetails = entry.details
        ? entry.details.replace(/"/g, '""')
        : '';
      return [
        entry.timestamp.toISOString(),
        entry.actorId || '',
        entry.actorType,
        entry.action,
        entry.resource,
        entry.resourceId || '',
        entry.level,
        safeDetails,
        entry.ip || '',
        entry.sessionId || '',
        entry.correlationId || '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  } catch (error) {
    console.error('[AuditDB] Failed to export audit logs to CSV:', error);
    return '';
  }
}

// -----------------------------------------------------------------------------
// Internal Helpers
// -----------------------------------------------------------------------------

/**
 * Convert a period string to a Date for filtering.
 *
 * @param period - Period string: '1h', '24h', '7d', '30d', 'all'
 * @returns Date object for the start of the period, or null for 'all'
 */
function getStartDateFromPeriod(period: string): Date | null {
  const now = new Date();

  switch (period) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}
