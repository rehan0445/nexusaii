/**
 * Update deadpool character specifically
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';

async function updateDeadpool() {
  console.log('🚀 Finding and updating deadpool...\n');
  
  try {
    // Search by name in both tables
    const { data: chatbotChars } = await supabase
      .from('chatbot_models')
      .select('id, name')
      .ilike('name', '%deadpool%')
      .limit(5);
    
    const { data: userChars } = await supabase
      .from('character_data')
      .select('id, name')
      .ilike('name', '%deadpool%')
      .limit(5);
    
    const allMatches = [
      ...(chatbotChars || []).map(c => ({ id: c.id, name: c.name })),
      ...(userChars || []).map(c => ({ id: c.id, name: c.name }))
    ];
    
    if (allMatches.length === 0) {
      console.log('⚠️  Deadpool not found by name, searching by display_views = 0...');
      
      // Get all characters with 0 display_views
      const { data: zeroViewChars } = await supabase
        .from('character_view_counts')
        .select('character_id, total_views, fake_views');
      
      const zeroDisplayChars = (zeroViewChars || []).filter(char => {
        const display = (char.total_views || 0) + (char.fake_views || 0);
        return display === 0 || display < 10;
      });
      
      console.log(`Found ${zeroDisplayChars.length} characters with 0 or low display_views`);
      console.log('Please manually identify deadpool from these character_ids:');
      zeroDisplayChars.slice(0, 10).forEach(char => {
        console.log(`  - ${char.character_id}`);
      });
      
      return;
    }
    
    const deadpool = allMatches[0];
    console.log(`✅ Found: ${deadpool.name} (ID: ${deadpool.id})`);
    
    // Get current view data
    const { data: viewData } = await supabase
      .from('character_view_counts')
      .select('character_id, total_views, fake_views')
      .eq('character_id', deadpool.id)
      .single();
    
    if (!viewData) {
      console.log('⚠️  No view data found, creating entry...');
      const { error: createError } = await supabase
        .from('character_view_counts')
        .insert({
          character_id: deadpool.id,
          total_views: 0,
          fake_views: 7201,
          unique_views: 0
        });
      
      if (createError) {
        console.log(`❌ Failed to create: ${createError.message}`);
      } else {
        console.log('✅ Created with fake_views = 7201');
      }
      return;
    }
    
    const currentTotalViews = viewData.total_views || 0;
    const currentFakeViews = viewData.fake_views || 0;
    const currentDisplayViews = currentTotalViews + currentFakeViews;
    const newFakeViews = 7201 - currentTotalViews;
    
    console.log(`Current: total_views=${currentTotalViews}, fake_views=${currentFakeViews}, display_views=${currentDisplayViews}`);
    console.log(`Updating: fake_views=${currentFakeViews} → ${newFakeViews}`);
    console.log(`Display views: ${currentDisplayViews} → 7201`);
    
    const { error: updateError } = await supabase
      .from('character_view_counts')
      .update({ fake_views: newFakeViews })
      .eq('character_id', deadpool.id);
    
    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`);
    } else {
      console.log('✅ Deadpool updated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateDeadpool()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

