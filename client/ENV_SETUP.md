# Environment Variables Setup

## Create `.env` File

In the `client/` directory, create a `.env` file with the following content:

```env
# Supabase Configuration
# Get these values from: https://app.supabase.com/project/_/settings/api

# Your Supabase project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon/public key
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create one)
3. Navigate to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Important Notes

- ⚠️ **Never commit your `.env` file to version control!**
- ✅ The `.env` file is already in `.gitignore`
- ✅ Restart the dev server after creating/modifying `.env`

## Quick Setup

```bash
cd client
touch .env
# Edit .env and paste your credentials
npm run dev
```

That's it! Your app will now use Supabase for authentication.

