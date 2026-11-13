"""Stabilize one real camera shot. No generated pixels, people or architecture."""
from pathlib import Path
import json, subprocess
import cv2
import numpy as np

root=Path(__file__).resolve().parent
footage=root/'public/footage'
ff=str(root/'node_modules/ffmpeg-static/ffmpeg.exe')
source=footage/'night-match-source.mp4'
cap=cv2.VideoCapture(str(source))
fps=cap.get(cv2.CAP_PROP_FPS)
start=10.5
frames=104 # Shortest calm source window, retimed to half-speed in Remotion.
start_index=round(start*fps)
reference_index=start_index+52
cap.set(cv2.CAP_PROP_POS_FRAMES,reference_index)
ok,reference=cap.read()
if not ok:raise RuntimeError('Cannot decode reference frame')
height,width=reference.shape[:2]
small_width=1280
ratio=small_width/width
small_size=(small_width,round(height*ratio))
def gray(frame):
    return cv2.cvtColor(cv2.resize(frame,small_size),cv2.COLOR_BGR2GRAY)
orb=cv2.SIFT_create(nfeatures=4000,contrastThreshold=.012)
ref_points,ref_desc=orb.detectAndCompute(gray(reference),None)
matcher=cv2.BFMatcher(cv2.NORM_L2)
transforms=[]
cap.set(cv2.CAP_PROP_POS_FRAMES,start_index)
for i in range(frames):
    ok,frame=cap.read()
    if not ok:raise RuntimeError(f'Unexpected end at frame {i}')
    if i%4 and i!=frames-1:
        transforms.append(None)
        continue
    points,desc=orb.detectAndCompute(gray(frame),None)
    pairs=matcher.knnMatch(desc,ref_desc,k=2)
    matches=[m for m,n in pairs if m.distance<.72*n.distance]
    src=np.float32([points[m.queryIdx].pt for m in matches])
    dst=np.float32([ref_points[m.trainIdx].pt for m in matches])
    matrix,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3.0,maxIters=3000)
    if matrix is None or int(inliers.sum())<12:raise RuntimeError(f'Unreliable camera alignment at {i}')
    transforms.append(matrix)
    print(f'Camera registration {i+1}/{frames}',flush=True)
cap.release()
# Smooth subpixel feature-estimation noise without adding camera movement.
known=[i for i,m in enumerate(transforms) if m is not None]
values=np.array([transforms[i] for i in known])
transforms=np.stack([np.interp(np.arange(frames),known,values[:,j,k]) for j in range(2) for k in range(3)],axis=1).reshape(frames,2,3)
smoothed=np.empty_like(transforms)
for i in range(frames):smoothed[i]=np.mean(transforms[max(0,i-7):min(frames,i+8)],axis=0)
zoom=1.18
zoom_matrix=np.array([[zoom,0,960*(1-zoom)],[0,zoom,540*(1-zoom)],[0,0,1]],dtype=np.float64)
process=subprocess.Popen([ff,'-y','-loglevel','error','-f','rawvideo','-pixel_format','bgr24','-video_size','1920x1080','-framerate','30','-i','-','-an','-c:v','libx264','-preset','slow','-crf','12','-pix_fmt','yuv420p','-movflags','+faststart',str(footage/'live-stadium-plate.mp4')],stdin=subprocess.PIPE)
black=[]
cap=cv2.VideoCapture(str(source))
cap.set(cv2.CAP_PROP_POS_FRAMES,start_index)
for i,matrix in enumerate(smoothed):
    ok,frame=cap.read()
    if not ok:raise RuntimeError(f'Unexpected end at output frame {i}')
    # Map raw source directly to the output; one resampling, not repeated warps.
    output_matrix=matrix.copy()
    output_matrix[:,:2]*=ratio*(1920/small_width)
    output_matrix[:,2]*=1920/small_width
    output_matrix=(zoom_matrix@np.vstack([output_matrix,[0,0,1]]))[:2]
    result=cv2.warpAffine(frame,output_matrix,(1920,1080),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
    mask=cv2.warpAffine(np.ones((height,width),np.uint8),output_matrix,(1920,1080),flags=cv2.INTER_NEAREST)
    black.append(float((mask==0).mean()))
    process.stdin.write(result.tobytes())
process.stdin.close()
cap.release()
if process.wait()!=0:raise RuntimeError('FFmpeg plate encoding failed')
report={'sourceStartSeconds':start,'sourceFrameRate':fps,'plateFrames':frames,'plateFps':30,'plateDuration':frames/30,'stabilization':'SIFT + robust similarity camera registration, sampled every 4 frames, interpolated and smoothed over 15 frames; no shear or perspective warp','fixedCropScale':zoom,'maximumUncoveredPixelFraction':max(black),'generatedSceneElements':False,'remotionPlaybackRate':.5}
(root/'out/stabilization-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
