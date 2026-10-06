import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BuildSlide } from '~/lib/engine/types';
import { goToSlide, studioStore } from '~/lib/stores/studio';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

export const DEFAULT_SLIDES: BuildSlide[] = [
  {
    id: 'brief',
    title: 'Brief decoded',
    subtitle: 'Intent, audience and tone',
    icon: 'i-ph:target',
    badge: 'Step 1',
    accent: '#7c5cff',
    bullets: ['Intent extracted from your prompt', 'Design system locked', 'Platform targets chosen'],
  },
  {
    id: 'system',
    title: 'Design system',
    subtitle: 'Tokens, type scale, grid',
    icon: 'i-ph:palette',
    badge: 'Step 2',
    accent: '#22d3ee',
    bullets: ['Contrast-checked color tokens', 'Fluid type scale', 'Component primitives'],
  },
  {
    id: 'interface',
    title: 'Interface assembly',
    subtitle: 'Sections with real content',
    icon: 'i-ph:layout',
    badge: 'Step 3',
    accent: '#a78bfa',
    bullets: ['Section library composed', 'Real copy, not lorem ipsum', 'Accessible landmarks'],
  },
  {
    id: 'motion',
    title: 'Motion & 3D physics',
    subtitle: 'Real WebGL + rigid bodies',
    icon: 'i-ph:cube',
    badge: 'Step 4',
    accent: '#ff5fa2',
    bullets: ['Three.js scene with a solver', 'Scroll-linked reveals', 'Pointer + touch impulses'],
  },
  {
    id: 'data',
    title: 'Data & backend',
    subtitle: 'Schema, API, auth',
    icon: 'i-ph:database',
    badge: 'Step 5',
    accent: '#34d399',
    bullets: ['Typed schema + migrations', 'Validated API handlers', 'Auth, Docker, CI'],
  },
  {
    id: 'ship',
    title: 'Build & ship',
    subtitle: 'Web, Android, CI',
    icon: 'i-ph:rocket-launch',
    badge: 'Step 6',
    accent: '#fbbf24',
    bullets: ['Production bundle', 'Capacitor Android project', 'One-click ZIP export'],
  },
];

interface SlideDeckProps {
  className?: string;
  autoplay?: boolean;
  compact?: boolean;
}

export function SlideDeck({ className, autoplay = false, compact = false }: SlideDeckProps) {
  const state = useStore(studioStore);
  const slides = state.blueprint?.slides ?? DEFAULT_SLIDES;
  const index = Math.min(state.activeSlide, slides.length - 1);
  const seen = new Set(state.slidesSeen);
  const deckRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; deltaX: number; dragging: boolean }>({
    startX: 0,
    deltaX: 0,
    dragging: false,
  });
  const [dragDelta, setDragDelta] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const active = slides[index];

  const go = useCallback((next: number) => {
    goToSlide(next);
  }, []);

  useEffect(() => {
    if (!autoplay || slides.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      go((studioStore.get().activeSlide + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [autoplay, go, slides.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowRight') {
        go(index + 1);
      } else if (event.key === 'ArrowLeft') {
        go(index - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go, index]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, deltaX: 0, dragging: true };
    setDragActive(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    dragRef.current.deltaX = event.clientX - dragRef.current.startX;
    setDragDelta(dragRef.current.deltaX);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    const width = deckRef.current?.clientWidth ?? 420;
    const threshold = Math.min(90, width * 0.18);
    const delta = dragRef.current.deltaX;

    dragRef.current.dragging = false;
    setDragDelta(0);
    setDragActive(false);

    if (Math.abs(delta) > threshold) {
      go(index + (delta < 0 ? 1 : -1));
    }

    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className={classNames('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="section-label">Build slides</span>
        <span className="text-xs text-xova-elements-textTertiary">
          {index + 1} / {slides.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="icon-btn"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            <span className="i-ph:caret-left" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => go(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
          >
            <span className="i-ph:caret-right" />
          </button>
        </div>
      </div>

      <div
        ref={deckRef}
        className="xv-deck flex-1"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="xv-deck-track"
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${dragDelta}px), 0, 0)`,
            transition: dragActive ? 'none' : undefined,
          }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={slide.id} className="xv-deck-slide" data-slide-index={slideIndex}>
              <article
                className="xv-deck-card"
                style={{ ['--slide-accent' as string]: slide.accent }}
                aria-hidden={slideIndex !== index}
              >
                <span className="xv-deck-badge">{slide.badge}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={classNames(slide.icon, 'text-2xl')}
                    style={{ color: slide.accent }}
                    aria-hidden="true"
                  />
                  <div>
                    <h3>{slide.title}</h3>
                    <p className="text-xs text-xova-elements-textSecondary">{slide.subtitle}</p>
                  </div>
                </div>

                {!compact && (
                  <ul>
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex items-center gap-2 text-[11px] text-xova-elements-textTertiary">
                  <span className={classNames('i-ph:check-circle', { 'text-emerald-400': seen.has(slideIndex) })} />
                  {seen.has(slideIndex) ? 'completed' : 'queued'}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="xv-deck-dots" role="tablist" aria-label="Build slides">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={slide.title}
            className={classNames({ 'is-active': slideIndex === index })}
            onClick={() => go(slideIndex)}
          />
        ))}
      </div>

      {active && (
        <motion.p
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: cubicEasingFn }}
          className="text-xs text-xova-elements-textTertiary mt-1 text-center"
        >
          Swipe, drag or use ← → to move through the build.
        </motion.p>
      )}
    </div>
  );
}
