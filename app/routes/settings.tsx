import { useStore } from '@nanostores/react';
import { type MetaFunction, Link } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ModelBar } from '~/components/studio/ModelBar';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';
import { ensureRuntime, runtimeStore } from '~/lib/stores/runtime';
import { studioSettings, updateSettings } from '~/lib/stores/studio';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [{ title: 'Settings — Xova' }];

interface HealthPayload {
  ok: boolean;
  version: string;
  providers: string[];
  capabilities: string[];
  time: string;
}

export default function SettingsPage() {
  const settings = useStore(studioSettings);
  const runtime = useStore(runtimeStore);
  const theme = useStore(themeStore);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  useReveal();

  useEffect(() => {
    fetch('/api/health')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload) => setHealth(payload as HealthPayload))
      .catch((error: Error) => setDiagnosticsError(error.message));
  }, []);

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell max-w-[980px]">
          <Reveal>
            <span className="xv-kicker">Settings</span>
            <h1 className="xv-display mt-3">Studio preferences.</h1>
            <p className="xv-muted mt-4">
              Everything here is stored locally. API keys never leave your browser except to reach the provider you
              selected.
            </p>
          </Reveal>

          <div className="flex flex-col gap-5 mt-10">
            <Reveal>
              <section className="xv-card flex flex-col gap-4">
                <header className="flex items-center gap-3">
                  <span className="i-ph:sparkle text-lg text-xova-accent-glow" />
                  <h2 className="xv-h3">Build engine</h2>
                </header>
                <ModelBar />
              </section>
            </Reveal>

            <Reveal>
              <section className="xv-card flex flex-col gap-4">
                <header className="flex items-center gap-3">
                  <span className="i-ph:sliders text-lg text-xova-accent-cyan" />
                  <h2 className="xv-h3">Behaviour</h2>
                </header>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleRow
                    label="3D + physics pipeline"
                    description="Include a WebGL scene driven by the rigid-body solver in generated builds."
                    value={settings.motion3d}
                    onChange={(value) => updateSettings({ motion3d: value })}
                  />
                  <ToggleRow
                    label="Auto-preview"
                    description="Render the preview as soon as a build finishes writing files."
                    value={settings.autoPreview}
                    onChange={(value) => updateSettings({ autoPreview: value })}
                  />
                  <ToggleRow
                    label="Auto-run in the runtime"
                    description="Start the dev server automatically when the in-browser runtime is available."
                    value={settings.autoRun}
                    onChange={(value) => updateSettings({ autoRun: value })}
                  />
                  <ToggleRow
                    label="Dark theme"
                    description="Switch the studio appearance. Follows your system preference on first load."
                    value={theme === 'dark'}
                    onChange={() => toggleTheme()}
                  />
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="xv-card flex flex-col gap-4">
                <header className="flex items-center gap-3">
                  <span className="i-ph:pulse text-lg text-emerald-400" />
                  <h2 className="xv-h3">Diagnostics</h2>
                  <span className="chip ml-auto">
                    {runtime.status === 'ready' ? 'runtime online' : 'static preview'}
                  </span>
                </header>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Diagnostic
                    label="Service"
                    value={health ? `up · v${health.version}` : diagnosticsError ?? 'checking…'}
                  />
                  <Diagnostic
                    label="Providers configured"
                    value={health?.providers.length ? health.providers.join(', ') : 'none (local engine)'}
                  />
                  <Diagnostic label="Cross-origin isolated" value={String(runtime.crossOriginIsolated)} />
                  <Diagnostic
                    label="Runtime"
                    value={
                      runtime.status === 'ready'
                        ? 'WebContainer booted'
                        : runtime.status === 'booting'
                          ? 'booting…'
                          : runtime.reason ?? 'not started'
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="xv-btn xv-btn-outline"
                    onClick={() => {
                      runtimeStore.setKey('status', 'idle');
                      void ensureRuntime();
                    }}
                  >
                    <span className="i-ph:arrow-clockwise" />
                    Retry runtime boot
                  </button>
                  <button
                    type="button"
                    className="xv-btn xv-btn-outline"
                    onClick={() => window.open(`${window.location.origin}/studio?isolate=1`, '_blank', 'noopener')}
                  >
                    <span className="i-ph:arrow-square-out" />
                    Open studio in isolation mode
                  </button>
                  <button
                    type="button"
                    className="xv-btn xv-btn-outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        JSON.stringify(
                          { settings: { ...settings, apiKey: settings.apiKey ? '***' : '' }, runtime, health },
                          null,
                          2,
                        ),
                      );
                      toast.success('Diagnostics copied (API key redacted)');
                    }}
                  >
                    <span className="i-ph:copy" />
                    Copy diagnostics
                  </button>
                </div>

                {health && (
                  <div className="flex flex-wrap gap-1.5">
                    {health.capabilities.map((capability) => (
                      <span key={capability} className="chip">
                        {capability}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </Reveal>

            <Reveal>
              <section className="xv-card flex flex-col gap-3">
                <header className="flex items-center gap-3">
                  <span className="i-ph:keyboard text-lg text-xova-accent-magenta" />
                  <h2 className="xv-h3">Shortcuts & help</h2>
                </header>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  {[
                    ['⌘/Ctrl + K', 'Focus prompt'],
                    ['⌘/Ctrl + ↵', 'Build'],
                    ['← / →', 'Slides'],
                    ['⌘/Ctrl + J', 'Terminal'],
                  ].map(([keys, action]) => (
                    <div key={keys} className="flex items-center gap-3">
                      <kbd className="kdb">{keys}</kbd>
                      <span className="xv-muted">{action}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-1">
                  <Link to="/docs" className="xv-btn xv-btn-outline">
                    Read the docs
                  </Link>
                  <Link to="/dashboard" className="xv-btn xv-btn-outline">
                    Manage projects
                  </Link>
                </div>
              </section>
            </Reveal>
          </div>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={classNames(
        'text-left rounded-xl border p-3 transition-theme',
        value
          ? 'border-xova-elements-borderColorActive bg-xova-elements-item-backgroundAccent'
          : 'border-xova-elements-borderColor',
      )}
    >
      <div className="flex items-center gap-2">
        <strong className="text-sm">{label}</strong>
        <span
          className={classNames(
            'ml-auto w-9 h-5 rounded-full relative transition-theme',
            value
              ? 'bg-gradient-to-r from-[var(--xova-accent-glow)] to-[var(--xova-accent-cyan)]'
              : 'bg-xova-elements-bg-depth-4',
          )}
        >
          <span
            className={classNames(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200',
              value ? 'left-[18px]' : 'left-0.5',
            )}
          />
        </span>
      </div>
      <p className="text-xs text-xova-elements-textSecondary mt-1">{description}</p>
    </button>
  );
}

function Diagnostic({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-xova-elements-borderColor p-3">
      <span className="section-label">{label}</span>
      <p className="text-sm mt-1 break-words">{value}</p>
    </div>
  );
}
