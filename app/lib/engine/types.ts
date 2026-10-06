/**
 * Xova Build Engine — shared types.
 *
 * The engine turns a natural-language prompt into a real, runnable project:
 * a design system, a set of files, a preview document, slides and export targets.
 */

export type Platform = 'web' | 'android' | 'ios' | 'desktop' | 'backend';

export type Archetype =
  | 'landing'
  | 'motion-3d'
  | 'saas'
  | 'dashboard'
  | 'ecommerce'
  | 'portfolio'
  | 'blog'
  | 'mobile-app'
  | 'game'
  | 'fullstack-api';

export type SectionKind =
  | 'nav'
  | 'hero'
  | 'hero-3d'
  | 'marquee'
  | 'features'
  | 'stats'
  | 'showcase'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'footer'
  | 'store'
  | 'blog-list'
  | 'dashboard'
  | 'contact'
  | 'timeline';

export interface Theme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  bg: string;
  bgAlt: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  radius: string;
  fontHeading: string;
  fontBody: string;
  mono: string;
}

export interface BuildSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  bullets: string[];
  accent: string;
}

export interface StackInfo {
  frontend: string;
  styling: string;
  motion: string;
  three: string;
  backend: string;
  database: string;
  auth: string;
  deploy: string;
  runtime: string;
}

export interface Blueprint {
  id: string;
  slug: string;
  title: string;
  description: string;
  brand: string;
  tagline: string;
  prompt: string;
  archetype: Archetype;
  platforms: Platform[];
  features: string[];
  metrics: Array<{ label: string; value: string }>;
  sections: SectionKind[];
  pages: string[];
  stack: StackInfo;
  theme: Theme;
  slides: BuildSlide[];
  motion: MotionSpec;
  physics: PhysicsSpec;
  backend: BackendSpec;
  quality: number;
}

export interface MotionSpec {
  preset: 'cinematic' | 'playful' | 'precise' | 'editorial';
  scrollReveal: boolean;
  parallax: boolean;
  magnetic: boolean;
  pageTransitions: boolean;
}

export interface PhysicsSpec {
  engine: 'xova-rigid' | 'none';
  gravity: number;
  restitution: number;
  bodyCount: number;
  interactive: boolean;
}

export interface BackendSpec {
  enabled: boolean;
  framework: 'hono' | 'express' | 'fastify';
  database: 'sqlite' | 'postgres' | 'libsql' | 'mysql';
  orm: 'drizzle' | 'prisma' | 'none';
  auth: 'session' | 'jwt' | 'none';
  api: 'rest' | 'graphql' | 'trpc';
  realtime: boolean;
  docker: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  blueprint: Blueprint;
  files: GeneratedFile[];
  artifactText: string;
  previewDoc: string;
  entry: string;
  stats: {
    files: number;
    lines: number;
    bytes: number;
    durationMs: number;
  };
}
