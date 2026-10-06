import { createBlueprint } from './blueprint';
import { titleCase } from './design';

/**
 * Offline prompt enhancement: expands a short brief into a production-grade
 * spec. It runs without any API key so the studio always feels alive.
 */
export function enhancePromptLocally(message: string): string {
  const seed = message.trim();

  if (seed.length === 0) {
    return 'Build a cinematic 3D physics landing page for a creative studio, dark nebula theme, WebGL hero, scroll motion and a contact form.';
  }

  const blueprint = createBlueprint(seed);
  const subject = titleCase(blueprint.archetype.replace('-', ' '));
  const physics =
    blueprint.physics.engine === 'none'
      ? 'subtle micro-interactions with reduced-motion support'
      : `a real Three.js hero running ${blueprint.physics.bodyCount} rigid bodies with gravity, restitution and pointer impulses`;

  const parts = [
    `Build a ${blueprint.theme.mode === 'dark' ? 'dark, high-contrast' : 'light, editorial'} ${subject.toLowerCase()} for "${blueprint.brand}"`,
    `audience: teams evaluating ${blueprint.brand} for the first time`,
    `goal: ${blueprint.tagline.replace(/^[^—]*—\s*/, '')}`,
    `design: ${blueprint.theme.name} palette (${blueprint.theme.accent}, ${blueprint.theme.accent2}), Sora display type, ${blueprint.theme.radius} radii, glass surfaces with soft glow`,
    `layout: ${blueprint.sections.join(' → ')}`,
    `motion: ${physics}, scroll-linked reveals and parallax`,
    `stack: ${blueprint.stack.frontend} with ${blueprint.stack.styling.toLowerCase()}`,
    blueprint.backend.enabled
      ? `backend: ${blueprint.backend.framework} API on ${blueprint.backend.database} with ${blueprint.backend.auth} auth and validation`
      : 'no backend: edge-static output, instant deploy',
    `platforms: ${blueprint.platforms.join(', ')}`,
    `quality: Lighthouse 95+, WCAG AA contrast, 60fps motion budget, mobile-first with touch gestures`,
  ];

  return `${parts.join('. ')}.`;
}
