"use client";

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// Cronos Mainnet
export const cronos = defineChain({
  id: 25,
  name: 'Cronos',
  nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronoscan', url: 'https://cronoscan.com' },
  },
  contracts: {
    // USDC.e (Stargate Bridged USDC)
    usdc: {
      address: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C',
      blockCreated: 1000000,
    },
  },
})

// Cronos Testnet
export const cronosTestnet = defineChain({
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: { name: 'Cronos', symbol: 'TCRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-t3.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronoscan Testnet', url: 'https://testnet.cronoscan.com' },
  },
  testnet: true,
  contracts: {
    // devUSDC.e (Testnet USDC)
    usdc: {
      address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
      blockCreated: 1000000,
    },
  },
})

// RainbowKit configuration for Cronos
export const wagmiConfig = getDefaultConfig({
  appName: 'Cronos402',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [cronos, cronosTestnet],
  ssr: true, // Enable SSR mode for Next.js
})
