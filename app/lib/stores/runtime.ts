import { map } from 'nanostores';

export type RuntimeStatus = 'idle' | 'booting' | 'ready' | 'unavailable';

export interface RuntimeState {
  status: RuntimeStatus;
  reason: string | null;
  crossOriginIsolated: boolean;
  supported: boolean;
  checkedAt: number | null;
}

export const runtimeStore = map<RuntimeState>({
  status: 'idle',
  reason: null,
  crossOriginIsolated: false,
  supported: typeof window !== 'undefined' ? typeof SharedArrayBuffer !== 'undefined' : false,
  checkedAt: null,
});

export function setRuntime(status: RuntimeStatus, reason: string | null = null) {
  runtimeStore.set({
    ...runtimeStore.get(),
    status,
    reason,
    crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated === true : false,
    checkedAt: Date.now(),
  });
}

let bootAttempted: Promise<void> | null = null;

/**
 * Boots the in-browser Node runtime (WebContainer) with a hard timeout.
 *
 * WebContainer requires cross-origin isolation (COOP/COEP). When Xova is
 * embedded or served without those headers we fall back to the static preview
 * engine instead of leaving the UI stuck on "booting".
 */
export async function ensureRuntime(): Promise<RuntimeStatus> {
  if (import.meta.env.SSR) {
    return 'idle';
  }

  if (runtimeStore.get().status === 'ready' || runtimeStore.get().status === 'unavailable') {
    return runtimeStore.get().status;
  }

  if (bootAttempted) {
    await bootAttempted;
    return runtimeStore.get().status;
  }

  const isolated = window.crossOriginIsolated === true;

  if (!isolated) {
    setRuntime('unavailable', 'Cross-origin isolation is off, so the in-browser Node runtime cannot boot here.');
    return 'unavailable';
  }

  setRuntime('booting');

  bootAttempted = (async () => {
    try {
      const { webcontainer } = await import('~/lib/webcontainer');

      await Promise.race([
        webcontainer,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Runtime boot timed out after 25s')), 25_000)),
      ]);

      setRuntime('ready');
    } catch (error) {
      setRuntime('unavailable', (error as Error).message);
    }
  })();

  await bootAttempted;

  return runtimeStore.get().status;
}
