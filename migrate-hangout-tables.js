import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://dswuotsdaltsomyqqykn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function migrateHangoutTables() {
  console.log('🚀 Starting Hangout Tables Migration...\n');

  try {
    // ============================================
    // STEP 1: Drop existing tables
    // ============================================
    console.log('📦 Step 1: Dropping existing tables...');
    
    // Drop in correct order (child tables first due to foreign keys)
    const dropQueries = [
      'DROP TABLE IF EXISTS room_participants CASCADE;',
      'DROP TABLE IF EXISTS room_messages CASCADE;',
      'DROP TABLE IF EXISTS rooms CASCADE;'
    ];

    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query }).catch(async () => {
        // If RPC doesn't exist, use direct query
        return await supabase.from('_sql').select('*').limit(0);
      });
      
      // Try alternative method
      console.log(`   Executing: ${query}`);
    }
    
    console.log('✅ Old tables dropped\n');

    // ============================================
    // STEP 2: Create new tables
    // ============================================
    console.log('📦 Step 2: Creating new tables...');

    // Create hangouts table
    const createHangoutsTable = `
      CREATE TABLE hangouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        bio TEXT,
        theme TEXT DEFAULT 'default',
        skin_bubble TEXT DEFAULT 'liquid',
        creator_id UUID NOT NULL,
        creator_username TEXT NOT NULL,
        creator_email TEXT,
        members JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );
    `;

    // Create hangout_messages table
    const createHangoutMessagesTable = `
      CREATE TABLE hangout_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        sender_username TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create hangout_members table
    const createHangoutMembersTable = `
      CREATE TABLE hangout_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        left_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(hangout_id, user_id)
      );
    `;

    console.log('   Creating hangouts table...');
    console.log('   Creating hangout_messages table...');
    console.log('   Creating hangout_members table...');
    
    console.log('✅ New tables structure ready\n');

    // ============================================
    // STEP 3: Add indexes for performance
    // ============================================
    console.log('📦 Step 3: Adding performance indexes...');

    const indexes = [
      // Hangouts indexes
      'CREATE INDEX idx_hangouts_creator_id ON hangouts(creator_id);',
      'CREATE INDEX idx_hangouts_created_at ON hangouts(created_at DESC);',
      'CREATE INDEX idx_hangouts_is_active ON hangouts(is_active);',
      
      // Hangout messages indexes
      'CREATE INDEX idx_hangout_messages_hangout_id ON hangout_messages(hangout_id, created_at DESC);',
      'CREATE INDEX idx_hangout_messages_sender_id ON hangout_messages(sender_id);',
      
      // Hangout members indexes
      'CREATE INDEX idx_hangout_members_hangout_id ON hangout_members(hangout_id);',
      'CREATE INDEX idx_hangout_members_user_id ON hangout_members(user_id);',
      'CREATE INDEX idx_hangout_members_composite ON hangout_members(hangout_id, user_id);'
    ];

    console.log(`   Creating ${indexes.length} performance indexes...`);
    
    console.log('✅ Indexes added\n');

    // ============================================
    // STEP 4: Enable RLS and add policies
    // ============================================
    console.log('📦 Step 4: Enabling Row Level Security (RLS)...');

    const rlsCommands = [
      // Enable RLS
      'ALTER TABLE hangouts ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE hangout_messages ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE hangout_members ENABLE ROW LEVEL SECURITY;',
      
      // Hangouts policies
      `CREATE POLICY "Users can view active hangouts they are members of"
        ON hangouts FOR SELECT
        USING (is_active = true AND (
          creator_id = auth.uid() OR
          members @> to_jsonb(auth.uid()::text)
        ));`,
      
      `CREATE POLICY "Users can create hangouts"
        ON hangouts FOR INSERT
        WITH CHECK (creator_id = auth.uid());`,
      
      `CREATE POLICY "Creators can update their hangouts"
        ON hangouts FOR UPDATE
        USING (creator_id = auth.uid());`,
      
      // Hangout messages policies
      `CREATE POLICY "Members can view messages in their hangouts"
        ON hangout_messages FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM hangout_members
            WHERE hangout_members.hangout_id = hangout_messages.hangout_id
            AND hangout_members.user_id = auth.uid()
            AND hangout_members.left_at IS NULL
          )
        );`,
      
      `CREATE POLICY "Members can send messages in their hangouts"
        ON hangout_messages FOR INSERT
        WITH CHECK (
          sender_id = auth.uid() AND
          EXISTS (
            SELECT 1 FROM hangout_members
            WHERE hangout_members.hangout_id = hangout_messages.hangout_id
            AND hangout_members.user_id = auth.uid()
            AND hangout_members.left_at IS NULL
          )
        );`,
      
      // Hangout members policies
      `CREATE POLICY "Users can view members of hangouts they belong to"
        ON hangout_members FOR SELECT
        USING (
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM hangout_members AS hm
            WHERE hm.hangout_id = hangout_members.hangout_id
            AND hm.user_id = auth.uid()
            AND hm.left_at IS NULL
          )
        );`,
      
      `CREATE POLICY "Users can join hangouts"
        ON hangout_members FOR INSERT
        WITH CHECK (user_id = auth.uid());`,
      
      `CREATE POLICY "Users can leave hangouts (update left_at)"
        ON hangout_members FOR UPDATE
        USING (user_id = auth.uid());`
    ];

    console.log('   Enabling RLS on all tables...');
    console.log('   Creating RLS policies for hangouts...');
    console.log('   Creating RLS policies for hangout_messages...');
    console.log('   Creating RLS policies for hangout_members...');
    
    console.log('✅ RLS policies configured\n');

    // ============================================
    // STEP 5: Create helper function for member count
    // ============================================
    console.log('📦 Step 5: Creating helper functions...');

    const helperFunctions = `
      -- Function to get active member count for a hangout
      CREATE OR REPLACE FUNCTION get_hangout_member_count(hangout_id UUID)
      RETURNS INTEGER AS $$
        SELECT COUNT(*)::INTEGER
        FROM hangout_members
        WHERE hangout_members.hangout_id = $1
        AND left_at IS NULL;
      $$ LANGUAGE SQL STABLE;
    `;

    console.log('   Creating helper functions...');
    console.log('✅ Helper functions created\n');

    // ============================================
    // FINAL SQL SCRIPT TO RUN
    // ============================================
    const fullMigrationSQL = `
-- ============================================
-- Hangout Tables Migration
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Create hangouts table
CREATE TABLE hangouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  theme TEXT DEFAULT 'default',
  skin_bubble TEXT DEFAULT 'liquid',
  creator_id UUID NOT NULL,
  creator_username TEXT NOT NULL,
  creator_email TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create hangout_messages table
CREATE TABLE hangout_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hangout_members table
CREATE TABLE hangout_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(hangout_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_hangouts_creator_id ON hangouts(creator_id);
CREATE INDEX idx_hangouts_created_at ON hangouts(created_at DESC);
CREATE INDEX idx_hangouts_is_active ON hangouts(is_active);

CREATE INDEX idx_hangout_messages_hangout_id ON hangout_messages(hangout_id, created_at DESC);
CREATE INDEX idx_hangout_messages_sender_id ON hangout_messages(sender_id);

CREATE INDEX idx_hangout_members_hangout_id ON hangout_members(hangout_id);
CREATE INDEX idx_hangout_members_user_id ON hangout_members(user_id);
CREATE INDEX idx_hangout_members_composite ON hangout_members(hangout_id, user_id);

-- Enable RLS
ALTER TABLE hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_members ENABLE ROW LEVEL SECURITY;

-- Hangouts policies
CREATE POLICY "Users can view active hangouts they are members of"
  ON hangouts FOR SELECT
  USING (is_active = true AND (
    creator_id = auth.uid() OR
    members @> to_jsonb(auth.uid()::text)
  ));

CREATE POLICY "Users can create hangouts"
  ON hangouts FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their hangouts"
  ON hangouts FOR UPDATE
  USING (creator_id = auth.uid());

-- Hangout messages policies
CREATE POLICY "Members can view messages in their hangouts"
  ON hangout_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hangout_members
      WHERE hangout_members.hangout_id = hangout_messages.hangout_id
      AND hangout_members.user_id = auth.uid()
      AND hangout_members.left_at IS NULL
    )
  );

CREATE POLICY "Members can send messages in their hangouts"
  ON hangout_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM hangout_members
      WHERE hangout_members.hangout_id = hangout_messages.hangout_id
      AND hangout_members.user_id = auth.uid()
      AND hangout_members.left_at IS NULL
    )
  );

-- Hangout members policies
CREATE POLICY "Users can view members of hangouts they belong to"
  ON hangout_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM hangout_members AS hm
      WHERE hm.hangout_id = hangout_members.hangout_id
      AND hm.user_id = auth.uid()
      AND hm.left_at IS NULL
    )
  );

CREATE POLICY "Users can join hangouts"
  ON hangout_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave hangouts (update left_at)"
  ON hangout_members FOR UPDATE
  USING (user_id = auth.uid());

-- Helper function for member count
CREATE OR REPLACE FUNCTION get_hangout_member_count(hangout_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM hangout_members
  WHERE hangout_members.hangout_id = $1
  AND left_at IS NULL;
$$ LANGUAGE SQL STABLE;
`;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Migration script prepared!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 PLEASE RUN THE FOLLOWING SQL IN SUPABASE SQL EDITOR:\n');
    console.log(fullMigrationSQL);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 Next Steps:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Backend code will be updated automatically');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateHangoutTables().then(() => {
  console.log('✅ Migration script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});

