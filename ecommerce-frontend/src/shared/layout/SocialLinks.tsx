import type { ComponentType, SVGProps } from 'react'
import {
  FaInstagram,
  FaPinterestP,
  FaXTwitter,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
  FaThreads,
} from 'react-icons/fa6'
import { LuNewspaper, LuLink } from 'react-icons/lu'
import { cn } from '@/shared/lib/cn'
import type { SocialLink } from '@/features/admin/context/SettingsContext'

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: FaInstagram,
  pinterest: FaPinterestP,
  x: FaXTwitter,
  twitter: FaXTwitter,
  facebook: FaFacebookF,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  linkedin: FaLinkedinIn,
  threads: FaThreads,
  journal: LuNewspaper,
  blog: LuNewspaper,
}

export function SocialLinks({
  links,
  className,
}: {
  links: SocialLink[]
  className?: string
}) {
  return (
    <ul className={cn('flex items-center gap-2', className)}>
      {links.map((link) => {
        const Icon = ICONS[link.label.trim().toLowerCase()] ?? LuLink
        return (
          <li key={link.label}>
            <a
              href={link.url}
              aria-label={link.label}
              title={link.label}
              target={link.url.startsWith('http') ? '_blank' : undefined}
              rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-bg"
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
