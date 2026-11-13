import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

// A single photographed night-ground shot, with camera stabilization performed
// by prepare-footage.py. No synthetic pitch, bat, ball, people or architecture.
export const LiveStadium = () => <AbsoluteFill style={{backgroundColor:'#102832'}}>
  <OffthreadVideo src={staticFile('footage/live-stadium-plate.mp4')} playbackRate={0.5} muted style={{width:'100%',height:'100%',objectFit:'cover'}} />
  <Sequence from={0} durationInFrames={16} name="Matched loop overlap">
    <StadiumLoopOverlap />
  </Sequence>
</AbsoluteFill>;

const StadiumLoopOverlap = () => {
  const frame=useCurrentFrame();
  return <OffthreadVideo src={staticFile('footage/live-stadium-plate.mp4')} trimBefore={96} playbackRate={0.5} muted style={{width:'100%',height:'100%',objectFit:'cover',opacity:interpolate(frame,[0,15],[1,0],{extrapolateRight:'clamp'})}} />;
};

// A real, full-body net-practice shot. This is an alternative for local review,
// not a fabricated player and not footage represented as an international match.
export const BattingMoment = () => <AbsoluteFill style={{backgroundColor:'#102832'}}>
  <OffthreadVideo src={staticFile('footage/batting-source.mp4')} trimBefore={144} muted style={{width:'100%',height:'100%',objectFit:'cover'}} />
</AbsoluteFill>;
