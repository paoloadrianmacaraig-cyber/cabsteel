import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getColorById } from './data/products.js';

const DEG = Math.PI / 180;

// Photometrically calibrated 3D paint pigment values matching the official
// CAB Steel prepainted coil photos with authentic satin gloss & specular reflection
// (Crimson Red: #941C22, Royal Blue: #1B4592, Forest Green: #2A623A, Terra Brown: #563728, Slate Gray: #828588)
const CALIBRATED_3D_COLORS = {
  red: 0x941c22,
  green: 0x2a623a,
  brown: 0x563728,
  gray: 0x828588,
  blue: 0x1b4592,
};

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Small symmetric blur along X so crisp roll-formed bends get a realistic fillet radius
 * instead of a mathematically sharp kink.
 */
function filletX(fn, radius) {
  const o = [-1, -0.5, 0, 0.5, 1];
  const w = [1, 2, 3, 2, 1];
  return (x, z) => {
    let s = 0;
    for (let i = 0; i < 5; i++) s += w[i] * fn(x + o[i] * radius, z);
    return s / 9;
  };
}

// ============================================================================
// LONG SPAN ROOFING (8 RIBS)
// Reconstructed from images/longspan-photo.jpg (camera & silhouette solved from photo):
// 8 trapezoidal ribs at a 0.30 pitch, rib height 0.050, crest top 0.070 wide,
// web run 0.043, wide flat pans with longitudinal stiffening bead in the centre.
// ============================================================================
const LONG = {
  pitch: 0.3,
  ribs: 8,
  ribH: 0.05,
  topHalf: 0.035,
  baseHalf: 0.078,
  beadHalf: 0.024,
  beadH: 0.0042,
  length: 0.9531,
};
LONG.firstRib = (-(LONG.ribs - 1) * LONG.pitch) / 2; // -1.05
LONG.halfWidth = -LONG.firstRib + LONG.topHalf; // 1.085

function longSpanRaw(x) {
  const { pitch, firstRib, ribH, topHalf, baseHalf, beadHalf, beadH, ribs } = LONG;
  const k = Math.min(ribs - 1, Math.max(0, Math.round((x - firstRib) / pitch)));
  const s = Math.abs(x - (firstRib + k * pitch));
  if (s <= topHalf) return ribH;
  if (s < baseHalf) return ribH * (1 - (s - topHalf) / (baseHalf - topHalf));
  const db = Math.abs(s - pitch / 2);
  if (db < beadHalf) return beadH * 0.5 * (1 + Math.cos((Math.PI * db) / beadHalf));
  return 0;
}
const longSpanHeight = filletX((x) => longSpanRaw(x), 0.0045);

function longSpanShade(x, z) {
  const { pitch, firstRib, topHalf, baseHalf, ribs } = LONG;
  const k = Math.min(ribs - 1, Math.max(0, Math.round((x - firstRib) / pitch)));
  const cx = firstRib + k * pitch;
  const dx = x - cx;
  const adx = Math.abs(dx);

  let shade = 0.94;
  if (adx <= topHalf) {
    // Flat rib crest with subtle specular shoulder on left edge
    const edgeBoost = Math.exp(-Math.pow((dx + topHalf * 0.82) / 0.007, 2)) * 0.14;
    shade = 1.02 + edgeBoost;
  } else if (adx < baseHalf) {
    const wt = (adx - topHalf) / (baseHalf - topHalf);
    if (dx < 0) {
      // Left sloped web of rib catches the studio key light
      shade = 1.08 + 0.12 * Math.sin(wt * Math.PI);
    } else {
      // Right sloped web of rib in deep crimson shadow
      shade = 0.68 + 0.12 * (x / LONG.halfWidth) * 0.5;
    }
  } else {
    // Valley floor between ribs with subtle stiffening bead highlights
    const rel = x - firstRib;
    const vIdx = Math.min(ribs - 2, Math.max(0, Math.floor(rel / pitch)));
    const vc = firstRib + (vIdx + 0.5) * pitch;
    const dv = x - vc;
    const bead1 = Math.exp(-Math.pow((dv + 0.026) / 0.014, 2)) * 0.05;
    const bead2 = Math.exp(-Math.pow((dv - 0.026) / 0.014, 2)) * 0.05;
    const centerDip = Math.exp(-Math.pow(dv / 0.011, 2)) * 0.06;
    const leftFoot = smoothstep(baseHalf, baseHalf + 0.045, x - (firstRib + vIdx * pitch));
    shade = 0.88 + 0.06 * leftFoot + bead1 + bead2 - centerDip;
  }
  const tz = (z + LONG.length / 2) / LONG.length;
  return shade * (0.97 + 0.06 * (1 - tz));
}

// ============================================================================
// TILE SPAN ROOFING
// Reconstructed from images/tilespan-photo.jpg:
// 5 concave pans (0.44 wide, 0.070 deep, profile exponent 2.4) between 6 narrow ribs,
// sloping outer side flanges, a short back course followed by 5 equal courses,
// each course rising gently toward the eave and ending in a 0.0252 stamped step.
// ============================================================================
const TILE = {
  bay: 0.44,
  bays: 5,
  panDepth: 0.07,
  panHalf: 0.2002,
  panExp: 2.4,
  flangeDrop: 0.009,
  flangeOut: 0.048,
  backCourse: 0.2452,
  course: 0.2218,
  courses: 5,
  stepDrop: 0.0252,
  riser: 0.012,
};
TILE.ribEdge = (TILE.bay * TILE.bays) / 2; // 1.10
TILE.halfWidth = TILE.ribEdge + TILE.flangeOut; // 1.148
TILE.length = TILE.backCourse + TILE.courses * TILE.course; // 1.354
TILE.steps = Array.from({ length: TILE.courses }, (_, k) => TILE.backCourse + k * TILE.course);

function tileCross(x) {
  const ax = Math.abs(x);
  if (ax > TILE.ribEdge) {
    return -TILE.flangeDrop * smoothstep(0.015, TILE.flangeOut, ax - TILE.ribEdge);
  }
  const rel = x + TILE.ribEdge;
  const k = Math.min(TILE.bays - 1, Math.max(0, Math.floor(rel / TILE.bay)));
  const xc = Math.abs(rel - (k + 0.5) * TILE.bay);
  if (xc >= TILE.panHalf) return 0;
  return -TILE.panDepth * (1 - Math.pow(xc / TILE.panHalf, TILE.panExp));
}

function tileCourse(z) {
  const zb = z + TILE.length / 2; // 0 at the back edge, TILE.length at the eave
  const { backCourse, course, stepDrop, riser, steps } = TILE;
  const rise = zb < backCourse ? zb / backCourse : 1 + (zb - backCourse) / course;
  let drops = 0;
  for (let k = 0; k < steps.length; k++) drops += smoothstep(steps[k] - riser / 2, steps[k] + riser / 2, zb);
  return stepDrop * (rise - drops);
}

const tileCrossFilleted = filletX((x) => tileCross(x), 0.004);
function tileSpanHeight(x, z) {
  return tileCrossFilleted(x, z) + tileCourse(z);
}

function tileSpanShade(x, z) {
  const ax = Math.abs(x);
  let crossShade = 1.0;

  if (ax > TILE.ribEdge - (TILE.bay * 0.5 - TILE.panHalf)) {
    crossShade = x < 0 ? 0.68 : 0.74;
  } else {
    const rel = x + TILE.ribEdge;
    const k = Math.min(TILE.bays - 1, Math.max(0, Math.floor(rel / TILE.bay)));
    const signedXc = rel - (k + 0.5) * TILE.bay;
    const xc = Math.abs(signedXc);

    if (xc >= TILE.panHalf - 0.004) {
      // Narrow raised seam rib between bays (deep crimson rib band)
      crossShade = 0.64;
    } else {
      const s = signedXc / TILE.panHalf; // -1..+1 across concave pan
      const leftRim = Math.exp(-Math.pow((s + 0.90) / 0.12, 2)) * 0.14;
      const rightSpec = Math.exp(-Math.pow((s - 0.80) / 0.18, 2)) * 0.30;
      const bowlGrad = 0.98 + 0.05 * s;
      crossShade = bowlGrad + leftRim + rightSpec;
    }
  }

  // Stamped step riser dark crimson shadow bands at each of the 5 steps
  const zb = z + TILE.length / 2;
  let stepShade = 1.0;
  for (let k = 0; k < TILE.steps.length; k++) {
    const dz = zb - TILE.steps[k];
    if (Math.abs(dz) < TILE.riser * 1.35) {
      const u = Math.abs(dz) / (TILE.riser * 1.35);
      const s = 0.58 + 0.42 * (u * u);
      stepShade = Math.min(stepShade, s);
    } else if (dz > 0 && dz < 0.032) {
      const ao = 0.86 + 0.14 * smoothstep(TILE.riser * 1.35, 0.032, dz);
      stepShade = Math.min(stepShade, ao);
    }
  }

  return crossShade * stepShade;
}

/**
 * Builds a closed sheet from a height field sampled on (possibly non-uniform) xs / zs grids,
 * including baked photo-calibrated vertex studio shading (`color` attribute).
 * Group 0: painted top coat, Group 1: underside, Group 2: cut edges.
 */
function buildSheetGeometry(heightFn, shadeFn, xs, zs, thickness = 0.004) {
  const cols = xs.length;
  const rows = zs.length;
  const count = cols * rows;
  const positions = new Float32Array(count * 2 * 3);
  const normals = new Float32Array(count * 2 * 3);
  const colors = new Float32Array(count * 2 * 3);
  const eps = 0.0007;

  for (let r = 0; r < rows; r++) {
    const z = zs[r];
    for (let c = 0; c < cols; c++) {
      const x = xs[c];
      const y = heightFn(x, z);
      const s = shadeFn ? shadeFn(x, z) : 1.0;
      const dydx = (heightFn(x + eps, z) - heightFn(x - eps, z)) / (2 * eps);
      const dydz = (heightFn(x, z + eps) - heightFn(x, z - eps)) / (2 * eps);
      let nx = -dydx;
      let ny = 1;
      let nz = -dydz;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (r * cols + c) * 3;
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
      normals[i] = nx;
      normals[i + 1] = ny;
      normals[i + 2] = nz;
      colors[i] = s;
      colors[i + 1] = s;
      colors[i + 2] = s;

      const j = i + count * 3;
      const bs = Math.min(0.85, s * 0.78);
      positions[j] = x - nx * thickness;
      positions[j + 1] = y - ny * thickness;
      positions[j + 2] = z - nz * thickness;
      normals[j] = -nx;
      normals[j + 1] = -ny;
      normals[j + 2] = -nz;
      colors[j] = bs;
      colors[j + 1] = bs;
      colors[j + 2] = bs;
    }
  }

  const indices = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }
  const topCount = indices.length;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = count + r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }
  const bottomCount = indices.length - topCount;

  // Cut edges as separate vertices with flat outward normals
  const edgePos = [];
  const edgeNrm = [];
  const edgeCol = [];
  const edgeIdx = [];
  const base = count * 2;
  const P = (idx) => [positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]];
  function edgeQuad(tA, tB, n) {
    const v0 = edgePos.length / 3;
    edgePos.push(...P(tA), ...P(tB), ...P(tA + count), ...P(tB + count));
    for (let k = 0; k < 4; k++) {
      edgeNrm.push(n[0], n[1], n[2]);
      edgeCol.push(0.55, 0.55, 0.55);
    }
    edgeIdx.push(base + v0, base + v0 + 2, base + v0 + 1, base + v0 + 1, base + v0 + 2, base + v0 + 3);
  }
  for (let c = 0; c < cols - 1; c++) edgeQuad((rows - 1) * cols + c, (rows - 1) * cols + c + 1, [0, 0, 1]);
  for (let c = 0; c < cols - 1; c++) edgeQuad(c + 1, c, [0, 0, -1]);
  for (let r = 0; r < rows - 1; r++) edgeQuad((r + 1) * cols, r * cols, [-1, 0, 0]);
  for (let r = 0; r < rows - 1; r++) edgeQuad(r * cols + cols - 1, (r + 1) * cols + cols - 1, [1, 0, 0]);

  const allPos = new Float32Array(positions.length + edgePos.length);
  allPos.set(positions);
  allPos.set(edgePos, positions.length);
  const allNrm = new Float32Array(normals.length + edgeNrm.length);
  allNrm.set(normals);
  allNrm.set(edgeNrm, normals.length);
  const allCol = new Float32Array(colors.length + edgeCol.length);
  allCol.set(colors);
  allCol.set(edgeCol, colors.length);
  indices.push(...edgeIdx);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(allPos, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(allNrm, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(allCol, 3));
  geometry.setIndex(indices);
  geometry.addGroup(0, topCount, 0);
  geometry.addGroup(topCount, bottomCount, 1);
  geometry.addGroup(topCount + bottomCount, edgeIdx.length, 2);
  geometry.computeBoundingSphere();
  return geometry;
}

function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

function buildLongSpanGeometry() {
  const xs = linspace(-LONG.halfWidth, LONG.halfWidth, 960);
  const zs = linspace(-LONG.length / 2, LONG.length / 2, 16);
  return buildSheetGeometry(longSpanHeight, longSpanShade, xs, zs);
}

function buildTileSpanGeometry() {
  const xs = linspace(-TILE.halfWidth, TILE.halfWidth, 900);
  const z0 = -TILE.length / 2;
  const set = new Set(linspace(z0, -z0, 230).map((v) => +v.toFixed(5)));
  // Dense rows across every stamped step so the risers stay crisp
  for (const s of TILE.steps) {
    for (const t of linspace(-TILE.riser, TILE.riser, 17)) set.add(+(z0 + s + t).toFixed(5));
  }
  const zs = [...set].filter((v) => v >= z0 && v <= -z0).sort((a, b) => a - b);
  return buildSheetGeometry(tileSpanHeight, tileSpanShade, xs, zs);
}

/**
 * Hero cameras solved from the reference photos (pinhole fit to measured rib, edge and step pixels).
 * photo: source image size, f/cx/cy: intrinsics in photo pixels, alpha: downward pitch.
 */
const HERO = {
  longspan: {
    photoW: 1024,
    photoH: 571,
    f: 673.94,
    cx: 519.5,
    cy: 285.5,
    alpha: 40.7316 * DEG,
    position: new THREE.Vector3(0, 1.2331, 1.58182),
    target: new THREE.Vector3(0, 0.025, 0),
  },
  tilespan: {
    photoW: 1024,
    photoH: 386,
    f: 810.27,
    cx: 513.75,
    cy: 458.92,
    alpha: 53.0865 * DEG,
    position: new THREE.Vector3(0, 1.3596, 2.13751),
    target: new THREE.Vector3(0, -0.03, 0),
  },
};

export function createRoof3DViewer(container, initialOptions = {}) {
  if (!container) return null;

  const state = {
    profile: HERO[initialOptions.profile] ? initialOptions.profile : 'longspan',
    colorId: initialOptions.colorId || 'red',
    autoRotate: Boolean(initialOptions.autoRotate),
    framing: initialOptions.framing || 'fit',
    isInView: true,
    disposed: false,
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) state.autoRotate = false;

  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: Boolean(initialOptions.preserveDrawingBuffer),
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const initW = container.clientWidth || 640;
  const initH = container.clientHeight || 420;
  renderer.setSize(initW, initH);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Soft studio reflections for the glossy roll-coated paint
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.05, 60);

  // Studio lighting calibrated for authentic coil-coated metal roofing with refined satin sheen
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.48);
  keyLight.position.set(-1.8, 4.5, 3.2);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.18);
  fillLight.position.set(3.0, 2.2, 2.5);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.16);
  rimLight.position.set(0, 3.5, -3.2);
  scene.add(rimLight);

  // Materials
  const initialColor = getColorById(state.colorId);
  const initialHex = CALIBRATED_3D_COLORS[initialColor.id] || initialColor.threeHex;
  const currentColor = new THREE.Color(initialHex);
  const targetColor = new THREE.Color(initialHex);

  // Top surface: Commercial pre-painted coil steel with refined satin sheen (less glossy)
  const topPaintMaterial = new THREE.MeshPhysicalMaterial({
    color: currentColor.clone(),
    vertexColors: true,
    metalness: 0.02,
    roughness: 0.34,
    clearcoat: 0.15,
    clearcoatRoughness: 0.32,
    envMap: envTexture,
    envMapIntensity: 0.22,
  });

  // Bottom surface: Commercial PPGI shadow-white / off-white service backer coat (applies to all colors)
  const undersideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xF5F5F3),
    vertexColors: false,
    metalness: 0.02,
    roughness: 0.38,
    envMap: envTexture,
    envMapIntensity: 0.15,
  });

  // Cut sheared edge: Mill-finished galvanized zinc/steel core
  const cutEdgeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xD0D3D6),
    vertexColors: false,
    metalness: 0.25,
    roughness: 0.35,
    envMap: envTexture,
    envMapIntensity: 0.20,
  });
  const sheetMaterials = [topPaintMaterial, undersideMaterial, cutEdgeMaterial];

  function syncMaterialColors(col) {
    topPaintMaterial.color.copy(col);
  }

  const geometries = {};
  function getGeometry(profileId) {
    if (!geometries[profileId]) {
      geometries[profileId] = profileId === 'tilespan' ? buildTileSpanGeometry() : buildLongSpanGeometry();
    }
    return geometries[profileId];
  }

  const roofMesh = new THREE.Mesh(getGeometry(state.profile), sheetMaterials);
  roofMesh.frustumCulled = false;
  scene.add(roofMesh);

  // ---------------------------------------------------------------------------
  // Photo-matched projection: reproduces the exact lens, pitch and framing of the
  // reference photo, letterboxed inside the viewport identically to Sheet Photo view.
  // ---------------------------------------------------------------------------
  let hero = HERO[state.profile];
  let heroDelta = 0;
  const tmpP = new THREE.Matrix4();
  const tmpR = new THREE.Matrix4();

  function computeHeroDelta() {
    const dy = hero.position.y - hero.target.y;
    const dz = hero.position.z - hero.target.z;
    heroDelta = hero.alpha - Math.atan2(dy, dz);
  }

  function applyProjection() {
    const w = container.clientWidth || initW;
    const h = container.clientHeight || initH;
    const { photoW: Wp, photoH: Hp, f, cx, cy } = hero;
    let k;
    if (state.framing === 'photo') {
      k = Math.min(w / Wp, h / Hp);
    } else {
      const pad = window.innerWidth >= 640 ? 24 : 16;
      k = Math.min(1, Math.max(0.05, (w - 2 * pad) / Wp), Math.max(0.05, (h - 2 * pad) / Hp));
    }
    const u0 = Wp / 2 - w / (2 * k);
    const u1 = Wp / 2 + w / (2 * k);
    const v0 = Hp / 2 - h / (2 * k);
    const v1 = Hp / 2 + h / (2 * k);
    const n = camera.near;
    tmpP.makePerspective((n * (u0 - cx)) / f, (n * (u1 - cx)) / f, (n * (cy - v0)) / f, (n * (cy - v1)) / f, n, camera.far);
    tmpR.makeRotationX(heroDelta);
    camera.projectionMatrix.multiplyMatrices(tmpP, tmpR);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  camera.updateProjectionMatrix = applyProjection;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableZoom = Boolean(initialOptions.enableWheelZoom);
  controls.minDistance = 1.0;
  controls.maxDistance = 5.5;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI - 0.05;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = 0.55;

  function snapToHero() {
    hero = HERO[state.profile];
    computeHeroDelta();
    camera.position.copy(hero.position);
    controls.target.copy(hero.target);
    camera.lookAt(hero.target);
    controls.update();
    applyProjection();
  }
  snapToHero();

  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    camAnim = null;
  });
  controls.addEventListener('end', () => {
    if (state.autoRotate && !prefersReducedMotion) controls.autoRotate = true;
  });

  let camAnim = null;
  function animateCameraTo(posVec, targetVec = hero.target) {
    if (prefersReducedMotion) {
      camera.position.copy(posVec);
      controls.target.copy(targetVec);
      controls.update();
      return;
    }
    camAnim = {
      startPos: camera.position.clone(),
      endPos: posVec.clone(),
      startTarget: controls.target.clone(),
      endTarget: targetVec.clone(),
      startTime: performance.now(),
      duration: 480,
    };
  }

  const resizeObserver = new ResizeObserver(() => {
    if (state.disposed) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      renderer.setSize(w, h);
      applyProjection();
    }
  });
  resizeObserver.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        state.isInView = entry.isIntersecting;
      });
    },
    { threshold: 0.02 }
  );
  io.observe(container);

  let rafId = null;
  function renderLoop(now) {
    if (state.disposed) return;
    rafId = requestAnimationFrame(renderLoop);
    if (!state.isInView) return;

    if (!currentColor.equals(targetColor)) {
      currentColor.lerp(targetColor, 0.16);
      if (Math.abs(currentColor.r - targetColor.r) + Math.abs(currentColor.g - targetColor.g) + Math.abs(currentColor.b - targetColor.b) < 0.002) {
        currentColor.copy(targetColor);
      }
      syncMaterialColors(currentColor);
    }

    if (camAnim) {
      const rawT = Math.min(1, (now - camAnim.startTime) / camAnim.duration);
      const eased = 1 - Math.pow(1 - rawT, 3.4);
      camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, eased);
      controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, eased);
      if (rawT >= 1) camAnim = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(renderLoop);

  function dollyBy(factor) {
    const dir = camera.position.clone().sub(controls.target);
    const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, dir.length() * factor));
    dir.setLength(len);
    animateCameraTo(controls.target.clone().add(dir), controls.target.clone());
  }

  return {
    setProfile(profileId) {
      if (!HERO[profileId]) return;
      state.profile = profileId;
      roofMesh.geometry = getGeometry(profileId);
      camAnim = null;
      snapToHero();
    },
    setColor(colorId) {
      const col = getColorById(colorId);
      state.colorId = col.id;
      const hex = CALIBRATED_3D_COLORS[col.id] || col.threeHex;
      targetColor.setHex(hex);
      if (prefersReducedMotion) {
        currentColor.copy(targetColor);
        syncMaterialColors(currentColor);
      }
    },
    setAutoRotate(enabled) {
      state.autoRotate = Boolean(enabled);
      controls.autoRotate = state.autoRotate && !prefersReducedMotion;
      return state.autoRotate;
    },
    getAutoRotate() {
      return state.autoRotate;
    },
    zoomIn() {
      dollyBy(0.84);
    },
    zoomOut() {
      dollyBy(1.2);
    },
    setPresetView(preset) {
      const t = hero.target;
      const dist = hero.position.distanceTo(t);
      if (preset === 'front') {
        animateCameraTo(new THREE.Vector3(t.x, t.y + dist * 0.18, t.z + dist * 0.98));
      } else if (preset === 'underside') {
        animateCameraTo(new THREE.Vector3(t.x + dist * 0.3, t.y - dist * 0.7, t.z + dist * 0.65));
      } else if (preset === 'top') {
        animateCameraTo(new THREE.Vector3(t.x, t.y + dist, t.z + dist * 0.12));
      } else {
        animateCameraTo(hero.position.clone(), hero.target.clone());
      }
    },
    resetView(immediate = false) {
      camAnim = null;
      if (immediate || prefersReducedMotion) {
        snapToHero();
      } else {
        animateCameraTo(hero.position.clone(), hero.target.clone());
      }
    },
    destroy() {
      state.disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      io.disconnect();
      controls.dispose();
      Object.values(geometries).forEach((g) => g.dispose());
      topPaintMaterial.dispose();
      undersideMaterial.dispose();
      cutEdgeMaterial.dispose();
      envTexture.dispose();
      renderer.dispose();
    },
  };
}
