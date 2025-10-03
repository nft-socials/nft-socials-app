use starknet::{ContractAddress};
use core::byte_array::ByteArray;

#[starknet::interface]
trait IOnePostDaily<TContractState> {
    // Post creation
    fn create_daily_post(ref self: TContractState, content_hash: ByteArray) -> u256;
    
    // Swap functions
    fn propose_swap(ref self: TContractState, my_token_id: u256, target_token_id: u256) -> felt252;
    fn accept_swap(ref self: TContractState, proposal_id: felt252);
    fn reject_swap(ref self: TContractState, proposal_id: felt252);
    
    // View functions
    fn get_user_posts(self: @TContractState, user: ContractAddress) -> Array<Post>;
    fn get_swap_proposals(self: @TContractState, user: ContractAddress) -> Array<SwapProposal>;
    fn get_all_posts(self: @TContractState, offset: u32, limit: u32) -> Array<Post>;
    fn can_user_post_today(self: @TContractState, user: ContractAddress) -> bool;
    fn get_post_by_token_id(self: @TContractState, token_id: u256) -> Post;
    fn is_post_swappable(self: @TContractState, token_id: u256) -> bool;
    fn get_user_last_swap_time(self: @TContractState, user: ContractAddress, token_id: u256) -> u64;
    
    // ERC721 functions
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
    fn approve(ref self: TContractState, to: ContractAddress, token_id: u256);
    fn get_approved(self: @TContractState, token_id: u256) -> ContractAddress;
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn is_approved_for_all(self: @TContractState, owner: ContractAddress, operator: ContractAddress) -> bool;
    fn transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u256);
}

#[derive(Drop, Serde, starknet::Store)]
struct Post {
    token_id: u256,
    author: ContractAddress,
    current_owner: ContractAddress,
    content_hash: ByteArray,
    timestamp: u64,
    is_swappable: bool,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
struct SwapProposal {
    id: felt252,
    initiator_token_id: u256,
    target_token_id: u256,
    initiator: ContractAddress,
    target: ContractAddress,
    expiration: u64,
    is_active: bool,
}

#[starknet::contract]
mod OnePostDaily {
    use super::{IOnePostDaily, Post, SwapProposal};
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp,
        storage::{
            Map, StorageMapReadAccess, StorageMapWriteAccess,
            StoragePointerReadAccess, StoragePointerWriteAccess
        }
    };
    use core::byte_array::ByteArray;
    use core::byte_array::ByteArrayTrait;
    // use core::pedersen::pedersen;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        // ERC721 storage
        name: ByteArray,
        symbol: ByteArray,
        owners: Map<u256, ContractAddress>,
        balances: Map<ContractAddress, u256>, 
        token_approvals: Map<u256, ContractAddress>,
        operator_approvals: Map<(ContractAddress, ContractAddress), bool>,
        
        // Post storage
        posts: Map<u256, Post>,
        user_daily_posts: Map<(ContractAddress, u64), u256>, // user -> day -> token_id
        user_last_post_day: Map<ContractAddress, u64>,
        token_counter: u256,
        
        // Swap storage
        swap_proposals: Map<felt252, SwapProposal>,
        user_token_last_swap: Map<(ContractAddress, u256), u64>, // cooldown tracking
        proposal_counter: felt252,
        
        // Indexes for queries
        all_posts: Map<u32, u256>, // index -> token_id
        total_posts: u32,
        user_posts: Map<(ContractAddress, u32), u256>, // user -> index -> token_id
        user_post_count: Map<ContractAddress, u32>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PostCreated: PostCreated,
        SwapProposed: SwapProposed,
        SwapAccepted: SwapAccepted,
        SwapRejected: SwapRejected,
        Transfer: Transfer,
        Approval: Approval,
        ApprovalForAll: ApprovalForAll,
    }

    #[derive(Drop, starknet::Event)]
    struct PostCreated {
        #[key]
        token_id: u256,
        #[key]
        author: ContractAddress,
        content_hash: ByteArray,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct SwapProposed {
        #[key]
        proposal_id: felt252,
        #[key]
        initiator: ContractAddress,
        #[key]
        target: ContractAddress,
        initiator_token_id: u256,
        target_token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SwapAccepted {
        #[key]
        proposal_id: felt252,
        initiator_token_id: u256,
        target_token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SwapRejected {
        #[key]
        proposal_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        #[key]
        from: ContractAddress,
        #[key]
        to: ContractAddress,
        #[key]
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        #[key]
        owner: ContractAddress,
        #[key]
        approved: ContractAddress,
        #[key]
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalForAll {
        #[key]
        owner: ContractAddress,
        #[key]
        operator: ContractAddress,
        approved: bool,
    }

    const SECONDS_PER_DAY: u64 = 86400;
    const SWAP_COOLDOWN: u64 = 86400; // 24 hours
    const PROPOSAL_EXPIRATION: u64 = 604800; // 7 days

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.name.write("One Post Daily");
        self.symbol.write("OPD");
        self.token_counter.write(1);
        self.proposal_counter.write(1);
    }

    #[abi(embed_v0)]
    impl OnePostDailyImpl of IOnePostDaily<ContractState> {
        fn create_daily_post(ref self: ContractState, content_hash: ByteArray) -> u256 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let current_day = current_time / SECONDS_PER_DAY;
            
            // Check if user already posted today
            assert(self.can_user_post_today(caller), 'Already posted today');
            
            let token_id = self.token_counter.read();
            
            // Create post
            let post = Post {
                token_id,
                author: caller,
                current_owner: caller,
                content_hash,
                timestamp: current_time,
                is_swappable: true,
            };
            
            // Store post
            self.posts.write(token_id, post);
            self.user_daily_posts.write((caller, current_day), token_id);
            self.user_last_post_day.write(caller, current_day);
            
            // Update indexes
            let total_posts = self.total_posts.read();
            self.all_posts.write(total_posts, token_id);
            self.total_posts.write(total_posts + 1);
            
            let user_count = self.user_post_count.read(caller);
            self.user_posts.write((caller, user_count), token_id);
            self.user_post_count.write(caller, user_count + 1);
            
            // Mint NFT
            self._mint(caller, token_id);
            
            // Make previous posts swappable
            if current_day > 0 {
                let yesterday_token_id = self.user_daily_posts.read((caller, current_day - 1));
                if yesterday_token_id != 0 {
                    let mut yesterday_post = self.posts.read(yesterday_token_id);
                    yesterday_post.is_swappable = true;
                    self.posts.write(yesterday_token_id, yesterday_post);
                }
            }
            
            self.token_counter.write(token_id + 1);
            
            let created_post = self.posts.read(token_id);
            self.emit(PostCreated {
                token_id,
                author: caller,
                content_hash: created_post.content_hash,
                timestamp: current_time,
            });
            
            token_id
        }

        fn propose_swap(ref self: ContractState, my_token_id: u256, target_token_id: u256) -> felt252 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            // Validate tokens exist and are swappable
            let my_post = self.posts.read(my_token_id);
            let target_post = self.posts.read(target_token_id);
            
            assert(my_post.current_owner == caller, 'Not owner of token');
            assert(my_post.is_swappable, 'Token not swappable');
            assert(target_post.is_swappable, 'Target not swappable');
            assert(my_token_id != target_token_id, 'Cannot swap with self');
            
            // Check cooldown
            let last_swap = self.user_token_last_swap.read((caller, my_token_id));
            assert(current_time >= last_swap + SWAP_COOLDOWN, 'Swap cooldown active');
            
            let proposal_id = self.proposal_counter.read();
            
            let proposal = SwapProposal {
                id: proposal_id,
                initiator_token_id: my_token_id,
                target_token_id: target_token_id,
                initiator: caller,
                target: target_post.current_owner,
                expiration: current_time + PROPOSAL_EXPIRATION,
                is_active: true,
            };
            
            self.swap_proposals.write(proposal_id, proposal);
            self.proposal_counter.write(proposal_id + 1);
            
            self.emit(SwapProposed {
                proposal_id,
                initiator: caller,
                target: target_post.current_owner,
                initiator_token_id: my_token_id,
                target_token_id: target_token_id,
            });
            
            proposal_id
        }

        fn accept_swap(ref self: ContractState, proposal_id: felt252) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let proposal = self.swap_proposals.read(proposal_id);
            
            assert(proposal.is_active, 'Proposal not active');
            assert(proposal.target == caller, 'Not proposal target');
            assert(current_time <= proposal.expiration, 'Proposal expired');
            
            // Verify both tokens are still swappable and owned by correct users
            let initiator_post = self.posts.read(proposal.initiator_token_id);
            let target_post = self.posts.read(proposal.target_token_id);
            
            assert(initiator_post.current_owner == proposal.initiator, 'Initiator no longer owns token');
            assert(target_post.current_owner == caller, 'Target no longer owns token');
            assert(initiator_post.is_swappable, 'Initiator token not swappable');
            assert(target_post.is_swappable, 'Target token not swappable');
            
            // Execute swap
            self._transfer(proposal.initiator, caller, proposal.initiator_token_id);
            self._transfer(caller, proposal.initiator, proposal.target_token_id);
            
            // Update swap cooldowns
            self.user_token_last_swap.write((proposal.initiator, proposal.initiator_token_id), current_time);
            self.user_token_last_swap.write((caller, proposal.target_token_id), current_time);
            
            // Deactivate proposal
            let mut updated_proposal = proposal;
            updated_proposal.is_active = false;
            self.swap_proposals.write(proposal_id, updated_proposal);
            
            self.emit(SwapAccepted {
                proposal_id: proposal.id,
                initiator_token_id: proposal.initiator_token_id,
                target_token_id: proposal.target_token_id,
            });
        }

        fn reject_swap(ref self: ContractState, proposal_id: felt252) {
            let caller = get_caller_address();
            let mut proposal = self.swap_proposals.read(proposal_id);
            
            assert(proposal.is_active, 'Proposal not active');
            assert(proposal.target == caller, 'Not proposal target');
            
            proposal.is_active = false;
            self.swap_proposals.write(proposal_id, proposal);
            
            self.emit(SwapRejected { proposal_id });
        }

        fn get_user_posts(self: @ContractState, user: ContractAddress) -> Array<Post> {
            let mut posts = ArrayTrait::new();
            let count = self.user_post_count.read(user);
            
            let mut i = 0_u32;
            while i < count {
                let token_id = self.user_posts.read((user, i));
                let post = self.posts.read(token_id);
                posts.append(post);
                i += 1;
            };
            
            posts
        }

        fn get_swap_proposals(self: @ContractState, user: ContractAddress) -> Array<SwapProposal> {
            let mut proposals = ArrayTrait::new();
            let current_proposal_counter = self.proposal_counter.read();
            let current_time = get_block_timestamp();
            
            let mut i = 1_u256;
            let counter_u256: u256 = current_proposal_counter.into();
            while i < counter_u256 {
                let proposal_id: felt252 = i.try_into().unwrap();
                let proposal = self.swap_proposals.read(proposal_id);
                if proposal.target == user && proposal.is_active && current_time <= proposal.expiration {
                    proposals.append(proposal);
                }
                i += 1;
            };
            
            proposals
        }

        fn get_all_posts(self: @ContractState, offset: u32, limit: u32) -> Array<Post> {
            let mut posts = ArrayTrait::new();
            let total = self.total_posts.read();
            let end = if offset + limit > total { total } else { offset + limit };
            
            let mut i = offset;
            while i < end {
                let token_id = self.all_posts.read(total - 1 - i); // Reverse order (newest first)
                let post = self.posts.read(token_id);
                posts.append(post);
                i += 1;
            };
            
            posts
        }

        fn can_user_post_today(self: @ContractState, user: ContractAddress) -> bool {
            let current_time = get_block_timestamp();
            let current_day = current_time / SECONDS_PER_DAY;
            let last_post_day = self.user_last_post_day.read(user);
            
            current_day > last_post_day
        }

        fn get_post_by_token_id(self: @ContractState, token_id: u256) -> Post {
            self.posts.read(token_id)
        }

        fn is_post_swappable(self: @ContractState, token_id: u256) -> bool {
            let post = self.posts.read(token_id);
            post.is_swappable
        }

        fn get_user_last_swap_time(self: @ContractState, user: ContractAddress, token_id: u256) -> u64 {
            self.user_token_last_swap.read((user, token_id))
        }

        // ERC721 Implementation
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.symbol.read()
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let post = self.posts.read(token_id);
            let mut uri: ByteArray = "ipfs://";
            // uri.append(post.content_hash);
            ByteArrayTrait::append(ref uri, @post.content_hash);
            uri
        }

        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let owner = self.owners.read(token_id);
            assert(!owner.is_zero(), 'Token does not exist');
            owner
        }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            assert(!owner.is_zero(), 'Invalid owner');
            self.balances.read(owner)
        }

        fn approve(ref self: ContractState, to: ContractAddress, token_id: u256) {
            let owner = self.owner_of(token_id);
            let caller = get_caller_address();
            
            assert(caller == owner || self.is_approved_for_all(owner, caller), 'Not authorized');
            self.token_approvals.write(token_id, to);
            
            self.emit(Approval { owner, approved: to, token_id });
        }

        fn get_approved(self: @ContractState, token_id: u256) -> ContractAddress {
            self.token_approvals.read(token_id)
        }

        fn set_approval_for_all(ref self: ContractState, operator: ContractAddress, approved: bool) {
            let caller = get_caller_address();
            assert(caller != operator, 'Cannot approve self');
            
            self.operator_approvals.write((caller, operator), approved);
            self.emit(ApprovalForAll { owner: caller, operator, approved });
        }

        fn is_approved_for_all(self: @ContractState, owner: ContractAddress, operator: ContractAddress) -> bool {
            self.operator_approvals.read((owner, operator))
        }

        fn transfer_from(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
            let owner = self.owner_of(token_id);
            let caller = get_caller_address();
            
            assert(
                caller == owner || 
                caller == self.get_approved(token_id) || 
                self.is_approved_for_all(owner, caller),
                'Not authorized'
            );
            
            self._transfer(from, to, token_id);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _mint(ref self: ContractState, to: ContractAddress, token_id: u256) {
            assert(!to.is_zero(), 'Cannot mint to zero address');
            
            self.owners.write(token_id, to);
            
            let balance = self.balances.read(to);
            self.balances.write(to, balance + 1);
            
            self.emit(Transfer { from: 0.try_into().unwrap(), to, token_id });
        }

        fn _transfer(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
            assert(!to.is_zero(), 'Cannot transfer to zero');
            let owner = self.owner_of(token_id);
            assert(owner == from, 'Transfer from incorrect owner');
            
            // Update post ownership
            let mut post = self.posts.read(token_id);
            post.current_owner = to;
            self.posts.write(token_id, post);
            
            // Clear approvals
            self.token_approvals.write(token_id, 0.try_into().unwrap());
            
            // Update balances
            let from_balance = self.balances.read(from);
            self.balances.write(from, from_balance - 1);
            
            let to_balance = self.balances.read(to);
            self.balances.write(to, to_balance + 1);
            
            // Update ownership
            self.owners.write(token_id, to);
            
            self.emit(Transfer { from, to, token_id });
        }
    }
}
