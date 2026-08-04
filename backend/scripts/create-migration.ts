import fs from 'fs';
import path from 'path';

const createMigration = async () => {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: npm run migrate:create -- <migration-name>');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const existing = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => parseInt(f.split('-')[0], 10))
    .filter(n => !isNaN(n));

  const nextNum = existing.length ? Math.max(...existing) + 1 : 1;
  const prefix = String(nextNum).padStart(3, '0');
  const filename = `${prefix}-${name}.ts`;
  const filepath = path.join(migrationsDir, filename);

  const template = `import mongoose from 'mongoose';\n\nexport const up = async (): Promise<void> => {\n  // Add new fields, collections, or indexes\n  await mongoose.connection.collection('students').updateMany(\n    {},\n    { $set: { newField: 'default' } }\n  );\n  console.log('Migration up completed');\n};\n\nexport const down = async (): Promise<void> => {\n  // Rollback changes\n  await mongoose.connection.collection('students').updateMany(\n    {},\n    { $unset: { newField: '' } }\n  );\n  console.log('Migration down completed');\n};\n`;

  fs.writeFileSync(filepath, template);
  console.log(`✅ Created migration: ${filename}`);
};

createMigration();
