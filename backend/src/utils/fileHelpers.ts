import path from 'path';

export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const filename = path.basename(filePath).replace(/\\/g, '/');
  return `/api/uploads/${filename}`;
};
