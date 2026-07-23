const fs = require('fs');
const path = require('path');

const backendRoutesDir = path.join(__dirname, 'backend', 'src', 'routes');
const frontendApiDir = path.join(__dirname, 'client', 'src', 'api');

function extractRoutes(dir) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    const allRoutes = [];
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const regex = /router\.(get|post|put|patch|delete)\(\s*['"`](.*?)['"`]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            allRoutes.push({
                file: file,
                method: match[1].toUpperCase(),
                path: match[2]
            });
        }
    });
    return allRoutes;
}

function extractFrontendApis(dir) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    const allApis = [];
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const regex = /apiClient\.(get|post|put|patch|delete)\(\s*[`'"](.*?)['"`]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            allApis.push({
                file: file,
                method: match[1].toUpperCase(),
                path: match[2]
            });
        }
    });
    return allApis;
}

const backendRoutes = extractRoutes(backendRoutesDir);
const frontendApis = extractFrontendApis(frontendApiDir);

console.log('--- Backend Routes ---');
backendRoutes.forEach(r => console.log(`${r.method} ${r.file}: ${r.path}`));

console.log('\n--- Frontend APIs ---');
frontendApis.forEach(r => console.log(`${r.method} ${r.file}: ${r.path}`));
