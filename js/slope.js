// Shared 3D parts for LandslideClear: a hillside drawn in cutaway from the section functions in
// soil.js (soil over weathered rock over bedrock, water table, slip surface, sliding debris),
// houses and trees that ride on it, a block of soil with force arrows, rain, and chart boards.
// Scale: 1 scene unit = 10 m. +x into the hill (uphill), +y up, +z towards you.
import { THREE, M, box, sphere, arrow, canvasTexture, clamp, smooth } from './kit.js';
import { D2R } from './soil.js';

export const U = 0.1, CX = 62, Z0 = -2, Z1 = 2;
export const sx = (x) => (x - CX) * U;
export const COL = { pull: '#ff7a59', grip: '#a3e635', coh: '#ffd35a', water: '#4aa8ff', weight: '#c49bff', press: '#9aa4b2', ok: '#a3e635', bad: '#ff5a8a', warn: '#ffd35a', soft: 'rgba(255,255,255,.6)', dim: 'rgba(255,255,255,.35)' };
export const HEX = { pull: 0xff7a59, grip: 0xa3e635, coh: 0xffd35a, water: 0x3d97e8, weight: 0xc49bff, press: 0x9aa4b2, soil: 0x8a6240, soilTop: 0x5d8a3c, weath: 0xb39a72, rock: 0x5f646d, debris: 0x7a5636, bare: 0x9a7650, road: 0x2e3138, bad: 0xff5a8a, ok: 0xa3e635 };

export const inReel = () => document.body.classList.contains('gb-reel');
export const fmt = (v, d = 0) => v.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
// On a phone the stage is small, so the readout keeps its headline and first two rows only.
export function compact(html) {
  if (window.innerWidth >= 560 || inReel()) return html;
  let n = 0;
  return html.replace(/<small[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (n++ < 2 ? m : ''));
}
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.16 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}

// ---------------------------------------------------------------- boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
export function board(root, w, h, pxW, pxH, draw, pos = [0, 0, 0]) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 32px sans-serif'; g.textAlign = 'left'; g.fillText(text, 22, 44);
  if (sub) { g.font = '23px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, 22, 76); }
}
// Place a board: [position, yRotation, scale] for a wide screen, and another for the tall reel video.
export function placeBoard(b, wide, reel) {
  const [p, r = 0, s = 1] = inReel() && reel ? reel : wide;
  b.mesh.position.set(...p); b.mesh.rotation.set(0, r, 0); b.mesh.scale.setScalar(s);
}
// Axes for a chart. Returns X and Y mappers. log: [xLog, yLog].
export function axes(g, w, h, { x0 = 84, x1 = w - 26, y0 = h - 74, y1 = 100, xMin = 0, xMax, yMin = 0, yMax, xTicks = [], yTicks = [], xFmt = String, yFmt = String, xLabel = '', yLabel = '', log = [false, false] }) {
  const f = (v, a, b, lg) => (lg ? Math.log(v / a) / Math.log(b / a) : (v - a) / (b - a));
  const X = (v) => x0 + (x1 - x0) * f(v, xMin, xMax, log[0]), Y = (v) => y0 + (y1 - y0) * f(v, yMin, yMax, log[1]);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = COL.soft; g.font = '23px sans-serif';
  g.textAlign = 'center'; xTicks.forEach((v) => { g.beginPath(); g.moveTo(X(v), y0); g.lineTo(X(v), y1); g.stroke(); g.fillText(xFmt(v), X(v), y0 + 28); });
  g.textAlign = 'right'; yTicks.forEach((v) => { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.fillText(yFmt(v), x0 - 10, Y(v) + 8); });
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = COL.soft; g.textAlign = 'center'; g.fillText(xLabel, (x0 + x1) / 2, h - 14);
  if (yLabel) { g.save(); g.translate(26, (y0 + y1) / 2); g.rotate(-Math.PI / 2); g.fillText(yLabel, 0, 0); g.restore(); }
  g.textAlign = 'left';
  return { X, Y, x0, x1, y0, y1 };
}
export function curve(g, pts, col, wdt = 4, dash = null) {
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 9) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }

// ---------------------------------------------------------------- section shapes
// A cross-section slab between z0 and z1 whose top and bottom outlines are functions of x (in
// metres) and can change every frame. Three materials: the cut face, the top, the back.
export function slab(n, z0, z1, mats) {
  const pos = new Float32Array((n + 1) * 6 * 3), idx = [[], [], []];
  for (let i = 0; i < n; i++) {
    const a = i * 6, b = a + 6;
    idx[0].push(a + 1, b + 1, b, a + 1, b, a);
    idx[1].push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
    idx[2].push(b + 5, a + 5, a + 4, b + 5, a + 4, b + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx.flat());
  const many = Array.isArray(mats);
  if (many) idx.forEach((k, i) => g.addGroup(i * n * 6, n * 6, Math.min(i, mats.length - 1)));
  const m = new THREE.Mesh(g, mats); m.frustumCulled = false; m.receiveShadow = true;
  m.set = (x0, x1, top, bot) => {
    for (let i = 0; i <= n; i++) {
      const xm = x0 + ((x1 - x0) * i) / n, x = sx(xm), t = top(xm) * U, b = Math.min(t, bot(xm) * U), o = i * 18;
      pos.set([x, t, z1, x, b, z1, x, t, z1, x, t, z0, x, t, z0, x, b, z0], o);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  };
  return m;
}
// A flat strip on the cut face (water, a slip surface, a marker line) between two outlines.
export function ribbon(n, mat, z = Z1 + 0.012) {
  const pos = new Float32Array((n + 1) * 6), idx = [];
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  m.set = (x0, x1, top, bot) => {
    for (let i = 0; i <= n; i++) { const xm = x0 + ((x1 - x0) * i) / n, t = top(xm) * U; pos.set([sx(xm), Math.min(t, bot(xm) * U), z, sx(xm), t, z], i * 6); }
    g.attributes.position.needsUpdate = true;
  };
  return m;
}
export const rockMat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, ...o });
export const waterMat = (opacity = 0.55) => new THREE.MeshStandardMaterial({ color: HEX.water, transparent: true, opacity, roughness: 0.2, metalness: 0, depthWrite: false, side: THREE.DoubleSide });

// ---------------------------------------------------------------- small things that stand on a slope
export function house(w = 0.55, color = 0xe2d6bd, roof = 0xb5533c) {
  const g = new THREE.Group(), b = box(w, w * 0.62, w * 0.8, M.matte(color)); b.position.y = w * 0.31;
  const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.74, w * 0.38, 4), M.matte(roof)); r.rotation.y = Math.PI / 4; r.position.y = w * 0.81; r.castShadow = true; g.add(b, r); return g;
}
export function block(w = 0.6, h = 0.9, color = 0xcfd3da) {                      // a flat-roofed concrete building
  const g = new THREE.Group(), b = box(w, h, w * 0.9, M.matte(color)); b.position.y = h / 2; g.add(b);
  for (let i = 1; i < Math.round(h / 0.3); i++) { const l = box(w * 1.02, 0.02, w * 0.92, M.matte(0x7b8290)); l.position.y = i * 0.3; g.add(l); }
  return g;
}
export function tree(h = 0.7, color = 0x2f7a43) {                                // a conifer, like a deodar or pine
  const g = new THREE.Group(), tr = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * h, 0.045 * h, h * 0.5, 6), M.matte(0x6b4a2e)); tr.position.y = h * 0.25;
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.2 * h, h * 0.55, 7), M.matte(color)), c2 = new THREE.Mesh(new THREE.ConeGeometry(0.14 * h, h * 0.4, 7), M.matte(color));
  c1.position.y = h * 0.62; c2.position.y = h * 0.88; [tr, c1, c2].forEach((m) => { m.castShadow = true; }); g.add(tr, c1, c2); return g;
}
export function bush(h = 0.22, color = 0x4f9a52) { const g = new THREE.Group(), s = sphere(h, M.matte(color), 10); s.scale.y = 0.75; s.position.y = h * 0.6; g.add(s); return g; }
export function pole(h = 0.7) {
  const g = new THREE.Group(), p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, h, 6), M.matte(0x4a3b2c)), bar = box(0.22, 0.02, 0.02, M.matte(0x4a3b2c));
  p.position.y = h / 2; bar.position.y = h * 0.92; p.castShadow = true; g.add(p, bar); return g;
}
export function person(color = 0xffd35a, h = 0.2) {
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.16, h * 0.5, 4, 8), M.plastic(color)), hd = sphere(h * 0.14, M.plastic(0xe0b48c), 12);
  b.position.y = h * 0.42; hd.position.y = h * 0.88; g.add(b, hd); return g;
}
export function boulder(r = 0.12, color = 0x7b7f88) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat(color)); m.castShadow = true; return m; }
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// An arrow lying in the cut plane: set(x, y, dx, dy, len) in scene units.
export function force(color, r = 0.035, head = 0.2, z = Z1 + 0.62) {
  const a = arrow(color, 1, head, r);
  a.put = (x, y, dx, dy, len) => { a.position.set(x, y, z); a.rotation.z = Math.atan2(-dx, dy); a.set(len); a.tip = [x + dx * len, y + dy * len, z]; };
  return a;
}

// ---------------------------------------------------------------- the hillside
// Draws a section from soil.js. hill.draw(geo, slide) where slide = { surf, d } moves the mass above
// the slip surface d metres downhill (thickness carried along, so the head drops and the toe piles up).
export function makeHill(stage, { n = 250, x1 = 128, river = true } = {}) {
  const root = new THREE.Group(); stage.root.add(root);
  const soilG = new THREE.Group(), weathG = new THREE.Group(); root.add(soilG, weathG);
  const bed = slab(n, Z0, Z1, rockMat(HEX.rock)), weath = slab(n, Z0, Z1, rockMat(HEX.weath));
  const soil = slab(n, Z0, Z1, [rockMat(HEX.soil), rockMat(HEX.soilTop), rockMat(HEX.soil)]);
  const debris = slab(n, Z0, Z1, rockMat(HEX.debris)), scar = slab(n, Z0, Z1, rockMat(HEX.bare));
  const water = ribbon(n, new THREE.MeshBasicMaterial({ color: HEX.water, transparent: true, opacity: 0.42, depthWrite: false }));
  const wline = ribbon(n, M.glow(0x8ed0ff), Z1 + 0.016), slip = ribbon(n, M.glow(HEX.bad), Z1 + 0.02);
  const stream = slab(24, Z0, Z1, waterMat(0.7));
  root.add(bed); weathG.add(weath); soilG.add(soil, debris, scar); root.add(water, wline, slip); if (river) root.add(stream);
  const props = [];
  const hill = {
    root, soilG, weathG, x1, geo: null, slide: null, slip, water, wline,
    top: (x) => 0,
    add(obj, x, z = 0, o = {}) { soilG.add(obj); props.push({ obj, x, z, ...o }); return obj; },
    clearProps() { props.forEach((p) => soilG.remove(p.obj)); props.length = 0; },
    props,
    explode(k) { soilG.position.y = k * 1.5; weathG.position.y = k * 0.7; },
    draw(geo, slide = null, { showWater = true, showSlip = false } = {}) {
      hill.geo = geo; hill.slide = slide;
      const sl = slide && slide.d > 0.01 ? slide : null, s = sl?.surf;
      const inZone = (x) => s && x >= s.xa && x <= s.xb;
      const B = (x) => (inZone(x) ? s.ys(x) : geo.yg(x));
      const t = (x) => (inZone(x) ? Math.max(0, geo.yg(x) - s.ys(x)) : 0);
      const top = sl ? (x) => B(x) + t(x + sl.d) : geo.yg;
      hill.top = top; hill.thick = sl ? (x) => t(x + sl.d) : () => 0; hill.base = B;
      bed.set(0, x1, (x) => Math.min(geo.yr(x), B(x)), () => -9);
      weath.set(0, x1, (x) => Math.min(geo.ysoil(x), B(x)), (x) => Math.min(geo.yr(x), B(x)));
      soil.set(0, x1, (x) => Math.min(geo.yg(x), B(x)), (x) => Math.min(geo.ysoil(x), B(x)));
      debris.visible = scar.visible = !!sl;
      if (sl) { debris.set(Math.max(0, s.xa - sl.d - 2), s.xb, (x) => top(x) + 0.03, B); scar.set(s.xa, s.xb, (x) => B(x) + 0.05, (x) => B(x) - 0.2); }
      water.visible = wline.visible = showWater;
      if (showWater) { const wt = (x) => Math.min(geo.ywt(x), top(x)); water.set(0, x1, wt, (x) => Math.min(geo.yr(x), B(x))); wline.set(0, x1, wt, (x) => wt(x) - 0.35); }
      slip.visible = !!(showSlip && slide?.surf);
      if (slip.visible) { const q = slide.surf; slip.set(q.xa, q.xb, (x) => q.ys(x) + 0.22, (x) => q.ys(x) - 0.22); }
      if (river) stream.set(3.2, 14.8, () => -0.75, (x) => geo.yg(x) - 0.02);
      hill.place();
    },
    place() {
      const sl = hill.slide && hill.slide.d > 0.01 ? hill.slide : null, s = sl?.surf;
      props.forEach((p) => {
        const riding = s && p.x >= s.xa && p.x <= s.xb, x = riding ? p.x - sl.d : p.x, y = hill.top(x);
        const lean = riding ? clamp(sl.d / 14, 0, 1) * (p.lean ?? 0.5) : !riding && sl && hill.thick(p.x) > 0.8 ? 0.9 : 0;
        p.obj.position.set(sx(x), y * U - (lean > 0.85 ? 0.12 : 0), p.z); p.obj.rotation.z = lean * (p.dir ?? 1);
        p.hit = lean > 0;
      });
    },
  };
  return hill;
}

// A block of soil on the slope with its forces drawn to scale. `res` comes from soil.js infinite().
// The weight arrow has a fixed length; every other arrow is drawn in proportion to it.
export function makeForceBlock(stage, root, { L0 = 1.7, pore = false } = {}) {
  const g = new THREE.Group(); root.add(g);
  const body = box(1.0, 0.46, 0.5, rockMat(HEX.soil)), grass = box(1.0, 0.05, 0.5, rockMat(HEX.soilTop)); grass.position.y = 0.255;
  const wet = box(1.01, 0.46, 0.51, new THREE.MeshBasicMaterial({ color: HEX.water, transparent: true, opacity: 0.45, depthWrite: false }));
  const blk = new THREE.Group(); blk.add(body, grass, wet); g.add(blk);
  const a = { W: force(HEX.weight), pull: force(HEX.pull, 0.05, 0.24), press: force(HEX.press, 0.028), fric: force(HEX.grip, 0.05, 0.24), coh: force(HEX.coh, 0.05, 0.2), u: force(HEX.water, 0.045, 0.2) };
  Object.values(a).forEach((x) => g.add(x));
  const l = { W: stage.label('Weight', null, g), pull: stage.label('', null, g, 'hot'), fric: stage.label('', null, g), coh: stage.label('', null, g), u: stage.label('', null, g) };
  l.pull.element.style.setProperty('--c', COL.pull); l.fric.element.style.color = COL.grip; l.coh.element.style.color = COL.coh; l.u.element.style.color = '#8ed0ff';
  const Z = Z1 + 0.62;
  return {
    group: g, labels: l,
    // (x, y) = point on the ground in scene units, beta in degrees, off = how far it has slid (units).
    update(x, y, beta, res, off = 0) {
      const b = beta * D2R, cs = Math.cos(b), sn = Math.sin(b), px = x - cs * off, py = y - sn * off;
      const cx = px - sn * 0.25, cy = py + cs * 0.25;
      blk.position.set(cx, cy, Z); blk.rotation.z = b;
      const k = L0 / res.weight;
      wet.visible = pore && res.u > 0.05; if (wet.visible) { const f = clamp(res.u / Math.max(1e-6, res.sigma) / 0.52, 0.05, 1); wet.scale.y = f; wet.position.y = -0.23 * (1 - f); }
      a.W.put(cx, cy, 0, -1, L0);
      a.pull.put(cx - cs * 0.5, cy - sn * 0.5, -cs, -sn, res.tau * k);
      a.press.put(cx, cy, sn, -cs, res.sigma * k);
      const fx = cx + cs * 0.5 + sn * 0.12, fy = cy + sn * 0.5 - cs * 0.12, fl = res.fric * k, cl = res.coh * k;
      a.fric.put(fx, fy, cs, sn, fl); a.coh.put(fx + cs * fl, fy + sn * fl, cs, sn, cl);
      a.u.visible = pore && res.u > 0.05; l.u.visible = a.u.visible;
      if (a.u.visible) a.u.put(px - cs * 0.25, py - sn * 0.25 + 0.02, -sn, cs, res.u * k + 0.3);
      l.W.position.set(cx + 0.45, cy - L0 + 0.1, Z);
      l.pull.position.set(a.pull.tip[0] - 0.3, a.pull.tip[1] - 0.3, Z); l.pull.element.innerHTML = `Pull <b>${res.tau.toFixed(1)}</b> kPa`;
      l.fric.position.set(fx + cs * fl * 0.5 + 0.25, fy + sn * fl * 0.5 - 0.3, Z); l.fric.element.innerHTML = `Friction <b>${res.fric.toFixed(1)}</b>`;
      l.coh.position.set(a.coh.tip[0] + 0.5, a.coh.tip[1] + 0.2, Z); l.coh.element.innerHTML = `Cohesion <b>${res.coh.toFixed(1)}</b>`; l.coh.visible = res.coh > 0.3;
      if (a.u.visible) { l.u.position.set(a.u.tip[0] - 0.5, a.u.tip[1] + 0.25, Z); l.u.element.innerHTML = `Water pressure <b>${res.u.toFixed(1)}</b>`; }
      l.W.visible = !g.userData.narrow; if (g.userData.narrow) l.coh.visible = l.fric.visible = false; else l.fric.visible = true;
    },
  };
}

// Rain: streaks falling over the hill. set(k) with k from 0 (dry) to 1 (cloudburst).
export function makeRain(root, count = 500, box3 = [-6.4, 6.6, 9, Z0, Z1]) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 6), seed = rng(7);
  const p = Array.from({ length: count }, () => ({ x: seed(), y: seed(), z: seed(), v: 0.7 + seed() * 0.6 }));
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9fd2ff, transparent: true, opacity: 0.7 })); m.frustumCulled = false; root.add(m);
  let t = 0;
  m.step = (dt, k, floorY = () => 0) => {
    t += dt; const nShow = Math.round(count * clamp(k, 0, 1)), [xa, xb, yt, za, zb] = box3;
    geo.setDrawRange(0, nShow * 2); m.visible = nShow > 0;
    for (let i = 0; i < nShow; i++) {
      const q = p[i], x = xa + (xb - xa) * q.x, z = za + (zb - za) * q.z, f = floorY(x), y = yt - (((q.y * (yt + 1) + t * 9 * q.v) % (yt - f + 0.01)));
      pos.set([x, y, z, x - 0.03, y + 0.3, z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}
export function makeCloud(root, pos, s = 1) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 1, transparent: true, opacity: 0.9 });
  [[0, 0, 0, 0.9], [0.9, 0.1, 0.2, 0.7], [-0.9, 0.05, -0.1, 0.65], [0.3, 0.35, -0.2, 0.7], [-0.4, 0.3, 0.3, 0.6]].forEach(([x, y, z, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat); m.position.set(x, y, z); m.scale.y = 0.6; g.add(m); });
  g.position.set(...pos); g.scale.setScalar(s); g.mat = mat; root.add(g); return g;
}

export { THREE, M, box, sphere, clamp, smooth };
