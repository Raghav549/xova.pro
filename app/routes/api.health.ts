import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { configuredProviders } from '~/lib/.server/llm/api-key';

export async function loader({ context }: LoaderFunctionArgs) {
  const configured = configuredProviders(context?.cloudflare?.env as Env);

  return json(
    {
      ok: true,
      service: 'xova',
      version: '2.0.0',
      engine: 'xova-build-engine',
      providers: configured,
      capabilities: [
        'web-apps',
        'android-apps',
        'ios-wrappers',
        'pwa',
        'motion-3d-physics',
        'backends',
        'databases',
        'auth',
        'static-preview',
        'webcontainer-runtime',
        'zip-export',
      ],
      time: new Date().toISOString(),
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  );
}
