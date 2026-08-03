// backend/src/models/hallTicketTemplateModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IHallTicketTemplate extends Document {
  name: string;
  description: string;
  type: 'system' | 'institute';
  instituteId?: mongoose.Types.ObjectId;
  config: {
    layout: 'portrait' | 'landscape';
    pageSize: 'A4' | 'A5' | 'custom';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    styles: {
      fontFamily: string;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      headerFontSize: number;
      bodyFontSize: number;
      footerFontSize: number;
    };
    sections: Array<{
      id: string;
      type: 'header' | 'candidate' | 'exam' | 'instructions' | 'footer' | 'custom';
      label: string;
      enabled: boolean;
      order: number;
      fields: Array<{
        id: string;
        label: string;
        type: 'text' | 'image' | 'signature' | 'table' | 'custom';
        placeholder: string;
        mapping: string;
        required: boolean;
        styles: {
          fontSize: number;
          fontWeight: string;
          color: string;
          alignment: 'left' | 'center' | 'right';
        };
        position: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      }>;
      content: string;
      customStyles: Record<string, any>;
    }>;
    watermark: {
      enabled: boolean;
      text: string;
      opacity: number;
      position: 'center' | 'diagonal';
    };
  };
  isDefault: boolean;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const HallTicketTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['system', 'institute'], default: 'system' },
  instituteId: { type: Schema.Types.ObjectId, ref: 'Institute' },
  config: {
    layout: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    pageSize: { type: String, enum: ['A4', 'A5', 'custom'], default: 'A4' },
    margins: {
      top: { type: Number, default: 40 },
      bottom: { type: Number, default: 40 },
      left: { type: Number, default: 40 },
      right: { type: Number, default: 40 }
    },
    styles: {
      fontFamily: { type: String, default: 'Arial' },
      primaryColor: { type: String, default: '#1a237e' },
      secondaryColor: { type: String, default: '#0d47a1' },
      accentColor: { type: String, default: '#c62828' },
      headerFontSize: { type: Number, default: 18 },
      bodyFontSize: { type: Number, default: 12 },
      footerFontSize: { type: Number, default: 10 }
    },
    sections: [{
      id: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['header', 'candidate', 'exam', 'instructions', 'footer', 'custom'],
        required: true 
      },
      label: { type: String },
      enabled: { type: Boolean, default: true },
      order: { type: Number, required: true },
      fields: [{
        id: { type: String, required: true },
        label: { type: String },
        type: { type: String, enum: ['text', 'image', 'signature', 'table', 'custom'] },
        placeholder: { type: String },
        mapping: { type: String },
        required: { type: Boolean, default: false },
        styles: {
          fontSize: { type: Number, default: 12 },
          fontWeight: { type: String, default: 'normal' },
          color: { type: String, default: '#000000' },
          alignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' }
        },
        position: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
          width: { type: Number, default: 200 },
          height: { type: Number, default: 30 }
        }
      }],
      content: { type: String },
      customStyles: { type: Schema.Types.Mixed }
    }],
    watermark: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: 'SEMI' },
      opacity: { type: Number, default: 0.1 },
      position: { type: String, enum: ['center', 'diagonal'], default: 'center' }
    }
  },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const HallTicketTemplate = mongoose.model<IHallTicketTemplate>('HallTicketTemplate', HallTicketTemplateSchema);