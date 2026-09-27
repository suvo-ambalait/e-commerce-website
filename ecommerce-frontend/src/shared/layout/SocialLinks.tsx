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

const VARIANTS = {
  default: 'border-border-strong text-ink-soft hover:border-ink hover:bg-ink hover:text-bg',
  /** for dark surfaces — `!` beats the global `* { border-color }` rule in index.css */
  inverse: 'border-white/15! text-[#d4cfe3] hover:border-[#6d28d9]! hover:bg-[#6d28d9] hover:text-white',
}

export function SocialLinks({
  links,
  variant = 'default',
  className,
}: {
  links: SocialLink[]
  variant?: keyof typeof VARIANTS
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
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                VARIANTS[variant],
              )}
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
