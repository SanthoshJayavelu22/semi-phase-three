// backend/src/models/auditLogModel.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  userRole?: string;
  targetEntity?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  requestId?: string;
  createdAt: Date;
}

const auditLogSchema: Schema = new Schema(
  {
    action: { type: String, required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userRole: { type: String },
    targetEntity: { type: String, index: true },
    targetId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    requestId: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days retention
      expires: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
