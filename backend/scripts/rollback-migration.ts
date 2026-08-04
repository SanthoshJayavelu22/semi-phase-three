import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const localRequire = createRequire(__filename);

const runRollbacks = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/my_database');

  const migrationsDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    process.exit(0);
  }
  const files = fs.readdirSync(migrationsDir).sort().reverse();

  for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    console.log(`↩️ Rolling back migration: ${file}`);

    try {
      const migration = localRequire(path.join(migrationsDir, file));
      if (typeof migration.down === 'function') {
        await migration.down();
      }
      console.log(`✅ Rollback ${file} completed`);
    } catch (error) {
      console.error(`❌ Rollback ${file} failed:`, error);
      process.exit(1);
    }
  }

  await mongoose.disconnect();
  console.log('✅ All rollbacks completed');
};

runRollbacks();
