import fs from 'fs';
import path from 'path';

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
};

const files = getAllFiles(path.join(process.cwd(), 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // 1. Remove `import React, { ... } from 'react';` to `import { ... } from 'react';`
  content = content.replace(/import\s+React\s*,\s*\{\s*/g, 'import { ');
  
  // 2. Remove `import React from 'react';` entirely
  content = content.replace(/import\s+React\s+from\s+['"]react['"];?\r?\n?/g, '');

  // Note: We don't remove individual lucide-react imports automatically via regex because it's too complex
  // to ensure we only remove the EXACT unused ones safely without an AST parser.
  // But removing `React` alone will cut down 90% of the lint errors.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed React imports in ${file}`);
  }
});

console.log('Done!');
