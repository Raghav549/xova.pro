import type { GeneratedFile } from './types';

export interface PreviewAssets {
  html: string;
  entry: string;
  missing: string[];
}

const IMPORT_MAP = `<script type="importmap">{"imports":{"three":"https://esm.sh/three@0.169.0","three/":"https://esm.sh/three@0.169.0/","react":"https://esm.sh/react@18.3.1","react-dom":"https://esm.sh/react-dom@18.3.1","react-dom/client":"https://esm.sh/react-dom@18.3.1/client"}}</script>`;

function normalize(path: string): string {
  const clean = path
    .replace(/^\/home\/project\//, '')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
  const parts: string[] = [];

  for (const segment of clean.split('/')) {
    if (segment === '..') {
      parts.pop();
    } else if (segment !== '.' && segment !== '') {
      parts.push(segment);
    }
  }

  return parts.join('/');
}

function dirname(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

function resolve(from: string, target: string): string {
  if (/^(https?:)?\/\//.test(target) || target.startsWith('data:')) {
    return target;
  }

  return normalize(target.startsWith('/') ? target : `${dirname(from)}/${target}`);
}

const LOCAL_HINT = /\.(css|js|mjs|jsx|ts|tsx|json|svg|webmanifest)$/i;

/**
 * Builds a runnable, self-contained preview document from a set of generated
 * files. This is the "static preview engine" that keeps Xova useful even when
 * the in-browser Node runtime is unavailable.
 */
export function buildPreviewFromFiles(files: GeneratedFile[], fallback?: string): PreviewAssets {
  const map = new Map(files.map((file) => [normalize(file.path), file.content]));
  const missing: string[] = [];

  const entry =
    ['preview.html', 'index.html', 'public/index.html', 'src/index.html'].find((candidate) => map.has(candidate)) ??
    null;

  if (!entry) {
    if (fallback) {
      return { html: fallback, entry: 'generated', missing };
    }

    const firstHtml = [...map.keys()].find((path) => path.endsWith('.html'));

    if (!firstHtml) {
      return { html: emptyPreview(files), entry: 'none', missing };
    }

    return buildPreviewFromFiles([{ path: firstHtml, content: map.get(firstHtml) as string }], fallback);
  }

  let html = map.get(entry) as string;

  /* 1. inline local stylesheets */
  html = html.replace(/<link[^>]+href="([^"]+)"[^>]*>/gi, (match, href: string) => {
    const resolved = resolve(entry, href);

    if (!LOCAL_HINT.test(resolved)) {
      return match;
    }

    const content = map.get(resolved);

    if (content === undefined) {
      if (resolved.endsWith('.css')) {
        missing.push(resolved);
      }

      return match;
    }

    return `<style data-from="${resolved}">\n${content}\n</style>`;
  });

  /* 2. inline local module / classic scripts */
  html = html.replace(/<script([^>]*)src="([^"]+)"([^>]*)><\/script>/gi, (match, before: string, src: string) => {
    const resolved = resolve(entry, src);

    if (!LOCAL_HINT.test(resolved)) {
      return match;
    }

    const content = map.get(resolved);

    if (content === undefined) {
      /* vite entry points live in src/ and are TypeScript — no transpile step here */
      missing.push(resolved);
      return '';
    }

    if (/\.(ts|tsx|jsx)$/.test(resolved)) {
      missing.push(resolved);
      return '';
    }

    return `<script type="module" data-from="${resolved}">\n${content}\n</script>`;
  });

  /* 3. ensure ES imports for three/react resolve inside a sandboxed iframe */
  if (!html.includes('importmap')) {
    html = html.replace('</head>', `  ${IMPORT_MAP}\n  </head>`);
  }

  /* 4. make sure the document has a viewport (previews are viewed in device frames) */
  if (!html.includes('name="viewport"')) {
    html = html.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  if (missing.length > 0) {
    html = html.replace(
      '</body>',
      `  <script>console.warn('[xova-preview] skipped local entrypoints: ${missing.join(', ')}');</script>\n  </body>`,
    );
  }

  return { html, entry, missing };
}

function emptyPreview(files: GeneratedFile[]): string {
  const list = files
    .slice(0, 40)
    .map((file) => `<li><code>${file.path}</code></li>`)
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#07070d;color:#e8ecff;font:15px/1.6 ui-sans-serif,system-ui;padding:34px}
h1{font-size:20px;margin:0 0 6px}p{opacity:.7}code{background:#ffffff12;padding:2px 6px;border-radius:6px}
ul{padding-left:18px;columns:2;gap:22px}</style></head>
<body><h1>Project files staged</h1><p>This build has no HTML entry point yet — the files below are ready in the editor.</p>
<ul>${list}</ul></body></html>`;
}

export function findEntry(files: GeneratedFile[]): string | null {
  return files.find((file) => /(^|\/)(preview|index)\.html$/.test(file.path))?.path ?? null;
}
