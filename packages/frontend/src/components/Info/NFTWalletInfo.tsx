import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Wallet, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const NFTWalletInfo: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          NFT Wallet Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Why Don't My NFTs Appear in My Wallet?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Main Explanation */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">NFT Visibility in Wallets</h3>
                <p className="text-blue-800 text-sm">
                  Your NFTs are safely stored on the Starknet blockchain, but they may not automatically 
                  appear in your wallet interface. This is common with new NFT contracts and depends on 
                  wallet support for the specific contract.
                </p>
              </div>
            </div>
          </Card>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              What's Working Correctly
            </h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">NFT Ownership</p>
                  <p className="text-sm text-green-800">
                    Your NFTs are properly minted and owned by your wallet address on Starknet
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Blockchain Storage</p>
                  <p className="text-sm text-green-800">
                    All NFT data and metadata are stored on IPFS and referenced on-chain
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Marketplace Functionality</p>
                  <p className="text-sm text-green-800">
                    You can view, sell, and trade your NFTs through this marketplace
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Why Wallets Don't Show Them */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              Why Wallets May Not Display Them
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-1">Contract Recognition</p>
                <p className="text-sm text-orange-800">
                  Wallets need to recognize and index new NFT contracts. This process can take time 
                  for new or custom contracts.
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-1">Metadata Standards</p>
                <p className="text-sm text-orange-800">
                  Different wallets support different metadata standards. Some may require specific 
                  formats to display NFT images and details.
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-1">Network Support</p>
                <p className="text-sm text-orange-800">
                  Starknet is a newer network, and wallet support for NFTs may be limited compared 
                  to Ethereum mainnet.
                </p>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h3 className="font-semibold">How to View Your NFTs</h3>
            
            <div className="space-y-3">
              <Badge variant="secondary" className="w-full justify-start p-3">
                <span className="font-medium">1. Use This Marketplace</span>
                <span className="ml-2 text-sm">View all your NFTs in the "My NFTs" filter</span>
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start p-3">
                <span className="font-medium">2. Check Starknet Explorers</span>
                <span className="ml-2 text-sm">View your NFTs on Starkscan or Voyager</span>
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start p-3">
                <span className="font-medium">3. Wait for Wallet Updates</span>
                <span className="ml-2 text-sm">Wallet providers regularly add support for new contracts</span>
              </Badge>
            </div>
          </div>

          {/* Contract Info */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">Contract Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span>Starknet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard:</span>
                <span>ERC-721 Compatible</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metadata:</span>
                <span>IPFS Stored</span>
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View My NFTs in Marketplace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFTWalletInfo;
