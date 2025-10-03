# One Post Daily

This is a StarkNet smart contract for a decentralized social application called "One Post Daily".

## Core Concepts

*   **One Post Per Day:** As the name suggests, each user can create exactly one post per day. Each post is minted as an NFT.
*   **ERC721 NFTs:** Every post is an ERC721 token, making them unique, ownable, and transferable digital assets.
*   **Content Hash:** The content of the post is not stored directly on-chain. Instead, a `content_hash` (likely pointing to an IPFS CID) is stored, which is a common pattern for decentralized storage.
*   **Post Swapping:** Users can propose to swap their post NFTs with other users. This creates a simple bartering economy for the daily posts.
    *   Users can `propose_swap`.
    *   The target of the swap can `accept_swap` or `reject_swap`.
    *   There is a cooldown period for swaps.
*   **Swappability:** A post only becomes swappable after the user has made a new post on a subsequent day.

## Main Features

*   `create_daily_post`: Mints a new post NFT for the caller.
*   `propose_swap`, `accept_swap`, `reject_swap`: Manages the post swapping mechanism.
*   `get_user_posts`: View all posts created by a specific user.
*   `get_all_posts`: A global feed to view all posts on the platform.
*   Standard ERC721 functions for NFT management (`owner_of`, `transfer_from`, `approve`, etc.).

This contract forms the backend logic for a social dApp where digital content creation is tokenized and tradable.
