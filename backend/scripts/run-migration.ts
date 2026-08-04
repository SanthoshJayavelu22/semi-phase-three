import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const runMigrations = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    console.log(`📊 Running migration: ${file}`);
    
    try {
      const migration = await import(path.join(migrationsDir, file));
      await migration.up();
      console.log(`✅ Migration ${file} completed`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error);
      process.exit(1);
    }
  }
  
  await mongoose.disconnect();
  console.log('✅ All migrations completed');
};

runMigrations();
