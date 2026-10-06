import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { studioStore, upsertStudioFile } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { detectLanguage, tokenClassName, tokenizeLine } from '~/utils/highlight';

interface StreamPanelProps {
  className?: string;
}

const MAX_RENDERED_LINES = 400;

export const StreamPanel = memo(({ className }: StreamPanelProps) => {
  const state = useStore(studioStore);
  const files = state.streamFiles;
  const [selected, setSelected] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [linesPerSecond, setLinesPerSecond] = useState(0);

  const activePath = selected ?? state.activePath ?? files[files.length - 1]?.path ?? null;
  const active = useMemo(
    () => files.find((file) => file.path === activePath) ?? files[files.length - 1],
    [activePath, files],
  );

  const lines = useMemo(() => {
    if (!active) {
      return [];
    }

    const all = active.content.split('\n');

    return all.slice(-MAX_RENDERED_LINES);
  }, [active]);

  // keep the viewport pinned to the caret while streaming
  useEffect(() => {
    if (!follow || !bodyRef.current) {
      return undefined;
    }

    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;

    return undefined;
  }, [active?.content, follow]);

  // rough throughput meter (communicates "live" without faking data)
  useEffect(() => {
    if (!active || active.done) {
      setLinesPerSecond(0);

      return undefined;
    }

    const timer = window.setInterval(() => {
      const current = studioStore.get().streamFiles.find((file) => file.path === active.path);

      if (current) {
        setLinesPerSecond(current.content.split('\n').length);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active]);

  const done = files.filter((file) => file.done).length;
  const totalLines = files.reduce((acc, file) => acc + file.content.split('\n').length, 0);
  const isStreaming = state.phase === 'generating' && !active?.done;

  return (
    <div className={classNames('flex flex-col gap-3 min-h-0', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="section-label">Live code stream</span>
        <span className="chip">
          <span className={classNames(isStreaming && 'animate-pulse')}>▍</span>
          {done}/{files.length || 0} files
        </span>
        <span className="chip">{totalLines.toLocaleString()} lines</span>
        <span className="chip">{state.stats ? `${(state.stats.bytes / 1024).toFixed(1)} KB` : '—'}</span>
        <button
          type="button"
          onClick={() => setFollow((value) => !value)}
          className={classNames('ml-auto', follow ? 'chip-active' : 'chip')}
          aria-pressed={follow}
        >
          <span className="i-ph:arrows-down-up text-sm" />
          Follow caret
        </button>
      </div>

      <div className="xv-progress" aria-hidden="true">
        <i style={{ width: `${state.progress}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {files.slice(-14).map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => setSelected(file.path)}
            className={classNames(
              'chip max-w-[240px] truncate',
              file.path === active?.path && 'chip-active',
              file.done && 'border-emerald-500/40',
            )}
            title={file.path}
          >
            <span className={classNames('text-sm', file.done ? 'i-ph:check' : 'i-ph:circle-dashed')} />
            {file.path.split('/').pop()}
          </button>
        ))}
      </div>

      <div className="xv-stream flex-1 min-h-0 flex flex-col">
        <div className="xv-stream-head">
          <span className="xv-dot-row">
            <i />
            <i />
            <i />
          </span>
          <span className="path truncate">{active?.path ?? 'waiting for the first file…'}</span>
          <span className="ml-auto flex items-center gap-2 text-[11px] text-xova-elements-textTertiary">
            {isStreaming ? (
              <>
                <span className="i-svg-spinners:90-ring-with-bg" />
                writing · {linesPerSecond} lines buffered
              </>
            ) : (
              <>
                <span className="i-ph:check-circle text-emerald-400" />
                settled
              </>
            )}
          </span>
        </div>

        <div ref={bodyRef} className="xv-stream-body xv-scroll flex-1 min-h-0">
          <AnimatePresence initial={false}>
            {lines.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-xova-elements-textTertiary"
              >
                Send a prompt — files will stream in here line by line as the engine writes them.
              </motion.p>
            ) : (
              lines.map((line, index) => {
                const absoluteIndex = (active?.content.split('\n').length ?? 0) - lines.length + index;
                const isLast = index === lines.length - 1 && isStreaming;

                return (
                  <div
                    key={`${active?.path}-${absoluteIndex}`}
                    className={classNames('xv-stream-line', { 'is-new': isLast })}
                  >
                    <span className="no">{absoluteIndex + 1}</span>
                    <span>
                      {tokenizeLine(line).map((token, tokenIndex) => (
                        <span key={tokenIndex} className={tokenClassName(token.type)}>
                          {token.value}
                        </span>
                      ))}
                      {isLast ? <span className="xv-caret" aria-hidden="true" /> : null}
                    </span>
                  </div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Metric label="Engine" value={state.engine} icon="i-ph:cpu" />
        <Metric
          label="Language mix"
          value={
            files.length
              ? Array.from(new Set(files.map((file) => detectLanguage(file.path))))
                  .slice(0, 4)
                  .join(' · ')
              : '—'
          }
          icon="i-ph:code"
        />
        <Metric
          label="Last write"
          value={
            files.length
              ? `${active?.path.split('/').pop() ?? '—'} · ${(active?.content.length ?? 0).toLocaleString()} chars`
              : '—'
          }
          icon="i-ph:file-text"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={!active}
          onClick={() => {
            if (active) {
              void navigator.clipboard.writeText(active.content);
              upsertStudioFile(active.path, active.content);
            }
          }}
        >
          <span className="i-ph:clipboard-text" /> Copy active file
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() =>
            setSelected(studioStore.get().streamFiles[studioStore.get().streamFiles.length - 1]?.path ?? null)
          }
        >
          <span className="i-ph:arrow-down" /> Jump to newest
        </button>
      </div>
    </div>
  );
});

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: cubicEasingFn }}
      className="panel px-3 py-2"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-xova-elements-textTertiary">
        <span className={icon} />
        {label}
      </div>
      <p className="text-sm mt-1 truncate" title={value}>
        {value}
      </p>
    </motion.div>
  );
}
