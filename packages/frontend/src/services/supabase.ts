import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// TODO: Replace these with your actual Supabase project credentials
// You can find these in your Supabase dashboard under Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable auth since we're using wallet addresses for identification
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    // Enable realtime for chat functionality
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          participant_1: string;
          participant_2: string;
          last_message: string | null;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          participant_1: string;
          participant_2: string;
          last_message?: string | null;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          participant_1?: string;
          participant_2?: string;
          last_message?: string | null;
          last_message_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          chat_id: string;
          sender_address: string;
          receiver_address: string;
          content: string;
          message_type: 'text' | 'nft' | 'trade';
          is_read: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          chat_id: string;
          sender_address: string;
          receiver_address: string;
          content: string;
          message_type?: 'text' | 'nft' | 'trade';
          is_read?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          chat_id?: string;
          sender_address?: string;
          receiver_address?: string;
          content?: string;
          message_type?: 'text' | 'nft' | 'trade';
          is_read?: boolean;
        };
      };
      likes: {
        Row: {
          id: string;
          created_at: string;
          user_address: string;
          target_type: 'message' | 'post' | 'nft';
          target_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_address: string;
          target_type: 'message' | 'post' | 'nft';
          target_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_address?: string;
          target_type?: 'message' | 'post' | 'nft';
          target_id?: string;
        };
      };
    };
  };
}

// Helper function to set user context (not needed without RLS)
export const setUserContext = async (userAddress: string) => {
  // RLS is disabled, so this function is a no-op
  // Keeping it for potential future use
};

// Helper function to create a normalized chat ID from two addresses
export const createChatId = (address1: string, address2: string): string => {
  // Sort addresses to ensure consistent chat IDs regardless of order
  const sortedAddresses = [address1.toLowerCase(), address2.toLowerCase()].sort();
  return `${sortedAddresses[0]}_${sortedAddresses[1]}`;
};

export default supabase;
