import { type MetaFunction } from '@remix-run/cloudflare';
import { Link } from '@remix-run/react';
import { useEffect, useMemo, useState } from 'react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { classNames } from '~/utils/classNames';
import { tokenClassName, tokenizeLine } from '~/utils/highlight';

export const meta: MetaFunction = () => [
  { title: 'Docs — Xova' },
  {
    description:
      'How the Xova build engine works: web apps, Android builds, 3D physics motion, backends, preview and export.',
  },
];

interface DocSection {
  id: string;
  title: string;
  body: JSX.Element;
}

function Code({ code, language = 'ts' }: { code: string; language?: string }) {
  return (
    <pre className="rounded-xl border border-xova-elements-borderColor bg-xova-elements-code-background p-4 overflow-auto xv-scroll mono-text text-[12.5px] leading-[1.7]">
      <code>
        {code.split('\n').map((line, index) => (
          <div key={index} className="xv-code-line">
            <span className="no">{index + 1}</span>
            <span className="src">
              {tokenizeLine(line).map((token, tokenIndex) => (
                <span key={tokenIndex} className={tokenClassName(token.type)}>
                  {token.value}
                </span>
              ))}
            </span>
          </div>
        ))}
      </code>
      <span className="sr-only">{language}</span>
    </pre>
  );
}

const SECTIONS: DocSection[] = [
  {
    id: 'quickstart',
    title: 'Quick start',
    body: (
      <>
        <p className="xv-muted">
          Open the{' '}
          <Link to="/studio" className="text-xova-accent-cyan">
            Studio
          </Link>
          , pick your targets in the composer (Web, Android, iOS, Backend) and describe the product. The build engine
          plans a design system, writes the files and renders the result in the preview panel — all in your browser.
        </p>
        <p className="xv-muted mt-3">
          No account and no API key are required. Add a provider key only when you want an LLM to drive open-ended
          generation; the studio falls back to the deterministic engine automatically if a provider fails.
        </p>
      </>
    ),
  },
  {
    id: 'web',
    title: 'Web apps',
    body: (
      <>
        <p className="xv-muted">
          Web builds ship as a Vite project with a real design system: tokens, fluid type scale, responsive grid,
          accessible components and routing. React flavours are generated for dashboards, SaaS and mobile-app
          archetypes.
        </p>
        <Code
          code={`# inside the exported project
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/`}
          language="bash"
        />
        <p className="xv-muted">
          The project also includes <code className="kdb">preview.html</code> — a fully self-contained version of the
          finished page that needs no install at all.
        </p>
      </>
    ),
  },
  {
    id: 'motion',
    title: '3D motion & physics',
    body: (
      <>
        <p className="xv-muted">
          When the 3D target is on, the hero becomes a Three.js scene driven by a rigid-body solver: bodies integrate
          gravity at a fixed 1/120s timestep, resolve sphere collisions with restitution, bounce off the floor and take
          impulses from your pointer or finger.
        </p>
        <Code
          code={`const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
world.defaultContactMaterial.restitution = 0.72;

function frame(now: number) {
  accumulator += Math.min((now - last) / 1000, 0.05);
  while (accumulator >= FIXED_STEP) {
    world.step(FIXED_STEP, 0, 4);
    accumulator -= FIXED_STEP;
  }
  syncInstances();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}`}
        />
        <p className="xv-muted">
          Reduced-motion preferences settle the scene automatically, and body counts drop on small screens so mid-range
          phones keep their frame budget.
        </p>
      </>
    ),
  },
  {
    id: 'android',
    title: 'Android + PWA',
    body: (
      <>
        <p className="xv-muted">
          Choosing the Android target adds a Capacitor project, an activity manifest with hardware acceleration, gradle
          config and a release checklist. The same web bundle powers the installable PWA.
        </p>
        <Code
          code={`npm run build && npx cap add android   # one time
npm run android:sync                    # copy dist/ into the native project
cd android && ./gradlew bundleRelease   # app-release.aab for the Play Console`}
          language="bash"
        />
      </>
    ),
  },
  {
    id: 'backend',
    title: 'Backends & databases',
    body: (
      <>
        <p className="xv-muted">
          Backend builds generate a typed API with request validation, structured errors, a health endpoint, schema
          definitions and migrations. Enable “full” depth to add Docker, sessions/JWT auth and CI.
        </p>
        <Code
          code={`app.get('/api/health', (c) => c.json({ ok: true, database: 'sqlite' }));
app.route('/api/items', items);

items.post('/', async (c) => {
  const parsed = ItemInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: 'invalid_body' }, 422);
  const [row] = await db.insert(schema.items).values(parsed.data).returning();
  return c.json({ data: row }, 201);
});`}
        />
      </>
    ),
  },
  {
    id: 'preview',
    title: 'Preview engine',
    body: (
      <>
        <p className="xv-muted">
          The preview panel is device-accurate (desktop, laptop, tablet, phone) with rotate, zoom and fullscreen. Two
          renderers are supported:
        </p>
        <ul className="flex flex-col gap-2 xv-muted mt-3 list-disc pl-5">
          <li>
            <strong>In-browser Node runtime</strong> — WebContainer runs <code className="kdb">npm install</code> and a
            dev server when the page is cross-origin isolated (open the studio with{' '}
            <code className="kdb">?isolate=1</code> in its own tab).
          </li>
          <li>
            <strong>Static preview engine</strong> — compiles the generated files into a single self-contained document,
            resolves local CSS/JS and maps bare imports (three, react) to CDN URLs, so the preview always works.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'export',
    title: 'Export & deploy',
    body: (
      <>
        <p className="xv-muted">
          Export from the studio, or use the endpoints directly if you are wiring Xova into CI.
        </p>
        <Code
          code={`GET  /api/health     -> service status + configured providers
GET  /api/models     -> providers, models and whether a key is present
GET  /api/templates  -> the template catalogue
POST /api/templates  -> { prompt, platforms, motion3d, backend } -> blueprint + file list
POST /api/chat       -> { messages, options } -> text/plain stream of plan + artifact
POST /api/enhancer   -> { message } -> text/plain enhanced prompt`}
          language="http"
        />
      </>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Keyboard shortcuts',
    body: (
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ['⌘ / Ctrl + K', 'Focus the prompt box'],
          ['⌘ / Ctrl + ↵', 'Build the project'],
          ['Shift + ↵', 'New line in the prompt'],
          ['← / →', 'Move through build slides'],
          ['⌘ / Ctrl + J', 'Toggle the terminal (runtime tab)'],
          ['Esc', 'Stop an in-flight build'],
        ].map(([keys, action]) => (
          <div key={keys} className="flex items-center gap-3">
            <kbd className="kdb">{keys}</kbd>
            <span className="xv-muted text-sm">{action}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'api',
    title: 'Provider configuration',
    body: (
      <>
        <p className="xv-muted">
          Set keys through the studio settings (stored only in your browser) or as environment secrets where the app is
          deployed. Anthropic, OpenAI, Google Gemini and any OpenAI-compatible endpoint (Groq, OpenRouter, Ollama) are
          supported.
        </p>
        <Code
          code={`ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
XOVA_COMPATIBLE_API_KEY=...      # any /v1/chat/completions endpoint
XOVA_BASE_URL=https://api.groq.com/openai/v1`}
          language="bash"
        />
      </>
    ),
  },
];

export default function DocsPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, []);

  const activeTitle = useMemo(() => SECTIONS.find((section) => section.id === active)?.title ?? '', [active]);

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 self-start">
            <span className="section-label">Documentation</span>
            <nav className="flex flex-col gap-1 mt-3">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={classNames(
                    'rounded-lg px-3 py-2 text-sm transition-theme',
                    active === section.id
                      ? 'bg-xova-elements-item-backgroundAccent text-xova-elements-textPrimary'
                      : 'text-xova-elements-textSecondary hover:bg-xova-elements-item-backgroundActive',
                  )}
                >
                  {section.title}
                </a>
              ))}
            </nav>
            <div className="xv-card mt-6 p-3">
              <span className="section-label">Now reading</span>
              <p className="text-sm mt-1">{activeTitle}</p>
            </div>
          </aside>

          <div className="flex flex-col gap-12 max-w-[74ch]">
            <header>
              <span className="xv-kicker">Docs</span>
              <h1 className="xv-display mt-3">Everything Xova can build.</h1>
              <p className="xv-muted mt-5">
                A practical guide to the build engine, the preview pipeline and the artefacts you get out the other end.
              </p>
            </header>

            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 flex flex-col gap-4">
                <h2 className="xv-h2">{section.title}</h2>
                {section.body}
              </section>
            ))}

            <div className="xv-card flex flex-wrap items-center gap-4">
              <div>
                <strong>Still stuck?</strong>
                <p className="xv-muted text-sm mt-1">
                  Tell us what you are building and we will point you at the right target.
                </p>
              </div>
              <Link to="/contact" className="xv-btn xv-btn-primary ml-auto">
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
