# Cricket Monster: frontend demo

Static HTML, CSS and JavaScript with no build step. Live at https://cricket-monster.vercel.app (Vercel deploys `main`).

| Page | What it shows |
|---|---|
| `/` | Real-footage hero, live product cards (match pick, warm-up question, leaderboard), points rules, fan posts, sign-up band |
| `/feed/` | Community feed: post box, filters, likes, replies, share, report |
| `/daily-monster/` | Five questions, 90-second timer, result review, leaderboard |
| `/match-monster/` | Featured matches, five picks saved in the browser, resolved and leaderboard views |
| `/profile/`, `/sign-in/`, `/admin/` | Account, email sign-in states, admin tools |

There's no backend: posts, picks and scores are sample data and browser storage only.

## Run locally

```bash
python -m http.server 8000     # or: npx serve .
```

Open http://localhost:8000/. Use a server rather than opening the HTML files directly, because pages load files with root paths like `/styles/v3.css`.

States for review:

- Feed error: `/feed/?state=error`
- Feed signed out: `/feed/?guest`
- Sign-in link expired: `/sign-in/?state=expired`
- Sign-in link invalid: `/sign-in/?state=invalid`

## Design

Mobile first: designed at 375px, with layouts added at 768px and 1024px. A bottom tab bar on phones, top navigation on desktop. Touch targets are at least 44px, with visible focus outlines and reduced-motion support.

- **Colours ("Floodlit night"):** near-black green background, floodlight-white text, ball red only for main buttons and live labels, pitch tan as an accent. Tokens are at the top of `styles/v3.css`.
- **Fonts, one per role,** self-hosted in `assets/fonts/`:

  | Role | Font | Token |
  |---|---|---|
  | Display (headlines) | Barlow Condensed | `--font-display` |
  | UI and body | Source Sans 3 | `--font-ui` |
  | Numbers (scores, timers, ranks) | Barlow Semi Condensed, tabular figures | `--font-num` |

- **Footage:** real Pexels recordings only. Credits are in the homepage footer; licence notes are in `tools/hero-motion/FOOTAGE-LICENSES.md`.

## Reusing the assets

| What | Files |
|---|---|
| Hero video, desktop | `assets/hero-shot.mp4`, `assets/hero-shot-poster.webp` |
| Hero video, mobile | `assets/hero-shot-mobile.mp4`, `assets/hero-shot-mobile-poster.webp` |
| Night-ground loop | `assets/stadium-hero.mp4`, `assets/stadium-hero-poster.webp` |
| Stadium photo | `assets/stadium.webp` |
| Logo and share image | `assets/ball-mark.svg`, `assets/cricket-monster-og.png` |
| Fonts and licences | `assets/fonts/` |
| Design tokens and components | `styles/v3.css`, `styles/fonts.css` |

To rebuild the hero videos from the original Pexels clips, see [tools/hero-motion/README.md](tools/hero-motion/README.md) (`npm install && npm run fetch && npm run encode`).

## Deploy

Vercel builds from GitHub. Pushing to `main` deploys to production; `tools/` is excluded through `.vercelignore`. Headers and clean URLs are in `vercel.json`.
