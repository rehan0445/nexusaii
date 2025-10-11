# Dark Room User Tracking Implementation ✅

## Overview

Added comprehensive user tracking to Dark Room while maintaining anonymous display names. This allows for moderation and accountability without compromising the anonymous chat experience.

## Database Changes

### New Columns Added

**`darkroom_messages` table:**
- `user_name` (TEXT) - Actual username for moderation
- `user_email` (TEXT) - User email for moderation  
- `user_id` (TEXT) - User ID from auth system

**`darkroom_room_users` table:**
- `user_name` (TEXT) - Actual username for tracking
- `user_email` (TEXT) - User email for tracking
- `user_id` (TEXT) - User ID from auth system

**`darkroom_rooms` table:**
- `creator_user_name` (TEXT) - Actual creator username
- `creator_user_email` (TEXT) - Creator email
- `creator_user_id` (TEXT) - Creator user ID

### Indexes Created
- `idx_darkroom_messages_user_id` - Fast lookup by user ID
- `idx_darkroom_messages_user_email` - Fast lookup by email
- `idx_darkroom_room_users_user_id` - Fast user tracking
- `idx_darkroom_rooms_creator_user_id` - Fast creator lookup

## Backend Changes

### 1. Service Layer (`server/services/darkroomService.js`)

**Updated `addUserToRoom` method:**
```javascript
static async addUserToRoom(roomId, socketId, alias, userInfo = {}) {
  // Now accepts userInfo parameter with user_name, user_email, user_id
  // Stores tracking info alongside anonymous alias
}
```

### 2. Socket Handlers (`server/app.js`)

**Enhanced `join-room` event:**
- Extracts user info from socket data
- Passes to `addUserToRoom` with tracking info
- Logs tracked user info for moderation
- Maintains anonymous display (alias) for other users

**Enhanced `send-message` event:**
- Captures user info from message data
- Stores in database alongside message
- Anonymous alias still displayed in chat
- User info available for moderation queries

**Enhanced `create-room` event:**
- Tracks creator's real identity
- Stores creator info for accountability
- Anonymous alias shown as "created by"

### 3. API Endpoints (`server/app.js`)

**Updated `/api/v1/darkroom/create-group`:**
- Accepts user tracking parameters
- Stores creator info in database
- Logs tracked information

## Frontend Changes

### 1. Dark Room Tab (`client/src/pages/arena/DarkRoomTab.tsx`)

**Added Auth Context:**
```typescript
import { useAuth } from "../../contexts/AuthContext";
const { currentUser } = useAuth();
```

**Updated Socket Emissions:**

**Join Room:**
```typescript
socket.emit('join-room', { 
  groupId: group.id, 
  alias: darkRoomAlias,
  user_name: currentUser?.displayName || null,
  user_email: currentUser?.email || null,
  user_id: currentUser?.uid || null
});
```

**Send Message:**
```typescript
socket.emit('send-message', {
  groupId: selectedDarkroomGroup.id,
  message: darkroomMessage.trim(),
  alias: darkRoomAlias,
  time: new Date().toISOString(),
  user_name: currentUser?.displayName || null,
  user_email: currentUser?.email || null,
  user_id: currentUser?.uid || null
});
```

**Create Group:**
```typescript
body: JSON.stringify({
  name: createGroupName.trim(),
  description: createGroupDescription.trim(),
  createdBy: darkRoomAlias,
  user_name: currentUser?.displayName || null,
  user_email: currentUser?.email || null,
  user_id: currentUser?.uid || null
})
```

## How It Works

### User Experience (No Change!)
1. User enters Dark Room with anonymous alias (e.g., "Sam", "Capt")
2. Creates or joins groups anonymously
3. Sends messages with anonymous alias
4. **Only the alias is displayed to other users**

### Behind the Scenes (NEW!)
1. Real username, email, and ID are captured from AuthContext
2. Stored in database alongside anonymous alias
3. Never displayed in UI
4. Available for moderation/reporting queries

## Example Data Structure

### Before:
```json
{
  "id": "msg-123",
  "room_id": "ren-1",
  "alias": "Anonymous Hero",
  "message": "Hello everyone!",
  "timestamp": "2025-01-09T10:00:00Z"
}
```

### After:
```json
{
  "id": "msg-123",
  "room_id": "ren-1",
  "alias": "Anonymous Hero",  // ← Displayed to users
  "message": "Hello everyone!",
  "timestamp": "2025-01-09T10:00:00Z",
  "user_name": "John Doe",    // ← For moderation
  "user_email": "john@example.com",  // ← For moderation
  "user_id": "user-abc-123"   // ← For moderation
}
```

## Moderation Queries

### Find all messages from a specific user:
```sql
SELECT * FROM darkroom_messages 
WHERE user_email = 'problematic@example.com';
```

### Find all rooms created by a user:
```sql
SELECT * FROM darkroom_rooms 
WHERE creator_user_email = 'user@example.com';
```

### Track user activity across rooms:
```sql
SELECT 
  m.room_id,
  m.alias,
  m.message,
  m.timestamp,
  m.user_name,
  m.user_email
FROM darkroom_messages m
WHERE m.user_id = 'user-abc-123'
ORDER BY m.timestamp DESC;
```

### Find who's currently in a room:
```sql
SELECT 
  r.name as room_name,
  ru.alias,
  ru.user_name,
  ru.user_email,
  ru.joined_at,
  ru.last_activity
FROM darkroom_room_users ru
JOIN darkroom_rooms r ON r.id = ru.room_id
WHERE ru.room_id = 'ren-1';
```

## Security Considerations

### ✅ What's Protected:
- Anonymous display maintained
- Real identity never shown in UI
- User tracking for accountability
- Moderation capability

### ⚠️ Important Notes:
- User info stored in plain text (consider encryption if needed)
- Only authorized admins should access user_name, user_email columns
- Consider adding RLS (Row Level Security) policies
- Implement admin-only moderation interface

## Testing

### 1. Verify User Tracking

**Test as logged-in user:**
1. Log in to your account
2. Enter Dark Room with alias "TestUser"
3. Create a room
4. Send a message
5. Check database:
   ```sql
   SELECT * FROM darkroom_messages ORDER BY timestamp DESC LIMIT 1;
   ```
   Should show:
   - `alias`: "TestUser"
   - `user_name`: Your actual name
   - `user_email`: Your actual email
   - `user_id`: Your user ID

**Test as anonymous user:**
1. Don't log in (or use incognito)
2. Enter Dark Room
3. Send messages
4. Check database - user fields should be NULL

### 2. Verify Anonymous Display

1. Two users join same room
2. Both send messages
3. Verify only aliases are displayed
4. Real names never shown in UI

### 3. Test Moderation Queries

1. Create test data
2. Run moderation queries above
3. Verify you can track users

## Future Enhancements

### Recommended:
1. **Admin Dashboard** - UI for moderation queries
2. **Reporting System** - Users can report inappropriate content
3. **Data Encryption** - Encrypt user_email and user_name
4. **Audit Log** - Track who accessed user data
5. **Auto-moderation** - Flag suspicious activity
6. **User Bans** - Ban users by email/ID
7. **GDPR Compliance** - User data export/deletion

### Optional:
- Hash emails for privacy
- Time-limited data retention
- IP address tracking
- Session tracking
- Activity analytics

## Summary

✅ Database tables updated with user tracking columns  
✅ Backend captures and stores user info  
✅ Frontend sends user info with all Dark Room actions  
✅ Anonymous display maintained in UI  
✅ Moderation queries available  
✅ Indexes created for performance  
✅ Backward compatible (NULL for old data)  

**The Dark Room now tracks users for accountability while maintaining complete anonymity in the user experience!** 🌙🔒
