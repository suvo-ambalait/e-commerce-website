import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LuWrench } from 'react-icons/lu'
import { Container, Section } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'

const questions = ['Is the product what the photos show?', 'Is the quality good?', 'Does the shop deliver on time?']

/** Dark feature panel — fixed colours so it reads as a dark block in both themes. */
export function EditorialPromo() {
  return (
    // top padding only — the Newsletter section below brings its own
    <Section className="pb-0 md:pb-0">
      <Container>
        <motion.div
          variants={fadeUp}
          {...revealOnScroll}
          className="relative grid grid-cols-1 gap-3 overflow-hidden rounded-3xl bg-[#0b0a10] p-3 text-white ring-1 ring-transparent dark:ring-white/10 lg:grid-cols-2"
        >
          {/* decorative rings — `!` beats the global `* { border-color }` rule in index.css */}
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full border border-white/7!" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-white/7!" />

          {/* copy */}
          <div className="relative flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
              Our promise
            </p>
            {/* `!` beats the global unlayered h2 font rule in index.css */}
            <h2 className="mt-4 font-display! text-[clamp(2rem,1.3rem+2.8vw,3.25rem)] font-extrabold! leading-[1.02] tracking-[-0.04em]! text-white">
              Every shop is checked
              <br />
              <em className="font-medium text-[#c4b5fd]">before it can sell</em>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#b8b3c7]">
              Before a shop can sell on AmbalaEshop, our team checks these three things. You can also read
              real customer reviews on every shop’s page.
            </p>

            <ol className="mt-6 max-w-md divide-y divide-white/10! border-y border-white/10!">
              {questions.map((q, i) => (
                <li key={q} className="flex items-center gap-4 py-3 text-sm font-semibold">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-[#c4b5fd] tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {q}
                </li>
              ))}
            </ol>

            <Link
              to="/about"
              className="group mt-8 inline-flex h-12 items-center gap-3 self-start rounded-full bg-[#6d28d9] pl-6 pr-2 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(109,40,217,0.45)] transition-colors hover:bg-[#7c3aed]"
            >
              Learn more about us
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          {/* image */}
          <div className="relative min-h-72 overflow-hidden rounded-2xl lg:min-h-120">
            <img
              src={imageFor('Studio', 'promo-workshop', { w: 1200, h: 1200 })}
              alt="A seller’s shop with furniture on display"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex max-w-xs items-center gap-3 rounded-2xl bg-white p-3 text-[#0b0a10] shadow-[0_18px_40px_rgba(11,10,16,0.35)] sm:bottom-5 sm:left-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede9fe] text-[#6d28d9]">
                <LuWrench className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Real reviews on every shop</span>
                <span className="block text-caption text-[#57526a]">From customers who bought there</span>
              </span>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}
