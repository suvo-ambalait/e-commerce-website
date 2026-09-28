import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { ArrowRightIcon } from '@/shared/ui/icons'

/**
 * "Apply to sell" dark panel — fixed colours so it reads as a dark block in both
 * themes; ring borders carry `!` to beat the global `* { border-color }` rule.
 */
export function SellCta() {
  return (
    <motion.div
      variants={fadeUp}
      {...revealOnScroll}
      className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-[#0b0a10] px-7 py-10 text-white ring-1 ring-transparent dark:ring-white/10 sm:px-10 md:flex-row md:items-center"
    >
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/10!" />
      <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10!" />

      <div className="relative">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
          For sellers
        </p>
        {/* `!` beats the global unlayered h2 font rule in index.css */}
        <h2 className="mt-3 font-display! text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-extrabold! leading-[1.05] tracking-[-0.035em]! text-white">
          Want to sell <em className="font-medium text-[#c4b5fd]">online?</em>
        </h2>
        <p className="mt-2 text-sm text-[#b8b3c7]">Open your shop on AmbalaEshop. Apply today and we will reply within 7 days.</p>
      </div>

      <Link
        to="/vendor/signup"
        className="group relative inline-flex h-12 shrink-0 items-center gap-3 rounded-full bg-[#6d28d9] pl-6 pr-2 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(109,40,217,0.45)] transition-colors hover:bg-[#7c3aed]"
      >
        Apply to sell
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  )
}
