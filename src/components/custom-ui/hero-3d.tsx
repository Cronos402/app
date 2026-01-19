"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import HighlighterText from "./highlighter-text"
import Logo3D from "./logo-3d"
import { ArrowUpRight } from "lucide-react"
import {
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react"
import { easeOut } from "motion"

const SUPPORTED_BY_LOGOS = [
  {
    name: "cronos",
    href: "https://cronos.org",
    srcLight: "/logos/cronos light bg.png",  // Dark logo for light mode
    srcDark: "/logos/cronos dark bg.png",    // White logo for dark mode
    invertInLightMode: false,
  },
  {
    name: "crypto-com",
    href: "https://crypto.com",
    srcLight: "/logos/crypto-com-logo.png",  // White logo - needs invert in light mode
    srcDark: "/logos/crypto-com-logo.png",
    invertInLightMode: true,  // Invert white logo to black in light mode
  },
] as const

// Helper functions for logo sizing - bigger sizes for 2 logos
const getLogoSize = (name: string) => {
  switch (name) {
    case "cronos":
      return { className: "h-10 w-[180px]", width: 180, height: 40 }
    case "crypto-com":
      return { className: "h-8 w-[150px]", width: 150, height: 32 }
    default:
      return { className: "h-12 w-[160px]", width: 160, height: 64 }
  }
}

const getMaskStyle = (src: string): React.CSSProperties => ({
  maskImage: `url(${src})`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
})

const renderLogo = (logo: typeof SUPPORTED_BY_LOGOS[number], index?: number) => {
  const logoSize = getLogoSize(logo.name)

  return (
    <Link
      key={`${logo.name}-${index ?? ''}`}
      href={logo.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0"
    >
      <div
        className="h-14 px-6 flex items-center justify-center rounded-md transition-all duration-300 min-w-[200px] relative overflow-hidden bg-muted/50 group-hover:bg-muted"
      >
        <span className="relative inline-flex items-center transition-transform duration-300 ease-out group-hover:-translate-x-1">
          {/* Light mode logo (shown in light mode) */}
          <Image
            src={logo.srcLight}
            alt={`${logo.name} logo`}
            width={logoSize.width}
            height={logoSize.height}
            className={cn(
              "transition-all duration-300 opacity-80 group-hover:opacity-100 dark:hidden object-contain",
              logoSize.className,
              logo.invertInLightMode && "invert"  // Invert white logos to black in light mode
            )}
          />
          {/* Dark mode logo (shown in dark mode) */}
          <Image
            src={logo.srcDark}
            alt={`${logo.name} logo`}
            width={logoSize.width}
            height={logoSize.height}
            className={cn(
              "transition-all duration-300 opacity-80 group-hover:opacity-100 hidden dark:block object-contain",
              logoSize.className
            )}
          />
          <ArrowUpRight
            className="absolute left-full ml-2 h-4 w-4 shrink-0 opacity-0 -translate-x-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 text-foreground"
          />
        </span>
      </div>
    </Link>
  )
}

export function SupportedBySection() {
  const prefersReduced = useReducedMotion()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const fadeUp: Variants = React.useMemo(
    () => ({
      hidden: { opacity: 0, y: prefersReduced ? 0 : 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: prefersReduced ? 0 : 0.4, ease: easeOut },
      },
    }),
    [prefersReduced]
  )

  return (
    <motion.section
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16"
      initial="hidden"
      animate={isMounted ? "visible" : "hidden"}
      variants={fadeUp}
    >
      <div className="flex flex-col items-center space-y-6 w-full">
        <HighlighterText>BACKED BY</HighlighterText>

        {/* Centered layout for 2 logos - bigger and more prominent */}
        <div className="flex flex-wrap justify-center gap-4 w-full">
          {SUPPORTED_BY_LOGOS.map((logo) => renderLogo(logo))}
        </div>
      </div>
    </motion.section>
  )
}

export default function Hero3D({
  className,
}: {
  className?: string
}) {
  const prefersReduced = useReducedMotion()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const fadeUp: Variants = React.useMemo(
    () => ({
      hidden: { opacity: 0, y: prefersReduced ? 0 : 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: prefersReduced ? 0 : 0.4, ease: easeOut },
      },
    }),
    [prefersReduced]
  )

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24",
        className
      )}
    >
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 lg:items-stretch lg:min-h-[600px]">
        {/* Mobile Layout */}
        {/* Heading and Subheading - Mobile */}
        <motion.div
          className="flex flex-col gap-1 order-1 lg:hidden"
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          variants={fadeUp}
        >
          <h1 className="text-3xl sm:text-3xl lg:text-4xl font-semibold font-host text-foreground leading-tight">
            The best way for AI to access and pay for online services
          </h1>
          <p className="text-sm sm:text-lg text-foreground/80 leading-relaxed max-w-lg">
            Single connection to use paid MCP tools across any client. Pay-per-use instead of expensive subscriptions.
          </p>
        </motion.div>

        {/* 3D Container - Mobile */}
        <div className="order-2 lg:hidden">
          <Logo3D className="h-[300px] min-h-0" delay={prefersReduced ? 0 : 0.4} duration={prefersReduced ? 0 : 1.2} />
        </div>

        {/* CTAs - Mobile */}
        <motion.div
          className="flex flex-col gap-4 pt-2 order-3 lg:hidden -mx-4 px-4"
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          variants={fadeUp}
        >
          <Link href="/servers" className="w-full">
            <Button variant="customTallPrimary" size="tall" animated className="w-full px-3 lg:px-6">
              BROWSE SERVERS
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="customTallSecondary" size="tall" animated className="w-full px-3 lg:px-6">
              MONETIZE SERVERS
            </Button>
          </Link>
        </motion.div>

        {/* Stats - Mobile (moved to bottom) */}
        <motion.div
          className="flex flex-wrap gap-3 order-4 lg:hidden text-muted-foreground font-mono text-sm tracking-wider uppercase"
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          variants={fadeUp}
        >
          <span>TRANSACTIONS: <span className="!text-foreground font-medium">+100,000</span></span>
          <span>VOLUME: <span className="!text-foreground font-medium">+$30,000</span></span>
        </motion.div>

        {/* Desktop Layout - Left Column */}
        <div className="hidden lg:flex lg:flex-col lg:justify-between lg:gap-24 lg:order-1 lg:col-span-1 lg:h-full">
          {/* Main Content - Top Aligned */}
          <motion.div
            className="flex flex-col space-y-3 max-w-lg"
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            variants={fadeUp}
          >
            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-host text-foreground leading-tight">
              The best way for AI to access and pay for online services
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              Single connection to use paid MCP tools across any client.<br />
              Pay-per-use instead of expensive subscriptions.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-6">
              <Link href="/servers" className="flex-1 lg:flex-none">
                <Button variant="customTallPrimary" size="tall" animated className="w-full min-w-[220px]">
                  BROWSE SERVERS
                </Button>
              </Link>
              <Link href="/register" className="flex-1 lg:flex-none">
                <Button variant="customTallSecondary" size="tall" animated className="w-full min-w-[220px]">
                  MONETIZE SERVERS
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats - Bottom Aligned */}
          <motion.div
            className="flex flex-wrap gap-3 text-muted-foreground font-mono text-sm tracking-wider uppercase"
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            variants={fadeUp}
          >
            <span>TRANSACTIONS: <span className="text-foreground font-medium">+100,000</span></span>
            <span>VOLUME: <span className="text-foreground font-medium">+$30,000</span></span>
          </motion.div>
        </div>

        {/* Desktop Layout - Right Column - 3D Container */}
        <div className="hidden lg:block lg:order-2 lg:col-span-1 lg:h-full">
          <Logo3D className="h-full" delay={prefersReduced ? 0 : 0.4} duration={prefersReduced ? 0 : 1.2} />
        </div>
      </div>
    </section>
  )
}

