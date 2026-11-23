// Builds the homepage hero videos from two real Pexels recordings (pinned in sources.json):
//
//   assets/hero-shot.mp4          1280x720  desktop  <- "Sky Swing" (Pexels 32543231), mirrored, cropped, silhouette grade
//   assets/hero-shot-mobile.mp4    720x1080 mobile   <- "Net Swing" (Pexels 32928952), cropped 2:3
//   assets/hero-shot-poster.webp / hero-shot-mobile-poster.webp   first-paint and reduced-motion stills
//
// Each video is one continuous shot: real time into the swing, 0.5x (motion-interpolated) through
// contact, real time through the follow-through, then a short dip to dark so the loop is seamless.
// Only exposure, contrast and colour are adjusted. Nothing is generated or composited.
//
// Usage:  npm install && npm run fetch && npm run encode
//         (set FFMPEG=/path/to/ffmpeg to use your own binary instead of ffmpeg-static)
import {spawnSync} from 'node:child_process';
import {existsSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(root, '../../assets');
const footage = path.join(root, 'public/footage');
const ffmpeg = process.env.FFMPEG || (await import('ffmpeg-static')).default;

const run = (args) => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-y', ...args], {encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26});
  if (r.status !== 0) throw new Error(r.stderr || r.error?.message);
};

const baseGrade = 'eq=brightness=-0.10:contrast=1.14:saturation=0.82:gamma=0.88,colorbalance=rs=-0.04:gs=0.01:bs=0.04:rm=-0.03:gm=0.01:bm=0.03';
const smooth = 'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1';

/** segments: [startSeconds, endSeconds, speed] taken from the source clip, played in order. */
function build({name, source, prep, w, h, segments, crf, maxrate, extraGrade = '', vignette = true}) {
  const src = path.join(footage, source);
  if (!existsSync(src)) throw new Error(`Missing ${src}. Run "npm run fetch" first.`);
  const grade = baseGrade + (vignette ? ',vignette=PI/4.2' : '') + extraGrade;
  const parts = segments.map(([a, b, speed], i) => {
    const slow = speed < 1 ? `,${smooth},setpts=${(1 / speed).toFixed(3)}*PTS` : '';
    return `[s${i}]trim=${a}:${b},setpts=PTS-STARTPTS${slow},fps=30[p${i}]`;
  });
  const total = segments.reduce((t, [a, b, speed]) => t + (b - a) / speed, 0);
  const filter = [
    `[0:v]${prep},${grade},split=${segments.length}${segments.map((_, i) => `[s${i}]`).join('')}`,
    ...parts,
    `${segments.map((_, i) => `[p${i}]`).join('')}concat=n=${segments.length}:v=1:a=0,format=yuv420p,settb=1/30,` +
      `fade=t=in:st=0:d=0.35,fade=t=out:st=${(total - 0.4).toFixed(3)}:d=0.4,scale=${w}:${h}:flags=lanczos,format=yuv420p[v]`,
  ].join(';');
  const file = path.join(assets, `${name}.mp4`);
  run(['-i', src, '-filter_complex', filter, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', maxrate, '-bufsize', '4000k',
    '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', file]);
  // Poster: a follow-through frame, so first paint already shows the shot.
  const posterAt = (segments[0][1] - segments[0][0]) + 0.75 * (segments[1][1] - segments[1][0]) / segments[1][2];
  run(['-ss', posterAt.toFixed(2), '-i', file, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80', path.join(assets, `${name}-poster.webp`)]);
  run(['-i', file, '-f', 'null', '-']); // decode every frame to catch corrupt output
  console.log(`${name}.mp4  ${total.toFixed(1)}s  ${(statSync(file).size / 1e6).toFixed(2)} MB`);
}

build({
  name: 'hero-shot',
  source: 'sky-swing-source.mp4',
  prep: 'hflip,crop=1280:720:640:300',
  w: 1280, h: 720,
  segments: [[0.8, 2.7, 1], [2.7, 3.6, 0.5], [3.6, 5.0, 1]],
  // Mirrored for framing: crush shadows into a clean silhouette so no lettering reads backwards.
  extraGrade: ",curves=all='0/0 0.28/0.05 0.6/0.52 1/0.96'",
  vignette: false,
  crf: 25, maxrate: '3000k',
});

build({
  name: 'hero-shot-mobile',
  source: 'net-swing-source.mp4',
  prep: 'crop=1080:1620:0:150,scale=720:1080',
  w: 720, h: 1080,
  segments: [[1.0, 3.3, 1], [3.3, 4.6, 0.5], [4.6, 5.9, 1]],
  crf: 27, maxrate: '1800k',
});
