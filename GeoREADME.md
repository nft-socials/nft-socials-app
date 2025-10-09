# 🎨 OnePostDaily - NFT Social Platform on Starknet

## 📖 What is OnePostDaily?

OnePostDaily is a revolutionary social media platform built on Starknet where **every post becomes an NFT**! Think of it as Instagram meets blockchain - users can create one post per day, and each post is minted as a unique Non-Fungible Token (NFT) that can be owned, traded, and swapped with other users.

### 🌟 Key Features

- **Daily Post Limit**: Users can only create one post per day, making each post special and valuable
- **NFT Posts**: Every post is automatically minted as an ERC-721 compatible NFT
- **Post Selling**: Users can list their posts for sale on the platform
- **IPFS Storage**: Post content is stored on IPFS (InterPlanetary File System) for decentralized storage
- **Ownership Tracking**: Full ownership history and transfer capabilities
- **Social Trading**: A marketplace where social content becomes tradeable assets

## 🏗️ How It Works (Simple Explanation)

### For Non-Technical Users:

1. **Create Account**: Connect your Starknet wallet to the platform
2. **Daily Post**: Share one piece of content per day (photo, text, etc.)
3. **Automatic NFT**: Your post becomes a unique digital collectible automatically
4. **Trade & Swap**: Propose trades with other users' posts you like
5. **Own & Collect**: Build a collection of unique social content NFTs

### For Technical Users:

1. **Smart Contract**: Built in Cairo for Starknet blockchain
2. **ERC-721 Standard**: Implements NFT standard with custom social features
3. **Daily Minting**: Time-based restrictions ensure one post per 24-hour period
4. **Swap Mechanism**: Peer-to-peer trading system with proposal/acceptance flow
5. **IPFS Integration**: Content hashes stored on-chain, actual content on IPFS

## 🔧 Technical Architecture

### Smart Contract Structure

```
OnePostDaily.cairo
├── Post Struct
│   ├── token_id: Unique identifier
│   ├── author: Original creator
│   ├── current_owner: Current NFT owner
│   ├── content_hash: IPFS hash array
│   ├── timestamp: Creation time
│   └── is_swappable: Trading status
│
├── Core Functions
│   ├── create_daily_post(): Mint new post NFT
│   ├── propose_swap(): Initiate trade
│   ├── accept_swap(): Complete trade
│   └── reject_swap(): Decline trade
│
└── ERC-721 Functions
    ├── Standard NFT operations
    ├── Transfer functions
    └── Approval mechanisms
```

### Storage Maps

- **posts**: Maps token_id → Post data
- **user_daily_posts**: Maps (user, day) → token_id (prevents multiple daily posts)
- **user_last_post_day**: Tracks user's last posting day
- **swap_proposals**: Maps proposal_id → SwapProposal data
- **user_posts**: Maps (user, index) → token_id (for user post queries)

## 🚨 Current Issues & Planned Improvements

### High Priority Security & Functionality Issues

#### 1. **Interface Inconsistency (content_hash type mismatch)**
- **Problem**: Different files use different types for content_hash
  - `OnePostDaily.cairo` uses `Array<felt252>`
  - `IonePostDaily.cairo` uses `felt252`
- **Impact**: Compilation errors and data inconsistency
- **Solution**: Standardize to `Array<felt252>` for IPFS CID compatibility

#### 2. **Incorrect Swappable Logic**
- **Problem**: Posts are marked swappable immediately upon creation
- **Current Code**: `is_swappable: true, // Changed: making all posts swappable for testing`
- **Correct Logic**: Posts should only become swappable after user creates next day's post
- **Security Risk**: Allows immediate trading, breaking the "daily commitment" concept

#### 3. **Missing Emergency Pause Mechanism**
- **Problem**: No way to pause contract in emergency situations
- **Risk**: Cannot stop malicious activity or fix critical bugs
- **Solution**: Implement pausable functions for critical operations

#### 4. **Inefficient Query Performance**
- **Problem**: `get_swap_proposals` loops through all proposals (O(n) complexity)
- **Impact**: High gas costs and slow performance with many proposals
- **Solution**: Implement indexed storage for user-specific proposals

### Medium Priority Feature Enhancements

#### 5. **Creator Royalties**
- **Missing**: No royalty system for original creators
- **Plan**: Implement EIP-2981 style royalties on secondary sales

#### 6. **Post Metadata Storage**
- **Missing**: No title/description fields
- **Plan**: Add metadata fields to Post struct

#### 7. **Pagination Support**
- **Issue**: Functions return entire arrays, causing gas issues
- **Plan**: Add offset/limit parameters to all query functions

#### 8. **Batch Operations**
- **Missing**: No bulk operations support
- **Plan**: Add batch functions for multiple actions

### Low Priority Optimizations

#### 9. **Gas Optimizations**
- **Target**: Reduce storage costs and computation
- **Methods**: Storage packing, loop optimizations

#### 10. **Better Error Messages**
- **Current**: Generic assertion failures
- **Plan**: Descriptive error messages for better UX

#### 11. **Enhanced Events**
- **Missing**: Limited event coverage for indexing
- **Plan**: Add comprehensive events for all state changes

#### 12. **IPFS CID Reconstruction**
- **Issue**: token_uri may have formatting problems
- **Plan**: Fix hex formatting and CID reconstruction

## 🛠️ Development Setup

### Prerequisites
- Node.js (>= v22)
- Yarn package manager
- Starknet development tools (Scarb, Starknet Foundry)
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd nft-socials-app

# Install dependencies
yarn install

# Start local Starknet devnet
yarn chain

# Deploy contracts
yarn deploy

# Start frontend
yarn start
```

### Project Structure
```
nft-socials-app/
├── packages/
│   ├── snfoundry/          # Smart contracts
│   │   ├── contracts/src/  # Cairo contracts
│   │   ├── scripts-ts/     # Deployment scripts
│   │   └── tests/          # Contract tests
│   └── frontend/           # Next.js frontend
├── README.md               # Main project README
└── GeoREADME.md           # This detailed explanation
```

## 🧪 Testing Strategy

### Current Test Coverage
- Basic contract deployment tests exist but are commented out
- No comprehensive test suite for social features

### Recommended Test Cases
1. **Daily Posting Limits**
   - Test one post per day restriction
   - Test posting on consecutive days
   - Test timezone handling

2. **Swap Functionality**
   - Test proposal creation and acceptance
   - Test swap cooldowns
   - Test unauthorized swap attempts

3. **NFT Operations**
   - Test minting, transfers, approvals
   - Test ownership tracking
   - Test metadata retrieval

4. **Edge Cases**
   - Test with maximum array sizes
   - Test gas limit scenarios
   - Test invalid input handling

## 🔐 Security Considerations

### Current Security Features
- ✅ Daily posting restrictions
- ✅ Ownership verification for swaps
- ✅ ERC-721 standard compliance
- ✅ Access control for transfers

### Security Improvements Needed
- ❌ Emergency pause mechanism
- ❌ Reentrancy protection
- ❌ Input validation improvements
- ❌ Rate limiting for proposals

## 🚀 Future Roadmap

### Phase 1: Core Fixes (High Priority)
- Fix interface inconsistencies
- Implement correct swappable logic
- Add emergency pause mechanism
- Optimize query performance

### Phase 2: Feature Enhancement (Medium Priority)
- Add creator royalties
- Implement post metadata
- Add pagination support
- Create batch operations

### Phase 3: Optimization (Low Priority)
- Gas optimizations
- Better error handling
- Enhanced events
- UI/UX improvements

## 📱 Mobile-First Approach

The platform is designed with mobile users in mind:
- **PWA Support**: Offline-first progressive web app
- **Camera Integration**: Direct photo posting from mobile
- **Touch Optimization**: Swipe gestures for trading
- **Push Notifications**: Daily post reminders
- **Wallet Integration**: Seamless mobile wallet connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow Cairo best practices
- Add comprehensive tests
- Update documentation
- Use descriptive commit messages

## 📄 License

This project is open source and available under the MIT License.

## 🔍 Detailed Technical Analysis

### Current Contract Issues Deep Dive

#### Issue 1: Interface Type Mismatch
**Location**: `OnePostDaily.cairo` vs `IonePostDaily.cairo`

**Current State**:
```cairo
// In OnePostDaily.cairo (Line 40)
content_hash: Array<felt252>,

// In IonePostDaily.cairo (Line 8)
content_hash: felt252,
```

**Why This Matters**:
- IPFS CIDs are typically 46+ characters long
- A single `felt252` can only hold ~31 characters
- Array format allows proper CID storage and reconstruction
- Type mismatch prevents proper interface implementation

**Fix Required**:
- Standardize all interfaces to use `Array<felt252>`
- Update function signatures consistently
- Ensure no data truncation occurs

#### Issue 2: Premature Swappable Status
**Location**: `OnePostDaily.cairo` Line 204

**Current Problematic Code**:
```cairo
is_swappable: true, // Changed: making all posts swappable for testing
```

**Correct Logic Should Be**:
```cairo
// Posts should only be swappable after next day's post
is_swappable: false, // Initially false
// Set to true only when user posts next day
```

**Implementation Strategy**:
1. Check if user has posted on a day after the post's day
2. Use `user_last_post_day` mapping to verify subsequent posts
3. Add function to update swappable status when new posts are created
4. Prevent immediate trading to maintain platform integrity

#### Issue 3: Missing Emergency Controls
**Current State**: No pause mechanism exists

**Required Implementation**:
```cairo
// Storage additions needed
paused: bool,
owner: ContractAddress,

// Functions needed
fn pause(ref self: ContractState)
fn unpause(ref self: ContractState)
fn when_not_paused(self: @ContractState) // Internal check

// Events needed
event Paused { account: ContractAddress }
event Unpaused { account: ContractAddress }
```

**Functions to Protect**:
- `create_daily_post`
- `propose_swap`
- `accept_swap`
- `transfer_from`

#### Issue 4: Query Performance Problems
**Current Implementation**: `get_swap_proposals` (Lines ~350-380)

**Problem**:
```cairo
// Current: O(n) linear search through all proposals
let mut proposals = ArrayTrait::new();
let mut i = 1;
while i < self.proposal_counter.read() {
    let proposal = self.swap_proposals.read(i);
    if proposal.target == user && proposal.is_active {
        proposals.append(proposal);
    }
    i += 1;
}
```

**Optimized Solution**:
```cairo
// Add new storage maps
user_incoming_proposals: Map<(ContractAddress, u32), felt252>,
user_proposal_count: Map<ContractAddress, u32>,

// O(k) where k = user's proposals only
fn get_swap_proposals(self: @ContractState, user: ContractAddress) -> Array<SwapProposal> {
    let count = self.user_proposal_count.read(user);
    let mut proposals = ArrayTrait::new();
    let mut i = 0;
    while i < count {
        let proposal_id = self.user_incoming_proposals.read((user, i));
        let proposal = self.swap_proposals.read(proposal_id);
        if proposal.is_active && proposal.expiration > get_block_timestamp() {
            proposals.append(proposal);
        }
        i += 1;
    }
    proposals
}
```

### Proposed Feature Implementations

#### Creator Royalties System
**Implementation Plan**:
```cairo
// Add to Post struct
royalty_percentage: u256, // Basis points (e.g., 500 = 5%)

// New function
fn royalty_info(self: @ContractState, token_id: u256, sale_price: u256) -> (ContractAddress, u256) {
    let post = self.posts.read(token_id);
    let royalty_amount = (sale_price * post.royalty_percentage) / 10000;
    (post.author, royalty_amount)
}

// Integration in swap/transfer functions
fn accept_swap(ref self: ContractState, proposal_id: felt252) {
    // ... existing logic ...

    // Calculate and handle royalties if applicable
    let (royalty_receiver, royalty_amount) = self.royalty_info(token_id, estimated_value);
    if royalty_amount > 0 {
        // Handle royalty payment logic
    }

    // ... complete swap ...
}
```

#### Enhanced Post Metadata
**Storage Additions**:
```cairo
// Extend Post struct
struct Post {
    token_id: u256,
    author: ContractAddress,
    current_owner: ContractAddress,
    content_hash: Array<felt252>,
    timestamp: u64,
    is_swappable: bool,
    title: ByteArray,        // New field
    description: ByteArray,  // New field
    category: felt252,       // New field for categorization
}
```

**Updated Functions**:
```cairo
fn create_daily_post(
    ref self: ContractState,
    content_hash: Array<felt252>,
    title: ByteArray,
    description: ByteArray
) -> u256 {
    // ... validation ...

    let post = Post {
        token_id,
        author: caller,
        current_owner: caller,
        content_hash,
        timestamp: current_time,
        is_swappable: false, // Fixed: initially false
        title,
        description,
        category: 0, // Default category
    };

    // ... rest of implementation ...
}
```

### Gas Optimization Strategies

#### Storage Packing
**Current**: Each field uses separate storage slot
**Optimized**: Pack related fields together
```cairo
// Pack timestamp and boolean flags
struct PackedData {
    timestamp: u64,        // 64 bits
    is_swappable: bool,    // 1 bit
    category: u8,          // 8 bits
    // Total: 73 bits (fits in one felt252)
}
```

#### Loop Optimizations
**Current**: Multiple separate loops for indexing
**Optimized**: Combined operations where possible
```cairo
// Instead of separate loops for all_posts and user_posts
// Combine into single operation with batch updates
```

### Testing Framework Recommendations

#### Unit Tests Structure
```cairo
// test_daily_posting.cairo
#[test]
fn test_one_post_per_day_limit() { /* ... */ }

#[test]
fn test_consecutive_day_posting() { /* ... */ }

#[test]
fn test_swappable_logic_after_next_post() { /* ... */ }

// test_swap_functionality.cairo
#[test]
fn test_propose_swap_valid() { /* ... */ }

#[test]
fn test_swap_cooldown_enforcement() { /* ... */ }

#[test]
fn test_unauthorized_swap_rejection() { /* ... */ }

// test_emergency_controls.cairo
#[test]
fn test_pause_functionality() { /* ... */ }

#[test]
fn test_paused_state_blocks_operations() { /* ... */ }
```

#### Integration Tests
```cairo
// test_full_user_journey.cairo
#[test]
fn test_complete_user_flow() {
    // 1. Create daily post
    // 2. Wait for next day
    // 3. Create another post (makes first swappable)
    // 4. Propose swap with another user
    // 5. Accept swap
    // 6. Verify ownership transfer
    // 7. Check royalty payments
}
```

### Deployment & Migration Strategy

#### Phase 1: Critical Fixes
1. Deploy fixed interface contracts
2. Migrate existing data if needed
3. Test on devnet thoroughly
4. Deploy to testnet for community testing

#### Phase 2: Feature Rollout
1. Deploy enhanced contracts with new features
2. Update frontend to support new functionality
3. Gradual feature activation
4. Monitor performance and user feedback

#### Phase 3: Optimization
1. Deploy optimized versions
2. Performance monitoring
3. Gas usage analysis
4. User experience improvements

---

**Built with ❤️ on Starknet using Cairo, Next.js, and IPFS**

*OnePostDaily: Where every day matters, every post counts, and every moment becomes a collectible.*
