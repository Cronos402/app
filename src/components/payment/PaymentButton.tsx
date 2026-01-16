/**
 * PaymentButton Component
 *
 * Example component demonstrating USDC.e payment flow with wallet signatures.
 * Shows best practices for handling payments on Cronos via the facilitator.
 */

'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useSignUsdcPermit } from '@/hooks/useSignUsdcPermit';
import { submitUsdcPayment } from '@/lib/client/payment-service';
import type { Address } from 'viem';

export type PaymentButtonProps = {
  /** Payment recipient address */
  recipient: Address;
  /** Amount in USDC (e.g., "0.01" for 1 cent) */
  amount: string;
  /** Button text */
  children?: React.ReactNode;
  /** Callback on successful payment */
  onSuccess?: (txHash: string) => void;
  /** Callback on payment error */
  onError?: (error: string) => void;
  /** Custom CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
};

/**
 * Payment button that handles the complete USDC.e payment flow:
 * 1. Validates wallet connection and network
 * 2. Signs EIP-3009 permit with user's wallet
 * 3. Submits to MCP server → Cronos facilitator
 * 4. Returns transaction hash
 *
 * @example
 * ```tsx
 * <PaymentButton
 *   recipient="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8"
 *   amount="0.01"
 *   onSuccess={(txHash) => console.log('Paid!', txHash)}
 * >
 *   Pay 0.01 USDC.e
 * </PaymentButton>
 * ```
 */
export function PaymentButton({
  recipient,
  amount,
  children,
  onSuccess,
  onError,
  className,
  disabled,
}: PaymentButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signPermit, isLoading: isSigning } = useSignUsdcPermit();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  const isLoading = isSigning || isSubmitting;

  // Validate chain is Cronos
  const isCronosChain = chainId === 25 || chainId === 338;
  const network = chainId === 25 ? 'cronos-mainnet' : 'cronos-testnet';

  const handlePayment = async () => {
    setError(undefined);
    setTxHash(undefined);

    try {
      // Validate wallet connection
      if (!isConnected || !address) {
        const errorMsg = 'Please connect your wallet first';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Validate network
      if (!isCronosChain) {
        const errorMsg = 'Please switch to Cronos Mainnet or Testnet';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Step 1: Sign permit with wallet
      console.log('[Payment] Requesting signature from wallet...');
      const signed = await signPermit({ recipient, amount });
      console.log('[Payment] Signature obtained:', signed.signature);

      // Step 2: Submit to MCP server → facilitator
      console.log('[Payment] Submitting to facilitator...');
      setIsSubmitting(true);

      const result = await submitUsdcPayment(signed, network);

      setIsSubmitting(false);

      if (!result.success) {
        const errorMsg = result.error || result.reason || 'Payment failed';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('[Payment] Failed:', errorMsg);
        return;
      }

      // Success!
      console.log('[Payment] Success! Tx:', result.txHash);
      setTxHash(result.txHash);
      onSuccess?.(result.txHash!);
    } catch (err) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('[Payment] Error:', err);
    }
  };

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isCronosChain) return 'Switch to Cronos';
    if (isSigning) return 'Signing...';
    if (isSubmitting) return 'Processing...';
    if (txHash) return 'Paid ✓';
    return children || `Pay ${amount} USDC.e`;
  };

  const isButtonDisabled = disabled || isLoading || !!txHash;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePayment}
        disabled={isButtonDisabled}
        className={
          className ||
          `
          px-4 py-2 rounded-lg font-medium
          transition-colors duration-200
          ${isButtonDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
        `
        }
      >
        {getButtonText()}
      </button>

      {/* Status messages */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {txHash && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded border border-green-200">
          ✓ Payment successful!{' '}
          <a
            href={`${chainId === 25 ? 'https://cronoscan.com' : 'https://testnet.cronoscan.com'}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  );
}
