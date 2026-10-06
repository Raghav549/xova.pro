import type { MetaFunction } from '@remix-run/cloudflare';
import { Link } from '@remix-run/react';
import { Suspense, lazy } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { LiveDemo } from '~/components/site/LiveDemo';
import { TourSlides } from '~/components/site/TourSlides';
import { Reveal, useReveal } from '~/components/site/motion';
import { DEMO_PROMPTS } from '~/lib/engine/generator';
import { classNames } from '~/utils/classNames';

const Hero3D = lazy(() => import('~/components/site/Hero3D').then((module) => ({ default: module.Hero3D })));

export const meta: MetaFunction = () => [
  { title: 'Xova — Build real web apps, Android apps and 3D physics experiences with AI' },
  {
    name: 'description',
    content:
      'Xova turns a prompt into a production project: real websites, 3D physics motion sites, full-stack backends and installable Android apps — with live preview, slides and one-click export.',
  },
];

const CAPABILITIES = [
  {
    icon: 'i-ph:globe-hemisphere-west',
    title: 'Real web apps',
    body: 'Multi-page products with routing, state, forms, accessibility and a design system — not a single HTML file.',
    bullets: ['Vite + TypeScript or React', 'Design tokens + responsive grid', 'SEO, manifest, favicon'],
    accent: '#7c5cff',
    span: 'span-6',
  },
  {
    icon: 'i-ph:cube',
    title: '3D motion & physics',
    body: 'WebGL heroes driven by a real rigid-body solver: gravity, restitution, friction and pointer impulses at a fixed timestep.',
    bullets: ['Three.js / react-three-fiber', 'Fixed 1/120s integration', 'Reduced-motion fallbacks'],
    accent: '#ff5fa2',
    span: 'span-6',
  },
  {
    icon: 'i-ph:android-logo',
    title: 'Android apps',
    body: 'The same codebase wrapped with Capacitor, plus the gradle config, manifest and signing checklist for the Play Store.',
    bullets: ['capacitor.config.json', 'Release build recipe', 'PWA install path'],
    accent: '#34d399',
    span: 'span-4',
  },
  {
    icon: 'i-ph:database',
    title: 'Heavy backends',
    body: 'Typed APIs with validation, auth, migrations, Docker and CI — generated next to the frontend so contracts stay in sync.',
    bullets: ['Hono / Express + zod', 'Postgres, SQLite, MySQL', 'Sessions or JWT'],
    accent: '#22d3ee',
    span: 'span-4',
  },
  {
    icon: 'i-ph:slideshow',
    title: 'Slides + live stream',
    body: 'Every build narrates itself: a swipeable deck of stages and a live code stream with a caret that never lies about progress.',
    bullets: ['Touch + drag + keyboard', 'Per-file stream status', 'Build logs with timings'],
    accent: '#fbbf24',
    span: 'span-4',
  },
];

const STACK = [
  'Vite',
  'TypeScript',
  'React',
  'Three.js',
  'cannon-es',
  'Hono',
  'Drizzle',
  'Postgres',
  'SQLite',
  'Capacitor',
  'Cloudflare',
  'Docker',
  'WebContainer',
  'Tailwind/UnoCSS',
];

export default function Index() {
  useReveal();

  return (
    <SiteShell>
      <SiteHeader />

      <main>
        {/* hero */}
        <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <ClientOnly fallback={<div className="xv-hero-fallback absolute inset-0" />}>
              {() => (
                <Suspense fallback={<div className="xv-hero-fallback absolute inset-0" />}>
                  <Hero3D accent="#7c5cff" accent2="#22d3ee" accent3="#ff5fa2" />
                </Suspense>
              )}
            </ClientOnly>
          </div>

          <div className="xv-site-shell">
            <div className="max-w-[62ch]">
              <Reveal>
                <span className="chip">
                  <span className="xv-pulse-dot" />
                  Build engine v2 · web · android · 3D physics · backends
                </span>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="xv-display mt-6">
                  Describe it once.
                  <br />
                  <span className="xv-gradient-text">Ship the whole product.</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="xv-muted mt-6 text-lg max-w-[54ch]">
                  Xova is an AI build studio that writes real projects: beautiful websites with cinematic motion, WebGL
                  physics experiences, installable Android apps and full-stack backends with databases and auth.
                </p>
              </Reveal>

              <Reveal delay={220}>
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <Link to="/studio" className="xv-btn xv-btn-primary xv-btn-lg">
                    <span className="i-ph:sparkle" />
                    Open the Studio
                  </Link>
                  <a href="#try" className="xv-btn xv-btn-outline xv-btn-lg">
                    <span className="i-ph:play" />
                    Generate a demo now
                  </a>
                </div>
              </Reveal>

              <Reveal delay={280}>
                <dl className="flex flex-wrap gap-8 mt-12">
                  {[
                    ['13', 'build targets'],
                    ['60fps', 'motion budget'],
                    ['1/120s', 'physics timestep'],
                    ['0', 'lock-in'],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <dt className="text-2xl font-semibold tracking-tight">{value}</dt>
                      <dd className="text-xs uppercase tracking-[0.16em] text-xova-elements-textTertiary mt-1">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* marquee */}
        <section className="xv-marquee" aria-hidden="true">
          <div className="xv-marquee-track">
            {[...STACK, ...STACK].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-8">
                {item}
                <span className="text-xova-accent-cyan">◆</span>
              </span>
            ))}
          </div>
        </section>

        {/* live demo */}
        <section id="try" className="xv-site-section">
          <div className="xv-site-shell">
            <LiveDemo />
          </div>
        </section>

        {/* tour */}
        <section className="xv-site-section border-y border-xova-elements-borderColor bg-xova-elements-bg-depth-2/40">
          <div className="xv-site-shell">
            <TourSlides />
          </div>
        </section>

        {/* capabilities */}
        <section className="xv-site-section">
          <div className="xv-site-shell">
            <Reveal className="max-w-[62ch] mb-10">
              <span className="xv-kicker">Capabilities</span>
              <h2 className="xv-h2 mt-3">Everything the studio can build.</h2>
              <p className="xv-muted mt-4">
                Pick targets in the composer and the engine assembles the right stack — interface, motion, physics, data
                layer and release process.
              </p>
            </Reveal>

            <div className="xv-bento">
              {CAPABILITIES.map((capability, index) => (
                <Reveal key={capability.title} delay={index * 60} className={classNames(capability.span)}>
                  <article className="xv-card is-interactive h-full">
                    <span className="xv-card-sheen" />
                    <span
                      className={classNames(capability.icon, 'text-2xl')}
                      style={{ color: capability.accent }}
                      aria-hidden="true"
                    />
                    <h3 className="xv-h3 mt-4">{capability.title}</h3>
                    <p className="xv-muted mt-2 text-sm">{capability.body}</p>
                    <ul className="mt-4 flex flex-col gap-1.5 text-sm text-xova-elements-textSecondary">
                      {capability.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-center gap-2">
                          <span className="i-ph:check text-xova-accent-cyan" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="xv-site-section border-t border-xova-elements-borderColor">
          <div className="xv-site-shell">
            <Reveal className="max-w-[58ch] mb-10">
              <span className="xv-kicker">How a build runs</span>
              <h2 className="xv-h2 mt-3">Six moves, no boilerplate.</h2>
            </Reveal>

            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Brief decoded', 'Intent, audience, tone and targets — extracted, then shown back to you as slides.'],
                ['Design system', 'Palette, type scale, radii and spacing tokens with contrast pairs that pass AA.'],
                ['Interface assembly', 'Sections composed with real copy for your product, wired to real data.'],
                ['Motion & physics', 'WebGL scene, rigid-body solver, scroll choreography and micro-interactions.'],
                [
                  'Data & backend',
                  'Schema, migrations, typed routes, auth, Docker and CI when the product needs them.',
                ],
                ['Build & ship', 'Production bundle, ZIP export, PWA install and a signed Android release path.'],
              ].map(([title, body], index) => (
                <Reveal key={title} delay={index * 50} as="li">
                  <div className="xv-card h-full">
                    <span className="section-label">Step {index + 1}</span>
                    <h3 className="xv-h3 mt-2">{title}</h3>
                    <p className="xv-muted mt-2 text-sm">{body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* templates teaser */}
        <section className="xv-site-section">
          <div className="xv-site-shell">
            <Reveal className="flex flex-wrap items-end gap-4 mb-8">
              <div className="max-w-[52ch]">
                <span className="xv-kicker">Starters</span>
                <h2 className="xv-h2 mt-3">Begin from a real brief.</h2>
              </div>
              <Link to="/templates" className="xv-btn xv-btn-outline ml-auto">
                Browse all templates
                <span className="i-ph:arrow-right" />
              </Link>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_PROMPTS.slice(0, 6).map((demo, index) => (
                <Reveal key={demo.label} delay={index * 50}>
                  <Link
                    to={`/studio?prompt=${encodeURIComponent(demo.prompt)}`}
                    className="xv-card is-interactive h-full flex flex-col gap-3"
                  >
                    <span className="chip self-start capitalize">{demo.archetype.replace('-', ' ')}</span>
                    <strong className="text-base">{demo.label}</strong>
                    <p className="xv-muted text-sm line-clamp-3">{demo.prompt}</p>
                    <span className="mt-auto text-sm text-xova-accent-cyan flex items-center gap-1">
                      Build this <span className="i-ph:arrow-right" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* trust */}
        <section className="xv-site-section border-y border-xova-elements-borderColor bg-xova-elements-bg-depth-2/40">
          <div className="xv-site-shell grid gap-4 sm:grid-cols-3">
            {[
              [
                'You own the output',
                'Standard files, standard tools. Download the ZIP and walk away — nothing is hosted behind a proprietary runtime.',
              ],
              [
                'Works without a key',
                'The deterministic build engine runs in your browser. Add an LLM key only when you want free-form generation.',
              ],
              [
                'Honest motion',
                'We never fake progress. Physics is simulated, files are real, and the preview is the actual build output.',
              ],
            ].map(([title, body], index) => (
              <Reveal key={title} delay={index * 60}>
                <div className="xv-card h-full">
                  <span className="i-ph:seal-check text-xl text-xova-accent-cyan" />
                  <h3 className="xv-h3 mt-3">{title}</h3>
                  <p className="xv-muted mt-2 text-sm">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="xv-site-section">
          <div className="xv-site-shell">
            <Reveal>
              <div className="xv-card text-center py-12 flex flex-col items-center gap-4">
                <span className="xv-kicker">Ready when you are</span>
                <h2 className="xv-h2 max-w-[24ch]">Your next product is one prompt away.</h2>
                <p className="xv-muted max-w-[52ch]">
                  Open the studio, describe the product, and watch the design system, the physics scene and the backend
                  fall into place.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <Link to="/studio" className="xv-btn xv-btn-primary xv-btn-lg">
                    <span className="i-ph:rocket-launch" />
                    Start building
                  </Link>
                  <Link to="/docs" className="xv-btn xv-btn-outline xv-btn-lg">
                    Read the docs
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
