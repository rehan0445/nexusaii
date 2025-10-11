# ============================================
# Fix Companion Hints Error
# ============================================

Write-Host "`n🔧 Fixing Companion Hints Error..." -ForegroundColor Cyan
Write-Host "━" * 60 -ForegroundColor Gray

# Step 1: Create the missing table in Supabase
Write-Host "`n📋 Step 1: Create companion_chat_hints table" -ForegroundColor Yellow
Write-Host "   Please run the following SQL in your Supabase SQL Editor:" -ForegroundColor White
Write-Host ""
Write-Host "   File: FIX_COMPANION_HINTS_TABLE.sql" -ForegroundColor Green
Write-Host "   Location: Project root directory" -ForegroundColor Gray
Write-Host ""
Write-Host "   OR copy and paste this SQL:" -ForegroundColor White
Write-Host "   ━" * 58 -ForegroundColor Gray

$sql = @"

CREATE TABLE IF NOT EXISTS companion_chat_hints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  hint_text TEXT NOT NULL,
  context_messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_companion_hints_user_character 
  ON companion_chat_hints(user_id, character_id);

CREATE INDEX IF NOT EXISTS idx_companion_hints_expires 
  ON companion_chat_hints(expires_at);

ALTER TABLE companion_chat_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own hints" ON companion_chat_hints
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own hints" ON companion_chat_hints
  FOR SELECT USING (auth.uid()::text = user_id);

GRANT SELECT, INSERT, DELETE ON companion_chat_hints TO authenticated;
GRANT SELECT, INSERT, DELETE ON companion_chat_hints TO anon;

"@

Write-Host $sql -ForegroundColor Cyan
Write-Host "   ━" * 58 -ForegroundColor Gray

# Step 2: Restart server
Write-Host "`n📋 Step 2: Restart the server" -ForegroundColor Yellow
Write-Host "   The server code has been updated to handle the error gracefully." -ForegroundColor White
Write-Host ""

$restart = Read-Host "   Do you want to restart the server now? (y/n)"

if ($restart -eq 'y' -or $restart -eq 'Y') {
    Write-Host "`n🔄 Restarting server..." -ForegroundColor Cyan
    
    # Kill existing server processes
    $serverProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*server*" }
    if ($serverProcesses) {
        Write-Host "   Stopping existing server processes..." -ForegroundColor Gray
        $serverProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    
    # Navigate to server directory and start
    Write-Host "   Starting server..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"
    
    Write-Host "`n✅ Server restarted!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Please restart your server manually when ready." -ForegroundColor Yellow
    Write-Host "   Run: cd server && npm start" -ForegroundColor Gray
}

# Step 3: Summary
Write-Host "`n━" * 60 -ForegroundColor Gray
Write-Host "`n✅ Fix Applied!" -ForegroundColor Green
Write-Host ""
Write-Host "What changed:" -ForegroundColor Cyan
Write-Host "  1. ✅ Server endpoint updated to handle missing table gracefully" -ForegroundColor White
Write-Host "  2. ⚠️  Database table needs to be created (run SQL above)" -ForegroundColor Yellow
Write-Host "  3. 💡 Hints will work even if table creation is pending" -ForegroundColor White
Write-Host ""
Write-Host "After creating the table in Supabase:" -ForegroundColor Cyan
Write-Host "  • Hints will be stored in database" -ForegroundColor White
Write-Host "  • Error will disappear" -ForegroundColor White
Write-Host "  • Everything will work normally" -ForegroundColor White
Write-Host ""
Write-Host "Current behavior (before table creation):" -ForegroundColor Cyan
Write-Host "  • Hints will still be generated ✅" -ForegroundColor Green
Write-Host "  • Warning logged in console ⚠️" -ForegroundColor Yellow
Write-Host "  • No error shown to user ✅" -ForegroundColor Green
Write-Host "  • Hints not stored in database ℹ️" -ForegroundColor Blue
Write-Host ""
Write-Host "━" * 60 -ForegroundColor Gray
Write-Host "`n🎉 Done! The hints feature should work now.`n" -ForegroundColor Cyan

