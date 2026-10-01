// Chapter 4: kinds of landslide, after Varnes (1978) and Cruden & Varnes (1996): what moves (rock,
// debris, earth) and how (fall, slide, flow), with the 1996 seven-class speed scale (soil.js).
// Each small model keeps real time or a stated time-lapse:
//   Rockfall: blocks leave a 40 m cliff and fall freely (g = 9.81 m/s²), bouncing with a normal
//     restitution of 0.35 and keeping 75% of their speed along the slope (typical of rock on scree;
//     Dorren 2003 reviews values of 0.3 to 0.5). After 40 m of fall, v = √(2 g h) = 28 m/s. Real time.
//   Rotational slump: a 9 m deep curved slip surface; the mass drops at the head and bulges at the
//     toe. Shown at 1 m a day (slumps run from millimetres a day to metres an hour), 1 s = 1 day.
//   Translational slide: a 3 m slab on a plane parallel to the slope. Shown at 0.5 m/s, 1 s = 10 s.
//   Debris flow: mud and boulders down a gully at 10 m/s (USGS: commonly about 16 km/h, some over
//     56 km/h; fresh surges have been measured above 20 m/s), slowing and spreading on the fan. Real time.
//   Creep: the top 2.5 m of soil moves 10 mm a year at the surface, less with depth (typical rates
//     are 1 to 20 mm a year). 1 s = 5 years, and the movement is drawn 15 times larger than life.
import { makeGeo, slipSurface, vClass, fmtSpeed, VCLASS, YEAR, G, D2R } from '../soil.js';
import { THREE, M, box, clamp, smooth, U, sx, Z0, Z1, HEX, COL, makeHill, slab, rockMat, house, tree, bush, pole, boulder, board, panelBg, placeBoard, compact, fitNarrow, rng, inReel } from '../slope.js';
import { swarm } from '../kit.js';

const KIND = {
  fall: { name: 'Rockfall', what: 'Loose blocks of rock', range: [5, 40], lapse: 'real time', warn: 'None. Stay off roads under loose cliffs in rain and after earthquakes.' },
  slump: { name: 'Rotational slump', what: 'Deep clayey soil', range: [0.001 / 86400, 1 / 3600], lapse: '1 second = 1 day', warn: 'Often days: cracks open at the top and the toe bulges first.' },
  slide: { name: 'Translational slide', what: 'A slab of soil or rock', range: [0.01 / 86400, 5], lapse: '1 second = 10 seconds', warn: 'Sometimes cracks first, then it can speed up suddenly.' },
  flow: { name: 'Debris flow', what: 'Mud, stones, trees and water', range: [1, 20], lapse: 'real time', warn: 'Seconds to minutes: a rumble, or a stream that turns muddy or stops.' },
  creep: { name: 'Creep', what: 'The top few metres of soil', range: [0.001 / YEAR, 0.02 / YEAR], lapse: '1 second = 5 years, movement drawn 15 times larger', warn: 'Years. It bends trees and tilts poles and walls.' },
};
const kill = (g) => g.traverse((o) => { if (o.isCSS2DObject) o.element.remove(); if (o.geometry) o.geometry.dispose(); });

export default {
  id: 'kinds',
  short: 'Kinds of landslide',
  title: 'Kinds of landslide',
  subtitle: 'From rock that falls in seconds to soil that creeps for a lifetime.',
  view: { pos: [0.2, 3.2, 15.8], target: [0.2, 1.3, 0] },
  learn: `<p>"Landslide" covers many different movements. Geologists sort them by <b>what moves</b> (rock, coarse debris or fine earth) and <b>how it moves</b>. David Varnes of the US Geological Survey set out the scheme in 1978, and it is still the one in use.</p>
    <p><b>Rockfall.</b> Blocks break off a cliff along cracks and fall, bounce and roll. They reach tens of metres a second within a few seconds. Common on hill roads cut through jointed rock.</p>
    <p><b>Rotational slump.</b> In deep clayey soil the slip surface is curved like a spoon. The mass turns as it moves: the top drops and tilts back, and the toe bulges out. Usually slow.</p>
    <p><b>Translational slide.</b> A slab slides on a flat weak layer, such as the boundary between soil and rock, or a bedding plane that slopes the same way as the hill. It can travel far and fast.</p>
    <p><b>Debris flow.</b> Soil and rock mixed with enough water to run like wet concrete. It pours down a gully at the speed of a car, carries boulders and trees at its front, and spreads out where the valley opens. The disasters at Malin in 2014 and in Wayanad in 2024 were slides that turned into fast flows of mud and debris.</p>
    <p><b>Creep.</b> The top of the soil moves a few millimetres a year. Nobody sees it move, but trees grow with bent trunks, and poles, fences and walls slowly tilt.</p>
    <p>Speed matters most for people. From creep to rockfall the range is about a <b>million million</b> to one. You can walk away from a slump. You cannot outrun a debris flow.</p>
    <p class="tip"><b>Try it:</b> run each kind and watch the marker on the speed scale. Which ones give any warning?</p>`,
  terms: [
    { t: 'Rockfall', d: 'Rock that breaks off a steep face and falls, bounces and rolls.' },
    { t: 'Slump', d: 'A slide on a curved surface. The mass rotates: its head drops and its toe bulges.' },
    { t: 'Translational slide', d: 'A slide on a roughly flat surface parallel to the slope.' },
    { t: 'Debris flow', d: 'A fast flow of water mixed with soil, rock and wood, usually along a gully.' },
    { t: 'Creep', d: 'Very slow, steady downhill movement of soil, millimetres a year.' },
    { t: 'Scarp', d: 'The steep bare step left at the top of a slide.' },
  ],
  defaults: { kind: 'fall' },
  controls: [
    { key: 'kind', type: 'seg', label: 'Kind', options: [{ v: 'fall', label: 'Rockfall' }, { v: 'slump', label: 'Slump' }, { v: 'slide', label: 'Slide' }, { v: 'flow', label: 'Debris flow' }, { v: 'creep', label: 'Creep' }] },
    { type: 'buttons', label: 'Model', items: [{ label: 'Run it again', act: (s, inst) => inst.again?.() }] },
  ],
  quiz: [
    { q: 'Which of these moves fastest?', options: ['Creep', 'A rotational slump', 'A rockfall', 'They are all about the same'], answer: 2, why: 'Falling rock reaches tens of metres a second. A slump may move a metre a day, and creep a few millimetres a year.' },
    { q: 'Why are debris flows so deadly?', options: ['They are fast, follow gullies for long distances, and reach places far from the slope that failed', 'They are always very large', 'They happen only at night', 'They are silent'], answer: 0, why: 'A debris flow runs at the speed of a car along stream channels and spreads over the fan below, where villages often stand.' },
    { q: 'On a hillside you see trees whose trunks are bent like a hockey stick near the ground. What does it suggest?', options: ['Strong winds', 'Slow creep of the soil over many years', 'A recent rockfall', 'Poor soil'], answer: 1, why: 'As the soil creeps it tilts the young tree, and the tree keeps growing upwards, which bends the trunk.' },
  ],
  reel: [
    { ms: 5000, caption: 'Landslides come in kinds. A rockfall reaches tens of metres a second within moments.', set: { kind: 'fall' }, act: (s, inst) => inst.again?.(), view: { pos: [0.2, 2.8, 17.5], target: [0.2, 1.0, 0] }, spin: 0 },
    { ms: 6000, caption: 'A debris flow pours down a gully as fast as a car and runs far. Creep moves a few millimetres a year.', set: { kind: 'flow' }, act: (s, inst) => inst.again?.(), view: { pos: [0.2, 2.8, 17.5], target: [0.2, 1.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const lab = (t, x, y, g, cls) => stage.label(t, [sx(x), y * U, Z1 + 0.05], g, cls);
    const soilMats = () => [rockMat(HEX.soil), rockMat(HEX.soilTop), rockMat(HEX.soil)];

    // ---- rockfall
    function fall() {
      const g = new THREE.Group(), rnd = rng(5);
      const yg = (x) => (x < 58 ? 0 : x < 74 ? (x - 58) * 0.56 : x < 81 ? 9 + (x - 74) * 5.7 : 49 + (x - 81) * 0.04);
      const rock = slab(220, Z0, Z1, rockMat(0x767b85)); rock.set(0, 124, yg, () => -9);
      const grass = slab(40, Z0, Z1, rockMat(HEX.soilTop)); grass.set(81.6, 124, (x) => yg(x) + 0.06, (x) => yg(x) - 1);
      const floor = slab(20, Z0, Z1, rockMat(HEX.soilTop)); floor.set(0, 56, () => 0.06, () => -1);
      const scree = slab(40, Z0, Z1, rockMat(0x938a7a)); scree.set(55, 74.5, (x) => yg(x) + 0.08 + (x < 58 ? (x - 55) * 0.1 - 0.3 : 0), (x) => yg(x) - 0.4);
      const road = box(0.9, 0.03, 4, rockMat(HEX.road)); road.position.set(sx(44), 0.08, 0);
      const bus = box(0.2, 0.2, 0.5, M.plastic(0xe6b93c)); bus.position.set(sx(44), 0.2, 0.6);
      g.add(rock, grass, floor, scree, road, bus);
      [[90, -1], [98, 0.8], [108, -0.3], [118, 1.2], [12, -1.2], [22, 0.9], [30, -0.4]].forEach(([x, z]) => { const t = tree(0.7); t.position.set(sx(x), yg(x) * U + (x < 56 ? 0.06 : 0), z); g.add(t); });
      const hs = house(0.5); hs.position.set(sx(18), 0.06, -0.3); g.add(hs);
      for (let i = 0; i < 7; i++) { const c = box(4.1, 0.012, 0.01, M.matte(0x4b5059)); c.position.set(sx(103), (5 + i * 6.5) * U, Z1 + 0.012); c.rotation.z = 0.04; g.add(c); }
      for (let i = 0; i < 10; i++) { const c = box(0.02, 0.5 + rnd() * 2.4, 0.01, M.matte(0x30343b)); c.position.set(sx(75.5 + rnd() * 6), (14 + rnd() * 30) * U, Z1 + 0.014); c.rotation.z = -0.17 + (rnd() - 0.5) * 0.2; g.add(c); }
      const rocks = Array.from({ length: 16 }, (_, i) => { const r = 0.8 + rnd() * 1.2, m = boulder(r * U, 0x8a8e96); g.add(m); return { m, r, x0: 75.3 + rnd() * 5.2, z: -1.6 + rnd() * 3.4, t0: 0.4 + i * 0.33, vx0: -(1 + rnd() * 3.5) }; });
      lab('Cliff of cracked rock', 96, 40, g); lab('Scree at its angle of repose', 60, 11, g); lab('Road', 44, 3.5, g);
      let t = 0, vmax = 0;
      const reset = () => { t = 0; rocks.forEach((r) => { r.x = r.x0; r.y = yg(r.x0) + r.r; r.vx = 0; r.vy = 0; r.go = false; r.rest = false; }); };
      reset();
      return { group: g, again: reset, T: 9.5, speed: () => vmax, status: () => (vmax > 1 ? 'Blocks in the air' : 'Come to rest'),
        update(dt) {
          t += dt; if (t > 9.5 && !inReel()) reset(); vmax = 0;
          rocks.forEach((r) => {
            if (!r.go && t >= r.t0) { r.go = true; r.vx = r.vx0; }
            if (r.go && !r.rest) for (let k = 0; k < 4; k++) {
              const h = dt / 4; r.vy -= G * h; r.x += r.vx * h; r.y += r.vy * h;
              const gy = yg(r.x) + r.r;
              if (r.y < gy) {
                const sl = (yg(r.x + 0.3) - yg(r.x - 0.3)) / 0.6, nl = Math.hypot(sl, 1), nx = -sl / nl, ny = 1 / nl, vn = r.vx * nx + r.vy * ny;
                r.y = gy;
                if (vn < 0) { const tx = ny, ty = -nx, vt = (r.vx * tx + r.vy * ty) * 0.75; r.vx = vt * tx - 0.35 * vn * nx; r.vy = vt * ty - 0.35 * vn * ny; }
                if (Math.hypot(r.vx, r.vy) < 1.3 && Math.abs(sl) < 0.7) { r.rest = true; r.vx = r.vy = 0; }
              }
              if (r.x < 3) { r.rest = true; r.vx = r.vy = 0; }
            }
            const v = Math.hypot(r.vx, r.vy); vmax = Math.max(vmax, v);
            r.m.position.set(sx(r.x), r.y * U, r.z); r.m.rotation.z += v * dt * 0.6;
          });
        } };
    }

    // ---- slump, slide and creep share the cutaway hillside
    function onHill(kind) {
      const hill = makeHill(stage), g = hill.root, creep = kind === 'creep';
      const geo = makeGeo(creep ? { beta: 20, H: 30, ts: 2.5, T: 8, m: 0.1, endX: 128 } : kind === 'slump' ? { beta: 28, H: 42, ts: 12, T: 16, m: 0.3, endX: 128 } : { beta: 30, H: 46, ts: 3, T: 9, m: 0.2, endX: 128 });
      const xa = geo.xAt(geo.o.H * 0.14), xb = geo.xAt(geo.o.H * (kind === 'slump' ? 0.9 : 0.8));
      const surf = kind === 'slump' ? slipSurface({ yg: geo.yg, yr: () => -99 }, xa, xb, 9.5) : { xa, xb, ys: (x) => geo.yg(x) - 3 * smooth((x - xa) / 9) * smooth((xb - x) / 6) };
      const back = kind === 'slump' ? -1 : 1;
      [0.06, 0.2, 0.32, 0.45, 0.58, 0.7, 0.85, 0.96, 0.26, 0.52, 0.76].forEach((f, i) => hill.add(i % 5 === 4 ? pole(0.6) : tree(0.55 + (i % 3) * 0.12), geo.xAt(geo.o.H * f), -1.6 + ((i * 0.618) % 1) * 3.2, { lean: kind === 'slump' ? 0.3 : 0.6, dir: back * (kind === 'slump' ? 1 : i % 2 ? 1 : -1) }));
      hill.add(house(0.5), geo.xAt(geo.o.H * 0.4), 0.2, { lean: 0.3, dir: back }); hill.add(house(0.5), geo.topX + 9, -0.8); hill.add(house(0.5, 0xe9dcc3), geo.topX + 17, 0.9);
      const marks = creep ? [0.3, 0.55, 0.8].map((f) => { const x = geo.xAt(geo.o.H * f); return { x, cubes: Array.from({ length: 9 }, (_, k) => { const c = box(0.07, 0.05, 0.02, M.glow(0xffd35a)); g.add(c); return c; }) }; }) : [];
      const l1 = lab('', xb + 8, geo.yg(xb) + 12, g, 'hot'), l2 = lab('', xa - 6, geo.yg(xa) + 7, g);
      if (creep) lab('Pegs set in a straight line, top to bottom', geo.xAt(geo.o.H * 0.55) + 3, geo.yg(geo.xAt(geo.o.H * 0.55)) - 8, g);
      const DMAX = kind === 'slump' ? 9 : 30, DUR = kind === 'slump' ? 9 : 6, T = creep ? 13 : DUR + 4.5;
      let t = 0, v = 0, years = 0, lastD = -1;
      return { group: g, again: () => { t = 0; }, T, speed: () => v, status: () => (creep ? `${Math.round(years)} years` : v > 0 ? 'Moving' : t < 1 ? 'About to go' : 'Stopped'),
        update(dt) {
          t += dt; if (t > T && !inReel()) t = 0;
          if (creep) {
            years = Math.min(60, t * 5); v = years < 60 ? 0.01 / YEAR : 0;
            if (!hill.geo) hill.draw(geo, null, { showWater: false });
            const top = years * 0.01 * 15, b = geo.o.beta * D2R;
            marks.forEach((mk) => mk.cubes.forEach((c, k) => { const dep = k * 0.45, u = top * Math.max(0, 1 - dep / 2.5) ** 2; c.position.set(sx(mk.x - u * Math.cos(b)), (geo.yg(mk.x) - dep - u * Math.sin(b)) * U, Z1 + 0.03); }));
            hill.props.forEach((p) => { p.obj.rotation.z = (years / 60) * 0.32; });
            l1.element.innerHTML = `${Math.round(years)} years: the surface has moved ${Math.round(years) * 10} mm`; l2.element.innerHTML = 'Trees and poles lean downhill';
            return;
          }
          const k = clamp((t - 1) / DUR, 0, 1), d = DMAX * smooth(k);
          v = k > 0 && k < 1 ? (kind === 'slump' ? 1 / 86400 : 0.5) * (6 * k * (1 - k)) / 1.5 : 0;
          if (d !== lastD) { lastD = d; hill.draw(geo, { surf, d }, { showWater: false, showSlip: true }); }
          l1.element.innerHTML = d > 0.5 ? (kind === 'slump' ? 'Scarp: the head drops and tilts back' : 'Bare scar on the weak layer') : kind === 'slump' ? 'Curved slip surface, deep in clay' : 'Flat slip surface, 3 m down';
          l2.element.innerHTML = d > 0.5 ? (kind === 'slump' ? 'The toe bulges' : 'The slab breaks up and piles at the foot') : '';
          l2.visible = d > 0.5;
        } };
    }

    // ---- debris flow
    function flow() {
      const g = new THREE.Group(), rnd = rng(9), FAN = 50, SRC = 110;
      const yg = (x) => (x < 14 ? -1.2 * Math.max(0, 1 - ((x - 7) / 6) ** 2) : x < FAN ? (x - 14) * 0.176 : x < 116 ? 6.34 + (x - FAN) * 0.6 : 45.9 + (x - 116) * 0.05);
      const ground = slab(220, Z0, Z1, [rockMat(HEX.soil), rockMat(HEX.soilTop), rockMat(HEX.soil)]); ground.set(0, 124, yg, () => -9);
      const gully = slab(120, -0.5, 0.5, rockMat(0x6f5a43)); gully.set(FAN - 4, SRC + 3, (x) => yg(x) + 0.07, (x) => yg(x) - 0.3);
      const mud = slab(160, -0.5, 0.5, rockMat(0x5b4330)), fan = slab(90, -1.7, 1.7, rockMat(0x5b4330)); g.add(ground, gully, mud, fan);
      const rocks = swarm(30, new THREE.DodecahedronGeometry(1, 0), rockMat(0x7d8088)); g.add(rocks);
      const rp = Array.from({ length: 30 }, () => ({ a: rnd() * 9, z: rnd() - 0.5, s: 0.05 + rnd() * 0.08, sp: rnd() * 6 }));
      const hit = house(0.5), safe = house(0.5, 0xe9dcc3); hit.position.set(sx(30), yg(30) * U, 0.5); safe.position.set(sx(64), yg(64) * U, 1.5); g.add(hit, safe);
      [[58, -1.5], [72, 1.5], [80, -1.4], [92, 1.4], [100, -1.5], [44, -1.75], [38, 1.8], [120, 0.6], [121, -1]].forEach(([x, z]) => { const t = tree(0.65); t.position.set(sx(x), yg(x) * U, z); g.add(t); });
      lab('Source: a slide in a cloudburst', 104, 50, g); lab('Gully', 82, 20, g); lab('Fan: where it spreads and stops', 22, 11, g, 'hot'); lab('House on the gully mouth', 30, -3.2, g); lab('House to one side, above the gully', 70, 9, g);
      let t = 0, xf = SRC, v = 0;
      const reset = () => { t = 0; xf = SRC; v = 0; hit.rotation.z = 0; };
      const th = (x) => (x < xf || x > SRC ? 0 : (2.4 * Math.exp(-(x - xf) / 13) + 0.35) * smooth((SRC - x) / 8));
      return { group: g, again: reset, T: 17, speed: () => v, status: () => (v > 0.5 ? 'Running' : t < 1.2 ? 'About to go' : 'Stopped on the fan'),
        update(dt) {
          t += dt; if (t > 17 && !inReel()) reset();
          v = t < 1.2 || xf <= 19.5 ? 0 : xf > FAN ? 10 : 0.4 + 9.6 * Math.pow(clamp((xf - 19) / (FAN - 19), 0, 1), 0.7);
          xf = Math.max(19, xf - v * dt);
          mud.set(FAN - 2, SRC, (x) => yg(x) + 0.08 + th(x), (x) => yg(x) + 0.05); mud.visible = xf < SRC - 0.5;
          fan.set(14, FAN, (x) => yg(x) + 0.03 + th(x) * 0.6 * smooth((FAN + 3 - x) / 8 + 0.6), (x) => yg(x)); fan.visible = xf < FAN;
          rp.forEach((p, i) => { const x = xf + p.a, wide = x < FAN ? 2.8 : 0.8; rocks.place(i, [sx(x), (yg(x) + th(x) * (x < FAN ? 0.6 : 1)) * U + p.s * 0.6, p.z * wide], [t * p.sp * (v / 10), p.sp, 0], xf < SRC - 0.5 ? p.s : 0.0001); }); rocks.done();
          if (xf < 31) hit.rotation.z = Math.min(0.5, hit.rotation.z + dt * 1.5);
        } };
    }

    const scale = board(root, 6.4, 2.0, 1024, 320, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      const x0 = 30, x1 = w - 30, X = (v) => x0 + ((x1 - x0) * (Math.log10(Math.max(v, 1e-11)) + 11)) / 13;
      g.font = 'bold 30px sans-serif'; g.fillStyle = '#e8eef8'; g.textAlign = 'left'; g.fillText(`${KIND[st.kind].name}: how fast?`, 24, 42);
      g.font = '19px sans-serif';
      VCLASS.forEach((c, i) => { const a = X(c.min || 1e-11), b = i ? X(VCLASS[i - 1].min) : x1; g.fillStyle = `hsl(${205 - c.n * 28},70%,${28 + c.n * 3}%)`; g.fillRect(a, 128, b - a - 2, 56); g.fillStyle = '#fff'; g.textAlign = 'center'; c.name.split(' ').forEach((wd, j, arr) => g.fillText(wd.toLowerCase(), (a + b) / 2, (arr.length > 1 ? 150 : 162) + j * 22)); });
      g.fillStyle = COL.soft; [[0.016 / YEAR, '16 mm a year'], [1.6 / YEAR, '1.6 m a year'], [13 / (30 * 86400), '13 m a month'], [1.8 / 3600, '1.8 m an hour'], [0.05, '3 m a minute'], [5, '5 m/s']].forEach(([v, t]) => { g.fillText(t, X(v), 214); g.fillRect(X(v) - 1, 184, 2, 10); });
      const [r0, r1] = KIND[st.kind].range; g.fillStyle = '#8ef0ff'; g.fillRect(X(r0), 108, Math.max(6, X(r1) - X(r0)), 12); g.textAlign = X(r1) > x1 - 160 ? 'right' : 'left'; g.fillText('typical range', X(r1) > x1 - 160 ? X(r0) - 10 : X(r1) + 10, 121);
      if (st.v > 0) { const x = X(st.v); g.fillStyle = COL.warn; g.beginPath(); g.moveTo(x, 126); g.lineTo(x - 13, 98); g.lineTo(x + 13, 98); g.closePath(); g.fill(); }
      g.fillStyle = COL.soft; g.textAlign = 'center'; g.fillText('▲ a person walking', X(1.4) - 40, 250); g.textAlign = 'left'; g.fillText('Speed classes: Cruden and Varnes, 1996. Each step along is 10 times faster.', 24, 296);
    });

    let cur = null, kind = '', drawT = 0;
    const api = {
      again() { cur?.again(); },
      update(dt, s) {
        dt = Math.max(0, dt);
        if (s.kind !== kind) { if (cur) { root.remove(cur.group); stage.root.remove(cur.group); kill(cur.group); } kind = s.kind; cur = kind === 'fall' ? fall() : kind === 'flow' ? flow() : onHill(kind); if (cur.group.parent !== stage.root) root.add(cur.group); }
        const narrow = fitNarrow(stage);
        cur.group.traverse((o) => { if (o.isCSS2DObject && !o.element.classList.contains('hot')) o.visible = !narrow && o.element.innerHTML !== ''; });
        placeBoard(scale, [[0.2, -2.7, 2.2], 0, 1.6]);
        cur.update(dt);
        drawT -= dt; if (drawT <= 0) { drawT = 0.12; scale.redraw({ kind, v: cur.speed() }); }
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const K = KIND[s.kind], v = cur ? cur.speed() : 0, cls = v > 0 ? vClass(v) : null;
        return compact(`<div class="big">${K.name}</div>
          <div class="row"><span>Speed in the model now</span><b>${v > 0 ? fmtSpeed(v) : 'at rest'}</b></div>
          <div class="row"><span>Speed class</span><b>${cls ? cls.name.toLowerCase() : vClass(K.range[1]).name.toLowerCase() + ' at most'}</b></div>
          <div class="row"><span>Typical range</span><b>${fmtSpeed(K.range[0]).replace(/ \(.*\)/, '')} to ${fmtSpeed(K.range[1])}</b></div>
          <div class="row"><span>What moves</span><b>${K.what}</b></div>
          <small><b>Warning:</b> ${K.warn} Shown in ${K.lapse}.</small>`);
      },
    };
    return api;
  },
};
