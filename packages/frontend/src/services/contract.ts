import { Contract, Provider, shortString } from 'starknet';
import type { Post as AppPost } from '@/context/AppContext';
import { CONTRACT_ADDRESS } from '@/utils/constants';

// Load ABI at runtime from /abi.json (place this file in public or serve it at root)
let ABI_CACHE: any | null = null;
async function loadAbi(): Promise<any> {
  if (ABI_CACHE) return ABI_CACHE;
  const res = await fetch('/abi.json');
  if (!res.ok) throw new Error('Failed to load ABI from /abi.json');
  ABI_CACHE = await res.json();
  return ABI_CACHE;
}

function resolveAddress(): string {
  const envAddr = (import.meta as any).env?.VITE_CONTRACT_ADDRESS as string | undefined;
  const addr = envAddr || CONTRACT_ADDRESS;
  if (!addr) throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS or utils/constants.ts');
  return addr;
}

const provider = new Provider({});

// Utilities
const toAppPost = async (p: any): Promise<AppPost> => {
   const contentHash = shortString.decodeShortString(String(p.content_hash));
    
    // Fetch content from IPFS
    let content = 'Loading content from IPFS...';
    try {
        const response = await fetch(`https://ipfs.io/ipfs/${"bafkreictllsijsy7kz35dezrggyuwvylvywhet4pcsgcpa7sxmrly3n3iu"}`);
        content = (await response.json()).content;
    } catch (error) {
        content = 'Failed to load content from IPFS';
    }

  return {
    tokenId: String(p.token_id ?? p.tokenId ?? p.tokenID ?? '0'),
    author: `0x${BigInt(p.author).toString(16).padStart(64, '0')}`,
    contentHash,
    content,
    timestamp: Number(BigInt(p.timestamp ?? Math.floor(Date.now() / 1000)) * 1000n),
    isSwappable: Boolean(p.is_swappable ?? p.isSwappable ?? false),
}};

async function getContract(signer?: any) {
  const abi = await loadAbi();
  const address = resolveAddress();
  console.log(address, signer)
  return new Contract(abi, address, signer ?? provider);
}

// READ FUNCTIONS
export async function getAllPosts(offset: number, limit: number): Promise<AppPost[]> {
  const contract = await getContract();
  const posts: any[] = await (contract as any).get_all_posts(offset, limit);
  return Promise.all(posts.map(toAppPost));
}

export async function canUserPostToday(user: string): Promise<boolean> {
  const contract = await getContract();
  const result = await (contract as any).can_user_post_today(user);
  return Boolean(result);
}

export async function getUserPosts(user: string): Promise<AppPost[]> {
  const contract = await getContract();
  const posts: any[] = await (contract as any).get_user_posts(user);
  return Promise.all(posts.map(toAppPost));
}

export async function getSwapProposals(user: string): Promise<any[]> {
  const contract = await getContract();
  const proposals: any[] = await (contract as any).get_swap_proposals(user);
  return proposals;
}

export async function getPostByTokenId(tokenId: string | number | bigint): Promise<AppPost> {
  const contract = await getContract();
  const post = await (contract as any).get_post_by_token_id(tokenId as any);
  return toAppPost(post);
}

export async function isPostSwappable(tokenId: string | number | bigint): Promise<boolean> {
  const contract = await getContract();
  const result = await (contract as any).is_post_swappable(tokenId as any);
  return Boolean(result);
}

export async function getUserLastSwapTime(user: string, tokenId: string | number | bigint): Promise<number> {
  const contract = await getContract();
  const ts = await (contract as any).get_user_last_swap_time(user, tokenId as any);
  return Number(ts);
}

// WRITE FUNCTIONS (require connected account)
// export async function createDailyPost(account: any, contentHash: string): Promise<string> {
//   const contract = await getContract(account);
//   const tx = await (contract as any).invoke('create_daily_post', [contentHash]);
//   return tx?.transaction_hash ?? String(tx);
// }

export async function createDailyPost(account: any, ipfsCid: string): Promise<string> {
  console.log("kjhhh")
  const contract = await getContract(account);
  // Encode CID into an array of short-string felts (<=31 chars each) for Cairo
  const chunks = Array.from({ length: Math.ceil(ipfsCid.length / 31) }, (_, i) =>
    ipfsCid.slice(i * 31, (i + 1) * 31)
  );
  const felts = chunks.map((c) => shortString.encodeShortString(c));
console.log({chunks, felts, ipfsCid})
// return
  const tx = await (contract as any).invoke('create_daily_post', [felts[0], felts[1]]);
  return tx?.transaction_hash ?? String(tx);
}

export async function proposeSwap(account: any, myTokenId: string | number | bigint, targetTokenId: string | number | bigint): Promise<string> {
  console.log(account, myTokenId, targetTokenId)
  const contract = await getContract(account);

   // Convert to proper u256 format
  const myTokenU256 = { low: BigInt(myTokenId), high: 0n };
  const targetTokenU256 = { low: BigInt(targetTokenId), high: 0n };

  const tx = await (contract as any).invoke('propose_swap', [myTokenU256, targetTokenU256]);
  return tx?.transaction_hash ?? String(tx);
}

export async function acceptSwap(account: any, proposalId: string | number | bigint): Promise<string> {
  const contract = await getContract(account);
  const tx = await (contract as any).invoke('accept_swap', [proposalId as any]);
  return tx?.transaction_hash ?? String(tx);
}

export async function rejectSwap(account: any, proposalId: string | number | bigint): Promise<string> {
  const contract = await getContract(account);
  const tx = await (contract as any).invoke('reject_swap', [proposalId as any]);
  return tx?.transaction_hash ?? String(tx);
}
