# Hangout Communities Implementation Guide

This document summarizes the completed implementation of the **Hangout Communities** feature (Reddit/Discord-style group chat) using Supabase for persistence and real-time updates.

---

## 1. Database Schema (Supabase)

**Tables Used:**
- `nc_chats`: Stores communities/channels (fields: `id`, `name`, `description`, `chat_type`, `created_by`, etc.)
- `nc_memberships`: Tracks user membership in communities/channels (fields: `id`, `chat_id`, `user_id`, `role`, `joined_at`, etc.)
- `nc_messages`: Stores all messages in communities/channels (fields: `id`, `chat_id`, `user_id`, `content`, `created_at`, etc.)
- `nc_preferences`: Stores user theme and chat bubble preferences (fields: `user_id`, `theme`, `bubble_skin`, etc.)

**No new tables were required; existing schema supports all requirements.**

---

## 2. Backend API Endpoints

Implemented/extended endpoints (in `server/routes/nexusChats.js`):
- **Create Community/Channel:** `POST /api/nexus-chats/create` (inserts into `nc_chats`)
- **Join/Leave Community:** `POST /api/nexus-chats/join` and `POST /api/nexus-chats/leave` (manage `nc_memberships`)
- **Send Message:** `POST /api/nexus-chats/send-message` (inserts into `nc_messages`)
- **Fetch Messages:** `GET /api/nexus-chats/messages/:chatId` (fetches from `nc_messages` by `chat_id`)
- **Set/Get Preferences:** `POST /api/nexus-chats/preferences` and `GET /api/nexus-chats/preferences`

All endpoints use Supabase for data storage and retrieval, ensuring persistence and shared visibility.

---

## 3. Frontend UI

- **Community/Channel Creation:** UI for users to create and join communities.
- **Chat Interface:** Real-time chat view for each community/channel, with message history loaded on entry or refresh.
- **Theme & Chat Bubble Customization:** UI for users to select and save their preferred theme and chat bubble style (stored in `nc_preferences`).

---

## 4. Real-Time Updates

- **Supabase Realtime** is used to subscribe to `nc_messages` changes for each community/channel.
- New messages appear instantly for all users in the group chat.
- No messages are lost on refresh, back, or logout.

---

## 5. Persistence & Shared Visibility

- **All messages are stored in Supabase** and fetched on channel entry or page refresh.
- **Messages from one user are visible to all others** in the same community/channel.
- **No message disappears** on refresh, back, or logout.

---

## Summary Table

| Feature                        | Implementation Details                                  |
|-------------------------------|--------------------------------------------------------|
| Community/Channel Creation     | `nc_chats` table, backend API, frontend UI             |
| Membership Management          | `nc_memberships` table, backend API                    |
| Group Chat Messaging           | `nc_messages` table, backend API, real-time frontend   |
| Message Persistence            | Supabase storage, fetch on entry/refresh               |
| Shared Message Visibility      | All users in a channel see all messages                |
| Theme & Bubble Customization   | `nc_preferences` table, frontend UI                    |
| Real-Time Updates              | Supabase Realtime, instant message delivery            |

---

## Next Steps / Extensibility
- Add moderation, rules, or admin features if needed.
- Enhance UI/UX for notifications, mentions, or media sharing.
- Integrate with mobile or desktop clients.

---

**This implementation delivers a persistent, real-time, and customizable group chat experience inspired by Reddit and Discord.**
