"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi"
import { Loader2, Wallet, CheckCircle2, XCircle } from "lucide-react"
import { useTheme } from "@/components/providers/theme-context"
import { toast } from "sonner"
import { authApi } from "@/lib/client/utils"

type WalletConnectorProps = {
  onWalletLinked?: () => void
}

export function WalletConnector({ onWalletLinked }: WalletConnectorProps) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { isDark } = useTheme()

  const [isLinking, setIsLinking] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'signing' | 'linking' | 'success' | 'error'>('idle')

  const handleLinkWallet = useCallback(async () => {
    console.log('[WalletConnector] handleLinkWallet called:', { address, chain })
    if (!address || !chain) {
      console.error('[WalletConnector] Missing address or chain')
      toast.error("No wallet connected")
      return
    }

    try {
      setIsLinking(true)
      setLinkStatus('signing')

      // Sign a message to verify wallet ownership
      const message = `Link wallet to Cronos402\nAddress: ${address}\nTimestamp: ${Date.now()}`
      console.log('[WalletConnector] Requesting signature for:', message)
      const signature = await signMessageAsync({ message })
      console.log('[WalletConnector] Signature received:', signature)

      setLinkStatus('linking')

      // Save to backend
      console.log('[WalletConnector] Calling authApi.linkWallet...')
      const result = await authApi.linkWallet({
        walletAddress: address,
        provider: 'metamask', // This will be detected by the connector type
        blockchain: chain.name,
        chainId: chain.id,
        signature,
        message,
      })
      console.log('[WalletConnector] Link result:', result)

      setLinkStatus('success')
      toast.success("Wallet linked successfully!")

      // Notify parent to reload wallets
      onWalletLinked?.()

      // Reset after a delay
      setTimeout(() => {
        setLinkStatus('idle')
        disconnect()
      }, 2000)
    } catch (error) {
      console.error("[WalletConnector] Failed to link wallet:", error)
      console.error("[WalletConnector] Error details:", JSON.stringify(error, null, 2))
      setLinkStatus('error')

      const errorMessage = error instanceof Error ? error.message : "Failed to link wallet"
      console.error("[WalletConnector] Error message:", errorMessage)
      toast.error(errorMessage)

      // Reset after showing error
      setTimeout(() => {
        setLinkStatus('idle')
      }, 3000)
    } finally {
      setIsLinking(false)
    }
  }, [address, chain, signMessageAsync, onWalletLinked, disconnect])

  // Auto-link wallet when connected (wait for chain data to be available)
  useEffect(() => {
    console.log('[WalletConnector] useEffect triggered:', { isConnected, address, chain: chain?.name, linkStatus })
    if (isConnected && address && chain && linkStatus === 'idle') {
      console.log('[WalletConnector] Triggering auto-link with chain:', chain.name)
      handleLinkWallet()
    }
  }, [isConnected, address, chain, linkStatus, handleLinkWallet])

  if (isConnected && address) {
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
              {chain && (
                <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  {chain.name}
                </div>
              )}
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
          </div>

          {linkStatus === 'idle' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleLinkWallet}
                disabled={isLinking}
                className="flex-1"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Link Wallet
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnect()}
              >
                Cancel
              </Button>
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

        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={isConnecting}
              className="w-full"
              variant="outline"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  {connector.name}
                </>
              )}
            </Button>
          ))}
        </div>

        <div className={`text-[10px] text-center ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          Supports MetaMask, Crypto.com Wallet, and WalletConnect
        </div>
      </div>
    </div>
  )
}
