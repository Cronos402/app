/**
 * useSendCroPayment Hook
 *
 * Client-side hook for sending native CRO payments on Cronos.
 * Unlike USDC.e, CRO payments are direct transactions where the user pays gas.
 *
 * Uses wagmi's useSendTransaction to send transactions through connected wallets
 * (MetaMask, Crypto.com Wallet via WalletConnect, etc.)
 */

import { useSendTransaction, useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, type Hash, parseUnits } from 'viem';
import { useState, useCallback } from 'react';

/**
 * CRO Transaction Parameters
 */
export type CroTransactionParams = {
  /** Recipient address */
  recipient: Address;
  /** Amount in CRO (e.g., "0.1" for 0.1 CRO) */
  amount: string;
};

/**
 * CRO Transaction Result
 */
export type CroTransactionResult = {
  /** Transaction hash */
  txHash: Hash;
  /** Sender address */
  from: Address;
  /** Recipient address */
  to: Address;
  /** Amount sent (in wei) */
  value: bigint;
  /** Chain ID */
  chainId: number;
};

/**
 * Hook configuration
 */
export type UseSendCroPaymentConfig = {
  /** Recipient address (payment recipient) */
  recipient?: Address;
  /** Amount in CRO (e.g., "0.1" for 0.1 CRO) */
  amount?: string;
  /** Gas limit (optional, default: 21000) */
  gasLimit?: bigint;
};

/**
 * Hook return type
 */
export type UseSendCroPaymentReturn = {
  /** Send CRO payment transaction */
  sendPayment: (config?: UseSendCroPaymentConfig) => Promise<CroTransactionResult>;
  /** Transaction hash */
  txHash?: Hash;
  /** Transaction result */
  result?: CroTransactionResult;
  /** Loading state (sending transaction) */
  isSending: boolean;
  /** Waiting for confirmation */
  isConfirming: boolean;
  /** Transaction confirmed */
  isConfirmed: boolean;
  /** Error state */
  error: Error | null;
  /** Reset state */
  reset: () => void;
};

/**
 * CRO Token Decimals
 */
const CRO_DECIMALS = 18;

/**
 * Supported Cronos Chain IDs
 */
const CRONOS_CHAINS = {
  MAINNET: 25,
  TESTNET: 338,
} as const;

/**
 * Check if current chain is Cronos
 */
function isCronosChain(chainId: number): boolean {
  return chainId === CRONOS_CHAINS.MAINNET || chainId === CRONOS_CHAINS.TESTNET;
}

/**
 * Hook for sending native CRO payments using connected wallet
 *
 * @example
 * ```tsx
 * function PaymentButton() {
 *   const { sendPayment, isSending, isConfirming, isConfirmed, result } = useSendCroPayment();
 *
 *   const handlePay = async () => {
 *     const tx = await sendPayment({
 *       recipient: '0x...',
 *       amount: '0.1', // 0.1 CRO
 *     });
 *
 *     console.log('Transaction:', tx.txHash);
 *     // Wait for isConfirmed to become true
 *   };
 *
 *   return (
 *     <button onClick={handlePay} disabled={isSending || isConfirming}>
 *       {isSending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Pay with CRO'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSendCroPayment(defaultConfig?: UseSendCroPaymentConfig): UseSendCroPaymentReturn {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

  const [txHash, setTxHash] = useState<Hash>();
  const [result, setResult] = useState<CroTransactionResult>();
  const [error, setError] = useState<Error | null>(null);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2, // Wait for 2 confirmations
  });

  const reset = useCallback(() => {
    setTxHash(undefined);
    setResult(undefined);
    setError(null);
  }, []);

  const sendPayment = useCallback(
    async (config?: UseSendCroPaymentConfig): Promise<CroTransactionResult> => {
      setError(null);

      try {
        // Merge config with defaults
        const finalConfig = { ...defaultConfig, ...config };
        const { recipient, amount, gasLimit = BigInt(21000) } = finalConfig;

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

        // Check if on Cronos network
        if (!isCronosChain(chainId)) {
          throw new Error(
            `Not on Cronos network. Please switch to Cronos Mainnet (25) or Testnet (338).`
          );
        }

        // Parse amount
        const value = parseUnits(amount, CRO_DECIMALS);

        if (value <= BigInt(0)) {
          throw new Error('Amount must be greater than 0');
        }

        // Send transaction
        const hash = await sendTransactionAsync({
          to: recipient,
          value,
          gas: gasLimit,
        });

        setTxHash(hash);

        const txResult: CroTransactionResult = {
          txHash: hash,
          from: connectedAddress,
          to: recipient,
          value,
          chainId,
        };

        setResult(txResult);
        return txResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send CRO payment');
        setError(error);
        throw error;
      }
    },
    [connectedAddress, chainId, sendTransactionAsync, defaultConfig]
  );

  return {
    sendPayment,
    txHash,
    result,
    isSending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  };
}
