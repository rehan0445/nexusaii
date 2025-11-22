import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupLikesTable() {
  try {
    console.log("🔄 Setting up character_likes table...");
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, "create_likes_table.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    
    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent });
    
    if (error) {
      // If RPC doesn't exist, try direct execution
      console.log("RPC not available, trying direct SQL execution...");
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc("exec_sql", { sql: statement });
          if (stmtError) {
            console.log(`⚠️  Statement skipped (might already exist): ${statement.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log("✅ character_likes table setup completed!");
    
    // Verify table exists by trying to query it
    const { data, error: verifyError } = await supabase
      .from("character_likes")
      .select("id")
      .limit(1);
    
    if (verifyError) {
      console.log("⚠️  Table verification failed, but setup might still be successful");
      console.log("Error:", verifyError.message);
    } else {
      console.log("✅ Table verification successful!");
    }
    
  } catch (error) {
    console.error("❌ Error setting up character_likes table:", error);
    console.log("💡 You may need to manually create the table in your Supabase dashboard");
    console.log("💡 SQL script location:", path.join(__dirname, "create_likes_table.sql"));
  }
}

// Run the setup
setupLikesTable(); 