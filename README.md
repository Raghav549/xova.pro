# Xova — the AI build studio

Xova turns a prompt into a **real project**: production websites with cinematic motion, WebGL
experiences running an actual rigid-body physics simulation, installable Android apps and
full-stack backends with typed APIs, databases, auth, Docker and CI.

Everything is generated as ordinary source files you own. Preview it in the studio, edit it in the
built-in editor, export it as a ZIP, or push it straight to a host.

> **No API key required.** Xova ships a deterministic build engine that runs entirely in the
> browser. Add an LLM provider key only when you want free-form generation — the studio falls back
> to the local engine automatically if a provider is missing or fails.

---

## What it builds

| Target | What you get |
| --- | --- |
| **Web apps** | Vite + TypeScript (or React) project: design tokens, fluid type scale, responsive grid, routing, forms, PWA manifest, favicon, SEO meta |
| **3D motion + physics** | Three.js hero driven by an in-browser rigid-body solver — gravity, restitution, friction, sphere–sphere collisions, pointer/touch impulses, fixed 1/120s timestep, reduced-motion fallback |
| **Android / iOS** | Capacitor project with `capacitor.config.json`, `AndroidManifest.xml`, gradle config, PWA install path and a Play Store signing checklist (`ANDROID.md`) |
| **Backends** | Hono (or Express) API with zod validation, structured errors, health endpoint, Drizzle schema + migrations, sessions/JWT, SSE realtime, Dockerfile, docker-compose, CI workflow |
| **Slides + stream** | Every build narrates itself: a swipeable six-stage deck and a live code stream with syntax highlighting, a moving caret and per-file status |

## The studio

`/studio` is the workbench:

- **Build slides** — touch/drag/keyboard deck covering brief → design system → interface → motion →
  data → ship. The deck advances itself as the real build progresses.
- **Live code stream** — files appear chunk by chunk with syntax highlighting, a caret and a file
  rail. Never a fake progress bar: it renders the bytes the engine is writing.
- **Preview panel** — device-accurate frames (desktop/laptop/tablet/phone), rotate, zoom,
  fullscreen, open-in-tab. Two renderers: the in-browser Node runtime when available, and a static
  preview compiler that always works.
- **Code tab** — file tree, syntax-highlighted source for every generated file, inline editing that
  re-applies CSS/preview changes live, per-file download.
- **Runtime tab** — WebContainer editor + terminal when cross-origin isolation is available, with an
  honest diagnostic panel when it is not.
- **Export tab** — ZIP export, standalone `preview.html`, local/Android/Docker command recipes,
  deploy targets and a ship checklist.
- **Build logs** — timestamped engine events, provider selection, file writes and timings.

Everything the studio generates is persisted locally (IndexedDB) and browsable in `/dashboard`.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page: live in-browser generator, product tour, capability bento, starter briefs |
| `/studio`, `/studio/:id` | The build studio (fresh or a stored build) |
| `/templates` | Searchable template library generated from real briefs |
| `/dashboard` | Stored builds: activity chart, reopen, ZIP export, delete |
| `/pricing` | Plans, comparison table, FAQ |
| `/docs` | Engine documentation with a scroll-spy sidebar |
| `/settings` | Engine/provider configuration, behaviour toggles, diagnostics |
| `/changelog`, `/contact`, `/legal/:doc` | Release notes, working contact form, legal documents |
| `/chat/:id` | Legacy redirect to `/studio/:id` |

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service status, version, configured providers, capabilities |
| `GET` | `/api/models` | Providers, models, whether a key is present |
| `GET` | `/api/templates` | Template catalogue (or generate metadata for `?archetype=`) |
| `POST` | `/api/templates` | `{ prompt, platforms, motion3d, backend }` → blueprint + file list |
| `POST` | `/api/chat` | `{ messages, options }` → `text/plain` stream of plan + artifact markup |
| `POST` | `/api/enhancer` | `{ message }` → `text/plain` enhanced prompt |

## How a build works

```
prompt ─► planner ─┬─► blueprint   (archetype, theme, sections, stack, slides, physics, backend)
                   ├─► sections    (HTML for each section, real copy)
                   ├─► project     (design system CSS, runtime, Vite/React/Android/backend files)
                   └─► artifact    (<xovaArtifact>/<xovaAction> markup streamed to the studio)
```

- `app/lib/engine/blueprint.ts` — intent → archetype, platforms, theme, stack, physics, backend spec.
- `app/lib/engine/sections.ts` — the section library (nav, hero, features, pricing, dashboard, store,
  blog, FAQ, CTA, footer…) rendered as semantic HTML with tokens.
- `app/lib/engine/runtime-script.ts` — the client runtime inlined into generated sites: reveals,
  magnetic buttons, tilt, cart, filters, forms, parallax and the Three.js rigid-body hero.
- `app/lib/engine/project.ts` — the file tree: design system, Vite config, tsconfig, PWA assets, CI,
  Capacitor/Android, Hono API, schema, Docker, README.
- `app/lib/engine/preview.ts` — the static preview compiler (inlines local CSS/JS, maps bare imports
  to CDN URLs) so previews render even without the in-browser runtime.
- `app/lib/engine/scanner.ts` — incremental artifact scanner that emits *partial* file content so the
  stream panel can render code as it is written.

The studio consumes the same `<xovaArtifact>` markup that an LLM produces, so provider-driven builds
and local builds share one pipeline.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Useful scripts:

```bash
npm run build        # production build (Remix + Vite)
npm test             # vitest — engine, scanner, preview compiler, message parser
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run deploy       # build + wrangler pages deploy
```

### Providers (optional)

Copy `.env.example` to `.env` and add a key, or paste one into **Studio → Build settings** (kept in
browser storage only). Anthropic, OpenAI, Google Gemini and any OpenAI-compatible endpoint
(Groq, OpenRouter, Ollama, vLLM…) are supported.

### Runtime notes

- **Static preview engine** — always available; compiles generated files into a self-contained
  document and renders it in a sandboxed frame.
- **In-browser Node runtime (WebContainer)** — needs cross-origin isolation. The `/studio` route
  sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless`,
  which keeps CDN assets loading. If a browser or wrapper prevents isolation, the studio detects it
  and continues with the static engine, terminals disabled, instead of hanging.

## Deploying

Xova targets Cloudflare Pages (`wrangler.toml` is included) and works on any Node/Bun host:

```bash
npm run build
npx wrangler pages deploy          # or: node ./functions/[[path]].ts style adapter
```

## Project layout

```
app/
  components/
    site/      marketing pages, motion hooks, live demo, 3D hero (r3f + cannon-es)
    studio/    studio shell, composer, slide deck, stream, preview, code, export, runtime, model bar
    chat/      markdown rendering, artifact cards, code blocks
    workbench/ editor panel, file tree, terminal (runtime mode)
  lib/
    engine/    the build engine (planner, copy, sections, project, preview, scanner, enhance)
    .server/   LLM providers, credentials, streaming, system prompt, route handlers
    stores/    nanostores state (studio, workbench, files, editor, runtime, theme, settings)
    persistence/ local project storage (IndexedDB)
  routes/      Remix routes: pages + /api/*
  styles/      design tokens, studio and site surfaces
```

## Testing

`npm test` covers the engine end-to-end: archetype/theme detection, blueprint integrity, generated
file tree, JSON manifest validity, generated-runtime syntax, standalone preview integrity, artifact
stream scanning, the streaming message parser and the static preview compiler.

## License

MIT — see [LICENSE](./LICENSE).
