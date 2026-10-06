import {
  faqItems,
  featureCards,
  gallery,
  heroCopy,
  navLinks,
  posts,
  pricingTiers,
  products,
  statsFor,
  testimonials,
} from './copy';
import { themeVars } from './design';
import type { Blueprint, SectionKind } from './types';

const ICONS: Record<string, string> = {
  sparkle: '<path d="M12 2l1.9 5.6L19.5 9l-4.4 3.2L16.6 18 12 14.9 7.4 18l1.5-5.8L4.5 9l5.6-1.4z"/>',
  cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M3 7l9 5 9-5"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  rocket: '<path d="M5 15c-1 3 0 5 0 5s2 1 5 0M14 4c4-2 7 0 7 0s2 3 0 7c-2 4-8 8-8 8l-4-1-1-4s4-6 8-8z"/>',
  play: '<path d="M8 5l12 7-12 7z"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};

function icon(name: string, size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.sparkle}</svg>`;
}

function sectionOpen(id: string, className = ''): string {
  return `<section id="${id}" class="xv-section ${className}" data-reveal><div class="xv-shell">`;
}

function sectionClose(): string {
  return `</div></section>`;
}

export function renderNav(bp: Blueprint): string {
  const links = navLinks(bp);

  return `<header class="xv-nav" data-nav>
  <div class="xv-shell xv-nav-inner">
    <a class="xv-brand" href="#top" aria-label="${bp.brand} home">
      <span class="xv-brand-mark" aria-hidden="true"></span>
      <span class="xv-brand-name">${bp.brand}</span>
    </a>
    <nav class="xv-nav-links" aria-label="Primary">
      ${links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('\n      ')}
    </nav>
    <div class="xv-nav-actions">
      <button class="xv-btn xv-btn-ghost" data-scroll="#contact">Sign in</button>
      <button class="xv-btn xv-btn-primary" data-scroll="#contact">${bp.archetype === 'ecommerce' ? 'Cart (0)' : 'Get started'}</button>
      <button class="xv-burger" aria-label="Toggle navigation" data-burger><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

export function renderHero(bp: Blueprint, with3d: boolean): string {
  const copy = heroCopy(bp);

  return `<section id="top" class="xv-hero ${with3d ? 'xv-hero-3d' : ''}">
  ${with3d ? '<canvas id="xv-physics" class="xv-canvas" aria-hidden="true"></canvas><div class="xv-canvas-fallback" aria-hidden="true"></div>' : ''}
  <div class="xv-glow xv-glow-a" aria-hidden="true"></div>
  <div class="xv-glow xv-glow-b" aria-hidden="true"></div>
  <div class="xv-shell xv-hero-inner">
    <p class="xv-eyebrow" data-reveal data-delay="0">${copy.eyebrow}</p>
    <h1 class="xv-display" data-reveal data-delay="60">${copy.title}</h1>
    <p class="xv-lead" data-reveal data-delay="120">${copy.subtitle}</p>
    <div class="xv-hero-cta" data-reveal data-delay="180">
      <button class="xv-btn xv-btn-primary xv-btn-lg" data-scroll="#contact" data-magnetic>${copy.primary}${icon('arrow', 18)}</button>
      <button class="xv-btn xv-btn-ghost xv-btn-lg" data-scene-action="${with3d ? 'drop' : 'tour'}" data-magnetic>${copy.secondary}${icon(with3d ? 'plus' : 'play', 18)}</button>
    </div>
    <div class="xv-hero-badges" data-reveal data-delay="240">
      ${bp.platforms.map((platform) => `<span class="xv-chip">${platform}</span>`).join('\n      ')}
      ${bp.physics.engine !== 'none' ? '<span class="xv-chip xv-chip-live"><i></i>physics live</span>' : ''}
    </div>
  </div>
</section>`;
}

export function renderMarquee(bp: Blueprint): string {
  const items = [
    'Design',
    'Motion',
    'Three.js',
    'Physics',
    'TypeScript',
    'Edge',
    ...bp.platforms.map((p) => p.toUpperCase()),
  ];

  return `<div class="xv-marquee" aria-hidden="true"><div class="xv-marquee-track">
    ${[...items, ...items].map((item) => `<span>${item}</span><i>◆</i>`).join('')}
  </div></div>`;
}

export function renderFeatures(bp: Blueprint): string {
  const cards = featureCards(bp);

  return `${sectionOpen('features')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Capabilities</p>
    <h2 class="xv-h2">Everything ${bp.brand} needs, already wired.</h2>
    <p class="xv-lead xv-lead-sm">Generated as real, editable source — not a screenshot of a design.</p>
  </div>
  <div class="xv-grid xv-grid-3">
    ${cards
      .map(
        (card, index) => `<article class="xv-card" data-reveal data-delay="${index * 60}" data-tilt>
      <span class="xv-card-icon">${icon(card.icon)}</span>
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </article>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderStats(bp: Blueprint): string {
  const stats = statsFor(bp);

  return `${sectionOpen('stats', 'xv-stats-section')}
  <div class="xv-stats">
    ${stats
      .map(
        (stat, index) => `<div class="xv-stat" data-reveal data-delay="${index * 70}">
      <strong data-count="${stat.value}">${stat.value}</strong>
      <span>${stat.label}</span>
    </div>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderShowcase(bp: Blueprint): string {
  const items = gallery(bp);

  return `${sectionOpen('showcase')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Selected work</p>
    <h2 class="xv-h2">Built to be looked at twice.</h2>
  </div>
  <div class="xv-gallery">
    ${items
      .map(
        (
          item,
          index,
        ) => `<figure class="xv-tile" data-reveal data-delay="${index * 50}" data-tilt style="--ratio:${item.ratio};--hue:${item.hue}">
      <div class="xv-tile-art" aria-hidden="true"><span></span></div>
      <figcaption><strong>${item.title}</strong><em>${item.meta}</em></figcaption>
    </figure>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderPricing(bp: Blueprint): string {
  const tiers = pricingTiers(bp);

  return `${sectionOpen('pricing')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Pricing</p>
    <h2 class="xv-h2">Start free. Scale when it works.</h2>
  </div>
  <div class="xv-grid xv-grid-3 xv-pricing">
    ${tiers
      .map(
        (
          tier,
          index,
        ) => `<article class="xv-card xv-tier ${tier.featured ? 'xv-tier-featured' : ''}" data-reveal data-delay="${index * 70}">
      ${tier.featured ? '<span class="xv-tier-tag">Most popular</span>' : ''}
      <h3>${tier.name}</h3>
      <p class="xv-price"><strong>${tier.price}</strong><span>${tier.period}</span></p>
      <p>${tier.blurb}</p>
      <ul>${tier.perks.map((perk) => `<li>${icon('check', 16)}${perk}</li>`).join('')}</ul>
      <button class="xv-btn ${tier.featured ? 'xv-btn-primary' : 'xv-btn-ghost'} xv-btn-block" data-scroll="#contact">Choose ${tier.name}</button>
    </article>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderTestimonials(bp: Blueprint): string {
  const quotes = testimonials(bp);

  return `${sectionOpen('testimonials')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Signal</p>
    <h2 class="xv-h2">Teams that stopped rebuilding boilerplate.</h2>
  </div>
  <div class="xv-grid xv-grid-3">
    ${quotes
      .map(
        (quote, index) => `<blockquote class="xv-card xv-quote" data-reveal data-delay="${index * 80}">
      <p>“${quote.text}”</p>
      <footer><span class="xv-avatar">${quote.initials}</span><span><strong>${quote.name}</strong><em>${quote.role}</em></span></footer>
    </blockquote>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderFaq(bp: Blueprint): string {
  const items = faqItems(bp);

  return `${sectionOpen('faq')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">FAQ</p>
    <h2 class="xv-h2">The questions that actually matter.</h2>
  </div>
  <div class="xv-faq">
    ${items
      .map(
        (
          item,
          index,
        ) => `<details class="xv-detail" data-reveal data-delay="${index * 50}" ${index === 0 ? 'open' : ''}>
      <summary>${item.q}<span class="xv-detail-icon" aria-hidden="true"></span></summary>
      <p>${item.a}</p>
    </details>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderTimeline(bp: Blueprint): string {
  return `${sectionOpen('timeline')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">How a build runs</p>
    <h2 class="xv-h2">From prompt to production in six moves.</h2>
  </div>
  <ol class="xv-timeline">
    ${bp.slides
      .map(
        (slide, index) => `<li class="xv-step" data-reveal data-delay="${index * 60}">
      <span class="xv-step-dot" style="--dot:${slide.accent}"></span>
      <div><strong>${slide.title}</strong><p>${slide.subtitle}</p></div>
    </li>`,
      )
      .join('\n    ')}
  </ol>
${sectionClose()}`;
}

export function renderStore(bp: Blueprint): string {
  const items = products(bp);

  return `${sectionOpen('showcase')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Shop</p>
    <h2 class="xv-h2">The current collection.</h2>
    <div class="xv-filters" role="tablist">
      ${['All', 'New', 'Sale', 'Archive'].map((f, i) => `<button class="xv-chip ${i === 0 ? 'is-active' : ''}" role="tab" data-filter="${f}">${f}</button>`).join('')}
    </div>
  </div>
  <div class="xv-grid xv-grid-4" data-cart-root>
    ${items
      .map(
        (
          product,
          index,
        ) => `<article class="xv-product" data-reveal data-delay="${index * 50}" data-tilt data-tag="${product.badge ?? 'All'}">
      <div class="xv-product-art" style="--hue:${product.hue}"><span></span></div>
      <div class="xv-product-body">
        <h3>${product.name}</h3>
        <p class="xv-product-price">${product.price}${product.badge ? `<em>${product.badge}</em>` : ''}</p>
        <button class="xv-btn xv-btn-primary xv-btn-block" data-add-to-cart data-name="${product.name}" data-price="${product.price}">Add to cart</button>
      </div>
    </article>`,
      )
      .join('\n    ')}
  </div>
  <div class="xv-cart" data-cart-panel hidden>
    <strong>Cart</strong>
    <ul data-cart-items></ul>
    <div class="xv-cart-total">Total <span data-cart-total>$0</span></div>
    <button class="xv-btn xv-btn-primary xv-btn-block" data-checkout>Checkout</button>
  </div>
${sectionClose()}`;
}

export function renderBlog(bp: Blueprint): string {
  const items = posts(bp);

  return `${sectionOpen('showcase')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Journal</p>
    <h2 class="xv-h2">Writing from the ${bp.brand} team.</h2>
  </div>
  <div class="xv-posts">
    ${items
      .map(
        (post, index) => `<article class="xv-post" data-reveal data-delay="${index * 60}">
      <span class="xv-chip">${post.tag}</span>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      <footer><em>${post.read} read</em><button class="xv-link" data-scroll="#contact">Read ${icon('arrow', 14)}</button></footer>
    </article>`,
      )
      .join('\n    ')}
  </div>
${sectionClose()}`;
}

export function renderDashboard(bp: Blueprint): string {
  const bars = [64, 42, 78, 55, 88, 71, 96, 60, 82, 48, 74, 90];

  return `${sectionOpen('dashboard')}
  <div class="xv-head" data-reveal>
    <p class="xv-eyebrow">Live product surface</p>
    <h2 class="xv-h2">The dashboard your users log into.</h2>
  </div>
  <div class="xv-app" data-reveal>
    <aside class="xv-app-side">
      <div class="xv-app-logo"><span class="xv-brand-mark"></span>${bp.brand}</div>
      ${['Overview', 'Activity', 'Revenue', 'Customers', 'Settings'].map((item, i) => `<button class="xv-app-nav ${i === 0 ? 'is-active' : ''}">${item}</button>`).join('')}
    </aside>
    <div class="xv-app-main">
      <div class="xv-app-kpis">
        ${[
          ['MRR', '$48.2k', '+12.4%'],
          ['Active', '3,184', '+4.1%'],
          ['Churn', '1.2%', '-0.4%'],
          ['NPS', '62', '+6'],
        ]
          .map(
            ([label, value, delta]) =>
              `<div class="xv-kpi"><span>${label}</span><strong>${value}</strong><em class="${delta.startsWith('-') && label === 'Churn' ? 'up' : ''}">${delta}</em></div>`,
          )
          .join('')}
      </div>
      <div class="xv-chart" aria-hidden="true">
        ${bars.map((bar, index) => `<i style="--h:${bar}%;--d:${index * 40}ms"></i>`).join('')}
      </div>
      <div class="xv-table">
        ${['Acme Studio', 'Northlight', 'Kettle & Co', 'Fieldnotes']
          .map(
            (row, index) =>
              `<div class="xv-row"><span>${row}</span><em>${['active', 'trialing', 'active', 'past due'][index]}</em><span>$${1200 + index * 480}</span></div>`,
          )
          .join('')}
      </div>
    </div>
  </div>
${sectionClose()}`;
}

export function renderCta(bp: Blueprint): string {
  return `${sectionOpen('contact', 'xv-cta-section')}
  <div class="xv-cta" data-reveal>
    <h2 class="xv-h2">Start your ${bp.brand} build.</h2>
    <p class="xv-lead xv-lead-sm">${bp.description}</p>
    <form class="xv-form" data-contact novalidate>
      <input type="email" name="email" placeholder="you@company.com" required aria-label="Email address" />
      <button class="xv-btn xv-btn-primary" type="submit">Get access${icon('arrow', 16)}</button>
    </form>
    <p class="xv-form-note" data-contact-note>No credit card. Replies within one business day.</p>
  </div>
${sectionClose()}`;
}

export function renderFooter(bp: Blueprint): string {
  return `<footer class="xv-footer">
  <div class="xv-shell xv-footer-inner">
    <div>
      <div class="xv-brand"><span class="xv-brand-mark"></span><span class="xv-brand-name">${bp.brand}</span></div>
      <p>${bp.tagline}</p>
    </div>
    <div class="xv-footer-cols">
      <div><strong>Product</strong><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
      <div><strong>Platforms</strong>${bp.platforms.map((p) => `<a href="#top">${p}</a>`).join('')}</div>
      <div><strong>Stack</strong><a href="#top">${bp.stack.frontend}</a><a href="#top">${bp.stack.motion}</a><a href="#top">${bp.stack.backend}</a></div>
    </div>
  </div>
  <div class="xv-shell xv-footer-base">
    <span>© ${new Date().getFullYear()} ${bp.brand}. Generated by Xova.</span>
    <span>${bp.theme.name} theme · ${bp.quality} quality score</span>
  </div>
</footer>`;
}

export function renderSections(bp: Blueprint): string {
  const with3d = bp.physics.engine !== 'none';

  const renderers: Record<SectionKind, () => string> = {
    nav: () => renderNav(bp),
    hero: () => renderHero(bp, with3d),
    'hero-3d': () => renderHero(bp, with3d),
    marquee: () => renderMarquee(bp),
    features: () => renderFeatures(bp),
    stats: () => renderStats(bp),
    showcase: () => renderShowcase(bp),
    pricing: () => renderPricing(bp),
    testimonials: () => renderTestimonials(bp),
    faq: () => renderFaq(bp),
    timeline: () => renderTimeline(bp),
    store: () => renderStore(bp),
    'blog-list': () => renderBlog(bp),
    dashboard: () => renderDashboard(bp),
    contact: () => renderCta(bp),
    cta: () => renderCta(bp),
    footer: () => renderFooter(bp),
  };

  const body = bp.sections
    .map((section) => renderers[section]?.() ?? '')
    .filter((part) => {
      const trimmed = part.trimStart();

      /* nav and footer are rendered once, in document order, below */
      return !trimmed.startsWith('<header') && !trimmed.startsWith('<footer');
    })
    .join('\n');

  return `${renderNav(bp)}
<main>
${body}
</main>
${renderFooter(bp)}`;
}

export function styleSheet(bp: Blueprint): string {
  const theme = bp.theme;
  const radius = theme.radius;

  return `:root{${themeVars(theme)};--shell:1180px;--gap:clamp(16px,3vw,32px)}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img,canvas,svg{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
h1,h2,h3{font-family:var(--font-heading);line-height:1.05;letter-spacing:-.02em;margin:0}
p{margin:0}
button{font:inherit;color:inherit;cursor:pointer}
::selection{background:var(--accent);color:#fff}
.xv-shell{width:min(100% - 32px,var(--shell));margin-inline:auto}
.xv-nav{position:sticky;top:0;z-index:40;backdrop-filter:blur(18px);background:color-mix(in oklab,var(--bg) 82%,transparent);border-bottom:1px solid transparent;transition:border-color .3s}
.xv-nav.is-stuck{border-color:var(--border)}
.xv-nav-inner{display:flex;align-items:center;gap:18px;height:68px}
.xv-nav-links{display:flex;gap:22px;margin-left:auto;font-size:15px;color:var(--muted)}
.xv-nav-links a{position:relative;transition:color .2s}
.xv-nav-links a:hover{color:var(--text)}
.xv-nav-links a::after{content:"";position:absolute;left:0;right:100%;bottom:-6px;height:1px;background:var(--accent);transition:right .3s cubic-bezier(.2,.8,.2,1)}
.xv-nav-links a:hover::after{right:0}
.xv-nav-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
.xv-brand{display:flex;align-items:center;gap:10px;font-family:var(--font-heading);font-weight:600}
.xv-brand-mark{width:26px;height:26px;border-radius:9px;background:conic-gradient(from 140deg,var(--accent),var(--accent-2),var(--accent-3),var(--accent));box-shadow:0 0 22px color-mix(in oklab,var(--accent) 55%,transparent)}
.xv-brand-name{font-size:19px;letter-spacing:-.01em}
.xv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--border);border-radius:calc(${radius} * .62);padding:11px 18px;background:var(--surface);transition:transform .18s cubic-bezier(.2,.8,.2,1),background .2s,border-color .2s,box-shadow .3s}
.xv-btn:hover{transform:translateY(-2px)}
.xv-btn-primary{background:linear-gradient(135deg,var(--accent),color-mix(in oklab,var(--accent) 40%,var(--accent-2)));border-color:transparent;color:#fff;box-shadow:0 12px 30px -12px color-mix(in oklab,var(--accent) 80%,transparent)}
.xv-btn-ghost{background:transparent}
.xv-btn-lg{padding:14px 24px;font-size:17px}
.xv-btn-block{width:100%;margin-top:18px}
.xv-burger{display:none;flex-direction:column;gap:5px;background:none;border:0}
.xv-burger span{width:22px;height:2px;background:var(--text);display:block}
.xv-hero{position:relative;min-height:min(94vh,940px);display:grid;align-items:center;padding:96px 0 72px;overflow:hidden;isolation:isolate}
.xv-hero-inner{position:relative;z-index:3;max-width:900px}
.xv-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;touch-action:pan-y}
.xv-canvas-fallback{position:absolute;inset:0;z-index:0;background:radial-gradient(60% 60% at 70% 30%,color-mix(in oklab,var(--accent) 34%,transparent),transparent 70%),radial-gradient(50% 50% at 20% 70%,color-mix(in oklab,var(--accent-2) 26%,transparent),transparent 70%)}
.xv-glow{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;z-index:0}
.xv-glow-a{width:420px;height:420px;background:var(--accent);top:-120px;right:-60px}
.xv-glow-b{width:380px;height:380px;background:var(--accent-2);bottom:-140px;left:-80px;opacity:.35}
.xv-eyebrow{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
.xv-display{font-size:clamp(42px,7.4vw,92px);font-weight:700;background:linear-gradient(180deg,var(--text),color-mix(in oklab,var(--text) 55%,var(--accent)));-webkit-background-clip:text;background-clip:text;color:transparent}
.xv-lead{margin-top:22px;font-size:clamp(17px,2.1vw,22px);color:var(--muted);max-width:62ch}
.xv-lead-sm{font-size:17px}
.xv-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.xv-hero-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.xv-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:13px;text-transform:capitalize;color:var(--muted)}
.xv-chip-live i{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 12px #34d399;animation:xv-pulse 1.6s infinite}
.xv-chip.is-active{color:var(--text);border-color:color-mix(in oklab,var(--accent) 60%,transparent)}
@keyframes xv-pulse{50%{opacity:.35}}
.xv-marquee{overflow:hidden;border-block:1px solid var(--border);padding:16px 0;background:var(--bg-alt)}
.xv-marquee-track{display:flex;gap:26px;width:max-content;animation:xv-scroll 26s linear infinite;font-family:var(--font-heading);font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.xv-marquee-track i{color:var(--accent)}
@keyframes xv-scroll{to{transform:translateX(-50%)}}
.xv-section{padding:clamp(64px,10vw,128px) 0;position:relative}
.xv-head{max-width:760px;margin-bottom:clamp(30px,5vw,58px)}
.xv-h2{font-size:clamp(30px,4.6vw,54px);font-weight:650}
.xv-grid{display:grid;gap:var(--gap)}
.xv-grid-3{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.xv-grid-4{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.xv-card{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:${radius};padding:26px;backdrop-filter:blur(14px);transition:transform .4s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .4s;transform-style:preserve-3d}
.xv-card:hover{transform:translateY(-6px);border-color:color-mix(in oklab,var(--accent) 45%,var(--border));box-shadow:0 26px 60px -30px color-mix(in oklab,var(--accent) 60%,transparent)}
.xv-card-icon{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:color-mix(in oklab,var(--accent) 18%,transparent);color:var(--accent);margin-bottom:16px}
.xv-card h3{font-size:20px;margin-bottom:9px}
.xv-card p{color:var(--muted);font-size:15.5px}
.xv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--gap);text-align:center}
.xv-stat{background:var(--surface);border:1px solid var(--border);border-radius:${radius};padding:28px 18px}
.xv-stat strong{display:block;font-family:var(--font-heading);font-size:clamp(30px,4vw,44px);background:linear-gradient(120deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.xv-stat span{color:var(--muted);font-size:14.5px}
.xv-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:var(--gap)}
.xv-tile{margin:0;position:relative;border-radius:${radius};overflow:hidden;border:1px solid var(--border);background:var(--bg-alt)}
.xv-tile-art{aspect-ratio:var(--ratio,1/1);background:radial-gradient(85% 85% at 25% 20%,hsl(var(--hue) 85% 62%/.85),transparent 60%),linear-gradient(140deg,hsl(calc(var(--hue) + 46) 80% 56%/.7),transparent);position:relative;overflow:hidden}
.xv-tile-art span{position:absolute;inset:auto -20% -30% -20%;height:70%;background:color-mix(in oklab,var(--bg) 70%,transparent);filter:blur(28px)}
.xv-tile figcaption{display:flex;justify-content:space-between;padding:15px 18px;font-size:14.5px}
.xv-tile figcaption em{color:var(--muted);font-style:normal}
.xv-tile:hover .xv-tile-art{transform:scale(1.03);transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.xv-tier{display:flex;flex-direction:column}
.xv-tier-featured{border-color:color-mix(in oklab,var(--accent) 60%,transparent);background:linear-gradient(180deg,color-mix(in oklab,var(--accent) 14%,var(--surface)),var(--surface))}
.xv-tier-tag{align-self:flex-start;margin-bottom:12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.xv-price{display:flex;align-items:baseline;gap:6px;margin:14px 0 10px;font-family:var(--font-heading)}
.xv-price strong{font-size:40px}
.xv-price span{color:var(--muted)}
.xv-tier ul{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px;color:var(--muted);font-size:15px}
.xv-tier li{display:flex;gap:9px;align-items:flex-start}
.xv-tier li svg{color:var(--accent);flex:none;margin-top:4px}
.xv-quote{display:flex;flex-direction:column;justify-content:space-between}
.xv-quote p{font-family:var(--font-heading);font-size:19px;line-height:1.45;color:var(--text)}
.xv-quote footer{display:flex;gap:12px;align-items:center;margin-top:22px;font-size:14px}
.xv-quote footer em{display:block;color:var(--muted);font-style:normal}
.xv-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;font-size:13px;font-weight:600}
.xv-faq{display:grid;gap:12px;max-width:860px}
.xv-detail{background:var(--surface);border:1px solid var(--border);border-radius:${radius};padding:18px 22px;transition:border-color .3s}
.xv-detail[open]{border-color:color-mix(in oklab,var(--accent) 45%,var(--border))}
.xv-detail summary{display:flex;justify-content:space-between;gap:16px;cursor:pointer;font-family:var(--font-heading);font-size:18px;list-style:none}
.xv-detail summary::-webkit-details-marker{display:none}
.xv-detail-icon{position:relative;width:14px;height:14px;flex:none;margin-top:6px}
.xv-detail-icon::before,.xv-detail-icon::after{content:"";position:absolute;inset:50% 0 auto;height:2px;background:var(--accent)}
.xv-detail-icon::after{transform:rotate(90deg);transition:transform .3s}
.xv-detail[open] .xv-detail-icon::after{transform:rotate(0)}
.xv-detail p{margin-top:12px;color:var(--muted)}
.xv-timeline{list-style:none;padding:0;margin:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.xv-step{display:flex;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:${radius};padding:20px}
.xv-step p{color:var(--muted);font-size:15px;margin-top:4px}
.xv-step-dot{width:12px;height:12px;border-radius:50%;background:var(--dot);box-shadow:0 0 16px var(--dot);flex:none;margin-top:6px}
.xv-filters{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}
.xv-product{border:1px solid var(--border);border-radius:${radius};overflow:hidden;background:var(--surface);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
.xv-product:hover{transform:translateY(-6px);box-shadow:0 30px 60px -34px hsl(var(--hue) 80% 40%/.8)}
.xv-product-art{aspect-ratio:1/1;background:radial-gradient(80% 80% at 30% 25%,hsl(var(--hue) 88% 62%/.9),transparent 65%),linear-gradient(160deg,hsl(calc(var(--hue) + 40) 85% 55%/.6),transparent)}
.xv-product-body{padding:16px 18px 20px}
.xv-product-price{display:flex;gap:8px;align-items:center;color:var(--muted);margin:6px 0 4px}
.xv-product-price em{font-style:normal;font-size:12px;padding:2px 8px;border-radius:999px;background:color-mix(in oklab,var(--accent) 20%,transparent);color:var(--accent)}
.xv-cart{position:fixed;right:20px;bottom:20px;z-index:50;width:min(320px,86vw);background:color-mix(in oklab,var(--bg-alt) 92%,transparent);border:1px solid var(--border);border-radius:${radius};padding:18px;backdrop-filter:blur(20px);box-shadow:0 30px 70px -40px #000}
.xv-cart ul{list-style:none;margin:12px 0;padding:0;display:grid;gap:8px;font-size:15px;color:var(--muted);max-height:170px;overflow:auto}
.xv-cart-total{display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:12px;font-family:var(--font-heading)}
.xv-posts{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--gap)}
.xv-post{background:var(--surface);border:1px solid var(--border);border-radius:${radius};padding:24px;display:flex;flex-direction:column;gap:12px;transition:transform .35s,border-color .3s}
.xv-post:hover{transform:translateY(-5px);border-color:color-mix(in oklab,var(--accent) 45%,var(--border))}
.xv-post h3{font-size:21px}
.xv-post p{color:var(--muted);font-size:15.5px}
.xv-post footer{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:13.5px;margin-top:auto}
.xv-link{display:inline-flex;gap:6px;align-items:center;background:none;border:0;color:var(--accent)}
.xv-app{display:grid;grid-template-columns:210px 1fr;gap:0;border:1px solid var(--border);border-radius:${radius};overflow:hidden;background:var(--bg-alt);min-height:420px}
.xv-app-side{border-right:1px solid var(--border);padding:18px;display:grid;gap:6px;align-content:start;background:color-mix(in oklab,var(--bg) 70%,transparent)}
.xv-app-logo{display:flex;gap:9px;align-items:center;font-family:var(--font-heading);margin-bottom:14px}
.xv-app-nav{text-align:left;background:none;border:0;padding:9px 11px;border-radius:10px;color:var(--muted);transition:background .2s,color .2s}
.xv-app-nav:hover{background:var(--surface);color:var(--text)}
.xv-app-nav.is-active{background:color-mix(in oklab,var(--accent) 18%,transparent);color:var(--text)}
.xv-app-main{padding:22px;display:grid;gap:20px;align-content:start}
.xv-app-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.xv-kpi{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px}
.xv-kpi span{font-size:13px;color:var(--muted)}
.xv-kpi strong{display:block;font-family:var(--font-heading);font-size:24px;margin:4px 0}
.xv-kpi em{font-style:normal;font-size:12.5px;color:#34d399}
.xv-kpi em.up{color:#34d399}
.xv-chart{display:flex;align-items:flex-end;gap:8px;height:170px;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:14px}
.xv-chart i{flex:1;height:var(--h);border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--accent),color-mix(in oklab,var(--accent-2) 70%,transparent));animation:xv-grow .8s cubic-bezier(.2,.8,.2,1) calc(var(--d)) both}
@keyframes xv-grow{from{height:0;opacity:0}}
.xv-table{display:grid;gap:8px}
.xv-row{display:grid;grid-template-columns:1fr auto auto;gap:14px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;font-size:14.5px;color:var(--muted)}
.xv-row em{font-style:normal;color:var(--accent)}
.xv-cta-section{text-align:center}
.xv-cta{max-width:720px;margin-inline:auto;background:var(--surface);border:1px solid var(--border);border-radius:calc(${radius} * 1.4);padding:clamp(28px,5vw,54px);backdrop-filter:blur(16px)}
.xv-form{display:flex;gap:10px;margin-top:26px;flex-wrap:wrap}
.xv-form input{flex:1;min-width:220px;padding:13px 16px;border-radius:calc(${radius} * .62);border:1px solid var(--border);background:color-mix(in oklab,var(--bg) 60%,transparent);color:var(--text);font:inherit}
.xv-form input:focus{outline:2px solid color-mix(in oklab,var(--accent) 60%,transparent);outline-offset:2px}
.xv-form-note{margin-top:14px;font-size:14px;color:var(--muted)}
.xv-form-note.is-ok{color:#34d399}
.xv-footer{border-top:1px solid var(--border);margin-top:40px;padding:48px 0 28px;background:var(--bg-alt)}
.xv-footer-inner{display:grid;grid-template-columns:1.2fr 2fr;gap:32px}
.xv-footer p{color:var(--muted);margin-top:14px;max-width:44ch}
.xv-footer-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:24px}
.xv-footer-cols strong{display:block;font-family:var(--font-heading);margin-bottom:12px}
.xv-footer-cols a{display:block;color:var(--muted);padding:4px 0;font-size:15px;transition:color .2s}
.xv-footer-cols a:hover{color:var(--accent)}
.xv-footer-base{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:36px;padding-top:20px;border-top:1px solid var(--border);color:var(--muted);font-size:14px}
[data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}
[data-reveal].is-in{opacity:1;transform:none}
@media (max-width:860px){
  .xv-nav-links{position:fixed;inset:68px 0 auto;flex-direction:column;gap:0;background:var(--bg-alt);border-bottom:1px solid var(--border);padding:8px 20px 18px;display:none}
  .xv-nav-links.is-open{display:flex}
  .xv-nav-links a{padding:12px 0}
  .xv-burger{display:flex}
  .xv-brand-name{font-size:17px}
  .xv-app{grid-template-columns:1fr}
  .xv-app-side{grid-auto-flow:column;overflow-x:auto;border-right:0;border-bottom:1px solid var(--border)}
  .xv-app-logo{display:none}
  .xv-footer-inner{grid-template-columns:1fr}
  .xv-hero{min-height:86vh;padding-top:64px}
  body{font-size:16px}
}
@media (prefers-reduced-motion:reduce){
  *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
  [data-reveal]{opacity:1;transform:none}
  html{scroll-behavior:auto}
}`;
}
