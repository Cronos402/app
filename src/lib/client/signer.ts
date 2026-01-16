/**
 * Cronos-only wallet signer utilities
 * Creates wallet clients for signing using injected browser providers
 *
 * BEST PRACTICE: Uses centralized constants from @/lib/constants/cronos
 */

import { type Account, type Chain } from 'viem'
import { createWalletClient, custom, publicActions } from 'viem'
import {
  CRONOS_CHAIN_ID,
  CRONOS_RPC_URL,
  CRONOS_EXPLORER,
  CRO_METADATA,
} from '@/lib/constants/cronos'

// Cronos Chain Definitions (using centralized constants)
const cronos: Chain = {
  id: CRONOS_CHAIN_ID.MAINNET,
  name: CRO_METADATA.NAME,
  nativeCurrency: {
    name: CRO_METADATA.NAME,
    symbol: CRO_METADATA.SYMBOL.MAINNET,
    decimals: CRO_METADATA.DECIMALS,
  },
  rpcUrls: {
    default: { http: [CRONOS_RPC_URL.MAINNET] },
    public: { http: [CRONOS_RPC_URL.MAINNET] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: CRONOS_EXPLORER.MAINNET },
  },
}

const cronosTestnet: Chain = {
  id: CRONOS_CHAIN_ID.TESTNET,
  name: 'Cronos Testnet',
  nativeCurrency: {
    name: 'Test Cronos',
    symbol: CRO_METADATA.SYMBOL.TESTNET,
    decimals: CRO_METADATA.DECIMALS,
  },
  rpcUrls: {
    default: { http: [CRONOS_RPC_URL.TESTNET] },
    public: { http: [CRONOS_RPC_URL.TESTNET] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: CRONOS_EXPLORER.TESTNET },
  },
  testnet: true,
}

// Export chain definitions
export { cronos, cronosTestnet }

/**
 * Get Chain object from network string
 * Only supports Cronos networks
 */
function getChainFromNetwork(network: string | undefined): Chain {
  if (!network) {
    throw new Error('Network is required for signer')
  }
  switch (network) {
    case 'cronos':
    case 'cronos-mainnet':
      return cronos
    case 'cronos-testnet':
      return cronosTestnet
    default:
      throw new Error(`Unsupported network: ${network}. Only Cronos networks are supported.`)
  }
}

/**
 * Create a wallet client that signs using the injected browser provider
 * (e.g., MetaMask, Crypto.com DeFi Wallet, Coinbase Wallet)
 */
export function createInjectedSigner(network: string, account: Account) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found. Please install or enable your wallet.')
  }
  const chain = getChainFromNetwork(network)
  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
    account,
  }).extend(publicActions)
}
