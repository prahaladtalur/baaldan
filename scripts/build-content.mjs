import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const contentRoot = path.join(root, 'content');

if (dist !== path.resolve(root, 'dist') || !dist.startsWith(`${root}${path.sep}`)) {
  throw new Error('Refusing to build outside the project dist directory.');
}

function readRecords(folder) {
  const directory = path.join(contentRoot, folder);
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')))
    .filter((record) => record.published !== false);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function copy(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, path.join(dist, relativePath), { recursive: true });
}

if (process.argv.includes('--clean') && fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(?:html|css|js|svg|txt|xml)$/.test(entry.name)) copy(entry.name);
}
copy('assets');
copy('partials');

const pagesBySlug = Object.fromEntries(readRecords('pages').map((page) => [page.slug, page]));
const globalSettings = JSON.parse(fs.readFileSync(path.join(contentRoot, 'settings', 'global.json'), 'utf8'));
const stats = JSON.parse(fs.readFileSync(path.join(contentRoot, 'settings', 'stats.json'), 'utf8'));
const event = JSON.parse(fs.readFileSync(path.join(contentRoot, 'settings', 'event.json'), 'utf8'));

const testimonials = readRecords('testimonials').sort((a, b) => a.order - b.order);
const news = readRecords('news').sort((a, b) => a.order - b.order);
const partners = readRecords('partners').sort((a, b) => a.order - b.order);
const countries = readRecords('countries');

// ---------- assets/data/content.json (read at runtime by assets/js/main.js) ----------
const siteContent = {
  stats,
  testimonials: testimonials.map(({ quote, name, role, featured }) => ({ quote, name, role, featured: !!featured })),
  event,
  news: news.map(({ date, title, body }) => ({ date, title, body }))
};
fs.mkdirSync(path.join(dist, 'assets', 'data'), { recursive: true });
fs.writeFileSync(path.join(dist, 'assets', 'data', 'content.json'), JSON.stringify(siteContent, null, 2) + '\n', 'utf8');

// ---------- `<!-- cms:scope.field -->...<!-- /cms:scope.field -->` marker substitution ----------
// The markers themselves are kept in the output so the page stays editable after future builds.
const cmsMarkerPattern = /<!-- cms:([\w-]+\.[\w-]+) -->([\s\S]*?)<!-- \/cms:\1 -->/g;
function applyCmsMarkers(html) {
  return html.replace(cmsMarkerPattern, (match, key) => {
    const [scope, field] = key.split('.');
    const source = scope === 'global' ? globalSettings : pagesBySlug[scope];
    const value = source ? source[field] : undefined;
    if (value === undefined || value === null) return match;
    return `<!-- cms:${key} -->${value}<!-- /cms:${key} -->`;
  });
}

// ---------- `<!-- cms:collection:name --> ... <!-- /cms:collection:name -->` repeating regions ----------
function applyCollection(html, name, render) {
  const pattern = new RegExp(`(<!-- cms:collection:${name} -->)[\\s\\S]*?(<!-- /cms:collection:${name} -->)`);
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `$1\n${render()}\n        $2`);
}

function renderCountryCards({ programs }) {
  const list = countries
    .filter((c) => (programs ? true : c.show_on_home))
    .sort((a, b) => (programs ? a.programs_order - b.programs_order : a.home_order - b.home_order));
  return list.map((c) => (
    programs
      ? `        <div class="country-card reveal"><span class="flag">${c.flag}</span><h4>${escapeHtml(c.name)}</h4><div class="details">${c.programs_details}</div></div>`
      : `        <div class="country-card reveal"><span class="flag">${c.flag}</span><h4>${escapeHtml(c.name)}</h4><p style="font-size:.88rem;margin:0;">${c.home_blurb}</p></div>`
  )).join('\n');
}

function renderPartnerCards() {
  return partners.map((p) => (
    `        <div class="card reveal">\n          <span class="pill">${p.tag}</span>\n          <h3 style="margin-top:12px;">${escapeHtml(p.name)}</h3>\n          <p>${p.description}</p>\n        </div>`
  )).join('\n');
}

// ---------- attribute-based substitutions (not text nodes, so plain string/regex replace) ----------
function applySocialLinks(html) {
  return html.replace(/href="[^"]*"(\s+data-cms-social="([a-z_]+)")/g, (match, attrSuffix, key) => {
    const value = globalSettings[key];
    return value ? `href="${escapeHtml(value)}"${attrSuffix}` : match;
  });
}

function applyPaypalEmail(html) {
  if (!globalSettings.paypal_business_email) return html;
  return html.replaceAll('REPLACE_WITH_PAYPAL_BUSINESS_EMAIL', globalSettings.paypal_business_email);
}

for (const filename of fs.readdirSync(dist).filter((name) => name.endsWith('.html'))) {
  const filePath = path.join(dist, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  html = applyCmsMarkers(html);
  html = applySocialLinks(html);
  html = applyPaypalEmail(html);

  if (filename === 'index.html') html = applyCollection(html, 'countries:home', () => renderCountryCards({ programs: false }));
  if (filename === 'programs.html') {
    html = applyCollection(html, 'countries:programs', () => renderCountryCards({ programs: true }));
    html = applyCollection(html, 'partners', renderPartnerCards);
  }

  fs.writeFileSync(filePath, html, 'utf8');
}

for (const filename of fs.readdirSync(path.join(dist, 'partials')).filter((name) => name.endsWith('.html'))) {
  const filePath = path.join(dist, 'partials', filename);
  let html = fs.readFileSync(filePath, 'utf8');
  html = applyCmsMarkers(html);
  html = applySocialLinks(html);
  fs.writeFileSync(filePath, html, 'utf8');
}

console.log(`Built ${Object.keys(pagesBySlug).length} pages, ${testimonials.length} testimonials, ${news.length} news items, ${partners.length} partners and ${countries.length} countries into dist/.`);
