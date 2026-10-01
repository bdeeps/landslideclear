// Chapter 1: a slope in balance. A hillside in cutaway (soil over weathered rock over bedrock, with
// a village, a road cut and a stream) and one block of its soil with the forces on it drawn to scale.
// Physics: the infinite-slope model (soil.js). On the base of a soil layer z metres deep:
//   pull     τ = γ z sin β cos β            grip  s = c′ + γ z cos²β tan φ′        FS = s ÷ τ
// γ = 19 kN/m³. Typical values: loose sandy hill soil φ′ = 30 to 36°, c′ = 0 to 10 kPa; stiff clay
// soils have more cohesion and less friction (Craig's Soil Mechanics; USGS landslide handbook).
// Engineers want FS of about 1.5 for a slope with houses on it; at 1 it is on the point of sliding.
// The slope here is 90 m long whatever its angle, so the hill grows taller as it steepens.
import { infinite, criticalAngle, makeGeo, D2R } from '../soil.js';
import { THREE, M, box, clamp, smooth, U, sx, Z1, HEX, COL, makeHill, makeForceBlock, house, tree, bush, board, panelBg, title, axes, curve, dot, placeBoard, compact, fitNarrow, rockMat } from '../slope.js';
import { approach } from '../kit.js';

const LEN = 90;
const res = (s) => infinite({ beta: s.beta, z: s.z, c: s.c, phi: s.phi });

export default {
  id: 'balance',
  short: 'A slope in balance',
  title: 'A slope in balance',
  subtitle: 'Every hillside is a tug of war: gravity pulls the soil down, friction and cohesion hold it.',
  view: { pos: [0.2, 3.2, 15.8], target: [0.2, 1.3, 0] },
  learn: `<p>A hillside looks still, but it is a balance of forces. Cut it open and you find <b>soil</b> on top, broken <b>weathered rock</b> under it, and solid <b>bedrock</b> below. The soil is the part that slides most often.</p>
    <p>Take one block of that soil. Its <b>weight</b> points straight down. Part of the weight pulls the block <b>along the slope</b>: that is the driving force. The rest presses it <b>into the slope</b>, and that press is what gives <b>friction</b> its grip. The steeper the slope, the bigger the pull and the smaller the press.</p>
    <p>Two things hold the block. <b>Friction</b> between the grains, set by the <b>friction angle</b> φ: rough, angular grains lock together better than smooth round ones. And <b>cohesion</b>: the stickiness of clay, a little cement between grains, and roots. Charles-Augustin Coulomb wrote this down in 1776: strength = cohesion + press × tan φ.</p>
    <p>Engineers divide the grip by the pull and call it the <b>factor of safety</b>. Above 1 the slope holds. At 1 it is on the edge. Below 1 it moves. For slopes with homes on them they aim for about 1.5, because soil is never the same from place to place.</p>
    <p>A <b>landslide</b> is what happens when that number drops below 1. The rest of this box is about what pushes it down. If you want the basics first, see <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/frictionclear/">FrictionClear</a> and <a style="color:inherit;text-decoration:underline" href="https://glassbox.how/gravityclear/">GravityClear</a>.</p>
    <p class="tip"><b>Try it:</b> steepen the slope until the block lets go. Then set cohesion to zero: the slope now fails at exactly the friction angle, whatever the soil's depth.</p>`,
  terms: [
    { t: 'Factor of safety', d: 'The grip holding a slope divided by the pull trying to move it. Below 1, it slides.' },
    { t: 'Friction angle (φ)', d: 'A measure of how well soil grains lock together. Friction = press × tan φ.' },
    { t: 'Cohesion', d: 'Strength that does not depend on the press: clay stickiness, cement between grains, roots.' },
    { t: 'Weathered rock', d: 'Rock broken and softened by water, air and roots over thousands of years. It turns slowly into soil.' },
    { t: 'Bedrock', d: 'The solid rock under the soil and weathered layers.' },
  ],
  defaults: { beta: 30, phi: 32, c: 5, z: 3, lift: false },
  controls: [
    { key: 'beta', type: 'range', label: 'Slope angle', min: 10, max: 45, step: 1, fmt: (v) => `${v}°`, ends: ['Gentle', 'Steep'] },
    { key: 'phi', type: 'range', label: 'Friction angle of the soil', min: 20, max: 42, step: 1, fmt: (v) => `${v}°`, ends: ['Smooth, round grains', 'Rough, angular grains'] },
    { key: 'c', type: 'range', label: 'Cohesion', min: 0, max: 20, step: 1, fmt: (v) => `${v} kPa`, ends: ['Loose sand', 'Clayey, rooted'] },
    { key: 'z', type: 'range', label: 'Depth of the soil', min: 1, max: 8, step: 0.5, fmt: (v) => `${v} m` },
    { key: 'lift', type: 'toggle', label: 'Lift the layers apart', hint: 'Soil, weathered rock and bedrock.' },
  ],
  quiz: [
    { q: 'A slope has a factor of safety of 0.9. What does that mean?', options: ['It is 90% safe', 'The grip is less than the pull, so it will slide', 'It can carry 0.9 tonnes', 'It is safe for 0.9 years'], answer: 1, why: 'The factor of safety is grip divided by pull. Below 1 the pull wins and the slope moves.' },
    { q: 'As a slope gets steeper, what happens to the forces on a block of soil?', options: ['The pull along the slope grows and the press into it shrinks', 'Both shrink', 'The weight of the block grows', 'Nothing changes'], answer: 0, why: 'The weight stays the same, but more of it points down the slope and less of it presses the block on to the slope, so friction also falls.' },
    { q: 'Dry sand has almost no cohesion. What is the steepest slope it can hold?', options: ['Any angle', 'About its friction angle', 'Exactly 45°', 'It cannot hold any slope'], answer: 1, why: 'With no cohesion the factor of safety is tan φ ÷ tan β, which reaches 1 when the slope angle equals the friction angle.' },
  ],
  reel: [
    { ms: 5500, caption: 'A hillside is a tug of war. Gravity pulls the soil down the slope. Friction and cohesion hold it.', set: { beta: 26, phi: 32, c: 5, z: 3, lift: false }, view: { pos: [-1.6, 2.6, 11.5], target: [-1.6, 0.6, 0.6] }, spin: 0 },
    { ms: 5500, caption: 'Grip divided by pull is the factor of safety. Steepen the slope and it falls below 1: the soil lets go.', set: { phi: 32, c: 5, z: 3, lift: false }, anim: { beta: [24, 42] }, view: { pos: [0.2, 2.8, 17.5], target: [0.2, 1.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    stage.floor.visible = false;
    const hill = makeHill(stage), root = hill.root;
    const fb = makeForceBlock(stage, root);
    // village on top, a house by the road, trees on the slope
    const houses = [[6, -1.2, 0.6], [11, 0.9, 0.5], [16, -0.4, 0.55], [21, 1.3, 0.5], [24, -1.3, 0.5]].map(([dx, z, w], i) => ({ dx, o: hill.add(house(w, i % 2 ? 0xe9dcc3 : 0xd9c9a8, i % 2 ? 0x9c4a36 : 0xb5533c), 0, z) }));
    const frac = [0.1, 0.16, 0.24, 0.33, 0.4, 0.47, 0.7, 0.76, 0.83, 0.9, 0.96, 0.2, 0.36, 0.8, 0.88, 0.67];
    const trees = frac.map((f, i) => ({ f, o: hill.add(i % 4 === 3 ? bush(0.2) : tree(0.55 + (i % 3) * 0.12), 0, -1.7 + ((i * 0.618) % 1) * 3.2) }));
    const roadStrip = box(0.7, 0.03, 4, rockMat(HEX.road)); hill.soilG.add(roadStrip);
    const bus = box(0.5, 0.2, 0.2, M.plastic(0xe6b93c)); hill.soilG.add(bus);
    const L = {
      soil: stage.label('Soil', null, hill.soilG), weath: stage.label('Weathered rock', null, hill.weathG), rock: stage.label('Bedrock', null, root),
      road: stage.label('Road cut', null, hill.soilG), stream: stage.label('Stream', [sx(9), 0.55, Z1], root), village: stage.label('Village', null, hill.soilG), state: stage.label('', null, root, 'hot'),
    };
    const minor = [L.weath, L.rock, L.road, L.stream, L.village];
    const chart = board(root, 4.4, 2.9, 704, 464, (g, w, h, s) => {
      panelBg(g, w, h); if (!s) return;
      title(g, 'Factor of safety against slope angle', 'for this soil');
      const A = axes(g, w, h, { xMin: 10, xMax: 45, yMin: 0, yMax: 3, xTicks: [10, 20, 30, 40], yTicks: [0, 1, 2, 3], xFmt: (v) => v + '°', xLabel: 'slope angle', yLabel: '' });
      g.fillStyle = 'rgba(255,90,138,.14)'; g.fillRect(A.x0, A.Y(1), A.x1 - A.x0, A.y0 - A.Y(1));
      curve(g, [[A.x0, A.Y(1)], [A.x1, A.Y(1)]], COL.bad, 2, [8, 6]); curve(g, [[A.x0, A.Y(1.5)], [A.x1, A.Y(1.5)]], COL.ok, 2, [4, 8]);
      g.font = '22px sans-serif'; g.fillStyle = COL.bad; g.fillText('slides below 1', A.x0 + 12, A.Y(1) + 30); g.fillStyle = COL.ok; g.fillText('design target 1.5', A.x1 - 190, A.Y(1.5) - 10);
      const pts = []; for (let b = 10; b <= 45; b += 0.5) pts.push([A.X(b), A.Y(Math.min(3, infinite({ ...s, beta: b }).FS))]);
      curve(g, pts, '#8ef0ff', 4);
      const fs = res(s).FS; dot(g, A.X(s.beta), A.Y(Math.min(3, fs)), fs < 1 ? COL.bad : COL.ok);
    }, [0, 0, 0]);

    let key = '', slideT = 0, liftK = 0, geo = null;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        fb.group.userData.narrow = fitNarrow(stage, minor);
        placeBoard(chart, [[-2.9, -3.0, 2.2], 0, 1.3], [[-2.9, -2.75, 2.2], 0, 1.15]);
        liftK = approach(liftK, s.lift ? 1 : 0, 5, dt); hill.explode(liftK);
        const r = res(s), k2 = `${s.beta}|${s.phi}|${s.c}|${s.z}`;
        if (k2 !== key) {
          key = k2;
          geo = makeGeo({ beta: s.beta, H: LEN * Math.sin(s.beta * D2R), ts: s.z, T: Math.max(10, s.z + 5), road: true, m: 0.12, endX: 128 });
          houses.forEach((h) => { h.o.userData.p = hill.props.find((p) => p.obj === h.o); h.o.userData.p.x = Math.min(125, geo.topX + h.dx); });
          trees.forEach((t) => { const p = hill.props.find((q) => q.obj === t.o); let x = geo.xAt(geo.o.H * t.f); if (x > geo.roadX - 1 && x < geo.roadX + 13) x = geo.roadX + 14; p.x = x; });
          hill.draw(geo, null, { showWater: false });
          roadStrip.position.set(sx(geo.roadX + 3.5), geo.ROAD_Y * U + 0.016, 0); bus.position.set(sx(geo.roadX + 3.5), geo.ROAD_Y * U + 0.13, 0.9); bus.rotation.y = Math.PI / 2;
          const xm = geo.xAt(geo.o.H * 0.8), ym = geo.yg(xm);
          L.soil.position.set(sx(xm), (ym - s.z / 2) * U, Z1); L.weath.position.set(sx(xm + 4), (ym - s.z - 4) * U - 0.25, Z1); L.rock.position.set(sx(geo.topX + 8), geo.o.H * U * 0.35, Z1);
          L.road.position.set(sx(geo.roadX + 4), geo.ROAD_Y * U + 0.75, Z1); L.village.position.set(sx(Math.min(122, geo.topX + 14)), geo.o.H * U + 1.25, 0);
          chart.redraw(s);
        }
        // the block: holds while FS ≥ 1, slides and resets while FS < 1
        slideT = r.FS < 1 ? (slideT + dt) % 3.2 : 0;
        const off = r.FS < 1 ? 2.6 * smooth(Math.min(1, slideT / 2.2)) ** 1.6 : 0;
        const xb = geo.xAt(geo.o.H * 0.24), yb = geo.yg(xb) * U;
        fb.update(sx(xb), yb, s.beta, r, off);
        L.state.position.set(sx(xb) - 1.2, yb + 2.3, Z1 + 0.6);
        L.state.element.innerHTML = r.FS < 1 ? 'Pull beats grip: it slides' : r.FS < 1.25 ? 'Holding, with little to spare' : 'Holding';
        L.state.element.style.setProperty('--c', r.FS < 1 ? COL.bad : r.FS < 1.25 ? COL.warn : COL.ok);
      },
      dispose() { stage.floor.visible = true; stage.setShift(0, 0); },
      readout: (s) => {
        const r = res(s), crit = criticalAngle({ z: s.z, c: s.c, phi: s.phi });
        return compact(`<div class="big ${r.FS < 1 ? 'no' : r.FS >= 1.25 ? 'ok' : ''}">Factor of safety ${r.FS.toFixed(2)}</div>
          <div class="row"><span>Pull along the slope</span><b>${r.tau.toFixed(1)} kPa</b></div>
          <div class="row"><span>Grip: friction ${r.fric.toFixed(1)} + cohesion ${r.coh.toFixed(1)}</span><b>${r.resist.toFixed(1)} kPa</b></div>
          <div class="row"><span>Press into the slope</span><b>${r.sigma.toFixed(1)} kPa</b></div>
          <div class="row"><span>Steepest angle this soil can hold</span><b>${crit >= 88 ? 'any' : crit.toFixed(0) + '°'}</b></div>
          <small>Dry soil, ${s.z} m deep, 19 kN/m³. 1 kPa is the weight of about 100 kg on each square metre. ${r.FS < 1 ? 'Below 1: this slope would already have slid.' : r.FS < 1.5 ? 'Engineers want about 1.5 where people live below.' : 'Comfortably stable while it stays dry.'}</small>`);
      },
    };
  },
};
