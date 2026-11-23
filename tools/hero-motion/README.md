# Hero videos

Rebuilds the homepage hero videos in `assets/` from real Pexels footage.

| Output | Source clip | Use |
|---|---|---|
| `assets/hero-shot.mp4` + `hero-shot-poster.webp` | [Sky Swing, Agha Bycric](https://www.pexels.com/video/cricketer-practicing-batting-on-sunny-day-32543231/) | Desktop hero (1280×720) |
| `assets/hero-shot-mobile.mp4` + `hero-shot-mobile-poster.webp` | [Net Swing, Gokuldham Nar](https://www.pexels.com/video/dynamic-cricket-practice-session-outdoors-32928952/) | Mobile hero (720×1080) |
| `assets/stadium-hero.mp4` + `stadium-hero-poster.webp` | [Live Stadium, Gokuldham Nar](https://www.pexels.com/video/aerial-night-view-of-cricket-match-in-india-32311041/) | Sign-up band (committed as is, not rebuilt here) |

## Rebuild

Needs Node 20 or later.

```bash
cd tools/hero-motion
npm install          # installs ffmpeg-static (or set FFMPEG=/path/to/ffmpeg)
npm run fetch        # downloads the two source clips into public/footage/ and checks their SHA-256
npm run encode       # writes the videos and posters into ../../assets/
```

If Pexels blocks the download, open the clip's page, use **Free download**, pick the resolution listed in `sources.json`, and save it under `public/footage/` with the `localFile` name. Then run `npm run fetch` again to check the hash.

## What the encode does

- **Cut:** a few seconds into the swing at normal speed, then 0.5× (motion-interpolated) through contact, then normal speed through the follow-through.
- **Grade:** a restrained exposure, contrast and colour pass. The desktop clip is mirrored for framing and crushed to a silhouette so no lettering reads backwards.
- **Loop:** a short fade in and out, so it loops cleanly.
- **Encode:** H.264 with `+faststart`, no audio, about 0.3 MB (desktop) and 0.6 MB (mobile).

To change the timing, crop or grade, edit the `build({...})` calls at the bottom of `encode-hero-shot.mjs`.

Licences and the review notes are in [FOOTAGE-LICENSES.md](FOOTAGE-LICENSES.md).
