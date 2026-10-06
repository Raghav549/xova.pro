import { type MetaFunction } from '@remix-run/cloudflare';
import { Link } from '@remix-run/react';
import { useState } from 'react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [
  { title: 'Pricing — Xova' },
  {
    name: 'description',
    content: 'Start free with the local build engine. Upgrade for hosted generation, team seats and deployment.',
  },
];

const PLANS = [
  {
    id: 'hobby',
    name: 'Hobby',
    monthly: 0,
    yearly: 0,
    blurb: 'Everything you need to build in the browser, forever free.',
    features: [
      'Unlimited local builds',
      'Xova build engine (no API key)',
      'Live preview, slides and code stream',
      'ZIP export + Android scaffold',
      'Community support',
    ],
    cta: 'Start building',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 24,
    yearly: 19,
    blurb: 'For builders shipping to production every week.',
    features: [
      'Hosted LLM generation (bring your own key or ours)',
      'Unlimited projects + cloud history',
      'Preview share links with passwords',
      'One-click deploy to Cloudflare, Netlify, Vercel',
      'Backend + database scaffolding',
      'Email support in one business day',
    ],
    featured: true,
    cta: 'Start 14-day trial',
  },
  {
    id: 'studio',
    name: 'Studio',
    monthly: 96,
    yearly: 79,
    blurb: 'Agency throughput: many clients, one design system.',
    features: [
      '5 seats included, more at $14/seat',
      'Design-system sync across projects',
      'Custom domains + white-label previews',
      'SSO, audit log, role permissions',
      'Priority queue for generation',
      'Shared Slack channel',
    ],
    cta: 'Talk to us',
  },
];

const COMPARISON: Array<[string, string, string, string]> = [
  ['Local build engine', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['LLM providers', 'Bring your own key', 'Managed + BYO', 'Managed + BYO'],
  ['Build slides & code stream', '✓', '✓', '✓'],
  ['Android / PWA export', '✓', '✓', '✓'],
  ['Backend scaffolding', '✓', '✓', '✓'],
  ['Cloud project history', '—', 'Unlimited', 'Unlimited'],
  ['Team seats', '1', '1', '5+'],
  ['Deploy integrations', '—', 'All targets', 'All targets + custom'],
  ['Support', 'Community', 'Email', 'Slack + priority'],
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  useReveal([yearly]);

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell">
          <Reveal className="text-center max-w-[62ch] mx-auto">
            <span className="xv-kicker">Pricing</span>
            <h1 className="xv-display mt-3">Free to build. Paid to scale.</h1>
            <p className="xv-muted mt-5">
              The build engine runs in your browser — so the free tier is genuinely useful, not a demo. Upgrade when you
              want managed generation, cloud history and team features.
            </p>

            <div className="inline-flex items-center gap-2 mt-8 panel px-2 py-1.5">
              {[
                { id: false, label: 'Monthly' },
                { id: true, label: 'Yearly · save 20%' },
              ].map((option) => (
                <button
                  key={String(option.id)}
                  type="button"
                  onClick={() => setYearly(option.id)}
                  className={classNames(
                    'rounded-lg px-3.5 py-2 text-sm transition-theme',
                    yearly === option.id
                      ? 'bg-xova-elements-item-backgroundAccent text-xova-elements-textPrimary'
                      : 'text-xova-elements-textSecondary',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3 mt-12">
            {PLANS.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 70}>
                <article
                  className={classNames(
                    'xv-card h-full flex flex-col gap-4',
                    plan.featured &&
                      'border-xova-elements-borderColorActive shadow-[0_30px_80px_-60px_var(--xova-accent-glow)]',
                  )}
                >
                  {plan.featured && <span className="chip chip-active self-start">Most popular</span>}
                  <div>
                    <h2 className="xv-h3">{plan.name}</h2>
                    <p className="xv-muted text-sm mt-1">{plan.blurb}</p>
                  </div>
                  <p className="flex items-baseline gap-2">
                    <strong className="text-4xl font-semibold tracking-tight">
                      ${yearly ? plan.yearly : plan.monthly}
                    </strong>
                    <span className="text-xova-elements-textTertiary">/month</span>
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-xova-elements-textSecondary">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="i-ph:check text-xova-accent-cyan mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.id === 'studio' ? '/contact' : '/studio'}
                    className={classNames('xv-btn mt-auto', plan.featured ? 'xv-btn-primary' : 'xv-btn-outline')}
                  >
                    {plan.cta}
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <div className="xv-card overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xova-elements-textTertiary">
                    <th className="pb-3 font-medium">Feature</th>
                    <th className="pb-3 font-medium">Hobby</th>
                    <th className="pb-3 font-medium">Pro</th>
                    <th className="pb-3 font-medium">Studio</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row[0]} className="border-t border-xova-elements-borderColor">
                      <td className="py-3 text-xova-elements-textSecondary">{row[0]}</td>
                      {row.slice(1).map((cell, index) => (
                        <td key={index} className="py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal className="mt-16 max-w-[58ch]">
            <h2 className="xv-h2">Questions we get before signing up.</h2>
            <div className="flex flex-col gap-3 mt-6">
              {[
                [
                  'Do I need an API key to use Xova?',
                  'No. The deterministic build engine runs locally in your browser and produces complete projects. Add a provider key when you want free-form generation with an LLM.',
                ],
                [
                  'Can I cancel or export everything?',
                  'Yes — every build is a normal project you can download as a ZIP at any time, on every plan including free.',
                ],
                [
                  'What happens to my keys and data?',
                  'API keys you enter are stored only in your browser storage and sent directly to the provider you choose. Builds stay on your machine unless you explicitly share them.',
                ],
                [
                  'Is there a discount for students or OSS?',
                  'Yes — write to us from your school or repository address and we will set you up on Pro for free.',
                ],
              ].map(([question, answer]) => (
                <details key={question} className="xv-card py-4">
                  <summary className="cursor-pointer font-medium flex items-center justify-between gap-4">
                    {question}
                    <span className="i-ph:plus text-xova-accent-cyan" />
                  </summary>
                  <p className="xv-muted text-sm mt-3">{answer}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
