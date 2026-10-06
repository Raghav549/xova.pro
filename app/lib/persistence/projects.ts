import type { Blueprint, GeneratedFile } from '~/lib/engine/types';

export interface StoredProject {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  engine: string;
  createdAt: number;
  updatedAt: number;
  files: GeneratedFile[];
  previewDoc: string | null;
  blueprint: Blueprint | null;
  stats: { files: number; lines: number; bytes: number; durationMs: number } | null;
}

const DB_NAME = 'xovaStudio';
const STORE = 'projects';

function open(): Promise<IDBDatabase | null> {
  if (import.meta.env.SSR || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = () => resolve(null);
  });
}

export async function saveProject(project: StoredProject): Promise<void> {
  const db = await open();

  if (!db) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const request = transaction.objectStore(STORE).put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listProjects(): Promise<StoredProject[]> {
  const db = await open();

  if (!db) {
    return [];
  }

  return new Promise((resolve) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).getAll();

    request.onsuccess = () => {
      const rows = (request.result as StoredProject[]).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(rows);
    };
    request.onerror = () => resolve([]);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await open();

  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const request = transaction.objectStore(STORE).delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
}

export async function clearProjects(): Promise<void> {
  const db = await open();

  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const request = transaction.objectStore(STORE).clear();

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
}

/** Small helper used by the studio to persist a finished build. */
export function projectFromStudio(input: {
  prompt: string;
  engine: string;
  files: GeneratedFile[];
  previewDoc: string | null;
  blueprint: Blueprint | null;
  stats: StoredProject['stats'];
}): StoredProject {
  const now = Date.now();
  const slug = input.blueprint?.slug ?? `xova-${now.toString(36)}`;

  return {
    id: slug,
    slug,
    title: input.blueprint?.brand ?? 'Untitled build',
    prompt: input.prompt,
    engine: input.engine,
    createdAt: now,
    updatedAt: now,
    files: input.files,
    previewDoc: input.previewDoc,
    blueprint: input.blueprint,
    stats: input.stats,
  };
}
