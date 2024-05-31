import * as THREE from "three"; //"./libs/three/three.module.min.js";
import {GLTFLoader} from './libs/three/GLTFLoader.min.js';
import {RoomEnvironment} from "./libs/three/RoomEnvironment.min.js";
// import * as BufferGeometryUtils from "./libs/three/BufferGeometryUtils.min.js";

let ready = false;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(document.documentElement.clientWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// weird stuff that fixes overexposure
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

const fov = 50;

const camera = new THREE.PerspectiveCamera(fov, document.documentElement.clientWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

let logo;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.background = new THREE.Color(0);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0).texture;
const logomaterial = new THREE.MeshStandardMaterial({
    roughness: 0.5, metalness: 1, color: 0xffffff
});
// console.debug(THREE.BackSide);
// scene.background = new THREE.Color(0xD3E8F0);

const loader = new GLTFLoader();
loader.load('./assets/reticivis3.glb', function (gltf) {
    logo = gltf.scene;

    // logo.material = logomaterial;

    logo.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material = logomaterial;
            //         // child.geometry = (child.geometry, 0.001);
            //         // fixDuckingNormals(child);
        }
    });
    // logo.position.x = -1.65;
    // logo.position.y = -.7;
    // console.debug(logo)
    scene.add(logo)
    // scene.add(logo);
    console.debug(logo);
    onWindowResize();
    animate();
}, console.debug, console.error);


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = document.documentElement.clientWidth / window.innerHeight;

    // stolen from https://discourse.threejs.org/t/keeping-an-object-scaled-based-on-the-bounds-of-the-canvas-really-battling-to-explain-this-one/17574/10
    // resizes the logo to scale to the viewport
    if (camera.aspect > 1) {
        // window too large
        camera.fov = fov;
    } else {
        // window too narrow
        const cameraHeight = Math.tan(THREE.MathUtils.degToRad(fov / 2));
        const ratio = camera.aspect;
        const newCameraHeight = cameraHeight / ratio;
        camera.fov = THREE.MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
    }

    // full screen
    renderer.setSize(document.documentElement.clientWidth, window.innerHeight);
    camera.updateProjectionMatrix();
}

function arrayfromfunc(len, func) {
    return Array.from({length: len}, func);
}

const curve = new THREE.CatmullRomCurve3(
    arrayfromfunc(100, () =>
        new THREE.Vector3(randomFloat(-0.4, 0.4), randomFloat(-0.4, 0.4), randomFloat(-0.05, 0.05))
    ),
    true,
    "centripetal",
    0.4
);

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

const start = Date.now();
let last = start;

function animate() {
    // frame delta calculations
    let elapsed = Date.now() - start;
    let delta = Date.now() - last;
    last = Date.now();

    let randvec = curve.getPoint(elapsed / 1000 / 100);
    logo.setRotationFromEuler(new THREE.Euler().setFromVector3(randvec));


    // render
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.body.prepend(renderer.domElement);