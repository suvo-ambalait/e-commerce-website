import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ButtonLink, Container } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { easeEditorial } from '@/shared/lib/motion'
import { imageFor } from '@/shared/lib/image'

const line = {
  hidden: { opacity: 0, y: '0.6em' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeEditorial, delay: 0.1 + i * 0.09 },
  }),
}

export function Hero() {
  return (
    <section className="relative overflow-x-clip">
      <Container className="pb-14 pt-9 md:pb-20 md:pt-14">
        {/* micro rule */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4 text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute">
          <span>Est. 2021</span>
          <span className="hidden sm:block">Independent studios · One checkout</span>
          <span>Ships worldwide</span>
        </div>

        <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-12 lg:gap-6 lg:pt-14">
          {/* headline */}
          <div className="lg:col-span-7 lg:pt-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-caption font-medium uppercase tracking-[0.18em] text-accent"
            >
              A marketplace of makers
            </motion.p>

            <h1 className="mt-5 font-serif text-display leading-[1.02] tracking-tight text-ink">
              {['Considered design,', 'from the people', 'who make it.'].map((text, i) => (
                <motion.span
                  key={text}
                  custom={i}
                  variants={line}
                  initial="hidden"
                  animate="visible"
                  className={i === 1 ? 'block font-light italic text-accent' : 'block'}
                >
                  {text}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeEditorial, delay: 0.5 }}
              className="mt-7 max-w-md text-base leading-relaxed text-ink-soft"
            >
              Lighting, tableware, furniture and textiles from workshops in seven countries — one
              catalogue, one cart, one checkout.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeEditorial, delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3"
            >
              <ButtonLink to="/shop" size="lg">
                Shop the collection
              </ButtonLink>
              <Link
                to="/vendors"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline"
              >
                Meet the makers
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* image cluster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: easeEditorial, delay: 0.15 }}
            className="relative lg:col-span-5 lg:-mt-2"
          >
            {/* framed backdrop */}
            <div className="absolute -right-3 -top-3 hidden h-full w-full rounded-lg border border-border sm:block" />

            <img
              src={imageFor('Lighting', 'hero-a', { w: 960, h: 1180 })}
              alt="A lit table lamp beside a timber sideboard"
              className="relative aspect-4/5 w-full rounded-lg object-cover shadow-md"
            />

            <motion.img
              src={imageFor('Tableware', 'hero-b', { w: 640, h: 640 })}
              alt="Stacked hand-thrown ceramic plates"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-7 -left-6 hidden aspect-square w-36 rounded-lg border-[6px] border-bg object-cover shadow-lg sm:block lg:-left-10 lg:w-44"
            />

            <span className="absolute right-3 top-3 rounded-full bg-bg/85 px-3 py-1.5 text-caption text-ink shadow-sm backdrop-blur">
              Lumen Atelier · Copenhagen
            </span>
          </motion.div>
        </div>

        {/* stats */}
        <motion.dl
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeEditorial, delay: 0.7 }}
          className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6 lg:mt-20"
        >
          {[
            ['7', 'studios'],
            ['40+', 'pieces'],
            ['1', 'checkout'],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="font-serif text-2xl text-ink sm:text-3xl">{n}</dt>
              <dd className="mt-0.5 text-caption uppercase tracking-[0.12em] text-ink-mute">{label}</dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  )
}
