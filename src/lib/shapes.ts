import * as THREE from 'three';

export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus';

const DEFAULT_SIZE = 0.1; // 10cm in AR world units

export function createShape(type: ShapeType, color: string = '#6c5ce7'): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (type) {
        case 'cube':
            geometry = new THREE.BoxGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(DEFAULT_SIZE * 0.6, 24, 24);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(DEFAULT_SIZE * 0.4, DEFAULT_SIZE * 0.4, DEFAULT_SIZE, 24);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(DEFAULT_SIZE * 0.5, DEFAULT_SIZE, 24);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(DEFAULT_SIZE * 0.5, DEFAULT_SIZE * 0.15, 16, 32);
            break;
        default:
            geometry = new THREE.BoxGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
    }

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.88,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

export const SHAPE_LABELS: Record<ShapeType, string> = {
    cube: '▣',
    sphere: '●',
    cylinder: '▮',
    cone: '▲',
    torus: '◎',
};

export const PRESET_COLORS = [
    '#6c5ce7', // purple
    '#00b894', // green
    '#ff6b6b', // red
    '#fdcb6e', // yellow  
    '#74b9ff', // blue
    '#e17055', // orange
    '#fd79a8', // pink
    '#00cec9', // teal
];
