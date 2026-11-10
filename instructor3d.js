// FightQuest 3D — imports diretos para não depender do importmap do navegador.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = new URL("./assets/instructor.glb?v=20261110-male-instructor-2", import.meta.url).href;

function setStatus(host, message) {
  const status = host.querySelector(".fq-3d-status");
  if (status) status.textContent = message;
}

// A compact game-style humanoid for the squat lesson. Each limb is a rigid
// segment joined at explicit world-space points: no skin deformation or
// guessed local knee rotations, so the knees stay aligned with the feet.
function createSquatHumanoid(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const shirt = new THREE.MeshStandardMaterial({ color: 0x25a8b8, roughness: 0.72 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x24334a, roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe5a879, roughness: 0.78 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.65 });
  const jointGeometry = new THREE.SphereGeometry(1, 16, 12);
  const up = new THREE.Vector3(0, 1, 0);
  const parts = {};

  function segment(name, radius, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius, 1, 14), material);
    mesh.castShadow = true;
    group.add(mesh);
    parts[name] = mesh;
    return mesh;
  }
  function joint(name, radius, material) {
    const mesh = new THREE.Mesh(jointGeometry, material);
    mesh.scale.setScalar(radius);
    mesh.castShadow = true;
    group.add(mesh);
    parts[name] = mesh;
    return mesh;
  }
  function between(mesh, a, b) {
    const direction = b.clone().sub(a);
    const length = Math.max(0.001, direction.length());
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, length, 1);
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  }
  function at(mesh, point) { mesh.position.copy(point); }

  segment("torso", 0.17, shirt);
  segment("neck", 0.055, skin);
  joint("head", 0.125, skin);
  joint("hips", 0.16, pants);
  segment("leftThigh", 0.095, pants);
  segment("rightThigh", 0.095, pants);
  segment("leftShin", 0.075, pants);
  segment("rightShin", 0.075, pants);
  segment("leftUpperArm", 0.065, shirt);
  segment("rightUpperArm", 0.065, shirt);
  segment("leftForearm", 0.052, skin);
  segment("rightForearm", 0.052, skin);
  ["leftShoulder","rightShoulder","leftElbow","rightElbow","leftKnee","rightKnee","leftAnkle","rightAnkle","leftHand","rightHand"].forEach((name) => {
    joint(name, name.includes("Knee") ? 0.078 : 0.06, name.includes("Shoulder") ? shirt : skin);
  });
  ["leftFoot","rightFoot"].forEach((name) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.25), shoes);
    mesh.castShadow = true;
    group.add(mesh);
    parts[name] = mesh;
  });

  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (x) => {
    const n = THREE.MathUtils.clamp(x, 0, 1);
    return n * n * (3 - 2 * n);
  };

  function update(elapsed) {
    const cycle = elapsed % 3.2;
    const depth = cycle < 1.15
      ? smooth(cycle / 1.15)
      : cycle < 1.48
        ? 1
        : 1 - smooth((cycle - 1.48) / (3.2 - 1.48));

    const hipY = 0.94 - 0.32 * depth;
    const hipZ = -0.02 - 0.10 * depth;
    const hipL = v(-0.16, hipY, hipZ);
    const hipR = v( 0.16, hipY, hipZ);
    const ankleL = v(-0.16, 0.135, 0.015);
    const ankleR = v( 0.16, 0.135, 0.015);

    // Two-link leg solution with fixed thigh/shin lengths. The bend direction
    // is always forward, never toward the body's centre line.
    function solveKnee(hip, ankle) {
      const dy = ankle.y - hip.y;
      const dz = ankle.z - hip.z;
      const distance = Math.max(0.001, Math.hypot(dy, dz));
      const length = 0.415;
      const along = Math.min(length, (distance * distance) / (2 * distance));
      const height = Math.sqrt(Math.max(0, length * length - along * along));
      const uy = dy / distance;
      const uz = dz / distance;
      return v(
        hip.x,
        hip.y + along * uy + height * uz,
        hip.z + along * uz - height * uy
      );
    }
    const kneeL = solveKnee(hipL, ankleL);
    const kneeR = solveKnee(hipR, ankleR);

    const shoulderY = hipY + 0.46 - 0.035 * depth;
    const shoulderZ = hipZ + 0.045 + 0.105 * depth;
    const shoulderL = v(-0.235, shoulderY, shoulderZ);
    const shoulderR = v( 0.235, shoulderY, shoulderZ);
    const elbowL = v(-0.285, shoulderY - 0.16, shoulderZ + 0.18);
    const elbowR = v( 0.285, shoulderY - 0.16, shoulderZ + 0.18);
    const handL = v(-0.255, shoulderY - 0.27, shoulderZ + 0.36);
    const handR = v( 0.255, shoulderY - 0.27, shoulderZ + 0.36);
    const chest = v(0, shoulderY, shoulderZ - 0.015);
    const head = v(0, shoulderY + 0.20, shoulderZ - 0.015);

    at(parts.hips, v(0, hipY, hipZ));
    between(parts.torso, v(0, hipY + 0.04, hipZ), chest);
    between(parts.neck, v(0, shoulderY - 0.025, shoulderZ), head.clone().add(v(0, -0.075, 0)));
    at(parts.head, head);
    at(parts.leftShoulder, shoulderL); at(parts.rightShoulder, shoulderR);
    at(parts.leftElbow, elbowL); at(parts.rightElbow, elbowR);
    at(parts.leftKnee, kneeL); at(parts.rightKnee, kneeR);
    at(parts.leftAnkle, ankleL); at(parts.rightAnkle, ankleR);
    at(parts.leftHand, handL); at(parts.rightHand, handR);

    between(parts.leftThigh, hipL, kneeL);
    between(parts.rightThigh, hipR, kneeR);
    between(parts.leftShin, kneeL, ankleL);
    between(parts.rightShin, kneeR, ankleR);
    between(parts.leftUpperArm, shoulderL, elbowL);
    between(parts.rightUpperArm, shoulderR, elbowR);
    between(parts.leftForearm, elbowL, handL);
    between(parts.rightForearm, elbowR, handR);

    parts.leftFoot.position.set(-0.16, 0.075, 0.105);
    parts.rightFoot.position.set(0.16, 0.075, 0.105);
  }

  update(0);
  return {
    group,
    update,
    dispose() {
      group.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material?.dispose();
      });
      scene.remove(group);
      jointGeometry.dispose();
      [shirt, pants, skin, shoes].forEach((material) => material.dispose());
    }
  };
}

async function mount(host) {
  if (host.dataset.mounted === "true") return;
  const viewport = host.querySelector(".fq-3d-viewport");
  if (!viewport) return;
  host.dataset.mounted = "true";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1725);
  const camera = new THREE.PerspectiveCamera( thirty(), 1, 0.1, 100);
  camera.position.set(0, 1.35, 3.4);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    host.classList.add("is-error");
    setStatus(host, "Este navegador não conseguiu iniciar o WebGL. Atualize o navegador e tente abrir a demonstração novamente.");
    console.warn("[FightQuest 3D] WebGL indisponível:", error);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  viewport.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xc8e7ff, 0x172131, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x42dfe3, 1.1);
  rim.position.set(-3, 2, -3);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 64),
    new THREE.MeshStandardMaterial({ color: 0x14283a, roughness: 0.82, metalness: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  scene.add(floor);

  let mixer = null;
  let model = null;
  let idleMotion = false;
  let idleBaseY = 0;
  let idleBaseRotation = 0;
  let frame = 0;
  let exerciseBones = [];
  let exerciseType = (host.dataset.motion || "").startsWith("exercise-") ? host.dataset.motion.slice(9) : "";
  let squatRig = null;
  const clock = new THREE.Clock();

  function resize() {
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight || host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  resize();

  try {
    if (exerciseType === "squat") {
      squatRig = createSquatHumanoid(scene);
      host.classList.add("is-ready");
      setStatus(host, "Humanoide 3D carregado · agachamento com joelhos alinhados e pés apoiados.");
    } else {
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDim) || maxDim < 0.2 || maxDim > 10) {
      throw new Error("O arquivo não parece conter um modelo humano em escala válida.");
    }
    const fitScale = 1.65 / size.y;
    model.scale.setScalar(fitScale);
    model.position.set(
      -center.x * fitScale,
      -bounds.min.y * fitScale,
      -center.z * fitScale
    );
    scene.add(model);
    idleBaseY = model.position.y;
    idleBaseRotation = model.rotation.y;
    camera.position.set(0, 1.15, 3.1);
    camera.lookAt(0, 0.85, 0);
    const motionNames = {
      stance: "Idle",
      guard: "Idle",
      step: "Walk",
      rhythm: "Walk",
      mobility: "Idle",
      "motion-stance": "Idle",
      "motion-guard": "Idle",
      "motion-step": "Walk",
      "motion-rhythm": "Walk",
      "motion-mobility": "Idle",
      "exercise-squat": "Squat repetition"
    };
    if (exerciseType) {
      const boneMap = new Map();
      model.traverse(object => { if (object.isBone) boneMap.set(object.name.toLowerCase().replace(/[^a-z0-9]/g, ""), object); });
      const pick = (...names) => names.map(n => boneMap.get(n.toLowerCase().replace(/[^a-z0-9]/g, ""))).find(Boolean);
      const defs = [
        ["hips", ["Hips"]],
        ["spine", ["Spine","Spine1","Spine2"]],
        ["leftThigh", ["LeftUpLeg"]], ["rightThigh", ["RightUpLeg"]],
        ["leftShin", ["LeftLeg"]], ["rightShin", ["RightLeg"]],
        ["leftArm", ["LeftArm"]], ["rightArm", ["RightArm"]],
        ["leftForearm", ["LeftForeArm"]], ["rightForearm", ["RightForeArm"]],
        ["leftFoot", ["LeftFoot"]], ["rightFoot", ["RightFoot"]],
        ["neck", ["Neck"]]
      ];
      exerciseBones = defs.map(([key,names]) => ({key,bone:pick(...names)})).filter(x=>x.bone).map(x=>({key:x.key,bone:x.bone,base:x.bone.rotation.clone()}));
    }
    const requestedName = motionNames[host.dataset.motion] || "Idle";
    idleMotion = requestedName === "Idle";
    const selectedClip = gltf.animations?.find(clip =>
      clip.name.toLowerCase() === requestedName.toLowerCase()
    ) || gltf.animations?.find(clip =>
      clip.name.toLowerCase() === "idle"
    ) || gltf.animations?.[0] || null;

    if (selectedClip) {
      mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(selectedClip).play();
    }
    host.classList.add("is-ready");
    setStatus(host, selectedClip
      ? `Instrutor 3D carregado · movimento: ${selectedClip.name}.`
      : "Modelo humano carregado. As animações ainda não estão disponíveis neste arquivo.");
    }
  } catch (error) {
    const reason = error?.message || String(error) || "Falha desconhecida";
    console.error("[FightQuest 3D] Falha ao carregar/validar o instrutor:", error);
    host.classList.add("is-error");
    setStatus(host, "Falha no instrutor 3D: " + reason + ". Confira a conexão e tente novamente.");
  }

  function animate() {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(delta);
    if (squatRig) squatRig.update(clock.elapsedTime);
    // Animações procedurais de exercício desativadas temporariamente.
    // O rig atual usa eixos locais diferentes dos presumidos; manter a pose neutra
    // evita deslocar pernas e braços incorretamente até validar o esqueleto.
    if (model && idleMotion) {
      const t = clock.elapsedTime;
      model.position.y = idleBaseY + Math.sin(t * 2.1) * 0.012;
      model.rotation.y = idleBaseRotation + Math.sin(t * 0.8) * 0.025;
    }
    renderer.render(scene, camera);
  }
  animate();

  host._fq3dDispose = () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    mixer?.stopAllAction();
    squatRig?.dispose();
    renderer.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    if (model) model.traverse(object => {
      if (object.isMesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material?.dispose();
      }
    });
  };
}

function thirty() { return 32; }
function scan() { document.querySelectorAll(".fq-3d-viewer").forEach(host => mount(host)); }
scan();
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
window.addEventListener("pagehide", () => {
  document.querySelectorAll(".fq-3d-viewer").forEach(host => host._fq3dDispose?.());
}, { once: true });
