import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { storeOnIPFS, getFromIPFS, PostMetadata } from '@/services/ipfs';

export interface IPFSState {
  isUploading: boolean;
  isDownloading: boolean;
  error?: string;
}

export const useIPFS = () => {
  const [state, setState] = useState<IPFSState>({ 
    isUploading: false, 
    isDownloading: false 
  });

  const setUploading = (isUploading: boolean) => {
    setState(prev => ({ ...prev, isUploading }));
  };

  const setDownloading = (isDownloading: boolean) => {
    setState(prev => ({ ...prev, isDownloading }));
  };

  const setError = (error?: string) => {
    setState(prev => ({ ...prev, error }));
  };

  // Upload content to IPFS
  const uploadToIPFS = useCallback(async (
    content: string, 
    author: string,
    additionalData?: Record<string, any>
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setError(undefined);

      const metadata: PostMetadata = {
        content,
        timestamp: Date.now(),
        author,
        version: '1.0',
        ...additionalData
      };

      const hash = await storeOnIPFS(metadata);
      toast.success('Content uploaded to IPFS successfully!');
      return hash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to upload to IPFS';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // Upload image file to IPFS
  const uploadImageToIPFS = useCallback(async (
    file: File,
    maxSizeMB: number = 2
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setError(undefined);

      // Check file size (max 2MB as per requirements)
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Convert file to base64 for storage
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const metadata = {
        type: 'image',
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        data: base64,
        timestamp: Date.now(),
        version: '1.0'
      };

      // Note: For production, you'd want to use a proper image storage service
      // This is a simplified approach for the hackathon
      const hash = await storeOnIPFS(metadata as any);
      toast.success('Image uploaded successfully!');
      return hash;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to upload image';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // Download content from IPFS
  const downloadFromIPFS = useCallback(async <T = PostMetadata>(
    hash: string
  ): Promise<T | null> => {
    try {
      setDownloading(true);
      setError(undefined);

      const data = await getFromIPFS<T>(hash);
      if (!data) {
        throw new Error('Content not found on IPFS');
      }

      return data;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to download from IPFS';
      setError(errorMessage);
      console.error('IPFS download error:', errorMessage);
      return null;
    } finally {
      setDownloading(false);
    }
  }, []);

  // Get IPFS gateway URL
  const getIPFSUrl = useCallback((hash: string, gateway: string = 'https://ipfs.io/ipfs/'): string => {
    return `${gateway}${hash}`;
  }, []);

  // Validate IPFS hash
  const isValidIPFSHash = useCallback((hash: string): boolean => {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[a-z2-7]{58}$/;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }, []);

  return {
    ...state,
    uploadToIPFS,
    uploadImageToIPFS,
    downloadFromIPFS,
    getIPFSUrl,
    isValidIPFSHash,
  };
};
