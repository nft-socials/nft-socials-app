use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
struct Post {
    token_id: u256,
    author: ContractAddress,
    current_owner: ContractAddress,
    content_hash: ByteArray,
    timestamp: u64,
    is_for_sale: bool,
    price: u256,
}

#[derive(Drop, Serde, starknet::Store, Copy)]
struct SellProposal {
    id: felt252,
    token_id: u256,
    seller: ContractAddress,
    buyer: ContractAddress,
    price: u256,
    expiration: u64,
    is_active: bool,
}

#[starknet::interface]
trait IOnePostDaily<TContractState> {
    // Core functionality
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