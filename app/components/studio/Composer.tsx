import { motion, AnimatePresence } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { DEMO_PROMPTS } from '~/lib/engine/generator';
import { THEMES } from '~/lib/engine/design';
import type { Archetype } from '~/lib/engine/types';
import { usePromptEnhancer } from '~/lib/hooks';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

interface ComposerProps {
  onSubmit: (prompt: string, options: { archetype?: Archetype; themeId?: string }) => void;
  onStop: () => void;
  isStreaming: boolean;
  initialPrompt?: string;
}

const ARCHETYPES: Array<{ id: Archetype; label: string }> = [
  { id: 'landing', label: 'Landing page' },
  { id: 'motion-3d', label: '3D / motion site' },
  { id: 'saas', label: 'SaaS product' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ecommerce', label: 'Store' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'blog', label: 'Blog / docs' },
  { id: 'mobile-app', label: 'Mobile app' },
  { id: 'game', label: 'Game' },
  { id: 'fullstack-api', label: 'API / backend' },
];

export const Composer = memo(({ onSubmit, onStop, isStreaming, initialPrompt }: ComposerProps) => {
  const [value, setValue] = useState(initialPrompt ?? '');
  const [archetype, setArchetype] = useState<Archetype | ''>('');
  const [themeId, setThemeId] = useState('');
  const [showIdeas, setShowIdeas] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setValue(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 260)}px`;
  }, [value]);

  const submit = useCallback(
    (prompt?: string) => {
      const text = (prompt ?? value).trim();

      if (text.length === 0) {
        toast.info('Describe what you want to build first');
        return;
      }

      onSubmit(text, { archetype: archetype || undefined, themeId: themeId || undefined });
      setValue('');
      setShowIdeas(false);
      resetEnhancer();
    },
    [archetype, onSubmit, resetEnhancer, themeId, value],
  );

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {showIdeas && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: cubicEasingFn }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pb-1">
              {DEMO_PROMPTS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => setValue(demo.prompt)}
                  className="chip hover:-translate-y-px"
                >
                  <span className="i-ph:sparkle text-sm" />
                  {demo.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={classNames(
          'relative rounded-2xl border transition-theme',
          isStreaming
            ? 'border-xova-elements-borderColorActive shadow-[0_0_0_1px_var(--xova-elements-borderColorActive)]'
            : 'border-xova-elements-borderColor hover:border-xova-elements-borderColorActive',
          'bg-xova-glass-backgroundStrong backdrop-blur-xl',
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          spellCheck={false}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Describe the product: pages, motion, 3D physics, backend, platforms…"
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] text-xova-elements-textPrimary placeholder-xova-elements-textTertiary outline-none"
          rows={2}
        />

        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <button
            type="button"
            className={classNames('chip', 'hover:-translate-y-px')}
            onClick={() => {
              if (value.trim().length === 0) {
                toast.info('Write a short brief first — the enhancer expands it');
                return;
              }

              enhancePrompt(value, setValue);
            }}
            disabled={enhancingPrompt}
          >
            {enhancingPrompt ? (
              <span className="i-svg-spinners:90-ring-with-bg text-sm" />
            ) : (
              <span className="i-ph:magic-wand text-sm" />
            )}
            {promptEnhanced ? 'Enhanced' : enhancingPrompt ? 'Enhancing…' : 'Enhance'}
          </button>

          <label className="chip cursor-pointer">
            <span className="i-ph:layout text-sm" />
            <select
              className="bg-transparent outline-none max-w-[130px]"
              value={archetype}
              onChange={(event) => setArchetype(event.target.value as Archetype)}
              aria-label="Archetype"
            >
              <option value="">Auto-detect</option>
              {ARCHETYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="chip cursor-pointer">
            <span className="i-ph:palette text-sm" />
            <select
              className="bg-transparent outline-none max-w-[120px]"
              value={themeId}
              onChange={(event) => setThemeId(event.target.value)}
              aria-label="Theme"
            >
              <option value="">Auto theme</option>
              {THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-[11px] text-xova-elements-textTertiary">
              <kbd className="kdb">⌘</kbd> <kbd className="kdb">↵</kbd> build · <kbd className="kdb">⇧↵</kbd> newline
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (isStreaming) {
                  onStop();
                } else {
                  submit();
                }
              }}
              className={classNames(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
                isStreaming
                  ? 'bg-xova-elements-button-danger-background text-xova-elements-button-danger-text'
                  : 'bg-gradient-to-r from-[var(--xova-accent-glow)] to-[var(--xova-accent-cyan)] text-white shadow-[0_16px_34px_-18px_var(--xova-accent-glow)]',
              )}
            >
              {isStreaming ? (
                <>
                  <span className="i-ph:stop-fill" /> Stop
                </>
              ) : (
                <>
                  <span className="i-ph:hammer" /> Build it
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
});
