/**
 * useSignUsdcPermit Hook
 *
 * Client-side hook for signing EIP-3009 transferWithAuthorization permits
 * for gasless USDC.e transfers on Cronos via the facilitator.
 *
 * Uses wagmi's useSignTypedData to request signatures from connected wallets
 * (MetaMask, Crypto.com Wallet via WalletConnect, etc.)
 */

import { useSignTypedData, useAccount, useChainId } from 'wagmi';
import { type Address, type Hex, parseUnits } from 'viem';
import { useState, useCallback } from 'react';

/**
 * EIP-3009 Transfer Authorization
 */
export type TransferAuthorization = {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
};

/**
 * Signed Transfer Authorization (ready for facilitator)
 */
export type SignedTransferAuthorization = TransferAuthorization & {
  signature: Hex;
};

/**
 * Hook configuration
 */
export type UseSignUsdcPermitConfig = {
  /** Recipient address (payment recipient) */
  recipient?: Address;
  /** Amount in USDC (e.g., "0.01" for 1 cent) */
  amount?: string;
  /** Signature validity window in seconds (default: 1 hour) */
  validityWindow?: number;
};

/**
 * Hook return type
 */
export type UseSignUsdcPermitReturn = {
  /** Sign a USDC.e transfer authorization */
  signPermit: (config?: UseSignUsdcPermitConfig) => Promise<SignedTransferAuthorization>;
  /** Current signature data */
  signature?: Hex;
  /** Current authorization data */
  authorization?: TransferAuthorization;
  /** Complete signed authorization */
  signedAuthorization?: SignedTransferAuthorization;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Reset state */
  reset: () => void;
};

/**
 * EIP-712 Types for USDC.e transferWithAuthorization
 * Must match the USDC.e contract's EIP-712 types exactly
 */
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * USDC.e Contract Addresses
 */
const USDC_ADDRESS: Record<number, Address> = {
  25: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C', // Cronos Mainnet
  338: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // Cronos Testnet
};

/**
 * Generate a unique nonce for the authorization
 * Format: timestamp (8 bytes) + random bytes (24 bytes)
 */
function generateNonce(): Hex {
  const timestamp = BigInt(Date.now());
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));

  const timestampHex = timestamp.toString(16).padStart(16, '0');
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `0x${timestampHex}${randomHex}` as Hex;
}

/**
 * Get EIP-712 domain for USDC.e on Cronos
 */
function getUsdcDomain(chainId: number) {
  const verifyingContract = USDC_ADDRESS[chainId];

  if (!verifyingContract) {
    throw new Error(`USDC.e not supported on chain ${chainId}`);
  }

  return {
    name: 'Bridged USDC (Stargate)',
    version: '1',
    chainId,
    verifyingContract,
  };
}

/**
 * Hook for signing USDC.e EIP-3009 permits using connected wallet
 *
 * @example
 * ```tsx
 * function PaymentButton() {
 *   const { signPermit, isLoading, signedAuthorization } = useSignUsdcPermit();
 *
 *   const handlePay = async () => {
 *     const signed = await signPermit({
 *       recipient: '0x...',
 *       amount: '0.01',
 *     });
 *
 *     // Submit to MCP server
 *     await submitPayment(signed);
 *   };
 *
 *   return (
 *     <button onClick={handlePay} disabled={isLoading}>
 *       {isLoading ? 'Signing...' : 'Pay with USDC.e'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSignUsdcPermit(defaultConfig?: UseSignUsdcPermitConfig): UseSignUsdcPermitReturn {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  const [authorization, setAuthorization] = useState<TransferAuthorization>();
  const [signature, setSignature] = useState<Hex>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setAuthorization(undefined);
    setSignature(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  const signPermit = useCallback(
    async (config?: UseSignUsdcPermitConfig): Promise<SignedTransferAuthorization> => {
      setIsLoading(true);
      setError(null);

      try {
        // Merge config with defaults
        const finalConfig = { ...defaultConfig, ...config };
        const { recipient, amount, validityWindow = 3600 } = finalConfig;

        // Validation
        if (!connectedAddress) {
          throw new Error('No wallet connected. Please connect your wallet first.');
        }

        if (!recipient) {
          throw new Error('Recipient address is required');
        }

        if (!amount) {
          throw new Error('Amount is required');
        }

        // Check if chain supports USDC.e
        if (!USDC_ADDRESS[chainId]) {
          throw new Error(
            `USDC.e not available on this network. Please switch to Cronos Mainnet or Testnet.`
          );
        }

        // Create authorization
        const now = BigInt(Math.floor(Date.now() / 1000));
        const value = parseUnits(amount, 6); // USDC.e has 6 decimals

        const auth: TransferAuthorization = {
          from: connectedAddress,
          to: recipient,
          value,
          validAfter: BigInt(0), // Valid immediately
          validBefore: now + BigInt(validityWindow),
          nonce: generateNonce(),
        };

        setAuthorization(auth);

        // Get domain for current chain
        const domain = getUsdcDomain(chainId);

        // Request signature from wallet
        const sig = await signTypedDataAsync({
          domain,
          types: TRANSFER_WITH_AUTHORIZATION_TYPES,
          primaryType: 'TransferWithAuthorization',
          message: auth,
        });

        setSignature(sig);

        const signed: SignedTransferAuthorization = {
          ...auth,
          signature: sig,
        };

        setIsLoading(false);
        return signed;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to sign permit');
        setError(error);
        setIsLoading(false);
        throw error;
      }
    },
    [connectedAddress, chainId, signTypedDataAsync, defaultConfig]
  );

  const signedAuthorization = authorization && signature
    ? { ...authorization, signature }
    : undefined;

  return {
    signPermit,
    signature,
    authorization,
    signedAuthorization,
    isLoading,
    error,
    reset,
  };
}
