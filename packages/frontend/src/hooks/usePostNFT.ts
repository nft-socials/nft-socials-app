import { useAccount } from '@starknet-react/core';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  createPost,
  proposeSell,
  cancelSell,
  buyPost,
  getAllPosts,
  getUserPosts,
  getPostByTokenId,
  canUserPostToday,
  isPostForSale,
  getSellProposals,
  getAllPostsForSale,
  getPostPrice
} from '@/services/contract';
import { storeOnIPFS, PostMetadata } from '@/services/ipfs';
import type { Post } from '@/context/AppContext';
import { NotificationService } from '@/services/notificationService';

export interface PostNFTState {
  isLoading: boolean;
  error?: string;
}

export const usePostNFT = () => {
  const { account, address } = useAccount();
  const [state, setState] = useState<PostNFTState>({ isLoading: false });

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error?: string) => {
    setState(prev => ({ ...prev, error }));
  };

  // Mint a new post as NFT
  const mintPost = useCallback(async (content: string, imageDataUrl?: string, onSuccess?: () => void): Promise<string | null> => {

    if (!account || !address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      setLoading(true);
      setError(undefined);

      // Check if user can post today
      // const canPost = await canUserPostToday(address);
      // if (!canPost) {
      //   toast.error('You have already posted today. Come back tomorrow!');
      //   return null;
      // }

      // Prepare metadata for IPFS
      const metadata: PostMetadata = {
        content: content || (imageDataUrl ? '' : 'Post content'), // Allow empty content if there's an image
        timestamp: Date.now(),
        author: address,
        version: '1.0',
        image: imageDataUrl // Include image data if provided
      };

      // Store on IPFS
      const ipfsHash = await storeOnIPFS(metadata);

      // Mint NFT with IPFS hash (price = 0 for regular posts)
      const txHash = await createPost(account, ipfsHash, 0);

      toast.success('Post minted successfully! 🎉 Redirecting to home...');

      // Create notification for successful post creation
      try {
        // Extract token ID from transaction hash or use a placeholder
        const tokenId = txHash.slice(-6); // Use last 6 chars as token ID placeholder
        await NotificationService.createPostCreatedNotification(
          account.address,
          tokenId
        );
      } catch (notificationError) {
        console.error('Error creating post notification:', notificationError);
        // Don't fail the whole operation for notification error
      }

      // Call success callback to redirect to home
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500); // Small delay to show success message
      }

      return txHash;
    } catch (err: unknown) {
      console.error('Error in mintPost:', err);
      const errorMessage = (err as Error)?.message || 'Failed to mint post';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [account, address]);

  // Propose a sell
  const proposePostSell = useCallback(async (tokenId: string, price: number): Promise<string | null> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return null;
    }

    if (price <= 0) {
      toast.error('Price must be greater than 0');
      return null;
    }

    try {
      setLoading(true);
      setError(undefined);

      const txHash = await proposeSell(account, tokenId, price);
      toast.success('Sell proposal submitted! 💰');

      // Create notification for NFT listing
      try {
        await NotificationService.createNFTListedNotification(
          account.address,
          String(tokenId),
          String(price)
        );
      } catch (notificationError) {
        console.error('Error creating listing notification:', notificationError);
        // Don't fail the whole operation for notification error
      }

      return txHash;
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to propose sell';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Accept and reject sell functions removed - direct buying only

  // Buy a post directly
  const buyPostDirect = useCallback(async (tokenId: string): Promise<string | null> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      setLoading(true);
      setError(undefined);

      const txHash = await buyPost(account, tokenId);
      // Toast handling is done in buyPost function
      return txHash;
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to buy post';
      setError(errorMessage);
      // Error toast is handled in buyPost function
      return null;
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Cancel a sell proposal
  const cancelSellProposalFunc = useCallback(async (proposalId: string): Promise<string | null> => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      setLoading(true);
      setError(undefined);

      const txHash = await cancelSell(account, proposalId);
      toast.success('Sell proposal cancelled');
      return txHash;
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to cancel sell proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Fetch posts
  const fetchAllPosts = useCallback(async (offset: number = 0, limit: number = 20): Promise<Post[]> => {
    try {
      return await getAllPosts(offset, limit);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to fetch posts';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const fetchUserPosts = useCallback(async (userAddress: string): Promise<Post[]> => {
    try {
      return await getUserPosts(userAddress);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to fetch user posts';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const fetchPost = useCallback(async (tokenId: string): Promise<Post | null> => {
    try {
      return await getPostByTokenId(tokenId);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to fetch post';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // Check functions
  const checkCanPostToday = useCallback(async (userAddress?: string): Promise<boolean> => {
    const addressToCheck = userAddress || address;
    if (!addressToCheck) return false;

    try {
      return await canUserPostToday(addressToCheck);
    } catch (err: unknown) {
      console.error('Failed to check if user can post today:', err);
      return false;
    }
  }, [address]);

  const checkIsPostSwappable = useCallback(async (tokenId: string): Promise<boolean> => {
    try {
      return await isPostForSale(tokenId);
    } catch (err: unknown) {
      console.error('Failed to check if post is for sale:', err);
      return false;
    }
  }, []);

  const fetchSwapProposals = useCallback(async (userAddress?: string): Promise<any[]> => {
    const addressToCheck = userAddress || address;
    if (!addressToCheck) return [];

    try {
      return await getSellProposals(addressToCheck);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to fetch sell proposals';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, [address]);

  return {
    ...state,
    mintPost,
    proposePostSell,
    buyPost: buyPostDirect,
    cancelSellProposal: cancelSellProposalFunc,
    fetchAllPosts,
    fetchUserPosts,
    fetchPost,
    checkCanPostToday,
    checkIsPostForSale: checkIsPostSwappable,
    fetchSellProposals: fetchSwapProposals,
    getAllPostsForSale,
    getPostPrice,
    isPostForSale,
  };
};
