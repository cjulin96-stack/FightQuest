// FightQuest 3D — imports diretos para não depender do importmap do navegador.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = new URL("./assets/instructor.glb?v=20261110-male-instructor-2", import.meta.url).href;
const SQUAT_MODEL_URL = new URL("./assets/quaternius/Regular_Male_FullBody.gltf?v=20261110-rigged-squat", import.meta.url).href;

function setStatus(host, message) {
  const status = host.querySelector(".fq-3d-status");
  if (status) status.textContent = message;
}

// Drive a fully skinned humanoid with a two-link IK squat. The foot bones stay
// planted while the thigh and calf bones follow a forward knee-bend path.
function createSquatRigged(model) {
  const getBone = (name) => model.getObjectByName(name);
  const pelvis = getBone("pelvis");
  const spine1 = getBone("spine_01");
  const spine2 = getBone("spine_02");
  const leftThigh = getBone("thigh_l");
  const rightThigh = getBone("thigh_r");
  const leftCalf = getBone("calf_l");
  const rightCalf = getBone("calf_r");
  const leftFoot = getBone("foot_l");
  const rightFoot = getBone("foot_r");
  const required = [pelvis, leftThigh, rightThigh, leftCalf, rightCalf, leftFoot, rightFoot];
  if (required.some((bone) => !bone)) {
    throw new Error("O esqueleto do instrutor não contém as articulações necessárias para o agachamento.");
  }

  model.updateMatrixWorld(true);
  const worldPosition = (object) => object.getWorldPosition(new THREE.Vector3());
  const worldQuaternion = (object) => object.getWorldQuaternion(new THREE.Quaternion());
  const basePelvisWorld = worldPosition(pelvis);
  const basePelvisLocal = pelvis.position.clone();
  const basePelvisQuaternion = pelvis.quaternion.clone();
  const pelvisParent = pelvis.parent;
  const baseSpine1 = spine1?.quaternion.clone();
  const baseSpine2 = spine2?.quaternion.clone();

  const origin = model.localToWorld(new THREE.Vector3(0, 0, 0));
  const forward = model.localToWorld(new THREE.Vector3(0, 0, 1)).sub(origin).normalize();

  function captureLeg(thigh, calf, foot) {
    const thighPosition = worldPosition(thigh);
    const calfPosition = worldPosition(calf);
    const footPosition = worldPosition(foot);
    return {
      thigh,
      calf,
      foot,
      thighDirection: calfPosition.clone().sub(thighPosition).normalize(),
      calfDirection: footPosition.clone().sub(calfPosition).normalize(),
      thighWorldQuaternion: worldQuaternion(thigh),
      calfWorldQuaternion: worldQuaternion(calf),
      footWorldQuaternion: worldQuaternion(foot),
      thighLocalQuaternion: thigh.quaternion.clone(),
      calfLocalQuaternion: calf.quaternion.clone(),
      footLocalQuaternion: foot.quaternion.clone(),
      footWorldPosition: footPosition,
      upperLength: thighPosition.distanceTo(calfPosition),
      lowerLength: calfPosition.distanceTo(footPosition)
    };
  }

  const legs = [
    captureLeg(leftThigh, leftCalf, leftFoot),
    captureLeg(rightThigh, rightCalf, rightFoot)
  ];

  function smooth(value) {
    const n = THREE.MathUtils.clamp(value, 0, 1);
    return n * n * (3 - 2 * n);
  }

  function solveKnee(hip, ankle, upperLength, lowerLength) {
    const delta = ankle.clone().sub(hip);
    const rawDistance = delta.length();
    const minDistance = Math.abs(upperLength - lowerLength) + 0.0001;
    const maxDistance = upperLength + lowerLength - 0.0001;
    const distance = THREE.MathUtils.clamp(rawDistance, minDistance, maxDistance);
    const direction = delta.normalize();
    const along = (upperLength * upperLength - lowerLength * lowerLength + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
    const bendDirection = forward.clone().addScaledVector(direction, -forward.dot(direction));
    if (bendDirection.lengthSq() < 0.000001) bendDirection.set(0, 0, 1);
    bendDirection.normalize();
    return hip.clone().addScaledVector(direction, along).addScaledVector(bendDirection, height);
  }

  function setWorldQuaternion(bone, targetWorldQuaternion) {
    const parentWorld = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    bone.quaternion.copy(parentWorld.multiply(targetWorldQuaternion.clone()));
    bone.updateMatrix();
  }

  function aimBone(bone, restDirection, restWorldQuaternion, targetDirection) {
    const delta = new THREE.Quaternion().setFromUnitVectors(
      restDirection,
      targetDirection.clone().normalize()
    );
    const targetWorldQuaternion = delta.multiply(restWorldQuaternion.clone());
    setWorldQuaternion(bone, targetWorldQuaternion);
  }

  function update(elapsed) {
    const cycle = elapsed % 3.4;
    const depth = cycle < 1.2
      ? smooth(cycle / 1.2)
      : cycle < 1.55
        ? 1
        : 1 - smooth((cycle - 1.55) / (3.4 - 1.55));

    pelvis.quaternion.copy(basePelvisQuaternion);
    const legLength = legs[0].upperLength + legs[0].lowerLength;
    const targetPelvisWorld = basePelvisWorld.clone().add(new THREE.Vector3(
      0,
      -legLength * 0.22 * depth,
      -legLength * 0.08 * depth
    ));
    pelvis.position.copy(pelvisParent.worldToLocal(targetPelvisWorld.clone()));

    if (spine1 && baseSpine1) {
      spine1.quaternion.copy(baseSpine1).multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.09 * depth)
      );
    }
    if (spine2 && baseSpine2) {
      spine2.quaternion.copy(baseSpine2).multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.035 * depth)
      );
    }

    model.updateMatrixWorld(true);
    for (const leg of legs) {
      const hip = worldPosition(leg.thigh);
      const ankle = leg.footWorldPosition.clone();
      const knee = solveKnee(hip, ankle, leg.upperLength, leg.lowerLength);

      aimBone(leg.thigh, leg.thighDirection, leg.thighWorldQuaternion, knee.clone().sub(hip));
      model.updateMatrixWorld(true);

      aimBone(leg.calf, leg.calfDirection, leg.calfWorldQuaternion, ankle.clone().sub(knee));
      model.updateMatrixWorld(true);

      setWorldQuaternion(leg.foot, leg.footWorldQuaternion);
      model.updateMatrixWorld(true);
    }
  }

  function dispose() {
    pelvis.position.copy(basePelvisLocal);
    pelvis.quaternion.copy(basePelvisQuaternion);
    if (spine1 && baseSpine1) spine1.quaternion.copy(baseSpine1);
    if (spine2 && baseSpine2) spine2.quaternion.copy(baseSpine2);
    for (const leg of legs) {
      leg.thigh.quaternion.copy(leg.thighLocalQuaternion);
      leg.calf.quaternion.copy(leg.calfLocalQuaternion);
      leg.foot.quaternion.copy(leg.footLocalQuaternion);
    }
    model.updateMatrixWorld(true);
  }

  update(0);
  return { update, dispose };
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
      const gltf = await new GLTFLoader().loadAsync(SQUAT_MODEL_URL);
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y < 0.5 || size.y > 5) {
        throw new Error("O modelo humano não passou na validação de escala.");
      }
      const fitScale = 1.65 / size.y;
      model.scale.setScalar(fitScale);
      model.position.set(
        -center.x * fitScale,
        -bounds.min.y * fitScale,
        -center.z * fitScale
      );
      scene.add(model);
      model.updateMatrixWorld(true);
      squatRig = createSquatRigged(model);
      camera.position.set(0, 1.2, 3.35);
      camera.lookAt(0, 0.83, 0);
      host.classList.add("is-ready");
      setStatus(host, "Instrutor 3D carregado · agachamento com joelhos flexionando e pés apoiados.");
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
