import type { AppLoadContext } from '@remix-run/cloudflare';
import { env as nodeEnv } from 'node:process';

/**
 * Returns the server environment variables, no matter which platform the app
 * is deployed to.
 *
 * - On Cloudflare Pages the variables come from the worker bindings exposed
 *   through `context.cloudflare.env`.
 * - On Node.js based platforms (e.g. Vercel) they come from `process.env`.
 */
export function getServerEnv(context: AppLoadContext): Env {
  const cloudflareEnv = (context as { cloudflare?: { env?: Env } }).cloudflare?.env;

  if (cloudflareEnv) {
    return cloudflareEnv;
  }

  return nodeEnv as unknown as Env;
}
