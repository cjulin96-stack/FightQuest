import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js";

/*
 FightQuest 2.1
 Real skinned humanoid GLB (MakeHuman / MPFB2, CC0) instead of the old
 capsule-and-sphere character. The source model is fully clothed.
 The bundled GLB includes idle/walk/run/wave clips; selected strength
 motions use restrained skeletal pose cycles on its real 53-bone rig.
*/
const MODEL_URL="https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/suited.glb";
const stages=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function makeStage(host){
  if(stages.has(host)) return;
  const w=Math.max(220,host.clientWidth||300),h=Math.max(280,host.clientHeight||340);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x080d16);
  const camera=new THREE.PerspectiveCamera(34,w/h,.1,100);
  camera.position.set(0,1.15,4.5);camera.lookAt(0,1.02,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
  renderer.setSize(w,h);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.querySelector(".fq3d-loading")?.remove();
  host.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xc9dcff,0x14101b,2.0));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(2.5,5,4);key.castShadow=true;scene.add(key);
  const rim=new THREE.PointLight(0xff294d,20,8);rim.position.set(-2,2.3,-1);scene.add(rim);
  const fill=new THREE.PointLight(0x29d9df,8,7);fill.position.set(2,1.3,3);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2.1,56),new THREE.MeshStandardMaterial({color:0x101827,roughness:.85,metalness:.08}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.012,8,72),new THREE.MeshBasicMaterial({color:0xe52c4c}));
  ring.rotation.x=Math.PI/2;ring.position.y=-.015;ring.scale.set(1,.72,1);scene.add(ring);

  const characterRoot=new THREE.Group();scene.add(characterRoot);
  const state={host,scene,camera,renderer,characterRoot,ring,raf:0,angle:0,motion:host.dataset.motion||"motion-stance",ready:false,mixer:null,actions:[],bones:new Map(),base:new Map(),last:0};
  stages.set(host,state);

  const resize=()=>{const nw=Math.max(220,host.clientWidth),nh=Math.max(280,host.clientHeight);camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh);};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);state.resizeObserver=resizeObserver;

  const loader=new GLTFLoader();
  loader.load(MODEL_URL,gltf=>{
    if(!host.isConnected)return;
    const model=gltf.scene;
    const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3(),center=new THREE.Vector3();
    box.getSize(size);box.getCenter(center);
    const scale=2.02/Math.max(size.y,0.01);
    model.scale.setScalar(scale);
    model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    // Character orientation is handled by characterRoot below; avoid double rotation.
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(.55,o.material.roughness??.7);}}});
    characterRoot.add(model);
    model.traverse(o=>{if(o.isBone){const n=o.name.toLowerCase();state.bones.set(n,o);state.base.set(n,o.quaternion.clone());}});
    state.mixer=new THREE.AnimationMixer(model);
    const clip=(name)=>gltf.animations.find(c=>c.name.toLowerCase().includes(name));
    const idle=clip("idle"),walk=clip("walk");
    if(idle){const a=state.mixer.clipAction(idle);a.play();state.actions.push(a);}
    state.clips={idle,walk};
    state.ready=true;
    host.querySelector(".fq3d-loading")?.remove();
    const caption=host.querySelector(".fq3d-caption");if(caption)caption.textContent="INSTRUTOR 3D RIGADO · MODELO CC0";
    setMotion(state.motion,state);
  },undefined,()=>{
    const loading=host.querySelector(".fq3d-loading");
    if(loading)loading.textContent="MODELO 3D INDISPONÍVEL · VERIFIQUE A CONEXÃO";
  });

  const animate=(ms)=>{
    state.raf=requestAnimationFrame(animate);
    const dt=state.last?Math.min((ms-state.last)/1000,.05):0;state.last=ms;
    const t=ms*.001,phase=t*1.55,wave=(Math.sin(phase)+1)*.5;
    if(state.mixer)state.mixer.update(dt);
    state.ring.rotation.z=t*.12;
    if(state.ready)applyPose(state,wave,phase);
    renderer.render(scene,camera);
  };
  state.raf=requestAnimationFrame(animate);

  let drag=false,px=0;
  renderer.domElement.addEventListener("pointerdown",e=>{drag=true;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-px;px=e.clientX;state.angle+=dx*.008;characterRoot.rotation.y=-Math.PI/2+state.angle;});
  renderer.domElement.addEventListener("pointerup",()=>drag=false);
  renderer.domElement.addEventListener("pointercancel",()=>drag=false);
}

function findBone(state,...names){for(const n of names){const b=state.bones.get(n);if(b)return b;}return null;}
function setBone(state,names,x=0,y=0,z=0){
  const b=findBone(state,...names);if(!b)return;
  const key=b.name.toLowerCase(),base=state.base.get(key);if(!base)return;
  const offset=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,"XYZ"));
  b.quaternion.copy(base).multiply(offset);
}
function resetPose(state){for(const [name,b] of state.bones){const q=state.base.get(name);if(q)b.quaternion.copy(q);}}
function setMotion(motion,state){
  state.motion=motion||"motion-stance";
  if(!state.ready)return;
  state.actions.forEach(a=>a.stop());state.actions=[];
  state.characterRoot.rotation.set(0,-Math.PI/2,0);
  if(state.mixer)state.mixer.stopAllAction();
  const wantsWalk=state.motion.includes("step");
  const chosen=wantsWalk?state.clips?.walk:state.clips?.idle;
  if(chosen&&state.mixer){const a=state.mixer.clipAction(chosen);a.reset().play();state.actions=[a];}
  else resetPose(state);
}
function applyPose(state,wave,phase){
  const m=state.motion;
  if(m.includes("step")||m.includes("stance")||m.includes("rhythm")||m.includes("mobility"))return;
  // Keep the source rig's skin weights and joint hierarchy; only rotate named joints.
  // This is a restrained study animation, not a substitute for in-person coaching.
  if(state.actions.length)state.actions.forEach(a=>a.stop());
  resetPose(state);
  if(m.includes("squat")){
    const bend=.52*wave;
    setBone(state,["thigh_l"],-.42*bend);setBone(state,["thigh_r"],-.42*bend);
    setBone(state,["calf_l"],.92*bend);setBone(state,["calf_r"],.92*bend);
    setBone(state,["spine_02","spine_01"],.13*bend);
    setBone(state,["upperarm_l"],-.18);setBone(state,["upperarm_r"],-.18);
  }else if(m.includes("lunge")){
    setBone(state,["thigh_l"],-.48*wave);setBone(state,["calf_l"],.78*wave);
    setBone(state,["thigh_r"],.12*wave);setBone(state,["spine_02","spine_01"],.08*wave);
  }else if(m.includes("calf")){
    setBone(state,["foot_l"],-.22*wave);setBone(state,["foot_r"],-.22*wave);
  }else if(m.includes("hinge")||m.includes("row")){
    setBone(state,["spine_02","spine_01"],.26+.05*Math.sin(phase));
    setBone(state,["thigh_l"],-.10);setBone(state,["thigh_r"],-.10);
    if(m.includes("row")){
      setBone(state,["upperarm_l"],-.62);setBone(state,["upperarm_r"],-.62);
      setBone(state,["lowerarm_l"],.52+.18*wave);setBone(state,["lowerarm_r"],.52+.18*wave);
    }
  }else if(m.includes("curl")){
    setBone(state,["upperarm_l"],-.12);setBone(state,["upperarm_r"],-.12);
    setBone(state,["lowerarm_l"],-1.05*wave);setBone(state,["lowerarm_r"],-1.05*wave);
  }else if(m.includes("guard")){
    setBone(state,["upperarm_l"],-.72);setBone(state,["upperarm_r"],-.72);
    setBone(state,["lowerarm_l"],-1.05);setBone(state,["lowerarm_r"],-1.05);
  }else if(m.includes("pushup")||m.includes("kneepush")){
    setBone(state,["upperarm_l"],-.28-.12*wave);setBone(state,["upperarm_r"],-.28-.12*wave);
    setBone(state,["lowerarm_l"],-.65+.28*wave);setBone(state,["lowerarm_r"],-.65+.28*wave);
  }else if(m.includes("bridge")||m.includes("deadbug")||m.includes("birddog")){
    setBone(state,["thigh_l"],-.25*wave);setBone(state,["thigh_r"],-.25*wave);
    setBone(state,["upperarm_l"],-.18*wave);setBone(state,["upperarm_r"],-.18*wave);
  }else if(m.includes("grip")){
    setBone(state,["hand_l"],.08*Math.sin(phase));setBone(state,["hand_r"],.08*Math.sin(phase));
  }
}
function scan(){document.querySelectorAll(".fq3d-stage").forEach(makeStage);}
const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});scan();
