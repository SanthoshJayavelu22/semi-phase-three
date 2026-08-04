// backend/src/config/logger.ts
import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

export const logger = {
  info: (message: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    const logLine = `[INFO] [${timestamp}] ${message} ${meta.length ? JSON.stringify(meta) : ''}\n`;
    console.log(logLine.trim());
    fs.appendFileSync(combinedLogPath, logLine);
  },
  warn: (message: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    const logLine = `[WARN] [${timestamp}] ${message} ${meta.length ? JSON.stringify(meta) : ''}\n`;
    console.warn(logLine.trim());
    fs.appendFileSync(combinedLogPath, logLine);
  },
  error: (message: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    const logLine = `[ERROR] [${timestamp}] ${message} ${meta.length ? JSON.stringify(meta) : ''}\n`;
    console.error(logLine.trim());
    fs.appendFileSync(errorLogPath, logLine);
    fs.appendFileSync(combinedLogPath, logLine);
  }
};

export default logger;
