/**
 * Cronos402 Blockchain Type Definitions
 *
 * Cronos-only types for the payment gateway.
 * Only supports: cronos (mainnet) and cronos-testnet
 */

import type { UnifiedNetwork, TokenConfig } from '@/lib/commons/networks';

// =============================================================================
// RE-EXPORT UNIFIED TYPES
// =============================================================================

export type { UnifiedNetwork, TokenConfig } from '@/lib/commons/networks';

// For backwards compatibility
export type Network = UnifiedNetwork;

// Cronos is EVM - no need for multi-architecture support
export type BlockchainArchitecture = 'evm';

// =============================================================================
// TOKEN TYPES - Cronos Only
// =============================================================================

// Only USDC.e is supported for payments on Cronos
export type StablecoinSymbol = 'USDC.e';

// EVM address type (0x prefixed hex string)
export type BlockchainAddress = `0x${string}` | string;

// Extended TokenInfo for payment tokens
export interface TokenInfo extends TokenConfig {
  network: Network;
  chainId: number;
  description?: string;
  // Payment-specific metadata
  recommendedForPayments: boolean;
  // Legacy compatibility fields
  tags?: string[];
  popularityScore?: number;
  liquidityTier?: 'high' | 'medium' | 'low';
  category?: 'stablecoin' | 'utility' | 'native';
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;
  isTestnet: boolean;
}

// =============================================================================
// AMOUNT TYPES
// =============================================================================

export interface FormatAmountOptions {
  /** Token symbol to display (e.g., "USDC.e", "CRO") */
  symbol?: string;
  /** Maximum number of decimal places to show */
  precision?: number;
  /** Whether to use compact notation for large numbers (K, M, B, T) */
  compact?: boolean;
  /** Minimum number of decimal places to show (pads with zeros) */
  minDecimals?: number;
  /** Whether to show the symbol */
  showSymbol?: boolean;
}

export interface DbAmountRecord {
  amount_raw: string;
  token_decimals: number;
}

export type RevenueByCurrency = Record<string, string>;

// =============================================================================
// BALANCE TRACKING TYPES - Cronos Only
// =============================================================================

export interface StablecoinConfig {
  symbol: StablecoinSymbol;
  name: string;
  decimals: number;
  isPegged: boolean;
  pegTarget?: number;
  coingeckoId?: string;
}

export interface StablecoinBalance {
  address: BlockchainAddress;
  chain: string;
  chainId: number;
  chainName: string;
  isTestnet: boolean;
  stablecoin: StablecoinSymbol;
  stablecoinName: string;
  tokenIdentifier: string;
  balance: bigint;
  formattedBalance: string;
  decimals: number;
  priceUsd: number;
  fiatValue: number;
}

export interface StablecoinBalanceError {
  address: BlockchainAddress;
  chain: string;
  chainId: number;
  chainName: string;
  isTestnet: boolean;
  stablecoin: StablecoinSymbol;
  tokenIdentifier: string;
  error: string;
}

// =============================================================================
// CRONOS CHAIN CONFIGURATION
// =============================================================================

export interface CronosTokenConfig {
  address: `0x${string}`;
  symbol: StablecoinSymbol;
}

export interface CronosChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  stablecoins: CronosTokenConfig[];
}

// Simplified - only Cronos chains
export type ChainConfig = CronosChainConfig;

// =============================================================================
// PRICE PROVIDER TYPES
// =============================================================================

export interface PriceProvider {
  getPrice(symbol: StablecoinSymbol): Promise<number>;
  getPrices(symbols: StablecoinSymbol[]): Promise<Record<StablecoinSymbol, number>>;
}

// =============================================================================
// COMMON DECIMALS - Cronos Tokens
// =============================================================================

export const COMMON_DECIMALS = {
  'USDC.e': 6,  // USDC.e on Cronos
  CRO: 18,     // Native CRO
} as const;

// =============================================================================
// BALANCE TRACKING RESULTS
// =============================================================================

export interface MultiChainStablecoinResult {
  balances: StablecoinBalance[];
  errors: StablecoinBalanceError[];
  totalFiatValue: number;
  testnetTotalFiatValue: number;
  mainnetBalances: StablecoinBalance[];
  testnetBalances: StablecoinBalance[];
  balancesByChain: Partial<Record<Network, StablecoinBalance[]>>;
  balancesByStablecoin: Partial<Record<StablecoinSymbol, StablecoinBalance[]>>;
  mainnetBalancesByChain: Partial<Record<Network, StablecoinBalance[]>>;
  testnetBalancesByChain: Partial<Record<Network, StablecoinBalance[]>>;
  mainnetBalancesByStablecoin: Partial<Record<StablecoinSymbol, StablecoinBalance[]>>;
  testnetBalancesByStablecoin: Partial<Record<StablecoinSymbol, StablecoinBalance[]>>;
  summary: {
    totalAccounts: number;
    totalChainsChecked: number;
    totalStablecoinsChecked: number;
    successfulChecks: number;
    failedChecks: number;
    mainnetChainsChecked: number;
    testnetChainsChecked: number;
    mainnetSuccessfulChecks: number;
    testnetSuccessfulChecks: number;
  };
}

// =============================================================================
// STABLECOIN CLIENT INTERFACE
// =============================================================================

export interface StablecoinClient {
  getTokenBalance(
    address: BlockchainAddress,
    tokenConfig: CronosTokenConfig,
    chainConfig: CronosChainConfig
  ): Promise<bigint>;
}
