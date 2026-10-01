// Chapter 6: India's slopes and staying safe.
// Model: a family lives at the mouth of a gully. A slide starts some distance up it and comes down
// as a debris flow at 10 m/s (36 km/h; USGS gives about 16 km/h as common and over 56 km/h for some;
// the 2024 Wayanad flow ran about 8 km down the Punnappuzha valley). Warning time = distance ÷ speed.
// The family walks at 1 m/s: night, heavy rain, children and elders (a brisk daytime walk is 1.4 m/s).
// They are safe if they are out of the flow's path before it arrives.
// Figures (sources in history.json): GSI: about 0.42 million km², 12.6% of India's land outside the
// snow-covered areas, is landslide-prone (NW Himalaya 0.14, NE Himalaya 0.18, Western Ghats and Konkan
// 0.09, Eastern Ghats 0.01 million km²). GSI is the nodal agency (2004); its national susceptibility
// mapping at 1:50,000 began in 2014. NDMA guidelines on landslides and snow avalanches: June 2009.
// National Landslide Forecasting Centre, GSI Kolkata: July 2024.
// Tolls: Darjeeling 1968 about 1,000; Malpa 1998 221; Uttarakhand 2013 more than 5,700 presumed dead
// (state government; later count 6,054); Malin 2014 151; Kerala 2019 Puthumala 17 and Kavalappara 59;
// Pettimudi 2020 70 including 4 never found; Wayanad 2024 official 298, other tallies higher;
// Joshimath 2023: 5.4 cm of sinking in 12 days (ISRO NRSC), cracks in more than 800 buildings.
// Safety advice: NDMA landslide do's and don'ts.
import { THREE, M, box, clamp, smooth, U, sx, Z0, Z1, HEX, COL, slab, rockMat, house, tree, pole, person, board, panelBg, compact, fitNarrow, rng, inReel } from '../slope.js';
import { swarm } from '../kit.js';

const V = 10, PACE = 1, SEE = 200, REACT = 30, LOOP = 14, MX = 40;
function plan(s) {
  const warn = (s.dist * 1000) / V, need = s.away / PACE;
  const start = s.when === 'early' ? -3600 : s.when === 'rumble' ? REACT : Math.max(0, warn - SEE / V);
  const clear = start + need;
  return { warn, need, start, clear, safe: clear <= warn, spare: warn - clear };
}
const fmtT = (sec) => (sec < 90 ? `${Math.round(sec)} seconds` : `${(sec / 60).toFixed(sec < 600 ? 1 : 0)} minutes`);
const VIEWS = { escape: { pos: [0.2, 4.2, 14.8], target: [0.2, 2.1, 0] }, map: { pos: [MX, 3.6, 9.6], target: [MX, 3.6, 0] } };
// A rough picture of where India's landslide country lies. Only the sea coast of the peninsula is
// drawn, from Kutch round to the Sundarbans; no land boundary is shown. Longitude, latitude.
const COAST = [[68.2, 23.6], [70.2, 22.9], [69.1, 22.3], [70.4, 20.8], [72.2, 21.2], [72.6, 22.2], [72.8, 21.1], [72.8, 19], [73.3, 17], [73.8, 15.5], [74.8, 12.9], [75.8, 11.2], [76.3, 9.9], [76.9, 8.5], [77.55, 8.08], [78.2, 8.9], [79.2, 9.3], [79.85, 10.77], [80.3, 13.1], [80.1, 15.2], [81.1, 15.9], [82.3, 16.7], [83.3, 17.7], [84.9, 19.3], [85.8, 19.8], [87, 20.7], [87, 21.5], [88, 21.7], [89.1, 21.8]];
const BELTS = [
  { name: 'Himalaya', pts: [[74, 34.4], [76, 32.6], [78.5, 30.7], [81, 29.6], [84, 28.4], [86.5, 27.8], [88.4, 27.2], [91, 27.4], [93.5, 27.8], [96, 28.4]], w: 46 },
  { name: 'North-eastern hills', pts: [[95, 27], [94.4, 26], [93.9, 24.8], [92.9, 23.3]], w: 30 }, { name: '', pts: [[90.3, 25.5], [92.4, 25.4]], w: 22 },
  { name: 'Western Ghats', pts: [[73.7, 20.6], [73.6, 18.5], [74.1, 16], [75.1, 13.6], [76.2, 11.5], [77, 10], [77.2, 8.7]], w: 24 },
  { name: 'Eastern Ghats', pts: [[82.2, 18], [83.2, 18.6]], w: 16 },
];
const EVENTS = [
  { n: 1, at: [88.27, 27.04], t: 'Darjeeling and Sikkim, 1968', lx: 700, ly: 215 }, { n: 2, at: [80.7, 30], t: 'Malpa, 1998', lx: 610, ly: 150 },
  { n: 3, at: [79.07, 30.73], t: 'Kedarnath, 2013', lx: 500, ly: 90 }, { n: 4, at: [79.57, 30.45], t: 'Joshimath, 2023 (sinking)', lx: 570, ly: 120 },
  { n: 5, at: [73.69, 19.16], t: 'Malin, 2014', lx: 40, ly: 520 }, { n: 6, at: [76.14, 11.47], t: 'Wayanad: 2019 and 2024', lx: 40, ly: 800 },
  { n: 7, at: [76.4, 11.2], t: 'Kavalappara, 2019', lx: 40, ly: 850 }, { n: 8, at: [77, 10.1], t: 'Idukki: 2018 floods, Pettimudi 2020', lx: 40, ly: 900 },
];
const a = (href, t) => `<a style="color:inherit;text-decoration:underline" href="${href}">${t}</a>`;

export default {
  id: 'safe',
  short: "India's slopes, staying safe",
  title: "India's slopes and staying safe",
  subtitle: 'Where the danger is, what has happened, the signs to watch for and what to do.',
  view: VIEWS.escape,
  learn: `<p><b>Where.</b> The Geological Survey of India (GSI) counts about <b>0.42 million square kilometres</b>, 12.6% of India's land outside the snow-covered areas, as landslide-prone. Most of it is in the <b>Himalaya</b>, a young range still being pushed up, steep, cracked by earthquakes and soaked by the monsoon, and in the hills of the North-East. The rest is mostly the <b>Western Ghats</b> and Konkan, where deep soil lies on steep slopes that take some of the heaviest rain in the country, with a little in the Eastern Ghats.</p>
    <p><b>What has happened.</b> Every figure here is an official count or an estimate, and behind each is a family. <b>Darjeeling and Sikkim, October 1968:</b> about 1,000 mm of rain in three days and about 1,000 deaths. <b>Malpa, 1998:</b> a rock avalanche buried a camp on the Kailash Mansarovar route; 221 people died. <b>Uttarakhand, June 2013:</b> extreme rain and the breach of a small lake above <b>Kedarnath</b> sent floods and debris down the Mandakini; more than 5,700 people were presumed dead. <b>Malin, Pune, 30 July 2014:</b> a hillside buried the village after heavy rain; 151 died. <b>Kerala, 2018 and 2019:</b> the 2018 floods came with hundreds of landslides, and on 8 August 2019 slides at Puthumala and Kavalappara killed 17 and 59. <b>Pettimudi, 2020:</b> 70 tea-estate workers and family members died or were never found. <b>Wayanad, 30 July 2024:</b> after about 570 mm of rain in two days, a debris flow ran down from above Mundakkai and Chooralmala in the night; the official toll is 298, and some counts are higher.</p>
    <p><b>Joshimath, 2023</b> was different: not a sudden slide but a town slowly <b>sinking</b>. It stands on the debris of an old landslide. Satellites measured 5.4 cm of sinking in 12 days and cracks opened in more than 800 buildings. Hundreds of families were moved.</p>
    <p><b>Who watches.</b> GSI has been India's nodal agency for landslides since 2004. Its national mapping programme, begun in 2014, has mapped how prone each slope is across about 4.3 lakh square kilometres. The NDMA published national landslide guidelines in 2009. Since July 2024 GSI's forecasting centre in Kolkata has issued daily landslide forecasts in the monsoon for a growing list of districts.</p>
    <p><b>Signs to watch for</b> (NDMA): <b>new cracks</b> in the ground, roads or walls; doors and windows that start to jam; <b>trees, poles and fences tilting</b>; a spring or stream that suddenly turns <b>muddy</b>, or rises or stops; a <b>rumbling</b> that grows louder, trees cracking, boulders knocking.</p>
    <p><b>What to do</b> (NDMA).<br>1. In heavy rain stay alert and awake, and listen. Many slides come at night.<br>2. If you see or hear the signs, <b>move out of the path at once</b>: sideways and uphill, away from gullies, streams and the foot of steep slopes. Help children, elders and people with disabilities first.<br>3. <b>Never camp or shelter in a gully</b> or stream bed in heavy rain.<br>4. Tell your neighbours and the local authorities.<br>5. <b>Stay away from the slide afterwards.</b> More can follow. Do not touch fallen wires.<br>6. Do not build on steep slopes, at their foot, or beside natural drains, and keep drains clear.<br>Emergency number: <b>112</b>. NDMA helpline: <b>1078</b>.</p>
    <p>Related boxes: EarthquakeClear at ${a('https://glassbox.how/earthquakeclear/', 'glassbox.how/earthquakeclear')}, ${a('https://glassbox.how/stormclear/', 'StormClear')} for cloudbursts and thunderstorms, ${a('https://glassbox.how/frictionclear/', 'FrictionClear')}, ${a('https://glassbox.how/gravityclear/', 'GravityClear')} and ${a('https://glassbox.how/tsunamiclear/', 'TsunamiClear')}.</p>
    <p class="tip"><b>Try it:</b> start the slide 1 km up the gully and let the family wait for the rumble. Then let them leave at the first signs. Then open the map.</p>`,
  terms: [
    { t: 'GSI', d: 'Geological Survey of India, the nodal agency for landslide studies since 2004.' },
    { t: 'NDMA', d: 'National Disaster Management Authority. It writes the national guidelines and safety advice.' },
    { t: 'Susceptibility map', d: 'A map showing how prone each slope is to sliding, from its steepness, rock, soil and land use.' },
    { t: 'Subsidence', d: 'The ground slowly sinking, as at Joshimath.' },
    { t: 'Debris fan', d: 'The spread of mud and stones where a gully opens into a valley. Flat, tempting to build on, and in the path.' },
    { t: 'Early warning', d: 'A forecast, from rain and sensors in the ground, that slides are likely in an area soon.' },
  ],
  defaults: { focus: 'escape', dist: 1, away: 120, when: 'rumble' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'escape', label: 'The gully and the family' }, { v: 'map', label: "Map of India's slopes" }] },
    { key: 'when', type: 'seg', label: 'When the family leaves', options: [{ v: 'early', label: 'At the first signs' }, { v: 'rumble', label: 'At the rumble' }, { v: 'see', label: 'When they see it' }], hint: 'First signs: cracks, tilting poles, a muddy spring, hours before. Rumble: they need 30 seconds to wake and gather. See it: it is 200 m away.' },
    { key: 'dist', type: 'range', label: 'How far up the gully the slide starts', min: 0.3, max: 8, step: 0.1, fmt: (v) => `${v.toFixed(1)} km`, ends: ['0.3 km', '8 km, as in Wayanad'] },
    { key: 'away', type: 'range', label: 'How far they must go to be out of its path', min: 40, max: 400, step: 10, fmt: (v) => `${v} m` },
  ],
  quiz: [
    { q: 'It has rained hard for two days. The stream by your house suddenly turns muddy and you hear a rumble uphill. What do you do?', options: ['Go and look at the stream', 'Move at once, sideways and uphill, out of the valley floor', 'Wait for an official message', 'Go to sleep'], answer: 1, why: 'Those are NDMA\'s warning signs of moving debris. Getting out of its path is the best protection, and there may be only minutes.' },
    { q: 'Where is the most dangerous place to camp in heavy rain in the hills?', options: ['On a ridge', 'In a gully or stream bed, or on the fan at its mouth', 'On a broad hilltop', 'In a town square'], answer: 1, why: 'Debris flows follow gullies and spread over the fan below. That is the path.' },
    { q: 'What was different about Joshimath in 2023?', options: ['It was a rockfall', 'The town was slowly sinking and cracking, not struck by a sudden slide', 'It was caused by a tsunami', 'Nothing was damaged'], answer: 1, why: 'Joshimath stands on old landslide debris. Satellites measured about 5.4 cm of sinking in 12 days, and hundreds of buildings cracked.' },
  ],
  reel: [
    { ms: 6500, caption: 'New cracks, tilting trees, a muddy spring, a rumble: move sideways and uphill, out of the gully, at once.', set: { focus: 'escape', dist: 1, away: 60, when: 'rumble' }, act: (s, inst) => inst.seek?.(3), view: { pos: [0.2, 4.2, 14.8], target: [0.2, 2.1, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(3), FAN = 50, SRC = 110, HOME = 30;
    const yg = (x) => (x < 14 ? -1.2 * Math.max(0, 1 - ((x - 7) / 6) ** 2) : x < FAN ? (x - 14) * 0.176 : x < 116 ? 6.34 + (x - FAN) * 0.6 : 45.9 + (x - 116) * 0.05);
    const spurY = (x) => yg(x) + 3.4 * smooth((x - 20) / 10) * smooth((62 - x) / 12);
    const ground = slab(220, -1.15, Z1, [rockMat(HEX.soil), rockMat(HEX.soilTop), rockMat(HEX.soil)]); ground.set(0, 124, yg, () => -9);
    const spur = slab(220, Z0, -1.15, [rockMat(HEX.soil), rockMat(HEX.soilTop), rockMat(HEX.soil)]); spur.set(0, 124, spurY, () => -9);
    const gully = slab(120, -0.5, 0.5, rockMat(0x6f5a43)); gully.set(FAN - 4, SRC + 3, (x) => yg(x) + 0.07, (x) => yg(x) - 0.3);
    const mud = slab(160, -0.5, 0.5, rockMat(0x5b4330)), fan = slab(90, -1.1, 1.7, rockMat(0x5b4330)); root.add(ground, spur, gully, mud, fan);
    const rocks = swarm(30, new THREE.DodecahedronGeometry(1, 0), rockMat(0x7d8088)); root.add(rocks);
    const rp = Array.from({ length: 30 }, () => ({ a: rnd() * 9, z: rnd() - 0.5, s: 0.05 + rnd() * 0.08, sp: rnd() * 6 }));
    const homes = [[HOME, 0.2], [36, 1.0], [24, 0.7]].map(([x, z]) => { const h = house(0.5); h.position.set(sx(x), yg(x) * U, z); root.add(h); return h; });
    const refuge = house(0.5, 0xe9dcc3, 0x5a8f4a); refuge.position.set(sx(41), spurY(41) * U, -1.6); root.add(refuge);
    const flag = new THREE.Group(); { const p = box(0.03, 0.9, 0.03, M.metal()), c = box(0.36, 0.22, 0.02, M.glow(HEX.ok)); p.position.y = 0.45; c.position.set(0.2, 0.78, 0); flag.add(p, c); } flag.position.set(sx(46), spurY(46) * U, -1.6); root.add(flag);
    [[58, 1.5], [72, -1.6], [80, 1.4], [100, 1.5], [56, -1.7], [120, 0.6], [121, -1], [30, -1.75], [52, -1.5]].forEach(([x, z]) => { const t = tree(0.65); t.position.set(sx(x), (z < -1.15 ? spurY(x) : yg(x)) * U, z); root.add(t); });
    // the signs
    [[92, 1.5, 0.3], [94, -1.4, -0.28]].forEach(([x, z, r]) => { const t = tree(0.65); t.position.set(sx(x), yg(x) * U, z); t.rotation.z = r; root.add(t); });
    const pl = pole(0.6); pl.position.set(sx(88), yg(88) * U, 1.0); pl.rotation.z = 0.3; root.add(pl);
    [[101, -0.9], [103.5, 0.7], [106, -0.2]].forEach(([x, z]) => { const c = box(0.03, 0.02, 1.3, M.matte(0x241a12)); c.position.set(sx(x), yg(x) * U + 0.03, z); c.rotation.z = 0.54; c.rotation.y = 0.2; root.add(c); });
    const spring = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), M.matte(0x7a5230)); spring.rotation.x = -Math.PI / 2; spring.position.set(sx(54), yg(54) * U + 0.09, 0); root.add(spring);
    const L = [stage.label('1 New cracks', [sx(104), yg(104) * U + 0.9, 0], root), stage.label('2 Tilting trees and poles', [sx(86), yg(88) * U + 1.5, 1], root), stage.label('3 Spring turns muddy', [sx(60), yg(54) * U - 0.9, Z1], root), stage.label('Safe: up on the side spur', [sx(46), spurY(46) * U + 1.25, -1.6], root)];
    const lFam = stage.label('', null, root), lState = stage.label('', [3.6, 6.5, 0], root, 'hot');
    const fam = [0xffd35a, 0xff7a59, 0x8ef0ff, 0xffffff].map((c, i) => { const p = person(c, i === 2 ? 0.16 : 0.22); root.add(p); return p; });

    const map = board(root, 7.4, 7.4, 1000, 1000, (g, w, h) => {
      panelBg(g, w, h);
      const X = (lon) => 60 + (lon - 67) * 29.5, Y = (lat) => 965 - (lat - 6.5) * 29.5;
      g.font = 'bold 30px sans-serif'; g.fillStyle = '#e8eef8'; g.fillText("India's landslide country", 30, 44);
      g.lineCap = g.lineJoin = 'round';
      BELTS.forEach((b) => { g.strokeStyle = 'rgba(255,122,89,.45)'; g.lineWidth = b.w; g.beginPath(); b.pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); });
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.beginPath(); COAST.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke();
      g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.5)'; [[77.2, 28.6, 'Delhi'], [72.85, 19.05, 'Mumbai'], [88.4, 22.6, 'Kolkata'], [80.27, 13.08, 'Chennai']].forEach(([x, y, t]) => { g.beginPath(); g.arc(X(x), Y(y), 4, 0, 7); g.fill(); g.fillText(t, X(x) + 9, Y(y) + 7); });
      g.fillStyle = COL.pull; g.font = 'bold 21px sans-serif'; g.fillText('Himalaya', X(83.3), Y(30.2)); g.fillText('North-eastern hills', X(91.3), Y(22.2)); g.fillText('Western', X(77.4), Y(15)); g.fillText('Ghats', X(77.4), Y(15) + 24); g.fillText('Eastern Ghats', X(83.9), Y(18.2));
      g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '19px sans-serif'; g.fillText('Arabian Sea', X(67.5), Y(14)); g.fillText('Bay of Bengal', X(85.5), Y(13.5));
      EVENTS.forEach((e) => { const x = X(e.at[0]), y = Y(e.at[1]); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(e.lx + (e.lx < x ? g.measureText(`${e.n}  ${e.t}`).width + 26 : -6), e.ly - 6); g.stroke();
        g.fillStyle = COL.warn; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke();
        g.font = 'bold 19px sans-serif'; g.fillStyle = COL.warn; g.fillText(String(e.n), e.lx, e.ly); g.fillStyle = '#e8eef8'; g.font = '19px sans-serif'; g.fillText(e.t, e.lx + 22, e.ly); });
      g.fillStyle = COL.ok; g.font = 'bold 44px sans-serif'; g.fillText('12.6%', 30, 120); g.fillStyle = '#e8eef8'; g.font = '20px sans-serif';
      ["of India's land outside snow-covered", 'areas is landslide-prone (GSI):', '0.42 million km²', '', 'North-east Himalaya  0.18', 'North-west Himalaya  0.14', 'Western Ghats, Konkan  0.09', 'Eastern Ghats  0.01'].forEach((t, i) => g.fillText(t, 30, 152 + i * 26));
      g.fillStyle = COL.soft; g.font = '18px sans-serif'; g.fillText('Orange: belts the Geological Survey of India maps as landslide-prone (rough sketch).', 30, 955); g.fillText('Only the sea coast is drawn. Not a map of boundaries.', 30, 980);
    }, [MX, 3.6, 0]);

    let td = 0, key = '', focus = '';
    const th = (x, xf) => (x < xf || x > SRC ? 0 : (2.4 * Math.exp(-(x - xf) / 13) + 0.35) * smooth((SRC - x) / 8));
    return {
      seek(v) { td = v; },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, L);
        if (s.focus !== focus) { if (focus && !inReel()) stage.setView(VIEWS[s.focus].pos, VIEWS[s.focus].target, 1); focus = s.focus; }
        map.mesh.scale.setScalar(narrow ? 0.62 : 1);
        const p = plan(s), k2 = `${s.dist}|${s.away}|${s.when}`;
        if (k2 !== key) { if (key) td = 0; key = k2; }
        td = (td + dt) % LOOP;
        const total = p.warn + 25, tt = clamp((td - 1) / (LOOP - 4), 0, 1) * total;                 // seconds since the slide began
        const prog = Math.min(1, tt / p.warn), xf = tt <= p.warn ? SRC - (SRC - HOME) * prog : Math.max(19, HOME - (tt - p.warn) * 1.2);
        mud.set(FAN - 2, SRC, (x) => yg(x) + 0.08 + th(x, xf), (x) => yg(x) + 0.05); mud.visible = xf < SRC - 0.5;
        fan.set(14, FAN, (x) => yg(x) + 0.03 + th(x, xf) * 0.6, yg); fan.visible = xf < FAN;
        rp.forEach((q, i) => { const x = xf + q.a; rocks.place(i, [sx(x), (yg(x) + th(x, xf) * (x < FAN ? 0.6 : 1)) * U + q.s * 0.6, q.z * (x < FAN ? 2.2 : 0.8) + (x < FAN ? 0.3 : 0)], [tt * q.sp * 0.3, q.sp, 0], xf < SRC - 0.5 ? q.s : 0.0001); }); rocks.done();
        homes[0].rotation.z = xf < HOME + 1 ? Math.min(0.5, (HOME + 1 - xf) * 0.08) : 0;
        const f = s.when === 'early' ? 1 : clamp((tt - p.start) / p.need, 0, 1), caught = !p.safe && tt >= p.warn;
        fam.forEach((q, i) => { const fi = clamp(f * 1.08 - i * 0.02, 0, 1), x = HOME + 1 + (44 - HOME - 1) * fi + i * 0.9, z = 0.45 + (-1.6 - 0.45) * fi + (i % 2) * 0.12, y = z < -1.15 ? spurY(x) : yg(x); q.position.set(sx(x), y * U, z); q.visible = !caught; });
        lFam.position.set(fam[0].position.x, fam[0].position.y + 0.75, fam[0].position.z);
        lFam.element.innerHTML = caught ? 'The flow reached the house first' : f >= 1 ? '<b>Out of its path</b>' : tt < p.start ? 'Still at home' : 'Moving out, sideways and uphill';
        lFam.element.className = 'lbl' + (caught ? ' hot' : '');
        lState.element.innerHTML = td < 1 ? '4 A rumble up the gully' : tt < p.warn ? `Debris flow coming: ${fmtT(Math.max(0, p.warn - tt))} away` : 'It spreads over the fan. More may follow: stay out';
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        if (s.focus === 'map') return '';
        const p = plan(s);
        return compact(`<div class="big ${p.safe ? 'ok' : 'no'}">${p.safe ? (s.when === 'early' ? 'Safe: they left hours ago' : 'They get clear in time') : 'They left too late'}</div>
          <div class="row"><span>The flow arrives after</span><b>${fmtT(p.warn)}</b></div>
          <div class="row"><span>They start moving after</span><b>${s.when === 'early' ? 'already gone' : fmtT(p.start)}</b></div>
          <div class="row"><span>They need, to cover ${s.away} m</span><b>${fmtT(p.need)}</b></div>
          <div class="row"><span>${p.safe ? 'Time to spare' : 'Short by'}</span><b>${s.when === 'early' ? 'hours' : fmtT(Math.abs(p.spare))}</b></div>
          <small>A flow at 10 m/s (36 km/h) from ${s.dist.toFixed(1)} km up the gully; the family walks at 1 m/s in the dark and rain. ${p.safe ? (s.when === 'early' ? 'Acting on the early signs is the only way that always works.' : 'Close calls like this depend on luck. The early signs give hours.') : 'Nobody outruns a debris flow down the valley. The only way out is sideways, and early.'}</small>`);
      },
    };
  },
};
