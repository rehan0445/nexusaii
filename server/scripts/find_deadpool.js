/**
 * Find deadpool character by searching all low-view characters
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';

async function findDeadpool() {
  console.log('🔍 Searching for deadpool...\n');
  
  // Search by name variations
  const searchTerms = ['deadpool', 'dead-pool', 'dead_pool'];
  
  for (const term of searchTerms) {
    console.log(`Searching for: "${term}"`);
    
    const { data: chatbotChars } = await supabase
      .from('chatbot_models')
      .select('id, name')
      .ilike('name', `%${term}%`);
    
    const { data: userChars } = await supabase
      .from('character_data')
      .select('id, name')
      .ilike('name', `%${term}%`);
    
    const matches = [
      ...(chatbotChars || []),
      ...(userChars || [])
    ];
    
    if (matches.length > 0) {
      console.log(`✅ Found ${matches.length} match(es):`);
      matches.forEach(m => {
        console.log(`   - ${m.name} (ID: ${m.id})`);
      });
    }
  }
  
  // Also check character_view_counts for characters with very low views
  console.log('\n🔍 Checking characters with lowest display_views...');
  const { data: lowViewChars } = await supabase
    .from('character_view_counts')
    .select('character_id, total_views, fake_views')
    .order('total_views', { ascending: true })
    .limit(20);
  
  if (lowViewChars) {
    console.log('\nCharacters with lowest total_views:');
    lowViewChars.forEach(char => {
      const display = (char.total_views || 0) + (char.fake_views || 0);
      console.log(`   ${char.character_id}: total=${char.total_views}, fake=${char.fake_views}, display=${display}`);
    });
  }
}

findDeadpool()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

