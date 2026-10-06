import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { configuredProviders } from '~/lib/.server/llm/api-key';
import { PROVIDERS } from '~/lib/.server/llm/model';

export async function loader({ context }: LoaderFunctionArgs) {
  const configured = configuredProviders(context?.cloudflare?.env as Env);

  return json({
    engine: 'xova-build-engine',
    providers: PROVIDERS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      defaultModel: preset.defaultModel,
      models: preset.models,
      envKey: preset.envKey,
      hint: preset.hint,
      configured: configured.includes(preset.id),
    })),
    local: {
      id: 'local',
      label: 'Xova Build Engine',
      hint: 'Deterministic generator — runs with no API key, produces real multi-file projects.',
      configured: true,
    },
  });
}
