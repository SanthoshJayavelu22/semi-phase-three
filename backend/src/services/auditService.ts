// backend/src/services/auditService.ts
import { AuditLog } from '../models/auditLogModel';

export const logAuditEvent = async (params: {
  action: string;
  performedBy?: any;
  userRole?: string;
  targetEntity?: string;
  targetId?: string;
  details?: any;
  req?: any;
}) => {
  try {
    const ipAddress = params.req?.ip || params.req?.headers?.['x-forwarded-for'] || params.req?.socket?.remoteAddress;
    const requestId = params.req?.requestId;

    await AuditLog.create({
      action: params.action,
      performedBy: params.performedBy || params.req?.user?._id,
      userRole: params.userRole || params.req?.user?.role,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      details: params.details,
      ipAddress,
      requestId,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

export const cleanupOldAuditLogs = async (daysToKeep: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  console.log(`Cleaned up ${result.deletedCount || 0} audit logs older than ${daysToKeep} days.`);
  return result;
};
