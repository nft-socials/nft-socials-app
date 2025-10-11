# Cancel Sell Fix - Proposal ID Issue

## Problem Analysis

The `cancel_sell` function was failing with error: `Not proposal seller` because:

1. **Wrong Parameter:** We were passing `tokenId` to `cancel_sell`, but it expects `proposal_id`
2. **Missing Mapping:** When `propose_sell` creates a sell proposal, it returns a `proposal_id`, but we weren't storing this mapping
3. **Contract Logic:** The contract checks `proposal.seller == caller` using the `proposal_id`, not `tokenId`

## Root Cause

```cairo
// Contract expects proposal_id (felt252)
fn cancel_sell(ref self: TContractState, proposal_id: felt252) {
    let caller = get_caller_address();
    let mut proposal = self.sell_proposals.read(proposal_id);
    
    assert(proposal.is_active, 'Proposal not active');
    assert(proposal.seller == caller, 'Not proposal seller'); // This was failing
    // ...
}
```

But we were calling:
```typescript
// Wrong: passing tokenId instead of proposal_id
await (contract as any).invoke('cancel_sell', [tokenId]);
```

## Solution Implemented

### 1. **Updated cancelSell Function**
```typescript
export async function cancelSell(account: AccountInterface, tokenId: string | number | bigint): Promise<string> {
  // Get the proposal_id for this token
  const proposalId = await getProposalIdByTokenId(account, tokenId);
  
  if (!proposalId) {
    throw new Error('No active sell proposal found for this NFT');
  }
  
  const contract = await getContract(account);
  const tx = await (contract as any).invoke('cancel_sell', [proposalId]); // Correct proposal_id
  
  // Clean up localStorage
  const proposalMapping = JSON.parse(localStorage.getItem('sellProposals') || '{}');
  delete proposalMapping[String(tokenId)];
  localStorage.setItem('sellProposals', JSON.stringify(proposalMapping));
  
  return tx?.transaction_hash ?? String(tx);
}
```

### 2. **Added Helper Function**
```typescript
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
```

### 3. **Enhanced proposeSell Function**
```typescript
export async function proposeSell(account: AccountInterface, tokenId: string | number | bigint, price: number): Promise<string> {
  // ... existing code ...
  
  // Store the proposal mapping for later cancellation
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
```

## How It Works Now

1. **When Listing NFT for Sale:**
   - `proposeSell` creates sell proposal on contract
   - Contract returns `proposal_id` 
   - We store mapping in localStorage for tracking

2. **When Canceling Sale:**
   - `cancelSell` receives `tokenId` from UI
   - Calls `getProposalIdByTokenId` to find the correct `proposal_id`
   - Uses contract's `get_sell_proposals(user_address)` to find active proposal
   - Calls `cancel_sell` with correct `proposal_id`
   - Cleans up localStorage mapping

3. **Error Handling:**
   - If no active proposal found, throws clear error message
   - Proper error handling for contract calls

## Testing Steps

1. **List NFT for Sale:**
   ```
   - Go to profile or marketplace
   - Click "Sell" on an NFT
   - Set price and confirm
   - Verify NFT appears as "For Sale"
   ```

2. **Cancel Sale:**
   ```
   - Click "Cancel" on the listed NFT
   - Should succeed without "Not proposal seller" error
   - Verify NFT no longer shows as "For Sale"
   - Check UI updates immediately
   ```

3. **Edge Cases:**
   ```
   - Try canceling non-listed NFT (should show error)
   - Try canceling someone else's NFT (should fail)
   - List and cancel multiple NFTs
   ```

## Key Changes Made

- ✅ **Fixed Parameter:** Now passes `proposal_id` instead of `tokenId`
- ✅ **Added Proposal Lookup:** Queries contract for user's active proposals
- ✅ **Better Error Handling:** Clear error messages for missing proposals
- ✅ **Data Cleanup:** Removes localStorage entries after cancellation
- ✅ **Backward Compatibility:** UI still passes `tokenId`, function handles conversion

The cancel sell functionality should now work correctly!
