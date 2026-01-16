"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { easeOut } from "motion"
import { useTheme } from "@/components/providers/theme-context"

// Creative 3D logo display with parallax depth effect
// Shows full "CRONOS 402" brand with floating elements

export default function Logo3D({
  className,
  delay = 0,
  duration = 1.2
}: {
  className?: string
  delay?: number
  duration?: number
}) {
  const { isDark } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring physics
  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Transform mouse position to rotation
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8])

  // Parallax depth for different layers
  const layer1X = useTransform(x, [-0.5, 0.5], [-15, 15])
  const layer1Y = useTransform(y, [-0.5, 0.5], [-10, 10])
  const layer2X = useTransform(x, [-0.5, 0.5], [-8, 8])
  const layer2Y = useTransform(y, [-0.5, 0.5], [-5, 5])
  const layer3X = useTransform(x, [-0.5, 0.5], [-4, 4])
  const layer3Y = useTransform(y, [-0.5, 0.5], [-2, 2])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set((e.clientX - centerX) / rect.width)
      mouseY.set((e.clientY - centerY) / rect.height)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  // Brand colors
  const navy = "#002D74"
  const cyan = "#00D4FF"
  const lightText = "#e8eef5"
  const darkBg = "rgba(0, 20, 50, 0.3)"
  const lightBg = "rgba(0, 45, 116, 0.05)"

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full rounded-lg overflow-hidden relative", className)}
      style={{ perspective: "1000px" }}
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at 30% 30%, ${darkBg}, transparent 70%)`
            : `radial-gradient(ellipse at 30% 30%, ${lightBg}, transparent 70%)`
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut, delay }}
      />

      {/* 3D Container */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration, delay: delay + 0.2, ease: easeOut }}
      >
        {/* Layer 3 (Back): Subtle grid pattern */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            x: layer3X,
            y: layer3Y,
            transform: "translateZ(-60px)"
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={isDark ? lightText : navy} strokeWidth="0.3" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </motion.div>

        {/* Layer 2 (Middle): Cronos Symbol */}
        <motion.div
          className="absolute"
          style={{
            x: layer2X,
            y: layer2Y,
            transform: "translateZ(-20px)"
          }}
        >
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 40 40"
            animate={{
              y: [0, -5, 0],
              rotate: [0, 1, 0, -1, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Hexagon with C shape */}
            <path
              d="M20 2L36.5 11V29L20 38L3.5 29V11L20 2ZM31 25.5V14.5L20 9L9 14.5V25.5L20 31L31 25.5Z"
              fill={isDark ? lightText : navy}
              opacity={0.15}
            />
            <path
              d="M26.5 23.5L20 27L13.5 23.5V16.5L20 13L26.5 16.5L22.5 18.8L20 17.4L16.5 19.4V20.6L20 22.6L22.5 21.2L26.5 23.5Z"
              fill={isDark ? lightText : navy}
              opacity={0.15}
            />
          </motion.svg>
        </motion.div>

        {/* Layer 1 (Front): Main Logo - CRONOS 402 */}
        <motion.div
          className="relative flex items-center gap-6"
          style={{
            x: layer1X,
            y: layer1Y,
            transform: "translateZ(30px)"
          }}
        >
          {/* Symbol */}
          <motion.svg
            width="120"
            height="120"
            viewBox="0 0 40 40"
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ filter: isDark ? "drop-shadow(0 4px 20px rgba(0, 212, 255, 0.3))" : "drop-shadow(0 4px 15px rgba(0, 45, 116, 0.2))" }}
          >
            <path
              d="M20 2L36.5 11V29L20 38L3.5 29V11L20 2ZM31 25.5V14.5L20 9L9 14.5V25.5L20 31L31 25.5Z"
              fill={isDark ? lightText : navy}
            />
            <path
              d="M26.5 23.5L20 27L13.5 23.5V16.5L20 13L26.5 16.5L22.5 18.8L20 17.4L16.5 19.4V20.6L20 22.6L22.5 21.2L26.5 23.5Z"
              fill={isDark ? lightText : navy}
            />
            <path
              d="M28 16.5L32 20L28 23.5"
              stroke={cyan}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>

          {/* Wordmark */}
          <div className="flex flex-col">
            {/* CRONOS with shimmer animation */}
            <div className="relative overflow-hidden">
              <motion.span
                className="text-6xl font-bold tracking-wider block"
                style={{
                  color: isDark ? lightText : navy,
                  textShadow: isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "none"
                }}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              >
                CRONOS
              </motion.span>

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,45,116,0.2)'} 50%, transparent 100%)`,
                  width: "50%"
                }}
                animate={{
                  x: ["-100%", "300%"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2
                }}
              />
            </div>

            {/* Glitch 402 */}
            <div className="relative">
              {/* Base text */}
              <motion.span
                className="text-6xl font-bold tracking-wider relative"
                style={{
                  color: cyan,
                  textShadow: isDark ? `0 2px 15px ${cyan}40` : `0 2px 10px ${cyan}30`
                }}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              >
                402
              </motion.span>

              {/* Glitch layer 1 - red shift */}
              <motion.span
                className="text-6xl font-bold tracking-wider absolute left-0 top-0"
                style={{
                  color: "#ff0040",
                  opacity: 0.8,
                  mixBlendMode: "screen"
                }}
                animate={{
                  x: [0, -3, 0, 2, 0, -1, 0],
                  opacity: [0, 0.8, 0, 0.6, 0, 0.7, 0],
                  scaleX: [1, 1.02, 1, 0.98, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.1, 0.2, 0.5, 0.6, 0.8, 1]
                }}
              >
                402
              </motion.span>

              {/* Glitch layer 2 - blue shift */}
              <motion.span
                className="text-6xl font-bold tracking-wider absolute left-0 top-0"
                style={{
                  color: "#00ffff",
                  opacity: 0.8,
                  mixBlendMode: "screen"
                }}
                animate={{
                  x: [0, 2, 0, -3, 0, 1, 0],
                  opacity: [0, 0.6, 0, 0.8, 0, 0.5, 0],
                  scaleX: [1, 0.98, 1, 1.02, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.15, 0.25, 0.55, 0.65, 0.85, 1],
                  delay: 0.1
                }}
              >
                402
              </motion.span>

              {/* Glitch scanline */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, transparent, ${cyan}, transparent)`,
                }}
                animate={{
                  top: ["0%", "100%", "0%"],
                  opacity: [0, 1, 0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Floating accent particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: cyan,
              left: `${10 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              opacity: 0.5,
              filter: "blur(1px)"
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}
