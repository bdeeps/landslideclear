// Chapter 2: the angle of repose. A live sandpile on a 60 cm tray: a height map on a 1 cm grid.
// Rule (the classic sandpile relaxation): wherever the drop to a neighbouring cell is steeper than
// tan θ, grains move down until it is not. Pour grains on top and the pile grows as a cone whose side
// stands at θ, the angle of repose. Nothing else is put in: the cone and its angle come out of the rule.
// Angles (typical; they vary with grain shape and size, see "Angle of repose", Wikipedia, and
// Al-Hashemi & Al-Amoudi 2018, Powder Technology 330): dry sand about 34°, wet sand about 45°,
// water-filled sand 15 to 30°, crushed gravel about 40 to 45°.
// Water: a little water forms tiny bridges between grains whose surface tension pulls them together
// (Hornbaker et al. 1997, Nature 387, "What keeps sandcastles standing?"; Scheel et al. 2008). When
// every pore is full the bridges are gone, and the water carries part of the load instead.
// Capillary pull matters for small grains and hardly at all for gravel, whose stones are far heavier.
import { THREE, M, box, clamp, swarm, approach } from '../kit.js';
import { D2R } from '../soil.js';
import { COL, board, panelBg, title, axes, curve, dot, placeBoard, compact, fitNarrow, rng } from '../slope.js';

const N = 61, C = (N - 1) / 2, S = 0.2;                                  // 1 cm cells, 1 scene unit = 5 cm
const MAT = {
  sand: { name: 'Sand', dry: 34, peak: 45, soak: 20, color: [0xe2c78c, 0x9a7a4c], grain: 0.045, rough: 0 },
  gravel: { name: 'Crushed gravel', dry: 40, peak: 42, soak: 37, color: [0x9a9ea6, 0x666b74], grain: 0.13, rough: 0.5 },
};
// Angle of repose against how much of the pore space holds water (0 dry, 1 full).
export function reposeAngle(mat, w) {
  const m = MAT[mat], pts = [[0, m.dry], [0.2, m.peak], [0.7, m.peak - 3], [1, m.soak]];
  for (let i = 1; i < pts.length; i++) if (w <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return a[1] + ((b[1] - a[1]) * (w - a[0])) / (b[0] - a[0]); }
  return m.soak;
}
const wetName = (w) => (w < 0.03 ? 'dry' : w < 0.45 ? 'damp' : w < 0.85 ? 'wet' : 'soaked');

export default {
  id: 'repose',
  short: 'The angle of repose',
  title: 'The angle of repose',
  subtitle: 'Pour any loose material and it settles at its own steepest angle.',
  view: { pos: [0.3, 7.4, 17.5], target: [0.3, 2.6, 0] },
  learn: `<p>Pour dry sand on a table and it makes a cone. Keep pouring: the cone grows, but its side stays at the <b>same angle</b>. Grains that land on a side that is too steep roll down until the slope is just gentle enough to hold them. That angle is the <b>angle of repose</b>.</p>
    <p>For dry sand it is about <b>34°</b>. Sharp, angular stones lock together and stand steeper, about 40° or more. Smooth round grains stand lower. The angle is friction in disguise: its tangent is the friction coefficient between the grains. Sand dunes, heaps of grain in a mandi, and the scree under a Himalayan cliff all sit at their angle of repose.</p>
    <p><b>A little water helps.</b> Damp sand holds a much steeper slope: that is how a sandcastle stands. Thin bridges of water form where grains touch, and surface tension pulls the grains together. It is a small, real <b>cohesion</b>.</p>
    <p><b>A lot of water hurts.</b> Fill every gap with water and the bridges vanish. Now the water carries part of the weight, the grains press on each other less, and friction falls. The castle slumps and flows. A hillside in a cloudburst goes the same way, and the next chapter shows why.</p>
    <p class="tip"><b>Try it:</b> pour dry sand and read the angle. Add a little water and pour again: the pile stands taller. Then soak it and watch it slump.</p>`,
  terms: [
    { t: 'Angle of repose', d: 'The steepest angle at which a heap of loose grains will stand without sliding.' },
    { t: 'Capillary bridge', d: 'A tiny neck of water between two grains. Its surface tension pulls them together.' },
    { t: 'Saturated', d: 'Every gap between the grains is full of water.' },
    { t: 'Scree (talus)', d: 'A slope of loose rock pieces under a cliff, lying at its angle of repose.' },
  ],
  defaults: { mat: 'sand', wet: 0, pour: true },
  controls: [
    { key: 'mat', type: 'seg', label: 'Material', options: [{ v: 'sand', label: 'Sand' }, { v: 'gravel', label: 'Crushed gravel' }] },
    { key: 'wet', type: 'range', label: 'Water in the gaps between grains', min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}% full: ${wetName(v)}`, ends: ['Dry', 'Soaked'] },
    { key: 'pour', type: 'toggle', label: 'Keep pouring' },
    { type: 'buttons', label: 'Tray', items: [{ label: 'Clear the tray', act: (s, inst) => inst.clear?.() }, { label: 'Shake it', act: (s, inst) => inst.shake?.() }] },
  ],
  quiz: [
    { q: 'You keep pouring dry sand on to a pile. What happens to the angle of its sides?', options: ['It gets steeper and steeper', 'It stays about the same while the pile grows', 'It gets flatter', 'It depends on how fast you pour'], answer: 1, why: 'Grains roll off any part that is too steep, so the sides stay at the angle of repose, about 34° for dry sand.' },
    { q: 'Why does damp sand hold a steeper slope than dry sand?', options: ['Water is sticky like glue', 'Water makes each grain heavier', 'Tiny water bridges between grains pull them together by surface tension', 'It does not'], answer: 2, why: 'Capillary bridges give damp sand a little cohesion. That is what holds a sandcastle up.' },
    { q: 'Why does soaked sand flow?', options: ['The water bridges are gone and the water carries part of the load, so friction drops', 'Water dissolves the sand', 'The grains get smaller', 'Wet grains are rounder'], answer: 0, why: 'With every gap full there is no surface tension to hold grains, and water pressure takes weight off the contacts between them.' },
  ],
  reel: [
    { ms: 5000, caption: 'Pour dry sand and it settles at about 34 degrees: its angle of repose.', set: { mat: 'sand', wet: 0, pour: true }, act: (s, inst) => inst.clear?.(0.45), view: { pos: [0, 5.5, 15], target: [0, 1.8, 0] }, spin: 0.6 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const h = new Float32Array(N * N), noise = new Float32Array(N * N), rnd = rng(11);
    for (let i = 0; i < N * N; i++) noise[i] = rnd() - 0.5;
    const R5 = Math.sqrt(5), NB = [[1, 0, 1], [0, 1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [2, 1, R5], [1, 2, R5], [2, -1, R5], [1, -2, R5]];   // 16 directions, so the pile comes out round
    let flip = false;
    function relax(tan, sweeps) {
      for (let k = 0; k < sweeps; k++) {
        flip = !flip;
        for (let a = 2; a < N - 2; a++) for (let b = 2; b < N - 2; b++) {
          const y = flip ? a : N - 1 - a, x = flip ? b : N - 1 - b, i = y * N + x;
          for (const [dx, dy, d] of NB) for (const sgn of [1, -1]) {
            const j = i + sgn * (dy * N + dx), e = h[i] - h[j] - tan * d;
            if (e > 0) { const mv = e * 0.2; h[i] -= mv; h[j] += mv; }
          }
        }
        for (let q = 0; q < N; q++) for (const e of [0, 1, N - 2, N - 1]) { h[e * N + q] = 0; h[q * N + e] = 0; }       // grains fall off the edge of the tray
      }
    }
    function pour(vol) { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) h[(C + dy) * N + C + dx] += (vol * Math.exp(-(dx * dx + dy * dy) / 2.2)) / 6.6; }
    function measure() {
      const top = h[C * N + C]; let sum = 0, n = 0, base = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let R = 0; while (R < C - 2 && h[(C + dy * (R + 1)) * N + C + dx * (R + 1)] > 0.15) R++;
        base += R;
        if (R < 6) continue;
        const r1 = Math.round(R * 0.25), r2 = Math.round(R * 0.75);
        sum += (h[(C + dy * r1) * N + C + dx * r1] - h[(C + dy * r2) * N + C + dx * r2]) / (r2 - r1); n++;
      }
      return { top, angle: n ? Math.atan(sum / n) / D2R : 0, base: base / 4 };
    }

    // tray, pile surface, hopper and falling grains
    const tray = box(N * S + 0.3, 0.16, N * S + 0.3, M.matte(0x3a4150)); tray.position.y = -0.15; root.add(tray);
    const geo = new THREE.PlaneGeometry((N - 1) * S, (N - 1) * S, N - 1, N - 1); geo.rotateX(-Math.PI / 2);
    const speck = document.createElement('canvas'); speck.width = speck.height = 256;
    { const g = speck.getContext('2d'); for (let i = 0; i < 256; i += 2) for (let j = 0; j < 256; j += 2) { const v = 190 + Math.floor(rnd() * 65); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i, j, 2, 2); } }
    const tex = new THREE.CanvasTexture(speck); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); tex.colorSpace = THREE.SRGBColorSpace;
    const pileMat = new THREE.MeshStandardMaterial({ color: MAT.sand.color[0], map: tex, roughness: 0.95, metalness: 0 });
    const pile = new THREE.Mesh(geo, pileMat); pile.castShadow = true; root.add(pile);
    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.12, 1.1, 24, 1, true), M.metal(0xaab2c0, { side: THREE.DoubleSide })); root.add(hopper);
    const grains = swarm(110, new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); root.add(grains);
    const gp = Array.from({ length: 110 }, () => ({ u: rnd(), x: (rnd() - 0.5) * 0.3, z: (rnd() - 0.5) * 0.3 }));
    // protractor on the pile's right flank
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8ef0ff }), lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const prot = new THREE.Line(lineGeo, lineMat); prot.frustumCulled = false; root.add(prot);
    const lAngle = stage.label('', null, root, 'hot'), lMat = stage.label('', [0, 0, 0], root);
    const chart = board(root, 4.6, 2.9, 736, 464, (g, w, hh, s) => {
      panelBg(g, w, hh); if (!s) return;
      title(g, 'Angle of repose against water', 'a little water helps, a lot hurts');
      const A = axes(g, w, hh, { xMin: 0, xMax: 1, yMin: 0, yMax: 50, xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 10, 20, 30, 40, 50], xFmt: (v) => Math.round(v * 100) + '%', yFmt: (v) => v + '°', xLabel: 'how full the gaps are with water' });
      for (const k of ['gravel', 'sand']) { const pts = []; for (let x = 0; x <= 1.001; x += 0.02) pts.push([A.X(x), A.Y(reposeAngle(k, x))]); curve(g, pts, k === s.mat ? '#8ef0ff' : 'rgba(255,255,255,.3)', k === s.mat ? 4 : 2); }
      g.font = '22px sans-serif'; g.fillStyle = COL.soft; g.fillText('sand', A.X(0.8), A.Y(reposeAngle('sand', 0.9)) + 40); g.fillText('gravel', A.X(0.84), A.Y(reposeAngle('gravel', 0.9)) - 14);
      dot(g, A.X(s.wet), A.Y(reposeAngle(s.mat, s.wet)), COL.warn);
    });

    let key = '', shakeT = 0, meas = { top: 0, angle: 0, base: 0 }, flow = 0, tAcc = 0;
    const api = {
      clear(fill = 0) { h.fill(0); if (fill) { for (let i = 0; i < 260 * fill; i++) { pour(22); relax(Math.tan(34 * D2R), 3); } relax(Math.tan(34 * D2R), 30); } },
      shake() { shakeT = 0.7; },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fitNarrow(stage, [lMat]);
        placeBoard(chart, [[4.6, 6.6, -2], -0.22, 1.25], [[0, 9.6, -4], 0, 1.3]);
        const m = MAT[s.mat], k2 = `${s.mat}|${s.wet}`;
        if (k2 !== key) { key = k2; chart.redraw(s); const c = new THREE.Color(m.color[0]).lerp(new THREE.Color(m.color[1]), clamp(s.wet * 1.4, 0, 1)); pileMat.color.copy(c); grains.material.color.copy(c); tex.repeat.setScalar(s.mat === 'gravel' ? 2.2 : 6); }
        shakeT = Math.max(0, shakeT - dt);
        const theta = reposeAngle(s.mat, s.wet) - (shakeT > 0 ? 9 : 0);
        if (s.pour && dt > 0) pour(380 * Math.min(dt, 0.05));
        relax(Math.tan(theta * D2R), 12);
        tAcc += dt; if (tAcc > 0.2 || !meas.top) { tAcc = 0; meas = measure(); }
        // draw the surface
        const pos = geo.attributes.position;
        for (let i = 0; i < N * N; i++) pos.setY(i, h[i] * S + (h[i] > 0.3 ? noise[i] * m.rough * 0.22 : 0));
        pos.needsUpdate = true; geo.computeVertexNormals();
        root.position.x = shakeT > 0 ? Math.sin(time * 70) * 0.05 : 0;
        const topY = h[C * N + C] * S;
        hopper.position.set(0, Math.max(5.2, topY + 1.6), 0); hopper.visible = s.pour;
        grains.visible = s.pour;
        if (s.pour) { const y0 = hopper.position.y - 0.5; gp.forEach((p, i) => { const u = (p.u + time * 1.6) % 1, y = y0 - (y0 - topY) * u * u; grains.place(i, [p.x * (1 + u), y, p.z * (1 + u)], [u * 9, i, 0], m.grain); }); grains.done(); }
        // protractor: horizontal base line and the flank
        const R = Math.max(1, meas.base) * S + 0.1, a = meas.angle * D2R, Lf = Math.min(3.2, (R - 0.3) / Math.max(0.2, Math.cos(a)));
        lineGeo.attributes.position.array.set([R + 1.3, 0.04, 0, R, 0.04, 0, R - Lf * Math.cos(a), 0.1 + Lf * Math.sin(a), 0]);
        lineGeo.attributes.position.needsUpdate = true; prot.visible = meas.top > 1.5;
        lAngle.visible = prot.visible; lAngle.position.set(R + 1.5, 0.75, 0); lAngle.element.innerHTML = `<b>${meas.angle.toFixed(0)}°</b>`;
        flow = approach(flow, meas.angle - theta > 3 ? 1 : 0, 6, dt);
        lMat.position.set(-3.6, Math.max(1.2, topY * 0.55), 3); lMat.element.innerHTML = flow > 0.5 ? 'Too steep for this much water: it slumps' : `${m.name}, ${wetName(s.wet)}`;
      },
      dispose() { stage.setShift(0, 0); },
      readout: (s) => {
        const th = reposeAngle(s.mat, s.wet), m = MAT[s.mat];
        return compact(`<div class="big">Angle of repose ${th.toFixed(0)}°</div>
          <div class="row"><span>${m.name}, ${wetName(s.wet)}</span><b>tan ${th.toFixed(0)}° = ${Math.tan(th * D2R).toFixed(2)}</b></div>
          <div class="row"><span>The pile's side right now</span><b>${meas.top > 1.5 ? meas.angle.toFixed(0) + '°' : 'too small to tell'}</b></div>
          <div class="row"><span>Pile height</span><b>${meas.top.toFixed(0)} cm</b></div>
          <div class="row"><span>Width of its base</span><b>${Math.round(meas.base * 2)} cm</b></div>
          <small>${s.wet < 0.03 ? 'Dry grains are held by friction alone, so tan(angle) is their friction coefficient.' : s.wet < 0.85 ? (s.mat === 'sand' ? 'Water bridges between the grains add a little cohesion. This is sandcastle sand.' : 'Gravel stones are too heavy for water bridges to matter much.') : s.mat === 'sand' ? 'Every gap is full. The bridges are gone and the water carries part of the load.' : 'Gravel drains fast and its stones still lock together, so it loses little.'} The tray is 60 cm wide; grains that reach its edge fall off.</small>`);
      },
    };
    api.clear(0.5);
    return api;
  },
};
