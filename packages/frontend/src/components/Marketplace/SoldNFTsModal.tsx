import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, ExternalLink, Clock, User, DollarSign, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { getAllSoldNFTs } from '@/services/contract';
import { getFromIPFS } from '@/services/ipfs';

interface SoldNFT {
  tokenId: string;
  seller?: string;
  buyer?: string;
  author?: string;
  currentOwner?: string;
  originalAuthor?: string;
  price: string | number;
  timestamp: number;
  soldAt?: number;
  createdAt?: number;
  transactionHash: string;
  content: string;
  isCurrentlyForSale?: boolean;
  currentPrice?: number;
  salePrice?: number;
}

const SoldNFTsModal: React.FC = () => {
  const [soldNFTs, setSoldNFTs] = useState<SoldNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch real sold NFTs data with IPFS metadata
  useEffect(() => {
    const fetchSoldNFTs = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const realSoldNFTs = await getAllSoldNFTs();

          // Load IPFS metadata for each sold NFT
          const nftsWithMetadata = await Promise.all(
            realSoldNFTs.map(async (nft) => {
              try {
                const metadata = await getFromIPFS(nft.contentHash);
                return {
                  ...nft,
                  title: metadata?.content || nft.content || `NFT #${nft.tokenId}`,
                  image: metadata?.image || null,
                  description: metadata?.content || nft.content || 'No description'
                };
              } catch (error) {
                console.error('Error loading NFT metadata:', error);
                return {
                  ...nft,
                  title: nft.content || `NFT #${nft.tokenId}`,
                  image: null,
                  description: nft.content || 'No description'
                };
              }
            })
          );

          setSoldNFTs(nftsWithMetadata);
        } catch (error) {
          console.error('Error fetching sold NFTs:', error);
          toast.error('Failed to load sold NFTs');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSoldNFTs();
  }, [isOpen]);



  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openTransaction = (txHash: string) => {
    // Open the transaction on Starknet Sepolia Voyager block explorer
    const explorerUrl = `https://sepolia.voyager.online/tx/${txHash}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    toast.success(`Opening transaction in block explorer...`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Sold NFTs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Sold NFTs History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{soldNFTs.length}</div>
              <div className="text-sm text-muted-foreground">Total Sold</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {soldNFTs.reduce((sum, nft) => {
                  const price = nft.salePrice && typeof nft.salePrice === 'number'
                    ? (nft.salePrice / 1e18)
                    : typeof nft.price === 'string'
                      ? parseFloat(nft.price.split(' ')[0])
                      : (nft.price / 1e18);
                  return sum + price;
                }, 0).toFixed(4)} STRK
              </div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {soldNFTs.length > 0 ? (soldNFTs.reduce((sum, nft) => {
                  const price = nft.salePrice && typeof nft.salePrice === 'number'
                    ? (nft.salePrice / 1e18)
                    : typeof nft.price === 'string'
                      ? parseFloat(nft.price.split(' ')[0])
                      : (nft.price / 1e18);
                  return sum + price;
                }, 0) / soldNFTs.length).toFixed(4) : '0'} STRK
              </div>
              <div className="text-sm text-muted-foreground">Avg. Price</div>
            </Card>
          </div>

          {/* Sold NFTs List */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading sold NFTs...</p>
                </div>
              </div>
            ) : soldNFTs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sales Yet</h3>
                <p className="text-muted-foreground">
                  No NFTs have been sold yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {soldNFTs.map((nft) => (
                  <Card key={`${nft.tokenId}-${nft.timestamp}`} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            NFT #{nft.tokenId}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            SOLD
                          </Badge>
                        </div>
                        
                        <div className="flex items-start gap-3 mb-2">
                          {nft.image && (
                            <img
                              src={nft.image}
                              alt={`NFT #${nft.tokenId}`}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-1">{nft.title || nft.content || 'NFT Post'}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{nft.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Creator: {truncateAddress(nft.originalAuthor || nft.author || nft.seller)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Owner: {truncateAddress(nft.currentOwner || nft.buyer)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Created: {formatTimeAgo(nft.createdAt || nft.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Sold: {formatTimeAgo(nft.soldAt || nft.timestamp)}</span>
                            </div>
                          </div>
                          {nft.isCurrentlyForSale && (
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Currently for sale: {typeof nft.currentPrice === 'number' ? `${(nft.currentPrice / 1e18).toFixed(4)} STRK` : nft.currentPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-lg font-bold text-green-600 mb-2">
                          <DollarSign className="w-4 h-4" />
                          {typeof nft.salePrice === 'number' && nft.salePrice > 0
                            ? `${(nft.salePrice / 1e18).toFixed(4)} STRK`
                            : typeof nft.price === 'string'
                              ? nft.price
                              : `${(nft.price / 1e18).toFixed(4)} STRK`
                          }
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransaction(nft.transactionHash)}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Tx
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 This data shows NFT sales history from the marketplace. 
              Transaction details can be verified on the Starknet explorer.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoldNFTsModal;
