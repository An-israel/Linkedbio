import type { Link, Settings } from './types'

export const FALLBACK_SETTINGS: Settings = {
  display_name: 'ANIEKAN ISRAEL',
  tagline: 'LIGHT TO THE WORLD · MASSIVE EXECUTION',
  bio: 'Full-stack & AI engineer. Founder. I build things that ship.',
  avatar_url: '',
  og_image_url: '',
  instagram_url: 'https://instagram.com/creativeeazy',
  tiktok_url: 'https://tiktok.com/@creativeeazy',
  x_url: 'https://x.com/creativeeazy',
  facebook_url: 'https://facebook.com/creativeeazy',
}

const now = new Date().toISOString()

const seed = (
  i: number,
  data: Pick<Link, 'title' | 'url'> & Partial<Link>
): Link => ({
  id: `seed-${i}`,
  category: null,
  subtitle: null,
  description: null,
  icon: null,
  featured: false,
  visible: true,
  open_new_tab: true,
  sort_order: i,
  click_count: 0,
  created_at: now,
  updated_at: now,
  ...data,
})

export const FALLBACK_LINKS: Link[] = [
  seed(0, {
    title: 'SkryveAI',
    category: 'AI PLATFORM',
    description:
      'My AI-powered client acquisition platform for freelancers. It finds you clients, optimizes your CV against any job, and scores your applications so you stop getting filtered out. Built end to end.',
    url: 'https://skryveai.com',
    featured: true,
  }),
  seed(1, {
    title: 'NexxosHQ',
    category: 'B2B SAAS',
    description:
      'The operating system for African businesses. HR, tasks, attendance, messaging, and OKRs in one secure multi-tenant platform.',
    url: 'https://nexus.skryveai.com',
  }),
  seed(2, {
    title: 'SwiftCreator',
    category: 'WEB DESIGN',
    description:
      'I build websites that make founders look like the leader in their space. Fast, premium, conversion-focused.',
    url: 'https://swiftcreator.vercel.app',
  }),
  seed(3, {
    title: 'My Portfolio',
    category: 'PORTFOLIO',
    description:
      "Case studies of the products and systems I've built — full-stack, AI, and multi-tenant SaaS.",
    url: 'https://aniekanisrael.com',
    featured: true,
  }),
  seed(4, {
    title: 'SceneForge',
    category: 'AI TOOL',
    description:
      'Turn a script into finished video assets — AI scene breakdown, voiceover, and images in one automated pipeline.',
    url: 'https://sceneforge.vercel.app',
  }),
  seed(5, {
    title: 'Are You the Problem?',
    category: 'BOOK',
    description:
      "My book on mindset and mind power. If you feel stuck, the strategy just wasn't built yet — this is where it starts.",
    url: 'https://selar.com/2777z79776',
  }),
  seed(6, {
    title: 'The Speed Advantage',
    category: 'BOOK',
    description:
      'How to move faster than everyone around you and turn AI into an unfair advantage. ₦2,000.',
    url: 'https://selar.com/985ejr8r81',
  }),
]
