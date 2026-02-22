import * as THREE from 'three';
import { createShape, SHAPE_LABELS, PRESET_COLORS, type ShapeType } from '../lib/shapes';
import { showToast, canvasToBlob } from '../lib/utils';
import { uploadFile } from '../lib/storage';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animationId: number | null = null;

let currentShape: ShapeType = 'cube';
let currentColor: string = PRESET_COLORS[0];
let placedShapes: THREE.Mesh[] = [];

export function renderAR(container: HTMLElement) {
    container.innerHTML = `
    <div class="ar-container" id="ar-container">
      <canvas id="ar-canvas" class="ar-canvas"></canvas>
      <div class="ar-toolbar" id="ar-toolbar">
        ${(['cube', 'sphere', 'cylinder', 'cone', 'torus'] as ShapeType[]).map(s => `
          <button class="shape-btn ${s === currentShape ? 'active' : ''}" data-shape="${s}">
            <span style="font-size:18px">${SHAPE_LABELS[s]}</span>
            <span>${s}</span>
          </button>
        `).join('')}
        <div style="width:1px;height:32px;background:var(--border-glass);margin:0 4px;"></div>
        <input type="color" id="shape-color" value="${currentColor}" 
               class="color-picker-btn" title="Shape Color" 
               style="cursor:pointer;background:${currentColor};" />
        <button class="shape-btn" id="ar-capture" title="Capture AR Scene">
          <span style="font-size:16px">📸</span>
          <span>snap</span>
        </button>
        <button class="shape-btn" id="ar-clear" title="Clear All Shapes">
          <span style="font-size:16px">🗑</span>
          <span>clear</span>
        </button>
      </div>
    </div>
  `;

    initScene();
    bindEvents();
}

function initScene() {
    const canvas = document.getElementById('ar-canvas') as HTMLCanvasElement;
    const cont = document.getElementById('ar-container') as HTMLElement;
    if (!canvas || !cont) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(cont.clientWidth, cont.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        cont.clientWidth / cont.clientHeight,
        0.01,
        100
    );
    camera.position.set(0, 0.5, 2);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6c5ce7, 0.8, 10);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

    // Ground grid
    const gridHelper = new THREE.GridHelper(4, 20, 0x333366, 0x222244);
    scene.add(gridHelper);

    // Ground plane (invisible, for raycasting)
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x111128,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // Add a default shape to start
    const defaultShape = createShape('cube', currentColor);
    defaultShape.position.set(0, 0.05, 0);
    scene.add(defaultShape);
    placedShapes.push(defaultShape);

    // Try to start WebXR AR if supported
    tryStartWebXR();

    // Start render loop
    animate();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        if (!renderer || !camera || !cont) return;
        const w = cont.clientWidth;
        const h = cont.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(cont);
}

async function tryStartWebXR() {
    const nav = navigator as any;
    if (!nav.xr || !renderer) return;

    try {
        const supported = await nav.xr.isSessionSupported('immersive-ar');
        if (supported) {
            renderer.xr.enabled = true;
            showToast('AR mode available! Tap to place shapes.', 'info');
        }
    } catch {
        // WebXR not available, fallback to 3D scene mode
    }
}

function animate() {
    if (!renderer || !scene || !camera) return;

    // Rotation animation for placed shapes
    placedShapes.forEach((mesh, i) => {
        mesh.rotation.y += 0.005 * (i % 2 === 0 ? 1 : -1);
    });

    // Orbit camera slowly
    const time = Date.now() * 0.0003;
    camera.position.x = Math.sin(time) * 2;
    camera.position.z = Math.cos(time) * 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
}

function bindEvents() {
    // Shape selection
    document.querySelectorAll('.shape-btn[data-shape]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentShape = (btn as HTMLElement).dataset.shape as ShapeType;
            document.querySelectorAll('.shape-btn[data-shape]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Color picker
    document.getElementById('shape-color')?.addEventListener('input', (e) => {
        currentColor = (e.target as HTMLInputElement).value;
    });

    // Click on canvas to place shape
    document.getElementById('ar-canvas')?.addEventListener('click', (e: MouseEvent) => {
        if (!scene || !camera || !renderer) return;

        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const groundObj = scene.children.find((c: THREE.Object3D) => c.name === 'ground');
        if (!groundObj) return;

        const intersects = raycaster.intersectObject(groundObj);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const mesh = createShape(currentShape, currentColor);
            mesh.position.set(point.x, 0.05, point.z);
            scene.add(mesh);
            placedShapes.push(mesh);
            showToast(`${currentShape} placed!`, 'success');
        }
    });

    // Capture screenshot
    document.getElementById('ar-capture')?.addEventListener('click', async () => {
        if (!renderer) return;

        try {
            const canvas = renderer.domElement;
            const blob = await canvasToBlob(canvas, 'image/png', 1.0);
            const fileName = `ar_capture_${Date.now()}.png`;
            showToast('Saving AR capture...', 'info');
            const res = await uploadFile('photos', blob, fileName, 'photo');
            if (res.success) {
                showToast('AR scene saved! ✨', 'success');
            } else {
                showToast(res.error || 'Upload failed', 'error');
            }
        } catch {
            showToast('Capture failed', 'error');
        }
    });

    // Clear shapes
    document.getElementById('ar-clear')?.addEventListener('click', () => {
        if (!scene) return;
        placedShapes.forEach(mesh => {
            scene!.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        placedShapes = [];
        showToast('Shapes cleared', 'info');
    });
}

export function cleanupAR() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (renderer) {
        renderer.dispose();
        renderer = null;
    }
    scene = null;
    camera = null;
    placedShapes = [];
}
