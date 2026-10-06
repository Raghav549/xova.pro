import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { SiteFooter, SiteShell } from '~/components/site/SiteFooter';
import { SiteHeader } from '~/components/site/SiteHeader';
import { Reveal, useReveal } from '~/components/site/motion';

interface Clause {
  title: string;
  body: string[];
}

const DOCS: Record<string, { title: string; updated: string; intro: string; clauses: Clause[] }> = {
  privacy: {
    title: 'Privacy policy',
    updated: '2026-10-06',
    intro:
      'Xova is built so that your work stays yours. This page explains exactly what the product stores, where it travels and how to remove it.',
    clauses: [
      {
        title: 'What stays on your device',
        body: [
          'Projects, generated files, build history and prompts are stored in your browser using IndexedDB and localStorage. They are never uploaded by the app itself.',
          'API keys you enter in settings are kept in local storage and sent only to the provider you selected for that request.',
        ],
      },
      {
        title: 'What leaves your device',
        body: [
          'When you choose an LLM provider, the prompt and the relevant conversation context are sent to that provider over HTTPS using your own credentials.',
          'The local build engine performs no network requests at all — it runs entirely in the browser.',
        ],
      },
      {
        title: 'Preview frames',
        body: [
          'Generated pages are rendered inside a sandboxed iframe from a local blob URL. Third-party scripts are only loaded from CDNs when the generated design references them.',
        ],
      },
      {
        title: 'Your control',
        body: [
          'Delete individual builds from the Projects page, or clear local history entirely from Settings. Clearing browser storage removes everything Xova stored, permanently.',
          'For data requests relating to a hosted account, contact support and we will respond within 30 days.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of service',
    updated: '2026-10-06',
    intro:
      'Short version: build what you want, own what you generate, do not abuse the service. The details are below.',
    clauses: [
      {
        title: 'Your projects',
        body: [
          'You own the code Xova generates for you, including design systems, interfaces, physics scenes, backend code and exported archives.',
          'You are responsible for reviewing generated code before shipping it, especially authentication, payments and data handling.',
        ],
      },
      {
        title: 'Acceptable use',
        body: [
          'Do not use Xova to generate malware, phishing pages, content that infringes third-party rights, or anything that violates the terms of the model providers you configure.',
          'Automated abuse of the hosted service (rate-limit evasion, resale of raw API access) is not permitted.',
        ],
      },
      {
        title: 'Availability',
        body: [
          'The local build engine works offline. Hosted features depend on third-party providers and may be interrupted; we aim for best-effort uptime and publish changes in the changelog.',
        ],
      },
      {
        title: 'Liability',
        body: [
          'Xova is provided as-is, without warranty. To the maximum extent permitted by law, we are not liable for indirect or consequential damages arising from use of the service.',
        ],
      },
    ],
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `${data?.title ?? 'Legal'} — Xova` },
  { description: data?.intro ?? 'Xova legal information' },
];

export async function loader({ params }: LoaderFunctionArgs) {
  const doc = DOCS[params.doc ?? ''] ?? DOCS.privacy;

  return json({ ...doc, slug: params.doc ?? 'privacy' });
}

export default function LegalPage() {
  const doc = useLoaderData<typeof loader>();

  useReveal();

  return (
    <SiteShell>
      <SiteHeader />

      <main className="xv-site-section">
        <div className="xv-site-shell max-w-[780px]">
          <Reveal>
            <span className="xv-kicker">Legal</span>
            <h1 className="xv-display mt-3">{doc.title}</h1>
            <p className="xv-muted mt-4">{doc.intro}</p>
            <p className="text-xs text-xova-elements-textTertiary mt-2">Last updated {doc.updated}</p>
          </Reveal>

          <div className="flex flex-col gap-4 mt-8">
            {doc.clauses.map((clause, index) => (
              <Reveal key={clause.title} delay={index * 50}>
                <section className="xv-card">
                  <h2 className="xv-h3">{clause.title}</h2>
                  <div className="flex flex-col gap-2 mt-3">
                    {clause.body.map((paragraph) => (
                      <p key={paragraph} className="xv-muted text-sm">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8">
            <div className="xv-card flex flex-wrap items-center gap-3">
              <span className="text-sm xv-muted">
                Looking for the other document? Read the{' '}
                <Link to={doc.slug === 'privacy' ? '/legal/terms' : '/legal/privacy'} className="text-xova-accent-cyan">
                  {doc.slug === 'privacy' ? 'terms of service' : 'privacy policy'}
                </Link>
                .
              </span>
              <Link to="/contact" className="xv-btn xv-btn-outline ml-auto">
                Ask a question
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </SiteShell>
  );
}
