"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useTheme } from "@/components/providers/theme-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TokenIcon } from "@/components/custom-ui/token-icon"
import { getExplorerUrl } from "@/lib/client/blockscout"
import { mcpDataApi } from "@/lib/client/utils"
import { isNetworkSupported, type UnifiedNetwork } from "@/lib/commons"
import { ArrowUpRight, CheckCircle2, Clock, Pause, Play, RefreshCcw } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type RecentPayment = {
  id: string
  createdAt: string
  status: "completed" | "failed"
  network?: string
  transactionHash?: string
  amount?: string // Raw atomic units
  amountFormatted?: string // Pre-formatted amount (legacy)
  currency?: string
  toolName?: string // The MCP tool that was called
}

type RecentPaymentsCardProps = {
  serverId: string
  initialPayments?: RecentPayment[]
  className?: string
  renderHeader?: (lastRefreshTime: Date | null, autoRefreshEnabled: boolean, paymentsCount: number, onToggleAutoRefresh: () => void, onRefresh: () => Promise<void>) => React.ReactNode
}

const ITEMS_PER_PAGE = 10

const formatDate = (dateString?: string) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleString()
}

function formatRelativeShort(iso?: string, now = Date.now()) {
  if (!iso) return ""
  const diffMs = new Date(iso).getTime() - now
  const abs = Math.abs(diffMs)
  const sec = Math.round(abs / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(day / 365)

  const value =
    sec < 60 ? { n: Math.max(1, sec), u: "secs" } :
      min < 60 ? { n: min, u: "mins" } :
        hr < 24 ? { n: hr, u: "hrs" } :
          day < 30 ? { n: day, u: "days" } :
            month < 12 ? { n: month, u: "mos" } :
              { n: year, u: "yrs" }

  return `${value.n} ${value.u} ${diffMs <= 0 ? "ago" : "from now"}`
}

function safeTxUrl(network?: string, hash?: string) {
  if (!network || !hash) return undefined
  if (isNetworkSupported(network)) {
    return getExplorerUrl(hash, network as UnifiedNetwork, "tx")
  }
  return `https://etherscan.io/tx/${hash}`
}

// Format atomic amount to human readable (USDC has 6 decimals)
function formatAmount(amount?: string, currency?: string): string {
  if (!amount) return '—'
  try {
    const decimals = currency === 'CRO' ? 18 : 6 // USDC/USDC.e = 6, CRO = 18
    const value = BigInt(amount)
    const divisor = BigInt(10 ** decimals)
    const whole = value / divisor
    const fraction = value % divisor
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '')
    if (fractionStr) {
      return `${whole}.${fractionStr}`
    }
    return whole.toString()
  } catch {
    return amount
  }
}

export function RecentPaymentsCard({ serverId, initialPayments, className, renderHeader }: RecentPaymentsCardProps) {
  const { isDark } = useTheme()
  const [payments, setPayments] = useState<RecentPayment[]>(initialPayments || [])
  const [loading, setLoading] = useState<boolean>(!initialPayments || initialPayments.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const hasVisibleSkeleton = loading && payments.length === 0

  const totalPages = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedPayments = payments.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset to page 1 when payments change
  useEffect(() => {
    setCurrentPage(1)
  }, [payments.length])

  const fetchPayments = useMemo(() => {
    return async () => {
      try {
        if (payments.length === 0) setLoading(true)
        setError(null)
        const res = await mcpDataApi.getServerById(serverId)
        const next = (res as { recentPayments?: RecentPayment[] }).recentPayments || []
        setPayments(next)
        setLastRefreshTime(new Date())
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load payments")
      } finally {
        setLoading(false)
      }
    }
  }, [serverId, payments.length])

  useEffect(() => {
    let alive = true
    ;(async () => {
      await fetchPayments()
    })()
    return () => { alive = false }
  }, [fetchPayments])

  useEffect(() => {
    if (!autoRefreshEnabled || !serverId) return
    const interval = setInterval(async () => {
      try {
        await fetchPayments()
      } catch (e) {
        // ignore periodic errors
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [autoRefreshEnabled, serverId, fetchPayments])

  const handleToggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
  }

  const handleRefresh = async () => {
    try {
      await fetchPayments()
      toast.success("Data refreshed")
    } catch (e) {
      toast.error("Failed to refresh data")
    }
  }

  return (
    <>
      {renderHeader && renderHeader(lastRefreshTime, autoRefreshEnabled, payments.length, handleToggleAutoRefresh, handleRefresh)}
      <div className={`bg-card rounded-[2px] p-4 ${className || ""}`}>
        {hasVisibleSkeleton ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-0">
                    <TableHead className="w-[50px] pl-6 pr-2">Status</TableHead>
                    <TableHead className="px-4 sm:px-6 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left whitespace-nowrap bg-muted/30">Date</TableHead>
                    <TableHead className="px-4 sm:px-6 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left whitespace-nowrap bg-muted/30">Amount</TableHead>
                    <TableHead className="px-4 sm:px-6 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground text-left whitespace-nowrap bg-muted/30">Network</TableHead>
                    <TableHead className="px-4 sm:px-6 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right whitespace-nowrap bg-muted/30 pr-6">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-muted/30 transition-all duration-200">
                      <TableCell className="px-4 sm:px-6 py-4 border-b border-border/50 align-middle">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 border-b border-border/50 align-middle">
                        <div className="space-y-2">
                          <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                          <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 border-b border-border/50 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-muted animate-pulse"></div>
                          <div className="space-y-1">
                            <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                            <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 border-b border-border/50 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted animate-pulse"></div>
                          <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 sm:px-6 py-4 border-b border-border/50 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                          <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                {paginatedPayments.length > 0 && (
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="w-[40px] pr-1 sr-only">Status</TableHead>
                      <TableHead className="px-1 sm:px-2 py-3 text-[12px] uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap font-mono">Method</TableHead>
                      <TableHead className="px-1 sm:px-2 py-3 text-[12px] uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap font-mono">Amount</TableHead>
                      <TableHead className="px-1 sm:px-2 py-3 text-[12px] uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap font-mono">Network</TableHead>
                      <TableHead className="px-1 sm:px-2 py-3 text-[12px] uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap font-mono">Date</TableHead>
                      <TableHead className="px-1 sm:px-2 py-3 text-[12px] uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap font-mono text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                )}
                <TableBody>
                  {paginatedPayments.map((p) => {
                    const txUrl = safeTxUrl(p.network, p.transactionHash)
                    const fullDate = formatDate(p.createdAt)
                    const rel = formatRelativeShort(p.createdAt)
                    const td = "px-1 sm:px-2 py-3.5 border-t border-border align-middle"
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell className={`${td} w-[40px] pr-1`}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 dark:text-teal-200 dark:bg-teal-800/50 dark:hover:bg-teal-800/70 transition-all duration-300"
                                  aria-label={p.status}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{p.status === 'completed' ? 'Success' : p.status === 'failed' ? 'Failed' : 'Pending'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className={td}>
                          <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-foreground">{p.toolName || 'tool_call'}</span>
                        </TableCell>
                        <TableCell className={`${td} font-mono`}>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            {p.currency && <TokenIcon currencyOrAddress={p.currency} network={p.network} size={16} />}
                            <span className="text-foreground">{p.amountFormatted || formatAmount(p.amount, p.currency)}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`${td} font-mono text-xs sm:text-sm text-muted-foreground`}>
                          <span className="font-mono text-sm border border-foreground-muted px-2 py-0.5 rounded text-foreground-muted">
                            {p.network || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className={`${td} text-[0.95rem] sm:text-sm text-muted-foreground pr-1`}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-default">{rel}</TooltipTrigger>
                              <TooltipContent>{fullDate}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className={`${td} text-right`}>
                          <div className="flex items-center justify-end gap-2">
                            {p.transactionHash ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild size="icon" variant="ghost" className="group h-7 w-7 rounded-sm">
                                      <a href={txUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                        <ArrowUpRight className="size-5 stroke-[2] text-muted-foreground/80 group-hover:text-foreground transition-all duration-300" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Transaction</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {paginatedPayments.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-12 text-center">
                        <div className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          <p className="text-sm">No recent payments</p>
                          <p className="text-xs mt-1">Payments will appear here once tools are used with monetization enabled</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      
      {payments.length > ITEMS_PER_PAGE && (
        <div className="pt-4 border-t border-border">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={goPrev}
                  aria-disabled={currentPage === 1 || loading}
                  className={cn(
                    currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer",
                    "[&_span]:uppercase"
                  )}
                />
              </PaginationItem>

              {totalPages > 1 && (
                <>
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {Array.from({ length: 3 })
                    .map((_, i) => currentPage - 1 + i)
                    .filter(p => p >= 1 && p <= totalPages)
                    .map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink 
                          onClick={() => goToPage(p)} 
                          isActive={p === currentPage}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={goNext}
                  aria-disabled={currentPage === totalPages || loading}
                  className={cn(
                    currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer",
                    "[&_span]:uppercase"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      </div>
    </>
  )
}
