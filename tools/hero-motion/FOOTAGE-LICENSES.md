# Footage sources and licence review

Reviewed 24 November 2026. Exact URLs, resolutions, frame rates and SHA-256 hashes are in [sources.json](sources.json). The raw downloads go to `public/footage/`, which is git-ignored. They are not committed or redistributed.

## Homepage hero: batting shot

Built by [encode-hero-shot.mjs](encode-hero-shot.mjs). Both clips are real recordings. They were picked after screening every cricket clip returned by Pexels searches for "cricket batting", "shot", "batsman", "six" and "night" (64 clips, reviewed frame by frame). None showed batting at night; these two were the cleanest real shots.

- **Mobile (`assets/hero-shot-mobile.mp4`):** [Dynamic Cricket Practice Session Outdoors](https://www.pexels.com/video/dynamic-cricket-practice-session-outdoors-32928952/) by **Gokuldham Nar**. 1080×1920, 30 fps. A side-on lofted swing in outdoor nets. Cropped to 2:3, slowed to 0.5× around contact (motion-interpolated), with a restrained exposure and colour pass. The kit has small manufacturer marks; no sponsor text is legible at web size.
- **Desktop (`assets/hero-shot.mp4`):** [Cricketer Practicing Batting on Sunny Day](https://www.pexels.com/video/cricketer-practicing-batting-on-sunny-day-32543231/) by **Agha Bycric**. 1920×1080, 30 fps. A wide shot against an overcast sky. Mirrored for framing, cropped to 1280×720, and graded into a silhouette so no lettering reads backwards. No faces are identifiable.

Each is one continuous shot that loops with a short dip to dark. Nothing is generated or composited.

## Sign-up band: night ground

**`assets/stadium-hero.mp4`:** [Aerial Night View of Cricket Match in India](https://www.pexels.com/video/aerial-night-view-of-cricket-match-in-india-32311041/) by **Gokuldham Nar**. Source 3840×2160, 29.97 fps. A recorded night match with real players, floodlights and stands. The committed 1280×720 loop was edited earlier (stabilised, fixed crop, half speed, short loop overlap); that pipeline is in the git history before the mobile-first redesign. At web size, no faces are identifiable and no brand text is legible.

## Licence scope

The [Pexels License](https://www.pexels.com/license/) permits editing and website use without a required credit. Its restrictions include offensive use of identifiable people, implied endorsement, trademark use, and redistribution as stock. The [terms](https://www.pexels.com/terms-of-service/) separate the media licence from any rights in the people, property or brands shown. These recordings are used as credited background footage within the Cricket Monster site. Credits are in the homepage footer. Don't repackage the files as stock footage.
