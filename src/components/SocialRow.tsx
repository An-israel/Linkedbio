import type { Settings } from '../lib/types'
import { FacebookIcon, InstagramIcon, TikTokIcon, XIcon } from './icons'

const SOCIALS: {
  key: keyof Settings
  label: string
  Icon: (props: { className?: string }) => React.ReactNode
}[] = [
  { key: 'instagram_url', label: 'Instagram', Icon: InstagramIcon },
  { key: 'tiktok_url', label: 'TikTok', Icon: TikTokIcon },
  { key: 'x_url', label: 'X (Twitter)', Icon: XIcon },
  { key: 'facebook_url', label: 'Facebook', Icon: FacebookIcon },
]

/** Icon-only social row — direct links, no popup. Renders only URLs that are set. */
export function SocialRow({ settings }: { settings: Settings }) {
  const active = SOCIALS.filter(({ key }) => settings[key])
  if (active.length === 0) return null

  return (
    <nav aria-label="Social profiles" className="flex items-center gap-5 mt-5">
      {active.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={settings[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-mist hover:text-silver transition-colors p-1"
        >
          <Icon className="h-[18px] w-[18px]" />
        </a>
      ))}
    </nav>
  )
}
