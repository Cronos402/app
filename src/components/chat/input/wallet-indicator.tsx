'use client';

import { useAccount } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { Wallet, WalletMinimal } from 'lucide-react';

export function WalletIndicator() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <WalletMinimal className="h-3 w-3" />
        Wallet not connected
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <Wallet className="h-3 w-3" />
      {address.slice(0, 6)}...{address.slice(-4)}
    </Badge>
  );
}
