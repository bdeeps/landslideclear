// Chapter 3: what rain does. The same block-on-a-slope balance, now with water.
// Terzaghi's effective stress (1923 to 1925): friction comes from the press between the grains, and
// water in the gaps carries part of that press: σ′ = σ − u. On a slope with water flowing parallel
// to the surface, u = γw (m z) cos²β, where m is the wet share of the soil depth (soil.js).
// The slope: β = 32°, soil 2.5 m deep, φ′ = 36°, c′ = 4 kPa: FS 1.35 dry, 1.00 when 58% of the depth
// is wet, 0.75 when soaked to the surface.
// Rain: a one-bucket model (soil.js): up to 40 mm/h soaks in, 12% of the soil's volume is fillable,
// and the soil drains at up to 6 mm/h. So light rain never fills it, a long steady spell does it in a
// day or two, and a cloudburst does it in a few hours. These numbers are typical, not universal.
// IMD calls rain of 100 mm or more in an hour at one place a cloudburst.
// Caine (1980): worldwide, no slides were recorded below I = 14.82 D^-0.39 mm/h (D in hours).
// One second of the model is two hours.
import { infinite, criticalM, rainStep, hoursToFail, caine, storeMax, makeGeo, INFIL, DRAIN, GAMMA_W } from '../soil.js';
import { THREE, clamp, smooth, U, CX, sx, Z1, COL, makeHill, makeForceBlock, makeRain, makeCloud, house, tree, bush, board, panelBg, title, axes, curve, dot, placeBoard, compact, fitNarrow, fmt, inReel } from '../slope.js';

const P = { beta: 32, z: 2.5, c: 4, phi: 36 }, HRS = 2, MC = criticalM(P), RUN = 24;
const res = (m) => infinite({ ...P, m });
const fmtH = (h) => (h === Infinity ? 'never' : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} hours` : `${(h / 24).toFixed(1)} days`);
const rainName = (I) => (I <= 0 ? 'No rain' : I < 2.5 ? 'Light rain' : I < 7.6 ? 'Moderate rain' : I < 50 ? 'Heavy rain' : I < 100 ? 'Very heavy rain' : 'Cloudburst');

export default {
  id: 'rain',
  short: 'What rain does',
  title: 'What rain does',
  subtitle: 'Water does not push the hill down. It takes away the friction that was holding it.',
  view: { pos: [0.2, 3.4, 16.2], target: [0.2, 1.5, 0] },
  learn: `<p>Most landslides in India come in the monsoon. Rain <b>soaks into the soil</b> and fills the gaps between the grains. When the gaps are full the water is under pressure, the <b>pore-water pressure</b>, and it pushes back against the weight above.</p>
    <p>So the water carries part of the load, and the grains press on each other less. Friction comes only from that grain-to-grain press. Karl Terzaghi worked this out in the 1920s and called it <b>effective stress</b>: the total press minus the water pressure. As the water rises, friction falls, while the pull down the slope stays the same. It is the soaked sandcastle from the last chapter, on a hillside.</p>
    <p>Two kinds of rain do it. A <b>long monsoon spell</b> of steady rain for a day or two fills the soil slowly. A <b>cloudburst</b>, 100 mm or more in an hour by the India Meteorological Department's definition, fills it in hours. Rain that falls faster than the soil can drink runs off, which is why cloudbursts also bring flash floods and debris flows down the gullies.</p>
    <p>Light rain does not do it, because the soil drains as fast as it fills. That is why scientists work with <b>rainfall thresholds</b>: how hard it must rain, for how long, before slides begin. Nel Caine drew the first worldwide one in 1980. India's landslide forecasts today compare forecast rain with thresholds like these. What fell in the days before matters too: a slope that is already wet needs far less.</p>
    <p class="tip"><b>Try it:</b> press <b>Long monsoon spell</b> and watch the blue arrow grow and the green one shrink. Then try a cloudburst. Then find the gentlest rain that still brings the slope down.</p>`,
  terms: [
    { t: 'Pore-water pressure', d: 'The pressure of the water in the gaps between soil grains. It pushes the grains apart.' },
    { t: 'Effective stress', d: 'The press actually carried grain to grain: total press minus the water pressure. Friction depends on it.' },
    { t: 'Water table', d: 'The level below which the gaps in the ground are full of water.' },
    { t: 'Cloudburst', d: 'Very intense rain over a small area: by IMD, 100 mm or more in an hour.' },
    { t: 'Rainfall threshold', d: 'The mix of rain intensity and duration above which landslides become likely.' },
    { t: 'Antecedent rain', d: 'The rain of the previous days. Wet ground fails with less new rain.' },
  ],
  defaults: { I: 8 },
  controls: [
    { key: 'I', type: 'range', label: 'How hard it rains', min: 0, max: 120, step: 1, fmt: (v) => `${v} mm an hour · ${rainName(v).toLowerCase()}`, ends: ['Dry', 'Cloudburst'], hint: 'Only about 40 mm an hour can soak in. The rest runs off.' },
    { type: 'buttons', label: 'Start a storm on dry ground', items: [
      { label: 'Long monsoon spell', act: (s, inst) => { s.I = 8; inst.reset?.(); } },
      { label: 'Cloudburst', act: (s, inst) => { s.I = 100; inst.reset?.(); } },
      { label: 'Let it dry', act: (s, inst) => { s.I = 0; inst.reset?.(); } },
    ] },
  ],
  quiz: [
    { q: 'How does rain make a slope fail?', options: ['Mainly by making the soil much heavier', 'Water pressure in the gaps takes the press off the grains, so friction falls', 'It washes the bedrock away', 'It makes the slope steeper'], answer: 1, why: 'The pull hardly changes. What changes is the effective stress: pore-water pressure carries part of the load, and friction depends only on the grain-to-grain press.' },
    { q: 'Why does a week of light drizzle usually not cause a landslide?', options: ['The soil drains about as fast as it fills, so the water never builds up', 'Drizzle is too cold', 'Light rain does not reach the ground', 'It always does'], answer: 0, why: 'Slides need the water in the soil to rise. Below a threshold of intensity and duration, drainage keeps up.' },
    { q: 'It has rained steadily for three days. Now a short, heavy burst arrives. Why is that dangerous?', options: ['It is not', 'The ground is already nearly full, so little more rain is needed to tip it', 'Heavy rain is heavier than light rain', 'The rain cools the soil'], answer: 1, why: 'The rain of the days before sets how much room is left in the soil. This is why forecasters track it.' },
  ],
  reel: [
    { ms: 5500, caption: 'Rain fills the gaps between the grains. The water pushes back, the grains press less, and friction falls.', set: { I: 16 }, act: (s, inst) => inst.reset?.(0.1), view: { pos: [0.2, 2.8, 17.5], target: [0.2, 1.0, 0] }, spin: 0 },
    { ms: 6500, caption: 'A cloudburst does in hours what a monsoon spell does in days. Below a factor of safety of 1, the slope goes.', set: { I: 100 }, act: (s, inst) => inst.reset?.(0.34), view: { pos: [0.2, 2.8, 17.5], target: [0.2, 1.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const hill = makeHill(stage), root = hill.root;
    const geo = makeGeo({ beta: P.beta, H: 48, ts: P.z, T: 9, endX: 128 });
    const X = { a: geo.xAt(5), b: geo.xAt(39) };
    const surf = { xa: X.a, xb: X.b, ys: (x) => geo.yg(x) - P.z * smooth((x - X.a) / 9) * smooth((X.b - x) / 7) };
    let m = 0, hours = 0, total = 0, d = 0, failT = -1, failAt = null;
    geo.ywt = (x) => (x <= geo.o.toeX ? Math.min(geo.yg(x), -0.5) : Math.min(geo.yg(x), geo.ysoil(x) + m * P.z));
    [[geo.topX + 7, -1.1, 0.55], [geo.topX + 13, 0.9, 0.5], [geo.topX + 20, -0.3, 0.55], [geo.xAt(27), 1.1, 0.5], [geo.xAt(16), -0.9, 0.5], [16, 0.6, 0.5]].forEach(([x, z, w], i) => hill.add(house(w, i % 2 ? 0xe9dcc3 : 0xd9c9a8), x, z, { lean: 0.5, dir: i % 2 ? 1 : -1 }));
    [0.08, 0.2, 0.3, 0.42, 0.5, 0.62, 0.72, 0.9, 0.97, 0.14, 0.36, 0.68, 0.84].forEach((f, i) => hill.add(i % 4 === 3 ? bush(0.2) : tree(0.55 + (i % 3) * 0.12), geo.xAt(48 * f), -1.7 + ((i * 0.618) % 1) * 3.3, { lean: 0.9, dir: i % 2 ? 1 : -1 }));
    const fb = makeForceBlock(stage, root, { pore: true });
    const rain = makeRain(root), clouds = [[-3.5, 8.6, -0.5, 1.1], [1, 9.1, 0.4, 1.3], [5, 8.7, -0.3, 1.1]].map(([x, y, z, sc]) => makeCloud(root, [x, y, z], sc));
    const lState = stage.label('', [4.3, 6.0, 0], root, 'hot'), lWt = stage.label('Water table', null, root), lSoil = stage.label('Soil', null, root), lRock = stage.label('Weathered rock, then bedrock', null, root);
    const xl = geo.xAt(43); lSoil.position.set(sx(xl), (geo.yg(xl) - 1.2) * U, Z1); lRock.position.set(sx(xl + 6), (geo.yg(xl) - 9) * U, Z1);
    const minor = [lWt, lSoil, lRock];
    const chart = board(root, 4.6, 3.0, 736, 480, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      title(g, 'How hard, for how long?', 'rain needed to bring a slope down');
      const A = axes(g, w, h, { xMin: 1, xMax: 240, yMin: 1, yMax: 120, log: [true, true], xTicks: [1, 3, 10, 24, 72, 240], yTicks: [1, 3, 10, 30, 100], xFmt: (v) => (v < 24 ? v + ' h' : v / 24 + ' d'), yFmt: (v) => v, xLabel: 'how long it has rained', yLabel: 'mm an hour' });
      const cl = (v) => clamp(v, 1, 120);
      const pc = [], pm = []; for (let D = 1; D <= 240; D *= 1.12) { pc.push([A.X(D), A.Y(cl(caine(D)))]); const need = (DRAIN * MC) / (1 - Math.exp((-DRAIN * D) / storeMax(P.z))); if (need <= INFIL) pm.push([A.X(D), A.Y(cl(need))]); }
      if (pm.length) { pm.unshift([pm[0][0], A.Y(120)]); g.fillStyle = 'rgba(255,90,138,.13)'; g.beginPath(); pm.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(A.x1, A.y1); g.closePath(); g.fill(); }
      curve(g, pc, 'rgba(255,255,255,.75)', 2.5, [8, 6]); curve(g, pm, COL.bad, 4);
      g.font = '22px sans-serif'; g.fillStyle = COL.bad; g.fillText('this slope fails', A.X(24), A.Y(55)); g.fillStyle = COL.soft; g.fillText('Caine 1980: world minimum', A.X(1.15), A.Y(caine(1.2)) + 34);
      if (st.I > 0 && st.hours > 0.2) { curve(g, [[A.X(1), A.Y(cl(st.I))], [A.X(clamp(st.hours, 1, 240)), A.Y(cl(st.I))]], '#8ef0ff', 3); dot(g, A.X(clamp(st.hours, 1, 240)), A.Y(cl(st.I)), st.failed ? COL.bad : '#8ef0ff'); }
    });
    const grainsB = board(root, 2.5, 2.5, 400, 400, (g, w, h, st) => {
      panelBg(g, w, h); if (!st) return;
      g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.fillText('Between the grains', 18, 38);
      const wl = 360 - st.m * 290;
      g.fillStyle = 'rgba(74,168,255,.5)'; g.fillRect(14, wl, w - 28, 372 - wl);
      const eff = clamp(st.eff, 0.15, 1);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const x = 62 + c * 72 + (r % 2) * 36 - 18, y = 96 + r * 62;
        if (r < 4) { g.strokeStyle = COL.grip; g.lineWidth = 1 + 7 * eff; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r % 2 ? -36 : 36), y + 62); g.stroke(); }
        g.fillStyle = '#b8935f'; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke();
      }
      g.font = '19px sans-serif'; g.fillStyle = '#fff'; g.fillText('green: press between grains', 18, 388);
    });

    let drawT = 0;
    const api = {
      reset(m0 = 0) { m = m0; hours = 0; total = 0; d = 0; failT = -1; failAt = null; },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        fb.group.userData.narrow = fitNarrow(stage, minor);
        placeBoard(chart, [[-3.4, -3.0, 2.2], 0, 1.22], [[-3.4, -2.7, 2.2], 0, 1.05]); placeBoard(grainsB, [[1.6, -3.0, 2.2], 0, 1.45], [[1.2, -2.7, 2.2], 0, 1.25]);
        const failed = failT >= 0;
        if (!failed) {
          const dh = dt * HRS; m = rainStep(m, s.I, P.z, dh);
          if (s.I > 0) { hours += dh; total += s.I * dh; } else if (m < 0.01) { hours = 0; total = 0; }
          if (res(m).FS < 1) { failT = 0; failAt = { hours, total }; }
        } else {
          failT += dt; d = RUN * smooth(Math.min(1, failT / 3.2)) ** 1.5;
          if (failT > 8.5 && !inReel()) api.reset();
        }
        const r = res(m);
        drawT -= dt;
        if (failed || drawT <= 0) { drawT = 0.08; hill.draw(geo, failed ? { surf, d } : null); hill.water.set(0, 128, geo.ywt, (x) => (x <= geo.o.toeX ? -9 : Math.min(geo.ysoil(x), hill.top(x)))); chart.redraw({ I: s.I, hours, failed }); grainsB.redraw({ m, eff: r.eff / r.sigma }); }
        const xb = geo.xAt(14), off = failed ? (d * U) / Math.cos(P.beta * Math.PI / 180) : 0;
        fb.update(sx(xb), geo.yg(xb) * U, P.beta, r, Math.min(off, 1.6)); fb.group.visible = !failed || failT < 2;
        if (!fb.group.visible) Object.values(fb.labels).forEach((l) => { l.visible = false; }); else fb.labels.pull.visible = true;
        const k = s.I <= 0 ? 0 : 0.1 + 0.9 * Math.pow(Math.min(1, s.I / 100), 0.6);
        rain.step(dt, k, (x) => hill.top(x / U + CX) * U);
        clouds.forEach((c, i) => { c.mat.color.setScalar(0.9 - 0.55 * k); c.position.x += Math.sin(time * 0.2 + i) * 0.001; });
        const xw = geo.xAt(41); lWt.visible = lWt.visible && m > 0.08 && !failed; lWt.position.set(sx(xw) + 0.5, (geo.ysoil(xw) + m * P.z) * U - 0.25, Z1 + 0.05);
        lState.element.innerHTML = failed ? `The slope fails after ${fmtH(failAt.hours)} and ${fmt(failAt.total)} mm of rain` : s.I <= 0 ? (m > 0.02 ? 'The soil drains' : 'Dry ground') : `${rainName(s.I)}: ${fmtH(hours)} so far`;
        lState.element.style.setProperty('--c', failed ? COL.bad : COL.warn);
        api.state = { m, hours, total, failed, failAt };
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const r = res(m), failed = failT >= 0, tf = hoursToFail(s.I, MC, P.z);
        return compact(`<div class="big ${r.FS < 1 ? 'no' : r.FS >= 1.25 ? 'ok' : ''}">Factor of safety ${r.FS.toFixed(2)}</div>
          <div class="row"><span>Rain so far</span><b>${fmt(failed ? failAt.total : total)} mm in ${fmtH(failed ? failAt.hours : hours)}</b></div>
          <div class="row"><span>Soil depth that is full of water</span><b>${Math.round(m * 100)}%</b></div>
          <div class="row"><span>Water pressure at the base</span><b>${r.u.toFixed(1)} kPa</b></div>
          <div class="row"><span>Press between grains: ${r.sigma.toFixed(1)} − ${r.u.toFixed(1)}</span><b>${r.eff.toFixed(1)} kPa</b></div>
          <div class="row"><span>Friction ${r.fric.toFixed(1)} + cohesion ${r.coh.toFixed(1)} against a pull of</span><b>${r.tau.toFixed(1)} kPa</b></div>
          <small>${s.I <= 0 ? 'No rain: the soil drains and friction comes back.' : tf === Infinity ? `At ${s.I} mm an hour this soil drains as fast as it fills. It levels off ${Math.round((Math.min(s.I, INFIL) / DRAIN) * 100)}% full and holds.` : `At ${s.I} mm an hour this slope fails after about ${fmtH(tf)} from dry: ${fmt(tf * s.I)} mm of rain${s.I > INFIL ? ', most of it run-off' : ''}.`} It fails when ${Math.round(MC * 100)}% of the soil depth is full. A simple model: real slopes differ.</small>`);
      },
    };
    return api;
  },
};
