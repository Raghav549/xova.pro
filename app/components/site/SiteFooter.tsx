import { Link } from '@remix-run/react';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', href: '/studio' },
      { label: 'Templates', href: '/templates' },
      { label: 'Projects', href: '/dashboard' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Build targets',
    links: [
      { label: 'Web apps', href: '/docs#web' },
      { label: 'Android + PWA', href: '/docs#android' },
      { label: '3D motion + physics', href: '/docs#motion' },
      { label: 'Backends & databases', href: '/docs#backend' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'API reference', href: '/docs#api' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="xv-site-footer">
      <div className="xv-site-shell">
        <div className="xv-footer-grid">
          <div>
            <Link to="/" className="xv-site-logo">
              <span className="xv-logo-mark" aria-hidden="true" />
              Xova
            </Link>
            <p className="text-sm text-xova-elements-textSecondary mt-3 max-w-[38ch]">
              The AI build studio for real products: web apps, Android builds, 3D motion physics experiences and heavy
              backends — generated as source you own.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="chip">
                <span className="xv-pulse-dot" /> Build engine online
              </span>
              <span className="chip">v2.0.0</span>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <strong className="text-sm">{column.title}</strong>
              <div className="mt-2">
                {column.links.map((link) => (
                  <Link key={link.label} to={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-10 pt-6 border-t border-xova-elements-borderColor text-sm text-xova-elements-textTertiary">
          <span>© {new Date().getFullYear()} Xova. Built for people who ship.</span>
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/terms">Terms</Link>
            <Link to="/contact">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="xv-site min-h-full">
      <div className="xv-aurora" aria-hidden="true" />
      <div className="xv-site-grid" aria-hidden="true" />
      {children}
    </div>
  );
}
