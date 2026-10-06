import { json, type MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { useMemo, useState } from 'react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';
import { DEMO_PROMPTS, createBlueprint } from '~/lib/engine';
import { classNames } from '~/utils/classNames';

interface Template {
  id: string;
  label: string;
  prompt: string;
  archetype: string;
  theme: string;
  accent: string;
  sections: number;
  platforms: string[];
  physics: string;
}

const ACCENTS = ['#7c5cff', '#22d3ee', '#ff5fa2', '#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa'];

const EXTRA: Array<{ label: string; prompt: string }> = [
  {
    label: 'Agency portfolio',
    prompt:
      'Build a bold, motion-heavy agency site for a brand studio — light porcelain theme, case studies, team and contact.',
  },
  {
    label: 'Restaurant + reservations',
    prompt: 'Create a warm restaurant site with a menu, reservations form, gallery and an ember theme.',
  },
  {
    label: 'Wellness clinic booking',
    prompt: 'Build a calm wellness clinic site with services, practitioners, online booking form and a botanic theme.',
  },
  {
    label: 'Developer docs + blog',
    prompt: 'Make a documentation site with a sidebar, search, code samples, changelog and blog for a developer tool.',
  },
  {
    label: 'Crypto analytics dashboard',
    prompt: 'Build a crypto analytics dashboard with live metrics, charts, alerts and a Postgres backend.',
  },
  {
    label: 'Event landing + tickets',
    prompt: 'Create an event landing page with speakers, agenda, ticket tiers and a checkout form.',
  },
];

export const meta: MetaFunction = () => [
  { title: 'Templates — Xova' },
  {
    name: 'description',
    content: 'Production-ready starting briefs for web apps, 3D physics sites, Android builds and full-stack backends.',
  },
];

export async function loader() {
  const templates: Template[] = [
    ...DEMO_PROMPTS.map((demo) => ({ label: demo.label, prompt: demo.prompt })),
    ...EXTRA,
  ].map((entry, index) => {
    const blueprint = createBlueprint(entry.prompt);

    return {
      id: blueprint.slug,
      label: entry.label,
      prompt: entry.prompt,
      archetype: blueprint.archetype,
      theme: blueprint.theme.name,
      accent: ACCENTS[index % ACCENTS.length],
      sections: blueprint.sections.length,
      platforms: blueprint.platforms,
      physics: blueprint.physics.engine === 'none' ? 'micro-motion' : `${blueprint.physics.bodyCount} bodies`,
    };
  });

  return json({ templates });
}

export default function TemplatesPage() {
  const { templates } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState('');
  const [archetype, setArchetype] = useState('all');

  useReveal([query, archetype]);

  const archetypes = useMemo(
    () => ['all', ...Array.from(new Set(templates.map((template) => template.archetype)))],
    [templates],
  );

  const filtered = templates.filter((template) => {
    const matchesQuery =
      query.length < 2 ||
      template.label.toLowerCase().includes(query.toLowerCase()) ||
      template.prompt.toLowerCase().includes(query.toLowerCase());

    return matchesQuery && (archetype === 'all' || template.archetype === archetype);
  });

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell">
          <Reveal className="max-w-[62ch]">
            <span className="xv-kicker">Template library</span>
            <h1 className="xv-display mt-3">Start from a real brief.</h1>
            <p className="xv-muted mt-5">
              Every template is a full brief — the engine expands it into a design system, interface, motion layer, data
              model and release process. Fork it in the studio and change anything.
            </p>
          </Reveal>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <input
              className="field max-w-[290px]"
              placeholder="Search templates…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search templates"
            />
            <div className="flex flex-wrap gap-2">
              {archetypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setArchetype(item)}
                  className={classNames(archetype === item ? 'chip-active' : 'chip', 'capitalize')}
                >
                  {item === 'all' ? 'All' : item.replace('-', ' ')}
                </button>
              ))}
            </div>
            <span className="text-sm text-xova-elements-textTertiary ml-auto">{filtered.length} templates</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {filtered.map((template, index) => (
              <Reveal key={template.id} delay={(index % 6) * 50}>
                <article className="xv-card is-interactive h-full flex flex-col gap-3">
                  <span className="xv-card-sheen" />
                  <div
                    className="h-28 rounded-xl border border-xova-elements-borderColor"
                    style={{
                      background: `radial-gradient(80% 90% at 20% 15%, ${template.accent}55, transparent 65%), linear-gradient(140deg, ${template.accent}22, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-2">
                    <span className="chip capitalize">{template.archetype.replace('-', ' ')}</span>
                    <span className="chip">{template.theme}</span>
                  </div>
                  <strong className="text-base">{template.label}</strong>
                  <p className="xv-muted text-sm flex-1">{template.prompt}</p>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-xova-elements-textTertiary">
                    <span className="chip">{template.sections} sections</span>
                    <span className="chip">{template.physics}</span>
                    {template.platforms.map((platform) => (
                      <span key={platform} className="chip capitalize">
                        {platform}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/studio?prompt=${encodeURIComponent(template.prompt)}`}
                    className="xv-btn xv-btn-primary mt-1"
                  >
                    Use this template
                    <span className="i-ph:arrow-right" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="xv-muted mt-10">
              No template matches “{query}”. Head to the{' '}
              <Link to="/studio" className="text-xova-accent-cyan">
                studio
              </Link>{' '}
              and describe your own.
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
