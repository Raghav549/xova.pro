import type { HeadersFunction, MetaFunction } from '@remix-run/cloudflare';
import { Suspense, lazy } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

const Studio = lazy(() => import('~/components/studio/Studio').then((module) => ({ default: module.Studio })));

export const meta: MetaFunction = () => [
  { title: 'Xova Studio — build web, Android and 3D physics apps with AI' },
  {
    name: 'description',
    content:
      'Prompt, preview and ship: the Xova Studio generates real project files with a live preview panel, build slides, a live code stream and one-click export.',
  },
];

/**
 * Cross-origin isolation is what lets the in-browser Node runtime (WebContainer)
 * boot. `credentialless` keeps third-party assets (fonts, CDNs) loading without
 * requiring CORP headers, so the studio degrades gracefully everywhere else.
 */
export const headers: HeadersFunction = () => ({
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Origin-Agent-Cluster': '?1',
});

export default function StudioIndex() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ClientOnly fallback={<StudioBootScreen />}>
        {() => (
          <Suspense fallback={<StudioBootScreen />}>
            <Studio />
          </Suspense>
        )}
      </ClientOnly>
    </div>
  );
}

function StudioBootScreen() {
  return (
    <div className="xv-app-shell h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="i-svg-spinners:90-ring-with-bg text-3xl text-xova-accent-cyan" />
        <p className="text-sm text-xova-elements-textSecondary">Booting Xova Studio…</p>
      </div>
    </div>
  );
}
