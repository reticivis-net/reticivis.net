import * as THREE from "./libs/three.module.min.js";
import {GLTFLoader} from './libs/GLTFLoader.js';


const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(document.documentElement.clientWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );
// weird stuff that fixes overexposure
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

const fov = 50;

const camera = new THREE.PerspectiveCamera(fov, document.documentElement.clientWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
const loader = new GLTFLoader();
let fellow;
let ready = false;

const white = "data:image/bmp;base64,Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAADEDgAAxA4AAAAAAAAAAAAA////AA=="
let cube = new THREE.CubeTextureLoader().load([
    white,white,white,white,white,white
]);
scene.background = new THREE.Color(0xD3E8F0);

function applyenvmap() {
    // this'll be called twice so both the fellow and the env map can load at once, on the 2nd call they'll both be
    // loaded and the map will actually be applied
    // if (!envmap || !fellow) return
    fellow.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.envMapIntensity = 2.0;
            child.material.envMap = cube;
            child.material.needsUpdate = true;
        }
    });
    scene.add(fellow)
}

loader.load('./assets/reticivis.glb', function (gltf) {
    fellow = gltf.scene;
    applyenvmap()
    // scene.add(fellow);
    // console.debug(fellow)
}, console.debug, console.error);


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = document.documentElement.clientWidth / window.innerHeight;

    // stolen from https://discourse.threejs.org/t/keeping-an-object-scaled-based-on-the-bounds-of-the-canvas-really-battling-to-explain-this-one/17574/10
    // resizes the fellow to scale to the viewport
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
const start = Date.now();
let last = start;
function animate() {
    // frame delta calculations
    let elapsed = Date.now() - start;
    let delta = Date.now() - last;
    last = Date.now();


    // render
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.body.prepend(renderer.domElement);
animate();