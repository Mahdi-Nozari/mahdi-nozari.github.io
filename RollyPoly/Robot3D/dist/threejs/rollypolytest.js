import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Actuators } from './partNames.js';

const canvas = document.getElementById('threeCanvas');
if (!canvas) {
    console.error('Canvas not found!');
}
console.log('Canvas found:', canvas);
const scene = new THREE.Scene();

const frustumSize = 10;
function updateCamera() {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
}

const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);
scene.add(camera);

updateCamera(); // Set correct aspect at start

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 8);
dirLight.position.set(10, 10, 10);
scene.add(dirLight);

const ambLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.zoomSpeed = 0.5;
canvas.addEventListener('pointerdown', (e) => {
    console.log('Canvas clicked!', e);
});

canvas.addEventListener('wheel', (e) => {
    console.log('Canvas wheel!', e);
});
console.log('Canvas:', document.getElementById('threeCanvas'));
console.log('Canvas size:', canvas.clientWidth, canvas.clientHeight);
console.log('Controls:', controls);
console.log('Controls enabled:', controls.enabled);
console.log('Controls dom element:', controls.domElement);

// Load GLTF model
let box;
let model = null;
let fadingParts = [];
const loader = new GLTFLoader();
loader.setCrossOrigin('anonymous');
const modelUrl = "https://github.com/Mahdi-Nozari/mahdi-nozari.github.io/releases/download/V1.0.0/RobotFullAssembly.glb?raw=true";
loader.load(modelUrl, function(gltf){
    model = gltf.scene;
    model.scale.set(25, 25, 25);
    scene.add(model);
    model.position.set(0, -5, 0);
    console.log(model);
    
    // Find all actuator parts by name
    fadingParts = Actuators.map(name => model.getObjectByName(name)).filter(Boolean);
    console.log(`Found ${fadingParts.length} actuator parts to fade`);

    // Make all meshes glossy
    model.traverse((child) => {
        if (child.isMesh) {
            // Save original material properties
            const origMat = child.material;
            // Convert to MeshStandardMaterial if needed
            if (!(origMat instanceof THREE.MeshStandardMaterial)) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: origMat.color,
                    map: origMat.map,
                    transparent: origMat.transparent,
                    opacity: origMat.opacity,
                    alphaMap: origMat.alphaMap,
                });
            }
            // Always set these for gloss
            child.material.metalness = 0.9;
            child.material.roughness = 0.2;
            child.material.envMapIntensity = 1.0;
            child.material.needsUpdate = true;
        }
    });

    // Compute bounding box and center
    box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Set camera for a horizontal (side) view: from +X axis
    camera.position.set(center.x + 10, center.y+3, center.z); // 10 units to the right
    camera.lookAt(center);

    resize();
}, undefined, function(error){
    console.error(error);
});

// Resize / camera auto-fit
function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);

        if (box) {
            const aspect = width / height;
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const halfHeight = size.y * 0.6;   // margin
            const halfWidth = halfHeight * aspect;

            camera.left = -halfWidth;
            camera.right = halfWidth;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
            camera.updateProjectionMatrix();
            camera.lookAt(center);
        }
    }
}
window.addEventListener('resize', resize);

// Disable browser zoom
window.addEventListener("wheel", function(e){
    if (e.ctrlKey) e.preventDefault();
}, { passive: false });

// Optionally, update camera if the slide size changes (e.g., on window resize or Reveal.js events)
window.addEventListener('resize', () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    updateCamera();
});

// Define camera positions and targets
const startPosition = new THREE.Vector3(5, 5, 5);
const startTarget = new THREE.Vector3(0, 0, 0);
const endPosition = new THREE.Vector3(-5, 8, 10); // Example new angle
const endTarget = new THREE.Vector3(0, 0, 0);

let cameraLerp = false;
let cameraLerpProgress = 0;
const cameraLerpDuration = 60; // frames for smooth transition

// Listen for slide changes
window.Reveal.on('slidechanged', event => {
    if (event.indexh === 1) {
        cameraLerp = true;
        cameraLerpProgress = 0;
    } else {
        // Optionally, return to original view on other slides
        cameraLerp = true;
        cameraLerpProgress = 0;
    }
    
    if (event.indexh === 1 && fadingParts.length > 0) {
        fading = true;
        fadeProgress = 0;
    } else if (fadingParts.length > 0) {
        // Reset fade if you leave the slide
        fading = false;
        fadeProgress = 0;
        fadingParts.forEach(part => {
            part.traverse(obj => {
                if (obj.isMesh && obj.material) {
                    obj.material.opacity = 1;
                    obj.material.transparent = obj.material.opacity < 1;
                    obj.material.needsUpdate = true;
                    obj.visible = true;
                }
            });
        });
    }
});

let fadeProgress = 0;
const fadeDuration = 20; // frames for fade
let fading = false;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Camera interpolation
    // if (cameraLerp && cameraLerpProgress <= cameraLerpDuration) {
    //     let t = cameraLerpProgress / cameraLerpDuration;
    //     let fromPos, toPos, fromTarget, toTarget, flag;
    //     if (window.Reveal.getIndices().h === 1) {
    //         fromPos = startPosition;
    //         toPos = endPosition;
    //         fromTarget = startTarget;
    //         toTarget = endTarget;
    //     } else {
    //         fromPos = endPosition;
    //         toPos = startPosition;
    //         fromTarget = endTarget;
    //         toTarget = startTarget;
    //     }
    //     camera.position.lerpVectors(fromPos, toPos, t);
    //     let target = new THREE.Vector3().lerpVectors(fromTarget, toTarget, t);
    //     camera.lookAt(target);
    //     cameraLerpProgress++;
    // }

    // Always check for model and part before using
    // if (model) {
    //     const partToHide = model.getObjectByName('RollyPoly_v01_PRT_Pump1-1');
    //     if (partToHide) {
    //         // Hide on slide 1, show otherwise
    //         partToHide.visible = window.Reveal.getIndices().h !== 1;
    //     }
    // }

    // Rotate the model if loaded
    if (model) {
        model.rotation.y += 0.01; // Rotate around Y axis
    }

    if (fading && fadingParts.length > 0 && fadeProgress <= fadeDuration) {
        fadingParts.forEach(part => {
            part.traverse(obj => {
                if (obj.isMesh && obj.material) {
                    obj.material.transparent = true;
                    obj.material.opacity = 1 - (fadeProgress / fadeDuration);
                    obj.material.needsUpdate = true;
                    if (obj.material.opacity <= 0) {
                        obj.visible = false;
                    }
                }
            });
        });
        fadeProgress++;
    }

    renderer.render(scene, camera);
}
animate();
