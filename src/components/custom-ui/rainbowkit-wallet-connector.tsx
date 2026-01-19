"use client"

import { useEffect, useState, useCallback } from "react"
import { useAccount, useSignMessage, useDisconnect } from "wagmi"
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useTheme } from "@/components/providers/theme-context"
import { toast } from "sonner"
import { authApi } from "@/lib/client/utils"

type RainbowKitWalletConnectorProps = {
  onWalletLinked?: () => void
  existingWalletAddresses?: string[] // List of already linked wallet addresses
  onBusyChange?: (isBusy: boolean) => void
}

export function RainbowKitWalletConnector({ onWalletLinked, existingWalletAddresses = [], onBusyChange }: RainbowKitWalletConnectorProps) {
  const { address, isConnected, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const { isDark } = useTheme()
  const { openConnectModal } = useConnectModal()

  const [linkStatus, setLinkStatus] = useState<'idle' | 'signing' | 'linking' | 'success' | 'error' | 'already-linked'>('idle')
  // Track if user initiated the connection flow (clicked Connect Wallet)
  const [userInitiated, setUserInitiated] = useState(false)

  // Notify parent of busy state changes
  useEffect(() => {
    const isBusy = linkStatus === 'signing' || linkStatus === 'linking'
    onBusyChange?.(isBusy)
  }, [linkStatus, onBusyChange])

  // Check if the connected wallet is already linked
  const isAlreadyLinked = address
    ? existingWalletAddresses.some(addr => addr.toLowerCase() === address.toLowerCase())
    : false

  const handleLinkWallet = useCallback(async () => {
    console.log('[RainbowKitWalletConnector] handleLinkWallet called:', { address, chain })
    if (!address || !chain) {
      console.error('[RainbowKitWalletConnector] Missing address or chain')
      toast.error("No wallet connected")
      return
    }

    try {
      setLinkStatus('signing')

      // Sign a message to verify wallet ownership
      const message = `Link wallet to Cronos402\nAddress: ${address}\nTimestamp: ${Date.now()}`
      console.log('[RainbowKitWalletConnector] Requesting signature for:', message)
      const signature = await signMessageAsync({ message })
      console.log('[RainbowKitWalletConnector] Signature received:', signature)

      setLinkStatus('linking')

      // Save to backend
      console.log('[RainbowKitWalletConnector] Calling authApi.linkWallet...')
      const result = await authApi.linkWallet({
        walletAddress: address,
        provider: 'metamask', // This will be detected by the connector type
        blockchain: chain.name,
        chainId: chain.id,
        signature,
        message,
      })
      console.log('[RainbowKitWalletConnector] Link result:', result)

      setLinkStatus('success')
      toast.success("Wallet linked successfully!")

      // Notify parent to reload wallets
      onWalletLinked?.()

      // Reset after a delay (but DON'T disconnect - keep wallet connected globally)
      setTimeout(() => {
        setLinkStatus('idle')
      }, 2000)
    } catch (error) {
      console.error("[RainbowKitWalletConnector] Failed to link wallet:", error)
      console.error("[RainbowKitWalletConnector] Error details:", JSON.stringify(error, null, 2))
      setLinkStatus('error')

      const errorMessage = error instanceof Error ? error.message : "Failed to link wallet"
      console.error("[RainbowKitWalletConnector] Error message:", errorMessage)
      toast.error(errorMessage)

      // Reset after showing error
      setTimeout(() => {
        setLinkStatus('idle')
      }, 3000)
    }
  }, [address, chain, signMessageAsync, onWalletLinked])

  // Only link wallet when user explicitly initiated (clicked Connect Wallet)
  // This prevents auto-linking when user is already connected to MetaMask
  useEffect(() => {
    console.log('[RainbowKitWalletConnector] useEffect triggered:', { isConnected, address, chain: chain?.name, linkStatus, isAlreadyLinked, userInitiated })
    // Only proceed if user explicitly clicked Connect Wallet
    if (!userInitiated) {
      console.log('[RainbowKitWalletConnector] Skipping - user did not initiate connection')
      return
    }
    if (isConnected && address && chain && linkStatus === 'idle') {
      if (isAlreadyLinked) {
        console.log('[RainbowKitWalletConnector] Wallet already linked, skipping auto-link')
        setLinkStatus('already-linked')
      } else {
        console.log('[RainbowKitWalletConnector] Triggering link with chain:', chain.name)
        handleLinkWallet()
      }
    }
  }, [isConnected, address, chain, linkStatus, handleLinkWallet, isAlreadyLinked, userInitiated])

  if (isConnected && address && chain) {
    return (
      <div className={`p-4 rounded-md border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Connected Wallet
              </div>
              <div className={`font-mono text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                {chain.name}
              </div>
            </div>

            {linkStatus === 'signing' && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Sign message...</span>
              </div>
            )}

            {linkStatus === 'linking' && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Linking...</span>
              </div>
            )}

            {linkStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Linked!</span>
              </div>
            )}

            {linkStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Failed</span>
              </div>
            )}

            {linkStatus === 'already-linked' && (
              <div className="flex items-center gap-2 text-teal-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Already linked!</span>
              </div>
            )}

            {/* Show "Link This Wallet" button when idle (user connected but hasn't initiated) */}
            {linkStatus === 'idle' && !isAlreadyLinked && (
              <button
                onClick={() => {
                  setUserInitiated(true)
                  handleLinkWallet()
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
              >
                Link This Wallet
              </button>
            )}
          </div>

          {/* Show switch option when connected but not linked yet */}
          {linkStatus === 'idle' && !isAlreadyLinked && (
            <div className={`mt-3 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <p className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Want to link a different wallet? Disconnect first.
              </p>
              <button
                onClick={() => {
                  disconnect()
                  setUserInitiated(false)
                }}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Disconnect & Switch Wallet
              </button>
            </div>
          )}

          {/* Show switch wallet option when already linked */}
          {linkStatus === 'already-linked' && (
            <div className={`mt-3 pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <p className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Want to add a different wallet? Disconnect first, then connect the new wallet.
              </p>
              <button
                onClick={() => {
                  disconnect()
                  setLinkStatus('idle')
                  setUserInitiated(false)
                }}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Disconnect & Switch Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-md border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
      <div className="space-y-3">
        <div className={`text-xs text-center mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Connect your Cronos wallet to link it to your account
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              setUserInitiated(true) // Mark that user explicitly clicked
              openConnectModal?.()
            }}
            disabled={!openConnectModal}
            className="px-6 py-3 rounded-lg font-medium text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 7H18V6C18 4.93913 17.5786 3.92172 16.8284 3.17157C16.0783 2.42143 15.0609 2 14 2H10C8.93913 2 7.92172 2.42143 7.17157 3.17157C6.42143 3.92172 6 4.93913 6 6V7H5C4.20435 7 3.44129 7.31607 2.87868 7.87868C2.31607 8.44129 2 9.20435 2 10V19C2 19.7956 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22H19C19.7956 22 20.5587 21.6839 21.1213 21.1213C21.6839 20.5587 22 19.7956 22 19V10C22 9.20435 21.6839 8.44129 21.1213 7.87868C20.5587 7.31607 19.7956 7 19 7ZM8 6C8 5.46957 8.21071 4.96086 8.58579 4.58579C8.96086 4.21071 9.46957 4 10 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V7H8V6ZM20 19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V10C4 9.73478 4.10536 9.48043 4.29289 9.29289C4.48043 9.10536 4.73478 9 5 9H19C19.2652 9 19.5196 9.10536 19.7071 9.29289C19.8946 9.48043 20 9.73478 20 10V19ZM12 11C11.2089 11 10.4355 11.2346 9.77772 11.6741C9.11992 12.1136 8.60723 12.7384 8.30448 13.4693C8.00173 14.2002 7.92252 15.0044 8.07686 15.7804C8.2312 16.5563 8.61216 17.269 9.17157 17.8284C9.73098 18.3878 10.4437 18.7688 11.2196 18.9231C11.9956 19.0775 12.7998 18.9983 13.5307 18.6955C14.2616 18.3928 14.8864 17.8801 15.3259 17.2223C15.7654 16.5645 16 15.7911 16 15C16 13.9391 15.5786 12.9217 14.8284 12.1716C14.0783 11.4214 13.0609 11 12 11ZM12 17C11.6044 17 11.2178 16.8827 10.8889 16.6629C10.56 16.4432 10.3036 16.1308 10.1522 15.7654C10.0009 15.3999 9.96126 14.9978 10.0384 14.6098C10.1156 14.2219 10.3061 13.8655 10.5858 13.5858C10.8655 13.3061 11.2219 13.1156 11.6098 13.0384C11.9978 12.9613 12.3999 13.0009 12.7654 13.1522C13.1308 13.3036 13.4432 13.56 13.6629 13.8889C13.8827 14.2178 14 14.6044 14 15C14 15.5304 13.7893 16.0391 13.4142 16.4142C13.0391 16.7893 12.5304 17 12 17Z" fill="currentColor"/>
            </svg>
            Connect Wallet
          </button>
        </div>

        <div className={`text-[10px] text-center ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          Supports MetaMask, Crypto.com Wallet, and WalletConnect
        </div>
      </div>
    </div>
  )
}
