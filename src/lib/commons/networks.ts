/**
 * Unified Network Registry for Cronos402
 *
 * This module serves as the single source of truth for all network configurations.
 *
 * SUPPORTED NETWORKS:
 * - cronos (mainnet)
 * - cronos-testnet
 *
 * This is a Cronos-only MCP payment gateway.
 *
 * BEST PRACTICE: Uses centralized constants from @/lib/constants/cronos
 */

import type { Address } from 'viem';
import type { StablecoinSymbol, StablecoinConfig } from '@/types/blockchain';
import {
  CRONOS_NETWORK,
  CRONOS_CHAIN_ID,
  CRONOS_RPC_URL,
  CRONOS_EXPLORER,
  CRONOS_FACILITATOR,
  USDC_ADDRESS,
  USDC_METADATA,
  CRO_ADDRESS,
  CRO_METADATA,
} from '@/lib/constants/cronos';

// =============================================================================
// CORE NETWORK TYPES - CRONOS ONLY
// =============================================================================

export type UnifiedNetwork = 'cronos' | 'cronos-testnet';

export type EVMNetwork = UnifiedNetwork;

// No Solana or NEAR support
export type SolanaNetwork = never;
export type NearNetwork = never;

export type BlockchainArchitecture = 'evm';

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address?: Address;
  isNative?: boolean;
  isStablecoin?: boolean;
  coingeckoId?: string;
  logoUri?: string;
  verified: boolean;
  verificationSource?: string;
  // EIP-3009 domain for gasless transfers
  eip712?: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
}

export interface NetworkConfig {
  // Basic network info
  name: string;
  chainId: number;
  architecture: BlockchainArchitecture;
  isTestnet: boolean;
  isSupported: boolean;
  x402Supported: boolean;

  // Native currency
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };

  // Network infrastructure
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;

  // Token registry for this network
  tokens: Record<string, TokenConfig>;

  // Payment system integration
  facilitatorUrl?: string;

  // CDP integration
  cdpSupported: boolean;
  cdpNetworkName?: string;
}

// =============================================================================
// STABLECOIN METADATA - Cronos uses only USDC.e (Bridged USDC via Stargate)
// =============================================================================

export const STABLECOIN_METADATA: Record<StablecoinSymbol, StablecoinConfig> = {
  'USDC.e': {
    symbol: 'USDC.e',
    name: 'Bridged USDC (Stargate)',
    decimals: 6,
    coingeckoId: 'usd-coin',
    isPegged: true,
    pegTarget: 1.0,
  },
};

// Alias for backwards compatibility
export const STABLECOIN_CONFIGS = STABLECOIN_METADATA;

// =============================================================================
// NETWORK CONFIGURATIONS - CRONOS ONLY
// Uses constants from @/lib/constants/cronos
// =============================================================================

// USDC.e token addresses from centralized constants
const USDC_E_ADDRESSES = {
  'cronos-testnet': USDC_ADDRESS.TESTNET as Address,
  'cronos': USDC_ADDRESS.MAINNET as Address,
} as const;

export const UNIFIED_NETWORKS: Record<UnifiedNetwork, NetworkConfig> = {
  // CRONOS TESTNET - Uses centralized constants
  'cronos-testnet': {
    name: 'Cronos Testnet',
    chainId: CRONOS_CHAIN_ID.TESTNET,
    architecture: 'evm',
    isTestnet: true,
    isSupported: true,
    x402Supported: true,
    nativeCurrency: {
      name: CRO_METADATA.NAME,
      symbol: CRO_METADATA.SYMBOL.TESTNET,
      decimals: CRO_METADATA.DECIMALS,
    },
    rpcUrls: [CRONOS_RPC_URL.TESTNET],
    blockExplorerUrls: [CRONOS_EXPLORER.TESTNET],
    iconUrl: '/networks/cronos.svg',
    cdpSupported: false,
    facilitatorUrl: CRONOS_FACILITATOR.X402_URL,
    tokens: {
      // Native TCRO
      [CRO_ADDRESS]: {
        symbol: CRO_METADATA.SYMBOL.TESTNET,
        name: 'Test Cronos',
        decimals: CRO_METADATA.DECIMALS,
        isNative: true,
        isStablecoin: false,
        coingeckoId: 'crypto-com-chain',
        logoUri: '/tokens/cro.svg',
        verified: true,
        verificationSource: 'Cronos Official',
      },
      // USDC.e (Bridged USDC via Stargate) - Used for x402 payments
      [USDC_E_ADDRESSES['cronos-testnet']]: {
        symbol: USDC_METADATA.SYMBOL.TESTNET,
        name: USDC_METADATA.NAME,
        decimals: USDC_METADATA.DECIMALS,
        address: USDC_E_ADDRESSES['cronos-testnet'],
        isNative: false,
        isStablecoin: true,
        coingeckoId: 'usd-coin',
        logoUri: '/tokens/usdc.svg',
        verified: true,
        verificationSource: 'Cronos Official Documentation',
        // EIP-3009 domain for gasless transfers
        eip712: {
          name: USDC_METADATA.NAME,
          version: USDC_METADATA.VERSION,
          chainId: CRONOS_CHAIN_ID.TESTNET,
          verifyingContract: USDC_E_ADDRESSES['cronos-testnet'],
        },
      },
    },
  },

  // CRONOS MAINNET - Uses centralized constants
  'cronos': {
    name: CRO_METADATA.NAME,
    chainId: CRONOS_CHAIN_ID.MAINNET,
    architecture: 'evm',
    isTestnet: false,
    isSupported: true,
    x402Supported: true,
    nativeCurrency: {
      name: CRO_METADATA.NAME,
      symbol: CRO_METADATA.SYMBOL.MAINNET,
      decimals: CRO_METADATA.DECIMALS,
    },
    rpcUrls: [CRONOS_RPC_URL.MAINNET],
    blockExplorerUrls: [CRONOS_EXPLORER.MAINNET],
    iconUrl: '/networks/cronos.svg',
    cdpSupported: false,
    facilitatorUrl: CRONOS_FACILITATOR.X402_URL,
    tokens: {
      // Native CRO
      [CRO_ADDRESS]: {
        symbol: CRO_METADATA.SYMBOL.MAINNET,
        name: CRO_METADATA.NAME,
        decimals: CRO_METADATA.DECIMALS,
        isNative: true,
        isStablecoin: false,
        coingeckoId: 'crypto-com-chain',
        logoUri: '/tokens/cro.svg',
        verified: true,
        verificationSource: 'Cronos Official',
      },
      // USDC.e (Bridged USDC via Stargate) - Used for x402 payments
      [USDC_E_ADDRESSES['cronos']]: {
        symbol: USDC_METADATA.SYMBOL.MAINNET,
        name: USDC_METADATA.NAME,
        decimals: USDC_METADATA.DECIMALS,
        address: USDC_E_ADDRESSES['cronos'],
        isNative: false,
        isStablecoin: true,
        coingeckoId: 'usd-coin',
        logoUri: '/tokens/usdc.svg',
        verified: true,
        verificationSource: 'Cronos Official Documentation',
        // EIP-3009 domain for gasless transfers
        eip712: {
          name: USDC_METADATA.NAME,
          version: USDC_METADATA.VERSION,
          chainId: CRONOS_CHAIN_ID.MAINNET,
          verifyingContract: USDC_E_ADDRESSES['cronos'],
        },
      },
    },
  },
};

// =============================================================================
// NETWORK UTILITY FUNCTIONS
// =============================================================================

/**
 * List of all supported networks
 */
export const SUPPORTED_NETWORKS = Object.keys(UNIFIED_NETWORKS) as UnifiedNetwork[];

/**
 * List of supported EVM networks (all networks are EVM for Cronos402)
 */
export const SUPPORTED_EVM_NETWORKS: EVMNetwork[] = [...SUPPORTED_NETWORKS];

/**
 * Check if a network is supported
 */
export function isNetworkSupported(network: string): network is UnifiedNetwork {
  return SUPPORTED_NETWORKS.includes(network as UnifiedNetwork);
}

/**
 * Check if network is testnet
 */
export function isTestnet(network: UnifiedNetwork): boolean {
  return UNIFIED_NETWORKS[network]?.isTestnet ?? false;
}

/**
 * Get network config
 */
export function getNetworkConfig(network: UnifiedNetwork): NetworkConfig | undefined {
  return UNIFIED_NETWORKS[network];
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): UnifiedNetwork[] {
  return SUPPORTED_NETWORKS.filter(n => isTestnet(n));
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): UnifiedNetwork[] {
  return SUPPORTED_NETWORKS.filter(n => !isTestnet(n));
}

/**
 * Get networks by architecture (only EVM supported)
 */
export function getNetworksByArchitecture(arch: BlockchainArchitecture): UnifiedNetwork[] {
  if (arch !== 'evm') return [];
  return SUPPORTED_NETWORKS;
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Legacy network name mappings
 */
export const LEGACY_NETWORK_MAPPING: Record<string, UnifiedNetwork> = {
  'cronosTestnet': 'cronos-testnet',
  'cronos-mainnet': 'cronos',
};

/**
 * Convert legacy network name to unified network name
 */
export function normalizeLegacyNetwork(legacyNetwork: string): UnifiedNetwork | undefined {
  if (isNetworkSupported(legacyNetwork)) {
    return legacyNetwork;
  }
  return LEGACY_NETWORK_MAPPING[legacyNetwork];
}

// =============================================================================
// X402 COMPATIBILITY
// =============================================================================

/**
 * Map UnifiedNetwork to x402 network format
 */
export function toX402Network(network: UnifiedNetwork): string {
  return network;
}

/**
 * Map x402 network to UnifiedNetwork format
 */
export function fromX402Network(x402Network: string): UnifiedNetwork | undefined {
  return isNetworkSupported(x402Network) ? x402Network : undefined;
}

/**
 * Get USDC.e address for a network (x402 compatibility)
 */
export function getUSDCAddress(network: UnifiedNetwork): Address | undefined {
  return USDC_E_ADDRESSES[network];
}

/**
 * Get USDC.e token config for a network
 */
export function getUSDCConfig(network: UnifiedNetwork): TokenConfig | undefined {
  const networkConfig = UNIFIED_NETWORKS[network];
  if (!networkConfig) return undefined;

  const usdcAddress = USDC_E_ADDRESSES[network];
  return networkConfig.tokens[usdcAddress];
}

// =============================================================================
// CHAIN ID MAPPINGS
// =============================================================================

/**
 * Chain ID to network mapping
 */
export const CHAIN_ID_TO_NETWORK = Object.fromEntries(
  Object.entries(UNIFIED_NETWORKS).map(([network, config]) => [
    config.chainId,
    network as UnifiedNetwork
  ])
) as Record<number, UnifiedNetwork>;

/**
 * Network to chain ID mapping
 */
export const NETWORK_TO_CHAIN_ID = Object.fromEntries(
  Object.entries(UNIFIED_NETWORKS).map(([network, config]) => [
    network,
    config.chainId
  ])
) as Record<UnifiedNetwork, number>;

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): UnifiedNetwork | undefined {
  return CHAIN_ID_TO_NETWORK[chainId];
}

// =============================================================================
// BLOCKCHAIN ARCHITECTURE UTILITIES
// =============================================================================

/**
 * Mapping of blockchain names to their architectures
 * For Cronos402, only EVM is supported
 */
export const BLOCKCHAIN_TO_ARCHITECTURE: Record<string, BlockchainArchitecture> = {
  'cronos': 'evm',
  'cro': 'evm',
};

/**
 * Get blockchain architecture for a given blockchain name
 */
export function getBlockchainArchitecture(blockchain: string | null | undefined): BlockchainArchitecture {
  // Cronos402 only supports EVM
  return 'evm';
}

/**
 * Get list of blockchains for a given architecture
 */
export function getBlockchainsForArchitecture(architecture: BlockchainArchitecture): string[] {
  if (architecture !== 'evm') return [];
  return ['cronos'];
}

/**
 * Check if a blockchain is supported
 */
export function isSupportedBlockchain(blockchain: string): boolean {
  if (!blockchain) return false;
  const normalized = blockchain.toLowerCase().trim();
  return normalized === 'cronos' || normalized === 'cro';
}

// =============================================================================
// TOKEN UTILITIES
// =============================================================================

/**
 * Get all tokens for a network
 */
export function getNetworkTokens(network: UnifiedNetwork): Record<string, TokenConfig> {
  return UNIFIED_NETWORKS[network]?.tokens ?? {};
}

/**
 * Get native token config for a network
 */
export function getNativeToken(network: UnifiedNetwork): TokenConfig | undefined {
  const tokens = getNetworkTokens(network);
  return Object.values(tokens).find(t => t.isNative);
}

/**
 * Get stablecoin tokens for a network
 */
export function getStablecoins(network: UnifiedNetwork): TokenConfig[] {
  const tokens = getNetworkTokens(network);
  return Object.values(tokens).filter(t => t.isStablecoin);
}

/**
 * Get facilitator URL for a network
 */
export function getFacilitatorUrl(network: UnifiedNetwork): string | undefined {
  return UNIFIED_NETWORKS[network]?.facilitatorUrl;
}

// =============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS
// =============================================================================

/**
 * Get all EVM networks (same as SUPPORTED_NETWORKS for Cronos402)
 */
export function getEVMNetworks(): UnifiedNetwork[] {
  return SUPPORTED_NETWORKS;
}

/**
 * Get all Solana networks (none - not supported in Cronos402)
 */
export function getSolanaNetworks(): UnifiedNetwork[] {
  return [];
}

/**
 * Get all Near networks (none - not supported in Cronos402)
 */
export function getNearNetworks(): UnifiedNetwork[] {
  return [];
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): UnifiedNetwork[] {
  return SUPPORTED_NETWORKS;
}

/**
 * Check if network is testnet
 */
export function isTestnetNetwork(network: UnifiedNetwork): boolean {
  return isTestnet(network);
}

// =============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// =============================================================================

/**
 * Get CDP network name (not supported for Cronos)
 */
export function getCDPNetworkName(_network: UnifiedNetwork): string | undefined {
  // CDP not supported on Cronos
  return undefined;
}

/**
 * Get networks that support CDP (none for Cronos)
 */
export function getCDPNetworks(): UnifiedNetwork[] {
  // CDP not supported on Cronos
  return [];
}

/**
 * Get native token symbol for a network
 */
export function getNativeTokenSymbol(network: UnifiedNetwork): string {
  return UNIFIED_NETWORKS[network]?.nativeCurrency.symbol ?? 'CRO';
}

/**
 * Get stablecoins for a network (alias for getStablecoins)
 */
export function getNetworkStablecoins(network: UnifiedNetwork): TokenConfig[] {
  return getStablecoins(network);
}

/**
 * Get token config by address for a network
 */
export function getTokenConfig(network: UnifiedNetwork, address: string): TokenConfig | undefined {
  const tokens = getNetworkTokens(network);
  return tokens[address];
}

/**
 * Get networks that support x402 payments
 */
export function getX402Networks(): UnifiedNetwork[] {
  return SUPPORTED_NETWORKS.filter(network => UNIFIED_NETWORKS[network].x402Supported);
}

// =============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

export const ALL_NETWORKS = SUPPORTED_NETWORKS;
export const EVM_NETWORKS = SUPPORTED_EVM_NETWORKS;

// Default export for convenience
export default UNIFIED_NETWORKS;
