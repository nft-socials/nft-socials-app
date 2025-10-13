import { InjectedConnector, InjectedConnectorOptions } from "@starknet-react/core";

export class XverseConnector extends InjectedConnector {
  constructor() {
    const options: InjectedConnectorOptions = {
      id: "xverse",
      name: "Xverse Wallet",
    };
    super({ options });
  }

  get id() {
    return "xverse";
  }

  get name() {
    return "Xverse Wallet";
  }

  get icon() {
    return "🔶";
  }

  available() {
    if (typeof window === "undefined") return false;
    
    // Check for XverseProviders object
    const xverseProviders = (window as any).XverseProviders;
    if (xverseProviders?.StarknetProvider) return true;
    
    // Check for starknet provider
    const starknet = (window as any).starknet;
    if (starknet && starknet.id === "xverse") return true;
    
    // Check for starknet_xverse
    const starknetXverse = (window as any).starknet_xverse;
    if (starknetXverse && starknetXverse.id === "xverse") return true;

    return false;
  }

  async ready() {
    if (!this.available()) {
      throw new Error("Xverse wallet not found");
    }

    const provider = this._getStarknetProvider();
    if (!provider) {
      throw new Error("Xverse Starknet provider not found");
    }

    return provider;
  }

  private _getStarknetProvider() {
    if (typeof window === "undefined") return null;

    // Try XverseProviders first (this is what we see in the debug output)
    const xverseProviders = (window as any).XverseProviders;
    if (xverseProviders?.StarknetProvider) {
      return xverseProviders.StarknetProvider;
    }

    // Try global starknet (this is also available)
    const starknet = (window as any).starknet;
    if (starknet && starknet.id === "xverse") {
      return starknet;
    }

    // Try starknet_xverse (this is also available)
    const starknetXverse = (window as any).starknet_xverse;
    if (starknetXverse && starknetXverse.id === "xverse") {
      return starknetXverse;
    }

    return null;
  }

  async connect() {
    const provider = await this.ready();
    if (!provider) {
      throw new Error("Xverse Starknet provider not available");
    }

    try {
      // Check if already connected
      if (provider.isConnected && provider.selectedAddress) {
        const account = provider.selectedAddress;
        const chainId = provider.chainId || "0x534e5f4d41494e"; // Default to mainnet

        return {
          account,
          chainId: BigInt(chainId),
        };
      }

      // If not connected, try to enable/connect
      let accounts;
      if (provider.enable) {
        accounts = await provider.enable();
      } else if (provider.request) {
        accounts = await provider.request({
          type: "wallet_requestAccounts",
        });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found or user rejected connection");
      }

      const account = accounts[0];
      let chainId;

      try {
        if (provider.request) {
          chainId = await provider.request({
            type: "wallet_requestChainId",
          });
        } else {
          chainId = provider.chainId || "0x534e5f4d41494e";
        }
      } catch (error) {
        chainId = "0x534e5f4d41494e"; // SN_MAIN
      }

      return {
        account,
        chainId: BigInt(chainId),
      };
    } catch (error) {
      throw error;
    }
  }

  async disconnect() {
    // Xverse doesn't typically need explicit disconnect
  }
}
