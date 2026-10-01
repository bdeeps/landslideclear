// LandslideClear's physics, with no 3D in it (so it can be tested on its own).
//
// 1. The infinite-slope model (Skempton & DeLory 1957; any soil mechanics text, e.g. Craig's Soil
//    Mechanics ch. 9). A layer of soil z metres deep (measured vertically) lies on a slope of angle β.
//    On a plane at its base, per square metre of that plane:
//      normal stress  σ = γ z cos²β          shear stress (the pull)  τ = γ z sin β cos β
//      pore pressure  u = γw (m z) cos²β     with water flowing parallel to the slope, m = wet share of z
//      strength (Coulomb 1776, Terzaghi 1925)  s = c′ + (σ − u) tan φ′
//      factor of safety  FS = s ÷ τ
//    An earthquake is added the pseudo-static way: a sideways force of k × weight (Terzaghi 1950).
// 2. The ordinary method of slices (Fellenius 1927, 1936) for a curved slip surface in a real
//    hillside: cut the sliding mass into vertical slices and add up, for each one, the pull
//    W sin α and the grip c′ l + (W cos α − u l) tan φ′. A search over many circles finds the weakest.
//    It is the simplest of the slice methods and reads a little low (safe side) when pore pressure is high.
// 3. A one-bucket model of rain soaking in, and Caine's (1980) rainfall threshold.
//
// Units: metres, kPa (kN/m²), kN/m³, degrees. γ = 19 kN/m³ is a typical moist hill soil (colluvium);
// γw = 9.81 kN/m³ is water.

export const G = 9.81, GAMMA = 19, GAMMA_W = 9.81, D2R = Math.PI / 180;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------- infinite slope
export function infinite({ beta, z = 3, c = 5, phi = 32, m = 0, kh = 0, gamma = GAMMA }) {
  const b = beta * D2R, W = gamma * z;
  const sigma = W * Math.cos(b) ** 2 - kh * W * Math.sin(b) * Math.cos(b);
  const tau = W * Math.sin(b) * Math.cos(b) + kh * W * Math.cos(b) ** 2;
  const u = GAMMA_W * clamp(m, 0, 1) * z * Math.cos(b) ** 2;
  const eff = Math.max(0, sigma - u), fric = eff * Math.tan(phi * D2R), fricDry = sigma * Math.tan(phi * D2R);
  return { sigma, tau, u, eff, fric, fricDry, coh: c, resist: fric + c, FS: (fric + c) / Math.max(1e-6, tau), weight: W * Math.cos(b) };
}
// The steepest angle this soil can stand at (FS = 1), found by bisection.
export function criticalAngle(p) {
  let lo = 1, hi = 89;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (infinite({ ...p, beta: mid }).FS > 1) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
// The wet share of the soil depth at which the slope fails (FS = 1), or null if it never does.
export function criticalM(p) {
  if (infinite({ ...p, m: 1 }).FS >= 1) return null;
  if (infinite({ ...p, m: 0 }).FS <= 1) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (infinite({ ...p, m: mid }).FS > 1) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------- rain
// One bucket: rain soaks in (up to INFIL mm/h; the rest runs off), fills the empty pore space
// (PORE = 12% of the soil's volume is fillable), and drains sideways at DRAIN mm/h when the soil is
// full. The numbers are typical of a sandy-silty hill soil (saturated conductivity of 10⁻⁵ m/s is
// 36 mm/h); real slopes vary by factors of ten either way.
export const INFIL = 40, PORE = 0.12, DRAIN = 6;
export const storeMax = (z) => PORE * z * 1000;                                    // mm of rain to fill it
export const rainStep = (m, I, z, dtH) => clamp(m + ((Math.min(I, INFIL) - DRAIN * m) * dtH) / storeMax(z), 0, 1);
// Hours of steady rain I (mm/h) needed to lift the wet share from 0 to mc. Infinity if it never gets there.
export function hoursToFail(I, mc, z) {
  const mInf = Math.min(I, INFIL) / DRAIN;
  return mInf <= mc ? Infinity : (-storeMax(z) / DRAIN) * Math.log(1 - mc / mInf);
}
// Caine (1980), "The rainfall intensity-duration control of shallow landslides and debris flows":
// the lowest rainfall known to have set off slides, worldwide: I = 14.82 D^-0.39 (I in mm/h, D in
// hours, for 10 minutes to 10 days).
export const caine = (D) => 14.82 * Math.pow(D, -0.39);

// ---------------------------------------------------------------- a hillside in section
// x runs from the valley (left) into the hill (right); y is height above the valley floor.
export const SOIL = { c: 5, phi: 32 };          // loose hill soil (colluvium), kPa and degrees
export const ROCKW = { c: 25, phi: 36 };        // weathered rock under it
export const ROOT_C = 6, ROOT_DEPTH = 3.5;      // tree roots: a few kPa near the surface, fading to nothing by 3.5 m (Wu 1979; Schmidt et al. 2001: about 2 to 12 kPa)
export function makeGeo(p = {}) {
  const o = { beta: 30, H: 46, toeX: 20, T: 10, ts: 3, m: 0.25, under: 0, road: false, quarry: false, terrace: false, ...p };
  const tb = Math.tan(o.beta * D2R), topX = o.toeX + o.H / tb, endX = o.endX ?? topX + 30;
  const valley = (x) => -1.6 * Math.max(0, 1 - ((x - 9) / 6) ** 2);
  const yg0 = (x) => (x <= o.toeX ? valley(x) : x <= topX ? (x - o.toeX) * tb : o.H + (x - topX) * 0.07);
  const xAt = (y) => o.toeX + y / tb;
  const ROAD_Y = o.roadY ?? o.H * 0.56, ROAD_W = 7, QUARRY_Y = o.H * 0.2, QUARRY_W = 12, TERR_Y = o.H * 0.72;
  const cutBench = (x, yb, w, face) => { const x0 = xAt(yb); return x < x0 ? Infinity : x < x0 + w ? yb : yb + (x - x0 - w) * Math.tan(face * D2R); };
  const TERR_STEP = 3.2, TERR_X1 = topX - 3;
  const terr = (x) => {                                                           // cut-and-fill benches: no soil added or taken away overall
    const x0 = xAt(TERR_Y), run = TERR_STEP / tb, k = Math.floor((x - x0) / run), u = x - x0 - k * run, riser = TERR_STEP / Math.tan(72 * D2R);
    return TERR_Y + (k + 0.5) * TERR_STEP + (u < run - riser ? 0 : (u - (run - riser)) * Math.tan(72 * D2R)) - (u < run - riser ? 0 : 0);
  };
  const yg = (x) => {
    let y = yg0(x);
    if (o.under > 0 && x > o.toeX) y = Math.min(y, Math.max(0, (x - o.toeX - o.under) * Math.tan(62 * D2R)));
    if (o.road) y = Math.min(y, cutBench(x, ROAD_Y, ROAD_W, 60));
    if (o.quarry) y = Math.min(y, cutBench(x, QUARRY_Y, QUARRY_W, 68));
    if (o.terrace && x >= xAt(TERR_Y) && x < TERR_X1) y = terr(x);
    return y;
  };
  const thick = (x) => (x <= o.toeX ? 4 : o.T), soilT = (x) => (x <= o.toeX ? 1.5 : o.ts);
  const yr = (x) => Math.min(yg(x), yg0(x) - thick(x));                           // top of sound bedrock
  const ys0 = (x) => Math.min(yg(x), yg0(x) - soilT(x));                          // base of the soil
  const inTerr = (x) => o.terrace && x >= xAt(TERR_Y) - 6 && x < TERR_X1 + 6;
  const ywt = (x) => Math.min(yg(x), Math.max(yr(x) + clamp(o.m - (inTerr(x) ? o.terrDrain ?? 0.2 : 0), 0, 1) * (yg0(x) - yr(x)), Math.min(valley(9) + 1.1, yg(x))));
  return { o, tb, topX, endX, yg0, yg, yr, ysoil: ys0, ywt, xAt, ROAD_Y, ROAD_W, QUARRY_Y, QUARRY_W, TERR_Y, roadX: xAt(ROAD_Y), quarryX: xAt(QUARRY_Y) };
}

// One slip surface: a circle through the ground at xa (toe) and xb (head), sagging `sag` metres below
// the straight line between them, and never cutting into sound bedrock.
export function slipSurface(geo, xa, xb, sag) {
  const ya = geo.yg(xa), yb = geo.yg(xb), ch = Math.hypot(xb - xa, yb - ya), R = (ch * ch) / (8 * sag) + sag / 2;
  const mx = (xa + xb) / 2, my = (ya + yb) / 2, nx = -(yb - ya) / ch, ny = (xb - xa) / ch;    // unit normal pointing up-left
  const xc = mx + nx * (R - sag), yc = my + ny * (R - sag);
  const ys = (x) => { const d = R * R - (x - xc) ** 2; return x < xa || x > xb ? geo.yg(x) : Math.min(geo.yg(x), Math.max(geo.yr(x), d > 0 ? yc - Math.sqrt(d) : yc)); };
  return { xa, xb, sag, xc, yc, R, ys };
}

// Factor of safety of one slip surface. ex = { kh, load: [x0, x1, kPa], roots: (x) => kPa, hold: [{ x0, x1, R }] }.
export function sliceFS(geo, surf, ex = {}, n = 36) {
  const { xa, xb, ys } = surf, dx = (xb - xa) / n, kh = ex.kh || 0;
  let drive = 0, resist = 0, deep = 0, area = 0;
  for (let i = 0; i < n; i++) {
    const x0 = xa + i * dx, x1 = x0 + dx, x = (x0 + x1) / 2, yb0 = ys(x0), yb1 = ys(x1), yb = ys(x), top = geo.yg(x), h = Math.max(0, top - yb);
    const alpha = Math.atan2(yb1 - yb0, dx), l = dx / Math.cos(alpha);
    let W = GAMMA * h * dx; if (ex.load && x > ex.load[0] && x < ex.load[1]) W += ex.load[2] * dx;
    const inSoil = yb >= geo.ysoil(x) - 0.01, mat = inSoil ? SOIL : ROCKW;
    const bg = Math.atan2(geo.ywt(x1) - geo.ywt(x0), dx), u = GAMMA_W * Math.max(0, geo.ywt(x) - yb) * Math.cos(bg) ** 2;
    const c = mat.c + (ex.roots ? ex.roots(x) * Math.max(0, 1 - h / ROOT_DEPTH) : 0);
    const N = Math.max(0, W * Math.cos(alpha) - kh * W * Math.sin(alpha) - u * l);
    resist += c * l + N * Math.tan(mat.phi * D2R);
    drive += W * Math.sin(alpha) + kh * W * Math.cos(alpha);
    deep = Math.max(deep, h); area += h * dx;
  }
  (ex.hold || []).forEach((k) => { if (xa >= k.x0 && xa <= k.x1) resist += k.R; });
  return { FS: drive > 1e-6 ? resist / drive : 99, deep, area, drive, resist };
}

// Try many circles and keep the weakest that is at least `minDeep` metres deep: a coarse sweep of
// toe and head positions and sags, then two finer sweeps around the best one.
export function critical(geo, ex = {}, { minDeep = 2, x0 = 12, x1 = geo.topX + 26, nA = 26, nB = 20 } = {}) {
  let best = { FS: 99 };
  const tryOne = (xa, xb, sag) => {
    if (xa < x0 || xb > x1 || xb - xa < 8 || sag < 0.5) return;
    const surf = slipSurface(geo, xa, xb, sag), r = sliceFS(geo, surf, ex);
    if (r.deep >= minDeep && r.FS < best.FS) best = { ...r, surf };
  };
  for (let i = 0; i < nA; i++) {
    const xa = x0 + ((x1 - x0) * i) / nA;
    for (let j = 1; j <= nB; j++) { const L = 8 + (j / nB) ** 1.6 * (x1 - xa - 8); for (const f of [0.05, 0.09, 0.14, 0.2, 0.28]) tryOne(xa, xa + L, f * L); }
  }
  for (const step of [2.2, 0.8]) {
    if (!best.surf) break;
    const { xa, xb, sag } = best.surf;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const f of [0.75, 1, 1.3]) tryOne(xa + i * step, xb + j * step, sag * f);
  }
  return best;
}

// ---------------------------------------------------------------- how fast landslides move
// Cruden & Varnes (1996) velocity scale, class limits in m/s.
export const YEAR = 365.25 * 86400;
export const VCLASS = [
  { n: 7, name: 'Extremely rapid', min: 5 }, { n: 6, name: 'Very rapid', min: 3 / 60 }, { n: 5, name: 'Rapid', min: 1.8 / 3600 },
  { n: 4, name: 'Moderate', min: 13 / (30 * 86400) }, { n: 3, name: 'Slow', min: 1.6 / YEAR }, { n: 2, name: 'Very slow', min: 0.016 / YEAR }, { n: 1, name: 'Extremely slow', min: 0 },
];
export const vClass = (v) => VCLASS.find((k) => v >= k.min);
export function fmtSpeed(v) {
  if (v >= 1) return `${v.toFixed(v >= 10 ? 0 : 1)} m/s (${Math.round(v * 3.6)} km/h)`;
  if (v * 60 >= 1) return `${(v * 60).toFixed(1)} m a minute`;
  if (v * 3600 >= 1) return `${(v * 3600).toFixed(1)} m an hour`;
  if (v * 86400 >= 1) return `${(v * 86400).toFixed(1)} m a day`;
  if (v * YEAR >= 1) return `${(v * YEAR).toFixed(1)} m a year`;
  return `${Math.round(v * YEAR * 1000)} mm a year`;
}
