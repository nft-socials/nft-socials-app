import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { getAllPosts, canUserPostToday, getUserPosts, createPost as createPostOnChain } from '@/services/contract';
import { FEED_PAGE_SIZE } from '@/utils/constants';
import { storeOnIPFS } from '@/services/ipfs';

interface Post {
  tokenId: string;
  author: string;
  currentOwner: string;
  contentHash: string;
  content: string;
  timestamp: number;
  isSwappable: boolean;
  price: number;
  isForSale?: boolean;
  isOwnedByUser?: boolean;
  isCreatedByUser?: boolean;
}



interface AppState {
  posts: Post[];
  userPosts: Post[];
  hasPostedToday: boolean;
  timeUntilNextPost: number;
  isLoading: boolean;
  error: string | null;
  hasNewPosts: boolean;
  lastFeedRefresh: number;
}

type AppAction =
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'SET_USER_POSTS'; payload: Post[] }
  | { type: 'SET_HAS_POSTED_TODAY'; payload: boolean }
  | { type: 'SET_TIME_UNTIL_NEXT_POST'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HAS_NEW_POSTS'; payload: boolean }
  | { type: 'SET_LAST_FEED_REFRESH'; payload: number }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  posts: [],
  userPosts: [],
  hasPostedToday: false,
  timeUntilNextPost: 0,
  isLoading: false,
  error: null,
  hasNewPosts: false,
  lastFeedRefresh: 0,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.payload };
    case 'ADD_POST':
      return { 
        ...state, 
        posts: [action.payload, ...state.posts],
        hasPostedToday: action.payload.isCreatedByUser || state.hasPostedToday
      };
    case 'SET_USER_POSTS':
      return { ...state, userPosts: action.payload };
    case 'SET_HAS_POSTED_TODAY':
      return { ...state, hasPostedToday: action.payload };
    case 'SET_TIME_UNTIL_NEXT_POST':
      return { ...state, timeUntilNextPost: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_HAS_NEW_POSTS':
      return { ...state, hasNewPosts: action.payload };
    case 'SET_LAST_FEED_REFRESH':
      return { ...state, lastFeedRefresh: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createPost: (content: string) => Promise<void>;
  refreshFeed: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  checkForNewPosts: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { address, account } = useAccount();

  // Initial load: fetch feed and user posting eligibility
  useEffect(() => {
    const init = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const posts = await getAllPosts(0, FEED_PAGE_SIZE);
        dispatch({ type: 'SET_POSTS', payload: posts });

        if (address) {
          const [canPost, userPosts] = await Promise.all([
            canUserPostToday(address),
            getUserPosts(address),
          ]);
          dispatch({ type: 'SET_HAS_POSTED_TODAY', payload: !canPost });
          dispatch({ type: 'SET_USER_POSTS', payload: userPosts });

        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load feed' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    init();
  }, [address]);

  const createPost = async (content: string) => {
    try {
      if (!account || !address) throw new Error('Wallet not connected');
      dispatch({ type: 'SET_LOADING', payload: true });

      const metadata = {
        content,
        timestamp: Date.now(),
        author: address,
        version: '1.0' as const,
      };

      const contentHash = await storeOnIPFS(metadata);  
//       console.log({ contentHash, content})
// return;
      await createPostOnChain(account, contentHash, 0);

      // Refresh data after successful tx
      await Promise.all([refreshFeed(), refreshUserData()]);
      dispatch({ type: 'SET_HAS_POSTED_TODAY', payload: true });
    } catch (error) {
      console.error(error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create post' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshFeed = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const posts = await getAllPosts(0, FEED_PAGE_SIZE);
      dispatch({ type: 'SET_POSTS', payload: posts });
      dispatch({ type: 'SET_LAST_FEED_REFRESH', payload: Date.now() });
      dispatch({ type: 'SET_HAS_NEW_POSTS', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load feed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshUserData = async () => {
    if (!address) return;
    const userPosts = await getUserPosts(address);
    dispatch({ type: 'SET_USER_POSTS', payload: userPosts });
  };

  const checkForNewPosts = async () => {
    try {
      // Get the latest posts without updating the feed
      const latestPosts = await getAllPosts(0, 5); // Just check first 5 posts

      // Check if there are newer posts than our last refresh
      if (latestPosts.length > 0 && state.lastFeedRefresh > 0) {
        const hasNewer = latestPosts.some(post => {
          // Assuming posts have a timestamp or we can compare with existing posts
          return !state.posts.some(existingPost => existingPost.tokenId === post.tokenId);
        });

        if (hasNewer) {
          dispatch({ type: 'SET_HAS_NEW_POSTS', payload: true });
        }
      }
    } catch (error) {
      console.error('Error checking for new posts:', error);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    createPost,
    refreshFeed,
    refreshUserData,
    checkForNewPosts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export type { Post, AppState };