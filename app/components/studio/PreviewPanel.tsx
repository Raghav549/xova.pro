import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { runtimeStore } from '~/lib/stores/runtime';
import { studioStore } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

type DeviceId = 'desktop' | 'laptop' | 'tablet' | 'phone';

interface DevicePreset {
  id: DeviceId;
  label: string;
  icon: string;
  width: number | string;
  height: number | string;
  radius: number;
  notch: boolean;
}

const DEVICES: DevicePreset[] = [
  { id: 'desktop', label: 'Desktop', icon: 'i-ph:monitor', width: '100%', height: '100%', radius: 16, notch: false },
  { id: 'laptop', label: 'Laptop', icon: 'i-ph:laptop', width: 1024, height: '100%', radius: 14, notch: false },
  { id: 'tablet', label: 'Tablet', icon: 'i-ph:device-tablet', width: 820, height: 1080, radius: 26, notch: false },
  { id: 'phone', label: 'Phone', icon: 'i-ph:device-mobile', width: 390, height: 844, radius: 34, notch: true },
];

export const PreviewPanel = memo(() => {
  const state = useStore(studioStore);
  const runtime = useStore(runtimeStore);
  const previews = useStore(workbenchStore.previews);
  const [device, setDevice] = useState<DeviceId>('desktop');
  const [zoom, setZoom] = useState(1);
  const [rotated, setRotated] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [liveEdit] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  const runtimePreview = previews.length > 0 ? previews[previews.length - 1] : null;

  const source = useMemo(() => {
    if (runtimePreview?.ready) {
      return {
        url: runtimePreview.baseUrl,
        label: `localhost:${runtimePreview.port} (in-browser runtime)`,
        kind: 'runtime' as const,
      };
    }

    if (state.previewUrl) {
      return {
        url: state.previewUrl,
        label: `xova.preview/${state.blueprint?.slug ?? 'build'}/preview.html`,
        kind: 'static' as const,
      };
    }

    return null;
  }, [runtimePreview, state.previewUrl, state.blueprint?.slug]);

  const preset = DEVICES.find((item) => item.id === device) ?? DEVICES[0];

  useEffect(() => {
    if (state.blueprint && liveEdit) {
      setDevice(state.blueprint.platforms.includes('android') ? 'phone' : 'desktop');
    }
  }, [state.blueprint, liveEdit]);

  const reload = () => setNonce((value) => value + 1);

  const openInNewTab = () => {
    if (!source) {
      return;
    }

    window.open(source.url, '_blank', 'noopener');
  };

  const frameWidth = rotated && preset.height !== '100%' ? (preset.height as number) : preset.width;
  const frameHeight = rotated && preset.height !== '100%' ? (preset.width as number) : preset.height;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="xv-preview-toolbar flex-wrap">
        <div className="flex items-center gap-1">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDevice(item.id)}
              aria-pressed={device === item.id}
              title={item.label}
              className={classNames(
                'icon-btn',
                device === item.id && 'bg-xova-elements-item-backgroundAccent text-xova-elements-textPrimary',
              )}
            >
              <span className={item.icon} />
            </button>
          ))}
        </div>

        <div className="xv-address">
          <span
            className={classNames('text-[13px]', source?.kind === 'runtime' ? 'i-ph:lightning-fill' : 'i-ph:globe')}
          />
          <span>{source?.label ?? 'No preview yet — send a prompt to render your build'}</span>
          {source?.kind === 'runtime' && <span className="xv-pulse-dot ml-1" />}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn" onClick={reload} title="Reload preview">
            <span className="i-ph:arrow-clockwise" />
          </button>
          <button
            type="button"
            className={classNames('icon-btn', rotated && 'bg-xova-elements-item-backgroundAccent')}
            onClick={() => setRotated((value) => !value)}
            title="Rotate device"
          >
            <span className="i-ph:device-mobile-camera" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              const element = frameRef.current;

              if (!element) {
                return;
              }

              if (document.fullscreenElement) {
                void document.exitFullscreen();
              } else {
                void element.requestFullscreen?.();
              }
            }}
            title="Fullscreen preview"
          >
            <span className="i-ph:arrows-out" />
          </button>
          <button type="button" className="icon-btn" onClick={openInNewTab} disabled={!source} title="Open in new tab">
            <span className="i-ph:arrow-square-out" />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-2">
          <span className="i-ph:magnifying-glass text-xova-elements-textTertiary" />
          <input
            type="range"
            min={0.5}
            max={1.25}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-24 accent-[var(--xova-accent-glow)]"
            aria-label="Preview zoom"
          />
          <span className="text-xs text-xova-elements-textTertiary w-9">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div ref={frameRef} className="xv-preview-frame xv-scroll flex-1 min-h-0">
        {source ? (
          <motion.div
            key={device + String(rotated)}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: cubicEasingFn }}
            className="xv-device"
            style={{
              width: frameWidth,
              height: frameHeight,
              maxWidth: '100%',
              borderRadius: preset.radius,
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {preset.notch && <span className="xv-device-notch" aria-hidden="true" />}
            <iframe
              key={`${source.url}-${nonce}-${device}`}
              title="Xova preview"
              src={source.url}
              className="w-full h-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
              allow="accelerometer; camera; clipboard-write; fullscreen; geolocation; gyroscope; microphone"
            />
          </motion.div>
        ) : (
          <EmptyPreview />
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <InfoTile
          icon={runtime.status === 'ready' ? 'i-ph:check-circle' : 'i-ph:info'}
          label="Runtime"
          value={
            runtime.status === 'ready'
              ? 'WebContainer online'
              : runtime.status === 'booting'
                ? 'Booting in-browser Node…'
                : 'Static preview engine'
          }
          tone={runtime.status === 'ready' ? 'ok' : 'muted'}
        />
        <InfoTile
          icon="i-ph:files"
          label="Files"
          value={`${state.files.length} generated · ${state.stats?.lines.toLocaleString() ?? 0} lines`}
        />
        <InfoTile icon="i-ph:devices" label="Targets" value={state.blueprint?.platforms.join(' · ') ?? 'web'} />
      </div>
    </div>
  );
});

function InfoTile({
  icon,
  label,
  value,
  tone = 'muted',
}: {
  icon: string;
  label: string;
  value: string;
  tone?: 'ok' | 'muted' | 'warn';
}) {
  return (
    <div className="panel px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-xova-elements-textTertiary">
        <span className={icon} />
        {label}
      </div>
      <p
        className={classNames('text-sm mt-1 truncate', {
          'text-emerald-400': tone === 'ok',
          'text-amber-400': tone === 'warn',
        })}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-xova-elements-item-backgroundAccent flex items-center justify-center">
        <span className="i-ph:sparkle text-2xl text-xova-accent-cyan" />
      </div>
      <h3 className="text-lg font-medium">Your preview renders here</h3>
      <p className="text-sm text-xova-elements-textSecondary max-w-md">
        Describe what you want to build. Xova assembles the design system, writes real files, and renders the live page
        in this panel — device-accurate, resizable, and exportable.
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-xs text-xova-elements-textTertiary">
        <span className="chip">real files</span>
        <span className="chip">3D + physics</span>
        <span className="chip">Android export</span>
        <span className="chip">backend included</span>
      </div>
    </div>
  );
}
