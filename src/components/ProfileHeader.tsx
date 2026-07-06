import { useState } from 'react'
import type { Settings } from '../lib/types'
import { SocialRow } from './SocialRow'

export function ProfileHeader({ settings }: { settings: Settings }) {
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showAvatar = settings.avatar_url && !avatarFailed
  const initials = settings.display_name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="flex flex-col items-center text-center pt-12 pb-8">
      <div className="h-24 w-24 rounded-full ring-1 ring-silver/40 overflow-hidden bg-graphite flex items-center justify-center">
        {showAvatar ? (
          <img
            src={settings.avatar_url}
            alt={settings.display_name}
            width={96}
            height={96}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="display text-2xl text-mist select-none" aria-hidden="true">
            {initials}
          </span>
        )}
      </div>

      <h1 className="display text-platinum text-[26px] mt-5 uppercase">
        {settings.display_name}
      </h1>

      {settings.tagline && <p className="mono-label mt-2">{settings.tagline}</p>}

      {settings.bio && (
        <p className="text-mist text-sm mt-3 max-w-[38ch] leading-relaxed">{settings.bio}</p>
      )}

      <SocialRow settings={settings} />
    </header>
  )
}
