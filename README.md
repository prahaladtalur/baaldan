# Baal Dan Charities Website Redesign

A modern, donation-ready redesign of [baaldan.org](https://www.baaldan.org/) built to the visual and UX standard of large nonprofit sites (full-bleed photographic heroes, animated impact stats, program cards, testimonial carousel, transparency callouts), with all of the original site's content preserved and reorganized. The visual language (deep grassroots green, sun-baked clay accents, bold sans-serif type, documentary photography) takes cues from international NGO sites like [farmafrica.org](https://www.farmafrica.org/).

Pure static HTML/CSS/JS: **no build step, no dependencies, no framework.** Open it locally or drop it on any static host.

## Structure

```
index.html            Home
about.html             About Us, Our Grassroots Approach, About Tanya Pinto, Our Team
programs.html          What We Fund (food / education / WASH) + Grantee Partners
impact-news.html       Transparency & impact stats, Events & Fundraisers, News
donate.html            Donation flow, ways to give, employee matching, testimonials, FAQ
little-hero-film.html  Little Hero short film
contact.html           Contact form + Copyright & Privacy

admin.html             No-code content editor (see Editing content below)

assets/css/style.css   Design system (colors, type, components)
assets/js/main.js      All interactivity (nav, dark mode, counters, slider, accordion, donate form)
assets/img/            Hero and feature photography (see Photography below)
assets/data/content.json  Impact stats, testimonials, news items, and the upcoming event
partials/header.html   Shared header, injected client-side via fetch()
partials/footer.html   Shared footer, injected client-side via fetch()
```

## Running locally

Because the header/footer are loaded via `fetch()`, open the site through a local server rather than double-clicking the HTML files (`file://` blocks fetch of local files in most browsers):

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then visit `http://localhost:8080`.

## Features

- Responsive, accessible nav with dropdowns and a full-screen mobile menu
- Light/dark mode toggle (persisted in `localStorage`)
- Animated impact counters, scroll-reveal animations (progressive enhancement: content is fully visible with JavaScript disabled)
- Testimonial carousel, FAQ accordion, tap-to-expand country cards
- Donation panel: amount + frequency selection with live "your impact" messaging
- Employee matching-gift lookup (demo logic, see below)
- Newsletter and contact forms (demo, see below)

## Going live with real donations

The donate flow is fully built out on the front end but intentionally **does not move real money yet**. That requires the organization's own payment credentials, which weren't available to wire up. To connect it:

1. Open `donate.html` and find:
   ```html
   <form id="donate-form" data-paypal-business="REPLACE_WITH_PAYPAL_BUSINESS_EMAIL">
   ```
   Replace the placeholder with Baal Dan's PayPal business email. The form already posts to PayPal's standard `cmd=_donations` endpoint with the selected amount. No API keys needed.
2. For a card-based experience instead, swap the submit handler in `assets/js/main.js` (`initDonateForm`) to redirect to a Stripe Payment Link, or embed Stripe Checkout / PayPal Donate SDK directly.
3. The employee-matching search (`initMatchSearch` in `main.js`) and the newsletter/contact forms (`data-demo-form`) are currently front-end demos that show a confirmation toast. Wire them to a real matching-gift provider (e.g., Double the Donation) and an email/CRM endpoint (e.g., Formspree, a serverless function, or your ESP's API) respectively.

## Content

All copy, statistics, testimonials, grantee partners, news items, and bios were pulled directly from the live baaldan.org site (as of July 2026) and preserved, reorganized into a cleaner information architecture, but nothing removed.

## Photography

The photos in `assets/img/` are free-to-use stock images from [Unsplash](https://unsplash.com) (Unsplash License: free for commercial and non-commercial use), chosen to represent the regions and program types Baal Dan funds. None depict actual Baal Dan staff, donors, or beneficiaries. Swap them for real program photography as it becomes available. Every hero image is set via a single CSS rule (e.g. `.hero-home`, `.hero-about` in `assets/css/style.css`), so replacing a file is a one-line change.

## Editing content (no code required)

Impact stats, testimonials, news items, and the upcoming event live in `assets/data/content.json`, not hardcoded in the HTML, so they can be updated without touching any markup. `index.html`, `donate.html`, and `impact-news.html` all read from this file at load time via `assets/js/main.js` (falling back to whatever is already in the HTML if the fetch ever fails).

`admin.html` is a small, self-contained editor for that file, meant for a non-technical site owner:

1. Open `admin.html` on the live site (it's not linked from the nav, so only people with the URL will find it — share it directly rather than publicizing it).
2. The first visit walks through a one-time setup: generate a [fine-grained GitHub personal access token](https://github.com/settings/personal-access-tokens/new) scoped to just this repo with **Contents: Read and write** permission, and paste it in. It's saved only in that browser's `localStorage`.
3. From then on, the page loads the current content into a plain form (stats, testimonials, news, the event), and "Publish changes" commits the updated `content.json` straight to GitHub, no git commands, no editing JSON by hand. GitHub Pages picks up the change and republishes automatically within about a minute.

This intentionally avoids standing up a real backend or OAuth app: it's a static page that talks directly to GitHub's REST API using the pasted token, the same approach tools like Prose.io and StackEdit use. If the project outgrows this (multiple editors, richer content types), migrating to a proper git-backed CMS like Decap CMS is the natural next step.
