import { type MetaFunction } from '@remix-run/react';
import JSZip from 'jszip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@remix-run/react';
import { toast } from 'react-toastify';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';
import { type StoredProject, clearProjects, deleteProject, listProjects } from '~/lib/persistence/projects';

export const meta: MetaFunction = () => [
  { title: 'Projects — Xova' },
  { description: 'Every build Xova created in this browser, with export, reopen and cleanup.' },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');

  useReveal([loaded, query]);

  const refresh = useCallback(() => {
    listProjects()
      .then((rows) => {
        setProjects(rows);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(refresh, [refresh]);

  const stats = useMemo(() => {
    const files = projects.reduce((acc, project) => acc + project.files.length, 0);
    const lines = projects.reduce((acc, project) => acc + (project.stats?.lines ?? 0), 0);
    const bytes = projects.reduce((acc, project) => acc + (project.stats?.bytes ?? 0), 0);
    const engines = new Map<string, number>();

    for (const project of projects) {
      engines.set(project.engine, (engines.get(project.engine) ?? 0) + 1);
    }

    return { files, lines, bytes, engines: Array.from(engines.entries()) };
  }, [projects]);

  const activity = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - index));

      return { date, count: 0 };
    });

    for (const project of projects) {
      const created = new Date(project.createdAt);

      created.setHours(0, 0, 0, 0);

      const match = days.find((day) => day.date.getTime() === created.getTime());

      if (match) {
        match.count += 1;
      }
    }

    return days;
  }, [projects]);

  const peak = Math.max(1, ...activity.map((day) => day.count));

  const filtered = projects.filter((project) => {
    if (query.length < 2) {
      return true;
    }

    const haystack = `${project.title} ${project.prompt} ${project.engine}`.toLowerCase();

    return haystack.includes(query.toLowerCase());
  });

  const download = async (project: StoredProject) => {
    const zip = new JSZip();
    const root = zip.folder(project.slug) as JSZip;

    for (const file of project.files) {
      root.file(file.path, file.content);
    }

    if (project.previewDoc) {
      root.file('preview.html', project.previewDoc);
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${project.slug}.zip`;
    anchor.click();

    URL.revokeObjectURL(url);
    toast.success(`${project.slug}.zip downloaded`);
  };

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell">
          <Reveal className="flex flex-wrap items-end gap-4">
            <div className="max-w-[58ch]">
              <span className="xv-kicker">Projects</span>
              <h1 className="xv-display mt-3">Your builds, on this device.</h1>
              <p className="xv-muted mt-4">
                Xova stores finished builds in your browser with IndexedDB — no account, no upload. Reopen, export or
                clear them at any time.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <input
                className="field max-w-[240px]"
                placeholder="Search builds…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search builds"
              />
              <Link to="/studio" className="xv-btn xv-btn-primary">
                <span className="i-ph:plus" />
                New build
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-10">
            {[
              ['Builds', String(projects.length)],
              ['Files generated', String(stats.files)],
              ['Lines written', stats.lines.toLocaleString()],
              ['Output size', `${(stats.bytes / 1024).toFixed(1)} KB`],
            ].map(([label, value], index) => (
              <Reveal key={label} delay={index * 50}>
                <div className="xv-card">
                  <span className="section-label">{label}</span>
                  <p className="text-3xl font-semibold tracking-tight mt-2">{value}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8">
            <div className="xv-card">
              <div className="flex items-center gap-3">
                <span className="section-label">Activity · last 14 days</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  {stats.engines.map(([engine, count]) => (
                    <span key={engine} className="chip">
                      {engine} · {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-24 mt-4">
                {activity.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-[var(--xova-accent-cyan)] to-[var(--xova-accent-glow)] transition-[height] duration-500"
                    style={{ height: `${Math.max(4, (day.count / peak) * 100)}%` }}
                    title={`${day.date.toDateString()} · ${day.count} builds`}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {filtered.map((project) => (
              <article key={project.id} className="xv-card is-interactive flex flex-col gap-3">
                <span className="xv-card-sheen" />
                <div className="flex items-center gap-2">
                  <span className="chip">{project.engine}</span>
                  <span className="text-xs text-xova-elements-textTertiary ml-auto">
                    {new Date(project.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong className="text-base">{project.title}</strong>
                  <p className="xv-muted text-sm mt-1 line-clamp-2">{project.prompt}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="chip">{project.files.length} files</span>
                  {project.stats && <span className="chip">{project.stats.lines.toLocaleString()} lines</span>}
                  {project.blueprint && (
                    <span className="chip capitalize">{project.blueprint.archetype.replace('-', ' ')}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Link to={`/studio/${project.id}`} className="xv-btn xv-btn-outline flex-1">
                    <span className="i-ph:arrow-square-in" />
                    Open
                  </Link>
                  <button
                    type="button"
                    className="xv-btn xv-btn-outline"
                    onClick={() => download(project)}
                    title="Download ZIP"
                  >
                    <span className="i-ph:download-simple" />
                  </button>
                  <button
                    type="button"
                    className="xv-btn xv-btn-outline"
                    title="Delete"
                    onClick={async () => {
                      await deleteProject(project.id);
                      refresh();
                      toast.info('Build deleted');
                    }}
                  >
                    <span className="i-ph:trash" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {loaded && filtered.length === 0 && (
            <Reveal className="mt-10">
              <div className="xv-card text-center py-14 flex flex-col items-center gap-3">
                <span className="i-ph:folder-open text-3xl text-xova-accent-cyan" />
                <strong className="text-lg">No builds stored yet</strong>
                <p className="xv-muted max-w-[46ch]">
                  Finish a build in the studio and it appears here automatically — ready to reopen or export.
                </p>
                <Link to="/studio" className="xv-btn xv-btn-primary mt-2">
                  Open the Studio
                </Link>
              </div>
            </Reveal>
          )}

          {projects.length > 0 && (
            <div className="flex justify-end mt-8">
              <button
                type="button"
                className="xv-btn xv-btn-outline"
                onClick={async () => {
                  await clearProjects();
                  refresh();
                  toast.info('Local project history cleared');
                }}
              >
                <span className="i-ph:broom" />
                Clear local history
              </button>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
