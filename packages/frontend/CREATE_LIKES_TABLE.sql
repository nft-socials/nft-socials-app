-- ========================================
-- COPY AND PASTE THIS COMMAND IN SUPABASE SQL EDITOR
-- ========================================

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('message', 'post', 'nft')),
  target_id TEXT NOT NULL,
  post_owner_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_address, target_type, target_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_address);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_post_owner ON likes(post_owner_address);

-- Disable Row Level Security for development
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- Insert some sample likes for testing (optional)
-- Replace 'your_wallet_address' with your actual wallet address
/*
INSERT INTO likes (user_address, target_type, target_id, post_owner_address) VALUES
('your_wallet_address', 'post', '1', '0x1234567890abcdef'),
('your_wallet_address', 'post', '2', '0xabcdef1234567890'),
('0x9876543210fedcba', 'post', '3', 'your_wallet_address');
*/
