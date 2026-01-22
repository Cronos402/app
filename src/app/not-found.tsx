"use client"

import Footer from "@/components/custom-ui/footer"
import { useTheme } from "@/components/providers/theme-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const { isDark } = useTheme()

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1
              className={`text-[12rem] sm:text-[16rem] font-extrabold leading-none select-none ${
                isDark
                  ? "text-gray-800"
                  : "text-gray-100"
              }`}
            >
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-6xl sm:text-7xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Oops!
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className={`text-2xl sm:text-3xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Page not found
          </h2>
          <p className={`text-lg mb-8 max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/servers">
                <Search className="h-4 w-4" />
                Browse Servers
              </Link>
            </Button>
          </div>

          {/* Go Back Link */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className={`inline-flex items-center gap-2 text-sm hover:underline ${
                isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to previous page
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
