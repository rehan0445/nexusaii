/**
 * Find characters by view count and update their fake_views
 * This approach searches character_view_counts directly by total_views
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

async function findAndUpdateCharacterViews() {
  console.log('🚀 Finding and updating character views by view count...\n');
  
  try {
    const results = [];
    
    for (const update of characterUpdates) {
      console.log(`📝 Processing: ${update.name}`);
      console.log(`   Searching for character with total_views ≈ ${update.current_views}`);
      
      // Search for characters with similar view counts (within 50 views to account for recent views)
      const viewRange = 50;
      const minViews = Math.max(0, update.current_views - viewRange);
      const maxViews = update.current_views + viewRange;
      
      const { data: viewData, error: viewError } = await supabase
        .from('character_view_counts')
        .select('character_id, total_views, fake_views')
        .gte('total_views', minViews)
        .lte('total_views', maxViews)
        .order('total_views', { ascending: false });
      
      if (viewError) {
        console.log(`   ❌ Error searching: ${viewError.message}`);
        results.push({
          name: update.name,
          status: 'error',
          error: viewError.message
        });
        continue;
      }
      
      if (!viewData || viewData.length === 0) {
        console.log(`   ⚠️  No characters found with total_views between ${minViews} and ${maxViews}`);
        results.push({
          name: update.name,
          status: 'not_found',
          error: 'No character found with matching view count'
        });
        continue;
      }
      
      // Find the closest match
      let bestMatch = viewData[0];
      let minDiff = Math.abs(bestMatch.total_views - update.current_views);
      
      for (const char of viewData) {
        const diff = Math.abs(char.total_views - update.current_views);
        if (diff < minDiff) {
          minDiff = diff;
          bestMatch = char;
        }
      }
      
      // If difference is too large, skip
      if (minDiff > 100) {
        console.log(`   ⚠️  Closest match has total_views=${bestMatch.total_views} (diff: ${minDiff}), skipping`);
        results.push({
          name: update.name,
          status: 'no_close_match',
          error: `Closest match has ${bestMatch.total_views} views (expected ${update.current_views})`
        });
        continue;
      }
      
      console.log(`   ✅ Found character_id: ${bestMatch.character_id}`);
      console.log(`   Current: total_views=${bestMatch.total_views}, fake_views=${bestMatch.fake_views || 0}`);
      
      // Calculate new fake_views
      const currentTotalViews = bestMatch.total_views;
      const newFakeViews = update.new_display_views - currentTotalViews;
      const currentDisplayViews = currentTotalViews + (bestMatch.fake_views || 0);
      
      console.log(`   Updating: fake_views=${bestMatch.fake_views || 0} → ${newFakeViews}`);
      console.log(`   Display views: ${currentDisplayViews} → ${update.new_display_views}`);
      
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
          old_display_views: currentDisplayViews,
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
findAndUpdateCharacterViews()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

