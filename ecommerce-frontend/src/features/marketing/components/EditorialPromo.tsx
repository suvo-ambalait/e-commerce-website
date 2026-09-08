import { motion } from 'motion/react'
import { ButtonLink, Container } from '@/shared/ui'
import { fadeUp, revealOnScroll } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'

export function EditorialPromo() {
  return (
    <Container>
      <motion.div
        variants={fadeUp}
        {...revealOnScroll}
        className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-2"
      >
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <p className="text-caption font-medium uppercase tracking-[0.16em] text-accent">The MorerDokan letter</p>
          <h2 className="mt-4 text-3xl text-ink text-balance">
            Made to be repaired, not replaced
          </h2>
          <p className="mt-4 max-w-md text-sm text-ink-soft">
            We ask every studio the same questions before they join: where the material comes from,
            who assembles it, and what happens when a part wears out. The answers live on each maker’s
            page — read them before you buy.
          </p>
          <div className="mt-7">
            <ButtonLink to="/about" variant="secondary">
              Read our standards
            </ButtonLink>
          </div>
        </div>
        <div className="min-h-64 lg:min-h-[28rem]">
          <img
            src={imageFor('Studio', 'promo-workshop', { w: 1200, h: 1200 })}
            alt="A maker at a workbench"
            className="h-full w-full object-cover"
          />
        </div>
      </motion.div>
    </Container>
  )
}
