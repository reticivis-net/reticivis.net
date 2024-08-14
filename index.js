import * as THREE from "three"; //"./libs/three/three.module.min.js";
import {GLTFLoader} from './libs/three/GLTFLoader.min.js';
import {RoomEnvironment} from "./libs/three/RoomEnvironment.min.js";
import {MeshLine, MeshLineMaterial, MeshLineRaycast} from "./libs/three/THREE.MeshLine.min.js";
import {Timer} from "./libs/three/Timer.min.js";
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
camera.position.z = 10;

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
let loaded = false;
loader.load('./assets/reticivis.glb', function (gltf) {
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
    // logo.renderOrder = 999;
    logo.onBeforeRender = function (renderer) {
        renderer.clearDepth();
    };
    scene.add(logo)
    // scene.add(logo);
    // console.debug(logo);
    onWindowResize();
    animate();
    loaded = true;
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


const linemin = -3;
const linemax = 10;

const linesgroup = new THREE.Group();
linesgroup.renderOrder = -999;
scene.add(linesgroup);

function loopbetween(min, max, value) {
    let range = max - min;
    return min + (value - min) % range;
}

let timer = new Timer();


class Line {
    position;
    speed;
    length;
    starttime;
    threejsline;

    constructor(restart, excess) {
        // console.debug("new line")
        this.position = new THREE.Vector3(
            randomFloat(-0.4, 0.4),
            randomFloat(-0.4, 0.4),
            restart ? loopbetween(-linemin, linemax, linemax - excess) : randomFloat(linemin, linemax)
        );
        this.speed = randomFloat(2, 5);
        this.length = randomFloat(0.1, 0.5);
        this.starttime = timer.getElapsed();

        // line.setPoints(points);
        let ml = new MeshLine();
        ml.setPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, this.length),
        ], p => 0.001);
        const material = new MeshLineMaterial({color: new THREE.Color(0xffffff)});
        material.depthTest = false;
        material.depthWrite = false;

        this.threejsline = new THREE.Mesh(ml, material);
        // new THREE.Line(
        //     new THREE.BufferGeometry().setFromPoints([
        //         new THREE.Vector3(0, 0, 0),
        //         new THREE.Vector3(0, 0, this.length),
        //     ]),
        //     new THREE.LineBasicMaterial({color: 0xffffff})
        // );
        this.threejsline.position.x = this.position.x;
        this.threejsline.position.y = this.position.y;
        this.threejsline.position.z = this.position.z;
        // console.log(this.threejsline);
        linesgroup.add(this.threejsline);
    }

    animate() {
        let time = (timer.getElapsed() - this.starttime);
        // this.position.add(new THREE.Vector3(0, 0, -this.speed));
        // this.threejsline.geometry.setFromPoints([
        //     new THREE.Vector3(this.position.x, this.position.y, this.position.z - this.speed * time),
        //     new THREE.Vector3(this.position.x, this.position.y, this.position.z + this.length - this.speed * time)
        // ]);
        this.threejsline.position.z = (this.position.z - this.speed * time);
        return linemin - (this.position.z - this.speed * time);
    }

    restart(excess) {
        // console.debug("new line")
        this.position = new THREE.Vector3(
            randomFloat(-0.4, 0.4),
            randomFloat(-0.4, 0.4),
            loopbetween(-linemin, linemax, linemax - excess)
        );
        this.speed = randomFloat(2, 5);
        this.length = randomFloat(0.1, 0.5);
        this.starttime = timer.getElapsed();

        // yeah it reuses line lengths but 1. who the fuck cares and 2. this *lags* when resuming
        // line.setPoints(points);
        // this.threejsline.geometry.setPoints([
        //     new THREE.Vector3(0, 0, 0),
        //     new THREE.Vector3(0, 0, this.length),
        // ], p => 0.001);
        this.threejsline.position.x = this.position.x;
        this.threejsline.position.y = this.position.y;
        this.threejsline.position.z = this.position.z;
    }

    dispose() {
        // console.debug("dispose")
        linesgroup.remove(this.threejsline);
    }
}

let lines = arrayfromfunc(1000, () => new Line(false));
// for (const linesKey of lines) {
//     scene.add(linesKey.threejsline);
// }

let mousepos = {x: 0, y: 0};
let targetmousepos = {x: 0, y: 0};
let visible = true;
let paused = false;
let id;

function frame_independent_lerp_smoothing(a, b, dt) {
    // https://www.youtube.com/watch?v=LSNQuFEDOyQ&t=1776s
    const r = 0.01; // 0-1, lower = faster
    return (a - b) * Math.pow(r, dt) + b;
}

function animate(now) {
    // console.debug("render");
    // render
    if (visible && !paused) {
        id = requestAnimationFrame(animate);
    }

    // frame delta calculations
    // let elapsed = Date.now() - start;
    // let delta = Date.now() - last;
    // render_time += delta;

    timer.update(now);
    let randvec = curve.getPoint(timer.getElapsed() / 100);
    let euler = new THREE.Euler().setFromVector3(randvec);
    const mouseinfluence = 2 * Math.PI / 8; // 45 deg to radians
    euler.x += mousepos.y * mouseinfluence;
    euler.y += mousepos.x * mouseinfluence;
    logo.setRotationFromEuler(euler);

    for (let i = 0; i < lines.length; i++) {
        let dist = lines[i].animate();
        if (dist > 0) {
            lines[i].restart(dist);
            // lines[i].dispose()
            // // console.debug(lines[i]);
            // lines[i] = new Line(true, dist);
            // console.debug(lines[i]);
            // console.debug("-");
            // scene.add(lines[i].threejsline);
        }
    }
    // console.debug(mousepos);
    // ease the logo to face the mouse, eases transition when mouse leaves or comes back
    mousepos.x = frame_independent_lerp_smoothing(mousepos.x, targetmousepos.x, timer.getDelta());
    mousepos.y = frame_independent_lerp_smoothing(mousepos.y, targetmousepos.y, timer.getDelta());
    // console.debug(lines);


    renderer.render(scene, camera);
}



function htmlToNode(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
}
let pa = htmlToNode(`<button id="pauseanimation" type="button" class="btn btn-dark"><img src='assets/pause.svg' class='icon'
                                                                                          alt="⏸️"/> Pause Animation</button>`)
pa.addEventListener("click", () => {
    if (paused) {
        id = requestAnimationFrame(animate);
        pa.innerHTML = "<img src='assets/pause.svg' class='icon' alt='⏸️'/> Pause Animation";
    } else {
        cancelAnimationFrame(id);
        pa.innerHTML = "<img src='assets/play.svg' class='icon' alt='▶️'/> Play Animation";
    }
    paused = !paused;
});
document.body.prepend(pa);
document.body.prepend(renderer.domElement);

// intersection observer to pause animation when not visible
const intersectionObserver = new IntersectionObserver((entries) => {
    // let oldvisible = visible;
    visible = entries[0].intersectionRatio > 0;
    if (!paused && loaded) {
        if (visible) {
            id = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(id);
        }
    }
});
intersectionObserver.observe(renderer.domElement);

function moveevent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    // gets the mouse position in the element, ranging from -1 to 1
    // thanks to copilot for this im tired
    targetmousepos = {
        x: (event.clientX - rect.left) / rect.width * 2 - 1,
        y: (event.clientY - rect.top) / rect.height * 2 - 1
    };
    // console.debug(mousepos);
}

renderer.domElement.addEventListener("pointerenter", moveevent)
renderer.domElement.addEventListener("pointermove", moveevent)

function endevent() {
    targetmousepos = {x: 0, y: 0};
    // console.debug(mousepos);
}

renderer.domElement.addEventListener("pointerout", endevent)