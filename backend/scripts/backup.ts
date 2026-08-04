import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const backupDatabase = async () => {
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.gz`;
  const filepath = path.join(backupDir, filename);

  return new Promise((resolve, reject) => {
    const command = `mongodump --uri="${process.env.MONGO_URI || process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        reject(error);
      } else {
        console.log(`Backup created successfully: ${filename}`);
        resolve(filepath);
      }
    });
  });
};

// Run daily via cron
export default backupDatabase;
