const $=s=>document.querySelector(s);
const KEY="fightquest-v1", startDate=new Date("2026-11-14T00:00:00");
const initial={xp:0,completed:[],sessions:[],checks:{},activeDays:0};
let state;try{state={...initial,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch{state={...initial};}
const plans={A:[["Agachamento","2 × 12","Controle a descida e mantenha os pés apoiados."],["Flexão inclinada","2 × 6–8","Use apoio firme; mantenha o corpo alinhado."],["Remada com mochila leve","2 × 10–12","Coluna neutra e movimento controlado."],["Ponte de glúteos","2 × 15","Suba sem forçar a lombar."],["Elevação de panturrilha","2 × 15","Use apoio estável se necessário."],["Dead bug","2 × 8 por lado","Mantenha o tronco estável."]],B:[["Afundo alternado","2 × 8 por perna","Use amplitude confortável."],["Flexão com joelhos","2 × 5–7","Priorize controle e alinhamento."],["Levantamento romeno leve","2 × 10","Comece sem carga ou com mochila leve."],["Rosca com mochila leve","2 × 10","Não balance o tronco."],["Bird dog","2 × 8 por lado","Movimento lento e estável."],["Aperto de toalha","2 × 15 s","Contração moderada, sem dor."]]};
const lessons=[["Base, postura e equilíbrio","Conheça os pontos básicos de uma postura estável.","Objetivo da aula","Perceber uma posição confortável e equilibrada, sem tensão desnecessária.","Prática de estudo","Observe uma demonstração de um instrutor e identifique alinhamento, equilíbrio e relaxamento. Não faça movimentos bruscos nem teste golpes."],["Guarda e atenção","Entenda a finalidade defensiva da guarda e a importância da atenção.","Objetivo da aula","Reconhecer como postura, atenção e respiração se relacionam.","Prática de estudo","Assista a uma explicação técnica de um professor. Pratique apenas manter uma postura relaxada, sem simular confronto."],["Deslocamento básico","Estude a importância do equilíbrio durante a movimentação.","Objetivo da aula","Compreender por que passos controlados ajudam a manter estabilidade.","Prática de estudo","Observe um vídeo didático de deslocamento para iniciantes. Priorize entender o conceito antes de tentar reproduzir."],["Coordenação e respiração","Aprenda a perceber ritmo, coordenação e respiração.","Objetivo da aula","Reconhecer sinais de tensão e manter a respiração natural.","Prática de estudo","Faça uma pausa de respiração confortável e mobilidade leve. Não pratique golpes de impacto sem supervisão."]];
let activeWorkout="A", timerId=null, timerSeconds=0, deferredPrompt=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state));$("#level").textContent=1+Math.floor(state.xp/100);}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._hide);t._hide=setTimeout(()=>t.classList.remove("show"),2400);}
function daysUntil(){return Math.max(0,Math.ceil((startDate-new Date())/86400000));}
function page(n){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===n));const a=$("#app");a.innerHTML=({home, strength:strengthPage,muaythai:muayPage,progress:progressPage,profile:profilePage}[n]||home)();bind();}
function home(){const days=daysUntil(),pct=Math.min(100,state.completed.length/90*100);return `
<section class="hero hero-upgraded"><div class="hero-glow"></div><div class="eyebrow">FIGHTQUEST / PROTOCOLO 90D</div><div class="hero-kicker"><span class="live-dot"></span> SUA JORNADA COMEÇA COM CONSISTÊNCIA</div><h1>FORJE SUA<br><em>EVOLUÇÃO.</em></h1><p>Treino inteligente. Fundamentos sólidos. Progresso registrado.</p><div class="hero-stats"><div><strong>${state.completed.length}<small>/90</small></strong><span>DIAS</span></div><div><strong>${state.xp}</strong><span>XP TOTAL</span></div><div><strong>${1+Math.floor(state.xp/100)}</strong><span>NÍVEL</span></div></div></section>
<section class="start-panel"><div class="start-top"><span class="eyebrow">${days?"CONTAGEM REGRESSIVA":"TREINO LIBERADO"}</span><span class="pill">${days?days+" DIAS":"DIA 1"}</span></div><h2>${days?"Preparação em andamento":"Hora de começar"}</h2><p>${days?"A data planejada de início é 14 de novembro de 2026. Explore as áreas e prepare seu espaço.":"Comece com intensidade moderada e respeite sua recuperação."}</p><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-meta"><span>PROGRAMA</span><b>${state.completed.length} / 90 DIAS</b></div><div class="action-row"><button class="btn" data-go="strength">Acessar musculação <span>↗</span></button><button class="btn secondary" data-go="muaythai">Trilha Muay Thai</button></div></section>
<div class="section-head"><div><span class="eyebrow">CENTRAL DE TREINO</span><h2>Escolha sua missão</h2></div><span class="section-note">01 — 04</span></div><div class="mission-grid">
<button class="mission-card" data-go="strength"><span class="mission-icon cyan">✦</span><span class="mission-label">MÓDULO 01</span><strong>Força</strong><small>Treinos A/B · Corpo todo</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-go="muaythai"><span class="mission-icon violet">🥊</span><span class="mission-label">MÓDULO 02</span><strong>Muay Thai</strong><small>Fundamentos · Coordenação</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-go="progress"><span class="mission-icon lime">▥</span><span class="mission-label">MÓDULO 03</span><strong>Desempenho</strong><small>XP · Histórico · Evolução</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-timer><span class="mission-icon orange">◷</span><span class="mission-label">FERRAMENTA</span><strong>Cronômetro</strong><small>Controle seu tempo</small><span class="mission-arrow">↗</span></button></div>
<section class="quote-strip"><span>“</span><div><b>DISCIPLINA ANTES DA INTENSIDADE.</b><small>O objetivo é evoluir sem pular etapas.</small></div></section>`;}
function strengthPage(){const checks=state.checks?.[activeWorkout]||[];return `
<div class="page-hero"><span class="eyebrow">MÓDULO 01 / PREPARAÇÃO FÍSICA</span><h1 class="page-title">TREINO DE <em>FORÇA</em></h1><p>Escolha uma sessão e abra o guia de cada exercício. Os movimentos com mídia validada mostram vídeos reais; os demais recebem orientação escrita, sem animações improvisadas.</p></div>
<div class="workout-switch"><button class="workout-tab ${activeWorkout==="A"?"selected":""}" data-workout="A"><small>SESSÃO 01</small><b>TREINO A</b><span>Corpo todo</span></button><button class="workout-tab ${activeWorkout==="B"?"selected":""}" data-workout="B"><small>SESSÃO 02</small><b>TREINO B</b><span>Corpo todo</span></button></div>
<div class="coach-banner"><div class="coach-badge">▶<span>●</span></div><div><b>BIBLIOTECA DE DEMONSTRAÇÕES</b><small>Vídeos reais com autoria e licença identificadas.</small></div><span class="coach-live">● MÍDIA VALIDADA</span></div>
<div class="session-summary"><div><span class="eyebrow">SESSÃO SELECIONADA</span><b>Treino ${activeWorkout}</b></div><div><strong>06</strong><small>EXERCÍCIOS</small></div><div><strong>02</strong><small>SÉRIES BASE</small></div></div>
<div class="section-head"><div><span class="eyebrow">CHECKLIST DA SESSÃO</span><h2>Aprenda e execute</h2></div><span class="section-note" id="checkedCount">0 / 6</span></div>
<div class="exercise-list">${plans[activeWorkout].map((x,i)=>`<article class="exercise-card coach-exercise"><input class="exercise-check" type="checkbox" data-exercise="${i}" ${checks.includes(i)?"checked":""}><span class="exercise-number">${String(i+1).padStart(2,"0")}</span><span class="exercise-info"><b>${x[0]}</b><strong>${x[1]}</strong><small>${x[2]}</small><button class="demo-link" type="button" data-demo="${activeWorkout}-${i}">▶ Ver demonstração</button></span><span class="exercise-done">✓</span></article>`).join("")}</div>
<div class="session-footer"><div class="notice"><b>Treino responsável</b><br>Comece leve, aqueça antes e deixe 2–3 repetições de reserva. Interrompa se sentir dor, tontura ou mal-estar.</div><button class="btn block" id="finishWorkout">Finalizar sessão · +15 XP</button><button class="btn secondary block" data-timer>Iniciar cronômetro</button></div>`;}
function muayPage(){const done=state.lessonDone||[];const levels=[["Base e equilíbrio","Entenda a base e distribua o peso com conforto.","INICIANTE"],["Guarda e postura","Estude a posição defensiva e a atenção corporal.","INICIANTE"],["Deslocamento básico","Observe passos curtos e equilíbrio ao caminhar.","FUNDAMENTOS"],["Coordenação e respiração","Combine ritmo leve, coordenação e respiração natural.","FUNDAMENTOS"],["Mobilidade e aquecimento","Prepare articulações e recupere sem forçar amplitudes.","PREPARAÇÃO"]];return `
<div class="page-hero"><span class="eyebrow red-eyebrow">FIGHTQUEST / ACADEMIA GUIADA</span><h1 class="page-title">MUAY <em>THAI</em></h1><p>Trilha guiada de postura, equilíbrio, mobilidade e coordenação. As demonstrações 3D estão em reconstrução.</p></div>
<section class="study-stage"><div class="coach-stage-head"><span><i></i> CENTRAL DE FUNDAMENTOS</span><b>TRILHA ${done.length}/5</b></div><div class="study-stage-body"><div class="study-icon">🥊</div><div><b>Aprendizado guiado</b><p>Postura, equilíbrio, mobilidade e coordenação. As aulas priorizam estudo e movimentos leves, sem simulação de combate.</p></div></div><div class="progress-track red-track"><div class="progress-fill red-fill" style="width:${done.length/5*100}%"></div></div></section>
<div class="level-heading"><div><span class="eyebrow red-eyebrow">AULAS COM DEMONSTRAÇÃO</span><h2>Aprenda movimento por movimento</h2></div><span class="level-total">5 ETAPAS</span></div>
<div class="level-path">${levels.map((l,i)=>{const isDone=done.includes(i),open=i===0||done.includes(i-1);return `<article class="level-card ${isDone?"level-done":""} ${!open?"level-locked":""}"><div class="level-number">${isDone?"✓":"0"+(i+1)}</div><div class="level-copy"><span>${l[2]} · AULA ${i+1}</span><b>${l[0]}</b><small>${l[1]}</small></div><button class="level-open" data-level="${i}" ${!open?"disabled":""}>${isDone?"Rever":"Assistir"} ▶</button></article>`;}).join("")}</div>
<div class="notice"><b>Aprendizado seguro</b><br>As aulas iniciais demonstram postura, equilíbrio, deslocamento leve e coordenação. Golpes de impacto, saco e sparring exigem professor qualificado e equipamento adequado.</div>`;}
function coachAvatar(motion,label){
  const title = label || "Demonstração do exercício";
  // Todos os exercícios usam o instrutor masculino 3D do próprio FightQuest.
  return `<div class="fq-3d-viewer" data-motion="${motion||"idle"}" role="region" aria-label="Visualizador 3D do instrutor">
    <div class="fq-3d-viewport" aria-hidden="true"></div>
    <div class="fq-3d-loading" role="status">
      <div class="fq-studio-orbit" aria-hidden="true"><span></span><i></i><b>FQ</b></div>
      <span class="eyebrow">FIGHTQUEST / ESTÚDIO 3D</span>
      <strong>${title}</strong>
      <p class="fq-3d-status">Preparando o visualizador e validando o modelo humano.</p>
      <div class="fq-build-steps"><span><i>01</i> Modelo rigado</span><span><i>02</i> Articulações</span><span><i>03</i> Animação</span></div>
      <small>O instrutor só será exibido quando o arquivo 3D passar na validação.</small>
    </div>
  </div>`;
}
function openLevel(i){const data=[["Base e equilíbrio","motion-stance","Observe o instrutor de frente e de perfil. Repare na posição confortável dos pés, no alinhamento do tronco e na distribuição equilibrada do peso.","A demonstração alterna entre vista frontal e lateral. Estude primeiro; qualquer prática deve ser leve, em espaço livre e sem forçar articulações."],["Guarda e postura","motion-guard","Observe como o instrutor mantém as mãos em posição protetora, os ombros relaxados e a atenção à frente.","Esta aula é uma explicação visual de postura defensiva, não um treino de confronto. Procure um professor para corrigir a técnica presencialmente."],["Deslocamento básico","motion-step","Observe o instrutor transferindo o peso e dando passos pequenos, mantendo a estabilidade.","A animação mostra o princípio do deslocamento. Se praticar, caminhe devagar em espaço livre, sem acelerar ou cruzar os pés."],["Coordenação e respiração","motion-rhythm","Observe a alternância suave de braços e pernas e a respiração natural durante o movimento.","Use a animação para entender ritmo e coordenação. Faça apenas mobilidade confortável e pare se sentir tontura ou desconforto."],["Mobilidade e aquecimento","motion-mobility","Observe movimentos articulares leves e controlados antes de uma sessão.","A demonstração é educativa. Não force alongamentos nem tente reproduzir amplitudes extremas."]][i];if(!data)return;const done=(state.lessonDone||[]).includes(i),m=document.createElement("div");m.className="modal-backdrop";m.innerHTML=`<section class="lesson-modal coach-lesson"><button class="modal-close" id="closeLevel" aria-label="Fechar">×</button><span class="eyebrow red-eyebrow">INSTRUTOR VIRTUAL / AULA 0${i+1}</span><div class="lesson-visual-card"><span>FIGHTQUEST / FUNDAMENTOS</span><strong>${data[0]}</strong><p>Guia de estudo · observação e mobilidade leve</p></div><h2>${data[0]}</h2><div class="demo-caption"><b>O QUE OBSERVAR</b><p>${data[2]}</p></div><div class="lesson-detail"><b>ORIENTAÇÃO</b><p>${data[3]}</p></div><button class="btn block" id="completeLevel">${done?"Etapa já concluída ✓":"Concluir aula estudada · +5 XP"}</button></section>`;document.body.append(m);const close=()=>m.remove();m.querySelector("#closeLevel").onclick=close;m.onclick=e=>{if(e.target===m)close();};m.querySelector("#completeLevel").onclick=()=>{if(!done){state.lessonDone=state.lessonDone||[];state.lessonDone.push(i);state.xp+=5;state.completed.push(Date.now());save();toast("Aula registrada! +5 XP");}close();page("muaythai");};}
function exerciseMotion(group,index){const name=plans[group][index]?.[0]||"";const map={"Agachamento":"squat","Flexão inclinada":"pushup","Remada com mochila leve":"row","Ponte de glúteos":"glute-bridge","Elevação de panturrilha":"calf-raise","Dead bug":"dead-bug","Afundo alternado":"lunge","Flexão com joelhos":"pushup","Levantamento romeno leve":"hinge","Rosca com mochila leve":"curl","Bird dog":"bird-dog","Aperto de toalha":"isometric"};return "exercise-"+(map[name]||"squat");}
function openExerciseDemo(key){
  const [group,index]=key.split("-"),item=plans[group][+index];
  if(!item)return;
  const mediaByName={
    "Agachamento":{
      kind:"embed",
      src:"https://www.dvidshub.net/video/embed/517502",
      credit:"U.S. Marine Corps · Capt. Joshua Pena / Cpl. Amber Jennings",
      license:"Domínio público (DVIDS)",
      source:"https://www.dvidshub.net/video/517502/body-weight-squat",
      note:"Demonstração de agachamento com o peso do próprio corpo, sem barra ou halteres. O vídeo é hospedado pelo DVIDS."
    },
    "Flexão inclinada":{
      kind:"video",
      src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Muscle_Strengthening_at_Home_-_Push-ups.webm",
      mime:"video/webm",
      credit:"Centers for Disease Control and Prevention (CDC)",
      license:"Domínio público nos EUA",
      source:"https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_Home_-_Push-ups.webm",
      note:"O vídeo mostra flexão no chão, não a versão inclinada. Para a variação inclinada, use apenas um apoio firme e estável e reduza a dificuldade."
    },
    "Remada com mochila leve":{
      kind:"video",
      src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Bent-over_row_-_exercise_demonstration_video.webm",
      mime:"video/webm",
      credit:"FitnessScape",
      license:"Creative Commons BY 3.0",
      source:"https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm",
      note:"O vídeo demonstra a trajetória da remada curvada com outro equipamento. No plano FightQuest, a referência é uma mochila leve; não copie cargas do vídeo."
    },
    "Elevação de panturrilha":{
      kind:"image",
      src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Standing-calf-raises-2.gif",
      credit:"Everkinetic",
      license:"Creative Commons BY-SA 3.0",
      source:"https://commons.wikimedia.org/wiki/File:Standing-calf-raises-2.gif",
      note:"Demonstração animada. Use apoio estável se precisar e faça apenas uma amplitude confortável."
    }
  };
  const media=mediaByName[item[0]];
  const mediaMarkup=media
    ? media.kind==="video"
      ? `<div class="demo-video-wrap"><video controls playsinline preload="metadata"><source src="${media.src}" type="${media.mime}">Seu navegador não conseguiu carregar este vídeo.</video></div>`
      : media.kind==="embed"
        ? `<div class="demo-video-wrap demo-embed-wrap"><iframe src="${media.src}" title="Demonstração de agachamento sem carga — U.S. Marine Corps" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
        : `<div class="demo-video-wrap demo-gif-wrap"><img src="${media.src}" alt="Demonstração animada de elevação de panturrilha" loading="lazy"></div>`
    : `<div class="demo-placeholder"><span>GUIA DE MOVIMENTO</span><b>Vídeo ainda não disponível para este exercício</b><p>Não vamos mostrar um vídeo de outro movimento como se fosse este. Use as orientações escritas abaixo.</p></div>`;
  const steps=[
    "Prepare um espaço livre e confira se o apoio ou equipamento está firme.",
    "Faça o movimento devagar, respirando naturalmente e sem forçar a amplitude.",
    "Pare se sentir dor, tontura ou mal-estar. A técnica deve ser confortável e controlada."
  ];
  const m=document.createElement("div");
  m.className="modal-backdrop";
  m.innerHTML=`<section class="lesson-modal coach-lesson demo-video-modal"><button class="modal-close" id="closeDemo" aria-label="Fechar">×</button><span class="eyebrow">GUIA DE MOVIMENTO / MUSCULAÇÃO</span><h2>${item[0]}</h2><div class="demo-rep-count"><b>${item[1]}</b><span>REFERÊNCIA INICIAL · AJUSTE AO CONFORTO</span></div>${mediaMarkup}<div class="demo-media-credit">${media?`Mídia: <b>${media.credit}</b> · ${media.license} · <a href="${media.source}" target="_blank" rel="noopener noreferrer">Ver fonte</a>`:"Sem mídia validada para este exercício."}</div><div class="demo-caption"><b>OBSERVAÇÃO</b><p>${media?media.note:item[2]}</p></div><div class="demo-steps">${steps.map((s,i)=>`<div><span>0${i+1}</span><p>${s}</p></div>`).join("")}</div><div class="lesson-detail"><b>LEMBRETE</b><p>${item[2]} Se tiver dúvidas sobre a execução, peça orientação presencial a um profissional qualificado.</p></div></section>`;
  document.body.append(m);
  const close=()=>{m.remove();document.removeEventListener("keydown",onKey);};
  const onKey=e=>{if(e.key==="Escape")close();};
  document.addEventListener("keydown",onKey);
  m.querySelector("#closeDemo").onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
}
function progressPage(){const total=state.sessions.length, strength=state.sessions.filter(s=>s.name.includes("Força")).length, thai=state.sessions.filter(s=>s.name.includes("Muay")).length;return `
<div class="page-hero"><span class="eyebrow">MÓDULO 03 / DADOS DO ATLETA</span><h1 class="page-title">SEU <em>DESEMPENHO</em></h1><p>Acompanhe o que você registrou. Cada sessão concluída soma experiência.</p></div>
<div class="stats-grid"><div class="stat-card"><span>XP TOTAL</span><b>${state.xp}</b><small>Experiência</small></div><div class="stat-card"><span>NÍVEL</span><b>${1+Math.floor(state.xp/100)}</b><small>${100-state.xp%100} XP para subir</small></div><div class="stat-card"><span>SESSÕES</span><b>${total}</b><small>Registros totais</small></div><div class="stat-card"><span>DIAS MARCADOS</span><b>${Math.min(90,state.completed.length)}</b><small>Do desafio de 90 dias</small></div></div>
<div class="section-head"><div><span class="eyebrow">DISTRIBUIÇÃO</span><h2>Atividade registrada</h2></div></div><div class="card performance-card"><div class="performance-row"><span>Musculação</span><b>${strength}</b></div><div class="progress-track"><div class="progress-fill" style="width:${total?strength/total*100:0}%"></div></div><div class="performance-row"><span>Muay Thai / fundamentos</span><b>${thai}</b></div><div class="progress-track"><div class="progress-fill violet-fill" style="width:${total?thai/total*100:0}%"></div></div></div>
<div class="section-head"><div><span class="eyebrow">LINHA DO TEMPO</span><h2>Últimas sessões</h2></div></div><div class="history-list">${total?state.sessions.slice(-12).reverse().map(s=>`<div class="history-item"><span class="history-dot"></span><div><b>${s.name}</b><small>${new Date(s.date).toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})}</small></div><strong>+${s.xp} XP</strong></div>`).join(""):'<div class="empty-state">Seu histórico aparecerá aqui depois da primeira sessão registrada.</div>'}</div>`;}
function profilePage(){return `
<div class="page-hero"><span class="eyebrow">CENTRAL DO ATLETA</span><h1 class="page-title">MEU <em>PERFIL</em></h1><p>Preferências, dados e controle do seu progresso.</p></div>
<div class="profile-banner"><div class="profile-avatar">FQ</div><div><span class="eyebrow">ATLETA FIGHTQUEST</span><h2>Nível ${1+Math.floor(state.xp/100)}</h2><small>Iniciante · Projeto de 90 dias</small></div></div>
<div class="section-head"><div><span class="eyebrow">SEU KIT</span><h2>Equipamentos</h2></div></div><div class="profile-row"><span>▰</span><div><b>Mochila e livros</b><small>Para exercícios com carga leve e segura</small></div><i>Disponível</i></div><div class="profile-row"><span>⌂</span><div><b>Espaço em casa</b><small>Para mobilidade e preparação física</small></div><i>Disponível</i></div>
<div class="section-head"><div><span class="eyebrow">CONTROLE DE DADOS</span><h2>Seus registros</h2></div></div><button class="btn secondary block" id="exportBtn">Exportar progresso em JSON ↓</button><button class="btn danger-outline block" id="resetBtn">Apagar todo o progresso</button><p class="fine-print">Os registros ficam salvos neste navegador/aparelho. Esta versão ainda não sincroniza entre dispositivos.</p>`;}
function bind(){if($("#checkedCount"))updateChecked();document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>page(b.dataset.go));document.querySelectorAll("[data-workout]").forEach(b=>b.onclick=()=>{activeWorkout=b.dataset.workout;page("strength");});document.querySelectorAll("[data-timer]").forEach(b=>b.onclick=openTimer);document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(+b.dataset.lesson));document.querySelectorAll("[data-level]").forEach(b=>b.onclick=()=>openLevel(+b.dataset.level));document.querySelectorAll("[data-demo]").forEach(b=>b.onclick=()=>openExerciseDemo(b.dataset.demo));document.querySelectorAll("[data-exercise]").forEach(b=>b.onchange=updateChecked);const finish=$("#finishWorkout");if(finish)finish.onclick=finishSession;const exp=$("#exportBtn");if(exp)exp.onclick=exportData;const reset=$("#resetBtn");if(reset)reset.onclick=resetData;}
function updateChecked(){const boxes=[...document.querySelectorAll("[data-exercise]")];const checked=boxes.filter(x=>x.checked).map(x=>+x.dataset.exercise);state.checks=state.checks||{};state.checks[activeWorkout]=checked;save();const n=checked.length;$("#checkedCount").textContent=n+" / 6";$("#finishWorkout").textContent=n===6?"Finalizar sessão · +15 XP":"Marque os exercícios feitos · "+n+"/6";$("#finishWorkout").disabled=n!==6;}
function finishSession(){const n=document.querySelectorAll("[data-exercise]:checked").length;if(n!==6){toast("Marque os seis exercícios antes de concluir.");return;}record("Força · Treino "+activeWorkout,15);state.checks[activeWorkout]=[];save();page("progress");}
function record(name,xp){state.xp+=xp;state.completed.push(Date.now());state.sessions.push({name,date:new Date().toISOString(),xp});save();toast("Registro salvo! +"+xp+" XP");}
function openLesson(i){const l=lessons[i],done=(state.lessonDone||[]).includes(i);const modal=document.createElement("div");modal.className="modal-backdrop";modal.id="lessonModal";modal.innerHTML=`<section class="lesson-modal"><button class="modal-close" id="closeLesson" aria-label="Fechar">×</button><span class="eyebrow">AULA ${String(i+1).padStart(2,"0")} / FUNDAMENTOS</span><div class="modal-emblem">🥊</div><h2>${l[0]}</h2><p class="modal-lead">${l[1]}</p><div class="lesson-detail"><b>${l[2]}</b><p>${l[3]}</p></div><div class="lesson-detail"><b>${l[4]}</b><p>${l[5]}</p></div><div class="notice"><b>Aprendizado seguro</b><br>Não pratique golpes de impacto por conta própria. Use esta aula para estudar conceitos e procure um professor para correção técnica.</div><button class="btn block" id="completeLesson">${done?"Aula já concluída ✓":"Marcar aula como estudada · +5 XP"}</button></section>`;document.body.append(modal);const close=()=>{modal.remove();document.removeEventListener("keydown",onKey);};const onKey=e=>{if(e.key==="Escape")close();};document.addEventListener("keydown",onKey);$("#closeLesson").onclick=close;modal.onclick=e=>{if(e.target===modal)close();};$("#completeLesson").onclick=()=>{if(!done){state.lessonDone=state.lessonDone||[];state.lessonDone.push(i);state.xp+=5;state.completed.push(Date.now());save();toast("Aula registrada! +5 XP");}modal.remove();page("muaythai");};}
function openTimer(){if($("#timerModal"))return;timerSeconds=0;const m=document.createElement("div");m.className="modal-backdrop";m.id="timerModal";m.innerHTML='<section class="timer-modal"><button class="modal-close" id="closeTimer">×</button><span class="eyebrow">FERRAMENTA / TEMPO</span><h2>Cronômetro de treino</h2><div class="timer-display" id="timerValue">00:00</div><div class="timer-actions"><button class="btn" id="timerToggle">Iniciar</button><button class="btn secondary" id="timerReset">Zerar</button></div><p class="fine-print">Use pausas adequadas e ajuste a duração ao seu condicionamento.</p></section>';document.body.append(m);$("#closeTimer").onclick=closeTimer;$("#timerToggle").onclick=()=>{if(timerId){clearInterval(timerId);timerId=null;$("#timerToggle").textContent="Continuar";}else{timerId=setInterval(()=>{timerSeconds++;$("#timerValue").textContent=String(Math.floor(timerSeconds/60)).padStart(2,"0")+":"+String(timerSeconds%60).padStart(2,"0");},1000);$("#timerToggle").textContent="Pausar";}};$("#timerReset").onclick=()=>{clearInterval(timerId);timerId=null;timerSeconds=0;$("#timerValue").textContent="00:00";$("#timerToggle").textContent="Iniciar";};}
function closeTimer(){clearInterval(timerId);timerId=null;$("#timerModal")?.remove();}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="fightquest-progresso.json";a.click();URL.revokeObjectURL(url);toast("Arquivo de progresso preparado.");}
function resetData(){if(confirm("Tem certeza de que deseja apagar todos os registros deste aparelho?")){state={...initial,completed:[],sessions:[],checks:{},lessonDone:[]};save();page("profile");toast("Progresso apagado.");}}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
$("#installBtn").onclick=async()=>{if(!deferredPrompt){toast("Abra o menu do navegador e escolha Instalar aplicativo.");return;}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;};
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
save();page("home");


