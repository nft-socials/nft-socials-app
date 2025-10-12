-- Disable Row Level Security if it's causing issues
-- Run this in your Supabase SQL Editor if you're getting RLS policy errors

-- Disable RLS on all tables
ALTER TABLE IF EXISTS chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS likes DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Verify tables exist and are accessible
SELECT 'chats' as table_name, count(*) as row_count FROM chats
UNION ALL
SELECT 'messages' as table_name, count(*) as row_count FROM messages
UNION ALL
SELECT 'likes' as table_name, count(*) as row_count FROM likes;
