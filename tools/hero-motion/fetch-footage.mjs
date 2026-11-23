// Downloads the Pexels source clips marked "fetch": true in sources.json into public/footage/
// and checks each file against its pinned SHA-256. Usage: npm run fetch
import {createHash} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, 'sources.json'), 'utf8'));
const dir = path.join(root, 'public/footage');
mkdirSync(dir, {recursive: true});

async function hash(file) {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}

for (const item of manifest.sources.filter((s) => s.fetch)) {
  const file = path.join(dir, item.localFile);
  if (!existsSync(file) || (await hash(file)) !== item.sha256) {
    const response = await fetch(item.download, {
      headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36', Referer: 'https://www.pexels.com/'},
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`Pexels returned ${response.status} for ${item.page}. Use its "Free download" button, pick ${item.sourceResolution}, and save it as ${file}.`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(file));
  }
  if ((await hash(file)) !== item.sha256) throw new Error(`Source changed: review ${item.page} before updating its pinned hash.`);
  console.log(`Verified ${item.name} (${item.creator}): ${item.page}`);
}
