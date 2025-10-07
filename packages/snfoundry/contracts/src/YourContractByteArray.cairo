use starknet::{ContractAddress};
use core::byte_array::ByteArray;

#[starknet::interface]
pub trait IOnePostDaily<TContractState> {
    // Post creation
    fn create_post(ref self: TContractState, content_hash: ByteArray, price: u256) -> u256;

    // Sell functions
    fn propose_sell(ref self: TContractState, token_id: u256, price: u256) -> felt252;
    fn accept_sell(ref self: TContractState, proposal_id: felt252);
    fn reject_sell(ref self: TContractState, proposal_id: felt252);
    fn cancel_sell(ref self: TContractState, proposal_id: felt252);
    fn buy_post(ref self: TContractState, token_id: u256);

    // View functions
    fn get_user_posts(self: @TContractState, user: ContractAddress) -> Array<Post>;
    fn get_sell_proposals(self: @TContractState, user: ContractAddress) -> Array<SellProposal>;
    fn get_all_posts(self: @TContractState, offset: u32, limit: u32) -> Array<Post>;
    fn get_post_by_token_id(self: @TContractState, token_id: u256) -> Post;
    fn is_post_for_sale(self: @TContractState, token_id: u256) -> bool;
    fn get_post_price(self: @TContractState, token_id: u256) -> u256;
    fn get_all_posts_for_sale(self: @TContractState, offset: u32, limit: u32) -> Array<Post>;

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
pub struct Post {
    pub token_id: u256,
    pub author: ContractAddress,
    pub current_owner: ContractAddress,
    pub content_hash: ByteArray,
    pub timestamp: u64,
    pub is_for_sale: bool,
    pub price: u256,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
pub struct SellProposal {
    pub id: felt252,
    pub token_id: u256,
    pub seller: ContractAddress,
    pub buyer: ContractAddress,
    pub price: u256,
    pub expiration: u64,
    pub is_active: bool,
}

#[starknet::contract]
pub mod OnePostDaily {
    use super::{IOnePostDaily, Post, SellProposal};
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp,
        storage::{
            Map, StorageMapReadAccess, StorageMapWriteAccess,
            StoragePointerReadAccess, StoragePointerWriteAccess
        }
    };
    use core::byte_array::ByteArray;
    use core::byte_array::ByteArrayTrait;
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
        token_counter: u256,

        // Sell storage
        sell_proposals: Map<felt252, SellProposal>,
        proposal_counter: felt252,
        posts_for_sale: Map<u32, u256>, // index -> token_id for posts currently for sale
        total_posts_for_sale: u32,

        // Indexes for queries
        all_posts: Map<u32, u256>, // index -> token_id
        total_posts: u32,
        user_posts: Map<(ContractAddress, u32), u256>, // user -> index -> token_id
        user_post_count: Map<ContractAddress, u32>,

        // Creator royalties (5% default)
        royalty_percentage: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PostCreated: PostCreated,
        PostListedForSale: PostListedForSale,
        SellProposed: SellProposed,
        SellAccepted: SellAccepted,
        SellRejected: SellRejected,
        SellCancelled: SellCancelled,
        PostSold: PostSold,
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
        price: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PostListedForSale {
        #[key]
        token_id: u256,
        #[key]
        seller: ContractAddress,
        price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SellProposed {
        #[key]
        proposal_id: felt252,
        #[key]
        seller: ContractAddress,
        #[key]
        buyer: ContractAddress,
        token_id: u256,
        price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SellAccepted {
        #[key]
        proposal_id: felt252,
        #[key]
        token_id: u256,
        #[key]
        seller: ContractAddress,
        #[key]
        buyer: ContractAddress,
        price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct SellRejected {
        #[key]
        proposal_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct SellCancelled {
        #[key]
        proposal_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PostSold {
        #[key]
        token_id: u256,
        #[key]
        seller: ContractAddress,
        #[key]
        buyer: ContractAddress,
        price: u256,
        royalty_paid: u256,
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

    const PROPOSAL_EXPIRATION: u64 = 604800; // 7 days
    const ROYALTY_PERCENTAGE: u256 = 500; // 5% in basis points (500/10000)

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.name.write("NFT Social Posts");
        self.symbol.write("NSP");
        self.token_counter.write(1);
        self.proposal_counter.write(1);
        self.royalty_percentage.write(ROYALTY_PERCENTAGE);
    }

    #[abi(embed_v0)]
    impl OnePostDailyImpl of IOnePostDaily<ContractState> {
        fn create_post(ref self: ContractState, content_hash: ByteArray, price: u256) -> u256 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            let token_id = self.token_counter.read();

            // Create post with selling capability
            let post = Post {
                token_id,
                author: caller,
                current_owner: caller,
                content_hash,
                timestamp: current_time,
                is_for_sale: price > 0, // If price is set, it's for sale
                price,
            };

            // Store post
            self.posts.write(token_id, post);

            // Update indexes
            let total_posts = self.total_posts.read();
            self.all_posts.write(total_posts, token_id);
            self.total_posts.write(total_posts + 1);

            let user_count = self.user_post_count.read(caller);
            self.user_posts.write((caller, user_count), token_id);
            self.user_post_count.write(caller, user_count + 1);

            // If post is for sale, add to for_sale index
            if price > 0 {
                let total_for_sale = self.total_posts_for_sale.read();
                self.posts_for_sale.write(total_for_sale, token_id);
                self.total_posts_for_sale.write(total_for_sale + 1);

                self.emit(PostListedForSale {
                    token_id,
                    seller: caller,
                    price,
                });
            }

            // Mint NFT
            self._mint(caller, token_id);

            self.token_counter.write(token_id + 1);

            let created_post = self.posts.read(token_id);
            self.emit(PostCreated {
                token_id,
                author: caller,
                content_hash: created_post.content_hash,
                price,
                timestamp: current_time,
            });

            token_id
        }

        fn propose_sell(ref self: ContractState, token_id: u256, price: u256) -> felt252 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            // Validate token exists and caller owns it
            let post = self.posts.read(token_id);
            assert(post.current_owner == caller, 'Not owner of token');
            assert(price > 0, 'Price must be greater than 0');

            let proposal_id = self.proposal_counter.read();

            let proposal = SellProposal {
                id: proposal_id,
                token_id,
                seller: caller,
                buyer: 0.try_into().unwrap(), // Will be set when someone accepts
                price,
                expiration: current_time + PROPOSAL_EXPIRATION,
                is_active: true,
            };

            self.sell_proposals.write(proposal_id, proposal);
            self.proposal_counter.write(proposal_id + 1);

            // Update post to be for sale
            let mut updated_post = post;
            updated_post.is_for_sale = true;
            updated_post.price = price;
            self.posts.write(token_id, updated_post);

            // Add to for_sale index if not already there
            let total_for_sale = self.total_posts_for_sale.read();
            self.posts_for_sale.write(total_for_sale, token_id);
            self.total_posts_for_sale.write(total_for_sale + 1);

            self.emit(SellProposed {
                proposal_id,
                seller: caller,
                buyer: 0.try_into().unwrap(),
                token_id,
                price,
            });

            proposal_id
        }

        fn accept_sell(ref self: ContractState, proposal_id: felt252) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let proposal = self.sell_proposals.read(proposal_id);

            assert(proposal.is_active, 'Proposal not active');
            assert(proposal.seller != caller, 'Cannot buy own post');
            assert(current_time <= proposal.expiration, 'Proposal expired');

            // Verify token is still owned by seller and for sale
            let post = self.posts.read(proposal.token_id);
            assert(post.current_owner == proposal.seller, 'Seller no longer owns token');
            assert(post.is_for_sale, 'Post not for sale');
            assert(post.price == proposal.price, 'Price mismatch');

            // Calculate royalty for original creator (if not primary sale)
            let royalty_amount = if post.author != proposal.seller {
                (proposal.price * self.royalty_percentage.read()) / 10000
            } else {
                0
            };

            // Execute sale - transfer NFT
            self._transfer(proposal.seller, caller, proposal.token_id);

            // Update post status (re-read after transfer to preserve updated ownership)
            let mut updated_post = self.posts.read(proposal.token_id);
            updated_post.is_for_sale = false;
            updated_post.price = 0;
            self.posts.write(proposal.token_id, updated_post);

            // Deactivate proposal
            let mut updated_proposal = proposal;
            updated_proposal.is_active = false;
            updated_proposal.buyer = caller;
            self.sell_proposals.write(proposal_id, updated_proposal);

            self.emit(SellAccepted {
                proposal_id,
                token_id: proposal.token_id,
                seller: proposal.seller,
                buyer: caller,
                price: proposal.price,
            });

            self.emit(PostSold {
                token_id: proposal.token_id,
                seller: proposal.seller,
                buyer: caller,
                price: proposal.price,
                royalty_paid: royalty_amount,
            });
        }

        fn reject_sell(ref self: ContractState, proposal_id: felt252) {            
            let mut proposal = self.sell_proposals.read(proposal_id);

            assert(proposal.is_active, 'Proposal not active');
            // Anyone can reject a sell proposal (buyer rejecting)

            proposal.is_active = false;
            self.sell_proposals.write(proposal_id, proposal);

            self.emit(SellRejected { proposal_id });
        }

        fn cancel_sell(ref self: ContractState, proposal_id: felt252) {
            let caller = get_caller_address();
            let mut proposal = self.sell_proposals.read(proposal_id);

            assert(proposal.is_active, 'Proposal not active');
            assert(proposal.seller == caller, 'Not proposal seller');

            // Remove from sale
            let mut post = self.posts.read(proposal.token_id);
            post.is_for_sale = false;
            post.price = 0;
            self.posts.write(proposal.token_id, post);

            proposal.is_active = false;
            self.sell_proposals.write(proposal_id, proposal);

            self.emit(SellCancelled { proposal_id });
        }

        fn buy_post(ref self: ContractState, token_id: u256) {
            let caller = get_caller_address();
            let post = self.posts.read(token_id);

            assert(post.is_for_sale, 'Post not for sale');
            assert(post.current_owner != caller, 'Cannot buy own post');
            assert(post.price > 0, 'Invalid price');

            let seller = post.current_owner;
            let price = post.price;

            // Calculate royalty for original creator (if not primary sale)
            let royalty_amount = if post.author != seller {
                (price * self.royalty_percentage.read()) / 10000
            } else {
                0
            };

            // Execute sale - transfer NFT
            self._transfer(seller, caller, token_id);

            // Update post status (re-read after transfer to preserve updated ownership)
            let mut updated_post = self.posts.read(token_id);
            updated_post.is_for_sale = false;
            updated_post.price = 0;
            self.posts.write(token_id, updated_post);

            self.emit(PostSold {
                token_id,
                seller,
                buyer: caller,
                price,
                royalty_paid: royalty_amount,
            });
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

        fn get_sell_proposals(self: @ContractState, user: ContractAddress) -> Array<SellProposal> {
            let mut proposals = ArrayTrait::new();
            let current_proposal_counter = self.proposal_counter.read();
            let current_time = get_block_timestamp();

            let mut i = 1_u256;
            let counter_u256: u256 = current_proposal_counter.into();
            while i < counter_u256 {
                let proposal_id: felt252 = i.try_into().unwrap();
                let proposal = self.sell_proposals.read(proposal_id);
                if proposal.seller == user && proposal.is_active && current_time <= proposal.expiration {
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

        fn get_post_by_token_id(self: @ContractState, token_id: u256) -> Post {
            self.posts.read(token_id)
        }

        fn is_post_for_sale(self: @ContractState, token_id: u256) -> bool {
            let post = self.posts.read(token_id);
            post.is_for_sale
        }

        fn get_post_price(self: @ContractState, token_id: u256) -> u256 {
            let post = self.posts.read(token_id);
            post.price
        }

        fn get_all_posts_for_sale(self: @ContractState, offset: u32, limit: u32) -> Array<Post> {
            let mut posts = ArrayTrait::new();
            let total = self.total_posts_for_sale.read();
            let end = if offset + limit > total { total } else { offset + limit };

            let mut i = offset;
            while i < end {
                let token_id = self.posts_for_sale.read(i);
                let post = self.posts.read(token_id);
                if post.is_for_sale { // Double check it's still for sale
                    posts.append(post);
                }
                i += 1;
            };

            posts
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
