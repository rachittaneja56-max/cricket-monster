# Cricket.Monster — Landing page concept v3

A responsive, **static landing-page concept** for Cricket.Monster. Built from the previous locally tested concept, refined for more editorial typography, clearer value proposition and accessible preview interactions.

## Features

- Field & Paper tokens: `#14291F`, `#21654A`, `#E0F48A`, `#F7F7F2`
- Barlow Semi Condensed display, Source Sans 3 body, with system fallbacks
- Locally bundled original illustrated cricket-stadium fallback (external photo only enhances when available)
- Keyboard-operable sample winner pick and sample Daily Monster quiz
- Mobile navigation, reduced-motion preference, accessible dialog close and focus outline
- Explicit demo labels. **No real users, live match data or authenticated API integration**

## Run locally

Open `index.html` in the browser or run `python -m http.server 8000` in this folder and visit http://localhost:8000.

## Deploy to Vercel

Import this folder as a static project. **Framework preset: Other**, output directory `.`. There is no build step. `vercel.json` adds safe response headers. Alternatively create a GitHub repository, push these files, and import the repository in Vercel.

## Handoff

The home page links are prototype anchors. To go live, replace mock match and quiz content with Match Monster, Daily Monster and Feed API outputs from the team's existing V1 API specification. Ensure auth routes are actually deployed before changing the sign-in demonstration to live account navigation. The current design intentionally does not claim live scores, real fixtures, or private groups.

## Image attribution

The optional network-loaded hero photo in `index.html` uses an Unsplash source, credited in the footer. If the photo cannot load, `assets/stadium-illustration.svg` provides the bundled original fallback. Review any commercial/brand usage and licensing before launch.
