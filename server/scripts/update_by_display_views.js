/**
 * Update characters by matching their current display_views
 * This assumes the user provided display_views (not total_views)
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';

// Character updates: { name, current_display_views, new_display_views }
const characterUpdates = [
  { name: 'gojo satoru', current_display_views: 4778, new_display_views: 9347 },
  { name: 'mikasa akerman', current_display_views: 3436, new_display_views: 7899 },
  { name: 'rias gremory', current_display_views: 2987, new_display_views: 6671 },
  { name: 'kai young', current_display_views: 2490, new_display_views: 4610 },
  { name: 'deadpool', current_display_views: 0, new_display_views: 7201 },
  { name: 'the joker', current_display_views: 2177, new_display_views: 5765 },
  { name: 'ironmouse', current_display_views: 442, new_display_views: 3991 },
  { name: 'ada wong', current_display_views: 643, new_display_views: 6719 },
  { name: 'zade meadows', current_display_views: 820, new_display_views: 6013 },
  { name: 'yelan', current_display_views: 670, new_display_views: 8971 },
];

async function updateByDisplayViews() {
  console.log('🚀 Finding characters by display_views and updating...\n');
  
  try {
    // First, get all characters with their display_views
    const { data: allCharacters, error: fetchError } = await supabase
      .from('character_view_counts')
      .select('character_id, total_views, fake_views');
    
    if (fetchError) {
      throw new Error(`Failed to fetch characters: ${fetchError.message}`);
    }
    
    // Calculate display_views for all
    const charactersWithDisplay = (allCharacters || []).map(char => ({
      ...char,
      display_views: (char.total_views || 0) + (char.fake_views || 0)
    }));
    
    const results = [];
    
    for (const update of characterUpdates) {
      console.log(`📝 Processing: ${update.name}`);
      console.log(`   Searching for character with display_views ≈ ${update.current_display_views}`);
      
      // Find characters with similar display_views (within 100 to account for variations)
      const viewRange = 100;
      const matches = charactersWithDisplay.filter(char => {
        const diff = Math.abs(char.display_views - update.current_display_views);
        return diff <= viewRange;
      });
      
      if (matches.length === 0) {
        console.log(`   ⚠️  No characters found with display_views near ${update.current_display_views}`);
        results.push({
          name: update.name,
          status: 'not_found',
          error: 'No character found with matching display_views'
        });
        continue;
      }
      
      // Find the closest match
      let bestMatch = matches[0];
      let minDiff = Math.abs(bestMatch.display_views - update.current_display_views);
      
      for (const char of matches) {
        const diff = Math.abs(char.display_views - update.current_display_views);
        if (diff < minDiff) {
          minDiff = diff;
          bestMatch = char;
        }
      }
      
      console.log(`   ✅ Found character_id: ${bestMatch.character_id}`);
      console.log(`   Current: total_views=${bestMatch.total_views}, fake_views=${bestMatch.fake_views || 0}, display_views=${bestMatch.display_views}`);
      
      // Calculate new fake_views
      // display_views = total_views + fake_views
      // fake_views = desired_display_views - total_views
      const newFakeViews = update.new_display_views - bestMatch.total_views;
      
      console.log(`   Updating: fake_views=${bestMatch.fake_views || 0} → ${newFakeViews}`);
      console.log(`   Display views: ${bestMatch.display_views} → ${update.new_display_views}`);
      
      // Update fake_views
      const { error: updateError } = await supabase
        .from('character_view_counts')
        .update({ fake_views: newFakeViews })
        .eq('character_id', bestMatch.character_id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        results.push({
          name: update.name,
          character_id: bestMatch.character_id,
          status: 'error',
          error: updateError.message
        });
      } else {
        console.log(`   ✅ Updated successfully!`);
        results.push({
          name: update.name,
          character_id: bestMatch.character_id,
          status: 'success',
          old_fake_views: bestMatch.fake_views || 0,
          new_fake_views: newFakeViews,
          old_display_views: bestMatch.display_views,
          new_display_views: update.new_display_views
        });
      }
      
      console.log(''); // Empty line
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
        console.log(`   ${r.name} (${r.character_id}): ${r.old_display_views} → ${r.new_display_views} views`);
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
updateByDisplayViews()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

