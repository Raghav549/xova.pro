import type { MetaFunction } from '@remix-run/cloudflare';
import { Suspense, lazy } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { useParams } from '@remix-run/react';

const Studio = lazy(() => import('~/components/studio/Studio').then((module) => ({ default: module.Studio })));

export const meta: MetaFunction = () => [{ title: 'Xova Studio — saved build' }];

export default function StudioWithProject() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-screen w-full overflow-hidden">
      <ClientOnly fallback={<Boot />}>
        {() => (
          <Suspense fallback={<Boot />}>
            <Studio projectId={id} />
          </Suspense>
        )}
      </ClientOnly>
    </div>
  );
}

function Boot() {
  return (
    <div className="xv-app-shell h-full w-full flex items-center justify-center">
      <span className="i-svg-spinners:90-ring-with-bg text-3xl text-xova-accent-cyan" />
    </div>
  );
}
