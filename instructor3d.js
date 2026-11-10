import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

/* FightQuest 2.0: personagem humanoide 3D procedural com hierarquia articulada.
   Sem modelo externo: geometria, materiais e animação são criados no navegador. */
const stages = new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function capsule(radius,length,material){
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,10),material);
}
function buildAvatar(host){
  if(stages.has(host)) return;
  const width=Math.max(220,host.clientWidth||300),height=Math.max(260,host.clientHeight||340);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x080d16);
  const camera=new THREE.PerspectiveCamera(34,width/height,.1,100);
  camera.position.set(3.6,2.25,5.7);camera.lookAt(0,1.05,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
  renderer.setSize(width,height);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.querySelector(".fq3d-loading")?.remove();host.prepend(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xbad7ff,0x111522,2.1);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(3,5,4);key.castShadow=true;scene.add(key);
  const rim=new THREE.PointLight(0xff294d,28,8);rim.position.set(-2,2.3,-1);scene.add(rim);
  const fill=new THREE.PointLight(0x29d9df,12,7);fill.position.set(2,1.2,3);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2.3,64),new THREE.MeshStandardMaterial({color:0x101827,roughness:.8,metalness:.15}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.04;floor.receiveShadow=true;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.012,8,80),new THREE.MeshBasicMaterial({color:0xe52c4c}));
  ring.rotation.x=Math.PI/2;ring.position.y=-.025;ring.scale.set(1,.72,1);scene.add(ring);
  const skin=new THREE.MeshStandardMaterial({color:0xc5a18c,roughness:.72});
  const skinLight=new THREE.MeshStandardMaterial({color:0xd6b39c,roughness:.68});
  const shorts=new THREE.MeshStandardMaterial({color:0x9f1833,roughness:.65,metalness:.08});
  const top=new THREE.MeshStandardMaterial({color:0x26384b,roughness:.7});
  const trim=new THREE.MeshStandardMaterial({color:0xf13a58,metalness:.35,roughness:.35});
  const dark=new THREE.MeshStandardMaterial({color:0x18212e,roughness:.65});
  const root=new THREE.Group();scene.add(root);
  const torso=new THREE.Group();torso.position.y=1.34;root.add(torso);
  const chest=capsule(.255,.48,top);chest.position.y=.22;chest.castShadow=true;torso.add(chest);
  const waist=capsule(.205,.18,skin);waist.position.y=-.08;torso.add(waist);
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.075,24),trim);belt.position.y=.01;torso.add(belt);
  const neck=capsule(.075,.1,skinLight);neck.position.y=.56;torso.add(neck);
  const head=new THREE.Group();head.position.y=.72;torso.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.145,24,20),skinLight);skull.scale.set(.88,1.12,.92);skull.castShadow=true;head.add(skull);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.148,20,12,0,Math.PI*2,0,Math.PI*.48),dark);hair.position.y=.055;head.add(hair);
  const faceLine=new THREE.Mesh(new THREE.BoxGeometry(.11,.012,.012),dark);faceLine.position.set(0,-.02,.128);head.add(faceLine);
  const shoulders=[];
  function limb(parent,upperLen,lowerLen,upperRadius,lowerRadius,materialUpper=skin,materialLower=skinLight){
    const pivot=new THREE.Group();parent.add(pivot);
    const upper=capsule(upperRadius,upperLen*.72,materialUpper);upper.position.y=-upperLen*.36;upper.castShadow=true;pivot.add(upper);
    const joint=new THREE.Mesh(new THREE.SphereGeometry(upperRadius*.92,14,12),materialLower);joint.position.y=-upperLen*.72;pivot.add(joint);
    const elbow=new THREE.Group();elbow.position.y=-upperLen*.72;pivot.add(elbow);
    const lower=capsule(lowerRadius,lowerLen*.78,materialLower);lower.position.y=-lowerLen*.39;lower.castShadow=true;elbow.add(lower);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(lowerRadius*1.05,14,12),skinLight);hand.position.y=-lowerLen*.8;elbow.add(hand);
    return {pivot,elbow};
  }
  for(const side of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.set(side*.29,.43,0);torso.add(shoulder);
    const arm=limb(shoulder,.34,.31,.09,.073);shoulders.push({side,...arm});
  }
  const hips=[];
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.115,-.18,0);root.add(hip);
    const upper=capsule(.115,.34,skin);upper.position.y=-.17;upper.castShadow=true;hip.add(upper);
    const knee=new THREE.Group();knee.position.y=-.34;hip.add(knee);
    const kneecap=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),skinLight);knee.add(kneecap);
    const shin=capsule(.082,.34,skinLight);shin.position.y=-.18;shin.castShadow=true;knee.add(shin);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.16,.085,.29),dark);foot.position.set(0,-.37,.075);foot.castShadow=true;knee.add(foot);
    hips.push({side,hip,knee});
  }
  // Red wrist bands and shoulder definition make the silhouette readable.
  shoulders.forEach(({side,pivot})=>{const band=new THREE.Mesh(new THREE.TorusGeometry(.077,.018,8,20),trim);band.position.set(0,-.32,0);pivot.add(band);});
  const state={host,scene,camera,renderer,root,torso,head,shoulders,hips,ring,raf:0,last:0,angle:0,motion:host.dataset.motion||"motion-stance"};
  stages.set(host,state);
  const resize=()=>{const w=Math.max(220,host.clientWidth),h=Math.max(260,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);};
  state.resize=resize;
  const observer=new ResizeObserver(resize);observer.observe(host);state.observer=observer;
  const animate=(time)=>{
    state.raf=requestAnimationFrame(animate);
    const t=time*.001,phase=t*1.45;
    const {motion}=state;
    state.root.position.y=0;state.root.rotation.set(0,0,0);
    state.torso.rotation.set(0,0,0);state.head.rotation.set(0,0,0);
    state.shoulders.forEach(({side,pivot,elbow})=>{pivot.rotation.set(0,0,side*.04);elbow.rotation.set(0,0,0);});
    state.hips.forEach(({hip,knee})=>{hip.rotation.set(0,0,0);knee.rotation.set(0,0,0);});
    state.ring.rotation.z=t*.12;
    const wave=Math.sin(phase)*.5+.5;
    if(motion.includes("squat")){
      const bend=wave*.72;state.root.position.y=-bend*.2;
      state.hips.forEach(({side,hip,knee})=>{hip.rotation.x=-bend*.78;knee.rotation.x=bend*1.18;});
      state.torso.rotation.x=bend*.16;
      state.shoulders.forEach(({side,pivot,elbow})=>{pivot.rotation.x=-.55;pivot.rotation.z=side*.12;elbow.rotation.x=-.35;});
    }else if(motion.includes("lunge")){
      state.hips.forEach(({side,hip,knee})=>{hip.rotation.x=side===1?-.42*wave:.12;knee.rotation.x=side===1?.78*wave:0;});
      state.torso.rotation.x=-.08*wave;
    }else if(motion.includes("calf")){
      state.root.position.y=.055*wave;
      state.hips.forEach(({knee})=>{knee.rotation.x=0;});
    }else if(motion.includes("bridge")){
      state.root.position.y=.22*wave;state.torso.rotation.x=-.15;
      state.hips.forEach(({hip,knee})=>{hip.rotation.x=-.85;knee.rotation.x=1.1;});
    }else if(motion.includes("pushup")||motion.includes("deadbug")||motion.includes("birddog")){
      state.root.rotation.z=-Math.PI/2;state.root.position.y=.75;
      state.torso.rotation.x=motion.includes("deadbug")?Math.sin(phase)*.12:0;
      state.shoulders.forEach(({side,pivot,elbow})=>{pivot.rotation.z=side*.18;pivot.rotation.x=-.55+wave*.12;elbow.rotation.x=-.25;});
      state.hips.forEach(({hip,knee})=>{hip.rotation.x=motion.includes("deadbug")?Math.sin(phase+hip.position.x)*.22:0;knee.rotation.x=motion.includes("deadbug")?.32:0;});
    }else if(motion.includes("hinge")||motion.includes("row")||motion.includes("curl")){
      state.torso.rotation.x=.25+.08*Math.sin(phase);
      state.shoulders.forEach(({side,pivot,elbow})=>{pivot.rotation.x=motion.includes("row")?-.8+wave*.18:-.35;pivot.rotation.z=side*.08;elbow.rotation.x=motion.includes("curl")?-.9+wave*.55:-.45;});
      state.hips.forEach(({hip})=>{hip.rotation.x=-.22;});
    }else if(motion.includes("guard")||motion.includes("stance")||motion.includes("step")||motion.includes("rhythm")||motion.includes("mobility")){
      state.shoulders.forEach(({side,pivot,elbow})=>{pivot.rotation.x=-.7;pivot.rotation.z=side*.16;elbow.rotation.x=-.9;});
      state.root.position.x=motion.includes("step")?.045*Math.sin(phase):0;
      state.root.rotation.y=motion.includes("step")?.07*Math.sin(phase):0;
      state.torso.rotation.z=.025*Math.sin(phase);
    }
    renderer.render(scene,camera);
  };
  state.raf=requestAnimationFrame(animate);
  // Drag horizontally to orbit the instructor; vertical drag adjusts camera elevation.
  let dragging=false,px=0,py=0;
  renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;const dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;state.angle+=dx*.008;camera.position.x=Math.sin(state.angle)*6;camera.position.z=Math.cos(state.angle)*6;camera.position.y=clamp(camera.position.y-dy*.012,1.2,3.5);camera.lookAt(0,1.05,0);});
  renderer.domElement.addEventListener("pointerup",()=>dragging=false);
  renderer.domElement.addEventListener("pointercancel",()=>dragging=false);
}
function scan(){document.querySelectorAll(".fq3d-stage").forEach(buildAvatar);}
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
scan();
