import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getColorById } from './data/products.js';

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Parametric height function for CAB Steel Long Span Roofing (8 Ribs)
 * 8 trapezoidal major ribs + dual longitudinal valley stiffening flutes
 */
function longSpanHeight(x, _z) {
  const ribCount = 8;
  const firstRibX = -1.05;
  const lastRibX = 1.05;
  const pitch = (lastRibX - firstRibX) / (ribCount - 1); // 0.30

  const topHalfW = 0.02;
  const baseHalfW = 0.052;
  const ribH = 0.078;

  let y = 0;

  // Check proximity to each of the 8 trapezoidal major ribs
  for (let i = 0; i < ribCount; i++) {
    const cx = firstRibX + i * pitch;
    const dx = Math.abs(x - cx);
    if (dx <= topHalfW) {
      y = Math.max(y, ribH);
    } else if (dx < baseHalfW) {
      const t = 1 - (dx - topHalfW) / (baseHalfW - topHalfW);
      // Crisp roll-formed bend with slight shoulder rounding
      const shaped = smoothstep(0, 1, t) * 0.35 + t * 0.65;
      y = Math.max(y, ribH * shaped);
    }
  }

  // Subtle dual stiffening flutes inside each flat valley between major ribs
  if (y < 0.002 && x > firstRibX && x < lastRibX) {
    const rel = (x - firstRibX) % pitch;
    const valleyCenter = pitch * 0.5;
    const d1 = Math.abs(rel - (valleyCenter - 0.036));
    const d2 = Math.abs(rel - (valleyCenter + 0.036));
    const fluteW = 0.018;
    const fluteH = 0.011;
    if (d1 < fluteW) {
      y += fluteH * Math.cos((d1 / fluteW) * (Math.PI * 0.5));
    } else if (d2 < fluteW) {
      y += fluteH * Math.cos((d2 / fluteW) * (Math.PI * 0.5));
    }
  }

  // Outer side overlap anti-capillary skirts
  if (x < firstRibX - baseHalfW) {
    const ext = (firstRibX - baseHalfW - x) / 0.03;
    y -= Math.min(1, ext) * 0.018;
  } else if (x > lastRibX + baseHalfW) {
    const ext = (x - (lastRibX + baseHalfW)) / 0.03;
    y -= Math.min(1, ext) * 0.018;
  }

  return y;
}

/**
 * Parametric height function for CAB Steel Tile Span Roofing
 * 6 scalloped clay-tile barrel arches across X + 5 stamped horizontal courses along Z
 */
function tileSpanHeight(x, z) {
  const width = 2.24;
  const length = 2.45;
  const barrelCount = 6;
  const courseCount = 5;

  // Normalize x into [0, barrelCount]
  const u = ((x + width * 0.5) / width) * barrelCount;
  const f = Math.max(0, Math.min(0.9999, u - Math.floor(u)));

  // Flat drainage channel in [0..0.14] and [0.86..1.0], rounded barrel arch in [0.14..0.86]
  let waveY = 0;
  const vStart = 0.13;
  const vEnd = 0.87;
  if (f > vStart && f < vEnd) {
    const s = (f - vStart) / (vEnd - vStart);
    waveY = 0.086 * Math.pow(Math.sin(Math.PI * s), 0.82);
  }

  // Longitudinal stamped tile steps along z
  const v = ((z + length * 0.5) / length) * courseCount;
  const courseIdx = Math.min(courseCount - 1, Math.max(0, Math.floor(v)));
  const cf = v - courseIdx; // [0..1] within each tile course

  // Subtle upward ramp along the course followed by a crisp stamped step drop
  const stepRise = 0.034;
  const stepDrop = 0.044;
  let stepOffset = -courseIdx * (stepDrop - stepRise) + cf * stepRise;
  if (cf > 0.88) {
    const dropT = smoothstep(0.88, 0.99, cf);
    stepOffset -= dropT * stepDrop;
  }

  // Center overall slope around y = 0 so the sheet sits level in the studio
  const centerCompensation = ((courseCount - 1) * (stepDrop - stepRise)) * 0.5 - stepRise * 0.35;

  // Front eave drip lip
  let dripLip = 0;
  if (z > length * 0.5 - 0.035) {
    const lipT = smoothstep(length * 0.5 - 0.035, length * 0.5, z);
    dripLip = -lipT * 0.022;
  }

  return waveY + stepOffset + centerCompensation + dripLip;
}

/**
 * Builds a closed, dual-material solid sheet BufferGeometry with:
 * - Material Group 0: Top pre-painted steel finish
 * - Material Group 1: Underside factory primer grey backer coat
 * - Material Group 2: Galvanized/Galfan metallic cut perimeter edges
 */
function buildThickenedSheetGeometry(heightFn, width, length, segsX, segsZ, thickness = 0.011) {
  const cols = segsX + 1;
  const rows = segsZ + 1;
  const gridVertCount = cols * rows;

  const positions = [];
  const normals = [];
  const uvs = [];

  const epsX = width / segsX;
  const epsZ = length / segsZ;

  // Compute surface points and smooth analytical finite-difference normals
  const topPts = new Array(gridVertCount);
  const topNrms = new Array(gridVertCount);

  for (let r = 0; r < rows; r++) {
    const tz = r / segsZ;
    const z = -length * 0.5 + tz * length;
    for (let c = 0; c < cols; c++) {
      const tx = c / segsX;
      const x = -width * 0.5 + tx * width;
      const y = heightFn(x, z);

      const yL = heightFn(x - epsX * 0.5, z);
      const yR = heightFn(x + epsX * 0.5, z);
      const yB = heightFn(x, z - epsZ * 0.5);
      const yF = heightFn(x, z + epsZ * 0.5);

      const dydx = (yR - yL) / epsX;
      const dydz = (yF - yB) / epsZ;

      const nx = -dydx;
      const ny = 1.0;
      const nz = -dydz;
      const len = Math.hypot(nx, ny, nz) || 1;

      const idx = r * cols + c;
      topPts[idx] = [x, y, z];
      topNrms[idx] = [nx / len, ny / len, nz / len];
    }
  }

  // 1. Top vertices (0 .. gridVertCount - 1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const [x, y, z] = topPts[idx];
      const [nx, ny, nz] = topNrms[idx];
      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      uvs.push(c / segsX, r / segsZ);
    }
  }

  // 2. Bottom vertices (gridVertCount .. 2 * gridVertCount - 1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const [x, y, z] = topPts[idx];
      const [nx, ny, nz] = topNrms[idx];
      positions.push(x - nx * thickness * 0.25, y - thickness, z - nz * thickness * 0.25);
      normals.push(-nx, -ny, -nz);
      uvs.push(c / segsX, r / segsZ);
    }
  }

  const indices = [];

  // Group 0: Top painted surface
  const group0Start = 0;
  for (let r = 0; r < segsZ; r++) {
    for (let c = 0; c < segsX; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      indices.push(a, d, b);
      indices.push(b, d, e);
    }
  }
  const group0Count = indices.length - group0Start;

  // Group 1: Bottom primer surface (reversed winding)
  const group1Start = indices.length;
  const botOffset = gridVertCount;
  for (let r = 0; r < segsZ; r++) {
    for (let c = 0; c < segsX; c++) {
      const a = botOffset + r * cols + c;
      const b = a + 1;
      const d = botOffset + (r + 1) * cols + c;
      const e = d + 1;
      indices.push(a, b, d);
      indices.push(b, e, d);
    }
  }
  const group1Count = indices.length - group1Start;

  // Group 2: Perimeter cut edges (front, back, left, right) with flat edge normals
  const group2Start = indices.length;
  let nextVertIdx = positions.length / 3;

  function addEdgeQuad(topA, topB, outNx, outNy, outNz) {
    const [ax, ay, az] = topPts[topA];
    const [bx, by, bz] = topPts[topB];

    positions.push(
      ax, ay, az,
      bx, by, bz,
      ax, ay - thickness, az,
      bx, by - thickness, bz
    );
    for (let k = 0; k < 4; k++) {
      normals.push(outNx, outNy, outNz);
      uvs.push(0, 0);
    }
    const i0 = nextVertIdx;
    indices.push(i0, i0 + 2, i0 + 1);
    indices.push(i0 + 1, i0 + 2, i0 + 3);
    nextVertIdx += 4;
  }

  // Front edge (r = segsZ, outward +Z)
  for (let c = 0; c < segsX; c++) {
    addEdgeQuad(segsZ * cols + c, segsZ * cols + c + 1, 0, 0, 1);
  }
  // Back edge (r = 0, outward -Z)
  for (let c = 0; c < segsX; c++) {
    addEdgeQuad(c + 1, c, 0, 0, -1);
  }
  // Left edge (c = 0, outward -X)
  for (let r = 0; r < segsZ; r++) {
    addEdgeQuad((r + 1) * cols, r * cols, -1, 0, 0);
  }
  // Right edge (c = segsX, outward +X)
  for (let r = 0; r < segsZ; r++) {
    addEdgeQuad(r * cols + segsX, (r + 1) * cols + segsX, 1, 0, 0);
  }

  const group2Count = indices.length - group2Start;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.addGroup(group0Start, group0Count, 0);
  geometry.addGroup(group1Start, group1Count, 1);
  geometry.addGroup(group2Start, group2Count, 2);

  return geometry;
}

/**
 * Creates a soft radial contact shadow texture so the floating 3D roof feels grounded
 */
function createContactShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, 'rgba(24, 24, 24, 0.22)');
  grad.addColorStop(0.55, 'rgba(24, 24, 24, 0.08)');
  grad.addColorStop(1, 'rgba(24, 24, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createRoof3DViewer(container, initialOptions = {}) {
  if (!container) return null;

  const state = {
    profile: initialOptions.profile || 'longspan',
    colorId: initialOptions.colorId || 'red',
    autoRotate: initialOptions.autoRotate !== undefined ? initialOptions.autoRotate : true,
    isInView: true,
    disposed: false,
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    state.autoRotate = false;
  }

  // Scene & Renderer
  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const initW = container.clientWidth || 640;
  const initH = container.clientHeight || 460;
  renderer.setSize(initW, initH);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Studio environment reflections (authentic metallic coil sheen)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();

  // Camera
  const camera = new THREE.PerspectiveCamera(34, initW / initH, 0.1, 50);
  camera.position.set(2.55, 1.55, 2.75);

  // Studio Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8d8d4, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf5, 1.45);
  keyLight.position.set(4, 6, 4.5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xf0f4ff, 0.65);
  rimLight.position.set(-4.5, 2.5, -3.5);
  scene.add(rimLight);

  // Materials
  const initialColorObj = getColorById(state.colorId);
  const currentColor = new THREE.Color(initialColorObj.threeHex);
  const targetColor = new THREE.Color(initialColorObj.threeHex);

  const topPaintMaterial = new THREE.MeshPhysicalMaterial({
    color: currentColor.clone(),
    metalness: 0.36,
    roughness: 0.34,
    clearcoat: 0.42,
    clearcoatRoughness: 0.26,
    envMapIntensity: 0.9,
  });

  // Authentic factory primer grey service back-coat (visible when user rotates underneath!)
  const primerBackMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2c6ca,
    metalness: 0.22,
    roughness: 0.58,
    envMapIntensity: 0.5,
  });

  // Bright Galfan / Zinc-Aluminum metallic cut edge
  const galvanizedEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8dcdf,
    metalness: 0.78,
    roughness: 0.25,
    envMapIntensity: 1.1,
  });

  const sheetMaterials = [topPaintMaterial, primerBackMaterial, galvanizedEdgeMaterial];

  // Pre-build both high-precision geometries so switching tabs is instantaneous
  const geometries = {
    longspan: buildThickenedSheetGeometry(longSpanHeight, 2.26, 2.46, 220, 48, 0.012),
    tilespan: buildThickenedSheetGeometry(tileSpanHeight, 2.24, 2.45, 210, 165, 0.012),
  };

  const roofGroup = new THREE.Group();
  // Slight natural roof pitch tilt so the ribs/steps catch studio highlights immediately
  roofGroup.rotation.x = 0.14;
  scene.add(roofGroup);

  const roofMesh = new THREE.Mesh(geometries[state.profile] || geometries.longspan, sheetMaterials);
  roofGroup.add(roofMesh);

  // Ground contact shadow plane
  const shadowTex = createContactShadowTexture();
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI * 0.5;
  shadowPlane.position.y = -0.52;
  scene.add(shadowPlane);

  // OrbitControls — full 360° orbit (including underside inspection!)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  // Disable wheel zoom so scrolling down the page is never hijacked; provide dedicated zoom buttons
  controls.enableZoom = Boolean(initialOptions.enableWheelZoom);
  controls.minDistance = 2.1;
  controls.maxDistance = 6.2;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI - 0.08;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = 1.1;
  controls.target.set(0, 0, 0);

  // Pause autoRotate momentarily while user actively drags
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    if (state.autoRotate && !prefersReducedMotion) {
      controls.autoRotate = true;
    }
  });

  // Smooth camera preset animation state
  let camAnim = null;
  function animateCameraTo(posVec, targetVec = new THREE.Vector3(0, 0, 0)) {
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
      duration: 550,
    };
  }

  // Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    if (state.disposed) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  resizeObserver.observe(container);

  // IntersectionObserver to pause WebGL loop when scrolled out of viewport
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        state.isInView = entry.isIntersecting;
      });
    },
    { threshold: 0.02 }
  );
  io.observe(container);

  // Animation loop
  let rafId = null;
  function renderLoop(now) {
    if (state.disposed) return;
    rafId = requestAnimationFrame(renderLoop);

    if (!state.isInView) return;

    // Smooth color transition
    if (!currentColor.equals(targetColor)) {
      currentColor.lerp(targetColor, 0.14);
      topPaintMaterial.color.copy(currentColor);
    }

    // Smooth camera preset transition
    if (camAnim) {
      const rawT = Math.min(1, (now - camAnim.startTime) / camAnim.duration);
      // Weighted cubic-bezier(0.22, 1, 0.36, 1) approximation
      const eased = 1 - Math.pow(1 - rawT, 3.4);
      camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, eased);
      controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, eased);
      if (rawT >= 1) camAnim = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(renderLoop);

  return {
    setProfile(profileId) {
      if (!geometries[profileId]) return;
      state.profile = profileId;
      roofMesh.geometry = geometries[profileId];
    },
    setColor(colorId) {
      const col = getColorById(colorId);
      state.colorId = col.id;
      targetColor.setHex(col.threeHex);
      if (prefersReducedMotion) {
        currentColor.copy(targetColor);
        topPaintMaterial.color.copy(currentColor);
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
      const dir = camera.position.clone().sub(controls.target);
      const newLen = Math.max(controls.minDistance, dir.length() * 0.82);
      dir.setLength(newLen);
      animateCameraTo(controls.target.clone().add(dir), controls.target.clone());
    },
    zoomOut() {
      const dir = camera.position.clone().sub(controls.target);
      const newLen = Math.min(controls.maxDistance, dir.length() * 1.22);
      dir.setLength(newLen);
      animateCameraTo(controls.target.clone().add(dir), controls.target.clone());
    },
    setPresetView(preset) {
      if (preset === 'front') {
        // Direct cross-section rib/wave profile view
        animateCameraTo(new THREE.Vector3(0, 0.45, 3.65));
      } else if (preset === 'underside') {
        // Flip underneath to inspect the grey service backer coat & rib underside
        animateCameraTo(new THREE.Vector3(1.85, -1.65, 2.35));
      } else if (preset === 'top') {
        animateCameraTo(new THREE.Vector3(0.01, 3.85, 0.85));
      } else {
        // Default 3/4 isometric studio view
        animateCameraTo(new THREE.Vector3(2.55, 1.55, 2.75));
      }
    },
    resetView() {
      animateCameraTo(new THREE.Vector3(2.55, 1.55, 2.75), new THREE.Vector3(0, 0, 0));
    },
    destroy() {
      state.disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      io.disconnect();
      controls.dispose();
      geometries.longspan.dispose();
      geometries.tilespan.dispose();
      topPaintMaterial.dispose();
      primerBackMaterial.dispose();
      galvanizedEdgeMaterial.dispose();
      shadowTex.dispose();
      envTexture.dispose();
      renderer.dispose();
    },
  };
}

