# Reid Thomas — Portfolio

A dark-first, responsive portfolio for Reid Thomas, built with semantic HTML, tokenized CSS, and dependency-free JavaScript. The site has no client build step and includes a real Cloudflare Workers AI portfolio assistant.

## Architecture

- `index.html` — page content, semantic section structure, SVG system visual, command palette, and assistant markup.
- `styles.css` — design tokens, responsive layouts, product-interface visuals, motion, and reduced-motion fallbacks.
- `main.js` — navigation, scroll state, reveal controller, project filtering and permalinks, motion preferences, lab interaction, command palette, and enhanced pointer.
- `chat.js` — accessible assistant panel and client request handling.
- `functions/api/chat.js` — Cloudflare Pages Function that validates requests and calls Workers AI with a fixed, portfolio-grounded prompt.
- `404.html` — custom not-found route using the same accessible visual system.
- `_headers` — static-response security policy for Cloudflare Pages.
- `wrangler.toml` — Cloudflare Pages and Workers AI configuration.

The visual simulations are built from CSS and inline SVG, so there are no image or animation-library payloads. Interface visuals are explicitly labeled as illustrative; only the assistant panel performs real inference.

## Preview locally

The static interface can be opened directly or served with any static server:

```bash
npx serve .
```

To run the assistant locally with a Cloudflare account:

```bash
npx wrangler pages dev . --ai AI
```

## Deploy

Deploy through Cloudflare Pages Git integration or Wrangler:

```bash
npx wrangler pages deploy .
```

There is no build command; the publish directory is the repository root. Dashboard drag-and-drop should not be used because it does not compile the `functions/` directory.

In Cloudflare, add a Workers AI binding named `AI` to both Production and Preview environments.

### Abuse protection

The `Origin` check in `functions/api/chat.js` only blocks ordinary cross-site browser requests. A scripted client can forge that header, so it is not rate limiting or authentication.

Before resuming deployment, check the current Cloudflare documentation and account dashboard for rate-limiting availability, hostname coverage, and Workers AI quotas. Apply endpoint protection to every hostname that serves `/api/chat`, verify the resulting response in production, and consider Turnstile if automated abuse becomes a real issue. No dashboard protection is implied by this repository alone.

## Content to verify before publishing

Confirm the email address, GitHub and LinkedIn URLs, GPA, graduation date, current roles, and internship availability. The canonical, OpenGraph, structured-data, sitemap, and robots metadata all point at the primary production domain `https://reid-portfolio.pages.dev/` (Cloudflare Pages, where the assistant runs). If the primary domain changes, update `index.html` (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`), `sitemap.xml`, and `robots.txt` together. The GitHub Pages copy is a static mirror; its assistant launcher sends visitors to the primary Cloudflare site because the mirror cannot execute the Pages Function.

Portfolio facts have two public representations: the visible copy in `index.html` and the assistant grounding context in `functions/api/chat.js`. Update and review both whenever education, projects, experience, availability, or contact details change.

Project visuals are illustrative interface compositions based on the linked repositories and existing coursework claims. Replace them with owner-approved screenshots or recordings when available, and add direct repository, writeup, or demo links only where real destinations exist.
