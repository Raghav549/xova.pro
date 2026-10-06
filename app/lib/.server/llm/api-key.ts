import { env } from 'node:process';
import { isProviderId, providerPreset, PROVIDERS, type LlmConfig, type ProviderId } from './model';

export interface CredentialOverrides {
  provider?: string | null;
  model?: string | null;
  key?: string | null;
  baseURL?: string | null;
}

function readEnv(name: string | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  return (env as Record<string, string | undefined>)[name];
}

/**
 * Resolve credentials for a request.
 *
 * Priority: per-request headers (bring-your-own-key from the studio settings) →
 * Cloudflare/worker bindings → process env. Users can therefore run Xova with a
 * key in the dashboard or paste their own into the UI.
 */
export function resolveLlmConfig(cloudflareEnv: Env | undefined, overrides: CredentialOverrides = {}): LlmConfig {
  const requested: ProviderId = isProviderId(overrides.provider ?? undefined)
    ? (overrides.provider as ProviderId)
    : detectProvider(cloudflareEnv);

  const preset = providerPreset(requested);
  const binding = (cloudflareEnv ?? {}) as unknown as Record<string, string | undefined>;

  const apiKey =
    overrides.key?.trim() ||
    binding[preset.envKey] ||
    readEnv(preset.envKey) ||
    binding.XOVA_API_KEY ||
    readEnv('XOVA_API_KEY');

  const baseURL = overrides.baseURL?.trim() || binding.XOVA_BASE_URL || readEnv('XOVA_BASE_URL') || preset.baseURL;
  const model = overrides.model?.trim() || (requested === preset.id ? preset.defaultModel : preset.defaultModel);

  return { provider: requested, model, apiKey, baseURL };
}

function detectProvider(cloudflareEnv: Env | undefined): ProviderId {
  const binding = (cloudflareEnv ?? {}) as unknown as Record<string, string | undefined>;

  for (const preset of PROVIDERS) {
    if (binding[preset.envKey] || readEnv(preset.envKey)) {
      return preset.id;
    }
  }

  return 'anthropic';
}

export function hasAnyKey(cloudflareEnv: Env | undefined): boolean {
  const binding = (cloudflareEnv ?? {}) as unknown as Record<string, string | undefined>;

  return PROVIDERS.some((preset) => Boolean(binding[preset.envKey] || readEnv(preset.envKey)));
}

export function configuredProviders(cloudflareEnv: Env | undefined): string[] {
  const binding = (cloudflareEnv ?? {}) as unknown as Record<string, string | undefined>;

  return PROVIDERS.filter((preset) => Boolean(binding[preset.envKey] || readEnv(preset.envKey))).map(
    (preset) => preset.id,
  );
}

/** Legacy helper kept so older imports keep working. */
export function getAPIKey(cloudflareEnv: Env) {
  return resolveLlmConfig(cloudflareEnv).apiKey ?? '';
}
