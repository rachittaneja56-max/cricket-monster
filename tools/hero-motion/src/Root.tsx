import {Composition} from 'remotion';
import {StadiumHero} from './StadiumHero';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BallContact" component={StadiumHero} durationInFrames={216} fps={24} width={1920} height={1080} defaultProps={{broadcast:false}} />
      <Composition id="BroadcastGround" component={StadiumHero} durationInFrames={216} fps={24} width={1920} height={1080} defaultProps={{broadcast:true}} />
    </>
  );
};
