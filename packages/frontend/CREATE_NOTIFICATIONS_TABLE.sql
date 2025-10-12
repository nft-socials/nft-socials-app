-- ========================================
-- COPY AND PASTE THIS COMMAND IN SUPABASE SQL EDITOR
-- ========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'buy', 'sell', 'chat', 'post_created', 'nft_listed')),
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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security (optional - you can disable this if you prefer)
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own notifications (optional)
-- CREATE POLICY "Users can view own notifications" ON notifications
--   FOR SELECT USING (auth.uid()::text = user_address);

-- Create policy to allow inserting notifications (optional)
-- CREATE POLICY "Allow inserting notifications" ON notifications
--   FOR INSERT WITH CHECK (true);

-- If you want to disable RLS completely (simpler for development):
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Insert some sample notifications for testing (optional)
-- Replace 'your_wallet_address' with your actual wallet address
/*
INSERT INTO notifications (user_address, type, title, message, from_address, from_name, is_read) VALUES
('your_wallet_address', 'like', 'New Like', 'User123.stark liked your post', '0x1234567890abcdef', 'User123.stark', false),
('your_wallet_address', 'chat', 'New Message', 'You have unread messages from User456.stark', '0xabcdef1234567890', 'User456.stark', false),
('your_wallet_address', 'buy', 'NFT Sold', 'User789.stark bought your NFT #001', '0x9876543210fedcba', 'User789.stark', true);
*/
