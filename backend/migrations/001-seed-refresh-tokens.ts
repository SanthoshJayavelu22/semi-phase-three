import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../src/models/userModel';

dotenv.config();

const generateRefreshToken = (id: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

export const up = async (): Promise<void> => {
  // Backfill the refreshTokens/tokenVersion fields for users created before
  // login began persisting refresh tokens. Each user with no stored refresh
  // token gets a freshly signed one (matching generateToken in authController).
  // Note: tokens held by clients from before this fix were never persisted, so
  // those sessions will still be forced through one re-login; this migration
  // guarantees every user has a valid stored token from here on.
  const users = await User.find({});

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const existing = user.refreshTokens || [];
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    user.refreshTokens = [{ token: generateRefreshToken(user._id.toString()), createdAt: new Date() }];
    user.tokenVersion = user.tokenVersion || 0;
    await user.save();
    updated += 1;
  }

  console.log(`Migration up completed: seeded refresh tokens for ${updated} user(s), skipped ${skipped}`);
};

export const down = async (): Promise<void> => {
  await User.updateMany(
    {},
    { $set: { refreshTokens: [] } }
  );
  console.log('Migration down completed: cleared all seeded refresh tokens');
};
