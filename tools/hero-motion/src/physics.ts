// Distances in metres. Frame -> film time -> physical time is deterministic.
export const BALL_RADIUS = 0.036;
export const CONTACT_FRAME = 108;
export const BOUNCE_FRAME = 79;
export const CONTACT = [-0.32, 0.175, 0.94] as const;

export function physicalTime(frame: number) {
  // Cinematic time remapping: decelerate into contact, accelerate out of it.
  const keys = [[0,-0.54],[30,-0.40],[64,-0.17],[79,0],[96,.083],[108,.115],[119,.145],[135,.28],[165,.65],[216,1.5]];
  for(let i=1;i<keys.length;i++) {
    if(frame<=keys[i][0]) {
      const [f0,t0]=keys[i-1], [f1,t1]=keys[i];
      return t0+(t1-t0)*(frame-f0)/(f1-f0);
    }
  }
  return 1.5;
}

export function ballPosition(frame: number): [number,number,number] {
  const t=physicalTime(frame);
  if(t<0) return [-.32, BALL_RADIUS-2.5*t-4.905*t*t, -1.13+18*t];
  if(frame<=CONTACT_FRAME) return [-.32, BALL_RADIUS+1.77*t-4.905*t*t,-1.13+18*t];
  const u=t-.115;
  return [CONTACT[0]-16*u,CONTACT[1]+3.1*u-4.905*u*u,CONTACT[2]-25*u];
}

export function batAngle(frame: number) {
  // Rotation around the handle: the blade reaches the ball at frame 108.
  const t=physicalTime(frame)-.115;
  return Math.max(-1.5,Math.min(2.0,-13*t));
}
