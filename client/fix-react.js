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
  if (content.includes('React.') && !content.includes("import React from 'react'")) {
    content = "import React from 'react';\n" + content;
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Added React import back to ${file}`);
  }
});

console.log('Done fixing React imports!');
