use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
struct Post {
    token_id: u256,
    author: ContractAddress,
    current_owner: ContractAddress,
    content_hash: felt252,
    timestamp: u64,
    is_swappable: bool,
}

#[derive(Drop, Serde, starknet::Store)]
struct SwapProposal {
    id: felt252,
    initiator_token_id: u256,
    target_token_id: u256,
    initiator: ContractAddress,
    target: ContractAddress,
    expiration: u64,
    is_active: bool,
}

#[starknet::interface]
trait IOnePostDaily<TContractState> {
    // Core functionality
    fn create_daily_post(ref self: TContractState, content_hash: felt252) -> u256;
    
    // Swap functionality
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