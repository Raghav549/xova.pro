import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

type ReactDOMServerAPI =
  | {
      mode: 'web';
      renderToReadableStream: (
        children: React.ReactNode,
        options?: object,
      ) => Promise<ReadableStream<Uint8Array> & { allReady: Promise<void> }>;
    }
  | {
      mode: 'pipe';
      renderToPipeableStream: (
        children: React.ReactNode,
        options?: object,
      ) => { pipe: (destination: unknown) => unknown };
    };

/**
 * `react-dom/server` resolves to different builds per platform: edge/worker
 * runtimes (Cloudflare) get `renderToReadableStream`, while Node.js based
 * platforms (Vercel) only expose `renderToPipeableStream`. The package is
 * CommonJS, so the exports also have to be resolved through the default
 * export at runtime. Detect what is available and render accordingly so a
 * single entry server works everywhere.
 */
async function getReactDOMServerAPI(): Promise<ReactDOMServerAPI> {
  const namespace = (await import('react-dom/server')) as unknown as {
    renderToReadableStream?: unknown;
    renderToPipeableStream?: unknown;
    default?: Record<string, unknown>;
  };

  const api = (namespace.default ?? namespace) as Record<string, unknown>;

  if (typeof api.renderToReadableStream === 'function') {
    return {
      mode: 'web',
      renderToReadableStream: api.renderToReadableStream as Extract<
        ReactDOMServerAPI,
        { mode: 'web' }
      >['renderToReadableStream'],
    };
  }

  if (typeof api.renderToPipeableStream === 'function') {
    return {
      mode: 'pipe',
      renderToPipeableStream: api.renderToPipeableStream as Extract<
        ReactDOMServerAPI,
        { mode: 'pipe' }
      >['renderToPipeableStream'],
    };
  }

  throw new Error('react-dom/server provides neither renderToReadableStream nor renderToPipeableStream');
}

/**
 * Bridges a Node.js readable stream to a web `ReadableStream` without pulling
 * `@remix-run/node` (and its Node-only dependencies) into the worker bundle.
 */
function nodeReadableToWebStream(readable: import('node:stream').Readable, encoder: TextEncoder) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      readable.on('data', (chunk: Buffer | string) => {
        controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : new Uint8Array(chunk));
      });
      readable.on('end', () => controller.close());
      readable.on('error', (error) => controller.error(error));
    },
    cancel() {
      readable.destroy();
    },
  });
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const isBot = isbot(request.headers.get('user-agent') || '');
  const head = renderHeadToString({ request, remixContext, Head });
  const prefix = `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`;
  const suffix = `</div></body></html>`;
  const encoder = new TextEncoder();

  const onError = (error: unknown) => {
    console.error(error);
    responseStatusCode = 500;
  };

  const api = await getReactDOMServerAPI();

  let body: ReadableStream<Uint8Array>;

  if (api.mode === 'web') {
    const readable = await api.renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
      signal: request.signal,
      onError,
    });

    body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(prefix));

        const reader = readable.getReader();

        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.enqueue(encoder.encode(suffix));
                controller.close();

                return;
              }

              controller.enqueue(value);
              read();
            })
            .catch((error) => {
              controller.error(error);
              readable.cancel();
            });
        }
        read();
      },

      cancel() {
        readable.cancel();
      },
    });

    if (isBot) {
      await readable.allReady;
    }
  } else {
    const { PassThrough, Transform } = await import('node:stream');

    const output = new PassThrough();
    output.write(prefix);

    // appends the closing markup once React has finished streaming
    const suffixer = new Transform({
      transform(chunk, _encoding, callback) {
        callback(null, chunk);
      },
      flush(callback) {
        callback(null, suffix);
      },
    });

    suffixer.pipe(output);

    let resolveAllReady: () => void;
    const allReady = new Promise<void>((resolve) => {
      resolveAllReady = resolve;
    });

    let started = false;

    function pipeOnce() {
      if (started) {
        return;
      }

      started = true;
      stream.pipe(suffixer);
    }

    const stream = api.renderToPipeableStream(<RemixServer context={remixContext} url={request.url} />, {
      onError,
      onShellReady: isBot ? undefined : pipeOnce,
      onAllReady() {
        resolveAllReady();
        pipeOnce();
      },
    });

    if (isBot) {
      await allReady;
    }

    body = nodeReadableToWebStream(output, encoder);
  }

  responseHeaders.set('Content-Type', 'text/html');

  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
