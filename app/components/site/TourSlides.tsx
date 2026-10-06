import { useEffect, useRef, useState } from 'react';
import { classNames } from '~/utils/classNames';

interface TourSlide {
  id: string;
  title: string;
  caption: string;
  accent: string;
  render: () => JSX.Element;
}

function MockChrome({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute -inset-16 opacity-70"
        style={{ background: `radial-gradient(60% 60% at 20% 10%, ${accent}44, transparent 70%)` }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const SLIDES: TourSlide[] = [
  {
    id: 'brief',
    title: 'Prompt → brief',
    caption:
      'Xova reads intent, audience and tone, then locks a design system and target list before writing a line of code.',
    accent: '#7c5cff',
    render: () => (
      <MockChrome accent="#7c5cff">
        <div className="flex flex-col gap-3 p-4 text-xs">
          <div className="flex gap-2">
            <span className="chip">web</span>
            <span className="chip">android</span>
            <span className="chip">backend</span>
            <span className="chip-active">3D + physics</span>
          </div>
          <div className="rounded-xl border border-xova-elements-borderColor bg-xova-glass-background p-3 leading-relaxed text-xova-elements-textSecondary">
            “Build a cinematic 3D physics site for a studio called Lumen — dark nebula theme, WebGL hero with rigid
            bodies, pricing and a contact form.”
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Theme: Nebula', 'Bodies: 24', 'Sections: 9'].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-xova-elements-borderColor p-2 text-center text-xova-elements-textTertiary"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </MockChrome>
    ),
  },
  {
    id: 'stream',
    title: 'Live code stream',
    caption:
      'Files stream in line by line with syntax highlighting, a moving caret and per-file status — you watch the project being written.',
    accent: '#22d3ee',
    render: () => (
      <MockChrome accent="#22d3ee">
        <div className="p-4 mono-text text-[11px] leading-[1.7] text-xova-elements-textSecondary">
          <div className="text-xova-elements-textTertiary mb-2">src/motion.ts · writing…</div>
          <div>
            <span className="xv-token-keyword">export function</span> <span className="xv-token-fn">startMotion</span>(){' '}
            {'{'}
          </div>
          <div className="pl-4">
            <span className="xv-token-keyword">const</span> canvas = document.
            <span className="xv-token-fn">getElementById</span>(<span className="xv-token-string">'xv-physics'</span>);
          </div>
          <div className="pl-4">
            <span className="xv-token-keyword">const</span> world = <span className="xv-token-keyword">new</span>{' '}
            <span className="xv-token-key">CANNON</span>.<span className="xv-token-fn">World</span>({'{'} gravity: [
            <span className="xv-token-number">0</span>, <span className="xv-token-number">-9.81</span>,{' '}
            <span className="xv-token-number">0</span>] {'}'});
          </div>
          <div className="pl-4">
            <span className="xv-token-comment">// fixed 1/120s timestep, pointer impulses</span>
          </div>
          <div className="pl-4">
            world.<span className="xv-token-fn">step</span>(<span className="xv-token-number">1 / 120</span>, dt,{' '}
            <span className="xv-token-number">4</span>);
            <span className="xv-caret" />
          </div>
        </div>
      </MockChrome>
    ),
  },
  {
    id: 'preview',
    title: 'Real preview panel',
    caption:
      'Device-accurate frames, rotate, zoom and fullscreen. The static preview engine renders even without the in-browser Node runtime.',
    accent: '#ff5fa2',
    render: () => (
      <MockChrome accent="#ff5fa2">
        <div className="h-full p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {['i-ph:monitor', 'i-ph:laptop', 'i-ph:device-tablet', 'i-ph:device-mobile'].map((icon, index) => (
              <span
                key={icon}
                className={classNames('icon-btn', index === 0 && 'bg-xova-elements-item-backgroundAccent')}
              >
                <span className={icon} />
              </span>
            ))}
            <div className="xv-address ml-2">
              <span className="i-ph:globe" />
              <span>xova.preview/lumen/preview.html</span>
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-xova-elements-borderColor bg-xova-elements-bg-depth-1 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-xova-elements-textTertiary">Lumen</div>
            <div className="text-lg font-semibold mt-1">Simulating 24 rigid bodies at 60fps</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg border border-xova-elements-borderColor bg-gradient-to-br from-[var(--xova-accent-glow)]/30 to-transparent"
                />
              ))}
            </div>
          </div>
        </div>
      </MockChrome>
    ),
  },
  {
    id: 'slides',
    title: 'Build slides',
    caption:
      'A swipeable deck narrates every stage of the build — brief, design system, interface, motion, data, ship.',
    accent: '#a78bfa',
    render: () => (
      <MockChrome accent="#a78bfa">
        <div className="h-full flex gap-3 p-4">
          {['Brief', 'Design', 'Motion', 'Data', 'Ship'].map((step, index) => (
            <div
              key={step}
              className={classNames(
                'flex-1 rounded-xl border p-3 text-xs flex flex-col gap-2',
                index === 2
                  ? 'border-xova-elements-borderColorActive bg-xova-elements-item-backgroundAccent'
                  : 'border-xova-elements-borderColor',
              )}
            >
              <span className="section-label">0{index + 1}</span>
              <strong className="text-sm">{step}</strong>
              <span className="text-xova-elements-textTertiary">
                {['Intent', 'Tokens', 'WebGL', 'Schema', 'Play Store'][index]}
              </span>
            </div>
          ))}
        </div>
      </MockChrome>
    ),
  },
  {
    id: 'ship',
    title: 'Ship everywhere',
    caption:
      'ZIP export, PWA manifest and a Capacitor Android project with signing steps — plus Docker for the backend.',
    accent: '#34d399',
    render: () => (
      <MockChrome accent="#34d399">
        <div className="p-4 flex flex-col gap-2 mono-text text-[11px] text-xova-elements-textSecondary">
          {[
            'npm install',
            'npm run build',
            'npx cap add android',
            'npm run android:sync',
            'cd android && ./gradlew bundleRelease',
            'docker compose up -d --build',
          ].map((command, index) => (
            <div
              key={command}
              className="flex items-center gap-2 rounded-lg border border-xova-elements-borderColor px-3 py-2"
            >
              <span className="text-xova-accent-cyan">$</span>
              <span>{command}</span>
              <span
                className={classNames(
                  'ml-auto',
                  index < 3 ? 'i-ph:check-circle text-emerald-400' : 'i-ph:circle text-xova-elements-textTertiary',
                )}
              />
            </div>
          ))}
        </div>
      </MockChrome>
    ),
  },
];

export function TourSlides() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, deltaX: 0 });
  const [dragDelta, setDragDelta] = useState(0);

  const go = (next: number) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));

  useEffect(() => {
    if (paused) {
      return undefined;
    }

    const timer = window.setInterval(() => setIndex((value) => (value + 1) % SLIDES.length), 6000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, startX: event.clientX, deltaX: 0 };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    setPaused(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) {
      return;
    }

    drag.current.deltaX = event.clientX - drag.current.startX;
    setDragDelta(drag.current.deltaX);
  };

  const onPointerUp = () => {
    if (!drag.current.active) {
      return;
    }

    drag.current.active = false;

    const delta = drag.current.deltaX;

    setDragDelta(0);

    if (Math.abs(delta) > 70) {
      go(index + (delta < 0 ? 1 : -1));
    }

    window.setTimeout(() => setPaused(false), 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <span className="xv-kicker">Product tour</span>
          <h2 className="xv-h2 mt-2">Watch a build move through the studio.</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="icon-btn" onClick={() => go(index - 1)} aria-label="Previous">
            <span className="i-ph:caret-left" />
          </button>
          <button type="button" className="icon-btn" onClick={() => go(index + 1)} aria-label="Next">
            <span className="i-ph:caret-right" />
          </button>
        </div>
      </div>

      <div
        className="xv-cover"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="xv-cover-track"
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${dragDelta}px), 0, 0)`,
            transition: drag.current.active ? 'none' : 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
            ['--cover-width' as string]: '100%',
          }}
        >
          {SLIDES.map((slide, slideIndex) => (
            <article
              key={slide.id}
              className={classNames('xv-cover-slide w-full', slideIndex === index && 'is-active')}
              aria-hidden={slideIndex !== index}
            >
              <div className="xv-cover-shot" style={{ borderColor: `${slide.accent}55` }}>
                {slide.render()}
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <span className="chip self-start" style={{ borderColor: `${slide.accent}66` }}>
                  {slide.title}
                </span>
                <p className="text-sm text-xova-elements-textSecondary max-w-[70ch]">{slide.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            aria-label={slide.title}
            onClick={() => go(slideIndex)}
            className={classNames(
              'h-1.5 rounded-full transition-all duration-300',
              slideIndex === index
                ? 'w-10 bg-gradient-to-r from-[var(--xova-accent-glow)] to-[var(--xova-accent-cyan)]'
                : 'w-4 bg-xova-elements-bg-depth-4',
            )}
          />
        ))}
      </div>
    </div>
  );
}
