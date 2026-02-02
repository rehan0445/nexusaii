# Nexus AI - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Setup & Installation](#setup--installation)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Authentication & Security](#authentication--security)
10. [Deployment](#deployment)
11. [Development Guidelines](#development-guidelines)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Nexus AI** is a full-stack social platform with AI companion chat capabilities, designed for college communities. It combines social networking features (confessions, announcements, group chats) with interactive AI character experiences.

### Key Highlights
- **Full-Stack Application**: React (TypeScript) frontend + Express.js (Node.js) backend
- **Real-Time Communication**: Socket.IO for live messaging and updates
- **AI Integration**: Venice AI for companion chat with multiple experience models
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Multi-method auth (Email/Password, Phone OTP, Google OAuth)
- **Deployment**: Railway.app with Nixpacks configuration

### Target Users
- College students seeking anonymous confessions and announcements
- Users interested in AI companion interactions
- Social groups looking for real-time chat experiences

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + TypeScript)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Pages   │  │Components│  │ Contexts │  │ Services││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
                       │ WebSocket (Socket.IO)
┌──────────────────────▼──────────────────────────────────┐
│              Server (Express.js + Node.js)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Routes   │  │Controllers│  │ Services │  │Middleware││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   Supabase   │ │ Venice AI  │ │  Socket.IO │
│  (PostgreSQL)│ │    API     │ │   Server   │
└──────────────┘ └────────────┘ └────────────┘
```

### Application Flow

1. **User Registration/Login** → JWT tokens stored in HTTP-only cookies
2. **Onboarding** → First-time user experience with feature introductions
3. **Main Hub** → `/arena/hangout` - Central navigation point
4. **Feature Navigation** → Bottom bar: Arena | Campus | Companion | Profile

### Data Flow

- **Authentication**: Supabase Auth → JWT tokens → HTTP-only cookies
- **Real-Time Messages**: Socket.IO → Supabase Realtime → Database persistence
- **AI Chat**: Client → Express API → Venice AI → Response with context
- **User Data**: Supabase RLS policies → Secure data access

---

## Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.1.4
- **Routing**: React Router DOM 6.22.3
- **State Management**: React Context API
- **UI Components**: 
  - Radix UI primitives
  - Tailwind CSS 3.4.1
  - Framer Motion 12.19.2 (animations)
- **HTTP Client**: Axios 1.10.0
- **Real-Time**: Socket.IO Client 4.8.1
- **Form Handling**: React Hook Form 7.62.0 + Zod 4.0.17
- **Data Fetching**: TanStack React Query 5.85.5

### Backend
- **Runtime**: Node.js 22 (ES Modules)
- **Framework**: Express.js 5.1.0
- **Database**: Supabase (PostgreSQL) with @supabase/supabase-js 2.50.0
- **Real-Time**: Socket.IO 4.8.1
- **Authentication**: 
  - JWT (jsonwebtoken 9.0.2)
  - Argon2 password hashing (argon2 0.41.1)
  - TOTP MFA (speakeasy 2.0.0)
- **Security**:
  - Helmet 7.1.0 (security headers)
  - CORS 2.8.5 (cross-origin)
  - express-rate-limit 7.4.0
  - CSRF protection (custom middleware)
- **AI Integration**: Venice AI (OpenAI-compatible API)
- **File Upload**: Multer 2.0.1
- **Validation**: Zod 4.1.11

### Infrastructure
- **Deployment**: Railway.app
- **Build System**: Nixpacks
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Monitoring**: Custom logging and error tracking

---

## Features

### 1. Arena (Social Hub)
- **Hangout Palaces**: Public chat rooms with admin controls
- **Dark Room**: Anonymous group chat with auto-categorization
- **Group Chats**: Private and public communities
- **Real-Time Messaging**: Socket.IO-powered instant messaging

### 2. Campus (College Features)
- **Confessions**: Anonymous confession posts with voting, comments, and reactions
- **Announcements**: College-wide announcements with categories
- **Lost & Found**: Item recovery system
- **Campus Selection**: Multi-college support (MIT ADT, etc.)

### 3. Companion (AI Chat)
- **Pre-built Characters**: Curated AI personalities
- **Custom AI Creation**: User-created AI companions
- **Interactive Features**:
  - Affection System (5-tier progression)
  - Quest System (riddles, trivia, word games)
  - Dynamic Memory (contextual conversations)
  - Character Initiative (proactive messages)
  - Typing Indicators (realistic delays)
- **Experience Models**:
  - **Ginger** (qwen3-4b): General purpose texting
  - **Ren** (venice-uncensored): Exciting roleplays
  - **Titan** (llama-3.2-3b): Long-lasting conversations

### 4. Profile & Settings
- **User Profile**: Customizable profiles with images
- **Activity Tracking**: Likes, comments, reposts, characters
- **Settings**: Privacy, security, notifications
- **Referral System**: User referral codes and rewards

### 5. Nexus Chats
- **Unified Chat Hub**: Aggregates all conversations
- **Mobile Swipe Gestures**: Left swipe to open, right to close
- **Desktop Button**: Quick access with unread badges
- **Real-Time Updates**: Live unread counts and message previews

### 6. Security Features
- **Multi-Factor Authentication**: TOTP-based 2FA
- **Rate Limiting**: Per-user and per-route limits
- **CSRF Protection**: Double-submit cookie pattern
- **Input Sanitization**: Global body sanitization
- **Row Level Security**: Supabase RLS policies
- **Audit Logging**: Security event tracking

---

## Project Structure

```
ren04/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # Base UI components (Radix)
│   │   │   ├── arena/              # Arena-related components
│   │   │   ├── vibe/               # Vibe feature components
│   │   │   └── ...
│   │   ├── pages/                  # Route pages
│   │   │   ├── arena/              # Arena pages
│   │   │   ├── onboarding/         # Onboarding flow
│   │   │   ├── settings/           # Settings pages
│   │   │   └── ...
│   │   ├── contexts/               # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CharacterContext.tsx
│   │   │   ├── GroupChatContext.tsx
│   │   │   └── ...
│   │   ├── services/               # API service layers
│   │   │   ├── ai.ts
│   │   │   ├── companionService.ts
│   │   │   ├── hangoutService.ts
│   │   │   └── ...
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities and config
│   │   │   ├── supabase.ts
│   │   │   ├── apiConfig.ts
│   │   │   └── ...
│   │   ├── utils/                  # Helper functions
│   │   ├── types/                  # TypeScript types
│   │   └── themes/                 # Theme configurations
│   ├── public/                     # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── server/                         # Express backend
│   ├── app.js                      # Main server entry
│   ├── config/                      # Configuration files
│   │   ├── supabase.js
│   │   ├── env.js
│   │   └── performance.js
│   ├── controllers/                # Request handlers
│   │   ├── authController.js
│   │   ├── chatAiController.js
│   │   ├── companionChatController.js
│   │   └── ...
│   ├── routes/                     # API route definitions
│   │   ├── authRoutes.js
│   │   ├── confessions.js
│   │   ├── companionChat.js
│   │   └── ...
│   ├── services/                   # Business logic
│   │   ├── darkroomService.js
│   │   ├── companionContextService.js
│   │   ├── questService.js
│   │   └── ...
│   ├── middleware/                 # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── csrf.js
│   │   ├── rbac.js
│   │   └── ...
│   ├── utils/                      # Utility functions
│   │   ├── logger.js
│   │   ├── monitoring.js
│   │   └── ...
│   ├── scripts/                    # Database scripts
│   │   ├── migrations/             # SQL migrations
│   │   └── ...
│   ├── socketHandlers/             # Socket.IO handlers
│   ├── tests/                      # Test files
│   └── package.json
│
├── package.json                    # Root package.json
├── nixpacks.toml                   # Railway deployment config
└── [Documentation files]           # Various .md files
```

---

## Setup & Installation

### Prerequisites
- Node.js 22+ and npm
- Supabase account and project
- Venice AI API key
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd ren04
```

### Step 2: Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 3: Environment Configuration

#### Server Environment (`server/.env`)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Venice AI Configuration
VENICE_API_KEY=your-venice-api-key

# Server Configuration
PORT=8002
NODE_ENV=development
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=your-secure-random-secret

# CORS Configuration
CORS_ALLOWLIST=http://localhost:5173,http://localhost:3000
ALLOW_ALL_ORIGINS=false

# CSRF Protection (optional)
CSRF_ENABLED=false

# Rate Limiting
RATE_LIMIT_MAX=1000
```

#### Client Environment (`client/.env`)
```env
VITE_API_URL=http://localhost:8002
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Database Setup

1. **Run Migrations**:
```bash
cd server
node scripts/run_migrations.js
```

2. **Set up Supabase Tables**:
   - Run SQL scripts from `server/scripts/migrations/`
   - Enable Row Level Security (RLS) policies
   - Configure storage buckets if needed

### Step 5: Start Development Servers

#### Option 1: Run Both Servers (Recommended)
```bash
# From root directory
npm run dev
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Step 6: Verify Installation

1. **Backend Health Check**: `http://localhost:8002/health`
2. **Frontend**: `http://localhost:5173`
3. **Check Console**: No errors in browser/terminal

---

## API Documentation

### Authentication Endpoints

#### Register (Gmail)
```http
POST /api/auth/register/gmail
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login/gmail
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123"
}
```

#### Phone OTP
```http
POST /api/auth/send-verification
Content-Type: application/json

{
  "phone": "+1234567890"
}

POST /api/auth/verify-phone
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456"
}
```

### Companion Chat Endpoints

#### Send Message
```http
POST /api/v1/chat/companion
Content-Type: application/json
Authorization: Bearer <token>

{
  "characterId": "char-123",
  "message": "Hello!",
  "experienceModel": "ginger",
  "mood": "happy"
}
```

#### Get Chat History
```http
GET /api/v1/chat/companion/history?characterId=char-123&limit=50
Authorization: Bearer <token>
```

### Confessions Endpoints

#### Create Confession
```http
POST /api/confessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Confession text...",
  "campus": "mit-adt",
  "tags": ["academic", "relationships"]
}
```

#### Get Confessions
```http
GET /api/confessions?campus=mit-adt&sort=trending&limit=20
```

#### Vote on Confession
```http
POST /api/confessions/:id/vote
Content-Type: application/json

{
  "vote": "up" | "down"
}
```

### Dark Room Endpoints

#### Get Rooms
```http
GET /api/v1/darkroom/rooms
```

#### Create Room
```http
POST /api/v1/darkroom/create-group
Content-Type: application/json

{
  "name": "Room Name",
  "description": "Room description",
  "createdBy": "user-id"
}
```

#### Get Room Messages
```http
GET /api/v1/darkroom/rooms/:roomId/messages?limit=50&offset=0
```

### Socket.IO Events

#### Dark Room Events
- `join-room`: Join a dark room
- `send-message`: Send message to room
- `receive-message`: Receive message from room
- `user-count-update`: Room user count changes
- `room-history`: Request room message history

#### Companion Chat Events
- `check-character-initiative`: Check for proactive messages
- `character-initiative`: Receive character-initiated message
- `clear-pending-messages`: Clear pending initiative messages

#### Confession Events
- `join-confession`: Join confession room for real-time updates
- `leave-confession`: Leave confession room

---

## Database Schema

### Core Tables

#### Users & Authentication
- `users`: User accounts (id, email, password_hash, phone, name)
- `sessions`: Active login sessions
- `refresh_tokens`: Long-lived refresh tokens
- `userProfileData`: Extended user profile information

#### Companion Chat
- `characters`: AI character definitions
- `companion_chats`: Chat conversation metadata
- `companion_messages`: Individual chat messages
- `character_affection`: Affection points per user-character pair
- `character_memory`: Extracted facts and memories
- `quests`: Quest challenges and completions

#### Confessions
- `confessions`: Confession posts
- `confession_votes`: Upvote/downvote tracking
- `confession_comments`: Comment threads
- `confession_reactions`: Emoji reactions

#### Dark Room
- `darkroom_rooms`: Anonymous chat rooms
- `darkroom_messages`: Room messages
- `darkroom_room_users`: Active room participants

#### Hangout Rooms (Coming Soon)
- `hangout_rooms`: Public hangout palaces
- `hangout_messages`: Hangout messages
- `hangout_members`: Room membership

#### Campus Features
- `announcements`: College announcements
- `campus_data`: Campus-specific information

### Row Level Security (RLS)

All tables have RLS policies enabled:
- Users can only read/write their own data
- Public read access for confessions (anonymous)
- Room access based on membership
- Admin-only access for moderation tables

---

## Authentication & Security

### Authentication Methods

1. **Email/Password (Gmail)**
   - Must use @gmail.com email
   - Argon2 password hashing
   - JWT tokens in HTTP-only cookies

2. **Phone OTP**
   - 6-digit SMS verification
   - Temporary codes expire in 10 minutes

3. **Google OAuth**
   - Firebase Authentication integration
   - One-click sign-in

### Security Features

#### Token Management
- **Access Token**: 15-minute expiry, stored in HTTP-only cookie
- **Refresh Token**: 30-day expiry, stored in HTTP-only cookie
- **Token Rotation**: Refresh tokens rotate on use

#### Rate Limiting
- Global: 1000 requests/minute per user/IP
- Auth endpoints: 5 attempts/minute
- Per-route limits for sensitive operations

#### CSRF Protection
- Double-submit cookie pattern
- Token in cookie + header
- Enabled via `CSRF_ENABLED` env var

#### Input Validation
- Zod schema validation
- Global body sanitization
- SQL injection prevention (parameterized queries)

#### Security Headers
- Helmet.js configuration
- CORS with allowlist
- Content Security Policy (configurable)

---

## Deployment

### Railway Deployment

#### Prerequisites
- Railway account
- Connected GitHub repository
- Environment variables configured

#### Deployment Steps

1. **Configure Nixpacks** (`nixpacks.toml`):
   - Node.js 22
   - Build commands
   - Start command

2. **Set Environment Variables** in Railway:
   ```
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   VENICE_API_KEY
   JWT_SECRET
   NODE_ENV=production
   PORT (auto-set by Railway)
   CORS_ALLOWLIST (your domain)
   ```

3. **Deploy**:
   - Push to main branch
   - Railway auto-deploys
   - Check deployment logs

4. **Verify**:
   - Health check: `https://your-app.railway.app/health`
   - Test authentication flow
   - Verify Socket.IO connections

### Build Process

```bash
# Build client
cd client
npm run build

# Output: client/dist/

# Start server (serves built client)
cd server
npm start
```

### Production Considerations

- **Environment**: Set `NODE_ENV=production`
- **CORS**: Configure `CORS_ALLOWLIST` with exact domains
- **Rate Limiting**: Adjust `RATE_LIMIT_MAX` for expected load
- **Database**: Use connection pooling
- **Monitoring**: Enable error tracking and logging
- **SSL**: Railway provides HTTPS automatically

---

## Development Guidelines

### Code Style

#### TypeScript/JavaScript
- Use TypeScript for client code
- ES Modules (import/export)
- Async/await over callbacks
- Error handling with try/catch

#### React Components
- Functional components with hooks
- TypeScript interfaces for props
- Context API for global state
- Lazy loading for code splitting

#### Express Routes
- Route handlers in controllers
- Business logic in services
- Middleware for cross-cutting concerns
- Error handling middleware

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`
- Routes: `camelCase.js`

### Git Workflow
- Feature branches from `main`
- Descriptive commit messages
- Pull requests for review
- Merge to `main` after approval

### Testing
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical flows
- Test files: `*.test.js` or `*.test.ts`

### Error Handling
- Try/catch blocks for async operations
- Meaningful error messages
- Error logging with context
- User-friendly error responses

---

## Troubleshooting

### Common Issues

#### Backend Won't Start
- **Check**: Environment variables set correctly
- **Check**: Port 8002 not in use
- **Check**: Supabase connection valid
- **Solution**: Verify `.env` file in `server/` directory

#### Frontend Build Errors
- **Check**: Node version (22+)
- **Check**: Dependencies installed (`npm ci`)
- **Check**: TypeScript errors
- **Solution**: Clear `node_modules` and reinstall

#### Socket.IO Connection Failed
- **Check**: CORS configuration
- **Check**: Server running on correct port
- **Check**: WebSocket support in browser
- **Solution**: Verify `CORS_ALLOWLIST` includes frontend URL

#### Database Connection Errors
- **Check**: Supabase credentials
- **Check**: RLS policies configured
- **Check**: Network connectivity
- **Solution**: Test connection in Supabase dashboard

#### Authentication Issues
- **Check**: JWT_SECRET set
- **Check**: Cookie settings (httpOnly, secure)
- **Check**: Token expiry times
- **Solution**: Clear cookies and re-login

### Debug Endpoints

- `/health`: Server health check
- `/api/health`: Supabase connectivity check
- `/debug-railway-env`: Environment variable verification (dev only)

### Logs

- **Backend**: Console logs with emoji indicators
- **Frontend**: Browser console for client errors
- **Production**: Railway logs dashboard

---

## Additional Resources

### Documentation Files
- `COMPLETE_SETUP_GUIDE.md`: Detailed setup instructions
- `AUTH_AND_FLOW_EXPLAINED.md`: Authentication flow details
- `VENICE_AI_SETUP.md`: AI integration guide
- `SECURITY.md`: Security policies
- `DEPLOYMENT_CHECKLIST.md`: Pre-deployment checklist

### External Links
- [Supabase Documentation](https://supabase.com/docs)
- [Venice AI Documentation](https://venice.ai/docs)
- [Railway Documentation](https://docs.railway.app)
- [Socket.IO Documentation](https://socket.io/docs)

---

## Support & Contribution

### Getting Help
- Check existing documentation files
- Review error logs
- Search GitHub issues
- Contact: [Your contact information]

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request
5. Address review feedback

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: [Your Name/Team]

