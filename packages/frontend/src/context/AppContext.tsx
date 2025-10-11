import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { getAllPosts, canUserPostToday, getUserPosts, getSellProposals, createPost as createPostOnChain } from '@/services/contract';
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

interface SwapProposal {
  id: string;
  initiatorTokenId: string;
  targetTokenId: string;
  initiator: string;
  target: string;
  expiration: number;
  isActive: boolean;
  initiatorPost?: Post;
  targetPost?: Post;
}

interface AppState {
  posts: Post[];
  userPosts: Post[];
  swapProposals: SwapProposal[];
  hasPostedToday: boolean;
  timeUntilNextPost: number;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'SET_USER_POSTS'; payload: Post[] }
  | { type: 'SET_SWAP_PROPOSALS'; payload: SwapProposal[] }
  | { type: 'ADD_SWAP_PROPOSAL'; payload: SwapProposal }
  | { type: 'REMOVE_SWAP_PROPOSAL'; payload: string }
  | { type: 'SET_HAS_POSTED_TODAY'; payload: boolean }
  | { type: 'SET_TIME_UNTIL_NEXT_POST'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  posts: [],
  userPosts: [],
  swapProposals: [],
  hasPostedToday: false,
  timeUntilNextPost: 0,
  isLoading: false,
  error: null,
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
    case 'SET_SWAP_PROPOSALS':
      return { ...state, swapProposals: action.payload };
    case 'ADD_SWAP_PROPOSAL':
      return { 
        ...state, 
        swapProposals: [...state.swapProposals, action.payload] 
      };
    case 'REMOVE_SWAP_PROPOSAL':
      return { 
        ...state, 
        swapProposals: state.swapProposals.filter(p => p.id !== action.payload) 
      };
    case 'SET_HAS_POSTED_TODAY':
      return { ...state, hasPostedToday: action.payload };
    case 'SET_TIME_UNTIL_NEXT_POST':
      return { ...state, timeUntilNextPost: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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
          const [canPost, userPosts, proposals] = await Promise.all([
            canUserPostToday(address),
            getUserPosts(address),
            getSellProposals(address),
          ]);
          dispatch({ type: 'SET_HAS_POSTED_TODAY', payload: !canPost });
          dispatch({ type: 'SET_USER_POSTS', payload: userPosts });
          dispatch({ type: 'SET_SWAP_PROPOSALS', payload: proposals });
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
      console.log('Refreshed posts from contract:', posts);
      dispatch({ type: 'SET_POSTS', payload: posts });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load feed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshUserData = async () => {
    if (!address) return;
    const [userPosts, proposals] = await Promise.all([
      getUserPosts(address),
      getSellProposals(address),
    ]);
    dispatch({ type: 'SET_USER_POSTS', payload: userPosts });
    dispatch({ type: 'SET_SWAP_PROPOSALS', payload: proposals });
  };

  const value: AppContextType = {
    state,
    dispatch,
    createPost,
    refreshFeed,
    refreshUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export type { Post, SwapProposal, AppState };