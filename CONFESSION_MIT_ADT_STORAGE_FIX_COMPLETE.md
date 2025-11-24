# Confession Storage Fix Complete - All Data in confession_mit_adt

## Executive Summary

Successfully fixed the confession storage system to ensure **ALL confessions and related data are stored exclusively in the `confessions_mit_adt` table** in Supabase. All backend endpoints have been updated to use the correct tables with proper foreign key relationships.

---

## Task 1: Database Schema Audit & Enhancement ✅

### Current Schema (confessions_mit_adt)

The table now includes all required columns:

**Essential Columns:**
- `id` (TEXT, PRIMARY KEY)
- `confession_text` (TEXT) - Main confession content
- `content` (TEXT) - Legacy field, kept for compatibility
- `author_id` (UUID, nullable)
- `campus` (TEXT, default 'mit_adt', CHECK constraint ensures it's always 'mit_adt')
- `created_at` (TIMESTAMP, default NOW())
- `updated_at` (TIMESTAMPTZ, default NOW())
- `is_anonymous` (BOOLEAN, default TRUE)

**Engagement Columns:**
- `upvotes` (INTEGER, default 0)
- `downvotes` (INTEGER, default 0)
- `comment_count` (INTEGER, default 0)
- `replies_count` (INTEGER, default 0) - Legacy field, kept for compatibility
- `is_trending` (BOOLEAN, default FALSE)
- `trending_score` (NUMERIC, default 0)
- `score` (INTEGER, default 0) - Calculated as upvotes - downvotes

**Other Columns:**
- `alias` (JSONB)
- `session_id` (TEXT)
- `reactions` (JSONB, default '{}')
- `poll` (JSONB)
- `is_explicit` (BOOLEAN, default FALSE)
- `user_name`, `user_email`, `anonymous_name` (TEXT)
- `avatar`, `uploads`, `search_history` (JSONB)

### Indexes Created:
- `idx_confessions_mit_adt_trending_score` - For trending queries
- `idx_confessions_mit_adt_is_trending` - For filtering trending confessions
- `idx_confessions_mit_adt_created_at` - For chronological sorting
- `idx_confessions_mit_adt_campus` - For campus filtering

---

## Task 2: Related Tables Created ✅

### confession_comments_mit_adt

Stores all comments for confessions in `confessions_mit_adt`:

```sql
CREATE TABLE confession_comments_mit_adt (
  id TEXT PRIMARY KEY,
  confession_id TEXT NOT NULL REFERENCES confessions_mit_adt(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT,
  session_id TEXT,
  alias JSONB,
  parent_comment_id TEXT, -- For nested comments
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Indexes:**
- `idx_confession_comments_mit_adt_confession_id` - For fetching comments by confession
- `idx_confession_comments_mit_adt_parent` - For nested comment queries

### confession_reactions_mit_adt

Stores individual user reactions (upvotes/downvotes):

```sql
CREATE TABLE confession_reactions_mit_adt (
  confession_id TEXT NOT NULL REFERENCES confessions_mit_adt(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (confession_id, session_id) -- One reaction per user per confession
);
```

**Indexes:**
- `idx_confession_reactions_mit_adt_confession_id` - For fetching reactions by confession
- `idx_confession_reactions_mit_adt_session_id` - For user reaction queries

---

## Task 3: Backend API Fixes ✅

### POST /api/confessions - Create Confession

**Fixed to store in `confessions_mit_adt`:**

```javascript
const table = 'confessions_mit_adt';
const campusCode = 'mit_adt';

await supabase.from(table).insert({
  id,
  content: confession.content,
  confession_text: confession.content, // Store in both fields
  campus: campusCode, // Always 'mit_adt'
  upvotes: 0,
  downvotes: 0,
  comment_count: 0,
  is_trending: false,
  trending_score: 0,
  is_anonymous: isAnonymous,
  // ... other fields
});
```

**Status Codes:**
- `201` - Success (returns confession data)
- `400` - Invalid input (missing content, invalid poll, etc.)
- `500` - Database error

### POST /api/confessions/:id/reply - Add Comment

**Fixed to store in `confession_comments_mit_adt`:**

```javascript
await supabase.from("confession_comments_mit_adt").insert({
  id: reply.id,
  confession_id: reply.confessionId,
  content: reply.content,
  session_id: reply.sessionId,
  parent_comment_id: reply.parentId || null,
  // ... other fields
});

// Auto-updates comment_count in confessions_mit_adt (via trigger)
```

**Status Codes:**
- `201` - Success
- `400` - Invalid content
- `404` - Confession not found
- `500` - Database error

### POST /api/confessions/:id/vote - Upvote/Downvote

**Fixed to use `confession_reactions_mit_adt`:**

```javascript
// Upsert reaction
await supabase.from('confession_reactions_mit_adt').upsert({
  confession_id: id,
  session_id: voter,
  reaction_type: newReactionType, // 'upvote' or 'downvote'
  // ...
}, { onConflict: 'confession_id,session_id' });

// Update upvotes/downvotes in confessions_mit_adt
await supabase.from('confessions_mit_adt').update({
  upvotes: newUpvotes,
  downvotes: newDownvotes,
  score: newScore
}).eq('id', id);
```

**Status Codes:**
- `200` - Success (returns updated counts)
- `400` - Invalid direction or missing sessionId
- `404` - Confession not found
- `500` - Database error

### GET /api/confessions/:id/replies - Fetch Comments

**Fixed to fetch from `confession_comments_mit_adt`:**

```javascript
const { data: comments } = await supabase
  .from('confession_comments_mit_adt')
  .select('*')
  .eq('confession_id', id)
  .order('created_at', { ascending: true });
```

---

## Task 4: Database Triggers ✅

### Auto-Update Comment Count

**Trigger:** `trigger_update_confession_comment_count`

Automatically increments/decrements `comment_count` and `replies_count` when comments are added/deleted:

```sql
CREATE TRIGGER trigger_update_confession_comment_count
  AFTER INSERT OR DELETE ON confession_comments_mit_adt
  FOR EACH ROW
  EXECUTE FUNCTION update_confession_comment_count();
```

### Auto-Recalculate Trending Score

**Trigger:** `trigger_recalculate_trending_on_reaction` and `trigger_recalculate_trending_on_comment`

Automatically recalculates `trending_score` and sets `is_trending` flag:

```sql
-- Trending score formula: (upvotes - downvotes) + (comment_count * 2)
-- is_trending = TRUE if trending_score >= 10
```

**Triggers:**
- Fires on INSERT/UPDATE/DELETE in `confession_reactions_mit_adt`
- Fires on INSERT/DELETE in `confession_comments_mit_adt`

### Auto-Update Updated At

**Trigger:** `trigger_update_confession_updated_at`

Automatically updates `updated_at` timestamp on any row update:

```sql
CREATE TRIGGER trigger_update_confession_updated_at
  BEFORE UPDATE ON confessions_mit_adt
  FOR EACH ROW
  EXECUTE FUNCTION update_confession_updated_at();
```

---

## Task 5: Testing ✅

### Test Flow

1. **Create Confession:**
   ```bash
   POST /api/confessions
   {
     "content": "Test confession",
     "sessionId": "test-session-123"
   }
   ```
   ✅ Verifies: Confession stored in `confessions_mit_adt` with `campus='mit_adt'`

2. **Add Comment:**
   ```bash
   POST /api/confessions/{id}/reply
   {
     "content": "Test comment",
     "sessionId": "test-session-123"
   }
   ```
   ✅ Verifies: 
   - Comment stored in `confession_comments_mit_adt`
   - `comment_count` auto-incremented in `confessions_mit_adt`
   - `trending_score` recalculated

3. **Add Upvote:**
   ```bash
   POST /api/confessions/{id}/vote
   {
     "direction": 1,
     "sessionId": "test-session-123"
   }
   ```
   ✅ Verifies:
   - Reaction stored in `confession_reactions_mit_adt`
   - `upvotes` incremented in `confessions_mit_adt`
   - `score` updated (upvotes - downvotes)
   - `trending_score` recalculated

4. **Verify Data:**
   ```sql
   SELECT id, confession_text, upvotes, downvotes, comment_count, 
          is_trending, trending_score, campus
   FROM confessions_mit_adt
   WHERE id = '{confession_id}';
   ```
   ✅ All data correctly stored and calculated

---

## Migration Files Created

1. **fix_confession_mit_adt_schema.sql** - Adds missing columns and constraints
2. **create_confession_mit_adt_related_tables.sql** - Creates comments and reactions tables
3. **create_confession_mit_adt_triggers.sql** - Creates all auto-update triggers

---

## Key Changes Summary

### Backend Changes (`server/routes/confessions.js`)

1. **POST /** - Changed from `confessions` to `confessions_mit_adt`
2. **POST /:id/reply** - Changed from legacy tables to `confession_comments_mit_adt`
3. **POST /:id/vote** - Changed from `confession_votes` to `confession_reactions_mit_adt`
4. **GET /:id/replies** - Changed to fetch from `confession_comments_mit_adt`
5. **fetchConfessionFromSupabase** - Changed to query `confessions_mit_adt`

### Database Changes

1. Added columns: `confession_text`, `upvotes`, `downvotes`, `comment_count`, `is_trending`, `trending_score`, `is_anonymous`
2. Created tables: `confession_comments_mit_adt`, `confession_reactions_mit_adt`
3. Created triggers: Auto-update comment_count, trending_score, updated_at
4. Added indexes: For performance on trending queries and comment fetching

---

## Verification Queries

### Check Confession Storage
```sql
SELECT COUNT(*) as total_confessions, 
       COUNT(*) FILTER (WHERE campus = 'mit_adt') as mit_adt_confessions
FROM confessions_mit_adt;
```

### Check Comments
```sql
SELECT c.id, c.confession_text, COUNT(cm.id) as comment_count
FROM confessions_mit_adt c
LEFT JOIN confession_comments_mit_adt cm ON c.id = cm.confession_id
GROUP BY c.id, c.confession_text
LIMIT 10;
```

### Check Reactions
```sql
SELECT c.id, c.confession_text, 
       COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'upvote') as upvotes,
       COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'downvote') as downvotes
FROM confessions_mit_adt c
LEFT JOIN confession_reactions_mit_adt cr ON c.id = cr.confession_id
GROUP BY c.id, c.confession_text
LIMIT 10;
```

### Check Trending
```sql
SELECT id, confession_text, trending_score, is_trending
FROM confessions_mit_adt
WHERE is_trending = TRUE
ORDER BY trending_score DESC
LIMIT 10;
```

---

## Status: ✅ COMPLETE

All confessions and related data are now stored exclusively in `confessions_mit_adt` with proper foreign key relationships, auto-updating triggers, and working backend endpoints.

