import { Request } from 'express';
import prisma from '../config/prismaClient';
import { ListAuditLogsQuery } from '../validators/audit.validator';

// Who performed an audited action, and from where — built once per
// request via buildAuditContext() and threaded through to whichever
// service call needs to log something, so every service function stays
// free of any direct dependency on Express's Request type.
export interface AuditContext {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export const buildAuditContext = (req: Request): AuditContext => ({
  userId: req.user!.userId,
  ipAddress: req.ip ?? null,
  userAgent: req.get('user-agent') ?? null,
});

// Never let a field with one of these names reach the audit log, no
// matter which entity it came from — "do not expose sensitive
// information unnecessarily" applies even to a future entity that adds
// a field like this without anyone remembering to update this list.
const SENSITIVE_KEYS = new Set([
  'passwordHash',
  'password',
  'token',
  'jwtSecret',
  'authToken',
  'secret',
]);

// Recursively converts a Prisma result (which may contain Decimal and
// Date instances, and nested relations) into a plain JSON-safe value,
// stripping sensitive keys along the way. This is the ONLY path by which
// oldValue/newValue are ever written — never a raw Prisma object.
export const sanitizeForAudit = (value: unknown): unknown => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  if (Array.isArray(value)) return value.map(sanitizeForAudit);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      result[key] = sanitizeForAudit(val);
    }
    return result;
  }
  return value;
};

interface AuditLogEntry {
  context: AuditContext;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

// Best-effort by design: a failure here must never break the business
// operation it's describing (e.g. a purchase must still save even if,
// for some reason, writing its audit entry fails).
export const recordAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: entry.context.userId },
      select: { name: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: entry.context.userId,
        userName: user?.name ?? 'Unknown user',
        userEmail: user?.email ?? 'unknown',
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValue: entry.oldValue !== undefined ? (sanitizeForAudit(entry.oldValue) as never) : undefined,
        newValue: entry.newValue !== undefined ? (sanitizeForAudit(entry.newValue) as never) : undefined,
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to record audit log entry:', error);
  }
};

export const listAuditLogs = async (query: ListAuditLogsQuery) => {
  const { page, limit, userId, action, entityType, entityId, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};
