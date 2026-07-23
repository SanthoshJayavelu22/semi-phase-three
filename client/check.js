const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx eslint src/pages/institute/InstitutePortal.jsx', { encoding: 'utf8' });
  fs.writeFileSync('check-out.txt', 'OK:\n' + out);
} catch (e) {
  fs.writeFileSync('check-out.txt', 'ERROR:\n' + e.stdout + '\n' + e.stderr);
}
