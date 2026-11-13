import {spawnSync} from 'node:child_process';
import {copyFileSync,readFileSync,writeFileSync,renameSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ffmpeg from 'ffmpeg-static';
import probe from 'ffprobe-static';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'out');
function run(exe,args) {
  const r=spawnSync(exe,args,{encoding:'utf8',windowsHide:true});
  if(r.status!==0)throw new Error(r.stderr||r.error?.message);
  return r;
}
const inspect=file=>JSON.parse(run(probe.path,['-v','error','-show_streams','-show_format','-of','json',file]).stdout);
const master=path.join(out,'live-stadium-master.mp4');
if(inspect(master).streams[0].pix_fmt!=='yuv420p') {
  const limited=path.join(out,'live-stadium-limited.mp4');
  run(ffmpeg,['-y','-i',master,'-vf','scale=in_range=pc:out_range=tv','-c:v','libx264','-preset','slow','-crf','14','-an','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',limited]);
  renameSync(limited,master);
}
const comparisons=[];
for(const crf of [18,21,24]) {
  const file=path.join(out,`live-stadium-crf${crf}.mp4`);
  run(ffmpeg,['-y','-i',master,'-vf','scale=1280:720:flags=lanczos','-an','-c:v','libx264','-preset','slow','-crf',String(crf),'-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',file]);
  const result=run(ffmpeg,['-i',master,'-i',file,'-filter_complex','[0:v]scale=1280:720:flags=lanczos,format=yuv420p,setpts=PTS-STARTPTS[ref];[1:v]setpts=PTS-STARTPTS[web];[web][ref]ssim','-an','-f','null','-']);
  const ssim=Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
  comparisons.push({crf,bytes:statSync(file).size,ssim});
}
const candidate=path.join(out,'live-stadium-candidate.mp4');
copyFileSync(path.join(out,'live-stadium-crf18.mp4'),candidate);
run(ffmpeg,['-y','-i',candidate,'-frames:v','1','-c:v','libwebp','-quality','92',path.join(out,'live-stadium-poster.webp')]);
run(ffmpeg,['-y','-i',candidate,'-vf','select=eq(n\\,0)+eq(n\\,8)+eq(n\\,16)+eq(n\\,48)+eq(n\\,96)+eq(n\\,144)+eq(n\\,176)+eq(n\\,191),scale=480:270,tile=4x2','-frames:v','1',path.join(out,'live-stadium-contact-sheet.jpg')]);
const battingMaster=path.join(out,'real-batting-master.mp4');
const battingWeb=path.join(out,'real-batting-candidate.mp4');
if(existsSync(battingMaster)) {
  run(ffmpeg,['-y','-i',battingMaster,'-vf','scale=1280:720:flags=lanczos:in_range=auto:out_range=tv','-an','-c:v','libx264','-crf','18','-preset','slow','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',battingWeb]);
  run(ffmpeg,['-y','-i',battingWeb,'-vf','fps=1,scale=480:270,tile=4x2','-frames:v','1',path.join(out,'real-batting-contact-sheet.jpg')]);
  run(ffmpeg,['-y','-i',battingWeb,'-frames:v','1','-c:v','libwebp','-quality','90',path.join(out,'real-batting-poster.webp')]);
}
for(const [name,file] of [['live-master',master],['live-web',candidate],['batting-web',battingWeb]].filter(([,file])=>existsSync(file))) {
  const data=inspect(file);data.bytes=statSync(file).size;
  writeFileSync(path.join(out,`${name}-metadata.json`),JSON.stringify(data,null,2));
  run(ffmpeg,['-v','error','-i',file,'-f','null','-']);
}
const bytes=readFileSync(candidate);const atoms=[];
for(let offset=0;offset+8<=bytes.length;) {
  const size=bytes.readUInt32BE(offset);atoms.push(bytes.toString('ascii',offset+4,offset+8));
  if(size<8)break;offset+=size;
}
const report={selectedCrf:18,comparisons,fastStart:atoms.indexOf('moov')<atoms.indexOf('mdat'),atoms};
writeFileSync(path.join(out,'real-footage-encoding.json'),JSON.stringify(report,null,2));
if(process.argv.includes('--install')) {
  copyFileSync(candidate,path.join(root,'../../assets/stadium-hero.mp4'));
  copyFileSync(path.join(out,'live-stadium-poster.webp'),path.join(root,'../../assets/stadium-hero-poster.webp'));
  copyFileSync(master,path.join(out,'stadium-hero-master.mp4'));
}
console.log(JSON.stringify(report,null,2));
