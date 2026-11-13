import {Composition, Folder} from 'remotion';
import {StadiumHero} from './StadiumHero';
import {LiveStadium, BattingMoment} from './FootageHero';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="LiveStadium" component={LiveStadium} durationInFrames={192} fps={30} width={1920} height={1080} />
      <Composition id="BattingMoment" component={BattingMoment} durationInFrames={192} fps={24} width={1920} height={1080} />
      <Folder name="Previous-CGI">
        <Composition id="BallContact" component={StadiumHero} durationInFrames={216} fps={24} width={1920} height={1080} defaultProps={{broadcast:false}} />
        <Composition id="BroadcastGround" component={StadiumHero} durationInFrames={216} fps={24} width={1920} height={1080} defaultProps={{broadcast:true}} />
      </Folder>
    </>
  );
};
