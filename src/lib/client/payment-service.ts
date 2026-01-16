/**
 * Payment Service
 *
 * Client-side service for handling USDC.e payments via wallet signatures
 * and Cronos facilitator submission.
 */

import type { Address, Hex } from 'viem';
import type { SignedTransferAuthorization } from '@/hooks/useSignUsdcPermit';

/**
 * Payment submission response from MCP server
 */
export type PaymentSubmissionResult = {
  success: boolean;
  txHash?: Hex;
  message?: string;
  network?: string;
  explorerUrl?: string;
  error?: string;
  reason?: string;
};

/**
 * Submit a signed USDC.e payment authorization to the MCP server
 *
 * The MCP server will forward the authorization to the Cronos facilitator
 * for on-chain settlement.
 *
 * @param authorization - Signed EIP-3009 authorization from wallet
 * @param network - Cronos network (cronos-mainnet or cronos-testnet)
 * @param mcpServerUrl - MCP server URL (defaults to env variable or localhost)
 * @returns Settlement result with transaction hash
 */
export async function submitUsdcPayment(
  authorization: SignedTransferAuthorization,
  network: 'cronos-mainnet' | 'cronos-testnet',
  mcpServerUrl?: string
): Promise<PaymentSubmissionResult> {
  const baseUrl = mcpServerUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3050';
  const endpoint = `${baseUrl}/api/payment/usdc/submit`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify({
        network,
        authorization: {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(), // BigInt to string
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
          signature: authorization.signature,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        reason: errorData.reason,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      reason: error instanceof Error ? error.message : 'Failed to submit payment',
    };
  }
}

/**
 * Check Cronos facilitator health status
 *
 * @param mcpServerUrl - MCP server URL
 * @returns Facilitator health status
 */
export async function checkFacilitatorHealth(mcpServerUrl?: string): Promise<{
  healthy: boolean;
  status: string;
  timestamp?: number;
  error?: string;
}> {
  const baseUrl = mcpServerUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3050';
  const endpoint = `${baseUrl}/api/payment/facilitator/health`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return {
        healthy: false,
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get supported networks and tokens from facilitator
 *
 * @param mcpServerUrl - MCP server URL
 * @returns Supported networks list
 */
export async function getSupportedNetworks(mcpServerUrl?: string): Promise<{
  networks?: Array<{
    network: string;
    chainId: number;
    tokens: Array<{
      address: Address;
      symbol: string;
      decimals: number;
    }>;
  }>;
  error?: string;
}> {
  const baseUrl = mcpServerUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3050';
  const endpoint = `${baseUrl}/api/payment/facilitator/supported`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Complete payment flow: sign permit and submit to facilitator
 *
 * This is a convenience function that combines signing with submission.
 * Use this if you want a single function call to handle the entire payment.
 *
 * Note: The signPermit function should come from useSignUsdcPermit hook
 *
 * @example
 * ```tsx
 * const { signPermit } = useSignUsdcPermit();
 * const result = await completePayment({
 *   signPermit,
 *   recipient: '0x...',
 *   amount: '0.01',
 *   network: 'cronos-testnet',
 * });
 * ```
 */
export async function completePayment(config: {
  signPermit: (config: { recipient: Address; amount: string }) => Promise<SignedTransferAuthorization>;
  recipient: Address;
  amount: string;
  network: 'cronos-mainnet' | 'cronos-testnet';
  mcpServerUrl?: string;
}): Promise<PaymentSubmissionResult> {
  try {
    // Step 1: Sign the permit with wallet
    const signed = await config.signPermit({
      recipient: config.recipient,
      amount: config.amount,
    });

    // Step 2: Submit to MCP server → facilitator
    const result = await submitUsdcPayment(signed, config.network, config.mcpServerUrl);

    return result;
  } catch (error) {
    return {
      success: false,
      error: 'Payment failed',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
