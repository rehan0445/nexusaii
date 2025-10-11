#!/usr/bin/env node
/**
 * Set Default Typing Speeds for Characters Based on Personality
 * 
 * This script analyzes character personalities and sets appropriate typing speeds:
 * - Fast (30ms/char): Energetic, playful, excitable characters
 * - Normal (50ms/char): Default for balanced personalities
 * - Slow (80ms/char): Calm, thoughtful, reserved characters
 */

import { supabase } from '../config/supabase.js';

// Character name to typing speed mapping (based on known personalities)
const CHARACTER_SPEEDS = {
  // Fast typers (30ms) - Energetic, playful, excitable
  'Luffy': 30,
  'Naruto': 30,
  'Goku': 30,
  'Bakugo': 30,
  'Deadpool': 30,
  'Sonic': 30,
  'Spider-Man': 30,
  'Deku': 35,
  'Usopp': 35,
  'Sanji': 35,
  
  // Slow typers (80ms) - Calm, thoughtful, reserved
  'Itachi': 80,
  'L': 80,
  'Kakashi': 75,
  'Levi': 75,
  'Light Yagami': 75,
  'Sebastian': 75,
  'Byakuya': 75,
  'Aizen': 80,
  'Madara': 75,
  'Sasuke': 70,
  
  // Normal typers (50ms) - Balanced personalities
  'Default': 50
};

// Personality trait to speed mapping
const TRAIT_SPEEDS = {
  energetic: 30,
  playful: 35,
  excitable: 35,
  hyperactive: 30,
  chaotic: 35,
  
  calm: 75,
  thoughtful: 75,
  reserved: 80,
  stoic: 80,
  analytical: 75,
  intellectual: 70,
  mysterious: 75,
  
  // Moderate speeds
  friendly: 50,
  kind: 55,
  supportive: 55,
  caring: 55
};

async function setTypingSpeed(characterName, speed) {
  try {
    // Update companion_context for this character
    const { data, error } = await supabase
      .from('companion_context')
      .update({ typing_speed: speed })
      .ilike('character_id', `%${characterName}%`)
      .select();

    if (error) {
      console.error(`❌ Error setting speed for ${characterName}:`, error.message);
      return { success: false, updated: 0 };
    }

    return { success: true, updated: data?.length || 0 };
  } catch (err) {
    console.error(`❌ Exception setting speed for ${characterName}:`, err);
    return { success: false, updated: 0 };
  }
}

async function analyzePersonality(personality) {
  if (!personality || typeof personality !== 'object') {
    return 50; // Default speed
  }

  const traits = personality.traits || [];
  const style = personality.speakingStyle || '';
  
  // Check for specific traits
  for (const trait of traits) {
    const lowerTrait = trait.toLowerCase();
    if (TRAIT_SPEEDS[lowerTrait]) {
      return TRAIT_SPEEDS[lowerTrait];
    }
  }

  // Check speaking style for clues
  const styleLower = style.toLowerCase();
  if (styleLower.includes('fast') || styleLower.includes('quick') || styleLower.includes('energetic')) {
    return 30;
  }
  if (styleLower.includes('slow') || styleLower.includes('calm') || styleLower.includes('measured')) {
    return 75;
  }

  return 50; // Default
}

async function setAllCharacterSpeeds() {
  console.log('🎭 Setting typing speeds for characters...\n');

  let totalUpdated = 0;
  let processed = 0;

  // 1. Set speeds for known characters
  console.log('📝 Setting speeds for known characters:');
  for (const [name, speed] of Object.entries(CHARACTER_SPEEDS)) {
    if (name === 'Default') continue;
    
    const result = await setTypingSpeed(name, speed);
    if (result.success && result.updated > 0) {
      console.log(`  ✅ ${name}: ${speed}ms (${result.updated} rows updated)`);
      totalUpdated += result.updated;
      processed++;
    }
  }

  // 2. Get all characters from chatbot_models table
  console.log('\n📝 Analyzing characters from database:');
  try {
    const { data: characters, error } = await supabase
      .from('chatbot_models')
      .select('id, name, personality');

    if (error) {
      console.error('❌ Error fetching characters:', error.message);
    } else if (characters && characters.length > 0) {
      for (const char of characters) {
        // Skip if already set
        if (CHARACTER_SPEEDS[char.name]) {
          continue;
        }

        const speed = await analyzePersonality(char.personality);
        const result = await setTypingSpeed(char.name, speed);
        
        if (result.success && result.updated > 0) {
          const speedType = speed <= 35 ? 'fast' : speed >= 70 ? 'slow' : 'normal';
          console.log(`  ✅ ${char.name}: ${speed}ms (${speedType}, ${result.updated} rows)`);
          totalUpdated += result.updated;
          processed++;
        }
      }
    }
  } catch (err) {
    console.error('❌ Error analyzing characters:', err);
  }

  // 3. Set default speed for any remaining rows
  console.log('\n📝 Setting default speed for remaining companion contexts:');
  try {
    const { data, error } = await supabase
      .from('companion_context')
      .update({ typing_speed: 50 })
      .is('typing_speed', null)
      .select();

    if (error) {
      console.error('❌ Error setting defaults:', error.message);
    } else if (data && data.length > 0) {
      console.log(`  ✅ Set default speed (50ms) for ${data.length} rows`);
      totalUpdated += data.length;
    }
  } catch (err) {
    console.error('❌ Error setting defaults:', err);
  }

  console.log(`\n✅ Complete! Updated ${totalUpdated} companion context rows.`);
  console.log(`📊 Processed ${processed} unique characters.`);
  
  // Display speed distribution
  console.log('\n📊 Typing Speed Distribution:');
  console.log('  Fast (30-35ms):   Energetic characters (Luffy, Naruto, Goku, etc.)');
  console.log('  Normal (50ms):    Balanced personalities (default)');
  console.log('  Slow (70-80ms):   Calm, thoughtful characters (Itachi, L, Kakashi, etc.)');
}

// Run the script
setAllCharacterSpeeds()
  .then(() => {
    console.log('\n✨ Typing speeds successfully configured!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

