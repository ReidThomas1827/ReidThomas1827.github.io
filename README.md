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

In Cloudflare, add a Workers AI binding named `AI` to both Production and Preview environments. If a custom domain is used, add a WAF rate-limit rule for `/api/chat`.

## Content to verify before publishing

Confirm the email address, GitHub and LinkedIn URLs, GPA, graduation date, current roles, and internship availability. Canonical, OpenGraph, and sitemap metadata currently use the verified GitHub Pages URL: `https://reidthomas1827.github.io/`. Update all three if the primary production domain changes.

Project visuals are illustrative interface compositions based on the verified coursework. Replace them with real project screenshots if those become available, and add direct repository/demo links where appropriate.
