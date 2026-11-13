"""Deterministic material maps; no downloaded or generated AI imagery."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out = Path(__file__).parent / 'public'
out.mkdir(exist_ok=True)
rng = np.random.default_rng(714)
n = 1024
for name, base, spread in [('grass', (57, 73, 34), 11), ('pitch', (139, 123, 88), 13), ('leather', (105, 12, 21), 7)]:
    noise = rng.normal(0, spread, (n,n,1))
    coarse = np.array(Image.fromarray(rng.integers(0,255,(64,64),dtype='uint8')).resize((n,n),Image.Resampling.BICUBIC))[:,:,None] / 255 - .5
    pixels = np.clip(np.array(base) + noise + coarse*22,0,255).astype('uint8')
    image = Image.fromarray(pixels)
    draw = ImageDraw.Draw(image)
    if name == 'grass':
        for _ in range(62000):
            x,y = rng.integers(0,n,2)
            c=int(rng.integers(28,83))
            draw.line((int(x),int(y),int(x+rng.integers(-2,3)),int(y+rng.integers(2,8))),fill=(c,int(c*1.2),int(c*.62)))
    if name == 'pitch':
        for _ in range(1100):
            x,y = rng.integers(0,n,2)
            draw.line((int(x),int(y),int(x+rng.integers(-3,4)),int(y+rng.integers(2,15))),fill=(117,107,79),width=1)
    image.save(out / f'{name}.jpg', quality=93)

wood=Image.new('RGB',(256,1024),(193,163,114))
draw=ImageDraw.Draw(wood)
for x in range(256):
    c=int(185+12*np.sin(x*.27)+rng.normal(0,3))
    draw.line((x,0,x,1024),fill=(c+16,c-9,c-49))
wood.save(out/'willow.jpg',quality=94)
print('Created seeded grass, pitch, leather and willow maps.')
