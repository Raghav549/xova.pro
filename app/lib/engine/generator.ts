import { WORK_DIR } from '~/utils/constants';
import { createBlueprint, type PlanOptions } from './blueprint';
import { previewDoc, projectFiles } from './project';
import type { Blueprint, GeneratedFile, GenerationResult } from './types';

export * from './types';
export { createBlueprint } from './blueprint';
export { previewDoc } from './project';
export { THEMES } from './design';

const WORK_PREFIX = WORK_DIR.endsWith('/') ? WORK_DIR : `${WORK_DIR}/`;

export function toWorkPath(path: string): string {
  const clean = path.replace(/^\.?\//, '');
  return `${WORK_PREFIX}${clean}`;
}

export function relativePath(path: string): string {
  return path.startsWith(WORK_PREFIX) ? path.slice(WORK_PREFIX.length) : path;
}

/**
 * The narrative that streams into the chat *before* the artifact. It is written
 * to read like a senior engineer narrating a build, and it doubles as the
 * content for the studio slide deck.
 */
export function planNarrative(bp: Blueprint): string {
  const lines: string[] = [];

  lines.push(
    `**${bp.brand}** is a ${bp.archetype.replace('-', ' ')} build with a ${bp.theme.name.toLowerCase()} design system.`,
  );
  lines.push('');
  lines.push(`Here is how I am going to ship it:`);
  lines.push('');

  for (const slide of bp.slides) {
    lines.push(`- **${slide.title}** — ${slide.subtitle}`);
  }

  lines.push('');
  lines.push(
    `Targets: ${bp.platforms.map((platform) => `\`${platform}\``).join(', ')} · Motion: ${bp.motion.preset} · ${
      bp.physics.engine === 'none'
        ? 'no 3D pipeline'
        : `${bp.physics.bodyCount} rigid bodies @ ${bp.physics.gravity} m/s²`
    }`,
  );
  lines.push('');
  lines.push(
    bp.backend.enabled
      ? `Backend: ${bp.backend.framework} + ${bp.backend.database} (${bp.backend.orm}) with ${bp.backend.auth} auth.`
      : 'No backend needed — this build is edge-static and instant to deploy.',
  );
  lines.push('');
  lines.push('Writing the project now — files land in the editor as they stream in.');

  return lines.join('\n');
}

export function artifactTextFor(bp: Blueprint, files: GeneratedFile[]): string {
  const open = `<xovaArtifact id="${bp.slug}" title="${bp.brand}">`;
  const body = files
    .map((file) => `<xovaAction type="file" filePath="${toWorkPath(file.path)}">\n${file.content}\n</xovaAction>`)
    .join('\n');

  return `${open}\n${body}\n</xovaArtifact>`;
}

export function generateProject(prompt: string, options: PlanOptions = {}): GenerationResult {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const blueprint = createBlueprint(prompt, options);
  const files = projectFiles(blueprint);
  const preview = previewDoc(blueprint);
  const artifactText = artifactTextFor(blueprint, files);
  const lines = files.reduce((acc, file) => acc + file.content.split('\n').length, 0) + preview.split('\n').length;
  const bytes = files.reduce((acc, file) => acc + file.content.length, 0) + preview.length;
  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    blueprint,
    files,
    artifactText,
    previewDoc: preview,
    entry: 'preview.html',
    stats: {
      files: files.length + 1,
      lines,
      bytes,
      durationMs: Math.round(ended - started),
    },
  };
}

/** Split generated text into realistic streaming chunks (word-ish boundaries). */
export function chunkText(text: string, size = 24): string[] {
  const chunks: string[] = [];
  let index = 0;

  while (index < text.length) {
    let end = Math.min(index + size, text.length);

    if (end < text.length) {
      const nextBreak = text.indexOf('\n', end);

      if (nextBreak !== -1 && nextBreak - end < 60) {
        end = nextBreak + 1;
      }
    }

    chunks.push(text.slice(index, end));
    index = end;
  }

  return chunks;
}

/** Blueprint metadata used by the marketing pages and the studio header. */
export function blueprintSummary(bp: Blueprint) {
  return {
    id: bp.id,
    slug: bp.slug,
    title: bp.title,
    brand: bp.brand,
    archetype: bp.archetype,
    platform: bp.platforms,
    stack: bp.stack,
    theme: bp.theme.name,
    quality: bp.quality,
    sections: bp.sections.length,
    slides: bp.slides,
  };
}

export const DEMO_PROMPTS: Array<{ label: string; prompt: string; archetype: Blueprint['archetype'] }> = [
  {
    label: '3D physics studio site',
    prompt:
      'Build a cinematic 3D physics website for a creative studio called Lumen — dark nebula theme, WebGL hero with rigid bodies, scroll motion, pricing and a contact form.',
    archetype: 'motion-3d',
  },
  {
    label: 'SaaS dashboard + API',
    prompt:
      'Create a SaaS analytics dashboard for a product called Northlight with login, a Postgres database, REST API, realtime activity and a pricing page.',
    archetype: 'saas',
  },
  {
    label: 'Android commerce app',
    prompt:
      'Build a mobile shop app called Kettle for coffee gear with cart, checkout and an installable Android build.',
    archetype: 'ecommerce',
  },
  {
    label: 'Motion portfolio',
    prompt:
      'Make an editorial portfolio for a motion designer, light minimal theme, case-study gallery and availability contact.',
    archetype: 'portfolio',
  },
  {
    label: 'Physics mini-game',
    prompt: 'Build a browser game called Orbit with gravity physics, score, combo and touch support.',
    archetype: 'game',
  },
  {
    label: 'Full-stack API',
    prompt:
      'Scaffold a production REST API called Vault with Postgres, Drizzle migrations, session auth, rate limiting and Docker.',
    archetype: 'fullstack-api',
  },
];
