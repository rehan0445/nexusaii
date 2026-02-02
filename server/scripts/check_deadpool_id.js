import 'dotenv/config';
import { supabase } from '../config/supabase.js';

async function checkDeadpool() {
  // Check if deadpool exists as character_id
  const { data: deadpool } = await supabase
    .from('character_view_counts')
    .select('character_id, total_views, fake_views')
    .ilike('character_id', '%deadpool%')
    .limit(5);
  
  console.log('Deadpool search results:', deadpool);
  
  // Also check alucard since it was updated
  const { data: alucard } = await supabase
    .from('character_view_counts')
    .select('character_id, total_views, fake_views')
    .eq('character_id', 'alucard')
    .single();
  
  console.log('\nAlucard (updated earlier):', alucard);
  
  if (alucard) {
    const display = (alucard.total_views || 0) + (alucard.fake_views || 0);
    console.log(`Alucard display_views: ${display}`);
  }
}

checkDeadpool().then(() => process.exit(0));

