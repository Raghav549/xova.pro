import { Link, useLocation } from '@remix-run/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { useScrollProgress, useStickyNav } from './motion';

const LINKS = [
  { href: '/templates', label: 'Templates' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/dashboard', label: 'Projects' },
];

export function SiteHeader() {
  const stuck = useStickyNav();
  const progress = useScrollProgress();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className={classNames('xv-site-nav', { 'is-stuck': stuck })}>
      <div className="xv-site-shell xv-site-nav-inner">
        <Link to="/" className="xv-site-logo">
          <span className="xv-logo-mark" aria-hidden="true" />
          Xova
        </Link>

        <nav className="xv-site-links" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} to={link.href} aria-current={location.pathname === link.href ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <ThemeSwitch className="hidden sm:inline-flex" />
          <Link to="/studio" className="xv-btn xv-btn-primary">
            Open Studio
            <span className="i-ph:arrow-right" />
          </Link>
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={open ? 'i-ph:x' : 'i-ph:list'} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: cubicEasingFn }}
            className="lg:hidden overflow-hidden border-t border-xova-elements-borderColor bg-xova-elements-bg-depth-2"
            aria-label="Mobile"
          >
            <div className="xv-site-shell py-3 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm text-xova-elements-textSecondary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/studio"
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm text-xova-elements-textPrimary"
              >
                Open Studio
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <div
        className="absolute left-0 bottom-0 h-px bg-gradient-to-r from-[var(--xova-accent-glow)] to-[var(--xova-accent-cyan)] transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
    </header>
  );
}
