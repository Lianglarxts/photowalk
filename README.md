# PhotoWalk Valley

Wander a cartoon nature valley in first person, snap photos, and pin them where you took them.
Every photo leaves a 3D pin in the ground. When you walk near, the photos pop out and float in the air, AR-style.
Busy places stack up nicely: the most-liked photo is shown big in the middle, the next ones medium around it, the rest small at the edges.

## Run

```
node server.js
```

Open http://localhost:3000. Others on the same Wi-Fi can join using the "Same Wi-Fi" address the server prints.
No `npm install` needed: the server has zero dependencies, and three.js loads from a CDN.

Want to see busy tourist spots right away? Open http://localhost:3000/?demo=1 once and it fills the valley with ~37 demo photos.

## Deploy on Vercel

1. Import this repo in Vercel (framework preset: **Other**, no build command needed).
2. In the project, open **Storage → Create → Blob**, and connect the store to the project
   (this adds the `BLOB_READ_WRITE_TOKEN` environment variable).
3. Redeploy. The page is served from `public/`, and photos/likes go through the functions in `api/`.

`server.js` is only for running locally and is not deployed (see `.vercelignore`).

## The valley

Waterfall with a rainbow, a lake with a dock, rowboat and ducks, a river with an arched bridge, a cherry blossom grove,
a sunflower hill, a windmill, old ruins, a campsite with a campfire, snowy mountains and hot air balloons.

## Controls

- **Click / tap the ground** to walk there · **drag** to look · **WASD / arrows** (Shift to run)
- **Scroll / pinch** to zoom for framing shots
- **📷** snap your view (or attach your own photo), pick a filter (Warm, Vintage, Mono, Dreamy, Pop), and pin it
- **🌄** time of day: morning, midday, golden hour, night (stars, fireflies, glowing campfire)
- **☀️** weather: clear, blossom breeze, rain, snow
- **🗺️** fast travel to photo spots
- Click photos or pins to browse every photo at that place and ❤️ like them (likes decide which photo is on top)
- Click the water to skip stones, click animals, the campfire or the windmill

## Data

Photos are saved to `data/photos/` and `data/photos.json` (ignored by git).
