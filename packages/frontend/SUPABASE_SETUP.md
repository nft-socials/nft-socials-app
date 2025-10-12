# Supabase Chat Setup Guide

This guide will help you complete the Supabase setup for your NFT Socials chat functionality.

## Prerequisites

1. ✅ Supabase organization and project created
2. ✅ Supabase client installed (`@supabase/supabase-js`)
3. ✅ Database schema and service files created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 2: Create Environment File

1. In the `packages/frontend` directory, create a `.env.local` file:

```bash
# Create the environment file
touch packages/frontend/.env.local
```

2. Add your Supabase credentials to `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

## Step 3: Set Up Database Tables

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL commands to create the database schema:

```sql
-- Create database schema for chat functionality

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participant_1 TEXT NOT NULL,
  participant_2 TEXT NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_address TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'nft', 'trade')),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_address TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('message', 'post', 'nft')),
  target_id TEXT NOT NULL,
  UNIQUE(user_address, target_type, target_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'buy', 'sell', 'chat')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  from_address TEXT,
  from_name TEXT,
  nft_id TEXT,
  post_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_target ON likes(user_address, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for chats table
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Row Level Security (RLS) is disabled for simplicity
-- Tables are open for all operations - suitable for development
-- For production, you may want to enable RLS with proper policies
```

## Step 4: Enable Realtime

1. In your Supabase dashboard, go to **Database** → **Replication**
2. Enable realtime for these tables:
   - ✅ `messages`
   - ✅ `chats`
   - ✅ `likes`
   - ✅ `notifications`

## Step 5: Test the Setup

1. Start your development server:
```bash
cd packages/frontend
npm run dev
```

2. Connect your wallet in the app
3. Navigate to the Chats page
4. Try the following:
   - ✅ View existing chats (should be empty initially)
   - ✅ Start a new chat by clicking "Chat" on any NFT post
   - ✅ Send a message
   - ✅ Open the chat in another browser/tab to test real-time updates

## Troubleshooting

### Common Issues:

1. **"Failed to create chat: new row violates row-level security policy" error:**
   - Run the SQL commands in `DISABLE_RLS.sql` to disable Row Level Security
   - This error occurs if RLS was previously enabled
   - RLS is disabled by default in our setup for simplicity

2. **"Failed to load chats" error:**
   - Check your `.env.local` file has correct credentials
   - Verify your Supabase project is active
   - Check browser console for detailed errors

3. **Messages not sending:**
   - Ensure wallet is connected
   - Check that database tables were created successfully
   - Verify realtime is enabled for the `messages` table

4. **Real-time not working:**
   - Confirm realtime is enabled in Supabase dashboard
   - Check browser console for WebSocket connection errors
   - Try refreshing the page

5. **Infinite loading or console errors:**
   - Clear localStorage: `localStorage.clear()`
   - Refresh the page
   - Check that all environment variables are set correctly

### Debug Steps:

1. Open browser developer tools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed requests
4. Verify environment variables are loaded: `console.log(import.meta.env)`

## Features Implemented

✅ **Chat Management:**
- Create chats between users
- List user's chats
- Real-time chat updates

✅ **Messaging:**
- Send text messages
- Real-time message delivery
- Message history
- Message read status

✅ **Likes System:**
- Like messages, posts, or NFTs
- Unlike functionality
- Like count tracking
- Real-time like updates

✅ **Integration:**
- Wallet-based authentication
- Integration with existing NFT feed
- Mobile-responsive design

## Next Steps

After testing, you can:
1. Add message encryption for privacy
2. Implement file/image sharing
3. Add message reactions beyond likes
4. Create group chats
5. Add push notifications
6. Implement message search functionality

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase credentials
3. Ensure all database tables are created
4. Test with a simple message first

The chat system is now ready to use with real Supabase data!
