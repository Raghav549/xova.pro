import { type MetaFunction } from '@remix-run/react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';

export const meta: MetaFunction = () => [{ title: 'Changelog — Xova' }];

const RELEASES: Array<{ version: string; date: string; title: string; items: string[]; tag?: string }> = [
  {
    version: '2.0.0',
    date: '2026-10-06',
    title: 'The build-studio release',
    tag: 'current',
    items: [
      'New build engine: prompt → design system → interface → motion → data → release, all in the browser',
      'Real 3D physics pipeline with a rigid-body solver and fixed timestep, replacing fake motion loops',
      'Studio rebuilt: build slides, live code stream, device-accurate preview panel, runtime tab and export centre',
      'Android target with Capacitor project, gradle config and a Play Store checklist',
      'Backend generation: typed routes, validation, schema, migrations, auth, Docker and CI',
      'Multi-provider LLM support (Anthropic, OpenAI, Gemini, any OpenAI-compatible endpoint) with automatic fallback',
      'Local project history, ZIP export and standalone preview files',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-04-18',
    title: 'Motion foundations',
    items: [
      'Scroll-linked reveals and magnetic interactions in the design system',
      'Reduced-motion support across every generated component',
      'Preview panel device frames and rotate control',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-01-22',
    title: 'In-browser runtime',
    items: [
      'WebContainer integration with cross-origin isolation detection',
      'Terminal, file tree and CodeMirror editor inside the studio',
      'Graceful static preview fallback when the runtime cannot boot',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-11-03',
    title: 'First public release',
    items: ['Prompt-to-project generation', 'Markdown chat with artifact cards', 'One-click export'],
  },
];

export default function ChangelogPage() {
  useReveal();

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell max-w-[860px]">
          <Reveal>
            <span className="xv-kicker">Changelog</span>
            <h1 className="xv-display mt-3">What changed, and when.</h1>
          </Reveal>

          <ol className="mt-10 flex flex-col gap-4">
            {RELEASES.map((release, index) => (
              <Reveal key={release.version} delay={index * 60} as="li">
                <article className="xv-card">
                  <header className="flex flex-wrap items-center gap-3">
                    <span className="chip chip-active">v{release.version}</span>
                    <strong className="text-base">{release.title}</strong>
                    <span className="text-xs text-xova-elements-textTertiary ml-auto">{release.date}</span>
                  </header>
                  <ul className="mt-4 flex flex-col gap-2 text-sm xv-muted">
                    {release.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="i-ph:dot-outline text-xova-accent-cyan mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
