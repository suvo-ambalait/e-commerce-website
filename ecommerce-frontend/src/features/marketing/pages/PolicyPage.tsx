import { Link, NavLink } from 'react-router-dom'
import { LuFileText, LuMessageCircleQuestion, LuShieldCheck, LuTruck } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Accordion, Container, PageHeader, Section } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { formatDateLong } from '@/shared/lib/format'
import { contentStore, type PolicySlug } from '@/features/marketplace/stores'

const policyNav: { slug: PolicySlug; label: string; icon: typeof LuTruck }[] = [
  { slug: 'shipping-returns', label: 'Shipping & returns', icon: LuTruck },
  { slug: 'faq', label: 'FAQ', icon: LuMessageCircleQuestion },
  { slug: 'terms', label: 'Terms of service', icon: LuFileText },
  { slug: 'privacy', label: 'Privacy policy', icon: LuShieldCheck },
]

/** Help and legal pages. Admins edit the text on the Site content page. */
export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const [content] = contentStore.useStore()
  const page = content.pages[slug]
  useDocumentTitle(`${page.title} · AmbalaEshop`)

  return (
    <Section size="sm" className="bg-surface-sunken/50">
      <Container>
        <PageHeader
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Help' }, { label: page.title }]}
          eyebrow={`Last updated ${formatDateLong(page.updatedAt)}`}
          title={page.title}
          description={page.intro}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
          <nav aria-label="Help pages" className="lg:sticky lg:top-28">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:p-2 lg:shadow-sm">
              {policyNav.map((p) => (
                <li key={p.slug} className="shrink-0">
                  <NavLink
                    to={`/${p.slug}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'border border-border bg-surface text-ink-soft hover:text-ink lg:border-0 lg:bg-transparent lg:hover:bg-surface-sunken',
                      )
                    }
                  >
                    <p.icon className="h-4.5 w-4.5 shrink-0" />
                    {p.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-4">
            <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
              {slug === 'faq' ? (
                <Accordion items={page.sections.map((s, i) => ({ id: `q${i}`, question: s.heading, answer: s.body }))} defaultOpen="q0" />
              ) : (
                <div className="space-y-7">
                  {page.sections.map((s, i) => (
                    <section key={i} id={`section-${i + 1}`}>
                      <h2 className="font-display! text-lg font-bold! tracking-[-0.01em]! text-ink">{s.heading}</h2>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{s.body}</p>
                    </section>
                  ))}
                </div>
              )}
            </article>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft/60 px-5 py-4">
              <p className="text-sm text-ink">Didn’t find what you need?</p>
              <Link
                to="/contact"
                className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
