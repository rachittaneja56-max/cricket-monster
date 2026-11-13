import {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {BALL_RADIUS, ballPosition, batAngle, physicalTime} from './physics';

function useSurface(name: string, repeat: [number,number] = [1,1]) {
  const source=useLoader(THREE.TextureLoader,staticFile(`${name}.jpg`));
  return useMemo(()=>{
    const map=source.clone();
    map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(...repeat);
    map.anisotropy=8;
    map.needsUpdate=true;
    return map;
  },[source,repeat[0],repeat[1]]);
}

export function CricketBall({frame}:{frame:number}) {
  const leather=useSurface('leather');
  const stitchGeometry=useMemo(()=>{
    const positions:number[]=[];
    // Six rows of actual raised cotton stitches around the equator.
    for(const row of [-3,-2,-1,1,2,3]) for(let i=0;i<72;i++) {
      const a=i*Math.PI*2/72;
      const y=row*.00125;
      const r=Math.sqrt(BALL_RADIUS*BALL_RADIUS-y*y)+.0003;
      positions.push(Math.cos(a)*r,y-.00045,Math.sin(a)*r);
      positions.push(Math.cos(a+.027)*r,y+.00045,Math.sin(a+.027)*r);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    return geometry;
  },[]);
  const t=physicalTime(frame);
  return <group position={ballPosition(frame)} rotation={[.4+t*31,.3+t*12,.6]} visible={frame>22&&frame<166}>
    <mesh castShadow><sphereGeometry args={[BALL_RADIUS,64,48]}/><meshPhysicalMaterial map={leather} color="#b22d38" roughness={.37} clearcoat={.2} clearcoatRoughness={.44} bumpMap={leather} bumpScale={.0004}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[BALL_RADIUS,.0007,6,128]}/><meshStandardMaterial color="#682022" roughness={.75}/></mesh>
    <lineSegments geometry={stitchGeometry}><lineBasicMaterial color="#dbbd9a"/></lineSegments>
  </group>;
}

export function CricketBat({frame}:{frame:number}) {
  const wood=useSurface('willow');
  const blade=useMemo(()=>{
    const shape=new THREE.Shape();
    shape.moveTo(-.022,-.29);shape.lineTo(-.054,-.34);shape.lineTo(-.054,-.79);
    shape.quadraticCurveTo(-.054,-.85,0,-.85);shape.quadraticCurveTo(.054,-.85,.054,-.79);
    shape.lineTo(.054,-.34);shape.lineTo(.022,-.29);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:3,steps:1});
    // Willow grain follows the length of the blade.
    const uv=geometry.attributes.uv;
    const pos=geometry.attributes.position;
    for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)+.06)/.12,(pos.getY(i)+.85)/.56);
    return geometry;
  },[]);
  const handHeight=interpolate(frame,[60,100,115,145],[.92,.85,.85,1.1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <group position={[-.32,handHeight,.978]} rotation={[batAngle(frame),0,0]} visible={frame>=60&&frame<=145}>
    <mesh geometry={blade} castShadow><meshStandardMaterial map={wood} roughness={.64}/></mesh>
    <mesh position={[0,-.145,.018]} castShadow><cylinderGeometry args={[.014,.016,.29,20]}/><meshStandardMaterial color="#222a2a" roughness={.88}/></mesh>
    {Array.from({length:26},(_,i)=><mesh key={i} position={[0,-.012-i*.0105,.018]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.0145,.0015,4,20]}/><meshStandardMaterial color="#434744" roughness={.95}/></mesh>)}
    <mesh position={[0,-.39,.039]}><boxGeometry args={[.07,.035,.001]}/><meshStandardMaterial color="#283b3a" roughness={.7}/></mesh>
  </group>;
}

export function Pitch() {
  const grass=useSurface('grass',[36,36]);
  const pitch=useSurface('pitch',[2,12]);
  return <group>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.014,-35]}><planeGeometry args={[160,160]}/><meshStandardMaterial map={grass} roughness={1} color="#9dba8c"/></mesh>
    {Array.from({length:13},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[(i-6)*6,-.011,-35]}><planeGeometry args={[6,150]}/><meshStandardMaterial color={i%2?'#536344':'#344a31'} transparent opacity={.12} roughness={1}/></mesh>)}
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[-.32,0,-8.1]}><planeGeometry args={[3.05,20.12]}/><meshStandardMaterial map={pitch} roughness={.97} bumpMap={pitch} bumpScale={.009} color="#c8bfa7"/></mesh>
    {[.68,-17].map((z,i)=><group key={i}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[-.32,.003,z]}><planeGeometry args={[3.65,.035]}/><meshStandardMaterial color="#e5ded0" roughness={1}/></mesh>
      {[-1.32,.68].map((x,j)=><mesh key={j} rotation={[-Math.PI/2,0,0]} position={[x,.003,z+.53]}><planeGeometry args={[.035,1.1]}/><meshStandardMaterial color="#d6d0c0" roughness={1}/></mesh>)}
    </group>)}
    <group position={[-.32,0,1.9]}>
      {[-.09,0,.09].map((x,i)=><mesh key={i} position={[x,.355,0]} castShadow><cylinderGeometry args={[.012,.012,.71,16]}/><meshStandardMaterial color="#cbb98d" roughness={.6}/></mesh>)}
      {[-.045,.045].map((x,i)=><mesh key={i} position={[x,.718,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.008,.008,.1,12]}/><meshStandardMaterial color="#bda579" roughness={.7}/></mesh>)}
    </group>
  </group>;
}

export function CameraRig({broadcast}:{broadcast:boolean}) {
  const frame=useCurrentFrame();
  const {camera}=useThree();
  useLayoutEffect(()=>{
    const breathing=Math.sin(frame/216*Math.PI*2);
    camera.position.set(broadcast?10:.6,broadcast?5.2:.19,broadcast?14:-.7);
    camera.position.x+=breathing*.012;
    camera.lookAt(broadcast?-1:-.85,broadcast?0:.4,broadcast?-11:.96);
    camera.updateMatrixWorld();
  },[camera,frame,broadcast]);
  return null;
}

export function Lighting() {
  return <>
    <hemisphereLight args={['#dce7e7','#263426',1.6]}/>
    <directionalLight position={[-5,12,3]} intensity={3.2} color="#fff3da" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.015}/>
    <directionalLight position={[6,9,-12]} intensity={1.4} color="#dbe5ff"/>
    <ambientLight intensity={.35}/>
  </>;
}

function BroadcastActivity() {
  const frame=useCurrentFrame();
  // A separate distant ball rolls across the outfield. No fake people.
  const p=frame/215;
  return <>
    <mesh position={[-14+28*p,.045,-17]} visible={frame>25&&frame<190} castShadow><sphereGeometry args={[.045,20,16]}/><meshStandardMaterial color="#ddd8c9" roughness={.6}/></mesh>
    {[0,1].map(i=><mesh key={i} position={[-4+i*11,2.2,-34]} rotation={[0,0,Math.sin(p*Math.PI*2+i)*.07]}><planeGeometry args={[.55,.32,8,4]}/><meshStandardMaterial color={i?'#a69b7c':'#9a4543'} side={THREE.DoubleSide} roughness={1}/></mesh>)}
  </>;
}

export function StadiumBackground() {
  const frame=useCurrentFrame();
  const glow=.055+.012*Math.sin(frame/216*Math.PI*2);
  return <>
    <Img src={staticFile('stadium.webp')} style={{position:'absolute',width:'100%',height:'78%',objectFit:'cover',objectPosition:'center 30%',filter:'brightness(.68) saturate(.64) blur(1.1px)'}}/>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at 14% 0%,rgba(220,235,230,${glow}),transparent 44%)`,pointerEvents:'none'}}/>
  </>;
}

export function StadiumHero({broadcast=false}:{broadcast?:boolean}) {
  const {width,height}=useVideoConfig();
  return <AbsoluteFill style={{background:'#142b2c'}}>
    <StadiumBackground/>
    <ThreeCanvas width={width} height={height} shadows camera={{fov:41,near:.05,far:180}} gl={{antialias:true,alpha:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}}>
      <CameraRig broadcast={broadcast}/><Lighting/>
      <fog attach="fog" args={['#34453c',20,100]}/>
      <Pitch/><ShotAnimation broadcast={broadcast}/>
    </ThreeCanvas>
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(8,25,33,.16),transparent 46%,rgba(8,25,33,.15)),radial-gradient(ellipse at center,transparent 35%,rgba(3,17,25,.3))',pointerEvents:'none'}}/>
  </AbsoluteFill>;
}

export function ShotAnimation({broadcast}:{broadcast:boolean}) {
  const frame=useCurrentFrame();
  return broadcast?<BroadcastActivity/>:<><CricketBall frame={frame}/><CricketBat frame={frame}/></>;
}
