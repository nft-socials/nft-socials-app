/**
 * Xverse Wallet Connector for Bitcoin
 * Uses the sats-connect API that Xverse provides
 */

interface XverseWindow extends Window {
  BitcoinProvider?: any;
}

declare const window: XverseWindow;

export class XverseConnector {
  id = "xverse";
  name = "Xverse Wallet";
  icon = {
    dark: "https://www.xverse.app/favicon.ico",
    light: "https://www.xverse.app/favicon.ico",
  };

  private connectedAddress: string | null = null;
  private connectedPublicKey: string | null = null;

  /**
   * Check if Xverse wallet is installed
   */
  available(): boolean {
    return true; // Always show in wallet list
  }

  /**
   * Check if Xverse is actually installed and ready
   */
  async ready(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    // Check if BitcoinProvider exists (Xverse injects this)
    return !!(window.BitcoinProvider);
  }

  /**
   * Connect to Xverse wallet
   * This will trigger the Xverse popup
   */
  async connect(): Promise<{ address: string; publicKey: string }> {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined");
    }

    // Check if Xverse is installed
    const isInstalled = await this.ready();

    if (!isInstalled) {
      // Open Xverse installation page
      window.open("https://www.xverse.app/download", "_blank");
      throw new Error("Xverse Wallet is not installed. Please install it from xverse.app");
    }

    try {
      // Use the BitcoinProvider to request accounts
      const provider = window.BitcoinProvider;

      if (!provider) {
        throw new Error("Xverse provider not found");
      }

      // Request account access - this triggers the Xverse popup
      const response = await provider.request('getAccounts', {
        purposes: ['payment', 'ordinals'],
      });

      if (!response || !response.result || response.result.length === 0) {
        throw new Error("No accounts returned from Xverse");
      }

      // Get the payment address
      const paymentAccount = response.result.find((acc: any) => acc.purpose === 'payment') || response.result[0];

      this.connectedAddress = paymentAccount.address;
      this.connectedPublicKey = paymentAccount.publicKey;

      return {
        address: paymentAccount.address,
        publicKey: paymentAccount.publicKey,
      };
    } catch (error) {
      const err = error as Error;

      // Handle user rejection
      if (err.message?.includes("User rejected") || err.message?.includes("canceled") || err.message?.includes("denied")) {
        throw new Error("User rejected the connection request");
      }

      throw new Error(err.message || "Failed to connect to Xverse Wallet");
    }
  }

  /**
   * Disconnect from Xverse wallet
   */
  async disconnect(): Promise<void> {
    try {
      this.connectedAddress = null;
      this.connectedPublicKey = null;
    } catch (error) {
      console.error("Error disconnecting from Xverse:", error);
    }
  }

  /**
   * Get the connected address
   */
  async getAddress(): Promise<string | null> {
    return this.connectedAddress;
  }

  /**
   * Sign a message with Xverse
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connectedAddress) {
      throw new Error("Xverse wallet is not connected");
    }

    if (typeof window === "undefined" || !window.BitcoinProvider) {
      throw new Error("Xverse provider not found");
    }

    try {
      const provider = window.BitcoinProvider;
      const response = await provider.request('signMessage', {
        address: this.connectedAddress,
        message: message,
      });

      if (!response || !response.result) {
        throw new Error("Failed to sign message");
      }

      return response.result;
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message || "Failed to sign message");
    }
  }
}

/**
 * Factory function to create Xverse connector instance
 */
export function xverse(): XverseConnector {
  return new XverseConnector();
}

