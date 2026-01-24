"use client"

import React from "react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

const faqData: FAQItem[] = [
  {
    question: "What is Cronos402 and who is it for?",
    answer: (
      <>
        Cronos402 is the first MCP payment gateway for the Cronos blockchain. We enable AI agents to make payments using USDC.e (gasless) or native CRO:
        <div className="mt-3 space-y-2">
          <div><strong>A) People who want to use paid MCP tools:</strong> Sign up, find a server and start using paid tools across clients like ChatGPT. Payments powered by Cronos blockchain.</div>
          <div><strong>B) Developers who want to monetize MCP Servers or APIs:</strong> Use our open-source SDK or no-code UI to monetize your tools. Get paid in USDC.e or CRO on Cronos.</div>
        </div>
      </>
    )
  },
  {
    question: "Why would I want to consume paid MCPs?",
    answer: (
      <>
        Instead of paying for expensive B2B/Enterprise subscriptions you can consume only the tools calls you want and pay cents per use.
      </>
    )
  },
  {
    question: "How do I consume paid MCPs?",
    answer: (
      <>
        Sign in, add funds to your account, and <Link href="/servers" className="text-[#00B8E6] dark:text-[#00D4FF] hover:underline hover:decoration-dotted hover:underline-offset-2 transition-all duration-300">browse</Link> available MCP servers. You can run tools directly inside Cronos402 or connect them to clients like ChatGPT, where they&apos;ll execute automatically when needed.
      </>
    )
  },
  {
    question: "How much do I pay?",
    answer: (
      <>
        Each MCP tool sets its own price, typically a few cents (e.g., $0.05). We do not charge any fees on top of that.
      </>
    )
  },
  {
    question: "Why would I want to monetize MCPs?",
    answer: (
      <>
        If you manage an API that normally requires subscriptions or API keys, converting it to an MCP server gives you exposure to a growing new audience: individual developers, LLMs, agents, and MCP-compatible clients.
      </>
    )
  },
  {
    question: "How do I monetize my API or MCP Server?",
    answer: (
      <>
        Use our open-source SDK to add payments in a few lines of code.
        <br /><br />
        Or, if you prefer no-code, you can configure pricing directly through our UI.
      </>
    )
  },
  {
    question: "What payment methods are supported?",
    answer: (
      <>
        Cronos402 supports two payment methods on the Cronos blockchain:
        <div className="mt-3 space-y-2">
          <div><strong>USDC.e (Gasless):</strong> Pay with stablecoin using the Cronos Facilitator - no gas fees required!</div>
          <div><strong>Native CRO:</strong> Pay directly with CRO tokens from your wallet.</div>
        </div>
      </>
    )
  },
  {
    question: "Does this project have a token?",
    answer: (
      <>
        There is no official $CRONOS402 token, be careful with impersonators. Trust only official announcements on <Link href="https://x.com/cronos402_dev" target="_blank" rel="noopener noreferrer" className="text-[#00B8E6] dark:text-[#00D4FF] hover:underline hover:decoration-dotted hover:underline-offset-2 transition-all duration-300">X</Link>.
      </>
    )
  }
]

export default function FAQSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Left side - Title */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-host text-foreground leading-tight">
            Frequently Asked<br />
            Questions
          </h2>
        </div>

        {/* Right side - FAQ Items */}
        <div>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className={cn(
                  "border border-transparent rounded-[2px] bg-card mb-4 last:mb-0",
                  "hover:shadow-lg",
                  "transition-all duration-300 cursor-pointer"
                )}
              >
                <AccordionTrigger className={cn(
                  "text-left hover:no-underline group cursor-pointer px-4",
                  "data-[state=closed]:py-3 data-[state=open]:py-4",
                  "[&[data-state=open]_span]:text-foreground"
                )}>
                  <span className="text-sm sm:text-[15px] leading-relaxed font-mono font-normal uppercase text-muted-foreground group-hover:text-foreground group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-2 transition-all duration-300">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm sm:text-[15px] leading-relaxed text-foreground px-4 pb-4">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
