/**
 * Cronos blockchain explorer utilities
 * Supports Cronos Mainnet and Testnet explorers
 */

import {
  type UnifiedNetwork,
  getNetworkConfig,
  SUPPORTED_NETWORKS,
  isNetworkSupported
} from '@/lib/commons/networks'

/**
 * Get the appropriate explorer URL for a Cronos network
 */
export const getExplorerBaseUrl = (network: UnifiedNetwork): string => {
  const networkConfig = getNetworkConfig(network)
  if (!networkConfig || !networkConfig.blockExplorerUrls.length) {
    throw new Error(`No explorer configured for network: ${network}`)
  }
  return networkConfig.blockExplorerUrls[0]
}

/**
 * Generate an explorer URL for an address or transaction on Cronos networks
 */
export const getExplorerUrl = (
  hash: string,
  network: UnifiedNetwork,
  type: 'address' | 'tx' = 'address'
): string => {
  const baseUrl = getExplorerBaseUrl(network)

  // Standard explorer URL structure for Cronos
  return type === 'address'
    ? `${baseUrl}/address/${hash}`
    : `${baseUrl}/tx/${hash}`
}

/**
 * Open explorer in a new tab for Cronos networks
 */
export const openExplorer = (
  hash: string,
  network: UnifiedNetwork,
  type: 'address' | 'tx' = 'address'
): void => {
  try {
    const url = getExplorerUrl(hash, network, type)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Failed to open explorer:', error)
  }
}

/**
 * Copy explorer URL to clipboard for Cronos networks
 */
export const copyExplorerUrl = async (
  hash: string,
  network: UnifiedNetwork,
  type: 'address' | 'tx' = 'address'
): Promise<boolean> => {
  try {
    const url = getExplorerUrl(hash, network, type)
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Failed to copy explorer URL to clipboard:', error)
    return false
  }
}

/**
 * Get explorer name for a Cronos network
 */
export const getExplorerName = (network: UnifiedNetwork): string => {
  const networkConfig = getNetworkConfig(network)
  if (!networkConfig) {
    return 'Explorer'
  }

  // Cronos explorer names
  const explorerUrl = networkConfig.blockExplorerUrls[0]
  if (explorerUrl.includes('cronos.org')) {
    return networkConfig.isTestnet ? 'Cronos Explorer (Testnet)' : 'Cronos Explorer'
  }

  // Generic fallback
  return `${networkConfig.name} Explorer`
}

/**
 * Check if a network has an explorer configured
 */
export const hasExplorer = (network: UnifiedNetwork): boolean => {
  try {
    getExplorerBaseUrl(network)
    return true
  } catch {
    return false
  }
}

/**
 * Get all supported explorer networks (Cronos only)
 */
export const getSupportedExplorerNetworks = (): UnifiedNetwork[] => {
  return SUPPORTED_NETWORKS.filter(network => hasExplorer(network))
}

/**
 * Validate network and get explorer info
 */
export const getExplorerInfo = (network: string) => {
  if (!isNetworkSupported(network)) {
    throw new Error(`Unsupported network: ${network}. Only Cronos networks are supported.`)
  }

  const unifiedNetwork = network as UnifiedNetwork
  const networkConfig = getNetworkConfig(unifiedNetwork)

  if (!networkConfig) {
    throw new Error(`Network configuration not found: ${network}`)
  }

  return {
    network: unifiedNetwork,
    name: getExplorerName(unifiedNetwork),
    baseUrl: getExplorerBaseUrl(unifiedNetwork),
    hasExplorer: hasExplorer(unifiedNetwork),
    isTestnet: networkConfig.isTestnet,
  }
}

// Legacy compatibility - default to cronos-testnet for development
export const getBlockscoutUrl = (hash: string, type: 'address' | 'tx' = 'address'): string => {
  return getExplorerUrl(hash, 'cronos-testnet', type)
}

export const openBlockscout = (hash: string, type: 'address' | 'tx' = 'address'): void => {
  openExplorer(hash, 'cronos-testnet', type)
}

export const copyBlockscoutUrl = async (hash: string, type: 'address' | 'tx' = 'address'): Promise<void> => {
  const success = await copyExplorerUrl(hash, 'cronos-testnet', type)
  if (!success) {
    throw new Error('Failed to copy URL to clipboard')
  }
}
