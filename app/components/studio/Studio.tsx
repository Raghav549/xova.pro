import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from '@remix-run/react';
import { toast } from 'react-toastify';
import { AssistantMessage } from '~/components/chat/AssistantMessage';
import { UserMessage } from '~/components/chat/UserMessage';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import type { Archetype } from '~/lib/engine/types';
import { useXovaChat } from '~/lib/hooks/useXovaChat';
import { listProjects, projectFromStudio, saveProject } from '~/lib/persistence/projects';
import { ensureRuntime, runtimeStore } from '~/lib/stores/runtime';
import {
  goToSlide,
  logStudio,
  resetStudio,
  setPreview,
  studioSettings,
  studioStore,
  studioTab,
  upsertStudioFile,
} from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { CodePanel } from './CodePanel';
import { Composer } from './Composer';
import { ExportPanel } from './ExportPanel';
import { ModelBar } from './ModelBar';
import { PreviewPanel } from './PreviewPanel';
import { RuntimePanel } from './RuntimePanel';
import { SlideDeck } from './SlideDeck';
import { StreamPanel } from './StreamPanel';

type StudioPanelTab = 'slides' | 'preview' | 'code' | 'stream' | 'runtime' | 'export';

const TABS: Array<{ id: StudioPanelTab; label: string; icon: string }> = [
  { id: 'slides', label: 'Slides', icon: 'i-ph:presentation-chart' },
  { id: 'preview', label: 'Preview', icon: 'i-ph:browser' },
  { id: 'code', label: 'Code', icon: 'i-ph:code' },
  { id: 'stream', label: 'Stream', icon: 'i-ph:waveform' },
  { id: 'runtime', label: 'Runtime', icon: 'i-ph:terminal-window' },
  { id: 'export', label: 'Export', icon: 'i-ph:package' },
];

const PHASES = [
  { id: 'planning', label: 'Brief' },
  { id: 'designing', label: 'Design' },
  { id: 'generating', label: 'Files' },
  { id: 'runtime', label: 'Render' },
  { id: 'ready', label: 'Ready' },
] as const;

export const Studio = memo(({ projectId }: { projectId?: string }) => {
  const chat = useXovaChat([]);
  const state = useStore(studioStore);
  const runtime = useStore(runtimeStore);
  const settings = useStore(studioSettings);
  const tab = useStore(studioTab);

  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') ?? undefined;
  const [mobilePane, setMobilePane] = useState<'chat' | 'studio'>('chat');
  const [showLogs, setShowLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const persistedRef = useRef<string | null>(null);
  const autoSlideRef = useRef<number>(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void ensureRuntime();
  }, []);

  // load a stored build when opened through /studio/:id
  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    let cancelled = false;

    listProjects().then((projects) => {
      if (cancelled) {
        return;
      }

      const project = projects.find((candidate) => candidate.id === projectId || candidate.slug === projectId);

      if (!project) {
        toast.error('That build is not stored in this browser');
        return;
      }

      resetStudio(project.prompt);
      studioStore.setKey('blueprint', project.blueprint);
      studioStore.setKey('files', project.files);
      studioStore.setKey('stats', project.stats);
      studioStore.setKey('title', project.title);
      studioStore.setKey('engine', project.engine);
      studioStore.setKey('phase', 'ready');
      studioStore.setKey('progress', 100);
      studioStore.setKey(
        'streamFiles',
        project.files.map((file) => ({ path: file.path, content: file.content, done: true, startedAt: Date.now() })),
      );

      if (project.previewDoc) {
        setPreview(project.previewDoc);
      }

      logStudio('ok', `Loaded stored build “${project.title}”`);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // keep the conversation pinned to the newest message while streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: state.phase === 'generating' ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [chat.messages, chat.parsed, state.phase]);

  // drive the slide deck from real build progress
  useEffect(() => {
    if (state.phase === 'idle') {
      return undefined;
    }

    const slides = state.blueprint?.slides.length ?? 6;
    const target = Math.min(slides - 1, Math.floor((state.progress / 100) * slides));

    if (target !== autoSlideRef.current && state.phase !== 'ready') {
      autoSlideRef.current = target;
      goToSlide(target);
    }

    return undefined;
  }, [state.blueprint?.slides.length, state.phase, state.progress]);

  // persist finished builds locally
  useEffect(() => {
    if (state.phase !== 'ready' || !state.stats || state.files.length === 0) {
      return undefined;
    }

    const key = `${state.title}-${state.stats.bytes}`;

    if (persistedRef.current === key) {
      return undefined;
    }

    persistedRef.current = key;

    void saveProject(
      projectFromStudio({
        prompt: state.prompt,
        engine: state.engine,
        files: state.files,
        previewDoc: state.previewDoc,
        blueprint: state.blueprint,
        stats: state.stats,
      }),
    ).then(() => logStudio('ok', 'Build saved to local projects'));

    return undefined;
  }, [
    state.engine,
    state.files,
    state.phase,
    state.previewDoc,
    state.prompt,
    state.stats,
    state.title,
    state.blueprint,
  ]);

  const handleSubmit = useCallback(
    (prompt: string, options: { archetype?: Archetype; themeId?: string }) => {
      setMobilePane('chat');

      void chat.send(prompt, { archetype: options.archetype, themeId: options.themeId });
    },
    [chat],
  );

  const phaseIndex = useMemo(() => {
    const index = PHASES.findIndex((phase) => phase.id === state.phase);

    return index === -1 ? 0 : index;
  }, [state.phase]);

  const statusLabel =
    state.phase === 'idle'
      ? 'Ready for a brief'
      : state.phase === 'ready'
        ? 'Build ready'
        : state.phase === 'error'
          ? 'Needs attention'
          : 'Building…';

  return (
    <div className="xv-app-shell flex flex-col h-full w-full overflow-hidden">
      <header className="shrink-0 border-b border-xova-elements-borderColor bg-xova-glass-background backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-xova-elements-textPrimary shrink-0">
            <span className="xv-logo-mark" aria-hidden="true" />
            <span className="font-semibold hidden sm:inline">Xova Studio</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-xova-elements-textTertiary">/</span>
            <span className="text-sm truncate max-w-[220px]">{state.title}</span>
            <span className={classNames('chip', state.phase === 'error' && 'border-rose-500/40 text-rose-300')}>
              {state.phase === 'generating' || state.phase === 'planning' ? (
                <span className="i-svg-spinners:90-ring-with-bg text-sm" />
              ) : (
                <span
                  className={classNames(
                    'w-1.5 h-1.5 rounded-full',
                    state.phase === 'ready' ? 'bg-emerald-400' : 'bg-xova-elements-textTertiary',
                  )}
                />
              )}
              {statusLabel}
            </span>
            {state.stats && (
              <span className="chip hidden lg:inline-flex">
                {state.stats.files} files · {state.stats.lines.toLocaleString()} lines
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={classNames(
                'chip hidden sm:inline-flex',
                runtime.status === 'ready' && 'border-emerald-500/40',
              )}
              onClick={() => setShowSettings((value) => !value)}
              title="Build settings"
            >
              <span className="i-ph:cpu text-sm" />
              {settings.provider === 'local' ? 'Build engine' : settings.model || settings.provider}
              <span className="i-ph:caret-down text-xs opacity-60" />
            </button>

            <button
              type="button"
              className={classNames('chip', showLogs && 'chip-active')}
              onClick={() => setShowLogs((value) => !value)}
              title="Build logs"
            >
              <span className="i-ph:list-bullets text-sm" />
              <span className="hidden sm:inline">Logs</span>
              {state.logs.length > 0 && <span className="text-xova-elements-textTertiary">{state.logs.length}</span>}
            </button>

            <Link to="/dashboard" className="btn-ghost text-sm hidden lg:inline-flex">
              <span className="i-ph:squares-four" /> Projects
            </Link>

            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                chat.reset();
                resetStudio();
                persistedRef.current = null;
                toast.info('Started a fresh build');
              }}
            >
              <span className="i-ph:plus" />
              <span className="hidden sm:inline">New</span>
            </button>

            <ThemeSwitch className="hidden sm:inline-flex" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 sm:px-4 pb-3 overflow-x-auto xv-scroll">
          <div className="flex items-center gap-1.5 shrink-0">
            {PHASES.map((phase, index) => (
              <div key={phase.id} className="flex items-center gap-1.5">
                <span
                  className={classNames(
                    'px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.12em] border',
                    index <= phaseIndex && state.phase !== 'idle'
                      ? 'border-xova-elements-borderColorActive text-xova-elements-textPrimary bg-xova-elements-item-backgroundAccent'
                      : 'border-xova-elements-borderColor text-xova-elements-textTertiary',
                  )}
                >
                  {phase.label}
                </span>
                {index < PHASES.length - 1 && <span className="w-4 h-px bg-xova-elements-borderColor" />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 min-w-[160px] flex-1">
            <div className="xv-progress flex-1">
              <i style={{ width: `${state.phase === 'idle' ? 0 : state.progress}%` }} />
            </div>
            <span className="text-[11px] text-xova-elements-textTertiary w-8 text-right">
              {state.phase === 'idle' ? '—' : `${state.progress}%`}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: cubicEasingFn }}
              className="overflow-hidden border-t border-xova-elements-borderColor"
            >
              <div className="p-3 sm:p-4">
                <ModelBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* chat column */}
        <section
          className={classNames(
            'flex flex-col min-h-0 w-full lg:w-[46%] xl:w-[42%] border-r border-xova-elements-borderColor',
            mobilePane === 'chat' ? 'flex' : 'hidden lg:flex',
          )}
        >
          <div className="flex-1 min-h-0 overflow-auto xv-scroll px-3 sm:px-5 py-4 flex flex-col gap-4">
            {chat.messages.length === 0 && <WelcomePanel onPick={handleSubmit} />}

            {chat.messages.map((message) => {
              const isUser = message.role === 'user';
              const rendered = chat.parsed[message.id] ?? message.content;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: cubicEasingFn }}
                  className={classNames('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                >
                  {!isUser && (
                    <span className="shrink-0 w-8 h-8 rounded-xl bg-xova-elements-item-backgroundAccent flex items-center justify-center">
                      <span className="i-ph:sparkle text-xova-accent-cyan" />
                    </span>
                  )}

                  <div
                    className={classNames(
                      'rounded-2xl px-4 py-3 max-w-[92%] text-[15px] leading-relaxed',
                      isUser
                        ? 'bg-xova-elements-messages-background border border-xova-elements-borderColor'
                        : 'bg-xova-elements-artifacts-background border border-xova-elements-borderColor',
                    )}
                  >
                    {isUser ? <UserMessage content={message.content} /> : <AssistantMessage content={rendered} />}

                    {message.streaming && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-xova-elements-textTertiary">
                        <span className="i-svg-spinners:3-dots-fade text-lg" />
                        {state.engine === 'xova-build-engine' ? 'writing files…' : `${chat.engineLabel} streaming…`}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-xova-elements-borderColor bg-xova-elements-bg-depth-1/80 backdrop-blur-xl px-3 sm:px-5 py-3">
            <Composer
              onSubmit={handleSubmit}
              onStop={chat.stop}
              isStreaming={chat.isLoading}
              initialPrompt={initialPrompt}
            />
          </div>
        </section>

        {/* studio column */}
        <section
          className={classNames(
            'flex-1 min-w-0 flex flex-col min-h-0',
            mobilePane === 'studio' ? 'flex' : 'hidden lg:flex',
          )}
        >
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 overflow-x-auto xv-scroll">
            <div className="xv-tabbar shrink-0">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => studioTab.set(item.id)}
                  className={classNames('xv-tab', tab === item.id && 'is-active')}
                >
                  <span className={classNames(item.icon, 'text-sm mr-1.5 align-middle')} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {state.blueprint && (
                <span className="chip hidden xl:inline-flex">
                  <span className="i-ph:palette text-sm" />
                  {state.blueprint.theme.name}
                </span>
              )}
              {state.blueprint?.physics.engine !== 'none' && state.blueprint && (
                <span className="chip hidden xl:inline-flex">
                  <span className="i-ph:cube text-sm" />
                  {state.blueprint.physics.bodyCount} bodies
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 px-3 sm:px-4 pb-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28, ease: cubicEasingFn }}
                className="h-full min-h-0"
              >
                {tab === 'slides' && <SlideDeck className="h-full" autoplay={state.phase === 'generating'} />}
                {tab === 'preview' && <PreviewPanel />}
                {tab === 'code' && <CodePanel />}
                {tab === 'stream' && <StreamPanel className="h-full" />}
                {tab === 'runtime' && <RuntimePanel />}
                {tab === 'export' && <ExportPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showLogs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 190, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: cubicEasingFn }}
                className="shrink-0 border-t border-xova-elements-borderColor bg-xova-elements-bg-depth-1 overflow-hidden"
              >
                <div className="px-4 py-2 flex items-center gap-2 border-b border-xova-elements-borderColor">
                  <span className="section-label">Build log</span>
                  <span className="chip">{runtime.status === 'ready' ? 'runtime online' : 'static preview'}</span>
                  <button
                    type="button"
                    className="icon-btn ml-auto"
                    onClick={() => setShowLogs(false)}
                    aria-label="Close logs"
                  >
                    <span className="i-ph:x" />
                  </button>
                </div>
                <div className="h-[calc(190px-38px)] overflow-auto xv-scroll p-3 xv-log">
                  {state.logs.length === 0 && <p className="text-xova-elements-textTertiary">No events yet.</p>}
                  {state.logs
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className={classNames('xv-log-entry', entry.kind)}>
                        <time>{new Date(entry.at).toLocaleTimeString()}</time>
                        <span>{entry.text}</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* mobile pane switcher */}
      <nav className="lg:hidden shrink-0 border-t border-xova-elements-borderColor bg-xova-glass-background backdrop-blur-xl">
        <div className="grid grid-cols-2">
          {(['chat', 'studio'] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => setMobilePane(pane)}
              className={classNames(
                'py-3 text-sm font-medium capitalize transition-theme',
                mobilePane === pane ? 'text-xova-elements-textPrimary' : 'text-xova-elements-textTertiary',
              )}
            >
              <span
                className={classNames(pane === 'chat' ? 'i-ph:chat-circle-dots' : 'i-ph:layout', 'mr-1.5 align-middle')}
              />
              {pane}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
});

const WELCOME_IDEAS = [
  'Cinematic 3D physics site for a studio — WebGL hero, rigid bodies, pricing, contact.',
  'SaaS analytics dashboard with login, Postgres, REST API and realtime activity.',
  'Android-ready coffee shop app with cart, checkout and offline support.',
  'Editorial portfolio for a motion designer with case-study gallery.',
  'Browser game with gravity physics, score combos and touch controls.',
  'Production REST API with Docker, Drizzle migrations and session auth.',
];

function WelcomePanel({ onPick }: { onPick: (prompt: string, options: { archetype?: Archetype }) => void }) {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex flex-col gap-2">
        <span className="kicker section-label">Xova Studio</span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          What should we <span className="xv-gradient-text">build today</span>?
        </h1>
        <p className="text-sm text-xova-elements-textSecondary max-w-[52ch]">
          Real websites, 3D physics experiences, full-stack apps and Android builds — generated as editable source with
          a live preview, slide-by-slide plan and one-click export.
        </p>
      </div>

      <div className="grid gap-2">
        {WELCOME_IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => onPick(idea, {})}
            className="text-left panel panel-hover px-3.5 py-2.5 text-sm text-xova-elements-textSecondary hover:text-xova-elements-textPrimary"
          >
            <span className="i-ph:arrow-bend-down-right mr-2 text-xova-accent-cyan" />
            {idea}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <CapabilityTile
          icon="i-ph:cube"
          title="3D + physics"
          body="Three.js scenes with a rigid-body solver, not video loops."
        />
        <CapabilityTile
          icon="i-ph:android-logo"
          title="Android + PWA"
          body="Capacitor project, manifest and Play Store checklist."
        />
        <CapabilityTile
          icon="i-ph:database"
          title="Heavy backends"
          body="Hono API, Drizzle schema, auth, Docker, CI."
        />
        <CapabilityTile
          icon="i-ph:download-simple"
          title="Own the code"
          body="ZIP export with npm-proven files, or push straight to a host."
        />
      </div>
    </div>
  );
}

function CapabilityTile({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={classNames(icon, 'text-xova-accent-glow')} />
        {title}
      </div>
      <p className="text-xs text-xova-elements-textSecondary mt-1">{body}</p>
    </div>
  );
}

export function upsertAndPreview(path: string, content: string) {
  upsertStudioFile(path, content);
}
