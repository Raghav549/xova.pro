import { keywords, titleCase } from './design';
import type { Blueprint } from './types';

export interface FeatureCard {
  icon: string;
  title: string;
  body: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface Tier {
  name: string;
  price: string;
  period: string;
  blurb: string;
  perks: string[];
  featured?: boolean;
}

export interface Quote {
  text: string;
  name: string;
  role: string;
  initials: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface GalleryItem {
  title: string;
  meta: string;
  ratio: string;
  hue: number;
}

export interface ProductItem {
  name: string;
  price: string;
  badge?: string;
  hue: number;
}

export interface PostItem {
  title: string;
  excerpt: string;
  tag: string;
  read: string;
}

function noun(bp: Blueprint): string {
  return keywords(bp.prompt)[0] ?? 'product';
}

export function featureCards(bp: Blueprint): FeatureCard[] {
  const subject = noun(bp);
  const icons = ['sparkle', 'cube', 'bolt', 'shield', 'chart', 'layers'];
  const library: Array<[string, string]> = [
    ['Instant, cinematic opening', `A scroll-choreographed hero that frames ${subject} in under a second.`],
    ['Real 3D, real physics', 'Rigid bodies, gravity and pointer impulses running at 60fps on the GPU.'],
    ['Motion that means something', 'Every transition is tied to hierarchy, never decoration for its own sake.'],
    ['Accessible by construction', 'Contrast-checked tokens, focus rings, reduced-motion fallbacks.'],
    ['Typed end to end', 'Schema, API contracts and UI state share one source of truth.'],
    ['Ships everywhere', 'Web, installable PWA and an Android bundle from the same codebase.'],
  ];

  return library.map(([title, body], index) => ({
    icon: icons[index % icons.length],
    title: bp.features[index] ?? title,
    body: `${body}`,
  }));
}

export function statsFor(bp: Blueprint): StatItem[] {
  const subject = noun(bp);
  const set: StatItem[] = [
    { value: '60fps', label: 'sustained motion budget' },
    { value: '98', label: 'Lighthouse performance target' },
    { value: '4', label: 'platform targets' },
    { value: '0.9s', label: 'largest contentful paint' },
  ];

  if (bp.physics.engine !== 'none') {
    set[0] = { value: `${bp.physics.bodyCount}`, label: 'live rigid bodies' };
    set[1] = { value: '9.81', label: 'm/s² gravity, solved in-browser' };
  }

  if (bp.backend.enabled) {
    set[2] = { value: 'p95 42ms', label: `${bp.backend.framework} edge responses` };
  }

  set[3] = { value: `${bp.sections.length}`, label: `sections tuned for ${subject}` };

  return set;
}

export function pricingTiers(bp: Blueprint): Tier[] {
  const brand = bp.brand;

  if (bp.archetype === 'ecommerce') {
    return [
      {
        name: 'Starter',
        price: '$0',
        period: '/mo',
        blurb: 'Launch the storefront and test the funnel.',
        perks: ['Up to 25 products', 'Cart + checkout flow', 'Hosted on the edge', 'Basic analytics'],
      },
      {
        name: 'Growth',
        price: '$29',
        period: '/mo',
        blurb: 'For stores that are already selling daily.',
        perks: ['Unlimited products', 'Abandoned cart recovery', 'A/B tested product pages', 'Priority support'],
        featured: true,
      },
      {
        name: 'Scale',
        price: '$99',
        period: '/mo',
        blurb: 'Multi-region, multi-currency, multi-team.',
        perks: ['Multi-currency + tax', 'Headless API access', 'Dedicated edge region', 'Solutions engineer'],
      },
    ];
  }

  return [
    {
      name: 'Hobby',
      price: '$0',
      period: '/mo',
      blurb: `Kick the tyres on ${brand}.`,
      perks: ['1 project', 'Static preview engine', 'Community support', 'Xova badge'],
    },
    {
      name: 'Pro',
      price: '$24',
      period: '/mo',
      blurb: 'For teams shipping real products.',
      perks: [
        'Unlimited projects',
        bp.backend.enabled ? `${titleCase(bp.backend.database)} database included` : 'Live preview runtime',
        bp.physics.engine !== 'none' ? '3D physics pipeline' : 'Motion presets library',
        'Android + PWA export',
        'Email support',
      ],
      featured: true,
    },
    {
      name: 'Studio',
      price: '$96',
      period: '/mo',
      blurb: 'Agency-grade throughput and control.',
      perks: ['5 seats included', 'Custom domains', 'Design-system sync', 'SSO + audit log', 'Slack channel'],
    },
  ];
}

export function testimonials(bp: Blueprint): Quote[] {
  const subject = noun(bp);

  return [
    {
      text: `We replaced a six-week ${subject} build with an afternoon. The motion work alone would have cost us a contractor.`,
      name: 'Ada Whitfield',
      role: 'Head of Product, Northlight',
      initials: 'AW',
    },
    {
      text: 'The 3D hero runs on a five-year-old phone without dropping a frame. That is the part I still do not believe.',
      name: 'Marcus Lindqvist',
      role: 'Creative Director, Fieldnotes',
      initials: 'ML',
    },
    {
      text: `Shipped to web and the Play Store from one prompt. ${bp.brand} paid for itself on the first launch.`,
      name: 'Priya Raman',
      role: 'Founder, Kettle & Co',
      initials: 'PR',
    },
  ];
}

export function faqItems(bp: Blueprint): FaqItem[] {
  return [
    {
      q: 'Can I edit the generated code afterwards?',
      a: 'Every file lands in the studio editor with full syntax highlighting, diffs and one-click download as a ZIP. Nothing is locked behind a proprietary format.',
    },
    {
      q: 'How does the 3D physics actually work?',
      a: 'The hero scene is a Three.js scene driven by an Xova rigid-body solver: spheres and boxes integrate gravity each frame, resolve collisions with restitution, and take impulses from your pointer or finger.',
    },
    {
      q: 'What runs the backend?',
      a: bp.backend.enabled
        ? `A ${bp.backend.framework} server with ${bp.backend.database} storage, ${bp.backend.orm} migrations and ${bp.backend.auth} auth. Docker compose and CI are generated too.`
        : 'You can enable a backend at any time — Xova will scaffold the API, schema, migrations and Docker compose for it.',
    },
    {
      q: 'Does it produce a real Android app?',
      a: 'Yes. Xova generates a Capacitor project with the web bundle wired in, plus the gradle config and signing checklist needed for a Play Store release.',
    },
    {
      q: 'Is motion accessible?',
      a: 'Reduced-motion preferences are honoured automatically: scroll reveals become instant, the physics scene settles, and 3D canvases fall back to static artwork.',
    },
  ];
}

export function gallery(bp: Blueprint): GalleryItem[] {
  const subject = noun(bp);
  const metas = ['Case study', 'Interactive', 'Realtime', 'Editorial', 'Prototype', 'Launch'];

  return metas.map((meta, index) => ({
    title: `${titleCase(subject)} ${['reel', 'system', 'engine', 'identity', 'lab', 'launch'][index]}`,
    meta,
    ratio: index % 3 === 0 ? '4 / 5' : index % 3 === 1 ? '1 / 1' : '16 / 11',
    hue: (index * 47 + 210) % 360,
  }));
}

export function products(bp: Blueprint): ProductItem[] {
  const subject = noun(bp);

  const names = ['Atlas', 'Drift', 'Halo', 'Vector', 'Orbit', 'Prism', 'Pulse', 'Cadence'];
  const badges = [undefined, 'New', '-20%', undefined, 'Best seller', undefined, 'Last units', undefined];

  return names.map((name, index) => ({
    name: `${name} ${titleCase(subject)}`,
    price: `$${(48 + index * 17).toFixed(0)}`,
    badge: badges[index],
    hue: (index * 39 + 190) % 360,
  }));
}

export function posts(bp: Blueprint): PostItem[] {
  const subject = noun(bp);

  return [
    {
      title: `Designing ${subject} for the first three seconds`,
      excerpt: 'Attention is a budget. Here is how we spend it in the opening frame, and what we cut.',
      tag: 'Design',
      read: '6 min',
    },
    {
      title: 'A rigid-body solver in 120 lines',
      excerpt: 'Gravity, restitution, friction and impulse resolution — without a physics dependency.',
      tag: 'Engineering',
      read: '11 min',
    },
    {
      title: 'The motion budget: 60fps on a mid-range phone',
      excerpt: 'Compositor-only properties, instancing, and when to stop animating entirely.',
      tag: 'Performance',
      read: '8 min',
    },
    {
      title: 'From one codebase to Play Store',
      excerpt: 'Wrapping a Vite build with Capacitor, signing it, and shipping without a native team.',
      tag: 'Release',
      read: '7 min',
    },
  ];
}

export function navLinks(bp: Blueprint): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [{ label: 'Overview', href: '#top' }];

  if (bp.sections.includes('features')) {
    links.push({ label: 'Features', href: '#features' });
  }

  if (bp.sections.includes('showcase') || bp.sections.includes('store') || bp.sections.includes('blog-list')) {
    links.push({ label: bp.sections.includes('store') ? 'Shop' : 'Work', href: '#showcase' });
  }

  if (bp.sections.includes('pricing')) {
    links.push({ label: 'Pricing', href: '#pricing' });
  }

  if (bp.sections.includes('dashboard')) {
    links.push({ label: 'Dashboard', href: '#dashboard' });
  }

  links.push({ label: 'Contact', href: '#contact' });

  return links.slice(0, 5);
}

export function heroCopy(bp: Blueprint): {
  eyebrow: string;
  title: string;
  subtitle: string;
  primary: string;
  secondary: string;
} {
  return {
    eyebrow: `${titleCase(bp.archetype.replace('-', ' '))} · built with Xova`,
    title: bp.tagline.split('—')[0].trim(),
    subtitle: bp.tagline,
    primary:
      bp.archetype === 'ecommerce'
        ? 'Shop the drop'
        : bp.archetype === 'fullstack-api'
          ? 'Read the API docs'
          : 'Start building',
    secondary: bp.physics.engine !== 'none' ? 'Drop a body into the scene' : 'Watch the 60s tour',
  };
}
