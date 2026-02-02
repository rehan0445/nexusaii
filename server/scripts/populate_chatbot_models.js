import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables FIRST
config({ path: path.join(process.cwd(), 'server', '.env') });

// Now import supabase after env is loaded
import { supabase } from '../config/supabase.js';

async function populateChatbotModels() {
  try {
    console.log('🚀 Starting to populate chatbot_models table...');

    // For now, let's create a simple test record to make sure the table exists and works
    const testCharacter = {
      name: 'Test Character',
      role: 'Test Role',
      image: 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg',
      description: 'A test character for database verification',
      tags: ['test'],
      languages: { primary: 'English' },
      personality: {
        traits: ['test'],
        quirks: ['test'],
        emotionalStyle: 'test',
        speakingStyle: 'test',
        interests: ['test'],
        background: 'test'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📦 Testing database connection with a single record...');

    // Clear existing data first
    console.log('🗑️ Clearing existing chatbot models...');
    const { error: deleteError } = await supabase
      .from('chatbot_models')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('❌ Error deleting existing records:', deleteError.message);
      console.log('💡 This might mean the table doesn\'t exist yet. Let\'s try creating it...');

      // Try to create the table first
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS chatbot_models (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          image TEXT NOT NULL,
          description TEXT NOT NULL,
          tags TEXT[] DEFAULT '{}',
          languages JSONB,
          personality JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.error('❌ Error creating table:', createError.message);
        console.log('💡 You may need to create the table manually in Supabase or run the SQL script');
        return;
      }
    }

    // Insert test record
    const { error } = await supabase
      .from('chatbot_models')
      .insert([testCharacter]);

    if (error) {
      console.error('❌ Error inserting test record:', error.message);
      console.log('💡 Database table creation may be needed');
    } else {
      console.log('✅ Test record inserted successfully');
      console.log('📋 Database connection and table are working');
    }

  } catch (error) {
    console.error('💥 Unexpected error during population:', error.message);
    console.error(error.stack);
  }
}

// Run the population function
populateChatbotModels();
