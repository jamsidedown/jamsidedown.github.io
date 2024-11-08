import * as THREE from 'three';
import {TTFLoader} from 'three/addons/loaders/TTFLoader.js';
import {Font} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';

THREE.Cache.enabled = true;

let container;
let camera, cameraTarget, scene, renderer;
let group;
let blackMaterial;
let redMaterial;
let textMeshes = [];

let font = null;

let targetRotationX = 0;
let targetRotationXOnPointerDown = 0;

let targetRotationY = 0;
let targetRotationYOnPointerDown = 0;

let pointerX = 0;
let pointerY = 0;
let pointerXOnPointerDown = 0;
let pointerYOnPointerDown = 0;

let windowHalfX;
let windowHalfY;

let animateRotate = true;

init();

function init() {
  container = document.getElementById('canvas');

  windowHalfX = container.clientWidth / 2;
  windowHalfY = container.clientHeight / 2;

  camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 1, 2000);
  camera.position.set( 0, 200, 1000 );
  cameraTarget = new THREE.Vector3( 0, 0, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  blackMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
  redMaterial = new THREE.MeshBasicMaterial({color: 0xc1393f});

  group = new THREE.Group();
  scene.add(group);

  const loader = new TTFLoader();

  loader.load( 'SourceCodePro-Regular.ttf', async function (json) {
    font = new Font(json);
    await createAllText();
  });

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  container.style.touchAction = 'none';
  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  windowHalfX = container.clientWidth / 2;
  windowHalfY = container.clientHeight / 2;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
}

let textOptions;

function createTextMesh(s, x, y, z, r) {
  if (!textOptions) {
    textOptions = {
      font: font,
      size: 20,
      depth: 1,
      curveSegments: 2,
    };
  }

  const geo = new TextGeometry(s, textOptions);
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const scale = 75;

  x *= scale;
  y *= -scale;
  z *= scale;

  const centreOffset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
  const material = r ? redMaterial : blackMaterial;
  const mesh = new THREE.Mesh(geo, material);

  mesh.position.set(x + centreOffset, y, z);
  mesh.rotation.x = 0;
  mesh.rotation.y = Math.PI * 2;

  return mesh;
}
async function createAllText() {
  const size = 4;
  const response = await fetch('example2.json');
  const {pyramid} = await response.json();

  for (const row of pyramid) {
    const red = row?.r ?? false;
    const mesh = createTextMesh(row.s, row.x, row.y - ((size - 1) / 2), row.z, red);
    textMeshes.push(mesh);
    group.add(mesh);
  }
}

function onPointerDown( event ) {
  if (event.isPrimary === false) return;
  if (event.button !== 0) return;
  animateRotate = false;

  pointerXOnPointerDown = event.clientX - windowHalfX;
  pointerYOnPointerDown = event.clientY - windowHalfY;
  targetRotationXOnPointerDown = targetRotationX;
  targetRotationYOnPointerDown = targetRotationY;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove( event ) {
  if (event.isPrimary === false) return;

  pointerX = event.clientX - windowHalfX;
  pointerY = event.clientY - windowHalfY;

  targetRotationX = targetRotationXOnPointerDown + ( pointerX - pointerXOnPointerDown ) * 0.01;
  targetRotationY = targetRotationYOnPointerDown + (pointerY - pointerYOnPointerDown) * 0.01;
}

function onPointerUp(event) {
  if (event.isPrimary === false) return;
  animateRotate = true;
  document.removeEventListener( 'pointermove', onPointerMove );
  document.removeEventListener( 'pointerup', onPointerUp );
}

function animate() {
  if (animateRotate) {
    group.rotation.y += 0.002;
    targetRotationX = group.rotation.y;
  } else {
    group.rotation.y += (targetRotationX - group.rotation.y) * 0.05;
    group.rotation.x += (targetRotationY - group.rotation.x) * 0.05;
  }

  for (const mesh of textMeshes) {
    mesh.lookAt(camera.position);
  }

  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
}