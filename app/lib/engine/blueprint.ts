import { brandFromPrompt, keywords, pickTheme, slugify, titleCase } from './design';
import type {
  Archetype,
  BackendSpec,
  Blueprint,
  BuildSlide,
  MotionSpec,
  PhysicsSpec,
  Platform,
  SectionKind,
  StackInfo,
} from './types';

export interface PlanOptions {
  /** Explicit platform selection coming from the studio composer. */
  platforms?: Platform[];

  /** Explicit archetype selection (overrides detection). */
  archetype?: Archetype;

  /** Force a theme id. */
  themeId?: string;

  /** Turn the physics/3D pipeline on or off. */
  motion3d?: boolean;

  /** Requested backend depth. */
  backend?: 'auto' | 'none' | 'api' | 'full';
}

const ARCHETYPE_HINTS: Array<{ archetype: Archetype; words: string[]; weight?: number }> = [
  { archetype: 'game', words: ['game', 'arcade', 'shooter', 'puzzle', 'platformer', 'invaders'], weight: 2 },
  {
    archetype: 'fullstack-api',
    words: ['api', 'backend', 'server', 'microservice', 'graphql', 'trpc', 'rest', 'webhook', 'cron'],
    weight: 2,
  },
  { archetype: 'mobile-app', words: ['android', 'ios', 'mobile', 'apk', 'capacitor', 'pwa', 'phone'] },
  { archetype: 'motion-3d', words: ['3d', 'physics', 'three', 'webgl', 'shader', 'motion', 'award', 'cinematic'] },
  {
    archetype: 'ecommerce',
    words: ['shop', 'store', 'ecommerce', 'commerce', 'product', 'cart', 'checkout', 'marketplace'],
  },
  { archetype: 'dashboard', words: ['dashboard', 'admin', 'analytics', 'crm', 'metrics', 'chart', 'panel'] },
  { archetype: 'saas', words: ['saas', 'platform', 'subscription', 'billing', 'team', 'workspace', 'tool'] },
  { archetype: 'portfolio', words: ['portfolio', 'designer', 'photographer', 'resume', 'personal'] },
  { archetype: 'blog', words: ['blog', 'magazine', 'news', 'article', 'publication', 'docs', 'documentation'] },
  { archetype: 'landing', words: ['landing', 'waitlist', 'launch', 'marketing', 'agency', 'startup', 'product'] },
];

export function detectArchetype(prompt: string): Archetype {
  const p = prompt.toLowerCase();
  let best: Archetype = 'landing';
  let bestScore = 0;

  for (const hint of ARCHETYPE_HINTS) {
    const score = hint.words.reduce((acc, word) => (p.includes(word) ? acc + (hint.weight ?? 1) : acc), 0);

    if (score > bestScore) {
      bestScore = score;
      best = hint.archetype;
    }
  }

  if (bestScore === 0 && /physics|3d|motion|animation|cinematic|webgl/.test(p)) {
    best = 'motion-3d';
  }

  return best;
}

export function detectPlatforms(prompt: string, explicit?: Platform[]): Platform[] {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const p = prompt.toLowerCase();
  const platforms = new Set<Platform>(['web']);

  if (/\b(android|apk|play store|mobile app|ios|iphone|capacitor|pwa)\b/.test(p)) {
    platforms.add('android');

    if (/\b(ios|iphone|app store)\b/.test(p) || /mobile app/.test(p)) {
      platforms.add('ios');
    }
  }

  if (/\b(api|backend|server|database|postgres|sqlite|auth|graphql)\b/.test(p)) {
    platforms.add('backend');
  }

  if (/\b(desktop|electron|tauri|macos|windows)\b/.test(p)) {
    platforms.add('desktop');
  }

  return Array.from(platforms);
}

function buildStack(archetype: Archetype, platforms: Platform[], backend: BackendSpec): StackInfo {
  const frontend =
    archetype === 'game' || archetype === 'motion-3d' || archetype === 'portfolio'
      ? 'Vite + TypeScript + Three.js'
      : archetype === 'mobile-app'
        ? 'Vite + React + Capacitor'
        : archetype === 'dashboard' || archetype === 'saas'
          ? 'Vite + React + TanStack Router'
          : 'Vite + TypeScript + Web Components';

  const three =
    archetype === 'motion-3d' || archetype === 'game' ? 'Three.js + custom rigid-body solver' : 'Three.js (hero scene)';

  return {
    frontend,
    styling: 'Design tokens + fluid CSS + container queries',
    motion: 'Xova Motion Runtime (scroll, magnetic, spring, view transitions)',
    three,
    backend: backend.enabled
      ? `${titleCase(backend.framework)} ${backend.api.toUpperCase()} on ${platforms.includes('backend') ? 'edge' : 'node'}`
      : 'Static / edge prerender',
    database: backend.enabled ? `${titleCase(backend.database)} via ${titleCase(backend.orm)}` : 'None (client state)',
    auth: backend.enabled ? `${backend.auth} auth` : 'None',
    deploy: platforms.includes('android')
      ? 'Cloudflare Pages + Play Store bundle'
      : 'Cloudflare Pages / any static host',
    runtime: 'WebContainer (in-browser Node) + Xova static preview engine',
  };
}

function buildSlides(archetype: Archetype, brand: string, themeName: string, platforms: Platform[]): BuildSlide[] {
  const platformLabel = platforms.map((platform) => titleCase(platform)).join(' · ');

  return [
    {
      id: 'brief',
      title: 'Brief decoded',
      subtitle: `${brand} · ${titleCase(archetype.replace('-', ' '))}`,
      icon: 'target',
      badge: 'Step 1',
      accent: '#7c5cff',
      bullets: [
        'Intent, audience and tone extracted from your prompt',
        `Design system locked: ${themeName}`,
        `Targets: ${platformLabel}`,
      ],
    },
    {
      id: 'system',
      title: 'Design system',
      subtitle: 'Tokens, type scale, grid',
      icon: 'palette',
      badge: 'Step 2',
      accent: '#22d3ee',
      bullets: [
        'Color tokens with automatic contrast pairs',
        'Fluid type scale + optical spacing rhythm',
        'Component primitives: buttons, cards, nav, forms',
      ],
    },
    {
      id: 'interface',
      title: 'Interface assembly',
      subtitle: 'Sections with real content',
      icon: 'layout',
      badge: 'Step 3',
      accent: '#a78bfa',
      bullets: [
        'Section library composed for the archetype',
        'Copy written for the product, not lorem ipsum',
        'Accessible landmarks, focus states, semantics',
      ],
    },
    {
      id: 'motion',
      title: 'Motion & 3D physics',
      subtitle: 'Real WebGL + rigid bodies',
      icon: 'cube',
      badge: 'Step 4',
      accent: '#ff5fa2',
      bullets: [
        'Three.js scene with live rigid-body solver',
        'Scroll-linked reveals and parallax layers',
        'Pointer + touch forces on every interactive body',
      ],
    },
    {
      id: 'data',
      title: 'Data & backend',
      subtitle: 'Schema, API, auth',
      icon: 'database',
      badge: 'Step 5',
      accent: '#34d399',
      bullets: [
        'Typed schema + migrations generated',
        'REST/GraphQL handlers with validation',
        'Session auth, rate limits, Docker compose',
      ],
    },
    {
      id: 'ship',
      title: 'Build & ship',
      subtitle: 'Web, Android, CI',
      icon: 'rocket',
      badge: 'Step 6',
      accent: '#fbbf24',
      bullets: [
        'Vite production build + Lighthouse budget',
        'Capacitor Android project for Play Store',
        'One-click ZIP export or instant preview URL',
      ],
    },
  ];
}

function buildFeatures(archetype: Archetype, prompt: string): string[] {
  const extra = keywords(prompt)
    .slice(0, 3)
    .map((word) => titleCase(word));

  const base: Record<Archetype, string[]> = {
    landing: ['Conversion-tuned hero', 'Social proof wall', 'Instant lead capture'],
    'motion-3d': ['Live rigid-body scene', 'Scroll choreography', 'Shader-lit materials'],
    saas: ['Seat-based billing UI', 'Realtime team activity', 'Usage analytics'],
    dashboard: ['Live metric tiles', 'Drag-to-arrange widgets', 'CSV + API ingestion'],
    ecommerce: ['Product grid with filters', 'Cart + checkout flow', 'Inventory sync'],
    portfolio: ['Case-study narrative', 'Interactive gallery', 'Contact + availability'],
    blog: ['MDX content pipeline', 'Tag + search index', 'Reading experience'],
    'mobile-app': ['Installable PWA shell', 'Offline-first storage', 'Push-ready Android build'],
    game: ['Physics playground', 'Score + combo loop', 'Touch and keyboard input'],
    'fullstack-api': ['Typed REST + GraphQL', 'Auth with sessions', 'Docker + migrations'],
  };

  return [...base[archetype], ...extra].slice(0, 6);
}

function buildSections(archetype: Archetype, motion3d: boolean): SectionKind[] {
  const nav: SectionKind[] = ['nav'];
  const tail: SectionKind[] = ['cta', 'footer'];
  const hero: SectionKind[] = motion3d || archetype === 'motion-3d' || archetype === 'game' ? ['hero-3d'] : ['hero'];

  const middle: Record<Archetype, SectionKind[]> = {
    landing: ['marquee', 'features', 'stats', 'showcase', 'pricing', 'testimonials', 'faq'],
    'motion-3d': ['showcase', 'features', 'timeline', 'stats', 'testimonials'],
    saas: ['features', 'stats', 'pricing', 'showcase', 'testimonials', 'faq'],
    dashboard: ['dashboard', 'features', 'stats', 'pricing', 'faq'],
    ecommerce: ['store', 'features', 'stats', 'testimonials', 'faq'],
    portfolio: ['showcase', 'timeline', 'stats', 'testimonials', 'contact'],
    blog: ['blog-list', 'features', 'stats', 'cta'],
    'mobile-app': ['features', 'showcase', 'stats', 'pricing', 'faq'],
    game: ['showcase', 'features', 'stats', 'faq'],
    'fullstack-api': ['features', 'dashboard', 'timeline', 'pricing', 'faq'],
  };

  return [...nav, ...hero, ...middle[archetype].slice(0, 5), ...tail];
}

function buildBackend(
  archetype: Archetype,
  platforms: Platform[],
  prompt: string,
  mode: PlanOptions['backend'],
): BackendSpec {
  const p = prompt.toLowerCase();
  const explicit = mode ?? 'auto';

  if (explicit === 'none') {
    return {
      enabled: false,
      framework: 'hono',
      database: 'sqlite',
      orm: 'drizzle',
      auth: 'none',
      api: 'rest',
      realtime: false,
      docker: false,
    };
  }

  const wantsBackend =
    explicit === 'api' ||
    explicit === 'full' ||
    platforms.includes('backend') ||
    archetype === 'saas' ||
    archetype === 'dashboard' ||
    archetype === 'ecommerce' ||
    archetype === 'fullstack-api' ||
    /login|auth|user|database|payment|stripe|realtime|websocket|chat/.test(p);

  return {
    enabled: wantsBackend,
    framework: /express/.test(p) ? 'express' : 'hono',
    database: /postgres|pg|supabase|neon/.test(p) ? 'postgres' : /mysql|planetscale/.test(p) ? 'mysql' : 'sqlite',
    orm: /prisma/.test(p) ? 'prisma' : 'drizzle',
    auth: /login|auth|user|account/.test(p) ? (/jwt/.test(p) ? 'jwt' : 'session') : 'none',
    api: /graphql/.test(p) ? 'graphql' : /trpc/.test(p) ? 'trpc' : 'rest',
    realtime: /realtime|websocket|live|chat|collab/.test(p),
    docker: explicit === 'full' || /docker|deploy|production|self-host/.test(p),
  };
}

function buildMotion(prompt: string, motion3d: boolean): MotionSpec {
  const p = prompt.toLowerCase();

  return {
    preset: /playful|fun|kids|game|colorful/.test(p)
      ? 'playful'
      : /editorial|magazine|blog|news|portfolio/.test(p)
        ? 'editorial'
        : motion3d || /cinematic|award|film|3d/.test(p)
          ? 'cinematic'
          : 'precise',
    scrollReveal: !/no animation|static|minimal motion/.test(p),
    parallax: motion3d || /parallax|depth|3d/.test(p),
    magnetic: !/no animation/.test(p),
    pageTransitions: true,
  };
}

function buildPhysics(prompt: string, motion3d: boolean, archetype: Archetype): PhysicsSpec {
  const wantsPhysics =
    motion3d ||
    archetype === 'motion-3d' ||
    archetype === 'game' ||
    /physics|gravity|ragdoll|simulat/.test(prompt.toLowerCase());

  return {
    engine: wantsPhysics ? 'xova-rigid' : 'none',
    gravity: -9.81,
    restitution: 0.72,
    bodyCount: archetype === 'game' ? 42 : 18,
    interactive: true,
  };
}

export function createBlueprint(prompt: string, options: PlanOptions = {}): Blueprint {
  const cleanPrompt = prompt.trim() || 'A cinematic 3D physics landing page for a creative studio';
  const archetype = options.archetype ?? detectArchetype(cleanPrompt);
  const platforms = detectPlatforms(cleanPrompt, options.platforms);
  const theme = pickTheme(cleanPrompt);
  const chosenTheme = options.themeId ? { ...theme, id: options.themeId } : theme;
  const brand = brandFromPrompt(cleanPrompt, 'Aurora');
  const motion3d = options.motion3d ?? /3d|physics|webgl|three|motion|cinematic|game/.test(cleanPrompt.toLowerCase());
  const backend = buildBackend(archetype, platforms, cleanPrompt, options.backend);
  const sections = buildSections(archetype, motion3d) as SectionKind[];
  const slides = buildSlides(archetype, brand, chosenTheme.name, platforms);
  const physics = buildPhysics(cleanPrompt, motion3d, archetype);
  const features = buildFeatures(archetype, cleanPrompt);
  const slug = slugify(`${brand}-${archetype}`);

  const description =
    cleanPrompt.length > 22
      ? cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1)
      : `A ${chosenTheme.name.toLowerCase()} ${archetype.replace('-', ' ')} build for ${brand}`;

  const pages =
    archetype === 'dashboard' || archetype === 'saas'
      ? ['/', '/dashboard', '/settings', '/api/health']
      : archetype === 'ecommerce'
        ? ['/', '/product', '/cart', '/checkout']
        : archetype === 'blog'
          ? ['/', '/posts/[slug]', '/tags', '/rss.xml']
          : archetype === 'fullstack-api'
            ? ['/', '/health', '/api/v1/items', '/api/auth']
            : ['/', '/#features', '/#pricing', '/contact'];

  return {
    id: `xova-${slug}-${Date.now().toString(36)}`,
    slug,
    title: `${brand} — ${titleCase(archetype.replace('-', ' '))}`,
    description,
    brand,
    tagline: buildTagline(archetype, brand, cleanPrompt),
    prompt: cleanPrompt,
    archetype,
    platforms,
    features,
    metrics: [
      { label: 'Sections', value: String(sections.length) },
      { label: 'Targets', value: String(platforms.length) },
      { label: 'Motion', value: motion3d ? '3D + physics' : 'micro' },
      { label: 'Backend', value: backend.enabled ? backend.framework : 'edge static' },
      { label: 'Theme', value: chosenTheme.name },
      { label: 'Bodies', value: physics.engine === 'none' ? '—' : String(physics.bodyCount) },
    ],
    sections,
    pages,
    stack: buildStack(archetype, platforms, backend),
    theme: chosenTheme,
    slides,
    motion: buildMotion(cleanPrompt, motion3d),
    physics,
    backend,
    quality: 92 + Math.min(6, Math.round(cleanPrompt.length / 40)),
  };
}

function buildTagline(archetype: Archetype, brand: string, prompt: string): string {
  const keyword = keywords(prompt)[0] ?? 'ideas';

  const taglines: Record<Archetype, string> = {
    landing: `${brand} turns ${keyword} into signups — with a page that moves like a product film.`,
    'motion-3d': `${brand} simulates real rigid bodies in the browser — drop in and feel the ${keyword}.`,
    saas: `${brand} is the operating system for ${keyword} teams: fast, typed, realtime.`,
    dashboard: `${brand} shows every ${keyword} metric the moment it changes.`,
    ecommerce: `${brand} sells ${keyword} with a storefront that feels like a showroom.`,
    portfolio: `${brand} — a living portfolio for ${keyword} work.`,
    blog: `${brand} publishes ${keyword} with a reading experience worth subscribing to.`,
    'mobile-app': `${brand} in your pocket: installable, offline-first, built for ${keyword}.`,
    game: `${brand} — physics-driven play, built around ${keyword}.`,
    'fullstack-api': `${brand} serves ${keyword} through a typed, authenticated API.`,
  };

  return taglines[archetype];
}
