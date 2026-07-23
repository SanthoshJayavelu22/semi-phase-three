const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', cwd: __dirname });
  console.log('SUCCESS:\n', output);
} catch (e) {
  console.log('ERROR:\n', e.stdout);
}
