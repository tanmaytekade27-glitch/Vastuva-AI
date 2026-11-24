import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sun, Moon, Eye, Layers, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { DesignStyle, FloorPlanResult, PlacedRoom } from '../types/vastuva';

interface House3DViewerProps {
  plan: FloorPlanResult;
  designStyle: DesignStyle;
}

type CameraPreset = 'perspective' | 'top' | 'front' | 'interior';

const FLOOR_HEIGHT = 10;
const WALL_THICK = 0.55;
const SLAB_THICK = 0.5;

// Pre-allocated scratch vectors to avoid GC pressure during damped transitions
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createProceduralPlasterTexture(baseHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 650; i++) {
    const x = (i * 37) % 128;
    const y = (i * 73) % 128;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(23,43,54,0.05)';
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

function buildCarGroup(isNight: boolean): THREE.Group {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x263b47, roughness: 0.25, metalness: 0.65 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x18252d, roughness: 0.15, metalness: 0.2 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: 0.85, metalness: 0.1 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d1,
    emissive: isNight ? 0xffdfa0 : 0x000000,
    emissiveIntensity: isNight ? 1.8 : 0,
    roughness: 0.2,
  });

  // Primary chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.35, 9.6), bodyMat);
  chassis.position.y = 1.05;
  car.add(chassis);

  // Secondary cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.15, 5.2), cabinMat);
  cabin.position.set(0, 2.25, -0.3);
  car.add(cabin);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.45, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelOffsets: Array<[number, number]> = [
    [-2.55, 2.9],
    [2.55, 2.9],
    [-2.55, -2.9],
    [2.55, -2.9],
  ];
  wheelOffsets.forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(wx, 0.68, wz);
    car.add(wheel);
  });

  // Headlights accent
  [-1.7, 1.7].forEach((hx) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.15), headMat);
    lamp.position.set(hx, 1.15, 4.82);
    car.add(lamp);
  });

  return car;
}

function buildTreeGroup(scale = 1): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c432d, roughness: 0.9, metalness: 0.05 });
  const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x4f6d5a, roughness: 0.78, metalness: 0 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x667c70, roughness: 0.72, metalness: 0 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4.2, 10), trunkMat);
  trunk.position.y = 2.1;
  tree.add(trunk);

  const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), leafMat1);
  canopy1.position.set(0, 4.8, 0);
  tree.add(canopy1);

  const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), leafMat2);
  canopy2.position.set(0.8, 5.8, 0.5);
  tree.add(canopy2);

  tree.scale.setScalar(scale);
  return tree;
}

function buildRoomFurniture(room: PlacedRoom, floorBaseY: number): THREE.Group {
  const g = new THREE.Group();
  const cx = room.x + room.width * 0.5;
  const cz = room.y + room.height * 0.5;
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e34, roughness: 0.55, metalness: 0.08 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0xd9cfc1, roughness: 0.85, metalness: 0 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xc49a60, roughness: 0.3, metalness: 0.6 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.45, metalness: 0.05 });

  if (room.category === 'bedroom' || room.category === 'guest') {
    const bw = Math.min(5.5, room.width * 0.52);
    const bl = Math.min(6.4, room.height * 0.55);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.7, bl), woodMat);
    frame.position.set(cx, floorBaseY + 0.35, cz);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.92, 0.55, bl * 0.9), fabricMat);
    mattress.position.set(cx, floorBaseY + 0.95, cz + 0.1);
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(bw, 2.2, 0.35), woodMat);
    headboard.position.set(cx, floorBaseY + 1.1, cz - bl * 0.5 + 0.15);
    g.add(frame, mattress, headboard);
  } else if (room.category === 'living') {
    const sw = Math.min(6.8, room.width * 0.55);
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.9, 2.4), fabricMat);
    sofaBase.position.set(cx, floorBaseY + 0.45, cz - 1.2);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(sw, 1.4, 0.5), fabricMat);
    sofaBack.position.set(cx, floorBaseY + 1.15, cz - 2.15);
    const table = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.52, 0.8, 1.8), woodMat);
    table.position.set(cx, floorBaseY + 0.4, cz + 1.4);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(sw * 1.05, 0.06, 4.4), accentMat);
    rug.position.set(cx, floorBaseY + 0.04, cz + 0.2);
    g.add(rug, sofaBase, sofaBack, table);
  } else if (room.category === 'kitchen') {
    const kw = Math.min(room.width - 1.4, 7.5);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(kw, 2.6, 2.0), stoneMat);
    counter.position.set(cx, floorBaseY + 1.3, room.y + 1.3);
    const top = new THREE.Mesh(new THREE.BoxGeometry(kw + 0.15, 0.2, 2.15), woodMat);
    top.position.set(cx, floorBaseY + 2.68, room.y + 1.3);
    g.add(counter, top);
  } else if (room.category === 'dining') {
    const tw = Math.min(5.0, room.width * 0.55);
    const td = Math.min(3.4, room.height * 0.45);
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.22, td), woodMat);
    tableTop.position.set(cx, floorBaseY + 2.35, cz);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 2.25, 12), accentMat);
    pedestal.position.set(cx, floorBaseY + 1.12, cz);
    g.add(tableTop, pedestal);
  } else if (room.category === 'pooja') {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.8), stoneMat);
    plinth.position.set(cx, floorBaseY + 0.7, cz);
    const kalash = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 12), accentMat);
    kalash.position.set(cx, floorBaseY + 2.0, cz);
    g.add(plinth, kalash);
  } else if (room.category === 'study') {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4.5, room.width * 0.6), 0.2, 2.0), woodMat);
    desk.position.set(cx, floorBaseY + 2.3, cz);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4.0, room.width * 0.54), 2.2, 1.6), fabricMat);
    legs.position.set(cx, floorBaseY + 1.1, cz);
    g.add(desk, legs);
  }

  return g;
}

export const House3DViewer: React.FC<House3DViewerProps> = ({ plan, designStyle }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>('perspective');
  const [visibleFloor, setVisibleFloor] = useState<'all' | number>('all');
  const [isNight, setIsNight] = useState(false);
  const [showRoof, setShowRoof] = useState(true);
  const [dockExpanded, setDockExpanded] = useState(true);
  const [webglError, setWebglError] = useState(false);

  // Refs to share live Three.js objects without tearing down WebGL on UI clicks
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const houseRootRef = useRef<THREE.Group | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const transitionActiveRef = useRef(false);
  const isSoftwareGlRef = useRef(false);
  const planRef = useRef(plan);
  planRef.current = plan;

  // Initialize WebGLRenderer, Scene, RoomEnvironment, Lights & OrbitControls ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce6ec);
    scene.fog = new THREE.FogExp2(0xdce6ec, 0.0042);
    sceneRef.current = scene;

    // Mandatory studio environment reflection map
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 450);
    camera.position.set(55, 42, 65);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minDistance = 12;
    controls.maxDistance = 170;
    controls.target.set(0, 6, 0);
    controlsRef.current = controls;

    // 3-Point Warm/Cool Architectural Lighting
    const hemi = new THREE.HemisphereLight(0xdbe9f4, 0x7c705d, 0.65);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    const keyLight = new THREE.DirectionalLight(0xffe9c7, 1.4);
    keyLight.position.set(45, 68, 42);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -45;
    keyLight.shadow.camera.right = 45;
    keyLight.shadow.camera.top = 45;
    keyLight.shadow.camera.bottom = -45;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const rimLight = new THREE.DirectionalLight(0xb9d0e0, 0.45);
    rimLight.position.set(-40, 28, -45);
    scene.add(rimLight);

    const houseRoot = new THREE.Group();
    scene.add(houseRoot);
    houseRootRef.current = houseRoot;

    // On-demand coalesced rendering + software WebGL fence sync
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        if (transitionActiveRef.current) {
          if (isSoftwareGl) {
            camera.position.copy(_targetPos);
            controls.target.copy(_targetLook);
            transitionActiveRef.current = false;
          } else {
            const lambda = 6.5;
            camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, lambda, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, lambda, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, lambda, dt);
            controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, lambda, dt);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, lambda, dt);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, lambda, dt);
            if (
              camera.position.distanceTo(_targetPos) < 0.12 &&
              controls.target.distanceTo(_targetLook) < 0.12
            ) {
              transitionActiveRef.current = false;
            } else {
              renderDirty = true;
            }
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    requestRenderRef.current = requestRender;

    const onControlsStart = () => {
      transitionActiveRef.current = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      disposeObject3D(scene);
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  // Build 3D Geometry from the exact 2D FloorPlanResult whenever plan/style/night updates
  useEffect(() => {
    const houseRoot = houseRootRef.current;
    if (!houseRoot) return;

    // Clear previous meshes cleanly
    while (houseRoot.children.length > 0) {
      const child = houseRoot.children[0];
      houseRoot.remove(child);
      disposeObject3D(child);
    }
    floorGroupsRef.current = [];
    roofGroupRef.current = null;

    const halfW = plan.plotWidthFt * 0.5;
    const halfL = plan.plotLengthFt * 0.5;

    // Style-aware architectural finishes
    const styleWallColors: Record<DesignStyle, string> = {
      'Modern Indian': '#EDE1CE',
      Contemporary: '#E1E6E9',
      'Traditional Indian': '#E8D6BC',
      Minimalist: '#F1EFEA',
      'Luxury Villa': '#EAE0CE',
      Scandinavian: '#F0ECE4',
    };
    const wallTex = createProceduralPlasterTexture(styleWallColors[designStyle]);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: wallTex,
      roughness: 0.78,
      metalness: 0.04,
    });
    const innerWallMat = new THREE.MeshStandardMaterial({
      color: 0xf4efe6,
      roughness: 0.82,
      metalness: 0.02,
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xd9d2c7,
      roughness: 0.7,
      metalness: 0.05,
    });
    const accentGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc49a60,
      roughness: 0.3,
      metalness: 0.72,
    });
    const teakMat = new THREE.MeshStandardMaterial({
      color: 0x7c4e29,
      roughness: 0.52,
      metalness: 0.08,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: isNight ? 0xffe4a8 : 0x89b3c4,
      emissive: isNight ? 0xffc66e : 0x000000,
      emissiveIntensity: isNight ? 0.55 : 0,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: isNight ? 0.72 : 0.45,
      depthWrite: false,
    });

    // Extended Horizon Ground & Road Frontage
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x1a2822 : 0x7d927c,
      roughness: 0.95,
      metalness: 0,
    });
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), groundMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.35;
    terrain.receiveShadow = true;
    houseRoot.add(terrain);

    // Plot Plinth Pad
    const plotPad = new THREE.Mesh(
      new THREE.BoxGeometry(plan.plotWidthFt, 0.35, plan.plotLengthFt),
      new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.85 })
    );
    plotPad.position.set(0, -0.175, 0);
    plotPad.receiveShadow = true;
    houseRoot.add(plotPad);

    // Front Road Strip (+Z edge extending across horizon)
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(360, 0.16, 14),
      new THREE.MeshStandardMaterial({ color: 0x343d42, roughness: 0.9 })
    );
    road.position.set(0, -0.25, halfL + 7.2);
    houseRoot.add(road);

    // Subtle road center dashed stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.8 });
    for (let sx = -90; sx <= 90; sx += 14) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(6, 0.04, 0.45), stripeMat);
      stripe.position.set(sx, -0.15, halfL + 7.2);
      houseRoot.add(stripe);
    }

    // Night interior warm lights (bounded <= 3 lights)
    if (isNight) {
      for (let f = 0; f < Math.min(2, plan.floors.length); f++) {
        const pt = new THREE.PointLight(0xffcb7d, 38, 42, 1.5);
        pt.position.set(0, f * FLOOR_HEIGHT + 6.5, 0);
        houseRoot.add(pt);
      }
    }

    // Build Each Floor from exact 2D FloorPlanLayer coordinates
    plan.floors.forEach((layer, fIdx) => {
      const floorGroup = new THREE.Group();
      floorGroup.name = `floor-${fIdx}`;
      const baseY = fIdx * FLOOR_HEIGHT;

      // Building Floor Slab
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(layer.footprintWidth, SLAB_THICK, layer.footprintHeight),
        slabMat
      );
      slab.position.set(
        layer.footprintX + layer.footprintWidth * 0.5 - halfW,
        baseY + SLAB_THICK * 0.5,
        layer.footprintY + layer.footprintHeight * 0.5 - halfL
      );
      slab.receiveShadow = true;
      slab.castShadow = true;
      floorGroup.add(slab);

      const floorTopY = baseY + SLAB_THICK;

      // Rooms: Floor Finish Tiles + Furniture + Staircase + Parking + Garden
      layer.rooms.forEach((room) => {
        const rx = room.x + room.width * 0.5 - halfW;
        const rz = room.y + room.height * 0.5 - halfL;

        if (room.isExteriorZone) {
          if (room.category === 'garden') {
            const lawn = new THREE.Mesh(
              new THREE.BoxGeometry(room.width, 0.14, room.height),
              new THREE.MeshStandardMaterial({ color: 0x5d825f, roughness: 0.9 })
            );
            lawn.position.set(rx, 0.07, rz);
            floorGroup.add(lawn);

            const tree = buildTreeGroup(0.85);
            tree.position.set(rx, 0.14, rz);
            floorGroup.add(tree);
          } else if (room.category === 'parking') {
            const paver = new THREE.Mesh(
              new THREE.BoxGeometry(room.width, 0.12, room.height),
              new THREE.MeshStandardMaterial({ color: 0xb7b3aa, roughness: 0.85 })
            );
            paver.position.set(rx, 0.06, rz);
            floorGroup.add(paver);

            if (room.width >= 7.5 && room.height >= 7) {
              const car = buildCarGroup(isNight);
              car.position.set(rx, 0.12, rz);
              car.scale.setScalar(Math.min(0.82, (room.height - 1.5) / 10));
              floorGroup.add(car);
            }
          } else if (room.category === 'balcony' || room.category === 'terrace') {
            const deck = new THREE.Mesh(
              new THREE.BoxGeometry(room.width, 0.42, room.height),
              slabMat
            );
            deck.position.set(rx, baseY + 0.21, rz);
            floorGroup.add(deck);

            // Glass & Brass Balustrade
            const railH = 3.1;
            const frontRail = new THREE.Mesh(
              new THREE.BoxGeometry(room.width, railH, 0.14),
              glassMat
            );
            frontRail.position.set(rx, baseY + 0.42 + railH * 0.5, rz + room.height * 0.5 - 0.1);
            const topCap = new THREE.Mesh(
              new THREE.BoxGeometry(room.width + 0.2, 0.16, 0.22),
              accentGoldMat
            );
            topCap.position.set(rx, baseY + 0.42 + railH, rz + room.height * 0.5 - 0.1);
            floorGroup.add(frontRail, topCap);
          }
          return;
        }

        // Interior Room Floor Finish (Y offset +0.02 to prevent Z-fighting)
        const tileColor = new THREE.Color(room.color);
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(0.5, room.width - 0.3), 0.04, Math.max(0.5, room.height - 0.3)),
          new THREE.MeshStandardMaterial({
            color: tileColor,
            roughness: room.category === 'living' ? 0.35 : 0.65,
            metalness: 0.04,
          })
        );
        tile.position.set(rx, floorTopY + 0.02, rz);
        tile.receiveShadow = true;
        floorGroup.add(tile);

        // Staircase 3D Steps
        if (room.category === 'staircase') {
          const stepCount = 12;
          const stepRise = FLOOR_HEIGHT / stepCount;
          const stepRun = (room.height - 1.5) / stepCount;
          for (let s = 0; s < stepCount; s++) {
            const step = new THREE.Mesh(
              new THREE.BoxGeometry(room.width * 0.72, stepRise, stepRun + 0.1),
              teakMat
            );
            step.position.set(
              rx,
              floorTopY + (s + 0.5) * stepRise,
              room.y + room.height - 0.75 - (s + 0.5) * stepRun - halfL
            );
            floorGroup.add(step);
          }
        } else if (room.category === 'lift') {
          const shaft = new THREE.Mesh(
            new THREE.BoxGeometry(room.width * 0.85, FLOOR_HEIGHT - SLAB_THICK, room.height * 0.85),
            glassMat
          );
          shaft.position.set(rx, floorTopY + (FLOOR_HEIGHT - SLAB_THICK) * 0.5, rz);
          floorGroup.add(shaft);
        } else {
          // Grounded composite interior furniture mapped to local center
          const furnitureGroup = buildRoomFurniture(
            { ...room, x: room.x - halfW, y: room.y - halfL },
            floorTopY + 0.04
          );
          floorGroup.add(furnitureGroup);
        }

        // Partition & Exterior Walls per room edge (cleanly avoiding double thickness)
        const wallH = FLOOR_HEIGHT - SLAB_THICK;
        const eps = 0.25;
        const isExtTop = Math.abs(room.y - layer.footprintY) < eps;
        const isExtBottom =
          Math.abs(room.y + room.height - (layer.footprintY + layer.footprintHeight)) < eps;
        const isExtLeft = Math.abs(room.x - layer.footprintX) < eps;
        const isExtRight =
          Math.abs(room.x + room.width - (layer.footprintX + layer.footprintWidth)) < eps;

        const buildWallSegment = (
          wallSide: 'top' | 'bottom' | 'left' | 'right',
          isExterior: boolean
        ) => {
          const mat = isExterior ? wallMat : innerWallMat;
          const thick = isExterior ? WALL_THICK : WALL_THICK * 0.65;
          const hasWindow = room.windows.some((w) => w.wall === wallSide);
          const hasDoor = room.doors.some((d) => d.wall === wallSide);

          const isHorizontal = wallSide === 'top' || wallSide === 'bottom';
          const spanLen = isHorizontal ? room.width : room.height;
          const wx = isHorizontal
            ? rx
            : (wallSide === 'left' ? room.x : room.x + room.width) - halfW;
          const wz = !isHorizontal
            ? rz
            : (wallSide === 'top' ? room.y : room.y + room.height) - halfL;

          if (hasWindow && spanLen >= 5) {
            const winW = Math.min(4.5, spanLen * 0.48);
            const sideLen = (spanLen - winW) * 0.5;
            const sillH = 2.8;
            const winH = 4.2;
            const lintelH = wallH - sillH - winH;

            // Sill + Lintel + Left/Right jambs
            const sill = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? winW : thick, sillH, isHorizontal ? thick : winW),
              mat
            );
            sill.position.set(wx, floorTopY + sillH * 0.5, wz);
            floorGroup.add(sill);

            const lintel = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? winW : thick, lintelH, isHorizontal ? thick : winW),
              mat
            );
            lintel.position.set(wx, floorTopY + sillH + winH + lintelH * 0.5, wz);
            floorGroup.add(lintel);

            const pane = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? winW : 0.14, winH, isHorizontal ? 0.14 : winW),
              glassMat
            );
            pane.position.set(wx, floorTopY + sillH + winH * 0.5, wz);
            floorGroup.add(pane);

            // Dark Midnight Bronze Window Frame Trim
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x172b36, roughness: 0.4, metalness: 0.35 });
            const frameTop = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? winW + 0.2 : thick + 0.14, 0.22, isHorizontal ? thick + 0.14 : winW + 0.2),
              frameMat
            );
            frameTop.position.set(wx, floorTopY + sillH + winH, wz);
            const frameBot = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? winW + 0.2 : thick + 0.14, 0.22, isHorizontal ? thick + 0.14 : winW + 0.2),
              frameMat
            );
            frameBot.position.set(wx, floorTopY + sillH, wz);
            floorGroup.add(frameTop, frameBot);

            [-1, 1].forEach((dir) => {
              const jamb = new THREE.Mesh(
                new THREE.BoxGeometry(
                  isHorizontal ? sideLen : thick,
                  wallH,
                  isHorizontal ? thick : sideLen
                ),
                mat
              );
              const offset = dir * (winW * 0.5 + sideLen * 0.5);
              jamb.position.set(
                wx + (isHorizontal ? offset : 0),
                floorTopY + wallH * 0.5,
                wz + (isHorizontal ? 0 : offset)
              );
              jamb.castShadow = true;
              jamb.receiveShadow = true;
              floorGroup.add(jamb);
            });
          } else if (hasDoor && spanLen >= 4) {
            const doorW = 3.0;
            const doorH = 7.2;
            const sideLen = (spanLen - doorW) * 0.5;
            const lintelH = wallH - doorH;

            const lintel = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? doorW : thick, lintelH, isHorizontal ? thick : doorW),
              mat
            );
            lintel.position.set(wx, floorTopY + doorH + lintelH * 0.5, wz);
            floorGroup.add(lintel);

            const doorLeaf = new THREE.Mesh(
              new THREE.BoxGeometry(isHorizontal ? doorW * 0.92 : 0.18, doorH, isHorizontal ? 0.18 : doorW * 0.92),
              teakMat
            );
            doorLeaf.position.set(wx, floorTopY + doorH * 0.5, wz);
            floorGroup.add(doorLeaf);

            [-1, 1].forEach((dir) => {
              const jamb = new THREE.Mesh(
                new THREE.BoxGeometry(
                  isHorizontal ? sideLen : thick,
                  wallH,
                  isHorizontal ? thick : sideLen
                ),
                mat
              );
              const offset = dir * (doorW * 0.5 + sideLen * 0.5);
              jamb.position.set(
                wx + (isHorizontal ? offset : 0),
                floorTopY + wallH * 0.5,
                wz + (isHorizontal ? 0 : offset)
              );
              floorGroup.add(jamb);
            });
          } else {
            const wallMesh = new THREE.Mesh(
              new THREE.BoxGeometry(
                isHorizontal ? spanLen : thick,
                wallH,
                isHorizontal ? thick : spanLen
              ),
              mat
            );
            wallMesh.position.set(wx, floorTopY + wallH * 0.5, wz);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            floorGroup.add(wallMesh);
          }
        };

        // Always build exterior walls; build top & left interior walls so shared partitions don't duplicate
        if (isExtTop || room.y > layer.footprintY + 0.3) buildWallSegment('top', isExtTop);
        if (isExtLeft || room.x > layer.footprintX + 0.3) buildWallSegment('left', isExtLeft);
        if (isExtBottom) buildWallSegment('bottom', true);
        if (isExtRight) buildWallSegment('right', true);
      });

      houseRoot.add(floorGroup);
      floorGroupsRef.current.push(floorGroup);
    });

    // Architectural Roof Group (Flat Modern Parapet + Pergola OR Traditional Pitched Roof)
    const roofGroup = new THREE.Group();
    roofGroup.name = 'roof-group';
    const topY = plan.totalFloors * FLOOR_HEIGHT;
    const roofCX = plan.footprintX + plan.footprintWidth * 0.5 - halfW;
    const roofCZ = plan.footprintY + plan.footprintHeight * 0.5 - halfL;

    const roofSlab = new THREE.Mesh(
      new THREE.BoxGeometry(plan.footprintWidth + 1.4, 0.6, plan.footprintHeight + 1.4),
      slabMat
    );
    roofSlab.position.set(roofCX, topY + 0.3, roofCZ);
    roofSlab.castShadow = true;
    roofGroup.add(roofSlab);

    if (designStyle === 'Traditional Indian') {
      const pitchMat = new THREE.MeshStandardMaterial({
        color: 0xa65336,
        roughness: 0.72,
        metalness: 0.05,
      });
      const coneH = 5.2;
      const radius = Math.max(plan.footprintWidth, plan.footprintHeight) * 0.68;
      const pitched = new THREE.Mesh(new THREE.ConeGeometry(radius, coneH, 4), pitchMat);
      pitched.rotation.y = Math.PI / 4;
      pitched.scale.set(
        plan.footprintWidth / Math.max(plan.footprintWidth, plan.footprintHeight),
        1,
        plan.footprintHeight / Math.max(plan.footprintWidth, plan.footprintHeight)
      );
      pitched.position.set(roofCX, topY + 0.6 + coneH * 0.5, roofCZ);
      roofGroup.add(pitched);
    } else {
      // Parapet border + Teak/Gold pergola overhang
      const parapetH = 2.4;
      const pMat = wallMat;
      const pw = plan.footprintWidth + 1.4;
      const pd = plan.footprintHeight + 1.4;

      const frontP = new THREE.Mesh(new THREE.BoxGeometry(pw, parapetH, 0.45), pMat);
      frontP.position.set(roofCX, topY + 0.6 + parapetH * 0.5, roofCZ + pd * 0.5 - 0.22);
      const backP = new THREE.Mesh(new THREE.BoxGeometry(pw, parapetH, 0.45), pMat);
      backP.position.set(roofCX, topY + 0.6 + parapetH * 0.5, roofCZ - pd * 0.5 + 0.22);
      const leftP = new THREE.Mesh(new THREE.BoxGeometry(0.45, parapetH, pd), pMat);
      leftP.position.set(roofCX - pw * 0.5 + 0.22, topY + 0.6 + parapetH * 0.5, roofCZ);
      const rightP = new THREE.Mesh(new THREE.BoxGeometry(0.45, parapetH, pd), pMat);
      rightP.position.set(roofCX + pw * 0.5 - 0.22, topY + 0.6 + parapetH * 0.5, roofCZ);
      roofGroup.add(frontP, backP, leftP, rightP);

      // Architectural louvered pergola slats
      for (let i = -3; i <= 3; i++) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(pw * 0.45, 0.25, 0.4),
          teakMat
        );
        slat.position.set(roofCX, topY + 2.8, roofCZ + i * 2.1);
        roofGroup.add(slat);
      }
    }

    houseRoot.add(roofGroup);
    roofGroupRef.current = roofGroup;
    requestRenderRef.current();
  }, [plan, designStyle, isNight]);

  // Apply Floor Switching, Roof Visibility, and Day/Night Atmosphere
  useEffect(() => {
    const scene = sceneRef.current;
    const key = keyLightRef.current;
    const hemi = hemiLightRef.current;
    if (scene && key && hemi) {
      if (isNight) {
        scene.background = new THREE.Color(0x0f1e26);
        scene.fog = new THREE.FogExp2(0x0f1e26, 0.0055);
        key.color.setHex(0x88a9c4);
        key.intensity = 0.55;
        hemi.color.setHex(0x3a5266);
        hemi.groundColor.setHex(0x141d21);
        hemi.intensity = 0.42;
      } else {
        scene.background = new THREE.Color(0xdce6ec);
        scene.fog = new THREE.FogExp2(0xdce6ec, 0.0042);
        key.color.setHex(0xffe9c7);
        key.intensity = 1.4;
        hemi.color.setHex(0xdbe9f4);
        hemi.groundColor.setHex(0x7c705d);
        hemi.intensity = 0.65;
      }
    }

    floorGroupsRef.current.forEach((grp, idx) => {
      if (visibleFloor === 'all') {
        grp.visible = true;
      } else {
        grp.visible = idx <= visibleFloor;
      }
    });

    if (roofGroupRef.current) {
      const hideRoofForCutaway =
        visibleFloor !== 'all' && visibleFloor < plan.totalFloors - 1;
      roofGroupRef.current.visible = showRoof && !hideRoofForCutaway && activePreset !== 'interior';
    }

    requestRenderRef.current();
  }, [visibleFloor, showRoof, isNight, activePreset, plan.totalFloors]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    const currentPlan = planRef.current;
    const span = Math.max(currentPlan.plotWidthFt, currentPlan.plotLengthFt);
    const totalH = currentPlan.totalFloors * FLOOR_HEIGHT;

    if (preset === 'perspective') {
      _targetPos.set(span * 1.05, totalH + span * 0.65, span * 1.15);
      _targetLook.set(0, totalH * 0.42, 0);
      setShowRoof(true);
    } else if (preset === 'top') {
      _targetPos.set(0.01, span * 1.45 + totalH, 0.01);
      _targetLook.set(0, 0, 0);
      setShowRoof(false);
    } else if (preset === 'front') {
      _targetPos.set(0, totalH * 0.6 + 6, span * 1.25);
      _targetLook.set(0, totalH * 0.4, 0);
      setShowRoof(true);
    } else if (preset === 'interior') {
      setShowRoof(false);
      _targetPos.set(
        -currentPlan.footprintWidth * 0.15,
        (visibleFloor === 'all' ? 0 : visibleFloor) * FLOOR_HEIGHT + 7.5,
        currentPlan.footprintHeight * 0.35
      );
      _targetLook.set(0, (visibleFloor === 'all' ? 0 : visibleFloor) * FLOOR_HEIGHT + 3.5, -6);
    }

    transitionActiveRef.current = true;
    requestRenderRef.current();
  };

  if (webglError) {
    return (
      <div className="flex h-[520px] flex-col items-center justify-center rounded-xl border border-[#172B36]/15 bg-[#172B36] p-8 text-center text-[#F4EFE6]">
        <Home className="h-12 w-12 text-[#C49A60]" />
        <h3 className="mt-4 font-display text-2xl font-bold">3D Viewport Unavailable</h3>
        <p className="mt-2 max-w-md text-sm text-[#F4EFE6]/75">
          Your browser could not initialize a WebGL context. The 2D architectural floor plan and budget calculator remain fully functional.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-xl border border-[#172B36]/15 bg-[#172B36] sm:h-[600px]">
      {/* Isolated WebGL Mount Container */}
      <div
        ref={mountRef}
        data-testid="house-3d-canvas"
        className="h-full w-full"
        aria-label="Interactive 3D architectural house model"
      />

      {/* Minimal Top-Left Spec Overlay (solid rgba, NO backdrop-blur) */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/15 bg-[#172B36]/90 px-4 py-2.5 text-[#FAF7F2]">
        <p className="text-xs font-semibold text-[#C49A60]">
          3D Architectural Model · {designStyle}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-white/80 tabular-nums">
          {plan.plotWidthFt}′ × {plan.plotLengthFt}′ · {plan.totalFloors} Floor{plan.totalFloors > 1 ? 's' : ''} · Drag to orbit, scroll to zoom
        </p>
      </div>

      {/* Collapsible Ergonomic Bottom Control Dock (Zero Central Occlusion) */}
      <div className="absolute bottom-4 left-1/2 z-10 w-[min(940px,94%)] -translate-x-1/2">
        <div className="mb-1.5 flex justify-center">
          <button
            type="button"
            onClick={() => setDockExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#172B36]/92 px-3.5 py-1 text-[11px] font-semibold text-[#FAF7F2] hover:bg-[#0F1E26]"
          >
            {dockExpanded ? (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-[#C49A60]" />
                Hide Controls
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-[#C49A60]" />
                Show 3D Controls
              </>
            )}
          </button>
        </div>

        {dockExpanded && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#172B36]/92 px-4 py-3 text-xs text-white">
            {/* Camera Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-[#C49A60]">View:</span>
              {(
                [
                  { id: 'perspective', label: '3D Orbit' },
                  { id: 'top', label: 'Top View' },
                  { id: 'front', label: 'Front View' },
                  { id: 'interior', label: 'Interior' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyCameraPreset(preset.id)}
                  className={`min-h-[34px] rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                    activePreset === preset.id
                      ? 'bg-[#C49A60] text-[#172B36]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Floor Switcher */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#C49A60]" />
              <button
                type="button"
                onClick={() => setVisibleFloor('all')}
                className={`min-h-[34px] rounded-md px-2.5 py-1 font-medium whitespace-nowrap ${
                  visibleFloor === 'all'
                    ? 'bg-white text-[#172B36]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All Floors
              </button>
              {plan.floors.map((fl) => (
                <button
                  key={fl.floorIndex}
                  type="button"
                  onClick={() => setVisibleFloor(fl.floorIndex)}
                  className={`min-h-[34px] rounded-md px-2.5 py-1 font-medium whitespace-nowrap ${
                    visibleFloor === fl.floorIndex
                      ? 'bg-white text-[#172B36]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {fl.floorIndex === 0 ? 'Ground' : `F${fl.floorIndex}`}
                </button>
              ))}
            </div>

            {/* Roof & Day/Night Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoof((r) => !r)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 font-medium text-white hover:bg-white/20 whitespace-nowrap"
              >
                <Eye className="h-3.5 w-3.5 text-[#C49A60]" />
                {showRoof ? 'Hide Roof' : 'Show Roof'}
              </button>
              <button
                type="button"
                onClick={() => setIsNight((n) => !n)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 font-medium text-white hover:bg-white/20 whitespace-nowrap"
              >
                {isNight ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-[#C49A60]" />
                    Day Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[#C49A60]" />
                    Night Mode
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
