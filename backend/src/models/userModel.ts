import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken {
  token: string;
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;

  role: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshTokens: IRefreshToken[];
  tokenVersion: number;
}

const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['institute', 'admin', 'board', 'super_admin'],
      default: 'institute',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      index: { unique: false, sparse: true },
    },
    resetPasswordToken: {
      type: String,
      index: { unique: false, sparse: true },
    },
    resetPasswordExpires: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordExpires: 1 }, { expires: '1h' });
userSchema.index({ email: 1, role: 1 });

// XSS Sanitization & Trimming Pre-Save Hook
userSchema.pre<IUser>('save', function (next) {
  if (this.name) {
    this.name = this.name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
