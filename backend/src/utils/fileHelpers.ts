import path from 'path';

export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const baseUrl = (process.env.BASE_URL || 'http://localhost:5003').replace(/\/$/, '');
  const filename = path.basename(filePath).replace(/\\/g, '/');
  return `${baseUrl}/api/uploads/${filename}`;
};
