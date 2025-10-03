import { RpcProvider, CallData } from "starknet";
import dotenv from "dotenv";

dotenv.config();

async function checkWallet() {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL_SEPOLIA!,
  });

  const address = process.env.ACCOUNT_ADDRESS_SEPOLIA!;
  console.log("Checking wallet:", address);

  try {
    // Check if contract exists
    const classHash = await provider.getClassHashAt(address);
    console.log("✅ Wallet is deployed, class hash:", classHash);

    // Check ETH balance (ETH contract address on Sepolia)
    const ethContractAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    
    try {
      const balanceCall = await provider.callContract({
        contractAddress: ethContractAddress,
        entrypoint: "balanceOf",
        calldata: CallData.compile([address])
      });
      
      const balance = BigInt(balanceCall[0]);
      const balanceInEth = Number(balance) / 1e18;
      console.log("💰 ETH Balance:", balanceInEth.toFixed(6), "ETH");
      
      if (balance === 0n) {
        console.log("❌ Wallet has no funds! Get testnet ETH from:");
        console.log("🚰 https://starknet-faucet.vercel.app/");
      }
    } catch (error) {
      console.log("❌ Could not fetch balance");
    }

    // Check nonce
    const nonce = await provider.getNonceForAddress(address);
    console.log("🔢 Nonce:", nonce);

  } catch (error) {
    console.log("❌ Wallet not deployed on Sepolia");
    console.log("📝 Deploy your wallet first or get testnet funds");
    console.log("🚰 Faucet: https://starknet-faucet.vercel.app/");
    console.log("Error:", (error as Error).message);
  }
}

checkWallet();