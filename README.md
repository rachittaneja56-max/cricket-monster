# Cricket.Monster — Landing and feature previews

The original landing-page hero is preserved. The site adds two responsive, linked fan-facing feature pages:

- `/match-monster/`: eight example prediction questions grouped into pre-toss and pre-match deadlines, answer selection, sticky slip, local demo saving and a simulated locked state.
- `/daily-monster/`: ten-question, three-minute cricket practice quiz with progress, countdown, resume (if browser storage is available) and result review.

This is a **frontend prototype**, not a connected production app. The RCB vs CSK fixture and player pool are examples, not verified 2027 schedules/lineups. Predictions are saved in this browser only; no live submission, server-side locking, leaderboard or genuine points. Daily practice uses browser time, not server-enforced attempts. To connect production APIs, replace these demo interactions with the team's authenticated endpoint contracts.

Static HTML/CSS/JS; no build step. The Match Monster wireframe's admin menu is not part of the fan-facing page.

For local development use `python -m http.server 8000` from the project root.
