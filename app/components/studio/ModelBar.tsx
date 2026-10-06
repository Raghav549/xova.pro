import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { Platform } from '~/lib/engine/types';
import { studioSettings, togglePlatform, updateSettings } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';

interface ProviderInfo {
  id: string;
  label: string;
  defaultModel: string;
  models: string[];
  envKey: string;
  hint: string;
  configured: boolean;
}

const PLATFORMS: Array<{ id: Platform; label: string; icon: string }> = [
  { id: 'web', label: 'Web', icon: 'i-ph:globe-simple' },
  { id: 'android', label: 'Android', icon: 'i-ph:android-logo' },
  { id: 'ios', label: 'iOS', icon: 'i-ph:apple-logo' },
  { id: 'backend', label: 'Backend', icon: 'i-ph:database' },
  { id: 'desktop', label: 'Desktop', icon: 'i-ph:desktop' },
];

export function ModelBar({ compact = false }: { compact?: boolean }) {
  const settings = useStore(studioSettings);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/models')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unavailable'))))
      .then((payload) => setProviders((payload as { providers: ProviderInfo[] }).providers))
      .catch(() => setProviders([]));
  }, []);

  const activeProvider = providers.find((provider) => provider.id === settings.provider);
  const requiresKey = settings.provider !== 'local';

  return (
    <div className={classNames('flex flex-col gap-3', { 'gap-2': compact })}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="section-label">Targets</span>
        {PLATFORMS.map((platform) => {
          const active = settings.platforms.includes(platform.id);

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              aria-pressed={active}
              className={classNames(active ? 'chip-active' : 'chip', 'hover:-translate-y-px')}
            >
              <span className={classNames(platform.icon, 'text-sm')} />
              {platform.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="section-label">Engine</span>
        <button type="button" onClick={() => setOpen((value) => !value)} className="chip hover:-translate-y-px">
          <span
            className={classNames(
              'i-ph:lightning-fill text-sm',
              settings.provider === 'local' ? 'text-xova-elements-textTertiary' : 'text-xova-accent-cyan',
            )}
          />
          {activeProvider ? activeProvider.label : 'Xova Build Engine'}
          {settings.model ? <span className="text-xova-elements-textTertiary">· {settings.model}</span> : null}
          <span className="i-ph:caret-down text-xs opacity-60" />
        </button>

        <button
          type="button"
          onClick={() => updateSettings({ motion3d: !settings.motion3d })}
          aria-pressed={settings.motion3d}
          className={classNames(settings.motion3d ? 'chip-active' : 'chip')}
        >
          <span className="i-ph:cube text-sm" />
          3D + physics
        </button>

        <label className="chip cursor-pointer">
          <span className="i-ph:database text-sm" />
          <select
            className="bg-transparent outline-none"
            value={settings.backend}
            onChange={(event) => updateSettings({ backend: event.target.value as typeof settings.backend })}
            aria-label="Backend depth"
          >
            <option value="auto">Backend: auto</option>
            <option value="none">Backend: none</option>
            <option value="api">Backend: API</option>
            <option value="full">Backend: full stack</option>
          </select>
        </label>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-3 flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ provider: 'local', model: '', apiKey: '' })}
              className={classNames(
                'text-left rounded-lg border p-3 transition-theme',
                settings.provider === 'local'
                  ? 'border-xova-elements-borderColorActive bg-xova-elements-item-backgroundAccent'
                  : 'border-xova-elements-borderColor hover:bg-xova-elements-item-backgroundActive',
              )}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="i-ph:cpu" /> Xova Build Engine
              </div>
              <p className="text-xs text-xova-elements-textSecondary mt-1">
                Deterministic generator. No API key, no network — produces full multi-file builds locally.
              </p>
            </button>

            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => updateSettings({ provider: provider.id, model: provider.defaultModel })}
                className={classNames(
                  'text-left rounded-lg border p-3 transition-theme',
                  settings.provider === provider.id
                    ? 'border-xova-elements-borderColorActive bg-xova-elements-item-backgroundAccent'
                    : 'border-xova-elements-borderColor hover:bg-xova-elements-item-backgroundActive',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="i-ph:sparkle" /> {provider.label}
                  {provider.configured ? (
                    <span className="chip text-[10px] py-0.5 px-2 ml-auto">key detected</span>
                  ) : null}
                </div>
                <p className="text-xs text-xova-elements-textSecondary mt-1">{provider.hint}</p>
              </button>
            ))}
          </div>

          {requiresKey && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="section-label">Model</span>
                <input
                  className="field"
                  list="xova-models"
                  value={settings.model}
                  placeholder={activeProvider?.defaultModel ?? 'model name'}
                  onChange={(event) => updateSettings({ model: event.target.value })}
                />
                <datalist id="xova-models">
                  {(activeProvider?.models ?? []).map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-1">
                <span className="section-label">API key (stored in this browser only)</span>
                <input
                  className="field"
                  type="password"
                  autoComplete="off"
                  value={settings.apiKey}
                  placeholder="sk-…"
                  onChange={(event) => updateSettings({ apiKey: event.target.value })}
                />
              </label>

              {settings.provider === 'openai-compatible' && (
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="section-label">Base URL</span>
                  <input
                    className="field"
                    value={settings.baseURL}
                    placeholder="https://api.groq.com/openai/v1"
                    onChange={(event) => updateSettings({ baseURL: event.target.value })}
                  />
                </label>
              )}
            </div>
          )}

          <p className="text-xs text-xova-elements-textTertiary">
            {requiresKey
              ? 'Without a key, Xova automatically falls back to the local build engine — nothing breaks.'
              : 'The build engine runs entirely in your browser: real files, real preview, real ZIP export.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export function ModelBarCompact() {
  const settings = useStore(studioSettings);

  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon="i-ph:sliders-horizontal"
        title="Build settings"
        size="lg"
        onClick={() => updateSettings({ motion3d: !settings.motion3d })}
      />
    </div>
  );
}
