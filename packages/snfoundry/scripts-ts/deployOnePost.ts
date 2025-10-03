import { Account, CallData, RpcProvider, hash } from "starknet";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL_SEPOLIA!,
  });

  const account = new Account(provider, process.env.ACCOUNT_ADDRESS_SEPOLIA!, process.env.PRIVATE_KEY_SEPOLIA!);

  console.log("🚀 Deploying OnePostDaily contract...");

  try {
    // Read both files
    const contractClassPath = "./contracts/target/dev/contracts_OnePostDaily.contract_class.json";
    const casmPath = "./contracts/target/dev/contracts_OnePostDaily.compiled_contract_class.json";
    
    if (!fs.existsSync(contractClassPath)) {
      throw new Error(`Contract class file not found: ${contractClassPath}`);
    }
    
    if (!fs.existsSync(casmPath)) {
      throw new Error(`CASM file not found: ${casmPath}. Run 'scarb build' to generate it.`);
    }

    const contractClass = JSON.parse(fs.readFileSync(contractClassPath, "utf8"));
    const casm = JSON.parse(fs.readFileSync(casmPath, "utf8"));

    // Calculate class hash manually
    const classHash = hash.computeContractClassHash(contractClass);
    console.log("Computed class hash:", classHash);

    // Check if already declared
    try {
      await provider.getClassAt(classHash);
      console.log("✅ Contract already declared, skipping declaration");
    } catch {
      // Not declared, proceed with declaration
      console.log("📝 Declaring contract...");
      const declareResponse = await account.declare({
        contract: contractClass,
        casm: casm,
      });

      console.log("✅ Declaration transaction:", declareResponse.transaction_hash);
      await provider.waitForTransaction(declareResponse.transaction_hash);
      console.log("✅ Declaration confirmed");
    }

    // Deploy
    console.log("🔧 Deploying contract...");
    const constructorCalldata = CallData.compile([]);

    const deployResponse = await account.deployContract({
      classHash: "0x002d4df23e473f684dd16f1c6d3809a70573695d9cf408d2575bf1c65ad4469f",
      constructorCalldata,
    });

    console.log("✅ Contract deployed at:", deployResponse.contract_address);
    console.log("✅ Deploy transaction:", deployResponse.transaction_hash);

    await provider.waitForTransaction(deployResponse.transaction_hash);
    console.log("✅ Deployment confirmed");

    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: deployResponse.contract_address,
      classHash: classHash,
      deploymentTxHash: deployResponse.transaction_hash,
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment saved to deployment.json");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();