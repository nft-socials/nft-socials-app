import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gem, DollarSign, Tag, Loader2 } from 'lucide-react';
import { Post } from '@/context/AppContext';
import { useAccount } from '@starknet-react/core';
import { proposeSell } from '@/services/contract';
import { toast } from 'react-hot-toast';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSellSuccess?: (post: Post, price: string) => void;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, post, onSellSuccess }) => {
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { account } = useAccount();

  const handleSell = async () => {
    if (!post || !account || !price) return;

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Preparing sell transaction...');

      // Convert STRK to smallest unit (multiply by 10^18) and ensure it's a proper integer
      const priceInStrkUnits = BigInt(Math.floor(priceValue * 1e18));

      const txHash = await proposeSell(account, post.tokenId, Number(priceInStrkUnits));

      toast.dismiss();
      toast.success('🎉 NFT listed for sale successfully!');

      onSellSuccess?.(post, price);
      onClose();
      setPrice('');
    } catch (error) {
      console.error('Error listing NFT for sale:', error);
      toast.dismiss();

      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('Transaction was rejected by user');
        } else if (error.message.includes('insufficient')) {
          toast.error('Insufficient funds for transaction');
        } else {
          toast.error(`Failed to list NFT: ${error.message}`);
        }
      } else {
        toast.error('Failed to list NFT for sale. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setPrice('');
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            List NFT for Sale
          </DialogTitle>
          <DialogDescription>
            Set a price for your NFT and list it on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Preview Card */}
          <Card className="p-4 bg-muted/50 border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Gem className="w-5 h-5 text-primary-foreground animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">NFT #{post.tokenId}</span>
                  <Badge variant="secondary" className="text-xs">
                    Your NFT
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.content || 'Image Post'}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(post.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Sale Price (STRK)
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.1"
                min="0"
                placeholder="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
                disabled={isLoading}
              />
              <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: 0.1 STRK • Your NFT will be listed on the marketplace
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSell}
              disabled={!price || isLoading || parseFloat(price) <= 0}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Listing...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  List for Sale
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Note:</strong> Once listed, your NFT will appear in the marketplace. 
              You can cancel the listing anytime before someone buys it.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellModal;
