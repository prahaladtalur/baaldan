# Baal Dan Charities Website Redesign

A modern, donation-ready redesign of [baaldan.org](https://www.baaldan.org/) built to the visual and UX standard of large nonprofit sites (full-bleed photographic heroes, animated impact stats, program cards, testimonial carousel, transparency callouts), with all of the original site's content preserved and reorganized. The visual language, Baal Dan's own navy blue and flower mark (sampled directly from their logo), a warm clay accent for calls to action, bold sans-serif type, documentary photography, takes cues from international NGO sites like [farmafrica.org](https://www.farmafrica.org/) while staying true to the org's real brand identity.

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

admin/                 Decap CMS content editor (see Editing content below)

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

Editing is done through [Decap CMS](https://decapcms.org/) (`admin/index.html` + `admin/config.yml`), a git-backed CMS built for exactly this: a plain form UI, and every save is a real commit to this repo. Because GitHub OAuth requires a server-side secret, Decap uses Netlify purely as an authentication relay. No part of the actual site moves to Netlify: GitHub Pages keeps serving the live site exactly as it does today.

### One-time setup (do this once, not per edit)

1. **Create a GitHub OAuth App**: go to [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App.
   - Homepage URL: anything (e.g. the Netlify URL from step 2, once you have it).
   - Authorization callback URL: `https://api.netlify.com/auth/done` (exact value, this is Netlify's shared relay).
   - Save, then generate a **Client Secret**. Keep the Client ID and Client Secret handy.
2. **Deploy this same repo to Netlify** (used only to broker login, not to host the site): on [app.netlify.com](https://app.netlify.com), "Add new site" → "Import an existing project" → pick this GitHub repo. Accept the defaults and deploy (it's a static site, no build settings needed). This gives you a `*.netlify.app` URL.
3. **Enable the OAuth provider on that Netlify site**: in its dashboard, go to Project configuration → Access & security → OAuth → Install provider → GitHub, and paste in the Client ID and Client Secret from step 1.
4. **Editing happens at the Netlify URL's `/admin/` path** (e.g. `https://your-site-name.netlify.app/admin/`), not on the GitHub Pages URL: that's what makes the OAuth login resolve to the app you just configured. Bookmark that `/admin/` URL for whoever edits the site.

After that one-time setup, editing is just: open the `/admin/` link, log in with GitHub the first time, edit stats/testimonials/news/the event in the form, and hit Publish. Changes commit straight to `main`, and GitHub Pages republishes automatically within about a minute.
