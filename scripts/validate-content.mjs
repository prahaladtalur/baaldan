import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content');
const errors = [];
const warnings = [];

function records(folder) {
  const directory = path.join(contentRoot, folder);
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).map((name) => ({
    file: name,
    ...JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
  }));
}

function requireValue(record, field, label) {
  if (record[field] === undefined || record[field] === null || record[field] === '') errors.push(`${label}: missing ${field}`);
}

function validUrl(value) {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value, 'https://baaldan.org').protocol);
  } catch {
    return false;
  }
}

const pages = records('pages');
const testimonials = records('testimonials');
const news = records('news');
const partners = records('partners');
const countries = records('countries');

const pageSlugs = new Set();
const pagesBySlug = {};
for (const page of pages) {
  const label = `Page ${page.file}`;
  ['slug', 'published'].forEach((field) => requireValue(page, field, label));
  if (pageSlugs.has(page.slug)) errors.push(`${label}: duplicate slug ${page.slug}`);
  pageSlugs.add(page.slug);
  pagesBySlug[page.slug] = page;
}

const globalSettingsPath = path.join(contentRoot, 'settings', 'global.json');
let globalSettings = {};
if (!fs.existsSync(globalSettingsPath)) {
  errors.push('Settings: content/settings/global.json is missing');
} else {
  globalSettings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf8'));
  ['footer_tagline', 'copyright_line'].forEach((field) => requireValue(globalSettings, field, 'Settings global.json'));
  ['facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'youtube_url'].forEach((field) => {
    if (globalSettings[field] && !validUrl(globalSettings[field])) errors.push(`Settings global.json: invalid ${field}`);
  });
}

for (const file of ['stats.json', 'event.json']) {
  const p = path.join(contentRoot, 'settings', file);
  if (!fs.existsSync(p)) errors.push(`Settings: content/settings/${file} is missing`);
}

const testimonialSlugs = new Set();
for (const t of testimonials) {
  const label = `Testimonial ${t.file}`;
  ['slug', 'quote', 'name', 'role', 'order'].forEach((field) => requireValue(t, field, label));
  if (testimonialSlugs.has(t.slug)) errors.push(`${label}: duplicate slug ${t.slug}`);
  testimonialSlugs.add(t.slug);
}

const newsSlugs = new Set();
for (const n of news) {
  const label = `News ${n.file}`;
  ['slug', 'date', 'title', 'body', 'order'].forEach((field) => requireValue(n, field, label));
  if (newsSlugs.has(n.slug)) errors.push(`${label}: duplicate slug ${n.slug}`);
  newsSlugs.add(n.slug);
}

const partnerSlugs = new Set();
for (const p of partners) {
  const label = `Partner ${p.file}`;
  ['slug', 'name', 'description', 'order'].forEach((field) => requireValue(p, field, label));
  if (partnerSlugs.has(p.slug)) errors.push(`${label}: duplicate slug ${p.slug}`);
  partnerSlugs.add(p.slug);
}

const countrySlugs = new Set();
for (const c of countries) {
  const label = `Country ${c.file}`;
  ['slug', 'name', 'flag', 'programs_details', 'programs_order'].forEach((field) => requireValue(c, field, label));
  if (countrySlugs.has(c.slug)) errors.push(`${label}: duplicate slug ${c.slug}`);
  countrySlugs.add(c.slug);
  if (c.show_on_home && !c.home_blurb) errors.push(`${label}: show_on_home is true but home_blurb is empty`);
  if (c.show_on_home && !c.home_order) errors.push(`${label}: show_on_home is true but home_order is missing`);
}

// Every `<!-- cms:scope.field -->` marker in the root HTML/partials must resolve to a real
// field in content/pages/<scope>.json or content/settings/global.json, otherwise the
// build script silently leaves the marker's old placeholder text in place.
const cmsMarkerPattern = /<!-- cms:([\w-]+\.[\w-]+) -->/g;
const collectionPattern = /<!-- cms:collection:([\w-]+(?::[\w-]+)?) -->/g;
let markerCount = 0;
const htmlFiles = [
  ...fs.readdirSync(root).filter((name) => name.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'partials')).filter((name) => name.endsWith('.html')).map((name) => path.join('partials', name))
];
for (const relativeName of htmlFiles) {
  const html = fs.readFileSync(path.join(root, relativeName), 'utf8');
  for (const match of html.matchAll(cmsMarkerPattern)) {
    markerCount += 1;
    const [scope, field] = match[1].split('.');
    const source = scope === 'global' ? globalSettings : pagesBySlug[scope];
    if (!source) {
      errors.push(`${relativeName}: cms:${match[1]} references unknown page "${scope}"`);
    } else if (!(field in source)) {
      errors.push(`${relativeName}: cms:${match[1]} references unknown field "${field}"`);
    }
  }
  for (const match of html.matchAll(collectionPattern)) {
    const closing = `<!-- /cms:collection:${match[1]} -->`;
    if (!html.includes(closing)) errors.push(`${relativeName}: cms:collection:${match[1]} has no matching ${closing}`);
  }
}

console.log(`Pages: ${pages.length} (${markerCount} cms markers checked)`);
console.log(`Testimonials: ${testimonials.length}`);
console.log(`News: ${news.length}`);
console.log(`Partners: ${partners.length}`);
console.log(`Countries: ${countries.length}`);
if (warnings.length) {
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((warning) => console.log(`- ${warning}`));
}
if (errors.length) {
  console.error(`Errors: ${errors.length}`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Content validation passed.');
