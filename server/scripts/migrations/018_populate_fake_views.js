/**
 * Migration 018: Populate fake_views for all characters
 * 
 * This script calculates and populates fake_views based on current total_views:
 * - 0-9 views → Random 100-1000
 * - 10-100 views → Random 1700-5000
 * - 101-199 views → Random 1100-2700
 * - 200+ views → Random 10000-20000
 * 
 * Ensures no more than 5 characters share the same display_views value.
 */

import 'dotenv/config';
import { supabase } from '../../config/supabase.js';

/**
 * Calculate fake views based on total views
 */
function calculateFakeViews(totalViews) {
  if (totalViews === 0 || (totalViews >= 1 && totalViews <= 9)) {
    // 0-9 views → Random 100-1000
    return Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
  } else if (totalViews >= 10 && totalViews <= 100) {
    // 10-100 views → Random 1700-5000
    return Math.floor(Math.random() * (5000 - 1700 + 1)) + 1700;
  } else if (totalViews >= 101 && totalViews <= 199) {
    // 101-199 views → Random 1100-2700
    return Math.floor(Math.random() * (2700 - 1100 + 1)) + 1100;
  } else if (totalViews >= 200) {
    // 200+ views → Random 10000-20000
    return Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
  }
  return 0; // Fallback
}

/**
 * Ensure no more than maxDuplicates characters share the same display_views
 */
function ensureUniqueness(characters, maxDuplicates = 5) {
  const displayViewsCount = new Map();
  const adjusted = [];
  
  // First pass: calculate initial fake_views
  characters.forEach(char => {
    char.fake_views = calculateFakeViews(char.total_views);
    const displayViews = char.total_views + char.fake_views;
    displayViewsCount.set(displayViews, (displayViewsCount.get(displayViews) || 0) + 1);
    adjusted.push(char);
  });
  
  // Second pass: adjust if duplicates exceed limit
  adjusted.forEach(char => {
    const displayViews = char.total_views + char.fake_views;
    const count = displayViewsCount.get(displayViews) || 0;
    
    if (count > maxDuplicates) {
      // Adjust fake_views to make it unique
      let attempts = 0;
      let newFakeViews = char.fake_views;
      
      while (attempts < 100) { // Max 100 attempts to avoid infinite loop
        const adjustment = Math.floor(Math.random() * 50) + 1; // 1-50
        newFakeViews = char.fake_views + adjustment;
        const newDisplayViews = char.total_views + newFakeViews;
        
        const newCount = displayViewsCount.get(newDisplayViews) || 0;
        if (newCount < maxDuplicates) {
          // Update counts
          displayViewsCount.set(displayViews, count - 1);
          displayViewsCount.set(newDisplayViews, newCount + 1);
          char.fake_views = newFakeViews;
          break;
        }
        attempts++;
      }
      
      if (attempts >= 100) {
        console.warn(`⚠️ Could not make unique for character ${char.character_id} after 100 attempts`);
      }
    }
  });
  
  return adjusted;
}

/**
 * Main migration function
 */
async function populateFakeViews() {
  console.log('🚀 Starting fake_views population migration...\n');
  
  try {
    // Step 1: Fetch all characters from character_view_counts
    console.log('📊 Fetching all characters from character_view_counts...');
    const { data: characters, error: fetchError } = await supabase
      .from('character_view_counts')
      .select('character_id, total_views, fake_views')
      .order('total_views', { ascending: false });
    
    if (fetchError) {
      throw new Error(`Failed to fetch characters: ${fetchError.message}`);
    }
    
    if (!characters || characters.length === 0) {
      console.log('⚠️ No characters found in character_view_counts table');
      return;
    }
    
    console.log(`✅ Found ${characters.length} characters\n`);
    
    // Step 2: Calculate fake_views for each character
    console.log('🧮 Calculating fake_views based on total_views...');
    const charactersWithFakeViews = ensureUniqueness(characters);
    
    // Step 3: Group by view count ranges for reporting
    const stats = {
      '0-9': 0,
      '10-100': 0,
      '101-199': 0,
      '200+': 0
    };
    
    charactersWithFakeViews.forEach(char => {
      if (char.total_views === 0 || (char.total_views >= 1 && char.total_views <= 9)) {
        stats['0-9']++;
      } else if (char.total_views >= 10 && char.total_views <= 100) {
        stats['10-100']++;
      } else if (char.total_views >= 101 && char.total_views <= 199) {
        stats['101-199']++;
      } else if (char.total_views >= 200) {
        stats['200+']++;
      }
    });
    
    console.log('\n📈 Statistics:');
    console.log(`  Characters with 0-9 views: ${stats['0-9']}`);
    console.log(`  Characters with 10-100 views: ${stats['10-100']}`);
    console.log(`  Characters with 101-199 views: ${stats['101-199']}`);
    console.log(`  Characters with 200+ views: ${stats['200+']}\n`);
    
    // Step 4: Update database in batches
    console.log('💾 Updating database with fake_views...');
    const batchSize = 100;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < charactersWithFakeViews.length; i += batchSize) {
      const batch = charactersWithFakeViews.slice(i, i + batchSize);
      
      // Prepare updates
      const updates = batch.map(char => ({
        character_id: char.character_id,
        fake_views: char.fake_views
      }));
      
      // Update in batch using upsert
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('character_view_counts')
          .update({ fake_views: update.fake_views })
          .eq('character_id', update.character_id);
        
        if (updateError) {
          console.error(`❌ Error updating ${update.character_id}:`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      }
      
      // Progress indicator
      if ((i + batchSize) % 500 === 0 || i + batchSize >= charactersWithFakeViews.length) {
        console.log(`  Progress: ${Math.min(i + batchSize, charactersWithFakeViews.length)}/${charactersWithFakeViews.length}`);
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`  Updated: ${updated} characters`);
    console.log(`  Errors: ${errors}`);
    
    // Step 5: Verify uniqueness constraint
    console.log('\n🔍 Verifying uniqueness constraint...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('character_view_counts')
      .select('character_id, total_views, fake_views');
    
    if (!verifyError && verifyData) {
      const displayViewsMap = new Map();
      verifyData.forEach(char => {
        const displayViews = char.total_views + char.fake_views;
        displayViewsMap.set(displayViews, (displayViewsMap.get(displayViews) || 0) + 1);
      });
      
      // Find duplicates exceeding limit
      const duplicates = Array.from(displayViewsMap.entries())
        .filter(([_, count]) => count > 5)
        .map(([displayViews, count]) => ({ displayViews, count }));
      
      if (duplicates.length > 0) {
        console.warn(`⚠️ Found ${duplicates.length} display_views values with more than 5 characters:`);
        duplicates.slice(0, 10).forEach(dup => {
          console.warn(`  display_views=${dup.displayViews}: ${dup.count} characters`);
        });
      } else {
        console.log('✅ Uniqueness constraint verified: No display_views value has more than 5 characters');
      }
    }
    
    console.log('\n🎉 Fake views population complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run migration
populateFakeViews()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

