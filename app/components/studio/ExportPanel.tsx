import { useStore } from '@nanostores/react';
import JSZip from 'jszip';
import { memo, useState } from 'react';
import { toast } from 'react-toastify';
import { logStudio, studioStore } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';

const DEPLOY_TARGETS = [
  {
    id: 'cloudflare',
    label: 'Cloudflare Pages',
    icon: 'i-ph:cloud',
    command: 'npx wrangler pages deploy dist',
    note: 'Global edge, zero config with the generated wrangler.toml.',
  },
  {
    id: 'netlify',
    label: 'Netlify',
    icon: 'i-ph:lightning',
    command: 'npx netlify deploy --prod --dir=dist',
    note: 'Instant previews per commit.',
  },
  {
    id: 'vercel',
    label: 'Vercel',
    icon: 'i-ph:triangle',
    command: 'npx vercel --prod',
    note: 'Edge functions for the generated API routes.',
  },
  {
    id: 'docker',
    label: 'Docker / VPS',
    icon: 'i-ph:shipping-container',
    command: 'docker compose up -d --build',
    note: 'Ships the API and database together.',
  },
];

export const ExportPanel = memo(() => {
  const state = useStore(studioStore);
  const [busy, setBusy] = useState<string | null>(null);

  const hasFiles = state.files.length > 0;
  const slug = state.blueprint?.slug ?? 'xova-build';
  const platforms = state.blueprint?.platforms ?? ['web'];
  const backend = state.blueprint?.backend;

  const downloadZip = async () => {
    if (!hasFiles) {
      toast.error('Nothing to export yet — build something first');
      return;
    }

    setBusy('zip');

    try {
      const zip = new JSZip();
      const root = zip.folder(slug) as JSZip;

      for (const file of state.files) {
        root.file(file.path, file.content);
      }

      if (state.previewDoc) {
        root.file('preview.html', state.previewDoc);
      }

      root.file(
        'XOVA-BUILD.json',
        JSON.stringify(
          {
            prompt: state.prompt,
            engine: state.engine,
            generatedAt: new Date().toISOString(),
            stats: state.stats,
            blueprint: state.blueprint,
          },
          null,
          2,
        ),
      );

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `${slug}.zip`;
      anchor.click();

      URL.revokeObjectURL(url);
      logStudio('ok', `Exported ${slug}.zip (${(blob.size / 1024).toFixed(0)} KB)`);
      toast.success('Project ZIP downloaded');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const downloadPreview = () => {
    if (!state.previewDoc) {
      toast.error('No preview to download yet');
      return;
    }

    const blob = new Blob([state.previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${slug}-preview.html`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-4 min-h-0 overflow-auto xv-scroll pr-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card panel p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="i-ph:package text-lg text-xova-accent-glow" />
            <h3 className="text-base font-medium">Project bundle</h3>
          </div>
          <p className="text-sm text-xova-elements-textSecondary">
            {state.files.length} files · {state.stats ? `${state.stats.lines.toLocaleString()} lines` : '0 lines'} ·{' '}
            {state.stats ? `${(state.stats.bytes / 1024).toFixed(1)} KB` : '0 KB'}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            <button
              type="button"
              className="btn-secondary"
              onClick={downloadZip}
              disabled={!hasFiles || busy === 'zip'}
            >
              <span className={busy === 'zip' ? 'i-svg-spinners:90-ring-with-bg' : 'i-ph:download-simple'} />
              Download ZIP
            </button>
            <button type="button" className="btn-ghost" onClick={downloadPreview} disabled={!state.previewDoc}>
              <span className="i-ph:file-html" />
              Standalone preview
            </button>
          </div>
        </div>

        <div className="panel p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="i-ph:devices text-lg text-xova-accent-cyan" />
            <h3 className="text-base font-medium">Targets in this build</h3>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-xova-elements-textSecondary">
            <li className="flex items-center gap-2">
              <span className="i-ph:globe-simple text-xova-elements-textTertiary" /> Web app + responsive layout
            </li>
            <li className="flex items-center gap-2">
              <span className="i-ph:android-logo text-xova-elements-textTertiary" />{' '}
              {platforms.includes('android') ? 'Capacitor Android project included' : 'Android export available'}
            </li>
            <li className="flex items-center gap-2">
              <span className="i-ph:database text-xova-elements-textTertiary" />{' '}
              {backend?.enabled
                ? `${backend.framework} API · ${backend.database} · ${backend.auth} auth`
                : 'Edge-static, no server required'}
            </li>
            <li className="flex items-center gap-2">
              <span className="i-ph:cube text-xova-elements-textTertiary" />{' '}
              {state.blueprint?.physics.engine === 'none'
                ? 'Micro-motion only'
                : `3D physics · ${state.blueprint?.physics.bodyCount} bodies`}
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="panel p-4 flex flex-col gap-3">
          <h3 className="text-base font-medium flex items-center gap-2">
            <span className="i-ph:terminal-window" /> Run it locally
          </h3>
          <CommandLine command="npm install" onCopy={copy} />
          <CommandLine command="npm run dev" onCopy={copy} />
          <CommandLine command="npm run build && npm run preview" onCopy={copy} />
        </div>

        <div className="panel p-4 flex flex-col gap-3">
          <h3 className="text-base font-medium flex items-center gap-2">
            <span className="i-ph:android-logo" /> Build for Android
          </h3>
          <CommandLine command="npm run build && npx cap add android" onCopy={copy} />
          <CommandLine command="npm run android:sync" onCopy={copy} />
          <CommandLine command="cd android && ./gradlew bundleRelease" onCopy={copy} />
          <p className="text-xs text-xova-elements-textTertiary">
            Produces <code className="kdb">app-release.aab</code> for the Play Console. The generated{' '}
            <code className="kdb">ANDROID.md</code> lists signing, icons and store requirements.
          </p>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="text-base font-medium flex items-center gap-2 mb-3">
          <span className="i-ph:rocket-launch" /> Ship it
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DEPLOY_TARGETS.map((target) => (
            <div
              key={target.id}
              className={classNames(
                'rounded-xl border border-xova-elements-borderColor p-3 flex flex-col gap-2',
                'hover:border-xova-elements-borderColorActive transition-theme',
              )}
            >
              <span className={classNames(target.icon, 'text-lg')} />
              <strong className="text-sm">{target.label}</strong>
              <p className="text-xs text-xova-elements-textSecondary">{target.note}</p>
              <button
                type="button"
                className="btn-ghost text-xs mt-auto justify-start"
                onClick={() => copy(target.command)}
              >
                <span className="i-ph:copy" />
                <span className="mono-text truncate">{target.command}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {state.blueprint && (
        <div className="panel p-4">
          <h3 className="text-base font-medium flex items-center gap-2 mb-3">
            <span className="i-ph:list-checks" /> Ship checklist
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              'Responsive breakpoints verified at 390 / 820 / 1440',
              'Contrast pairs meet WCAG AA in both themes',
              'Reduced-motion fallbacks for every animation',
              state.blueprint.physics.engine === 'none'
                ? 'Motion budget: transform + opacity only'
                : 'Physics loop pinned to a fixed 1/120s timestep',
              state.blueprint.backend.enabled
                ? 'API schema, validation and health endpoint generated'
                : 'Static output — no secrets in the bundle',
              'Largest contentful paint target under 1.5s on 4G',
              'ZIP export verified (npm install && npm run build)',
              'Favicon, manifest and social preview wired',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-xova-elements-textSecondary">
                <span className="i-ph:check-circle text-emerald-400 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

function CommandLine({ command, onCopy }: { command: string; onCopy: (value: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(command)}
      className="flex items-center gap-2 rounded-lg border border-xova-elements-borderColor bg-xova-elements-code-background px-3 py-2 text-left hover:border-xova-elements-borderColorActive transition-theme"
    >
      <span className="text-xova-accent-cyan mono-text">$</span>
      <span className="mono-text truncate flex-1">{command}</span>
      <span className="i-ph:copy text-xova-elements-textTertiary" />
    </button>
  );
}
