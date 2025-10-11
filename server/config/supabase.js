import { createClient } from '@supabase/supabase-js';

// Hardcoded for testing purposes - replace with proper env loading later
const supabaseUrl = 'https://dswuotsdaltsomyqqykn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw';

// For production, use proper env loading:
// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
//
// if (!supabaseUrl || !supabaseKey) {
//   throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
// }

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

