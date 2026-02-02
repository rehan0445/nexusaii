# Companion Chat Redesign - Quick Start Guide

## 🚀 Quick Start

### 1. Database Setup (Already Done ✅)
The Supabase tables have been created with proper indexes and RLS policies:
- `companion_chat_messages`
- `incognito_user_secrets`
- `companion_chat_hints`

### 2. Start the Servers

```bash
# From project root
npm start

# Or use the PowerShell script
.\start-dev.ps1
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### 3. Test the Features

#### A. Normal Chat
1. Navigate to Companion section
2. Click on any character
3. Type a message: `Hello there!`
4. Watch as the AI responds with:
   - Light bubble (thoughts): "💭 They seem friendly..."
   - Dark bubble (speech): "Hello! How can I help you?"

#### B. User Thoughts Format
1. In the text input, type: `I'm fine *actually feeling nervous*`
2. The message will display as: "I'm fine"
3. Below in italic: "*actually feeling nervous*"
4. The AI will receive context about your nervousness

#### C. Expandable Text Input
1. Start typing a longer message
2. Watch the input expand automatically
3. Keep typing - it expands up to 4 lines
4. After 4 lines, it becomes scrollable

#### D. Smart Hints
1. Have a conversation with a character (3-5 messages)
2. Click the bulb icon (💡) at bottom left
3. See 5 contextually relevant hints appear
4. Click any hint to auto-fill and send

#### E. Incognito Mode
1. Click the eye icon (👁️) in the top bar
2. Notice it changes to eye-off icon
3. Send a few messages
4. Click the eye icon again to exit incognito
5. Your incognito messages disappear from view
6. Regular chat history reloads
7. Incognito messages are stored securely in the database

## 📝 Usage Tips

### Writing User Thoughts
Format: `*your internal thought*`

Examples:
- `Hey! *excited to talk* What's up?`
- `I'm okay *not really* thanks for asking`
- `*nervous laugh* That's interesting`

The AI will sense your emotional state and respond more appropriately!

### Getting Better Hints
- Have longer conversations (15+ messages) for better context
- Let the AI ask you questions
- Engage naturally - the hints improve with conversation flow

### Text Input Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line (up to 4 lines)
- Text automatically expands as you type

## 🎨 Visual Guide

### Chat Interface Layout
```
┌─────────────────────────────────────────┐
│  ← Character Name          👁️ ⚙️ ⋮   │  Top Bar
├─────────────────────────────────────────┤
│                                         │
│  💭 I wonder what they mean...         │  Light Thought
│                                         │
│  Hello! Nice to meet you!              │  Dark Speech
│                                         │
│                   Hi there! 😊         │  User Message
│                   *feeling shy*         │
│                                         │
└─────────────────────────────────────────┘
│ 💡  [Message Character...]      ✈️  │  Input Bar
│  💡 Use *thoughts* to add context     │
└─────────────────────────────────────────┘
```

### Button Locations
- **💡 Bulb (Hints)**: Bottom left of input bar
- **👁️ Eye (Incognito)**: Top right bar, next to settings
- **✈️ Send**: Bottom right of input bar

## 🔧 Troubleshooting

### Chat history not loading?
- Check if backend is running on port 8000
- Check browser console for errors
- Verify Supabase connection

### Messages not storing?
- Ensure you're logged in
- Check network tab for API call failures
- Verify authentication token

### Hints not generating?
- Need at least 1 message to generate hints
- Check if bulb button is clicked
- Fallback hints will appear if AI generation fails

### Incognito mode not working?
- Ensure eye button toggles properly
- Check if messages clear when toggling off
- Verify separate table storage in Supabase

## 🎯 Testing Checklist

Run through these tests to verify everything works:

- [ ] Open a character chat
- [ ] Chat history loads quickly (< 1 second)
- [ ] Send a normal message
- [ ] AI responds with thought + speech in separate bubbles
- [ ] Light bubble is semi-transparent and italic
- [ ] Dark bubble is opaque and regular
- [ ] Type a long message (4+ lines)
- [ ] Text input expands and stops at 4 lines
- [ ] Send message with `*thoughts*` format
- [ ] User thoughts display in italic below message
- [ ] Click bulb icon
- [ ] See 5 relevant hints
- [ ] Click a hint, it sends
- [ ] Toggle incognito mode on
- [ ] Send messages in incognito
- [ ] Toggle incognito mode off
- [ ] Messages cleared, regular chat restored
- [ ] Check Supabase tables for stored messages

## 📊 Performance Expectations

- **Chat Load Time**: < 1 second
- **Message Send**: < 500ms
- **Hint Generation**: < 2 seconds
- **Text Input Resize**: Instant
- **Incognito Toggle**: < 200ms

## 🐛 Known Issues

None currently! All features implemented and tested. ✨

## 📚 Additional Resources

- Full documentation: `COMPANION_CHAT_REDESIGN.md`
- Database schema: Check Supabase migrations
- API documentation: See `server/routes/companionChat.js`

## 🎉 Success!

If you've completed all the tests above, congratulations! Your companion chat is fully redesigned and ready for use. 

Enjoy the enhanced chat experience! 💬✨

