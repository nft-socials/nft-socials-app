import { Contract, Provider, AccountInterface } from 'starknet';
import type { Post as AppPost } from '@/context/AppContext';
import deployedContracts from '../../contracts/deployedContracts';
import { universalStrkAddress, strkAbi } from '../../utils/Constants';
import { toast } from 'react-hot-toast';

// Get contract info from deployedContracts
const CONTRACT_INFO = deployedContracts.sepolia.OnePostDaily;
const CONTRACT_ADDRESS = CONTRACT_INFO.address;
const CONTRACT_ABI = CONTRACT_INFO.abi;

function resolveAddress(): string {
  const envAddr = (import.meta as any).env?.VITE_CONTRACT_ADDRESS as string | undefined;
  const addr = envAddr || CONTRACT_ADDRESS;
  if (!addr) throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS or use deployedContracts.ts');
  return addr;
}

const provider = new Provider({});

// Utility to convert ByteArray to string
function byteArrayToString(byteArray: any): string {

  // If it's already a string, return it
  if (typeof byteArray === 'string') {
    return byteArray;
  }

  // If it's a ByteArray object with data array
  if (byteArray?.data && Array.isArray(byteArray.data)) {
    try {
      const result = byteArray.data.map((byte: any) => String.fromCharCode(Number(byte))).join('');
      return result;
    } catch (error) {
      console.error('Error converting ByteArray data:', error);
    }
  }

  // If it's a direct array
  if (Array.isArray(byteArray)) {
    try {
      const result = byteArray.map((byte: any) => String.fromCharCode(Number(byte))).join('');
      return result;
    } catch (error) {
      console.error('Error converting array:', error);
    }
  }

  // Fallback
  const fallback = String(byteArray || '');
  return fallback;
}

// Utility to convert string to ByteArray format
function stringToByteArray(str: string): any {
  return {
    data: Array.from(str).map(char => char.charCodeAt(0)),
    pending_word: 0,
    pending_word_len: 0
  };
}

// Utilities
const toAppPost = async (p: any): Promise<AppPost> => {
  const contentHash = byteArrayToString(p.content_hash);

  // Fetch content from IPFS using multiple gateways for better reliability
  let content = 'Loading content from IPFS...';
  try {

    // Try multiple IPFS gateways for better reliability
    const gateways = [
      `https://ipfs.io/ipfs/${contentHash}`,
      `https://gateway.pinata.cloud/ipfs/${contentHash}`,
      `https://cloudflare-ipfs.com/ipfs/${contentHash}`
    ];

    let data = null;
    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          data = await response.json();
          break;
        } else {
        }
      } catch (gatewayError) {
        continue;
      }
    }

    if (data) {
      // Use the content from IPFS metadata, or show a preview if there's an image
      if (data.content) {
        content = data.content;
      } else if (data.image) {
        content = '📸 Image Post';
      } else {
        content = 'No content available';
      }
    } else {
      content = 'Failed to load content from IPFS';
    }
  } catch (error) {
    console.error('IPFS fetch error:', error);
    content = 'Failed to load content from IPFS';
  }

  const post = {
    tokenId: String(p.token_id ?? p.tokenId ?? p.tokenID ?? '0'),
    author: `0x${BigInt(p.author).toString(16).padStart(64, '0')}`,
    currentOwner: `0x${BigInt(p.current_owner ?? p.currentOwner ?? p.author).toString(16).padStart(64, '0')}`,
    contentHash,
    content,
    timestamp: Number(BigInt(p.timestamp ?? Math.floor(Date.now() / 1000)) * 1000n),
    isSwappable: Boolean(p.is_swappable ?? p.isSwappable ?? true),
    isForSale: Boolean(p.is_for_sale ?? p.isForSale ?? false),
    price: Number(p.price ?? 0),
  };

  return post;
};

async function getContract(signer?: any) {
  const abi = CONTRACT_ABI;
  const address = resolveAddress();
  return new Contract(abi, address, signer ?? provider);
}

// READ FUNCTIONS
export async function getAllPosts(offset: number, limit: number): Promise<AppPost[]> {
  const contract = await getContract();
  const posts: any[] = await (contract as any).get_all_posts(offset, limit);
  const mappedPosts = await Promise.all(posts.map(toAppPost));
  return mappedPosts;
}

// Note: YourContractByteArray doesn't have daily posting restrictions
export async function canUserPostToday(user: string): Promise<boolean> {
  // Always return true since the new contract doesn't have daily restrictions
  return true;
}

export async function getUserPosts(user: string): Promise<AppPost[]> {
  const contract = await getContract();
  const posts: any[] = await (contract as any).get_user_posts(user);
  return Promise.all(posts.map(toAppPost));
}

export async function getSellProposals(user: string): Promise<any[]> {
  const contract = await getContract();
  const proposals: any[] = await (contract as any).get_sell_proposals(user);
  return proposals;
}

export async function getPostByTokenId(tokenId: string | number | bigint): Promise<AppPost> {
  const contract = await getContract();
  const post = await (contract as any).get_post_by_token_id(tokenId as any);
  return toAppPost(post);
}

export async function isPostForSale(tokenId: string | number | bigint): Promise<boolean> {
  const contract = await getContract();
  const result = await (contract as any).is_post_for_sale(tokenId as any);
  return Boolean(result);
}

export async function getPostPrice(tokenId: string | number | bigint): Promise<number> {
  const contract = await getContract();
  const price = await (contract as any).get_post_price(tokenId as any);
  return Number(price);
}

export async function getAllPostsForSale(offset: number, limit: number): Promise<AppPost[]> {
  const contract = await getContract();
  const posts: any[] = await (contract as any).get_all_posts_for_sale(offset, limit);
  return Promise.all(posts.map(toAppPost));
}

// WRITE FUNCTIONS (require connected account)
export async function createPost(account: AccountInterface, ipfsCid: string, price: number = 0): Promise<string> {
  const contract = await getContract(account);

  // For ByteArray in starknet.js, we need to pass the string directly
  // The library will handle the conversion to ByteArray format
  const contentHash = ipfsCid;
  const priceU256 = BigInt(price);

  const tx = await (contract as any).invoke('create_post', [contentHash, priceU256]);
  return tx?.transaction_hash ?? String(tx);
}

// For backward compatibility
export const createDailyPost = createPost;

export async function proposeSell(account: AccountInterface, tokenId: string | number | bigint, price: number): Promise<string> {
  const contract = await getContract(account);

  // Convert to proper u256 format
  const tokenU256 = { low: BigInt(tokenId), high: 0n };
  const priceU256 = price.toString();

  const tx = await (contract as any).invoke('propose_sell', [tokenU256, priceU256]);

  // Store the proposal mapping for later cancellation
  // Note: In a real implementation, we'd get the proposal_id from the transaction result
  // For now, we'll use a workaround by getting user's sell proposals
  const proposalMapping = JSON.parse(localStorage.getItem('sellProposals') || '{}');
  proposalMapping[String(tokenId)] = {
    tokenId: String(tokenId),
    price: price,
    timestamp: Date.now(),
    txHash: tx?.transaction_hash ?? String(tx)
  };
  localStorage.setItem('sellProposals', JSON.stringify(proposalMapping));

  return tx?.transaction_hash ?? String(tx);
}

// Accept and reject sell functions removed - direct buying only

// Helper function to get user's sell proposals and find proposal_id by token_id
async function getProposalIdByTokenId(account: AccountInterface, tokenId: string | number | bigint): Promise<string | null> {
  try {
    const contract = await getContract(account);
    const proposals: any[] = await (contract as any).get_sell_proposals(account.address);

    // Find active proposal for this token
    const proposal = proposals.find(p =>
      String(p.token_id) === String(tokenId) && p.is_active
    );

    return proposal ? String(proposal.id) : null;
  } catch (error) {
    console.error('Error getting proposal ID:', error);
    return null;
  }
}

export async function cancelSell(account: AccountInterface, tokenId: string | number | bigint): Promise<string> {
  // Get the proposal_id for this token
  const proposalId = await getProposalIdByTokenId(account, tokenId);

  if (!proposalId) {
    throw new Error('No active sell proposal found for this NFT');
  }

  const contract = await getContract(account);
  // Convert proposalId to proper format for felt252
  const tx = await (contract as any).invoke('cancel_sell', [proposalId]);

  // Clean up localStorage
  const proposalMapping = JSON.parse(localStorage.getItem('sellProposals') || '{}');
  delete proposalMapping[String(tokenId)];
  localStorage.setItem('sellProposals', JSON.stringify(proposalMapping));

  return tx?.transaction_hash ?? String(tx);
}

export async function buyPost(account: AccountInterface, tokenId: string | number | bigint): Promise<string> {
  const contract = await getContract(account);

  // Get post price
  const post = await getPostByTokenId(String(tokenId));
  const price = BigInt(post.price);

  // Check STRK balance
  const strkContract = new Contract(strkAbi, universalStrkAddress, account);
  const balanceResult = await strkContract.balanceOf(account.address);
  const balance = BigInt(balanceResult.low || balanceResult);


  if (balance < price) {
    throw new Error(`Insufficient STRK balance. Need ${price} STRK but have ${balance} STRK`);
  }

  // Convert to strings for serialization
  const tokenU256 = { low: BigInt(tokenId).toString(), high: '0' };
  const priceU256 = { low: price.toString(), high: '0' };

  // Execute multicall: approve + buy
  const multiCall = await account.execute([
    {
      contractAddress: universalStrkAddress,
      entrypoint: 'approve',
      calldata: [CONTRACT_ADDRESS, priceU256.low, priceU256.high]
    },
    {
      contractAddress: CONTRACT_ADDRESS,
      entrypoint: 'buy_post',
      calldata: [tokenU256.low, tokenU256.high]
    }
  ]);

  // Store sold NFT info
  const soldNFT = {
    tokenId: String(tokenId),
    buyer: account.address,
    timestamp: Date.now(),
    transactionHash: multiCall.transaction_hash
  };

  const existingSoldNFTs = JSON.parse(localStorage.getItem('soldNFTs') || '[]');
  existingSoldNFTs.push(soldNFT);
  localStorage.setItem('soldNFTs', JSON.stringify(existingSoldNFTs));

  // Create notification for the seller
  try {
    const { NotificationService } = await import('./notificationService');
    const buyerName = `User ${account.address.slice(-3)}.stark`;
    await NotificationService.createBuyNotification(
      post.currentOwner, // seller address
      account.address,   // buyer address
      buyerName,
      String(tokenId)
    );
  } catch (notificationError) {
    console.error('Error creating buy notification:', notificationError);
    // Don't throw error for notification failure
  }

  return multiCall.transaction_hash;
}



// Get sold NFTs from localStorage (temporary solution until we can query events)
export async function getSoldNFTs(): Promise<any[]> {
  try {
    const soldNFTs = JSON.parse(localStorage.getItem('soldNFTs') || '[]');

    // Get full post data for each sold NFT
    const soldPostsPromises = soldNFTs.map(async (soldNFT: any) => {
      try {
        const post = await getPostByTokenId(soldNFT.tokenId);
        return {
          ...post,
          soldAt: soldNFT.timestamp,
          buyer: soldNFT.buyer,
          transactionHash: soldNFT.transactionHash,
          // Mark as sold and add sale info
          isSold: true,
          salePrice: post.price || 0
        };
      } catch (error) {
        console.error('Error fetching sold post:', error);
        return null;
      }
    });

    const soldPosts = await Promise.all(soldPostsPromises);
    return soldPosts.filter(post => post !== null);
  } catch (error) {
    console.error('Error getting sold NFTs:', error);
    return [];
  }
}

// Get user's sold NFTs from contract mapping
export async function getUserSoldNFTs(userAddress: string): Promise<string[]> {
  const contract = await getContract();

  try {
    const soldTokenIds: any[] = await (contract as any).get_user_sold_nfts(userAddress);
    return soldTokenIds.map(id => String(id));
  } catch (error) {
    console.error('Error getting user sold NFTs:', error);
    return [];
  }
}

// Get all NFTs that have changed ownership (sold NFTs) - for global sold history
export async function getAllSoldNFTs(): Promise<any[]> {
  try {
    // Get all posts and check which ones have different author vs currentOwner
    // AND are not currently for sale (truly sold, not just listed)
    const allPosts = await getAllPosts(0, 1000);
    const soldPosts = allPosts.filter(post =>
      post.author.toLowerCase() !== post.currentOwner.toLowerCase() &&
      !post.isForSale // Only include NFTs that are not currently for sale
    );

    // Add sold status and detailed sale info
    return soldPosts.map(post => ({
      ...post,
      isSold: true,
      soldAt: post.timestamp + (24 * 60 * 60 * 1000), // Estimate sold 1 day after creation
      buyer: post.currentOwner,
      seller: post.author,
      transactionHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`, // Generate complete 64-char mock tx hash
      salePrice: post.price || 0,
      // Additional info for sold NFTs
      createdAt: post.timestamp,
      currentOwner: post.currentOwner,
      originalAuthor: post.author,
      isCurrentlyForSale: post.isForSale || false,
      currentPrice: post.price || 0
    }));
  } catch (error) {
    console.error('Error getting all sold NFTs:', error);
    return [];
  }
}

// Backward compatibility aliases
export const proposeSwap = proposeSell;
// acceptSwap and rejectSwap removed - direct buying only
