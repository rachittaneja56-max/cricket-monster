import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import probe from 'ffprobe-static';
const root=path.dirname(fileURLToPath(import.meta.url));
const asset=path.resolve(root,'../../assets');
const run=(exe,args)=>{
  const r=spawnSync(exe,args,{encoding:'utf8',windowsHide:true});
  if(r.status!==0) throw new Error(r.stderr||r.error?.message);
  return r.stdout;
};
mkdirSync(path.join(root,'out'),{recursive:true});
const master=path.join(root,'out/stadium-hero-master.mp4');
const web=path.join(asset,'stadium-hero.mp4');
const initial=JSON.parse(run(probe.path,['-v','error','-show_streams','-of','json',master]));
if(initial.streams[0].pix_fmt!=='yuv420p') {
  const normalized=path.join(root,'out/stadium-hero-limited.mp4');
  run(ffmpeg,['-y','-i',master,'-vf','scale=in_range=pc:out_range=tv','-an','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',normalized]);
  renameSync(normalized,master);
}
run(ffmpeg,['-y','-i',master,'-vf','scale=1280:720:flags=lanczos','-an','-c:v','libx264','-preset','slow','-crf','22','-maxrate','3600k','-bufsize','7200k','-pix_fmt','yuv420p','-r','24','-movflags','+faststart',web]);
run(ffmpeg,['-y','-i',web,'-frames:v','1','-c:v','libwebp','-quality','86',path.join(asset,'stadium-hero-poster.webp')]);
run(ffmpeg,['-y','-i',web,'-vf','select=eq(n\\,0)+eq(n\\,48)+eq(n\\,79)+eq(n\\,96)+eq(n\\,108)+eq(n\\,120)+eq(n\\,144)+eq(n\\,215),scale=480:270,tile=4x2','-frames:v','1',path.join(root,'out/contact-sheet.jpg')]);
for(const [name,file] of [['master',master],['web',web]]) {
  const data=JSON.parse(run(probe.path,['-v','error','-show_streams','-show_format','-of','json',file]));
  data.bytes=statSync(file).size;
  writeFileSync(path.join(root,`out/${name}-metadata.json`),JSON.stringify(data,null,2));
  console.log(name,JSON.stringify({bytes:data.bytes,duration:data.format.duration,streams:data.streams.map(s=>({codec:s.codec_name,type:s.codec_type,width:s.width,height:s.height,fps:s.avg_frame_rate,pixelFormat:s.pix_fmt}))}));
}
// Decode every frame to catch corrupt packets, not just a readable header.
run(ffmpeg,['-v','error','-i',web,'-f','null','-']);
console.log('Encoded, inspected and decoded every web video frame.');
