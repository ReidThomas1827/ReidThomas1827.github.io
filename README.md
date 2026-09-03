# Reid Thomas — Portfolio

A responsive, accessible single-page portfolio built with plain HTML, CSS, and JavaScript. It has no build step. The page itself can be hosted on any static site service, but the AI portfolio assistant requires Cloudflare Pages (see below).

## Preview locally

Open `index.html` directly in a browser, or run any static file server in this directory.

For example, with Node.js:

```bash
npx serve .
```

## Customize

- Personal copy, experience, coursework, and links live in `index.html`.
- Colors, typography, spacing, and responsive layout live in `styles.css`.
- Navigation, current-year labels, active-section tracking, and reveal effects live in `main.js`.

Before publishing, confirm the email address, GitHub URL, LinkedIn URL, dates, GPA, and experience descriptions.

## Deploy

Deploy to Cloudflare Pages via the Git integration or with Wrangler:

```bash
npx wrangler pages deploy .
```

No build command is required; the publish directory is the repository root. Do **not** use dashboard drag-and-drop upload — it does not compile the `functions/` directory, so `/api/chat` would 404.

Without the assistant, the folder can also be deployed as-is to GitHub Pages, Netlify, or any other static host; the chat widget will show its fallback message there.

## Portfolio assistant

The corner chat widget uses a Cloudflare Pages Function at `functions/api/chat.js` and Cloudflare Workers AI. The model is called only on the server; no credential is exposed to the browser.

Before deploying the assistant:

1. Open the portfolio project in the Cloudflare dashboard.
2. Go to **Settings → Bindings → Add → Workers AI**.
3. Set the variable name to `AI`.
4. Add the binding for **both Production and Preview** environments.
5. Redeploy the Pages project.

For local testing with your Cloudflare account:

```bash
npx wrangler pages dev . --ai AI
```

A plain static server can preview the widget, but cannot execute the `/api/chat` function.

### Cost and abuse protection

On the Workers **free plan**, Workers AI includes a free daily allocation (10,000 neurons/day) and cannot bill you — once the allocation is exhausted, requests fail until the daily reset and the widget shows its fallback message. Usage-based charges only apply if the account is upgraded to the Workers Paid plan; see [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The function rejects requests without a matching `Origin` header, which blocks trivial scripted abuse. If the site is served from a custom domain, also add a [WAF rate-limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/) for `/api/chat` (one rule is included on the free plan).
