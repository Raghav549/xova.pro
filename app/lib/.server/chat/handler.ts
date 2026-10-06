import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { resolveLlmConfig } from '~/lib/.server/llm/api-key';
import { PROVIDERS } from '~/lib/.server/llm/model';
import { streamText, type Messages } from '~/lib/.server/llm/stream-text';
import { chunkText, enhancePromptLocally, generateProject, planNarrative, type PlanOptions } from '~/lib/engine';
import type { Platform } from '~/lib/engine/types';
import { stripIndents } from '~/utils/stripIndent';

interface ChatRequestBody {
  messages: Messages;
  options?: {
    platforms?: Platform[];
    archetype?: PlanOptions['archetype'];
    motion3d?: boolean;
    backend?: PlanOptions['backend'];
    theme?: string;
    provider?: string;
    model?: string;
    key?: string;
    baseURL?: string;
  };
}

interface EnhancerBody {
  message: string;
  options?: { provider?: string; model?: string; key?: string; baseURL?: string };
}

const encoder = new TextEncoder();

export async function chatAction({ context, request }: ActionFunctionArgs) {
  const body = await request.json<ChatRequestBody>();
  const messages: Messages = Array.isArray(body.messages) ? body.messages : [];
  const options = body.options ?? {};

  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const prompt = lastUser?.content ?? '';

  const config = resolveLlmConfig(context?.cloudflare?.env as Env, {
    provider: options.provider,
    model: options.model,
    key: options.key,
    baseURL: options.baseURL,
  });

  const planOptions: PlanOptions = {
    platforms: options.platforms,
    archetype: options.archetype,
    motion3d: options.motion3d,
    backend: options.backend,
    themeId: options.theme,
  };

  /* no key configured: build the project with the deterministic Xova build engine */
  if (!config.apiKey || options.provider === 'local') {
    const result = generateProject(prompt, planOptions);

    return pacedTextResponse(`${planNarrative(result.blueprint)}\n\n${result.artifactText}`, {
      engine: 'xova-build-engine',
      blueprint: result.blueprint,
    });
  }

  const preset = PROVIDERS.find((candidate) => candidate.id === config.provider);

  try {
    const result = await streamText(
      messages,
      context?.cloudflare?.env as Env,
      { toolChoice: 'none' },
      { provider: options.provider, model: options.model, key: options.key, baseURL: options.baseURL },
      { platforms: options.platforms, motion3d: options.motion3d, backend: options.backend, theme: options.theme },
    );

    return byteStreamResponse(result.textStream, {
      engine: config.provider,
      model: config.model,
      label: preset?.label ?? config.provider,
    });
  } catch (error) {
    console.error('[api.chat] provider failed, falling back to the local engine', error);

    const result = generateProject(prompt, planOptions);
    const preface = `> Provider \`${config.provider}\` was unavailable (${
      (error as Error).message
    }). Falling back to the local Xova build engine.\n\n`;

    return pacedTextResponse(`${preface}${planNarrative(result.blueprint)}\n\n${result.artifactText}`, {
      engine: 'xova-build-engine',
      blueprint: result.blueprint,
    });
  }
}

export async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, options = {} } = await request.json<EnhancerBody>();
  const config = resolveLlmConfig(context?.cloudflare?.env as Env, {
    provider: options.provider,
    model: options.model,
    key: options.key,
    baseURL: options.baseURL,
  });

  if (!config.apiKey) {
    return pacedTextResponse(enhancePromptLocally(message), {
      engine: 'xova-build-engine',
      chunkSize: 26,
      interval: 12,
    });
  }

  try {
    const result = await streamText(
      [
        {
          role: 'user',
          content: stripIndents`
            Improve the prompt wrapped in <original_prompt> so it produces a production-grade, beautiful, fully working application.

            Requirements for your rewrite:
            - Keep the user's intent and any names they used.
            - Specify the visual direction: palette, type, spacing, signature interaction.
            - Specify motion and, when relevant, real 3D physics (gravity, collisions, pointer impulses).
            - Specify the stack, routing, data layer and whether a backend/database/auth is needed.
            - Specify target platforms (web, PWA, Android/iOS) and accessibility/performance budgets.

            IMPORTANT: Respond with the improved prompt only — no preamble, no explanation.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      context?.cloudflare?.env as Env,
      { toolChoice: 'none' },
      { provider: options.provider, model: options.model, key: options.key, baseURL: options.baseURL },
    );

    return byteStreamResponse(result.textStream, { engine: config.provider });
  } catch (error) {
    console.error('[api.enhancer] provider failed, using the local enhancer', error);

    return pacedTextResponse(enhancePromptLocally(message), {
      engine: 'xova-build-engine',
      chunkSize: 26,
      interval: 12,
    });
  }
}

/**
 * Streams generated text at a realistic cadence so the studio can render its
 * live code-stream animation. Chunk size adapts to the payload size.
 */
function pacedTextResponse(
  text: string,
  meta: { engine: string; blueprint?: unknown; chunkSize?: number; interval?: number },
): Response {
  const chunkSize = meta.chunkSize ?? Math.max(56, Math.ceil(text.length / 620));
  const chunks = chunkText(text, chunkSize);
  const interval = meta.interval ?? Math.min(24, Math.max(7, Math.round(9000 / chunks.length)));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
      'x-xova-engine': meta.engine,
      ...(meta.blueprint ? { 'x-xova-blueprint': encodeURIComponent(JSON.stringify(summarize(meta.blueprint))) } : {}),
    },
  });
}

function byteStreamResponse(
  stream: ReadableStream<string>,
  meta: { engine: string; model?: string; label?: string },
): Response {
  const bytes = stream.pipeThrough(
    new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(chunk));
      },
    }),
  );

  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
      'x-xova-engine': meta.engine,
      ...(meta.model ? { 'x-xova-model': meta.model } : {}),
      ...(meta.label ? { 'x-xova-engine-label': meta.label } : {}),
    },
  });
}

function summarize(blueprint: unknown) {
  const bp = blueprint as Record<string, unknown>;

  return {
    slug: bp.slug,
    title: bp.title,
    brand: bp.brand,
    archetype: bp.archetype,
    theme: bp.theme,
    platforms: bp.platforms,
    slides: bp.slides,
    metrics: bp.metrics,
    sections: bp.sections,
    stack: bp.stack,
    quality: bp.quality,
    physics: bp.physics,
    backend: bp.backend,
  };
}
