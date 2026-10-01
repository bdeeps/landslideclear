// Chapter 5: what tips the balance, and what puts it back. One hillside, seven triggers and five
// fixes. Every time a switch changes, the model searches about three thousand circular slip surfaces
// with the ordinary method of slices (Fellenius; soil.js) and draws the weakest one in red.
// The hillside: a 30° slope 46 m high; 3 m of soil (c′ 5 kPa, φ′ 32°) on 7 m of weathered rock
// (c′ 25 kPa, φ′ 36°) on sound bedrock; trees whose roots add up to 6 kPa near the surface.
// What each switch changes (typical values, chosen to be reasonable, not measured at any one site):
//   Heavy rain        the ground fills with water to 97% of its depth (30% in fair weather)
//   Earthquake        a sideways force of 0.12 × weight (pseudo-static; design values run 0.1 to 0.2)
//   River undercut    the river eats 6 m into the toe and leaves a 62° bank
//   Road cut          a 7 m wide bench with a 60° cut face behind it
//   Deforestation     no root strength, and the water level rises by a tenth (trees drink and shelter the soil)
//   Quarrying         a 12 m bench low on the slope with a 68° face
//   Building on top   50 kPa on the crest, about a four-storey building
//   Drainage          the water level falls to 45% of what it was
//   Retaining wall    a toe wall holds 120 kN per metre and stops the river undercutting
//   Bolts and nets    150 kN per metre across the cut faces (three rows of anchors); nets catch loose rock
//   Terracing         cut-and-fill benches with a drain on each: the water level under them falls by a fifth
//   Deep-rooted plants  roots worth up to 10 kPa near the surface, and the water level falls by 8%
import { makeGeo, critical, D2R } from '../soil.js';
import { THREE, M, box, clamp, smooth, U, CX, sx, Z0, Z1, HEX, COL, makeHill, makeRain, makeCloud, house, block, tree, bush, rockMat, compact, fitNarrow, fmt, inReel } from '../slope.js';

const TRIG = ['rain', 'quake', 'under', 'road', 'defor', 'quarry', 'load'], FIX = ['drain', 'wall', 'bolts', 'terrace', 'plants'];
const NAMES = { rain: 'heavy rain', quake: 'an earthquake', under: 'the river undercutting the toe', road: 'a road cut', defor: 'deforestation', quarry: 'quarrying', load: 'building on top', drain: 'drainage', wall: 'a retaining wall', bolts: 'bolts and nets', terrace: 'terracing', plants: 'deep-rooted plants' };
function setup(s) {
  let m = s.rain ? 0.97 : 0.3; if (s.defor) m += 0.1; if (s.plants) m -= 0.08; if (s.drain) m *= 0.45;
  const geo = makeGeo({ m: clamp(m, 0, 1), under: s.under && !s.wall ? 6 : 0, road: s.road, quarry: s.quarry, terrace: s.terrace });
  const hold = [];
  if (s.wall) hold.push({ x0: 12, x1: 34, R: 120 });
  if (s.bolts && s.road) hold.push({ x0: geo.roadX - 3, x1: geo.roadX + 12, R: 150 });
  if (s.bolts && s.quarry) hold.push({ x0: geo.quarryX - 3, x1: geo.quarryX + 17, R: 150 });
  const ex = { kh: s.quake ? 0.12 : 0, roots: () => (s.plants ? 10 : s.defor ? 0 : 6), load: s.load ? [geo.topX - 6, geo.topX + 16, 50] : null, hold };
  return { geo, ex, best: critical(geo, ex) };
}
const tog = (key, label, hint) => ({ key, type: 'toggle', label, hint });

export default {
  id: 'triggers',
  short: 'What tips the balance',
  title: 'What tips the balance',
  subtitle: 'Rain, earthquakes, rivers and people each take a little safety away. Good engineering puts it back.',
  view: { pos: [0.2, 3.8, 15.2], target: [0.2, 2.0, 0] },
  learn: `<p>A slope rarely fails for one reason. It loses safety a piece at a time, until the last piece, usually rain, tips it. Engineers separate the slow <b>causes</b> that weaken a slope from the <b>trigger</b> that finally moves it.</p>
    <p><b>Nature's triggers.</b> <b>Heavy rain</b> raises the water pressure in the ground. An <b>earthquake</b> shakes the slope sideways, adding to the pull for a few seconds: the 2005 Kashmir and 2015 Nepal earthquakes set off thousands of slides. See EarthquakeClear at <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/earthquakeclear/">glassbox.how/earthquakeclear</a>. A <b>river</b> cutting into the foot of a slope removes the support that was propping it up.</p>
    <p><b>What people add.</b> A <b>road cut</b> or a <b>quarry</b> leaves a face far steeper than the natural slope. <b>Clearing forest</b> lets the roots rot, and roots were tying the top of the soil together and drying it out. <b>Heavy buildings</b> at the top add to the pull, and their waste water soaks in.</p>
    <p><b>The fixes.</b> The cheapest and most useful is <b>drainage</b>: get the water out and the friction comes back. <b>Retaining walls</b> prop the toe. <b>Rock bolts</b> pin a cut face to the solid rock behind, and <b>steel nets</b> catch loose stones. <b>Terraces</b> break a long slope into short steps, each with a drain. <b>Deep-rooted plants</b> such as vetiver grass bind the top metres of soil and pull water out of it: engineers call this <b>bio-engineering</b>.</p>
    <p>The red line is the weakest surface the model can find. It moves when you change things: a road cut makes a small local slide likely, while rain threatens the whole mantle of soil and weathered rock.</p>
    <p class="tip"><b>Try it:</b> switch on a road cut and deforestation: the slope still stands. Now add heavy rain. Then see which single fix brings it back above 1.</p>`,
  terms: [
    { t: 'Trigger', d: 'The event that finally sets a slope moving, such as a cloudburst or an earthquake.' },
    { t: 'Toe', d: 'The foot of a slope. It props up everything above it.' },
    { t: 'Slip surface', d: 'The surface inside the ground on which the sliding mass moves.' },
    { t: 'Retaining wall', d: 'A wall of concrete, stone or wire baskets of stone (gabions) that holds back soil.' },
    { t: 'Rock bolt', d: 'A steel rod grouted into a drilled hole to pin loose rock to solid rock.' },
    { t: 'Bio-engineering', d: 'Using living plants and their roots to hold and dry a slope.' },
  ],
  defaults: { rain: false, quake: false, under: false, road: false, defor: false, quarry: false, load: false, drain: false, wall: false, bolts: false, terrace: false, plants: false },
  controls: [
    tog('rain', 'Trigger: heavy rain', 'The ground fills with water.'),
    tog('quake', 'Trigger: earthquake', 'A sideways force of 0.12 times the weight.'),
    tog('under', 'Trigger: river undercuts the toe'),
    tog('road', 'Cause: road cut', 'A bench with a 60° face.'),
    tog('defor', 'Cause: deforestation', 'Roots rot within a few years.'),
    tog('quarry', 'Cause: quarrying', 'A 68° face low on the slope.'),
    tog('load', 'Cause: heavy buildings on top'),
    tog('drain', 'Fix: drainage', 'Pipes and lined drains carry the water out.'),
    tog('wall', 'Fix: retaining wall at the toe'),
    tog('bolts', 'Fix: rock bolts and nets', 'They work on the road cut and quarry faces.'),
    tog('terrace', 'Fix: terracing'),
    tog('plants', 'Fix: deep-rooted plants'),
    { type: 'buttons', label: 'Hillside', items: [{ label: 'Clear every switch', act: (s) => { [...TRIG, ...FIX].forEach((k) => { s[k] = false; }); } }] },
  ],
  quiz: [
    { q: 'Why is cutting into the foot of a slope so risky?', options: ['The toe props up the ground above it', 'The foot has the best soil', 'It lets air into the slope', 'It is not risky'], answer: 0, why: 'The toe resists the slide. A river, a road or a quarry that removes it leaves a steeper, unsupported face.' },
    { q: 'Which fix usually gives the most safety for the least money?', options: ['Painting the slope', 'Drainage', 'Planting flowers', 'A taller building on top'], answer: 1, why: 'Most slides are triggered by water pressure. Getting the water out restores friction across the whole slope.' },
    { q: 'How do tree roots help a slope?', options: ['They make the soil heavier', 'They tie the top of the soil together and draw water out of it', 'They block the wind', 'They do not help at all'], answer: 1, why: 'Roots add a few kilopascals of strength near the surface and trees dry the soil. They help against shallow slides, less against deep ones.' },
  ],
  reel: [
    { ms: 6500, caption: 'A road cut. Trees cleared. Each takes a little safety away. Then heavy rain tips the balance.', set: { rain: false, quake: false, under: false, road: true, defor: true, quarry: false, load: false, drain: false, wall: false, bolts: false, terrace: false, plants: false }, anim: { rain: [false, true] }, view: { pos: [0.2, 3.8, 15.2], target: [0.2, 2.0, 0] }, spin: 0 },
    { ms: 6000, caption: 'The fixes: drain the water, hold the toe, bolt the cut face, and plant deep roots.', set: { rain: true, road: true, defor: true, wall: true, drain: false, bolts: false, plants: false }, anim: { drain: [false, true], bolts: [false, true], plants: [false, true] }, view: { pos: [0.2, 3.8, 15.2], target: [0.2, 2.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const hill = makeHill(stage), root = hill.root, g0 = makeGeo();
    const trees = [0.1, 0.17, 0.27, 0.34, 0.42, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97, 0.22, 0.46, 0.66, 0.86, 0.3, 0.75].map((f, i) => hill.add(tree(0.55 + (i % 3) * 0.12), g0.xAt(46 * f), -1.75 + ((i * 0.618) % 1) * 3.4, { lean: 0.7, dir: i % 2 ? 1 : -1 }));
    const stumps = trees.map((t, i) => { const p = hill.props.find((q) => q.obj === t), st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.08, 6), M.matte(0x6b4a2e)); return hill.add(st, p.x, p.z, { lean: 0 }); });
    const plants = Array.from({ length: 30 }, (_, i) => hill.add(bush(0.13, 0x6fbf4a), g0.xAt(46 * (0.05 + ((i * 0.37) % 1) * 0.92)), -1.85 + ((i * 0.618) % 1) * 3.7, { lean: 0.5 }));
    [[g0.topX + 22, -1.1], [g0.topX + 26, 0.9]].forEach(([x, z]) => hill.add(house(0.5), x, z));
    const foot = hill.add(house(0.5, 0xe9dcc3), 17, 1.2);
    const blocks = [[-3, -0.9, 1.1], [4, 0.6, 1.3], [11, -0.5, 1.0]].map(([dx, z, h]) => hill.add(block(0.6, h), g0.topX + dx, z, { lean: 0.35, dir: -1 }));
    const roadStrip = box(0.7, 0.03, 4, rockMat(HEX.road)), bus = box(0.5, 0.2, 0.2, M.plastic(0xe6b93c)); hill.soilG.add(roadStrip, bus); bus.rotation.y = Math.PI / 2;
    const digger = new THREE.Group(); { const b = box(0.35, 0.16, 0.2, M.plastic(0xf2b632)), arm = box(0.4, 0.05, 0.05, M.plastic(0xf2b632)); b.position.y = 0.1; arm.position.set(0.25, 0.28, 0); arm.rotation.z = 0.6; digger.add(b, arm); } hill.soilG.add(digger);
    const wall = box(0.3, 0.5, 4.1, rockMat(0x9aa0a8)); wall.position.set(sx(g0.o.toeX + 1.8), 0.22, 0); root.add(wall);
    const pipeMat = M.glow(0x8ed0ff), boltMat = M.metal(0xd8dde6);
    const drains = [0.18, 0.38, 0.58, 0.78].map((f) => { const x = g0.xAt(46 * f), p = box(0.95, 0.035, 0.035, pipeMat); p.position.set(sx(x + 4.5), (g0.yg(x) + 0.4) * U, Z1 + 0.04); p.rotation.z = 0.09; root.add(p); return p; });
    const mkFace = (xf, yb, ang, hgt) => { const g = new THREE.Group(), a = ang * D2R, len = hgt / Math.sin(a);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(len * U, 4, 5, 16), new THREE.MeshBasicMaterial({ color: 0xdfe6f0, wireframe: true, transparent: true, opacity: 0.7 }));
      net.position.set(sx(xf + (hgt / Math.tan(a)) / 2) - 0.02, (yb + hgt / 2) * U + 0.02, 0); net.rotation.set(0, 0, a); net.rotateX(Math.PI / 2); g.add(net);
      [0.25, 0.5, 0.75].forEach((f) => { const b = box(0.6, 0.03, 0.03, boltMat), h = sx(xf + (hgt * f) / Math.tan(a)), y = (yb + hgt * f) * U; b.position.set(h + 0.28 * Math.sin(a), y - 0.28 * Math.cos(a) + 0.1, Z1 + 0.04); b.rotation.z = a - Math.PI / 2 + 0.35; g.add(b); });
      root.add(g); return g; };
    const roadFace = mkFace(g0.roadX + g0.ROAD_W, g0.ROAD_Y, 60, 6.8), quarryFace = mkFace(g0.quarryX + g0.QUARRY_W, g0.QUARRY_Y, 68, 9.5);
    const rain = makeRain(root), clouds = [[-3.5, 8.6, -0.5, 1.1], [1, 9.1, 0.4, 1.3], [5, 8.7, -0.3, 1.1]].map(([x, y, z, sc]) => makeCloud(root, [x, y, z], sc));
    const lFS = stage.label('', null, root, 'hot'), lState = stage.label('', [3.4, 5.9, 0], root, 'hot'), lRiver = stage.label('River', [sx(9), 0.5, Z1], root), lWt = stage.label('Water table', null, root);
    const minor = [lRiver, lWt];

    let key = '', st = null, prevFS = null, lastFS = null, lastKey = null, phase = 0, d = 0, changed = '';
    const api = {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, minor);
        const k2 = [...TRIG, ...FIX].map((k) => (s[k] ? 1 : 0)).join('');
        if (k2 !== key) {
          if (lastKey !== null) { const i = [...k2].findIndex((c, j) => c !== lastKey[j]), nm = [...TRIG, ...FIX][i]; changed = nm ? `${s[nm] ? 'Added' : 'Removed'} ${NAMES[nm]}` : ''; prevFS = lastFS; }
          key = lastKey = k2; st = setup(s); lastFS = st.best.FS; phase = 0; d = 0;
          const geo = st.geo, cut = (x) => Math.abs(geo.yg(x) - geo.yg0(x)) > 0.6;
          trees.forEach((t) => { const p = hill.props.find((q) => q.obj === t); t.visible = !s.defor && !cut(p.x); });
          stumps.forEach((t) => { const p = hill.props.find((q) => q.obj === t); t.visible = s.defor && !cut(p.x); });
          plants.forEach((t) => { const p = hill.props.find((q) => q.obj === t); t.visible = s.plants && !(s.road && p.x > geo.roadX - 1 && p.x < geo.roadX + 12) && !(s.quarry && p.x > geo.quarryX - 1 && p.x < geo.quarryX + 17); });
          blocks.forEach((b) => { b.visible = s.load; });
          roadStrip.visible = bus.visible = s.road; digger.visible = s.quarry; wall.visible = s.wall; drains.forEach((p) => { p.visible = s.drain; });
          roadFace.visible = s.bolts && s.road; quarryFace.visible = s.bolts && s.quarry;
          roadStrip.position.set(sx(geo.roadX + 3.5), geo.ROAD_Y * U + 0.016, 0); bus.position.set(sx(geo.roadX + 3.5), geo.ROAD_Y * U + 0.13, 0.8);
          digger.position.set(sx(geo.quarryX + 5), geo.QUARRY_Y * U, 0.5);
          hill.draw(geo, { surf: st.best.surf, d: 0 }, { showSlip: true });
        }
        const { geo, best } = st, failing = best.FS < 1, RUN = clamp((best.surf.xb - best.surf.xa) * 0.3, 5, 20);
        if (failing) {
          phase += dt; const cyc = inReel() ? phase : phase % 10;
          const dNew = cyc < 0.8 ? 0 : cyc < 8.6 ? RUN * smooth(Math.min(1, (cyc - 0.8) / 3.4)) ** 1.4 : 0;
          if (dNew !== d) { d = dNew; hill.draw(geo, { surf: best.surf, d }, { showSlip: true }); }
        }
        hill.root.position.x = s.quake ? Math.sin(time * 38) * 0.035 : 0;
        const k = s.rain ? 0.75 : 0; rain.step(dt, k, (x) => hill.top(x / U + CX) * U); clouds.forEach((c) => { c.visible = s.rain; c.mat.color.setScalar(0.42); });
        const xm = (best.surf.xa + best.surf.xb) / 2;
        lFS.position.set(sx(xm) + 0.2, best.surf.ys(xm) * U - 0.45, Z1 + 0.05); lFS.element.innerHTML = `Weakest surface: <b>${best.FS.toFixed(2)}</b>`; lFS.element.style.setProperty('--c', failing ? COL.bad : best.FS < 1.25 ? COL.warn : COL.ok);
        lState.element.innerHTML = failing ? (d > 0.3 ? 'The slope is failing' : 'Below 1: it lets go') : best.FS < 1.25 ? 'Holding, with little to spare' : 'Holding'; lState.element.style.setProperty('--c', failing ? COL.bad : best.FS < 1.25 ? COL.warn : COL.ok);
        const xw = geo.topX + 12; lWt.position.set(sx(xw), geo.ywt(xw) * U - 0.3, Z1 + 0.05);
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        if (!st) return '';
        const b = st.best, nT = TRIG.filter((k) => s[k]).length, nF = FIX.filter((k) => s[k]).length;
        const idle = s.bolts && !s.road && !s.quarry ? ' Bolts and nets need a cut face to work on.' : '';
        return compact(`<div class="big ${b.FS < 1 ? 'no' : b.FS >= 1.25 ? 'ok' : ''}">Factor of safety ${b.FS.toFixed(2)}</div>
          <div class="row"><span>${changed || 'The hillside as nature left it'}</span><b>${prevFS !== null && changed ? `${prevFS.toFixed(2)} → ${b.FS.toFixed(2)}` : ''}</b></div>
          <div class="row"><span>Weakest slip surface</span><b>${b.deep.toFixed(0)} m deep, ${fmt(b.surf.xb - b.surf.xa)} m across</b></div>
          <div class="row"><span>Pull on it, per metre of hillside</span><b>${fmt(b.drive)} kN</b></div>
          <div class="row"><span>Grip on it</span><b>${fmt(b.resist)} kN</b></div>
          <div class="row"><span>Switched on</span><b>${nT} against, ${nF} for</b></div>
          <small>${b.FS < 1 ? 'Below 1 the mass above the red line moves.' : b.FS < 1.25 ? 'It stands, but one more thing could tip it.' : b.FS < 1.5 ? 'Stable, though under the 1.5 that engineers like where people live.' : 'At or above the 1.5 that engineers aim for.'}${idle} The red line is the weakest of about 3,000 trial surfaces. A simple model with typical values.</small>`);
      },
    };
    return api;
  },
};
