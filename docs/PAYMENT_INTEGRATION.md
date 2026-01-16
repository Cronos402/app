# USDC.e Payment Integration Guide

Complete guide for integrating gasless USDC.e payments on Cronos using wallet signatures and the Cronos facilitator.

## Overview

The Cronos402 payment system enables **gasless USDC.e transfers** using EIP-3009 signatures and the Cronos facilitator. Users sign payment authorizations with their wallet (MetaMask, Crypto.com Wallet, etc.), and the facilitator executes the transfer on-chain while paying gas fees.

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   User's     │      │  Cronos402   │      │     MCP      │      │   Cronos     │
│   Wallet     │─────▶│  React App   │─────▶│   Server     │─────▶│ Facilitator  │
│ (MetaMask)   │      │              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
      Sign                 useSignUsdcPermit        API                   On-chain
   EIP-3009              payment-service         /api/payment         Settlement
```

**Flow:**
1. **User** signs EIP-3009 permit with their wallet (client-side)
2. **React App** submits signed permit to MCP server
3. **MCP Server** forwards to Cronos facilitator
4. **Facilitator** executes `transferWithAuthorization` on USDC.e contract (pays gas)
5. **Transaction hash** returned to user

## Quick Start

### 1. Install Dependencies

```bash
npm install wagmi viem @tanstack/react-query
```

### 2. Configure Wagmi

Wagmi is already configured in `src/lib/client/config.ts` with:
- Cronos Mainnet (chain 25)
- Cronos Testnet (chain 338)
- MetaMask connector
- WalletConnect (supports Crypto.com Wallet)

```tsx
import { wagmiConfig } from '@/lib/client/config';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 3. Use the Payment Hook

```tsx
import { useSignUsdcPermit } from '@/hooks/useSignUsdcPermit';
import { submitUsdcPayment } from '@/lib/client/payment-service';

function PaymentComponent() {
  const { signPermit, isLoading } = useSignUsdcPermit();

  const handlePay = async () => {
    try {
      // Step 1: Sign with wallet
      const signed = await signPermit({
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        amount: '0.01', // 1 cent in USDC
      });

      // Step 2: Submit to facilitator
      const result = await submitUsdcPayment(signed, 'cronos-testnet');

      if (result.success) {
        console.log('Payment successful!', result.txHash);
        console.log('View on explorer:', result.explorerUrl);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <button onClick={handlePay} disabled={isLoading}>
      {isLoading ? 'Signing...' : 'Pay 0.01 USDC.e'}
    </button>
  );
}
```

### 4. Or Use the Complete Payment Button

```tsx
import { PaymentButton } from '@/components/payment/PaymentButton';

function MyApp() {
  return (
    <PaymentButton
      recipient="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8"
      amount="0.01"
      onSuccess={(txHash) => {
        console.log('Payment successful!', txHash);
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    >
      Pay 0.01 USDC.e
    </PaymentButton>
  );
}
```

## API Reference

### `useSignUsdcPermit(config?)`

React hook for signing USDC.e EIP-3009 permits.

**Parameters:**
- `config.recipient?` - Default recipient address
- `config.amount?` - Default amount in USDC
- `config.validityWindow?` - Signature validity in seconds (default: 3600)

**Returns:**
- `signPermit(config)` - Function to request signature from wallet
- `signature` - Current signature (Hex)
- `authorization` - Current authorization data
- `signedAuthorization` - Complete signed authorization
- `isLoading` - Loading state
- `error` - Error state
- `reset()` - Reset state

**Example:**
```tsx
const { signPermit, isLoading, error } = useSignUsdcPermit({
  validityWindow: 1800, // 30 minutes
});

const signed = await signPermit({
  recipient: '0x...',
  amount: '0.01',
});
```

### `submitUsdcPayment(authorization, network, mcpServerUrl?)`

Submit signed authorization to MCP server for facilitator settlement.

**Parameters:**
- `authorization` - Signed transfer authorization from `signPermit`
- `network` - 'cronos-mainnet' | 'cronos-testnet'
- `mcpServerUrl?` - MCP server URL (defaults to env)

**Returns:**
```typescript
{
  success: boolean;
  txHash?: string;
  message?: string;
  network?: string;
  explorerUrl?: string;
  error?: string;
}
```

### `completePayment(config)`

Convenience function combining signing and submission.

**Parameters:**
```typescript
{
  signPermit: (config) => Promise<SignedTransferAuthorization>;
  recipient: Address;
  amount: string;
  network: 'cronos-mainnet' | 'cronos-testnet';
  mcpServerUrl?: string;
}
```

**Example:**
```tsx
import { useSignUsdcPermit } from '@/hooks/useSignUsdcPermit';
import { completePayment } from '@/lib/client/payment-service';

const { signPermit } = useSignUsdcPermit();

const result = await completePayment({
  signPermit,
  recipient: '0x...',
  amount: '0.01',
  network: 'cronos-testnet',
});
```

## Network Configuration

### Cronos Testnet (Chain ID: 338)
- **RPC:** https://evm-t3.cronos.org
- **USDC.e Address:** 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
- **Symbol:** devUSDC.e
- **Faucet:** https://faucet.cronos.org

### Cronos Mainnet (Chain ID: 25)
- **RPC:** https://evm.cronos.org
- **USDC.e Address:** 0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C
- **Symbol:** USDC.e (Bridged via Stargate)

## Important Notes

### EIP-712 Domain

The USDC.e contract requires specific EIP-712 domain parameters:

```typescript
{
  name: 'Bridged USDC (Stargate)',  // NOT just "USDC"!
  version: '1',
  chainId: 338, // or 25 for mainnet
  verifyingContract: '0xc01e...' // USDC.e address
}
```

### USDC.e Decimals

USDC.e uses **6 decimals** (not 18 like ETH/CRO):

```typescript
// Correct
parseUnits('0.01', 6)  // = 10000 (1 cent)
parseUnits('1', 6)     // = 1000000 (1 dollar)

// Wrong
parseUnits('0.01', 18) // Too many decimals!
```

### Nonce Generation

Each authorization needs a unique nonce:

```typescript
// Format: timestamp (8 bytes) + random (24 bytes)
const nonce = generateNonce(); // 0x0123456789abcdef...
```

### Signature Validity

Authorizations have a time window:

```typescript
{
  validAfter: 0n,                    // Valid immediately
  validBefore: currentTime + 3600n,  // Valid for 1 hour
}
```

### Gas-Free Transactions

**Key benefit:** Users don't need CRO for gas! The Cronos facilitator pays gas fees, making payments frictionless for users who only hold USDC.e.

## Error Handling

### Common Errors

**"No wallet connected"**
```tsx
const { isConnected } = useAccount();
if (!isConnected) {
  return <ConnectButton />;
}
```

**"Wrong network"**
```tsx
const chainId = useChainId();
if (chainId !== 338 && chainId !== 25) {
  return <SwitchNetworkButton />;
}
```

**"Insufficient USDC.e balance"**
```tsx
// Check balance before payment
const balance = await getUSDCBalance(address, network);
if (balance.balance < amount) {
  return <InsufficientBalanceMessage />;
}
```

**"Authorization expired"**
- Authorizations expire after `validBefore` timestamp
- Default: 1 hour
- User needs to sign a new permit

**"User rejected signature"**
- User declined signature in wallet
- Show friendly message and allow retry

## Testing

### Testnet Testing

1. **Get TCRO:** https://cronos.org/faucet
2. **Get devUSDC.e:** https://faucet.cronos.org
3. **Connect wallet** to Cronos Testnet (Chain 338)
4. **Test payment** with small amount (0.01 USDC.e)

### Example Test Flow

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentButton } from '@/components/payment/PaymentButton';

test('completes payment successfully', async () => {
  const onSuccess = jest.fn();

  render(
    <PaymentButton
      recipient="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8"
      amount="0.01"
      onSuccess={onSuccess}
    />
  );

  const button = screen.getByRole('button');
  fireEvent.click(button);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledWith(expect.stringMatching(/^0x/));
  });
});
```

## Best Practices

### 1. Always Validate Network

```tsx
const chainId = useChainId();
const isCronos = chainId === 25 || chainId === 338;

if (!isCronos) {
  return <SwitchNetworkPrompt />;
}
```

### 2. Show Clear Status Messages

```tsx
{isSigning && <p>Please sign the message in your wallet...</p>}
{isSubmitting && <p>Processing payment...</p>}
{txHash && <p>Success! <a href={explorerUrl}>View transaction</a></p>}
```

### 3. Handle User Rejection Gracefully

```tsx
try {
  await signPermit({ recipient, amount });
} catch (error) {
  if (error.message.includes('User rejected')) {
    // Don't show scary error, just allow retry
    return;
  }
  throw error;
}
```

### 4. Provide Fallback for RPC Failures

```tsx
const result = await submitUsdcPayment(signed, network);

if (!result.success && result.error === 'Network error') {
  // Retry with exponential backoff
  await retryWithBackoff(() => submitUsdcPayment(signed, network));
}
```

## Security Considerations

### Client-Side Security

- ✅ Private keys **never** leave the user's wallet
- ✅ Signatures are **time-limited** (default 1 hour)
- ✅ Each authorization has a **unique nonce** (prevents replay)
- ✅ User **explicitly approves** each payment in their wallet

### Server-Side Security

- ✅ MCP server validates authorization before submission
- ✅ Facilitator verifies signature on-chain
- ✅ USDC.e contract enforces nonce uniqueness
- ✅ Only signed messages can authorize transfers

### Never Do This

```tsx
// ❌ NEVER hardcode private keys
const privateKey = '0x1234...'; // NEVER!

// ❌ NEVER send private keys to server
await fetch('/api/sign', { body: { privateKey } }); // NEVER!

// ✅ ALWAYS use wallet client
const signature = await signTypedDataAsync({ ... }); // ✓
```

## Troubleshooting

### "Facilitator returned error"
- Check facilitator health: `/api/payment/facilitator/health`
- Verify USDC.e balance is sufficient
- Ensure nonce hasn't been used

### "Transaction not found"
- Wait 2-3 seconds for blockchain confirmation
- Check transaction on Cronoscan: `https://testnet.cronoscan.com/tx/{txHash}`

### "Invalid signature"
- Verify EIP-712 domain matches USDC.e contract
- Check network (mainnet vs testnet addresses differ)
- Ensure correct USDC.e contract address

## Support

- **Cronos Docs:** https://docs.cronos.org/cronos-x402-facilitator
- **Facilitator API:** https://facilitator.cronoslabs.org/v2/x402
- **Discord:** https://discord.com/invite/cronos

## Examples

See `src/components/payment/PaymentButton.tsx` for a complete implementation example.
