# Reid Thomas — Portfolio

A dark-first, responsive portfolio for Reid Thomas, built with semantic HTML, tokenized CSS, and dependency-free JavaScript. The site has no client build step and includes a real Cloudflare Workers AI portfolio assistant.

## Architecture

- `index.html` — page content, semantic section structure, SVG system visual, command palette, and assistant markup.
- `styles.css` — design tokens, responsive layouts, product-interface visuals, motion, and reduced-motion fallbacks.
- `main.js` — navigation, scroll state, reveal controller, workflow visualization, project tilt, lab interaction, command palette, and enhanced pointer.
- `chat.js` — accessible assistant panel and client request handling.
- `functions/api/chat.js` — Cloudflare Pages Function that validates requests and calls Workers AI with a fixed, portfolio-grounded prompt.
- `wrangler.toml` — Cloudflare Pages and Workers AI configuration.

The visual simulations are built from CSS and inline SVG, so there are no image or animation-library payloads. The system display is explicitly labeled as a process visualization; only the assistant panel performs real inference.

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

### Abuse protection (free plan)

The `Origin` check in `functions/api/chat.js` only blocks cross-site requests from real browsers — a scripted client can forge the header, so it is not a rate control. On the Workers free plan the endpoint cannot bill you, but the daily Workers AI allocation can be drained. Add the one free WAF rate-limiting rule that every plan includes:

1. Cloudflare dashboard → your Pages project's zone → **Security → WAF → Rate limiting rules → Create rule**.
2. Match: **URI Path** `equals` `/api/chat`.
3. Rate: e.g. **20 requests per 1 minute** per client IP.
4. Action: **Block** (or **Managed Challenge**) for **1 minute**.

This applies to `*.pages.dev` and any custom domain. For stronger protection, add a Cloudflare Turnstile challenge to the chat request.

## Content to verify before publishing

Confirm the email address, GitHub and LinkedIn URLs, GPA, graduation date, current roles, and internship availability. The canonical, OpenGraph, structured-data, sitemap, and robots metadata all point at the primary production domain `https://reid-portfolio.pages.dev/` (Cloudflare Pages, where the assistant runs). If the primary domain changes, update `index.html` (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`), `sitemap.xml`, and `robots.txt` together. The GitHub Pages copy is a static mirror where the assistant shows its offline fallback.

Project visuals are illustrative interface compositions based on the verified coursework. Replace them with real project screenshots if those become available, and add direct repository/demo links where appropriate.
