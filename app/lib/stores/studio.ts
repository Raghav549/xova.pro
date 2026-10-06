import { atom, map, type MapStore } from 'nanostores';
import type { Blueprint, GeneratedFile, Platform } from '~/lib/engine/types';

export type StudioPhase = 'idle' | 'planning' | 'designing' | 'generating' | 'runtime' | 'ready' | 'error';

export interface StudioStreamFile {
  path: string;
  content: string;
  done: boolean;
  startedAt: number;
}

export interface StudioLogEntry {
  id: string;
  kind: 'info' | 'file' | 'shell' | 'ok' | 'error';
  text: string;
  at: number;
}

export interface StudioStats {
  files: number;
  lines: number;
  bytes: number;
  durationMs: number;
}

export interface StudioSettings {
  provider: string;
  model: string;
  apiKey: string;
  baseURL: string;
  platforms: Platform[];
  motion3d: boolean;
  backend: 'auto' | 'none' | 'api' | 'full';
  autoPreview: boolean;
  autoRun: boolean;
  reduceMotion: boolean;
}

export interface StudioState {
  prompt: string;
  title: string;
  phase: StudioPhase;
  progress: number;
  engine: string;
  error: string | null;
  blueprint: Blueprint | null;
  files: GeneratedFile[];
  previewDoc: string | null;
  previewUrl: string | null;
  activeSlide: number;
  slidesSeen: number[];
  streamFiles: StudioStreamFile[];
  activePath: string | null;
  logs: StudioLogEntry[];
  stats: StudioStats | null;
  startedAt: number | null;
  finishedAt: number | null;
}

const SETTINGS_KEY = 'xova_studio_settings';

const DEFAULT_SETTINGS: StudioSettings = {
  provider: 'local',
  model: '',
  apiKey: '',
  baseURL: '',
  platforms: ['web'],
  motion3d: true,
  backend: 'auto',
  autoPreview: true,
  autoRun: false,
  reduceMotion: false,
};

function loadSettings(): StudioSettings {
  if (import.meta.env.SSR) {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<StudioSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const studioSettings: MapStore<StudioSettings> = map<StudioSettings>(loadSettings());

if (!import.meta.env.SSR) {
  studioSettings.listen((value) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
    } catch {
      // storage full / private mode — settings simply do not persist
    }
  });
}

export function updateSettings(patch: Partial<StudioSettings>) {
  studioSettings.set({ ...studioSettings.get(), ...patch });
}

export function togglePlatform(platform: Platform) {
  const { platforms } = studioSettings.get();
  const next = platforms.includes(platform) ? platforms.filter((item) => item !== platform) : [...platforms, platform];

  updateSettings({ platforms: next.length > 0 ? next : ['web'] });
}

const INITIAL_STATE: StudioState = {
  prompt: '',
  title: 'Untitled build',
  phase: 'idle',
  progress: 0,
  engine: 'xova-build-engine',
  error: null,
  blueprint: null,
  files: [],
  previewDoc: null,
  previewUrl: null,
  activeSlide: 0,
  slidesSeen: [],
  streamFiles: [],
  activePath: null,
  logs: [],
  stats: null,
  startedAt: null,
  finishedAt: null,
};

export const studioStore = map<StudioState>({ ...INITIAL_STATE });

export const studioTab = atom<'slides' | 'preview' | 'code' | 'stream' | 'runtime' | 'export'>('slides');

export const studioLogSeq = { value: 0 };

export function logStudio(kind: StudioLogEntry['kind'], text: string) {
  const entry: StudioLogEntry = { id: `log-${studioLogSeq.value++}`, kind, text, at: Date.now() };
  const logs = [...studioStore.get().logs, entry].slice(-160);

  studioStore.setKey('logs', logs);
}

export function resetStudio(prompt = '') {
  if (studioStore.get().previewUrl) {
    URL.revokeObjectURL(studioStore.get().previewUrl as string);
  }

  studioStore.set({
    ...INITIAL_STATE,
    prompt,
    engine: studioSettings.get().provider === 'local' ? 'xova-build-engine' : studioSettings.get().provider,
  });
}

export function startBuild(prompt: string, engine: string) {
  resetStudio(prompt);
  studioStore.setKey('phase', 'planning');
  studioStore.setKey('engine', engine);
  studioStore.setKey('startedAt', Date.now());
  studioStore.setKey('progress', 4);
  logStudio('info', `Brief received: “${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}”`);
}

export function applyBlueprint(blueprint: Blueprint, previewDoc: string, files: GeneratedFile[], stats: StudioStats) {
  studioStore.setKey('blueprint', blueprint);
  studioStore.setKey('title', blueprint.brand);
  studioStore.setKey('files', files);
  studioStore.setKey('stats', stats);
  studioStore.setKey('previewDoc', previewDoc);
  studioStore.setKey('phase', 'generating');
  studioStore.setKey('progress', Math.max(studioStore.get().progress, 18));
  setPreview(previewDoc);
  logStudio(
    'ok',
    `Blueprint locked — ${blueprint.theme.name} theme, ${blueprint.sections.length} sections, ${files.length} files, ${blueprint.platforms.join(' + ')}`,
  );
}

export function setPreview(previewDoc: string) {
  const previous = studioStore.get().previewUrl;

  if (import.meta.env.SSR) {
    studioStore.setKey('previewDoc', previewDoc);
    return;
  }

  const blob = new Blob([previewDoc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  if (previous) {
    URL.revokeObjectURL(previous);
  }

  studioStore.setKey('previewDoc', previewDoc);
  studioStore.setKey('previewUrl', url);
}

export function startStreamFile(path: string) {
  const streamFiles = studioStore.get().streamFiles.filter((file) => file.path !== path);

  streamFiles.push({ path, content: '', done: false, startedAt: Date.now() });
  studioStore.setKey('streamFiles', streamFiles);
  studioStore.setKey('activePath', path);
}

export function appendStreamFile(path: string, content: string) {
  const streamFiles = studioStore
    .get()
    .streamFiles.map((file) => (file.path === path ? { ...file, content, done: false } : file));

  studioStore.setKey('streamFiles', streamFiles);
}

export function finishStreamFile(path: string, content: string) {
  const streamFiles = studioStore
    .get()
    .streamFiles.map((file) => (file.path === path ? { ...file, content, done: true } : file));

  studioStore.setKey('streamFiles', streamFiles);
  logStudio('file', `Wrote ${path} (${content.split('\n').length} lines)`);
}

export function setPhase(phase: StudioPhase, progress?: number) {
  studioStore.setKey('phase', phase);

  if (typeof progress === 'number') {
    studioStore.setKey('progress', progress);
  }
}

export function goToSlide(index: number) {
  const blueprint = studioStore.get().blueprint;
  const max = blueprint ? blueprint.slides.length - 1 : 5;
  const next = Math.max(0, Math.min(max, index));
  const seen = new Set(studioStore.get().slidesSeen);

  seen.add(next);

  studioStore.setKey('activeSlide', next);
  studioStore.setKey('slidesSeen', Array.from(seen));
}

export function markSlidesSeen() {
  const blueprint = studioStore.get().blueprint;

  if (!blueprint) {
    return;
  }

  studioStore.setKey(
    'slidesSeen',
    Array.from(new Set([...studioStore.get().slidesSeen, 0, 1, 2, 3, 4, 5].slice(0, blueprint.slides.length))),
  );
}

export function finishBuild() {
  studioStore.setKey('phase', 'ready');
  studioStore.setKey('progress', 100);
  studioStore.setKey('finishedAt', Date.now());
  markSlidesSeen();

  const stats = studioStore.get().stats;

  if (stats) {
    logStudio(
      'ok',
      `Build ready in ${(stats.durationMs / 1000).toFixed(1)}s — ${stats.files} files, ${stats.lines} lines`,
    );
  }
}

export function failBuild(message: string) {
  studioStore.setKey('phase', 'error');
  studioStore.setKey('error', message);
  logStudio('error', message);
}

export function normalizeStudioPath(path: string): string {
  return path.replace(/^\/home\/project\//, '').replace(/^\//, '');
}

export function upsertStudioFile(path: string, content: string) {
  const normalized = normalizeStudioPath(path);
  const files = studioStore.get().files.slice();
  const index = files.findIndex((file) => file.path === normalized);

  if (index === -1) {
    files.push({ path: normalized, content });
  } else {
    files[index] = { path: normalized, content };
  }

  studioStore.setKey('files', files);
}

export function findStudioFile(path: string) {
  const normalized = path.replace(/^\/home\/project\//, '').replace(/^\//, '');
  return studioStore.get().files.find((file) => file.path === normalized || file.path === path);
}

export function updateStudioFile(path: string, content: string) {
  const files = studioStore.get().files.map((file) => (file.path === path ? { ...file, content } : file));

  studioStore.setKey('files', files);
}

export function studioSnapshot() {
  const state = studioStore.get();

  return {
    blueprint: state.blueprint,
    files: state.files,
    stats: state.stats,
  };
}
