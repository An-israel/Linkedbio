import { useEffect, useState } from 'react'
import type { Link } from '../lib/types'
import { usePublicLinks } from '../hooks/useLinks'
import { useSettings } from '../hooks/useSettings'
import { logPageView } from '../lib/analytics'
import { ProfileHeader } from '../components/ProfileHeader'
import { LinkButton } from '../components/LinkButton'
import { LinkModal } from '../components/LinkModal'
import { Footer } from '../components/Footer'
import { HubSkeleton } from '../components/HubSkeleton'

/** The public link hub — a single centered mobile-first column. */
export function Hub() {
  const { links, loading: linksLoading } = usePublicLinks()
  const { settings, loading: settingsLoading } = useSettings()
  const [activeLink, setActiveLink] = useState<Link | null>(null)

  useEffect(() => {
    logPageView()
  }, [])

  useEffect(() => {
    if (settings.og_image_url) {
      document
        .querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')
        .forEach((el) => el.setAttribute('content', settings.og_image_url))
    }
  }, [settings.og_image_url])

  const loading = linksLoading || settingsLoading

  return (
    <div className="min-h-dvh bg-obsidian">
      <main className="mx-auto w-full max-w-[520px] px-5">
        {loading ? (
          <HubSkeleton />
        ) : (
          <>
            <ProfileHeader settings={settings} />

            {links.length === 0 ? (
              <p className="text-mist text-sm text-center py-16">Nothing here yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {links.map((link) => (
                  <LinkButton key={link.id} link={link} onOpenModal={setActiveLink} />
                ))}
              </div>
            )}

            <Footer name={settings.display_name} />
          </>
        )}
      </main>

      {activeLink && <LinkModal link={activeLink} onClose={() => setActiveLink(null)} />}
    </div>
  )
}
