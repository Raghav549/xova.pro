import { useNavigate } from '@remix-run/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_PROMPTS, generateProject } from '~/lib/engine';
import type { GeneratedFile, Platform } from '~/lib/engine/types';
import { projectFromStudio, saveProject } from '~/lib/persistence/projects';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

type Stage = 'idle' | 'planning' | 'writing' | 'rendering' | 'done';

const STAGES: Array<{ id: Stage; label: string }> = [
  { id: 'planning', label: 'Reading the brief' },
  { id: 'writing', label: 'Writing files' },
  { id: 'rendering', label: 'Rendering preview' },
  { id: 'done', label: 'Ready' },
];

export function LiveDemo() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(DEMO_PROMPTS[0].prompt);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>(['web']);
  const [motion3d, setMotion3d] = useState(true);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previousUrl.current) {
        URL.revokeObjectURL(previousUrl.current);
      }
    };
  }, []);

  const togglePlatform = (platform: Platform) => {
    setPlatforms((current) => {
      const next = current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform];
      return next.length > 0 ? next : ['web'];
    });
  };

  const build = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    setStage('planning');
    setProgress(8);

    await new Promise((resolve) => setTimeout(resolve, 260));

    const result = generateProject(prompt, { platforms, motion3d });

    setStage('writing');
    setProgress(38);
    setFiles(result.files);
    setSummary(result.blueprint.metrics.map((metric) => `${metric.label}: ${metric.value}`));

    await new Promise((resolve) => setTimeout(resolve, 260));

    setStage('rendering');
    setProgress(76);

    const blob = new Blob([result.previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    if (previousUrl.current) {
      URL.revokeObjectURL(previousUrl.current);
    }

    previousUrl.current = url;
    setPreviewUrl(url);

    await new Promise((resolve) => setTimeout(resolve, 240));

    setProgress(100);
    setStage('done');
    setBusy(false);
    setBlueprint(result.blueprint.slug, result);
  }, [busy, motion3d, platforms, prompt]);

  const blueprintRef = useRef<{ slug: string; files: GeneratedFile[]; preview: string; title: string } | null>(null);

  const setBlueprint = (slug: string, result: ReturnType<typeof generateProject>) => {
    blueprintRef.current = {
      slug,
      files: result.files,
      preview: result.previewDoc,
      title: result.blueprint.brand,
    };
  };

  const openInStudio = async () => {
    const data = blueprintRef.current;

    if (!data) {
      return;
    }

    const result = generateProject(prompt, { platforms, motion3d });

    await saveProject(
      projectFromStudio({
        prompt,
        engine: 'xova-build-engine',
        files: result.files,
        previewDoc: result.previewDoc,
        blueprint: result.blueprint,
        stats: result.stats,
      }),
    );

    navigate(`/studio/${result.blueprint.slug}`);
  };

  const filePreview = useMemo(
    () =>
      files
        .filter((file) => /\.(ts|tsx|html|css)$/.test(file.path))
        .slice(0, 6)
        .map((file) => file.path),
    [files],
  );

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div>
          <span className="xv-kicker">Try it in your browser</span>
          <h2 className="xv-h2 mt-2">Generate a real project right now.</h2>
          <p className="xv-muted mt-3 text-sm">
            No sign-up, no API key. This runs the same Xova build engine the studio uses — it writes files, composes a
            design system and renders the result in the frame beside it.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEMO_PROMPTS.map((demo) => (
            <button
              key={demo.label}
              type="button"
              onClick={() => setPrompt(demo.prompt)}
              className={classNames('chip hover:-translate-y-px', prompt === demo.prompt && 'chip-active')}
            >
              {demo.label}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          rows={4}
          spellCheck={false}
          onChange={(event) => setPrompt(event.target.value)}
          className="field resize-none text-sm leading-relaxed"
          aria-label="Describe the project"
        />

        <div className="flex flex-wrap items-center gap-2">
          {(['web', 'android', 'ios', 'backend'] as Platform[]).map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              aria-pressed={platforms.includes(platform)}
              className={classNames(platforms.includes(platform) ? 'chip-active' : 'chip', 'capitalize')}
            >
              {platform}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMotion3d((value) => !value)}
            aria-pressed={motion3d}
            className={classNames(motion3d ? 'chip-active' : 'chip')}
          >
            <span className="i-ph:cube text-sm" /> 3D + physics
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="xv-btn xv-btn-primary xv-btn-lg" onClick={build} disabled={busy}>
            {busy ? <span className="i-svg-spinners:90-ring-with-bg" /> : <span className="i-ph:hammer" />}
            {busy ? 'Building…' : 'Generate project'}
          </button>
          <button type="button" className="xv-btn xv-btn-outline" onClick={openInStudio} disabled={stage !== 'done'}>
            Open in Studio
            <span className="i-ph:arrow-right" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {STAGES.map((item, index) => {
            const activeIndex = STAGES.findIndex((candidate) => candidate.id === stage);
            const done = activeIndex > index || stage === 'done';
            const active = stage === item.id;

            return (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  className={classNames(
                    done
                      ? 'i-ph:check-circle text-emerald-400'
                      : active
                        ? 'i-ph:circle-dashed text-xova-accent-cyan'
                        : 'i-ph:circle text-xova-elements-textTertiary',
                  )}
                />
                <span
                  className={classNames(
                    active || done ? 'text-xova-elements-textPrimary' : 'text-xova-elements-textTertiary',
                  )}
                >
                  {item.label}
                </span>
                {active && busy && <span className="i-svg-spinners:3-dots-fade ml-1" />}
              </div>
            );
          })}
        </div>

        <div className="xv-progress">
          <i style={{ width: `${progress}%` }} />
        </div>

        {summary.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        )}

        {filePreview.length > 0 && (
          <div className="panel p-3">
            <span className="section-label">Files written</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filePreview.map((path) => (
                <span key={path} className="chip mono-text">
                  <span className="i-ph:file-ts text-sm" />
                  {path}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="xv-preview-frame h-[520px]">
          <AnimatePresence mode="wait">
            {previewUrl ? (
              <motion.div
                key={previewUrl}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: cubicEasingFn }}
                className="xv-device w-full h-full"
              >
                <iframe
                  ref={previewRef}
                  title="Generated preview"
                  src={previewUrl}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  loading="lazy"
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center px-8">
                <span className="i-ph:cursor-click text-3xl text-xova-accent-cyan" />
                <p className="text-sm text-xova-elements-textSecondary max-w-sm">
                  Pick a brief and press <strong>Generate project</strong>. The finished page renders here — scroll
                  inside the frame, click the buttons, drop the physics bodies.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-xs text-xova-elements-textTertiary mt-3 text-center">
          {stage === 'done'
            ? 'Generated in this browser only — nothing is uploaded. Open it in the Studio to edit files and export a ZIP.'
            : 'Rendered in a sandboxed frame. Everything is generated on this device.'}
        </p>
      </div>
    </div>
  );
}
