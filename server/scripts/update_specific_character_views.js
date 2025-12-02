/**
 * Update specific characters' fake_views to achieve desired display_views
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';

// Character updates: { name, current_views, new_display_views }
const characterUpdates = [
  { name: 'gojo satoru', current_views: 4778, new_display_views: 9347 },
  { name: 'mikasa akerman', current_views: 3436, new_display_views: 7899 },
  { name: 'rias gremory', current_views: 2987, new_display_views: 6671 },
  { name: 'kai young', current_views: 2490, new_display_views: 4610 },
  { name: 'deadpool', current_views: 0, new_display_views: 7201 },
  { name: 'the joker', current_views: 2177, new_display_views: 5765 },
  { name: 'ironmouse', current_views: 442, new_display_views: 3991 },
  { name: 'ada wong', current_views: 643, new_display_views: 6719 },
  { name: 'zade meadows', current_views: 820, new_display_views: 6013 },
  { name: 'yelan', current_views: 670, new_display_views: 8971 },
];

async function updateCharacterViews() {
  console.log('🚀 Starting specific character view updates...\n');
  
  try {
    // First, we need to find character_ids by name
    // Characters might be in chatbot_models table or character_data table
    console.log('🔍 Finding character IDs by name...\n');
    
    const results = [];
    
    for (const update of characterUpdates) {
      console.log(`📝 Processing: ${update.name}`);
      console.log(`   Current views: ${update.current_views}`);
      console.log(`   Desired display_views: ${update.new_display_views}`);
      
      // Search in chatbot_models table (built-in characters)
      const { data: chatbotChars, error: chatbotError } = await supabase
        .from('chatbot_models')
        .select('id, name')
        .ilike('name', `%${update.name}%`)
        .limit(5);
      
      // Search in character_data table (user-created characters)
      const { data: userChars, error: userError } = await supabase
        .from('character_data')
        .select('id, name')
        .ilike('name', `%${update.name}%`)
        .limit(5);
      
      // Combine results
      const allMatches = [
        ...(chatbotChars || []).map(c => ({ id: c.id, name: c.name, source: 'chatbot_models' })),
        ...(userChars || []).map(c => ({ id: c.id, name: c.name, source: 'character_data' }))
      ];
      
      if (allMatches.length === 0) {
        console.log(`   ⚠️  Character not found: ${update.name}`);
        results.push({
          name: update.name,
          status: 'not_found',
          error: 'Character not found in database'
        });
        continue;
      }
      
      // Find best match (exact or closest)
      const bestMatch = allMatches.find(c => 
        c.name.toLowerCase() === update.name.toLowerCase()
      ) || allMatches[0];
      
      console.log(`   ✅ Found: ${bestMatch.name} (ID: ${bestMatch.id}, Source: ${bestMatch.source})`);
      
      // Get current view count from character_view_counts
      const { data: viewData, error: viewError } = await supabase
        .from('character_view_counts')
        .select('character_id, total_views, fake_views')
        .eq('character_id', bestMatch.id)
        .single();
      
      if (viewError || !viewData) {
        console.log(`   ⚠️  No view data found for character_id: ${bestMatch.id}`);
        results.push({
          name: update.name,
          character_id: bestMatch.id,
          status: 'no_view_data',
          error: 'No view count data found'
        });
        continue;
      }
      
      // Verify current views match (or close)
      const currentTotalViews = viewData.total_views || 0;
      if (Math.abs(currentTotalViews - update.current_views) > 100) {
        console.log(`   ⚠️  Warning: Current total_views (${currentTotalViews}) doesn't match expected (${update.current_views})`);
      }
      
      // Calculate new fake_views
      // display_views = total_views + fake_views
      // fake_views = desired_display_views - total_views
      const newFakeViews = update.new_display_views - currentTotalViews;
      const currentDisplayViews = currentTotalViews + (viewData.fake_views || 0);
      
      console.log(`   Current: total_views=${currentTotalViews}, fake_views=${viewData.fake_views || 0}, display_views=${currentDisplayViews}`);
      console.log(`   New: fake_views=${newFakeViews}, display_views=${update.new_display_views}`);
      
      // Update fake_views
      const { error: updateError } = await supabase
        .from('character_view_counts')
        .update({ fake_views: newFakeViews })
        .eq('character_id', bestMatch.id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        results.push({
          name: update.name,
          character_id: bestMatch.id,
          status: 'error',
          error: updateError.message
        });
      } else {
        console.log(`   ✅ Updated successfully!`);
        results.push({
          name: update.name,
          character_id: bestMatch.id,
          status: 'success',
          old_fake_views: viewData.fake_views || 0,
          new_fake_views: newFakeViews,
          old_display_views: currentDisplayViews,
          new_display_views: update.new_display_views
        });
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 UPDATE SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status !== 'success');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log('\n');
    
    if (successful.length > 0) {
      console.log('✅ Successfully Updated:');
      successful.forEach(r => {
        console.log(`   ${r.name}: ${r.old_display_views} → ${r.new_display_views} views`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Updates:');
      failed.forEach(r => {
        console.log(`   ${r.name}: ${r.error || r.status}`);
      });
    }
    
    console.log('\n🎉 Update process complete!');
    
  } catch (error) {
    console.error('❌ Update process failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run update
updateCharacterViews()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

