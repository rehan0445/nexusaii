import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseFile = path.join(__dirname, 'client', 'src', 'firebase', 'firebase.ts');
const backupPath = firebaseFile + '.backup';

try {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, firebaseFile);
    console.log('✅ Firebase configuration restored from backup');
    console.log('📖 Make sure to set up your environment variables in client/.env');
    console.log('🔄 Restart your development server to apply changes');
  } else {
    console.log('❌ No backup file found. Please set up Firebase manually.');
    console.log('📖 See SETUP_FIREBASE.md for instructions');
  }
} catch (error) {
  console.error('❌ Error restoring Firebase:', error.message);
} 