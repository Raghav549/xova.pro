import { describe, expect, test } from 'vitest';
import { createBlueprint, detectArchetype, detectPlatforms } from '~/lib/engine/blueprint';
import { pickTheme } from '~/lib/engine/design';
import { chunkText, generateProject, planNarrative } from '~/lib/engine/generator';
import { buildPreviewFromFiles } from '~/lib/engine/preview';
import { ArtifactStreamScanner } from '~/lib/engine/scanner';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';

describe('blueprint planner', () => {
  test('detects archetypes from prompt intent', () => {
    expect(detectArchetype('Build a cinematic 3D physics website for a studio')).toBe('motion-3d');
    expect(detectArchetype('Create a SaaS analytics dashboard with a Postgres database')).toBe('dashboard');
    expect(detectArchetype('Build a shop with cart and checkout')).toBe('ecommerce');
    expect(detectArchetype('Scaffold a REST API with auth and migrations')).toBe('fullstack-api');
    expect(detectArchetype('Make an editorial portfolio for a motion designer')).toBe('portfolio');
  });

  test('detects platforms and physical motion requirements', () => {
    expect(detectPlatforms('Ship it as an Android app with a backend')).toEqual(['web', 'android', 'backend']);
    expect(detectPlatforms('Just a landing page')).toEqual(['web']);
    expect(detectPlatforms('anything', ['ios'])).toEqual(['ios']);
  });

  test('picks a theme that matches the prompt tone', () => {
    expect(pickTheme('a warm restaurant site with fire and spices').id).toBe('ember');
    expect(pickTheme('a minimal clean finance dashboard').id).toBe('porcelain');
    expect(pickTheme('an ai saas startup platform').id).toBe('nebula');
  });

  test('produces a complete, coherent blueprint', () => {
    const blueprint = createBlueprint('Build an Android shop app called Kettle with a cart, checkout and Postgres');

    expect(blueprint.brand).toBe('Kettle');
    expect(blueprint.platforms).toContain('android');
    expect(blueprint.sections[0]).toBe('nav');
    expect(blueprint.sections).toContain('footer');
    expect(blueprint.slides).toHaveLength(6);
    expect(blueprint.physics.bodyCount).toBeGreaterThan(0);
    expect(blueprint.quality).toBeGreaterThanOrEqual(90);
    expect(blueprint.metrics.length).toBeGreaterThan(3);
  });

  test('keeps the 3D pipeline off when explicitly disabled', () => {
    const blueprint = createBlueprint('A quiet documentation site', { motion3d: false, backend: 'none' });

    expect(blueprint.physics.engine).toBe('none');
    expect(blueprint.backend.enabled).toBe(false);
  });
});

describe('project generation', () => {
  const result = generateProject(
    'Build a cinematic 3D physics website for a creative studio called Lumen with pricing, an Android build and a Postgres backend',
    { platforms: ['web', 'android', 'backend'], motion3d: true, backend: 'full' },
  );

  test('writes a full project tree', () => {
    const paths = result.files.map((file) => file.path);

    expect(paths).toContain('package.json');
    expect(paths).toContain('index.html');
    expect(paths).toContain('src/styles.css');
    expect(paths).toContain('src/motion.js');
    expect(paths).toContain('public/manifest.webmanifest');
    expect(paths).toContain('capacitor.config.json');
    expect(paths).toContain('ANDROID.md');
    expect(paths).toContain('server/index.ts');
    expect(paths).toContain('server/db/schema.ts');
    expect(paths).toContain('docker-compose.yml');
    expect(paths).toContain('README.md');
  });

  test('emits a single, well-formed document shell', () => {
    const preview = result.previewDoc;

    expect(preview.match(/<nav\b/g) ?? []).toHaveLength(1);
    expect(preview.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(preview.match(/<footer class="xv-footer"/g) ?? []).toHaveLength(1);

    /* the nav/footer sections must not be rendered twice by the section pass */
    expect(preview.match(/class="xv-nav"/g) ?? []).toHaveLength(1);

    /* no un-interpolated template leftovers or `undefined` leaks */
    for (const leak of ['${', '[object Object]', '>undefined<']) {
      expect(preview).not.toContain(leak);
    }

    expect(preview.match(/<section\b/g)?.length).toBe(preview.match(/<\/section>/g)?.length);
    expect(preview.match(/<div\b/g)?.length).toBe(preview.match(/<\/div>/g)?.length);
    expect(preview).toContain('<h1');
  });

  test('ships a physics runtime with sensible static settings', () => {
    const motion = result.files.find((file) => file.path === 'src/motion.js')?.content ?? '';

    expect(motion).toContain('fixedStep');
    expect(motion).toContain('sphere');
    expect(motion).toContain('prefers-reduced-motion');
    expect(motion).toContain('pointer');

    const tsconfig = JSON.parse(result.files.find((file) => file.path === 'tsconfig.json')?.content ?? '{}') as {
      compilerOptions: Record<string, unknown>;
    };

    expect(tsconfig.compilerOptions.allowJs).toBe(true);
    expect(tsconfig.compilerOptions.checkJs).toBe(false);

    const entry = result.files.find((file) => file.path === 'src/main.ts')?.content ?? '';

    expect(entry).toContain("'./motion.js'");
  });

  test('describes the Android build it promised', () => {
    const manifest = result.files.find((file) => file.path === 'capacitor.config.json')?.content ?? '';
    const gradle = result.files.find((file) => file.path === 'android/app/build.gradle')?.content ?? '';
    const xml = result.files.find((file) => file.path === 'android/app/src/main/AndroidManifest.xml')?.content ?? '';

    expect(JSON.parse(manifest).appId).toMatch(/^([a-z0-9]+\.)+[a-z0-9]+$/);
    expect(gradle).toContain('applicationId');
    expect(xml).toContain('<manifest');
    expect(result.files.some((file) => file.path === 'ANDROID.md')).toBe(true);
  });

  test('ships a backend with validation, schema and containers', () => {
    const server = result.files
      .filter((file) => file.path.startsWith('server/'))
      .map((file) => file.content)
      .join('\n');

    expect(server).toContain("from 'hono'");
    expect(server).toContain("from 'zod'");
    expect(server).toContain('/health');
    expect(result.files.some((file) => file.path === 'docker-compose.yml')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/db/schema.ts')).toBe(true);
  });

  test('emits valid JSON manifests', () => {
    const pkg = result.files.find((file) => file.path === 'package.json');

    expect(pkg).toBeDefined();

    const parsed = JSON.parse(pkg?.content ?? '{}') as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };

    expect(parsed.scripts['android:sync']).toContain('cap sync android');
    expect(parsed.dependencies.three).toBeDefined();
    expect(parsed.dependencies.hono).toBeDefined();
    expect(() =>
      JSON.parse(result.files.find((file) => file.path === 'capacitor.config.json')?.content ?? ''),
    ).not.toThrow();
  });

  test('the generated runtime is syntactically valid JavaScript', () => {
    const motion = result.files.find((file) => file.path === 'src/motion.js');

    expect(motion).toBeDefined();
    expect(
      () => new Function(motion?.content.replace('export function startMotion()', 'function startMotion()') ?? ''),
    ).not.toThrow();
    expect(motion?.content).toContain('esm.sh/three');
    expect(motion?.content).toContain('fixedStep');
    expect(motion?.content).toContain('sphere-sphere');
  });

  test('the preview document is standalone and self-contained', () => {
    expect(result.previewDoc).toContain('<!doctype html>');
    expect(result.previewDoc).toContain('<style id="xv-styles">');
    expect(result.previewDoc).toContain('<script id="xv-runtime">');
    expect(result.previewDoc).toContain('id="xv-physics"');
    expect(result.previewDoc).not.toContain('manifest.webmanifest');

    const inlineScript = /<script id="xv-runtime">\n([\s\S]*?)\n {4}<\/script>/.exec(result.previewDoc)?.[1] ?? '';

    expect(inlineScript.length).toBeGreaterThan(1000);
    expect(() => new Function(inlineScript)).not.toThrow();
  });

  test('the artifact stream is parseable by the streaming message parser', () => {
    const artifacts: string[] = [];
    const files: string[] = [];

    const parser = new StreamingMessageParser({
      callbacks: {
        onArtifactOpen: (data) => artifacts.push(data.id),
        onActionClose: (data) => files.push(String(data.action.type === 'file' ? data.action.filePath : 'shell')),
      },
    });

    let accumulated = 'intro\n\n';

    for (const chunk of chunkText(result.artifactText, 128)) {
      accumulated += chunk;
      parser.parse('msg-1', accumulated);
    }

    expect(artifacts).toEqual([result.blueprint.slug]);
    expect(files.length).toBe(result.files.length);
  });

  test('stats describe the emitted project', () => {
    expect(result.stats.files).toBe(result.files.length + 1);
    expect(result.stats.lines).toBeGreaterThan(500);
    expect(result.stats.bytes).toBeGreaterThan(20000);
  });

  test('narrative mentions every slide', () => {
    const narrative = planNarrative(result.blueprint);

    for (const slide of result.blueprint.slides) {
      expect(narrative).toContain(slide.title);
    }
  });
});

describe('artifact stream scanner', () => {
  test('emits incremental content before the action closes', () => {
    const scanner = new ArtifactStreamScanner();
    const events = [
      ...scanner.push(
        '<xovaArtifact id="demo" title="Demo">\n<xovaAction type="file" filePath="/home/project/src/a.ts">\nconst a = 1;',
      ),
      ...scanner.push('\nconst b = 2;'),
      ...scanner.push('\n</xovaAction>\n</xovaArtifact>'),
    ];

    const opened = events.find((event) => event.type === 'action-open');
    const chunks = events.filter((event) => event.type === 'action-chunk');
    const closed = events.find((event) => event.type === 'action-close');

    expect(opened).toMatchObject({ kind: 'file', path: '/home/project/src/a.ts' });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect((chunks[0] as { content: string }).content).toContain('const a = 1;');
    expect((closed as { content: string }).content).toContain('const b = 2;');
    expect(scanner.artifactOpen()).toEqual({ id: 'demo', title: 'Demo' });
    expect(scanner.artifactClosed()).toBe(true);
  });

  test('ignores partial tags until they are complete', () => {
    const scanner = new ArtifactStreamScanner();

    expect(scanner.push('<xovaArt')).toEqual([]);
    expect(scanner.push('ifact id="x" title="X">')).toEqual([]);
  });
});

describe('static preview compiler', () => {
  test('inlines local stylesheets and scripts', () => {
    const { html, missing } = buildPreviewFromFiles([
      {
        path: 'index.html',
        content:
          '<html><head><link rel="stylesheet" href="./style.css"></head><body><script src="/app.js"></script></body></html>',
      },
      { path: 'style.css', content: 'body{color:red}' },
      { path: 'app.js', content: 'console.log("hi")' },
    ]);

    expect(html).toContain('body{color:red}');
    expect(html).toContain('console.log("hi")');
    expect(missing).toHaveLength(0);
  });

  test('reports entry points it cannot execute and keeps a usable document', () => {
    const { html, missing } = buildPreviewFromFiles([
      {
        path: 'index.html',
        content: '<html><head></head><body><script type="module" src="/src/main.ts"></script></body></html>',
      },
      { path: 'src/main.ts', content: 'console.log("typed")' },
    ]);

    expect(missing).toContain('src/main.ts');
    expect(html).toContain('importmap');
    expect(html).toContain('viewport');
  });

  test('falls back to a listing when no HTML entry exists', () => {
    const { html } = buildPreviewFromFiles([{ path: 'src/lib/util.ts', content: 'export const x = 1;' }]);

    expect(html).toContain('Project files staged');
    expect(html).toContain('src/lib/util.ts');
  });
});
