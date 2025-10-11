# Venice AI Integration Setup Guide

## Overview
Venice AI has been successfully integrated to replace Claude API for companion chat messages. The system now uses three models with code names for a better user experience.

## Environment Setup

### Server Configuration
Create a `.env` file in the `server/` directory with the following content:

```env
# Venice AI Configuration
VENICE_API_KEY=g1PgDoi8RPQfEJ-W9jKuL3YISzYNuB2yTTXxyvwPhg

# Server Configuration
PORT=8000
NODE_ENV=development

# Add your other environment variables below (Supabase, etc.)
```

**Important**: The `.env` file is gitignored for security. Make sure to create it manually in the `server/` directory.

## Experience Models

The system uses three Venice AI models with user-friendly code names:

### 1. **Ginger** (qwen3-4b) - Default
- **Purpose**: General purpose texting
- **Description**: Balanced, versatile, and reliable for everyday conversations
- **Icon**: Message bubble
- **Color**: Soft gold

### 2. **Ren** (venice-uncensored)
- **Purpose**: Exciting roleplays
- **Description**: Unleashed creativity with no boundaries for immersive stories
- **Icon**: Flame
- **Color**: Purple

### 3. **Titan** (llama-3.2-3b)
- **Purpose**: Long lasting texting model
- **Description**: Deep memory and context for extended conversations
- **Icon**: Brain
- **Color**: Blue

## Features

### Text-Only Mode
- All responses are sanitized to ensure text-only content
- Code blocks and images are automatically filtered out
- Users get clean, conversational text responses

### Interactive & Adaptive
- AI adapts to user's language style (casual, formal, slang, etc.)
- Mirrors user's emotional state and energy
- Shows genuine personality traits and spontaneity
- Maintains the [THINKS:] and [SAYS:] response format

### User Experience
- Users select their preferred experience from the "Experience" menu (3-dots menu)
- Selection is saved in localStorage and persists across sessions
- Users can switch between experiences at any time
- Each model adapts to user behavior and maintains conversation context

## Error Handling

If Venice AI fails, users will see a friendly error message:
> "Server is busy as 1000s of users are active right now. Please wait and if the issue persists, you can report it."

## Frontend Changes

### New UI Components
1. **Experience Menu Item**: Added to the 3-dots menu with Brain icon
2. **Experience Selector Modal**: Beautiful modal with three options (Ginger, Ren, Titan)
3. **Visual Indicators**: Each experience has unique colors and icons
4. **Persistent Selection**: User's choice is saved automatically

### API Integration
- Frontend now passes `experienceModel` parameter to the API
- Default model is "ginger" (qwen3-4b)
- All existing features (mood, custom instructions, incognito mode) work seamlessly

## Backend Changes

### Controller Updates
- `server/controllers/chatAiController.js` completely updated for Venice AI
- Model mapping system translates code names to actual Venice AI models
- Response sanitization to ensure text-only content
- Enhanced prompts for interactive, humane, and adaptive responses

### System Prompts
The AI is instructed to:
1. Be interactive and humane with genuine emotions
2. Adapt to user's language style
3. Adapt to user's behavioral patterns
4. Show empathy, humor, curiosity, and spontaneity
5. Generate ONLY text (no code or images)
6. Use [THINKS:] and [SAYS:] format for structured responses

## Testing

Before launching, test:
1. ✅ Experience selection from menu
2. ✅ All three models (Ginger, Ren, Titan)
3. ✅ Response format ([THINKS:] and [SAYS:])
4. ✅ Text-only filtering
5. ✅ Error handling
6. ✅ Persistence of user selection
7. ✅ Mood integration
8. ✅ Custom instructions
9. ✅ Incognito mode
10. ✅ Conversation history

## Quick Start

1. **Add Venice API Key**:
   ```bash
   cd server
   echo "VENICE_API_KEY=g1PgDoi8RPQfEJ-W9jKuL3YISzYNuB2yTTXxyvwPhg" > .env
   ```

2. **Start the server**:
   ```bash
   cd server
   npm start
   ```

3. **Start the client**:
   ```bash
   cd client
   npm run dev
   ```

4. **Test the integration**:
   - Open the app
   - Go to any companion character chat
   - Click the 3-dots menu → Experience
   - Select an experience (Ginger, Ren, or Titan)
   - Send a message and verify the response

## Security Notes

- API key is stored in `.env` file (never commit to git)
- All requests go through the backend (API key is never exposed to frontend)
- Text-only mode prevents injection of malicious code or images
- Rate limiting and error handling protect against abuse

## Support

If you encounter any issues:
1. Check that `VENICE_API_KEY` is correctly set in `server/.env`
2. Verify the server is running and listening on port 8000
3. Check browser console for any frontend errors
4. Check server logs for API errors
5. Ensure Venice AI API is accessible from your server

## Migration Notes

- **No data migration needed**: All existing chat history works seamlessly
- **Backward compatible**: The same API endpoint is used (`/api/v1/chat/ai/claude`)
- **Zero downtime**: Users can switch immediately after deployment

---

**Created**: October 7, 2025
**Status**: ✅ Integration Complete
**Models**: qwen3-4b, venice-uncensored, llama-3.2-3b
**API**: Venice AI (OpenAI-compatible)


