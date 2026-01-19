"use client"

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

/**
 * Clean wallet connection button using RainbowKit's built-in modals.
 * - Single "Connect Wallet" button that opens a nice modal
 * - Clickable network name to switch chains (triggers wallet prompt)
 * - Clickable address for account info/disconnect
 */
export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected = ready && account && chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Not connected - show connect button
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                  >
                    Connect Wallet
                  </Button>
                )
              }

              // Connected but wrong network - show switch button
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs px-3"
                  >
                    Switch Network
                  </Button>
                )
              }

              // Connected and on correct network - show compact info
              return (
                <div className="flex items-center gap-1.5">
                  {/* Network badge - click to switch */}
                  <Button
                    onClick={openChainModal}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 font-normal"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <div
                        className="w-3 h-3 rounded-full overflow-hidden mr-1.5"
                        style={{ background: chain.iconBackground }}
                      >
                        <img
                          alt={chain.name ?? 'Chain'}
                          src={chain.iconUrl}
                          className="w-3 h-3"
                        />
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  {/* Address badge - click for account modal */}
                  <Button
                    onClick={openAccountModal}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 font-mono"
                  >
                    {account.displayName}
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
