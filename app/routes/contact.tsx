import { type MetaFunction } from '@remix-run/react';
import { useState } from 'react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [
  { title: 'Contact — Xova' },
  { description: 'Talk to the Xova team about enterprise builds, migrations, design-system work or support.' },
];

const TOPICS = ['Product support', 'Enterprise / Studio plan', 'Migration help', 'Partnership', 'Something else'];

export default function ContactPage() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useReveal();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError('Please add your name.');
      return;
    }

    if (!/.+@.+\..+/.test(form.email)) {
      setError('That email address does not look right.');
      return;
    }

    if (form.message.trim().length < 12) {
      setError('Tell us a little more so we can help properly.');
      return;
    }

    setStatus('sending');

    try {
      // stored locally so the demo flow is honest about where the message goes
      const existing = JSON.parse(localStorage.getItem('xova_contact_queue') ?? '[]') as unknown[];
      existing.push({ ...form, topic, at: new Date().toISOString() });
      localStorage.setItem('xova_contact_queue', JSON.stringify(existing));

      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus('sent');
      setForm({ name: '', email: '', company: '', message: '' });
    } catch {
      setStatus('error');
      setError('Could not store your message in this browser.');
    }
  };

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Reveal>
              <span className="xv-kicker">Contact</span>
              <h1 className="xv-display mt-3">Tell us what you are building.</h1>
              <p className="xv-muted mt-4 max-w-[56ch]">
                Product questions, enterprise plans or a build that needs a human eye — we answer every message within
                one business day.
              </p>
            </Reveal>

            <Reveal delay={80} className="mt-8">
              <form className="xv-card flex flex-col gap-4" onSubmit={submit} noValidate>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTopic(item)}
                      className={classNames(topic === item ? 'chip-active' : 'chip')}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="section-label">Name</span>
                    <input
                      className="field"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      autoComplete="name"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="section-label">Email</span>
                    <input
                      className="field"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      autoComplete="email"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="section-label">Company (optional)</span>
                  <input
                    className="field"
                    value={form.company}
                    onChange={(event) => setForm({ ...form, company: event.target.value })}
                    autoComplete="organization"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="section-label">What are you building?</span>
                  <textarea
                    className="field resize-none"
                    rows={5}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                  />
                </label>

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <div className="flex items-center gap-3">
                  <button type="submit" className="xv-btn xv-btn-primary" disabled={status === 'sending'}>
                    {status === 'sending' ? (
                      <span className="i-svg-spinners:90-ring-with-bg" />
                    ) : (
                      <span className="i-ph:paper-plane-tilt" />
                    )}
                    {status === 'sending' ? 'Sending…' : 'Send message'}
                  </button>
                  {status === 'sent' && (
                    <span className="text-sm text-emerald-400 flex items-center gap-2">
                      <span className="i-ph:check-circle" /> Thanks — we will reply within one business day.
                    </span>
                  )}
                </div>
                <p className="text-xs text-xova-elements-textTertiary">
                  This demo stores your message in this browser only (no backend is configured for the marketing site).
                  Wire it to your own inbox by pointing the generated API at it.
                </p>
              </form>
            </Reveal>
          </div>

          <div className="flex flex-col gap-4">
            <Reveal delay={120}>
              <div className="xv-card">
                <span className="section-label">Direct</span>
                <p className="text-sm mt-2">hello@xova.pro</p>
                <p className="text-sm">support@xova.pro</p>
                <p className="xv-muted text-xs mt-3">Mon–Fri · 9:00–18:00 CET · async-first team</p>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="xv-card">
                <span className="section-label">Response times</span>
                <ul className="flex flex-col gap-2 text-sm mt-2">
                  {[
                    ['Hobby', 'Community forum'],
                    ['Pro', 'Email · 1 business day'],
                    ['Studio', 'Shared Slack · 4h'],
                  ].map(([plan, time]) => (
                    <li key={plan} className="flex justify-between gap-3">
                      <span className="xv-muted">{plan}</span>
                      <span>{time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="xv-card">
                <span className="section-label">Prefer to just build?</span>
                <p className="xv-muted text-sm mt-2">
                  The studio needs no sign-up. Generate a project, export the ZIP and bring it to your own toolchain.
                </p>
                <a href="/studio" className="xv-btn xv-btn-outline mt-3">
                  Open the Studio
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
