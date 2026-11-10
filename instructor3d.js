// FightQuest 3D viewer foundation. The instructor GLB is loaded only after it exists.
let THREE;
let GLTFLoader;
let enginePromise;

async function ensureEngine() {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js")
    ]).then(([threeModule, loaderModule]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
    });
  }
  return enginePromise;
}

const MODEL_URL = "./assets/instructor.glb";
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

function setStatus(host, message) {
  const status = host.querySelector(".fq-3d-status");
  if (status) status.textContent = message;
}

async function mount(host) {
  if (host.dataset.mounted === "true") return;
  host.dataset.mounted = "true";
  const viewport = host.querySelector(".fq-3d-viewport");
  if (!viewport) return;

  try {
    await ensureEngine();
  } catch (error) {
    host.classList.add("is-error");
    setStatus(host, "Não foi possível iniciar o motor 3D. Confira a conexão e recarregue a página.");
    console.error("[FightQuest 3D] Falha ao carregar Three.js:", error);
    return;
  }

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
  let frame = 0;
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
      "motion-mobility": "Idle"
    };
    const requestedName = motionNames[host.dataset.motion] || "Idle";
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
  } catch (error) {
    console.info("[FightQuest 3D] Modelo ainda não disponível:", error.message);
    host.classList.add("is-error");
    setStatus(host, "Não foi possível carregar o modelo 3D. Verifique a conexão e tente recarregar a página.");
  }

  function animate() {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (mixer && !reduceMotion) mixer.update(delta);
    renderer.render(scene, camera);
  }
  animate();

  host._fq3dDispose = () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    mixer?.stopAllAction();
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
