# Venice AI Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Create Environment File
```bash
cd server
```

Create a file named `.env` with this content:
```env
VENICE_API_KEY=g1PgDoi8RPQfEJ-W9jKuL3YISzYNuB2yTTXxyvwPhg
PORT=8000
NODE_ENV=development
```

### Step 2: Start the Server
```bash
cd server
npm start
```

You should see: `🔑 Venice AI API Key loaded successfully`

### Step 3: Start the Client
```bash
cd client
npm run dev
```

---

## 🎮 How to Use

1. **Open the app** in your browser
2. **Go to any companion character** chat
3. **Click the 3-dots menu** (top right)
4. **Select "Experience"**
5. **Choose your preferred model**:
   - 🌟 **Ginger** - General purpose (default)
   - 🔥 **Ren** - Exciting roleplays
   - 🧠 **Titan** - Long conversations

Your selection is saved automatically!

---

## 📌 Key Points

- **Default Model**: Ginger (qwen3-4b)
- **Response Format**: [THINKS:] and [SAYS:]
- **Content**: Text-only (no code or images)
- **Features**: All existing features work (mood, custom instructions, incognito)
- **Error Message**: "Server is busy as 1000s of users are active right now..."

---

## 🔍 Quick Test

1. Select **Ginger** and send: "Hello!"
2. Verify you get a response with [THINKS:] and/or [SAYS:]
3. Switch to **Ren** and test
4. Switch to **Titan** and test

All three should work seamlessly!

---

## ✅ Integration Complete

- Backend: Venice AI integrated
- Frontend: Experience selector added
- Models: qwen3-4b, venice-uncensored, llama-3.2-3b
- Code Names: Ginger, Ren, Titan
- Status: Ready to use!

**Need more details?** See `VENICE_AI_SETUP.md` for complete documentation.


