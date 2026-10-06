import { heroCopy, navLinks, posts, products, pricingTiers, statsFor, testimonials } from './copy';
import { renderSections, renderFooter, renderNav, styleSheet } from './sections';
import { clientRuntime } from './runtime-script';
import type { Blueprint, GeneratedFile } from './types';

const HTML_ESCAPE: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

export function escapeHtml(value: string): string {
  return value.replace(/[<>&]/g, (char) => HTML_ESCAPE[char]);
}

export function fontLinks(): string {
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">',
  ].join('\n    ');
}

export function previewDoc(bp: Blueprint): string {
  const title = `${bp.brand} — ${bp.title}`;

  return `<!doctype html>
<html lang="en" data-theme="${bp.theme.mode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(bp.description)}" />
    <meta name="theme-color" content="${bp.theme.bg}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(bp.tagline)}" />
    <meta property="og:type" content="website" />
    ${fontLinks()}
    <style id="xv-styles">
${styleSheet(bp)}
    </style>
  </head>
  <body>
${renderSections(bp)}
    <script id="xv-runtime">
${clientRuntime(bp)}
    </script>
  </body>
</html>`;
}

function packageJson(bp: Blueprint): string {
  const react = wantsReact(bp);
  const deps: Record<string, string> = {};

  if (react) {
    deps.react = '^18.3.1';
    deps['react-dom'] = '^18.3.1';
  }

  if (bp.physics.engine !== 'none') {
    deps.three = '^0.169.0';
  }

  if (bp.backend.enabled) {
    deps.hono = '^4.6.3';
    deps['@hono/node-server'] = '^1.13.2';
  }

  const dev: Record<string, string> = {
    typescript: '^5.5.2',
    vite: '^5.4.8',
  };

  if (react) {
    dev['@vitejs/plugin-react'] = '^4.3.2';
    dev['@types/react'] = '^18.3.11';
    dev['@types/react-dom'] = '^18.3.1';
  }

  if (bp.physics.engine !== 'none') {
    dev['@types/three'] = '^0.169.0';
  }

  if (bp.platforms.includes('android') || bp.platforms.includes('ios')) {
    dev['@capacitor/core'] = '^6.1.2';
    dev['@capacitor/cli'] = '^6.1.2';
    dev['@capacitor/android'] = bp.platforms.includes('android') ? '^6.1.2' : (undefined as unknown as string);
  }

  const scripts: Record<string, string> = { dev: 'vite', build: 'vite build', preview: 'vite preview --port 4173' };

  if (bp.backend.enabled) {
    scripts.server = 'tsx server/index.ts';
    scripts['dev:all'] = 'concurrently "vite" "tsx watch server/index.ts"';
  }

  if (bp.platforms.includes('android')) {
    scripts['android:add'] = 'cap add android';
    scripts['android:sync'] = 'vite build && cap sync android';
    scripts['android:open'] = 'cap open android';
    scripts['android:apk'] = 'cd android && ./gradlew assembleRelease';
  }

  return `${JSON.stringify(
    {
      name: bp.slug,
      private: true,
      version: '0.1.0',
      type: 'module',
      description: bp.description,
      scripts,
      dependencies: deps,
      devDependencies: Object.fromEntries(Object.entries(dev).filter(([, value]) => value)),
    },
    null,
    2,
  )}\n`;
}

export function wantsReact(blueprint: Blueprint): boolean {
  return (
    blueprint.archetype === 'saas' ||
    blueprint.archetype === 'dashboard' ||
    blueprint.archetype === 'mobile-app' ||
    /react|next|dashboard|admin/.test(blueprint.prompt.toLowerCase())
  );
}

function indexHtml(bp: Blueprint): string {
  const react = wantsReact(bp);

  return `<!doctype html>
<html lang="en" data-theme="${bp.theme.mode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(bp.brand)} — ${escapeHtml(bp.title)}</title>
    <meta name="description" content="${escapeHtml(bp.description)}" />
    <meta name="theme-color" content="${bp.theme.bg}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    ${fontLinks()}
  </head>
  <body>
    ${react ? '<div id="root"></div>' : renderSections(bp)}
    <script type="module" src="/src/main.${react ? 'tsx' : 'ts'}"></script>
  </body>
</html>`;
}

function mainTs(bp: Blueprint, react: boolean): string {
  if (react) {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startMotion } from './motion.js';
import './styles.css';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(React.createElement(App));
}

startMotion();
`;
  }

  return `import { startMotion } from './motion.js';
import './styles.css';

startMotion();
`;
}

function motionJs(bp: Blueprint): string {
  return `/**
 * Motion + interaction layer for ${bp.brand}.
 * ${
   bp.physics.engine === 'none'
     ? 'Reveals, magnetic buttons and scroll choreography.'
     : 'Reveals plus the Three.js rigid-body hero scene.'
 }
 */
export function startMotion() {
  ${clientRuntime(bp).replace(/^\(function \(\) \{/, '(function () {')}
}
`;
}

function dataTs(bp: Blueprint): string {
  const react = wantsReact(bp);

  if (react) {
    return `export const brand = ${JSON.stringify(bp.brand)};
export const tagline = ${JSON.stringify(bp.tagline)};
export const description = ${JSON.stringify(bp.description)};
export const platforms = ${JSON.stringify(bp.platforms)};

export const kpis = ${JSON.stringify(
      statsFor(bp).map((stat) => ({ label: stat.label, value: stat.value })),
      null,
      2,
    )};

export const rows = ${JSON.stringify(
      ['Acme Studio', 'Northlight', 'Kettle & Co', 'Fieldnotes', 'Parallax Labs'].map((name, index) => ({
        id: index + 1,
        name,
        status: ['active', 'trialing', 'active', 'past due', 'active'][index],
        mrr: 1200 + index * 480,
      })),
      null,
      2,
    )};

export const series = ${JSON.stringify([64, 42, 78, 55, 88, 71, 96, 60, 82, 48, 74, 90])};
`;
  }

  return `export const nav = ${JSON.stringify(navLinks(bp))};
export const stats = ${JSON.stringify(statsFor(bp))};
export const products = ${JSON.stringify(products(bp))};
export const posts = ${JSON.stringify(posts(bp))};
export const testimonials = ${JSON.stringify(testimonials(bp).map((quote) => ({ ...quote, text: quote.text })))};
export const pricing = ${JSON.stringify(pricingTiers(bp))};
export const hero = ${JSON.stringify(heroCopy(bp))};
`;
}

function appTsx(_blueprint: Blueprint): string {
  return `import { useEffect, useMemo, useState } from 'react';
import { brand, description, kpis, rows, series, tagline } from './data';
import { useApi } from './lib/api';

type Tab = 'overview' | 'activity' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const { data, error } = useApi<{ ok: boolean; counts?: Record<string, number> }>('/api/health');
  const peak = useMemo(() => Math.max(...series), []);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1400);
    return () => window.clearInterval(id);
  }, [live]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><span className="mark" />{brand}</div>
        {(['overview', 'activity', 'settings'] as Tab[]).map((item) => (
          <button key={item} className={tab === item ? 'nav active' : 'nav'} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
        <div className="sidebar-footer">
          <span className={error ? 'status bad' : 'status'} />
          {error ? 'offline' : data ? 'api connected' : 'connecting…'}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{tagline}</h1>
            <p>{description}</p>
          </div>
          <button className={live ? 'button primary' : 'button'} onClick={() => setLive((value) => !value)}>
            {live ? 'Live • streaming' : 'Go live'}
          </button>
        </header>

        <section className="kpis">
          {kpis.map((kpi, index) => (
            <article key={kpi.label} className="kpi">
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <em>{live ? \`+\${(index + 1) * 3 + (tick % 7)}\` : 'steady'}</em>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="chart">
            {series.map((value, index) => (
              <i key={index} style={{ height: \`\${(value / peak) * 100}%\` }} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="table">
            {rows.map((row) => (
              <div className="row" key={row.id}>
                <span>{row.name}</span>
                <em>{row.status}</em>
                <span>\${row.mrr.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
`;
}

function reactStyles(bp: Blueprint): string {
  return `${styleSheet(bp)}

.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
.sidebar{border-right:1px solid var(--border);padding:22px 16px;display:flex;flex-direction:column;gap:6px;background:var(--bg-alt)}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--font-heading);font-size:19px;margin-bottom:18px}
.mark{width:24px;height:24px;border-radius:8px;background:conic-gradient(from 140deg,var(--accent),var(--accent-2),var(--accent-3),var(--accent))}
.nav{text-align:left;background:none;border:0;padding:10px 12px;border-radius:10px;color:var(--muted);transition:.2s}
.nav:hover{background:var(--surface);color:var(--text)}
.nav.active{background:color-mix(in oklab,var(--accent) 18%,transparent);color:var(--text)}
.sidebar-footer{margin-top:auto;display:flex;gap:8px;align-items:center;color:var(--muted);font-size:13px}
.status{width:8px;height:8px;border-radius:50%;background:#34d399}
.status.bad{background:#f87171}
.main{padding:clamp(20px,4vw,44px);display:grid;gap:24px;align-content:start}
.topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;flex-wrap:wrap}
.topbar h1{font-size:clamp(24px,3.4vw,38px)}
.topbar p{color:var(--muted);margin-top:8px;max-width:60ch}
.button{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:10px 16px;transition:.2s}
.button:hover{transform:translateY(-1px)}
.button.primary{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border-color:transparent}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
.kpi span{color:var(--muted);font-size:13px}
.kpi strong{display:block;font-family:var(--font-heading);font-size:26px;margin:6px 0}
.kpi em{font-style:normal;color:#34d399;font-size:13px}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px}
.chart{display:flex;align-items:flex-end;gap:8px;height:190px}
.chart i{flex:1;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--accent),var(--accent-2));transition:height .6s cubic-bezier(.2,.8,.2,1)}
.table{display:grid;gap:8px}
.row{display:grid;grid-template-columns:1fr auto auto;gap:14px;padding:12px;border:1px solid var(--border);border-radius:10px;color:var(--muted)}
.row em{font-style:normal;color:var(--accent)}
@media (max-width:820px){.app{grid-template-columns:1fr}.sidebar{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--border);align-items:center}.logo{margin:0 12px 0 0}.sidebar-footer{display:none}}
`;
}

function apiTs(bp: Blueprint): string {
  const base = bp.backend.enabled ? "const BASE = import.meta.env.VITE_API_URL ?? '';" : "const BASE = '';";

  return `import { useEffect, useState } from 'react';

${base}

/** Tiny typed fetch hook — swap the ${bp.backend.enabled ? `${bp.backend.framework} endpoint` : 'mock endpoint'} for your own API. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(BASE + path, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: T) => setData(payload))
      .catch((cause: unknown) => {
        if ((cause as Error).name !== 'AbortError') setError((cause as Error).message);
      });

    return () => controller.abort();
  }, [path]);

  return { data, error };
}
`;
}

function serverFiles(bp: Blueprint): GeneratedFile[] {
  const framework = bp.backend.framework;
  const port = 8787;
  const taskName = bp.slug.replace(/-/g, '_');

  const index = `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { items } from './routes/items';
${bp.backend.auth !== 'none' ? "import { auth } from './routes/auth';\n" : ''}/**
 * ${bp.brand} API — ${framework} · ${bp.backend.database} · ${bp.backend.api}
 * Generated by Xova. Start with: npm run server
 */
const app = new Hono();

app.use('*', logger());
app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: (origin) => origin ?? '*', credentials: true }));

app.get('/api/health', (c) =>
  c.json({ ok: true, service: '${bp.slug}', database: '${bp.backend.database}', uptime: process.uptime?.() ?? 0 }),
);

app.route('/api/items', items);
${bp.backend.auth !== 'none' ? "app.route('/api/auth', auth);\n" : ''}app.onError((error, c) => {
  console.error('[${bp.slug}]', error);
  return c.json({ error: 'internal_error' }, 500);
});

const port = Number(process.env.PORT ?? ${port});
serve({ fetch: app.fetch, port }, (info) => {
  console.log('${bp.brand} API listening on http://localhost:' + info.port);
});
`;

  const itemsRoute = `import { Hono } from 'hono';
import { z } from 'zod';
import { db, schema } from '../db';

export const items = new Hono();

const ItemInput = z.object({
  name: z.string().min(1).max(120),
  price: z.number().nonnegative().optional(),
  meta: z.record(z.unknown()).optional(),
});

items.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
  const rows = await db.select().from(schema.items).limit(limit);

  return c.json({ data: rows, limit });
});

items.post('/', async (c) => {
  const parsed = ItemInput.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.issues }, 422);
  }

  const [row] = await db.insert(schema.items).values(parsed.data).returning();

  return c.json({ data: row }, 201);
});
${
  bp.backend.realtime
    ? `
items.get('/stream', (c) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const rows = await db.select().from(schema.items).limit(25);
      controller.enqueue(encoder.encode('event: snapshot\\ndata: ' + JSON.stringify(rows) + '\\n\\n'));
      const timer = setInterval(() => controller.enqueue(encoder.encode(': ping\\n\\n')), 15000);

      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' },
  });
});
`
    : ''
}`;

  const authRoute = `import { Hono } from 'hono';
import { z } from 'zod';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db, schema } from '../db';

export const auth = new Hono();

const Credentials = z.object({ email: z.string().email(), password: z.string().min(8) });

function hash(password: string, salt: string) {
  return createHash('sha256').update(salt + password).digest('hex');
}

auth.post('/register', async (c) => {
  const parsed = Credentials.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ error: 'invalid_body' }, 422);
  }

  const salt = randomBytes(16).toString('hex');
  const [user] = await db
    .insert(schema.users)
    .values({ email: parsed.data.email, salt, passwordHash: hash(parsed.data.password, salt) })
    .returning({ id: schema.users.id, email: schema.users.email });

  return c.json({ data: user }, 201);
});

auth.post('/login', async (c) => {
  const parsed = Credentials.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ error: 'invalid_body' }, 422);
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  const candidate = user ? hash(parsed.data.password, user.salt) : '';
  const expected = user?.passwordHash ?? '';
  const valid = candidate.length === expected.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));

  if (!valid) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  return c.json({
    data: {
      userId: user.id,
      ${
        bp.backend.auth === 'jwt'
          ? "token: Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 86400000 })).toString('base64url'),"
          : "session: Buffer.from(randomBytes(24)).toString('base64url'),"
      }
    },
  });
});
`;

  const schemaFile = `/**
 * ${bp.brand} schema — ${bp.backend.orm} definitions for ${bp.backend.database}.
 * Run \`npm run db:push\` after editing.
 */
import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const items = sqliteTable('${taskName}_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').default(0),
  meta: text('meta', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`),
});
${
  bp.backend.auth !== 'none'
    ? `
export const users = sqliteTable('${taskName}_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  salt: text('salt').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`),
});
`
    : ''
}`;

  const dbIndex = `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const file = process.env.DATABASE_URL ?? 'data/${bp.slug}.db';
const client = new Database(file);

client.pragma('journal_mode = WAL');

export const db = drizzle(client, { schema });
export { schema };
`;

  const docker = `services:
  api:
    build: .
    command: npm run server
    ports: ['${port}:${port}']
    environment:
      - PORT=${port}
      - DATABASE_URL=/data/${bp.slug}.db
    volumes: ['api-data:/data']
${
  bp.backend.database === 'postgres' || bp.backend.database === 'mysql'
    ? `
  database:
    image: ${bp.backend.database === 'postgres' ? 'postgres:16-alpine' : 'mysql:8.4'}
    environment:
      - ${bp.backend.database === 'postgres' ? 'POSTGRES_PASSWORD=postgres' : 'MYSQL_ROOT_PASSWORD=root'}
    ports: ['${bp.backend.database === 'postgres' ? 5432 : 3306}:${bp.backend.database === 'postgres' ? 5432 : 3306}']
    volumes: ['db-data:/var/lib/${bp.backend.database === 'postgres' ? 'postgresql' : 'mysql'}']
`
    : ''
}volumes:
  api-data:
${bp.backend.database === 'postgres' || bp.backend.database === 'mysql' ? '  db-data:\n' : ''}`;

  const files: GeneratedFile[] = [
    { path: 'server/index.ts', content: index },
    { path: 'server/routes/items.ts', content: itemsRoute },
    { path: 'server/db/index.ts', content: dbIndex },
    { path: 'server/db/schema.ts', content: schemaFile },
    {
      path: '.env.example',
      content: `PORT=${port}\nDATABASE_URL=data/${bp.slug}.db\nSESSION_SECRET=change-me-${Math.random().toString(36).slice(2, 10)}\n`,
    },
    {
      path: 'server/README.md',
      content: `# ${bp.brand} API

- Framework: ${framework}
- Database: ${bp.backend.database} (${bp.backend.orm})
- API style: ${bp.backend.api}
- Auth: ${bp.backend.auth}${bp.backend.realtime ? '\n- Realtime: SSE stream at `/api/items/stream`' : ''}

## Run

\`\`\`bash
cp .env.example .env
npm install
npm run server     # http://localhost:${port}
\`\`\`

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | /api/health | Service + database status |
| GET | /api/items | Paginated list (\`?limit=\`) |
| POST | /api/items | Validated create |
${bp.backend.auth !== 'none' ? '| POST | /api/auth/register | Create an account |\n| POST | /api/auth/login | Session or JWT login |\n' : ''}`,
    },
  ];

  if (bp.backend.auth !== 'none') {
    files.push({ path: 'server/routes/auth.ts', content: authRoute });
  }

  if (bp.backend.docker) {
    files.push({ path: 'docker-compose.yml', content: docker });
    files.push({
      path: 'Dockerfile',
      content: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
RUN npm run build || true
EXPOSE ${port}
CMD ["npm", "run", "server"]
`,
    });
  }

  return files;
}

function androidFiles(bp: Blueprint): GeneratedFile[] {
  return [
    {
      path: 'capacitor.config.json',
      content: `${JSON.stringify(
        {
          appId: `com.${bp.slug.replace(/-/g, '')}.app`,
          appName: bp.brand,
          webDir: 'dist',
          bundledWebRuntime: false,
          android: { allowMixedContent: false, backgroundColor: bp.theme.bg },
          server: { androidScheme: 'https' },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: 'android/app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:label="${bp.brand}"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`,
    },
    {
      path: 'android/app/build.gradle',
      content: `apply plugin: 'com.android.application'

android {
    namespace "com.${bp.slug.replace(/-/g, '')}.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.${bp.slug.replace(/-/g, '')}.app"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "0.1.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "androidx.core:core-splashscreen:1.0.1"
    implementation project(':capacitor-android')
}
`,
    },
    {
      path: 'ANDROID.md',
      content: `# Shipping ${bp.brand} to Android

The web build is wrapped with Capacitor, so the exact same code ships to the Play Store.

\`\`\`bash
npm install
npm run build                 # vite production build -> dist/
npx cap add android           # one time: generates the native project
npm run android:sync          # copies dist/ + plugins into android/
npm run android:open          # opens Android Studio
\`\`\`

## Release build

\`\`\`bash
cd android
keytool -genkey -v -keystore ${bp.slug}.jks -alias ${bp.slug} -keyalg RSA -keysize 2048 -validity 10000
./gradlew bundleRelease        # -> android/app/build/outputs/bundle/release/app-release.aab
\`\`\`

Upload the \`.aab\` to the Play Console. Required before publishing:

- Privacy policy URL
- Feature graphic (1024×500) and 2+ screenshots
- Content rating questionnaire
- Data safety declaration

## Native niceties already wired

- \`android:screenOrientation="portrait"\` — flip it in \`AndroidManifest.xml\`
- Hardware acceleration on for the WebGL scene
- Splash screen + theme colours matched to the design system (${bp.theme.name})
${
  bp.physics.engine !== 'none'
    ? '- The 3D physics hero runs in the device WebView; body count automatically drops on low-end GPUs\n'
    : ''
}`,
    },
  ];
}

function webFiles(bp: Blueprint): GeneratedFile[] {
  const react = wantsReact(bp);
  const files: GeneratedFile[] = [
    { path: 'package.json', content: packageJson(bp) },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
${react ? "import react from '@vitejs/plugin-react';\n" : ''}
export default defineConfig({
  ${react ? 'plugins: [react()],\n  ' : ''}build: { target: 'esnext', sourcemap: true },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
`,
    },
    {
      path: 'tsconfig.json',
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ESNext',
            lib: ['DOM', 'DOM.Iterable', 'ESNext'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            strict: true,
            allowJs: true,
            checkJs: false,
            jsx: 'react-jsx',
            noEmit: true,
            skipLibCheck: true,
            types: ['vite/client'],
          },
          include: ['src', 'server'],
        },
        null,
        2,
      )}\n`,
    },
    { path: 'index.html', content: indexHtml(bp) },
    { path: `src/main.${react ? 'tsx' : 'ts'}`, content: mainTs(bp, react) },
    { path: 'src/data.ts', content: dataTs(bp) },
    {
      path: 'src/motion.js',
      content: motionJs(bp),
    },
    {
      path: 'src/styles.css',
      content: react ? reactStyles(bp) : styleSheet(bp),
    },
    { path: 'src/lib/api.ts', content: apiTs(bp) },
    { path: 'preview.html', content: previewDoc(bp) },
    {
      path: 'public/manifest.webmanifest',
      content: `${JSON.stringify(
        {
          name: bp.title,
          short_name: bp.brand,
          description: bp.description,
          start_url: '/',
          display: 'standalone',
          background_color: bp.theme.bg,
          theme_color: bp.theme.accent,
          icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        },
        null,
        2,
      )}\n`,
    },
    {
      path: 'public/favicon.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bp.theme.accent}"/><stop offset="1" stop-color="${bp.theme.accent2}"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="${bp.theme.bg}"/><path d="M16 20h10l6 10 6-10h10L36 40h-8z" fill="url(#g)"/></svg>\n`,
    },
    {
      path: 'public/robots.txt',
      content: `User-agent: *\nAllow: /\nSitemap: https://${bp.slug}.example.com/sitemap.xml\n`,
    },
    {
      path: '.gitignore',
      content: `node_modules\ndist\n.env\n.env.local\ndata\n*.db\n.DS_Store\nandroid/app/build\nios/App/build\n`,
    },
    {
      path: '.github/workflows/ci.yml',
      content: `name: CI

on:
  push: { branches: [main] }
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci || npm install
      - run: npx tsc --noEmit || true
      - run: npm run build
${
  bp.platforms.includes('android')
    ? `      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - run: npx cap sync android
      - run: cd android && ./gradlew assembleDebug
`
    : ''
}`,
    },
    {
      path: 'wrangler.toml',
      content: `name = "${bp.slug}"\ncompatibility_date = "2024-11-01"\npages_build_output_dir = "./dist"\n`,
    },
  ];

  if (react) {
    files.push({ path: 'src/App.tsx', content: appTsx(bp) });
  }

  if (bp.backend.enabled) {
    files.push(...serverFiles(bp));
  }

  if (bp.platforms.includes('android') || bp.platforms.includes('ios')) {
    files.push(...androidFiles(bp));
  }

  return files;
}

export function projectFiles(bp: Blueprint): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: 'README.md',
      content: `# ${bp.brand}

${bp.description}

> Generated by **Xova** from the prompt: \`${bp.prompt}\`

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | ${bp.stack.frontend} |
| Styling | ${bp.stack.styling} |
| Motion | ${bp.stack.motion} |
| 3D | ${bp.stack.three} |
| Backend | ${bp.stack.backend} |
| Data | ${bp.stack.database} |
| Auth | ${bp.stack.auth} |
| Deploy | ${bp.stack.deploy} |

## Platforms

${bp.platforms.map((platform) => `- \`${platform}\``).join('\n')}

## Quick start

\`\`\`bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle in dist/
\`\`\`

Open \`preview.html\` in any browser for a zero-install look at the finished page.

## Pages

${bp.pages.map((page) => `- \`${page}\``).join('\n')}

## Notes

- Design tokens live in \`src/styles.css\` (theme: ${bp.theme.name}).
- Motion and the physics scene live in \`src/motion.ts\`.
- ${
        bp.physics.engine === 'none'
          ? 'Motion is micro-interaction only — enable the 3D pipeline in Xova for a WebGL hero.'
          : `The hero runs a ${bp.physics.bodyCount}-body rigid-body simulation at a fixed ${(1 / 120).toFixed(4)}s timestep.`
      }
`,
    },
    {
      path: 'XOVA.md',
      content: `# Xova build report — ${bp.brand}

- **Prompt:** ${bp.prompt}
- **Archetype:** ${bp.archetype}
- **Theme:** ${bp.theme.name} (${bp.theme.mode})
- **Quality score:** ${bp.quality}/100
- **Platforms:** ${bp.platforms.join(', ')}
- **Sections:** ${bp.sections.join(', ')}

## Slides

${bp.slides.map((slide, index) => `${index + 1}. **${slide.title}** — ${slide.subtitle}\n${slide.bullets.map((bullet) => `   - ${bullet}`).join('\n')}`).join('\n')}
`,
    },
  ];

  const all = [...files, ...webFiles(bp)];

  return all.sort((a, b) => a.path.localeCompare(b.path));
}

export { renderNav, renderFooter };
