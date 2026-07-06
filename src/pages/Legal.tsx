import { Link as RouterLink } from 'react-router-dom'

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-obsidian">
      <header className="border-b border-steel/60">
        <div className="mx-auto max-w-2xl px-5 h-14 flex items-center">
          <RouterLink to="/" className="display text-platinum text-sm">
            Lynkit<span className="text-silver">.</span>
          </RouterLink>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="display text-platinum text-2xl mb-6">{title}</h1>
        <div className="text-mist text-sm leading-relaxed flex flex-col gap-4">{children}</div>
      </main>
    </div>
  )
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service">
      <p>Lynkit is a free link-in-bio service. By creating a page you agree to these terms.</p>
      <p>
        <strong className="text-platinum">Acceptable use.</strong> You may not use Lynkit to link
        to or promote phishing, malware, scams, illegal content, or content that exploits minors.
        You may not impersonate others, mask malicious destinations, or attempt to bypass our
        moderation. We remove content and suspend accounts that break these rules, without notice.
      </p>
      <p>
        <strong className="text-platinum">Your content.</strong> You own what you publish and are
        responsible for it. You grant us the right to display it on your public page.
      </p>
      <p>
        <strong className="text-platinum">Service.</strong> Lynkit is provided as-is, free of
        charge. We may change or discontinue features. Usernames are first-come, first-served and
        reserved names are unavailable; inactive or infringing usernames may be reclaimed.
      </p>
      <p>
        <strong className="text-platinum">Abuse reports.</strong> Anyone can report a page from
        its footer. Reports are reviewed by moderation. To contact us directly about abuse:
        report-abuse via the report link on any page.
      </p>
    </LegalShell>
  )
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        <strong className="text-platinum">What we collect.</strong> Your email and password
        (handled by our auth provider), your profile content (username, display name, bio, avatar,
        links), and anonymous usage counts: page views and link clicks with an optional referrer.
        We do not sell data.
      </p>
      <p>
        <strong className="text-platinum">Public pages.</strong> Everything you put on your page
        (name, bio, avatar, links) is public by design and may be indexed by search engines.
      </p>
      <p>
        <strong className="text-platinum">Analytics you see.</strong> View and click counts for
        your own page are visible only to you and to the platform operator.
      </p>
      <p>
        <strong className="text-platinum">Cookies & storage.</strong> We use local storage for
        your session and to frequency-cap promotional popups. No third-party ad trackers.
      </p>
      <p>
        <strong className="text-platinum">Deletion.</strong> Deleting your account from Settings
        permanently removes your page, links, and analytics.
      </p>
    </LegalShell>
  )
}
