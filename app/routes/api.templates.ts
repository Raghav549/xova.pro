import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { DEMO_PROMPTS, generateProject, blueprintSummary } from '~/lib/engine';
import type { Platform } from '~/lib/engine/types';

const TEMPLATES = DEMO_PROMPTS.map((demo, index) => ({
  id: demo.archetype,
  slug: demo.archetype,
  name: demo.label,
  prompt: demo.prompt,
  archetype: demo.archetype,
  accent: ['#7c5cff', '#22d3ee', '#ff5fa2', '#34d399', '#fbbf24', '#38bdf8'][index % 6],
  tags: demo.archetype.split('-'),
}));

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const archetype = url.searchParams.get('archetype');

  if (archetype) {
    const match = TEMPLATES.find((template) => template.archetype === archetype);

    if (!match) {
      return json({ error: 'not_found' }, { status: 404 });
    }

    const result = generateProject(match.prompt, { archetype: match.archetype as never });

    return json({ template: match, blueprint: blueprintSummary(result.blueprint), files: result.files.length });
  }

  return json({ templates: TEMPLATES, count: TEMPLATES.length });
}

interface GenerateBody {
  prompt: string;
  platforms?: Platform[];
  archetype?: string;
  motion3d?: boolean;
  backend?: 'auto' | 'none' | 'api' | 'full';
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json<GenerateBody>();

  if (!body?.prompt || body.prompt.trim().length < 3) {
    return json({ error: 'prompt_too_short' }, { status: 422 });
  }

  const result = generateProject(body.prompt, {
    platforms: body.platforms,
    archetype: body.archetype as never,
    motion3d: body.motion3d,
    backend: body.backend,
  });

  return json({
    blueprint: blueprintSummary(result.blueprint),
    stats: result.stats,
    files: result.files.map((file) => ({ path: file.path, size: file.content.length })),
  });
}
