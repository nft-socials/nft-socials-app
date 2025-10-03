import { Account, CallData, RpcProvider, stark, Contract } from "starknet";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Initialize provider for Starknet Sepolia
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL_SEPOLIA!,
  });

  // Check environment variables
  const deployerAddress = process.env.ACCOUNT_ADDRESS_SEPOLIA!;
  const deployerPrivateKey = process.env.PRIVATE_KEY_SEPOLIA!;

  if (!deployerAddress) {
    console.error("❌ DEPLOYER_ADDRESS not found in .env file");
    process.exit(1);
  }

  if (!deployerPrivateKey) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not found in .env file");
    process.exit(1);
  }

  console.log("Environment check passed ✅");
  
  const account = new Account(provider, deployerAddress, deployerPrivateKey);

  console.log("🚀 Deploying OnePostDaily contract...");
  console.log("Deployer:", deployerAddress);

  try {
    // Read the compiled contract files
    const compiledContract = JSON.parse(
      fs.readFileSync("./target/dev/one_post_daily_OnePostDaily.contract_class.json").toString("ascii")
    );
    
    const compiledCasm = JSON.parse(
      fs.readFileSync("./target/dev/one_post_daily_OnePostDaily.compiled_contract_class.json").toString("ascii")
    );

    // Declare the contract
    console.log("📝 Declaring contract...");
    const declareResponse = await account.declare({
      contract: compiledContract,
      casm: compiledCasm,
    });

    console.log("✅ Contract declared:");
    console.log("Class Hash:", declareResponse.class_hash);
    console.log("Transaction Hash:", declareResponse.transaction_hash);

    // Wait for declaration to be accepted
    await provider.waitForTransaction(declareResponse.transaction_hash);
    console.log("✅ Declaration confirmed");

    // Deploy the contract
    console.log("🔧 Deploying contract...");
    
    // Constructor parameters (empty for this contract)
    const constructorCalldata = CallData.compile([]);

    const deployResponse = await account.deployContract({
      classHash: declareResponse.class_hash,
      constructorCalldata,
    });

    console.log("✅ Contract deployed:");
    console.log("Contract Address:", deployResponse.contract_address);
    console.log("Transaction Hash:", deployResponse.transaction_hash);

    // Wait for deployment to be accepted
    await provider.waitForTransaction(deployResponse.transaction_hash);
    console.log("✅ Deployment confirmed");

    // Verify deployment by calling a read function
    const contract = new Contract(
      compiledContract.abi,
      deployResponse.contract_address,
      provider
    );

    const name = await contract.name();
    const symbol = await contract.symbol();

    console.log("\n📋 Contract Details:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Address:", deployResponse.contract_address);
    console.log("Class Hash:", declareResponse.class_hash);

    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: deployResponse.contract_address,
      classHash: declareResponse.class_hash,
      deploymentTxHash: deployResponse.transaction_hash,
      declarationTxHash: declareResponse.transaction_hash,
      deployedAt: new Date().toISOString(),
      name: name.toString(),
      symbol: symbol.toString(),
    };

    fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployment.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });