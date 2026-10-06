import { createElement, useEffect, useRef, useState } from 'react';
import { classNames } from '~/utils/classNames';

/** Reveals `[data-reveal]` descendants as they scroll into view. */
export function useReveal(dependencies: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const elements = Array.from(document.querySelectorAll('[data-reveal]'));

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-in'));

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const delay = Number(entry.target.getAttribute('data-delay') ?? 0);
          window.setTimeout(() => entry.target.classList.add('is-in'), delay);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '-6% 0px -6% 0px', threshold: 0.12 },
    );

    elements.forEach((element) => {
      if (!element.classList.contains('is-in')) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, dependencies);
}

/** Sticky nav shadow + progress for the marketing site. */
export function useStickyNav() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 10);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return stuck;
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return progress;
}

export function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (!start) {
      return undefined;
    }

    const startedAt = performance.now();

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);

      setValue(target * eased);

      if (elapsed < 1) {
        frame.current = requestAnimationFrame(step);
      }
    };

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [duration, start, target]);

  return value;
}

interface RevealProps {
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Reveal({ delay = 0, as = 'div', className, style, children }: RevealProps) {
  return createElement(
    as,
    { 'data-reveal': true, 'data-delay': delay, className: classNames(className), style },
    children,
  );
}
