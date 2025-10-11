import { createClient } from '@supabase/supabase-js';

// Load credentials from environment variables with fallback for local development
const supabaseUrl = process.env.SUPABASE_URL || 'https://dswuotsdaltsomyqqykn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw';

// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing required Supabase credentials');
}

// Log which environment is being used (without exposing the key)
if (process.env.SUPABASE_URL) {
  console.log('✅ Using Supabase credentials from environment variables');
  console.log(`🔌 Supabase client connected to: ${supabaseUrl.substring(0, 30)}...`);
} else {
  console.log('⚠️ Using fallback Supabase credentials (local development)');
  console.log('⚠️ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway environment variables');
}

// Create Supabase client with connection pooling and timeout configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'nexus-backend',
    },
    // Add fetch with 30-second timeout to prevent hanging requests
    fetch: (url, options = {}) => {
      return fetch(url, { 
        ...options, 
        signal: AbortSignal.timeout(30000) 
      });
    }
  },
  // Add timeout configuration
  realtime: {
    timeout: 30000,
  },
});

