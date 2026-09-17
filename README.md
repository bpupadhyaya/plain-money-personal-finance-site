# plain-money-personal-finance-site

PlainMoney's public companion website — marketing, education, and a live demo of a few of
the app's calculators. Plain static HTML/CSS/JS, no build step, no framework, no backend.
Deploys via GitHub Pages (push to `main`).

- **Mobile apps (private, proprietary):** `pvt/plain-money` — iOS (SwiftUI) + Android (Compose).
- **This site (public):** marketing + education + a stateless demo of a few free tools. It
  never contains the app's proprietary source, and it never persists anything about a visitor
  — no accounts, no analytics, no cookies, no localStorage for tool inputs.

## Pages

- `index.html` — home: hero, principles strip, live calculators, how-it-works, Learn preview,
  Safety (free-forever), versus section, app/Pro CTA band.
- `learn/` — hub (`index.html`, all 21 modules) + 4 live articles (emergency fund, compound
  interest, being scammed, rent-to-own/payday loans).
- `tools/` — hub of 5 live calculators (50/30/20, emergency fund, compound growth, real-cost/
  inflation, debt payoff order).
- `safety/` — Safety hub (free forever, no Pro UI anywhere near it, by design).
- `privacy.html` — explains the site-vs-app privacy boundary explicitly.
- `assets/css/style.css` — the whole design system (see the file header comment for the
  palette rationale: it's pulled from the shipped app's own "Paper & Ink" theme tokens, using
  the same structural formula — Inter, pill kickers, 14px card radius — as nutrisize.health
  and insurance-site, but this product's own colors).
- `assets/js/tools.js` — all calculator logic, vanilla JS, no dependencies.

## Editing content

No template system — header/footer/nav are hand-copied per page (same convention as
nutrisize-health-site and insurance-site), with relative paths adjusted per folder depth.
When adding a page under a new subfolder, copy an existing page at that depth and update its
nav/crumbs/footer links.

Every article that touches saving, debt, credit, tax, or investing content must end with a
"What this is not" box (the `.fineprint` class) — this mirrors the app's own hard rule
(`content/packs` front-matter house style, RECIPES.md R1 in the app repo): explain, never
advise.

## Full strategy / resume notes

See the app repo's own `docs/SITE_STRATEGY.md` (private) and the dotfiles global-memory file
`personal/plain-money-site.md` for the full plan, boundary rules, and what's still to build.
