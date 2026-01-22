"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import MinimalExplorer from "./minimal-explorer"

interface StatsProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
}

export default function Stats({
  className,
  ...props
}: StatsProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-medium font-host text-muted-foreground leading-tight">
            Latest Transactions
          </h2>
        </div>

        {/* Minimal Explorer Card */}
        <div className="rounded-[2px] bg-card py-2">
          <MinimalExplorer />
        </div>

        {/* Explorer CTA */}
        <div className="flex justify-center">
          <Link href="/explorer" className="w-full lg:w-auto">
            <Button variant="customTallPrimary" size="tall" className="w-full lg:min-w-[220px]">
              EXPLORER
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

