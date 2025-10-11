import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseFile = path.join(__dirname, 'client', 'src', 'firebase', 'firebase.ts');

const disabledFirebaseContent = `// firebase.ts - TEMPORARILY DISABLED
// This file has been temporarily disabled to prevent Firebase errors
// To re-enable, follow the setup guide in SETUP_FIREBASE.md

// Temporarily disable Firebase to prevent auth errors
export const app = null;
export const auth = null;

console.log('⚠️ Firebase is temporarily disabled. See SETUP_FIREBASE.md for setup instructions.');
`;

try {
  // Backup original file
  const backupPath = firebaseFile + '.backup';
  if (fs.existsSync(firebaseFile) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(firebaseFile, backupPath);
    console.log('✅ Original Firebase config backed up to firebase.ts.backup');
  }

  // Write disabled version
  fs.writeFileSync(firebaseFile, disabledFirebaseContent);
  console.log('✅ Firebase temporarily disabled');
  console.log('📖 See SETUP_FIREBASE.md for setup instructions');
  console.log('🔄 Restart your development server to apply changes');
} catch (error) {
  console.error('❌ Error disabling Firebase:', error.message);
} 