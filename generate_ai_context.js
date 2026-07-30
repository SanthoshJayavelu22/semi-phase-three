const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUTPUT = path.join(ROOT, 'full_codebase_for_ai.md');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'uploads', 'assets', '.gemini']);
const EXCLUDE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.pdf', '.woff', '.woff2', '.ttf', '.eot']);
const EXCLUDE_FILES = new Set(['package-lock.json', 'full_codebase_for_ai.md', '.DS_Store', 'thumbs.db']);

function collectFiles(dir, relative = '') {
  const results = [];
  const entries = fs.readdirSync(path.join(dir, relative), { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_FILES.has(entry.name)) continue;
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const full = path.join(dir, rel);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      results.push(...collectFiles(dir, rel));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXCLUDE_EXTS.has(ext)) continue;
      if (entry.name.startsWith('.')) continue;
      results.push(rel);
    }
  }
  return results;
}

function inferLang(ext) {
  const map = {
    '.ts': 'typescript',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.json': 'json',
    '.css': 'css',
    '.html': 'html',
    '.env': 'env',
    '.gitignore': 'ignore',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.mjs': 'javascript',
  };
  return map[ext] || '';
}

function generate() {
  console.log('Gathering codebase...');
  const files = collectFiles(ROOT).sort();

  const header = `# SEMI — Full Project Codebase Context

> Auto-generated on ${new Date().toISOString()}

This document contains the complete source code of the **SEMI** (Society for Emergency Medicine in India) project for AI context. It covers the backend (Express/TypeScript/MongoDB) and frontend (React/Vite/Tailwind) for institute onboarding, academic management, exams, results, marksheets, certificates, and revaluation workflows.

---

## Project Structure

\`\`\`
semi-phase-three/
`;

  // Build tree
  function buildTree(list) {
    const tree = {};
    for (const f of list) {
      const parts = f.split('/');
      let node = tree;
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          node[parts[i]] = null;
        } else {
          if (!node[parts[i]]) node[parts[i]] = {};
          node = node[parts[i]];
        }
      }
    }
    return tree;
  }

  const tree = buildTree(files);
  const treeLines = [];

  function printTree(node, indent) {
    const entries = Object.entries(node).sort(([a], [b]) => {
      const aIsDir = node[a] !== null;
      const bIsDir = node[b] !== null;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    entries.forEach(([name, child], idx) => {
      const isLast = idx === entries.length - 1;
      treeLines.push(`${indent}${isLast ? '└── ' : '├── '}${name}`);
      if (child !== null) {
        printTree(child, indent + (isLast ? '    ' : '│   '));
      }
    });
  }

  printTree(tree, '');
  const treeBlock = treeLines.join('\n');
  const footer = '\n```\n\n';

  let md = header + treeBlock + footer;

  for (const filePath of files) {
    const fullPath = path.join(ROOT, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      const lang = inferLang(ext);
      const normalized = filePath.replace(/\\/g, '/');

      // Redact secrets in .env files
      const isEnv = path.basename(filePath) === '.env';
      const displayContent = isEnv
        ? content.split('\n').map(line => {
            if (/=(.+)/.test(line) && !line.trim().startsWith('#')) {
              const [key] = line.split('=');
              return `${key}=<REDACTED>`;
            }
            return line;
          }).join('\n')
        : content;

      md += `### \`${normalized}\`\n\n\`\`\`${lang}\n${displayContent}\n\`\`\`\n\n`;
    } catch {
      // skip binary/unreadable
    }
  }

  fs.writeFileSync(OUTPUT, md, 'utf-8');
  console.log(`Codebase successfully exported to: ${OUTPUT} (${files.length} files)`);
}

generate();