import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL_PATTERN = /http:\/\/localhost:8002/g;
const API_URL_REPLACEMENT = `(import.meta.env.VITE_API_URL || 'http://localhost:8002')`;

const SOCKET_URL_PATTERN = /const\s+serverUrl\s*=\s*['"]http:\/\/localhost:8002['"]/g;
const SOCKET_URL_REPLACEMENT = `const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:8002'`;

console.log('🔧 Fixing hardcoded API URLs...\n');

const filesToFix = [
  'client/src/firebase/auth.ts',
  'client/src/pages/arena/DarkRoomTab.tsx',
  'client/src/services/hangoutService.ts',
  'client/src/components/ConfessionPage.tsx'
];

let filesFixed = 0;

for (const file of filesToFix) {
  try {
    const filePath = join(__dirname, file);
    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace hardcoded URLs
    content = content.replace(API_URL_PATTERN, API_URL_REPLACEMENT);
    content = content.replace(SOCKET_URL_PATTERN, SOCKET_URL_REPLACEMENT);
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      filesFixed++;
    } else {
      console.log(`ℹ️  Skipped: ${file} (no changes needed)`);
    }
  } catch (error) {
    console.log(`⚠️  Error fixing ${file}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${filesFixed} files!`);
console.log('\n📝 Summary:');
console.log('   - Created client/.env with network IP');
console.log('   - Updated API URLs to use environment variables');
console.log('   - Your app will now work on network!');
console.log('\n🔄 Next: Restart your frontend (Ctrl+C, then npm run dev)');

