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
function dayKey(value){const d=new Date(value);return Number.isNaN(d.getTime())?"":d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function trainingDays(){return [...new Set([...(state.completed||[]).map(dayKey),...(state.sessions||[]).map(x=>dayKey(x.date))].filter(Boolean))].sort();}
function currentStreak(){const days=new Set(trainingDays());let d=new Date();let key=dayKey(d);if(!days.has(key)){d.setDate(d.getDate()-1);key=dayKey(d);}let n=0;while(days.has(key)){n++;d.setDate(d.getDate()-1);key=dayKey(d);}return n;}
function weeklyActivity(){const days=new Set(trainingDays()),out=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);out.push({label:["D","S","T","Q","Q","S","S"][d.getDay()],done:days.has(dayKey(d))});}return out;}
function achievements(){const days=trainingDays(),sessions=state.sessions||[],xp=state.xp||0;return [
  ["Primeiro passo","Conclua sua primeira sessão",sessions.length>=1,"🏁"],
  ["Constância","Registre 3 dias diferentes",days.length>=3,"🔥"],
  ["Uma semana","Registre 7 dias diferentes",days.length>=7,"📅"],
  ["Forjador","Conclua 10 sessões",sessions.length>=10,"⚒️"],
  ["Nível 5","Alcance 400 XP",xp>=400,"💠"],
  ["Estudioso","Conclua 5 aulas",((state.lessonDone||[]).length)>=5,"📘"]
];}function page(n){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===n));const a=$("#app");a.innerHTML=({home, strength:strengthPage,muaythai:muayPage,progress:progressPage,profile:profilePage}[n]||home)();bind();}
function home(){const days=daysUntil(),active=trainingDays().length,streak=currentStreak(),week=weeklyActivity(),xp=state.xp||0,level=1+Math.floor(xp/100),next=100-xp%100;return `
<section class="hero hero-upgraded"><div class="hero-glow"></div><div class="eyebrow">FIGHTQUEST / PROTOCOLO 90D</div><div class="hero-kicker"><span class="live-dot"></span> EVOLUÇÃO CONSTRUÍDA COM CONSISTÊNCIA</div><h1>FORJE SUA<br><em>EVOLUÇÃO.</em></h1><p>Treino inteligente, técnica controlada e progresso acompanhado.</p><div class="hero-stats"><div><strong>${active}<small>/90</small></strong><span>DIAS ATIVOS</span></div><div><strong>${xp}</strong><span>XP TOTAL</span></div><div><strong>${level}</strong><span>NÍVEL</span></div></div></section>
<section class="start-panel"><div class="start-top"><span class="eyebrow">${days?"CONTAGEM REGRESSIVA":"TREINO LIBERADO"}</span><span class="pill">${days?days+" DIAS":"DIA 1"}</span></div><h2>${days?"Preparação em andamento":"Hora de começar"}</h2><p>${days?"A data planejada de início é 14 de novembro de 2026. Explore os guias e prepare seu espaço.":"Escolha uma sessão adequada ao seu nível e priorize a execução confortável."}</p><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,active/90*100)}%"></div></div><div class="progress-meta"><span>PROGRAMA DE 90 DIAS</span><b>${active} / 90 DIAS ATIVOS</b></div><div class="action-row"><button class="btn" data-go="strength">Acessar musculação <span>↗</span></button><button class="btn secondary" data-go="muaythai">Trilha Muay Thai</button></div></section>
<div class="stats-grid"><div class="stat-card"><span>SEQUÊNCIA ATUAL</span><b>${streak} ${streak===1?"dia":"dias"}</b><small>dias consecutivos registrados</small></div><div class="stat-card"><span>PRÓXIMO NÍVEL</span><b>${next} XP</b><small>para alcançar o nível ${level+1}</small></div></div>
<div class="section-head"><div><span class="eyebrow">ÚLTIMOS 7 DIAS</span><h2>Sua consistência</h2></div><span class="section-note">${week.filter(x=>x.done).length}/7</span></div><div class="card"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center">${week.map(x=>`<div><div style="height:36px;border-radius:10px;background:${x.done?"linear-gradient(145deg,#38e8c5,#9cff8a)":"#26364a"};display:grid;place-items:center;color:${x.done?"#09201d":"#91a1b5"};font-weight:900">${x.done?"✓":"·"}</div><small style="display:block;margin-top:6px;color:var(--muted)">${x.label}</small></div>`).join("")}</div></div>
<div class="section-head"><div><span class="eyebrow">CENTRAL DE TREINO</span><h2>Escolha sua missão</h2></div><span class="section-note">01 — 04</span></div><div class="mission-grid">
<button class="mission-card" data-go="strength"><span class="mission-icon cyan">✦</span><span class="mission-label">MÓDULO 01</span><strong>Força</strong><small>Treinos A/B · Corpo todo</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-go="muaythai"><span class="mission-icon violet">🥊</span><span class="mission-label">MÓDULO 02</span><strong>Muay Thai</strong><small>Fundamentos · Coordenação</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-go="progress"><span class="mission-icon lime">▥</span><span class="mission-label">MÓDULO 03</span><strong>Desempenho</strong><small>XP · Histórico · Conquistas</small><span class="mission-arrow">↗</span></button>
<button class="mission-card" data-timer><span class="mission-icon orange">◷</span><span class="mission-label">FERRAMENTA</span><strong>Cronômetro</strong><small>Controle seu tempo</small><span class="mission-arrow">↗</span></button></div>
<section class="quote-strip"><span>“</span><div><b>DISCIPLINA ANTES DA INTENSIDADE.</b><small>Recuperação e técnica também fazem parte do treino.</small></div></section>`;}
function strengthPage(){const checks=state.checks?.[activeWorkout]||[];return `
<div class="page-hero"><span class="eyebrow">MÓDULO 01 / PREPARAÇÃO FÍSICA</span><h1 class="page-title">TREINO DE <em>FORÇA</em></h1><p>Escolha uma sessão e abra o guia de cada exercício. Os movimentos com mídia validada mostram vídeos reais; os demais recebem orientação escrita, sem animações improvisadas.</p></div>
<div class="workout-switch"><button class="workout-tab ${activeWorkout==="A"?"selected":""}" data-workout="A"><small>SESSÃO 01</small><b>TREINO A</b><span>Corpo todo</span></button><button class="workout-tab ${activeWorkout==="B"?"selected":""}" data-workout="B"><small>SESSÃO 02</small><b>TREINO B</b><span>Corpo todo</span></button></div>
<div class="coach-banner"><div class="coach-badge">▶<span>●</span></div><div><b>BIBLIOTECA DE DEMONSTRAÇÕES</b><small>Vídeos reais com autoria e licença identificadas.</small></div><span class="coach-live">● MÍDIA VALIDADA</span></div>
<div class="session-summary"><div><span class="eyebrow">SESSÃO SELECIONADA</span><b>Treino ${activeWorkout}</b></div><div><strong>06</strong><small>EXERCÍCIOS</small></div><div><strong>02</strong><small>SÉRIES BASE</small></div></div>
<section class="prep-panel"><div class="prep-heading"><span class="eyebrow">ANTES E DEPOIS DA SESSÃO</span><b>Preparação & recuperação</b></div><div class="prep-columns"><div><strong>↗ Aquecimento · 4–5 min</strong><p>1 min caminhando no lugar; 1 min de movimentos leves dos ombros; 1 min de mobilidade confortável de quadril e tornozelos; 1–2 min ensaiando os movimentos sem carga.</p></div><div><strong>↘ Volta à calma · 3–5 min</strong><p>Caminhe devagar, normalize a respiração e faça movimentos suaves. Alongue apenas se for confortável; não force nem tente ganhar amplitude à força.</p></div></div><small>Adapte o tempo ao seu conforto. Se houver dor, tontura ou mal-estar, pare e avise um responsável.</small></section>
<div class="section-head"><div><span class="eyebrow">CHECKLIST DA SESSÃO</span><h2>Aprenda e execute</h2></div><span class="section-note" id="checkedCount">0 / 6</span></div>
<div class="exercise-list">${plans[activeWorkout].map((x,i)=>`<article class="exercise-card coach-exercise"><input class="exercise-check" type="checkbox" data-exercise="${i}" ${checks.includes(i)?"checked":""}><span class="exercise-number">${String(i+1).padStart(2,"0")}</span><span class="exercise-info"><b>${x[0]}</b><strong>${x[1]}</strong><small>${x[2]}</small><small class="exercise-muscles">Trabalha: ${exerciseInfo[x[0]]?.primary||"Músculos de suporte"}</small><button class="demo-link" type="button" data-demo="${activeWorkout}-${i}">▶ Ver demonstração</button></span><span class="exercise-done">✓</span></article>`).join("")}</div>
<div class="session-footer"><div class="notice"><b>Treino responsável</b><br>Comece leve, aqueça antes e deixe 2–3 repetições de reserva. Interrompa se sentir dor, tontura ou mal-estar.</div><button class="btn secondary block" data-rest>⏱ Descanso entre séries</button><button class="btn block" id="finishWorkout">Finalizar sessão · +15 XP</button><button class="btn secondary block" data-timer>Iniciar cronômetro</button></div>`;}
const muayLessons=[
  {title:"Conhecendo o Muay Thai",tag:"INTRODUÇÃO",summary:"Origem, cultura, respeito e objetivo do esporte.",intro:"O Muay Thai é uma modalidade esportiva tradicional da Tailândia. Nesta primeira aula, vamos conhecer sua história, o ambiente de treino e a importância do respeito entre praticantes.",learn:"Entender que o Muay Thai é um esporte com regras, cultura, preparação física e responsabilidade — não uma ferramenta para procurar brigas.",observe:"Em uma aula orientada, repare na organização do espaço, nas instruções do professor e nos momentos de aquecimento e recuperação.",quiz:"Qual deve ser a prioridade de quem está começando?",options:["Aprender com segurança e respeitar as orientações","Treinar o mais forte possível desde o primeiro dia","Testar movimentos em outras pessoas"],answer:0},
  {title:"Segurança e ambiente de treino",tag:"FUNDAMENTOS",summary:"Professor, espaço adequado, equipamento e limites pessoais.",intro:"Uma aula segura tem supervisão qualificada, espaço livre, equipamento apropriado e regras claras. Cada pessoa aprende em seu ritmo.",learn:"Reconhecer quando uma atividade precisa de supervisão e comunicar desconforto, dor ou mal-estar.",observe:"Identifique onde ficam água, materiais, área de treino e orientações de segurança. Não faça contato físico ou exercícios de impacto por conta própria.",quiz:"Se surgir dor, tontura ou mal-estar durante uma atividade, o correto é:",options:["Ignorar e continuar","Parar e avisar o professor ou responsável","Aumentar a intensidade"],answer:1},
  {title:"Equilíbrio e consciência corporal",tag:"BASE",summary:"Estabilidade, postura confortável e percepção do corpo.",intro:"Equilíbrio é a capacidade de manter o corpo estável durante posições e movimentos cotidianos. A consciência corporal ajuda a perceber tensão e limites.",learn:"Identificar uma postura confortável, respirar naturalmente e perceber se o corpo está tenso ou instável.",observe:"Observe demonstrações gerais de postura feitas por um professor. A aula aqui é de análise e percepção, sem ensinar golpes ou movimentos de combate.",quiz:"Qual sinal indica que você deve ajustar a atividade?",options:["Respiração confortável","Tensão excessiva ou perda de equilíbrio","Conseguir prestar atenção"],answer:1},
  {title:"Atenção e postura defensiva",tag:"BASE",summary:"Concentração, autocontrole e finalidade da proteção.",intro:"No esporte, a postura defensiva faz parte de um conjunto de regras e responsabilidades. Nesta etapa, estudamos sua finalidade e a importância de manter a atenção às instruções.",learn:"Explicar por que proteção, autocontrole e respeito às regras são essenciais em uma modalidade de contato.",observe:"Assista a uma explicação de um professor e identifique os equipamentos de proteção e as regras do ambiente. Não simule confronto.",quiz:"A postura defensiva no esporte está ligada principalmente a:",options:["Proteção, atenção e respeito às regras","Provocar o colega","Dispensar supervisão"],answer:0},
  {title:"Movimentação e espaço",tag:"COORDENAÇÃO",summary:"Noções de espaço, ritmo e deslocamento seguro.",intro:"A movimentação esportiva depende de atenção ao espaço, ritmo adequado e controle. Antes de qualquer prática técnica, é importante compreender o ambiente e seguir a orientação presencial.",learn:"Reconhecer obstáculos, manter distância segura de outras pessoas e compreender por que movimentos devem ser aprendidos gradualmente.",observe:"Analise uma demonstração de deslocamento feita por instrutor qualificado. Não tente reproduzir sequências de combate ou movimentos rápidos sozinho.",quiz:"Antes de uma atividade orientada, o espaço deve estar:",options:["Livre de obstáculos e adequado à atividade","Cheio de objetos pelo chão","Compartilhado sem combinar distância"],answer:0},
  {title:"Preparação física e recuperação",tag:"CONDICIONAMENTO",summary:"Aquecimento geral, pausas, hidratação e descanso.",intro:"A preparação física inclui aquecimento geral, pausas adequadas, hidratação e recuperação. Evoluir não significa treinar até a exaustão.",learn:"Reconhecer a função do aquecimento, das pausas e do descanso na prática esportiva.",observe:"Converse com o professor sobre como adaptar a aula à sua experiência. Use apenas atividades leves e apropriadas, sem exercícios de impacto sem supervisão.",quiz:"Qual opção faz parte de uma rotina responsável?",options:["Descanso e hidratação adequados","Ignorar sinais de cansaço","Aumentar a carga todos os dias"],answer:0},
  {title:"Vocabulário dos socos",tag:"FUNDAMENTOS TÉCNICOS",summary:"Reconheça os nomes usados para classificar os socos no esporte.",intro:"Nesta aula, você vai conhecer o vocabulário usado para identificar quatro famílias de socos no Muay Thai: jab, direto, gancho e uppercut. O objetivo é reconhecer os nomes e compreender que são categorias esportivas, não instruções para executar movimentos.",learn:"Jab e direto são nomes usados para golpes retos; gancho e uppercut identificam outras trajetórias. A aula é de reconhecimento e linguagem esportiva, sem ensinar execução ou aplicação.",observe:"Em uma demonstração conduzida por professor, observe apenas como o instrutor identifica cada categoria e explica as regras. Não pratique golpes em pessoas ou objetos.",quiz:"Quais são quatro nomes comuns da família dos socos?",options:["Jab, direto, gancho e uppercut","Agachamento, prancha, ponte e corrida","Aquecimento, pausa, água e descanso"],answer:0},
  {title:"Jab e direto: nomes e contexto",tag:"FAMÍLIA DOS SOCOS",summary:"Entenda a nomenclatura dos golpes retos e o papel das regras.",intro:"Jab e direto são termos usados para classificar socos de trajetória reta. Nesta etapa, o foco é reconhecer os nomes em uma explicação esportiva e entender que a aplicação depende de regras, controle e supervisão.",learn:"Diferenciar os termos jab e direto como categorias de nomenclatura. Não é uma aula de mecânica, potência, distância ou combinação de golpes.",observe:"Ao assistir a uma aula supervisionada, escute o professor nomear os movimentos e explicar os limites da atividade. A prática técnica deve ficar a cargo do instrutor.",quiz:"Nesta trilha, o que você deve aprender sobre jab e direto?",options:["Reconhecer os nomes e o contexto esportivo","Treinar potência sozinho","Testar os movimentos em outra pessoa"],answer:0},
  {title:"Gancho e uppercut: nomes e contexto",tag:"FAMÍLIA DOS SOCOS",summary:"Conheça os termos e diferencie as categorias pelo vocabulário.",intro:"Gancho e uppercut são outros dois nomes comuns na classificação dos socos. O objetivo aqui é aprender o vocabulário e compreender que diferentes modalidades e professores podem explicar as categorias com recursos didáticos próprios.",learn:"Reconhecer os termos gancho e uppercut em materiais educativos. Esta aula não ensina trajetórias corporais, alvos, execução ou combinações.",observe:"Em conteúdo educativo apropriado, identifique quando o instrutor apresenta esses nomes e quais regras de segurança ele reforça. Não reproduza golpes sem orientação presencial.",quiz:"Gancho e uppercut são apresentados nesta aula como:",options:["Nomes de categorias de socos","Exercícios de alongamento","Equipamentos de proteção"],answer:0},
  {title:"Regras, controle e arbitragem",tag:"ESPORTE RESPONSÁVEL",summary:"Por que regras, arbitragem e controle fazem parte do esporte.",intro:"O Muay Thai esportivo acontece dentro de regras, com arbitragem, supervisão e limites definidos. Conhecer esses elementos ajuda a entender a modalidade como esporte e reforça que treino não é confronto fora do ambiente apropriado.",learn:"Identificar o papel do árbitro, respeitar interrupções e entender que segurança e consentimento são indispensáveis em qualquer atividade esportiva.",observe:"Assista a uma explicação de regras e procure identificar como o árbitro organiza a atividade e interrompe situações inadequadas. Não simule lutas.",quiz:"Qual é a função das regras e da arbitragem?",options:["Organizar a prática e proteger participantes","Incentivar atitudes fora de controle","Permitir contato sem supervisão"],answer:0}
];
function muayPage(){const done=state.lessonDone||[],total=muayLessons.length,completed=muayLessons.filter((_,i)=>done.includes(i)).length,unlocked=muayLessons.filter((_,i)=>i===0||done.includes(i-1)||done.includes(i)).length;return `
<div class="page-hero muay-hero"><span class="eyebrow red-eyebrow">FIGHTQUEST / ACADEMIA EXCLUSIVA</span><h1 class="page-title">MUAY <em>THAI</em></h1><p>Uma trilha progressiva: cultura, segurança, preparação física e fundamentos esportivos, com foco em reconhecimento e regras.</p></div>
<section class="muay-academy-banner"><div class="muay-academy-emblem">🥊</div><div class="muay-academy-copy"><span>PROGRAMA DE FORMAÇÃO</span><b>Academia FightQuest</b><small>Estude cada módulo e avance no seu ritmo.</small></div><div class="muay-academy-count"><strong>${completed}/${total}</strong><small>AULAS</small></div><div class="progress-track red-track"><div class="progress-fill red-fill" style="width:${completed/total*100}%"></div></div></section>
<div class="muay-stats-row"><div><b>${completed} de ${total}</b><small>concluídas</small></div><div><b>${unlocked} liberadas</b><small>na trilha</small></div><div><b>+5 XP</b><small>por aula</small></div></div>
<div class="level-heading"><div><span class="eyebrow red-eyebrow">TRILHA PROGRESSIVA</span><h2>Seu caminho de aprendizagem</h2></div><span class="level-total">${String(total).padStart(2,"0")} ETAPAS</span></div>
<div class="level-path muay-level-path">${muayLessons.map((l,i)=>{const isDone=done.includes(i),open=i===0||done.includes(i-1)||isDone;return `<article class="level-card muay-level-card ${isDone?"level-done":""} ${!open?"level-locked":""}"><div class="level-number">${isDone?"✓":String(i+1).padStart(2,"0")}</div><div class="level-copy"><span>${l.tag} · AULA ${i+1}</span><b>${l.title}</b><small>${l.summary}</small></div><button class="level-open" data-level="${i}" ${!open?"disabled":""}>${isDone?"Revisar":open?"Iniciar":"🔒 Bloqueada"}</button></article>`;}).join("")}</div>
<div class="notice muay-safety-note"><b>Regra da academia</b><br>Esta trilha ensina conceitos e segurança. Técnicas de contato, golpes, saco e sparring só devem ser aprendidos presencialmente com professor qualificado, equipamento adequado e autorização do responsável.</div>`;}function coachAvatar(motion,label){
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
const muayVisuals=[
  {kind:"poster",symbol:"🇹🇭",title:"Cultura e tradição",caption:"Conheça a origem tailandesa, os valores de respeito e a história do esporte."},
  {kind:"poster",symbol:"🛡️",title:"Ambiente e proteção",caption:"Reconheça o espaço de treino, a supervisão e os equipamentos de proteção."},
  {kind:"video",src:"https://www.youtube-nocookie.com/embed/GVEJIzsQKqw",open:"https://www.youtube.com/watch?v=GVEJIzsQKqw",title:"Coordenação e estabilidade",caption:"Demonstração de bird dog, um exercício geral de coordenação e estabilidade do tronco. Não é uma técnica de luta."},
  {kind:"poster",symbol:"🥊",title:"Proteção e regras",caption:"Veja os elementos de proteção esportiva e lembre-se: o professor confere o equipamento antes da prática."},
  {kind:"poster",symbol:"↔️",title:"Consciência do espaço",caption:"Observe a organização da área, os limites demarcados e a distância segura entre participantes."},
  {kind:"video",src:"https://www.dvidshub.net/video/embed/517502",open:"https://www.dvidshub.net/video/517502/body-weight-squat",title:"Preparação física geral",caption:"Demonstração de agachamento com peso corporal, exercício geral de condicionamento — não é uma técnica de Muay Thai."},
  {kind:"poster",symbol:"FQ",title:"Mapa das categorias de socos",caption:"Painel de vocabulário: jab e direto são termos para socos retos; gancho e uppercut são outras categorias. Reconhecimento conceitual, sem instruções de execução."},
  {kind:"poster",symbol:"JAB",title:"Jab e direto",caption:"Dois termos usados para classificar socos retos. Aprenda a reconhecer os nomes em explicações supervisionadas; esta aula não ensina a executar golpes."},
  {kind:"poster",symbol:"HOOK",title:"Gancho e uppercut",caption:"Termos usados para outras categorias de socos. O painel ensina nomenclatura esportiva, não trajetórias, alvos ou combinações."},
  {kind:"poster",symbol:"RULES",title:"Regras e arbitragem",caption:"A prática esportiva exige regras claras, arbitragem, supervisão, respeito aos limites e interrupção quando necessário."}
];
function muayVisualMarkup(i){
  const v=muayVisuals[i];if(!v)return "";
  if(v.kind==="video")return `<section class="muay-visual-demo muay-video-complement"><div class="muay-visual-heading"><span>PREPARAÇÃO FÍSICA COMPLEMENTAR · NÃO É TÉCNICA DE LUTA</span><b>${v.title}</b></div><div class="demo-video-wrap demo-embed-wrap"><iframe src="${v.src}" title="${v.title}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p>${v.caption}</p><a href="${v.open}" target="_blank" rel="noopener noreferrer">Se o vídeo não carregar, abrir fora do app ↗</a></section>`;
  const art=[
    '<div class="muay-info-seal"><b>THAI</b><span>CULTURA</span><small>RESPEITO · TRADIÇÃO</small></div>',
    '<div class="muay-info-steps"><span><i>01</i><b>PROFESSOR</b><small>supervisão</small></span><span><i>02</i><b>ESPAÇO</b><small>área livre</small></span><span><i>03</i><b>PROTEÇÃO</b><small>equipamento</small></span></div>',
    '<div class="muay-info-shield"><b>FQ</b><span>SEGURANÇA</span><small>REGRAS E ORIENTAÇÃO</small></div>',
    '<div class="muay-info-space"><span class="space-dot">PESSOA A</span><i>DISTÂNCIA SEGURA</i><span class="space-dot">PESSOA B</span></div>',
    '<div class="muay-punch-map"><b>FAMÍLIA DOS SOCOS</b><span>JAB</span><span>DIRETO</span><span>GANCHO</span><span>UPPERCUT</span><small>VOCABULÁRIO ESPORTIVO</small></div>',
    '<div class="muay-punch-map"><b>SOCOS RETOS</b><span>JAB</span><span>DIRETO</span><small>RECONHECER OS NOMES</small></div>',
    '<div class="muay-punch-map"><b>OUTRAS CATEGORIAS</b><span>GANCHO</span><span>UPPERCUT</span><small>RECONHECER OS NOMES</small></div>',
    '<div class="muay-rules-map"><b>REGRAS</b><span>SUPERVISÃO</span><span>ARBITRAGEM</span><span>RESPEITO</span><small>SEGURANÇA EM PRIMEIRO LUGAR</small></div>'
  ];
  return `<section class="muay-visual-demo muay-visual-poster"><div class="muay-visual-heading"><span>PAINEL ILUSTRADO DE APRENDIZAGEM</span><b>${v.title}</b></div><div class="muay-poster-art muay-poster-${i}">${art[i]||'<b>FIGHTQUEST</b>'}<i>FQ</i></div><p>${v.caption}</p></section>`;
}
function openLevel(i){
  const data=muayLessons[i];if(!data)return;
  const done=(state.lessonDone||[]).includes(i),unlocked=i===0||(state.lessonDone||[]).includes(i-1)||done;
  if(!unlocked){toast("Conclua a etapa anterior para liberar esta aula.");return;}
  const launch=document.createElement("div");launch.className="muay-launch-screen";launch.setAttribute("role","status");
  launch.innerHTML=`<div class="muay-launch-orbit"><span>FQ</span><i></i><b></b></div><span class="eyebrow red-eyebrow">FIGHTQUEST / ACADEMIA</span><h2>${data.title}</h2><p>Preparando sua aula e os objetivos de aprendizagem…</p><div class="muay-launch-bar"><i></i></div><small>ETAPA ${String(i+1).padStart(2,"0")} · ${data.tag}</small>`;
  document.body.append(launch);
  window.setTimeout(()=>{
    if(!launch.isConnected)return;
    launch.remove();
    const modal=document.createElement("div");modal.className="modal-backdrop muay-modal-backdrop";modal.id="muayLessonModal";
    modal.innerHTML=`<section class="lesson-modal coach-lesson muay-lesson-modal" aria-labelledby="muayLessonTitle"><button class="modal-close" id="closeLevel" aria-label="Fechar">×</button><span class="eyebrow red-eyebrow">ACADEMIA FIGHTQUEST / AULA ${String(i+1).padStart(2,"0")}</span><div class="lesson-visual-card muay-lesson-art"><span>${data.tag} · TRILHA ${i+1}/${muayLessons.length}</span><strong>${data.title}</strong><p>Conteúdo exclusivo de estudo FightQuest</p></div>${muayVisualMarkup(i)}<h2 id="muayLessonTitle">Objetivo da aula</h2><p class="muay-lesson-text">${data.intro}</p><div class="lesson-detail"><b>O QUE VOCÊ VAI APRENDER</b><p>${data.learn}</p></div><div class="lesson-detail"><b>OBSERVAÇÃO GUIADA</b><p>${data.observe}</p></div><div class="muay-quiz"><span class="eyebrow red-eyebrow">CHECAGEM DE APRENDIZAGEM</span><b>${data.quiz}</b><div class="muay-quiz-options">${data.options.map((option,j)=>`<label><input type="radio" name="muayAnswer" value="${j}"><span>${option}</span></label>`).join("")}</div><p class="muay-quiz-feedback" id="muayQuizFeedback" role="status">${done?"Esta aula já consta no seu histórico. Você pode revisá-la.":"Escolha uma resposta para registrar a conclusão."}</p></div><button class="btn block" id="checkMuayLesson">${done?"Aula concluída ✓":"Verificar e concluir aula · +5 XP"}</button><small class="muay-lesson-footnote">Aprendizado teórico e de segurança. A prática técnica deve ser orientada presencialmente.</small></section>`;
    document.body.append(modal);
    const close=()=>{modal.remove();document.removeEventListener("keydown",onKey);};
    const onKey=e=>{if(e.key==="Escape")close();};document.addEventListener("keydown",onKey);
    modal.querySelector("#closeLevel").onclick=close;modal.onclick=e=>{if(e.target===modal)close();};
    const check=modal.querySelector("#checkMuayLesson"),feedback=modal.querySelector("#muayQuizFeedback");
    if(done){check.disabled=true;check.onclick=()=>{};return;}
    check.onclick=()=>{
      const selected=modal.querySelector('input[name="muayAnswer"]:checked');
      if(!selected){feedback.textContent="Selecione uma alternativa antes de continuar.";feedback.classList.remove("is-correct");return;}
      if(+selected.value!==data.answer){feedback.textContent="Ainda não. Releia o objetivo da aula e tente novamente.";feedback.classList.remove("is-correct");return;}
      state.lessonDone=state.lessonDone||[];if(!state.lessonDone.includes(i)){state.lessonDone.push(i);state.xp+=5;state.completed.push(Date.now());save();}
      feedback.textContent="Resposta correta! Etapa registrada e próxima aula liberada.";feedback.classList.add("is-correct");check.textContent="Concluída ✓";check.disabled=true;toast("Aula concluída! +5 XP");
      window.setTimeout(()=>{close();page("muaythai");},850);
    };
  },850);
}function exerciseMotion(group,index){const name=plans[group][index]?.[0]||"";const map={"Agachamento":"squat","Flexão inclinada":"pushup","Remada com mochila leve":"row","Ponte de glúteos":"glute-bridge","Elevação de panturrilha":"calf-raise","Dead bug":"dead-bug","Afundo alternado":"lunge","Flexão com joelhos":"pushup","Levantamento romeno leve":"hinge","Rosca com mochila leve":"curl","Bird dog":"bird-dog","Aperto de toalha":"isometric"};return "exercise-"+(map[name]||"squat");}
const exerciseInfo={
  "Agachamento":{primary:"Quadríceps e glúteo máximo",secondary:"Posterior da coxa, adutores e músculos do tronco",action:"Treina a extensão dos joelhos e quadris para sentar e levantar, além de exigir equilíbrio e estabilidade."},
  "Flexão inclinada":{primary:"Peitoral maior",secondary:"Tríceps, parte frontal dos ombros e estabilizadores do tronco",action:"Treina o movimento de empurrar e a estabilidade do corpo em linha. O apoio elevado diminui a parte do peso corporal que precisa ser empurrada."},
  "Remada com mochila leve":{primary:"Latíssimo do dorso e músculos entre as escápulas",secondary:"Bíceps, deltoide posterior e estabilizadores da coluna",action:"Treina o movimento de puxar, aproximando os braços do tronco e ajudando a controlar as escápulas."},
  "Ponte de glúteos":{primary:"Glúteo máximo",secondary:"Posterior da coxa e músculos estabilizadores do abdômen",action:"Treina a extensão do quadril e o controle da pelve, sem precisar arquear a lombar."},
  "Elevação de panturrilha":{primary:"Gastrocnêmio e sóleo (panturrilha)",secondary:"Músculos menores que estabilizam o tornozelo e o pé",action:"Treina a flexão plantar do tornozelo, movimento usado para elevar o calcanhar ao ficar na ponta dos pés."},
  "Dead bug":{primary:"Transverso e reto abdominal",secondary:"Oblíquos, flexores do quadril e estabilizadores profundos do tronco",action:"Treina a capacidade de manter o tronco estável enquanto braços e pernas se movimentam alternadamente."},
  "Afundo alternado":{primary:"Quadríceps e glúteos",secondary:"Posterior da coxa, panturrilhas e músculos que estabilizam o quadril",action:"Treina força unilateral, equilíbrio e controle do quadril e dos joelhos durante a passada."},
  "Flexão com joelhos":{primary:"Peitoral maior",secondary:"Tríceps, parte frontal dos ombros e estabilizadores do tronco",action:"Treina o movimento de empurrar com menor alavanca e menor exigência que a flexão tradicional."},
  "Levantamento romeno leve":{primary:"Posterior da coxa e glúteo máximo",secondary:"Eretores da coluna, abdômen e músculos das costas que estabilizam",action:"Treina o padrão de dobrar o quadril para trás e estendê-lo novamente, mantendo a coluna neutra."},
  "Rosca com mochila leve":{primary:"Bíceps braquial",secondary:"Braquial e braquiorradial (antebraço)",action:"Treina a flexão do cotovelo, aproximando a mão do ombro. O tronco deve ficar quieto, sem embalo."},
  "Bird dog":{primary:"Estabilizadores profundos do tronco e glúteos",secondary:"Deltoides, músculos das costas e estabilizadores do quadril",action:"Treina coordenação entre lados opostos do corpo e estabilidade do tronco enquanto um braço e a perna contrária se estendem."},
  "Aperto de toalha":{primary:"Flexores dos dedos e músculos da mão",secondary:"Músculos do antebraço responsáveis pela pegada",action:"Treina a força de preensão manual, útil para segurar objetos. É um exercício local para mãos e antebraços."}
};
function openExerciseDemo(key){
  const [group,index]=key.split("-"),item=plans[group][+index];
  if(!item)return;
  const mediaByName={
    "Agachamento":{
      kind:"embed",src:"https://www.dvidshub.net/video/embed/517502",
      credit:"U.S. Marine Corps · DVIDS",license:"Domínio público (DVIDS)",
      source:"https://www.dvidshub.net/video/517502/body-weight-squat",
      note:"Vídeo de agachamento com o peso do próprio corpo, sem barra ou halteres."
    },
    "Flexão inclinada":{
      kind:"embed",src:"https://player.vimeo.com/video/76827072",open:"https://vimeo.com/76827072",
      credit:"MoveSkill",license:"Vídeo externo incorporado",
      source:"https://vimeo.com/76827072",
      note:"Demonstra uma flexão inclinada com apoio elevado. Confira se a altura do apoio é estável e mantenha o corpo alinhado."
    },
    "Flexão com joelhos":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/X9sGmsGYYE0",open:"https://www.youtube.com/watch?v=X9sGmsGYYE0",
      credit:"PureGym · referência via Tanrenica",license:"Vídeo externo incorporado",
      source:"https://tanrenica.com/exercises/knee-push-up?lang=pt",
      note:"Demonstra a flexão com joelhos apoiados. O vídeo é do YouTube; se o player não carregar, use o link externo."
    },
    "Aperto de toalha":{
      kind:"embed",src:"https://player.vimeo.com/video/329687341",open:"https://vimeo.com/329687341",
      credit:"E-rehab",license:"Vídeo externo incorporado",
      source:"https://vimeo.com/329687341",
      note:"Demonstra um aperto de toalha para trabalhar a pegada. Faça uma contração confortável e solte sem forçar os dedos."
    },
    "Remada com mochila leve":{
      kind:"video",src:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Bent-over_row_-_exercise_demonstration_video.webm",mime:"video/webm",
      credit:"FitnessScape",license:"Creative Commons BY 3.0",
      source:"https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm",
      note:"Demonstra a trajetória da remada curvada. O equipamento do vídeo pode ser diferente da mochila leve sugerida; não copie a carga mostrada."
    },
    "Afundo alternado":{
      kind:"embed",src:"https://www.dvidshub.net/video/embed/692857",open:"https://www.dvidshub.net/video/692857/reverse-lunge",
      credit:"U.S. Marine Corps · DVIDS",license:"Domínio público (DVIDS)",
      source:"https://www.dvidshub.net/video/692857/reverse-lunge",
      note:"Demonstra um afundo reverso com peso corporal. Alterne as pernas a cada repetição; mantenha o pé da frente apoiado e faça o movimento com controle."
    },
    "Ponte de glúteos":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/6VP5KFF54N0",open:"https://www.youtube.com/watch?v=6VP5KFF54N0",
      credit:"Sport Keele · Keele University",license:"Vídeo externo incorporado",
      source:"https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/",
      note:"Demonstra a ponte de glúteos no chão, com controle do quadril."
    },
    "Elevação de panturrilha":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/LFfmd7lzVWQ",open:"https://www.youtube.com/watch?v=LFfmd7lzVWQ",
      credit:"Sport Keele · Keele University",license:"Vídeo externo incorporado",
      source:"https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/",
      note:"Demonstra elevação de panturrilha no chão. Use apoio estável se precisar de equilíbrio."
    },
    "Dead bug":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/Gse7WT-spEQ",open:"https://www.youtube.com/watch?v=Gse7WT-spEQ",
      credit:"Sport Keele · Keele University",license:"Vídeo externo incorporado",
      source:"https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/",
      note:"Demonstra o dead bug. Mantenha o tronco estável e mova braços e pernas de forma controlada."
    },
    "Bird dog":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/GVEJIzsQKqw",open:"https://www.youtube.com/watch?v=GVEJIzsQKqw",
      credit:"Sport Keele · Keele University",license:"Vídeo externo incorporado",
      source:"https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/",
      note:"Demonstra o bird dog, estendendo braço e perna opostos sem girar o tronco."
    },
    "Rosca com mochila leve":{
      kind:"embed",src:"https://player.vimeo.com/video/265912003",open:"https://vimeo.com/265912003",
      credit:"Elite Force Gear",license:"Vídeo externo incorporado",
      source:"https://vimeo.com/265912003",
      note:"Demonstra uma rosca de bíceps usando uma bolsa de carga. Use apenas uma mochila leve e bem fechada; mantenha os cotovelos próximos ao tronco e não balance o corpo."
    },
    "Levantamento romeno leve":{
      kind:"embed",src:"https://www.youtube-nocookie.com/embed/6kkQ2IV6Ymo",open:"https://www.youtube.com/watch?v=6kkQ2IV6Ymo",
      credit:"Sport Keele · Keele University",license:"Vídeo externo incorporado",
      source:"https://www.keele.ac.uk/sportatkeele/activekeele/exerciselibrary/",
      note:"Demonstra o padrão de dobradiça do quadril do levantamento romeno. O equipamento pode diferir; não copie a carga do vídeo."
    }
  };
  const media=mediaByName[item[0]];
  const mediaMarkup=media
    ? media.kind==="video"
      ? `<div class="demo-video-wrap"><video controls playsinline preload="metadata"><source src="${media.src}" type="${media.mime}">Seu navegador não conseguiu carregar este vídeo.</video></div>`
      : media.kind==="embed"
        ? `<div class="demo-video-wrap demo-embed-wrap"><iframe src="${media.src}" title="Demonstração de ${item[0]}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>${media.open?`<p class="demo-external-link"><a href="${media.open}" target="_blank" rel="noopener noreferrer">Se não carregar, abrir vídeo fora do app ↗</a></p>`:"" }`
        : `<div class="demo-video-wrap demo-gif-wrap"><img src="${media.src}" alt="Demonstração animada de elevação de panturrilha" loading="lazy"></div>`
    : `<div class="demo-placeholder"><span>GUIA DE MOVIMENTO</span><b>Vídeo ainda não disponível para este exercício</b><p>Não vamos mostrar um vídeo de outro movimento como se fosse este. Use as orientações escritas abaixo.</p></div>`;
  const steps=[
    "Prepare um espaço livre e confira se o apoio ou equipamento está firme.",
    "Faça o movimento devagar, respirando naturalmente e sem forçar a amplitude.",
    "Pare se sentir dor, tontura ou mal-estar. A técnica deve ser confortável e controlada."
  ];
  const m=document.createElement("div");
  m.className="modal-backdrop";
  m.innerHTML=`<section class="lesson-modal coach-lesson demo-video-modal"><button class="modal-close" id="closeDemo" aria-label="Fechar">×</button><span class="eyebrow">GUIA DE MOVIMENTO / MUSCULAÇÃO</span><h2>${item[0]}</h2><div class="demo-rep-count"><b>${item[1]}</b><span>REFERÊNCIA INICIAL · AJUSTE AO CONFORTO</span></div>${mediaMarkup}<div class="demo-media-credit">${media?`Mídia: <b>${media.credit}</b> · ${media.license} · <a href="${media.source}" target="_blank" rel="noopener noreferrer">Ver fonte</a>`:"Sem mídia validada para este exercício."}</div><div class="demo-caption"><b>OBSERVAÇÃO</b><p>${media?media.note:item[2]}</p></div><section class="demo-anatomy"><div><span>MÚSCULOS PRINCIPAIS</span><b>${exerciseInfo[item[0]]?.primary||"—"}</b></div><div><span>MÚSCULOS AUXILIARES</span><b>${exerciseInfo[item[0]]?.secondary||"—"}</b></div><div><span>O QUE O MOVIMENTO FAZ</span><p>${exerciseInfo[item[0]]?.action||item[2]}</p></div></section><div class="demo-steps">${steps.map((s,i)=>`<div><span>0${i+1}</span><p>${s}</p></div>`).join("")}</div><div class="lesson-detail"><b>LEMBRETE</b><p>${item[2]} Se tiver dúvidas sobre a execução, peça orientação presencial a um profissional qualificado.</p></div></section>`;
  document.body.append(m);
  const close=()=>{m.remove();document.removeEventListener("keydown",onKey);};
  const onKey=e=>{if(e.key==="Escape")close();};
  document.addEventListener("keydown",onKey);
  m.querySelector("#closeDemo").onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
}
function progressPage(){const total=state.sessions.length,strength=state.sessions.filter(s=>s.name.includes("Força")).length,thai=state.sessions.filter(s=>s.name.includes("Muay")).length,days=trainingDays(),streak=currentStreak(),badges=achievements();return `
<div class="page-hero"><span class="eyebrow">MÓDULO 03 / DADOS DO ATLETA</span><h1 class="page-title">SEU <em>DESEMPENHO</em></h1><p>Veja sessões, dias ativos, sequência e conquistas registradas neste aparelho.</p></div>
<div class="stats-grid"><div class="stat-card"><span>XP TOTAL</span><b>${state.xp}</b><small>Experiência acumulada</small></div><div class="stat-card"><span>NÍVEL</span><b>${1+Math.floor(state.xp/100)}</b><small>${100-state.xp%100} XP para subir</small></div><div class="stat-card"><span>SESSÕES</span><b>${total}</b><small>Treinos finalizados</small></div><div class="stat-card"><span>DIAS ATIVOS</span><b>${days.length}</b><small>Dias diferentes com registro</small></div><div class="stat-card"><span>SEQUÊNCIA</span><b>${streak}</b><small>Dias consecutivos atuais</small></div><div class="stat-card"><span>AULAS</span><b>${(state.lessonDone||[]).length}</b><small>Fundamentos estudados</small></div></div>
<div class="section-head"><div><span class="eyebrow">CONQUISTAS</span><h2>Marcos desbloqueáveis</h2></div><span class="section-note">${badges.filter(x=>x[2]).length}/${badges.length}</span></div><div class="list">${badges.map(b=>`<div class="list-row"><span class="card-icon ${b[2]?"lime":"purple"}">${b[3]}</span><div class="grow"><strong>${b[0]}</strong><small>${b[1]}</small></div><span class="pill">${b[2]?"DESBLOQUEADA":"BLOQUEADA"}</span></div>`).join("")}</div>
<div class="section-head"><div><span class="eyebrow">DISTRIBUIÇÃO</span><h2>Atividade registrada</h2></div></div><div class="card performance-card"><div class="performance-row"><span>Musculação</span><b>${strength}</b></div><div class="progress-track"><div class="progress-fill" style="width:${total?strength/total*100:0}%"></div></div><div class="performance-row"><span>Muay Thai / fundamentos</span><b>${thai}</b></div><div class="progress-track"><div class="progress-fill violet-fill" style="width:${total?thai/total*100:0}%"></div></div></div>
<div class="section-head"><div><span class="eyebrow">LINHA DO TEMPO</span><h2>Últimas sessões</h2></div></div><div class="history-list">${total?state.sessions.slice(-12).reverse().map(s=>`<div class="history-item"><span class="history-dot"></span><div><b>${s.name}</b><small>${new Date(s.date).toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})}</small></div><strong>+${s.xp} XP</strong></div>`).join(""):'<div class="empty-state">Seu histórico aparecerá aqui depois da primeira sessão registrada.</div>'}</div>`;}
function profilePage(){const badges=achievements();return `
<div class="page-hero"><span class="eyebrow">CENTRAL DO ATLETA</span><h1 class="page-title">MEU <em>PERFIL</em></h1><p>Preferências, dados e controle do seu progresso.</p></div>
<div class="profile-banner"><div class="profile-avatar">FQ</div><div><span class="eyebrow">ATLETA FIGHTQUEST</span><h2>Nível ${1+Math.floor(state.xp/100)}</h2><small>Iniciante · Projeto de 90 dias</small></div></div>
<div class="section-head"><div><span class="eyebrow">SEU KIT</span><h2>Equipamentos</h2></div></div><div class="profile-row"><span>▰</span><div><b>Mochila leve e toalha</b><small>Use somente carga leve, bem fechada e estável</small></div><i>Disponível</i></div><div class="profile-row"><span>⌂</span><div><b>Espaço em casa</b><small>Área livre e piso que não escorregue</small></div><i>Disponível</i></div>
<div class="section-head"><div><span class="eyebrow">CONQUISTAS</span><h2>${badges.filter(x=>x[2]).length} desbloqueadas</h2></div></div><p class="fine-print">Consulte a aba Evolução para ver todos os marcos e requisitos.</p>
<div class="section-head"><div><span class="eyebrow">CONTROLE DE DADOS</span><h2>Seus registros</h2></div></div><button class="btn secondary block" id="exportBtn">Exportar progresso em JSON ↓</button><button class="btn danger-outline block" id="resetBtn">Apagar todo o progresso</button><p class="fine-print">Os registros ficam salvos neste navegador/aparelho. Esta versão ainda não sincroniza entre dispositivos. Exporte um backup antes de limpar os dados do navegador.</p>`;}
function bind(){if($("#checkedCount"))updateChecked();document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>page(b.dataset.go));document.querySelectorAll("[data-workout]").forEach(b=>b.onclick=()=>{activeWorkout=b.dataset.workout;page("strength");});document.querySelectorAll("[data-timer]").forEach(b=>b.onclick=openTimer);document.querySelectorAll("[data-rest]").forEach(b=>b.onclick=openRestTimer);document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(+b.dataset.lesson));document.querySelectorAll("[data-level]").forEach(b=>b.onclick=()=>openLevel(+b.dataset.level));document.querySelectorAll("[data-demo]").forEach(b=>b.onclick=()=>openExerciseDemo(b.dataset.demo));document.querySelectorAll("[data-exercise]").forEach(b=>b.onchange=updateChecked);const finish=$("#finishWorkout");if(finish)finish.onclick=finishSession;const exp=$("#exportBtn");if(exp)exp.onclick=exportData;const reset=$("#resetBtn");if(reset)reset.onclick=resetData;}
function updateChecked(){const boxes=[...document.querySelectorAll("[data-exercise]")];const checked=boxes.filter(x=>x.checked).map(x=>+x.dataset.exercise);state.checks=state.checks||{};state.checks[activeWorkout]=checked;save();const n=checked.length;$("#checkedCount").textContent=n+" / 6";$("#finishWorkout").textContent=n===6?"Finalizar sessão · +15 XP":"Marque os exercícios feitos · "+n+"/6";$("#finishWorkout").disabled=n!==6;}
function finishSession(){const n=document.querySelectorAll("[data-exercise]:checked").length;if(n!==6){toast("Marque os seis exercícios antes de concluir.");return;}record("Força · Treino "+activeWorkout,15);state.checks[activeWorkout]=[];save();page("progress");}
function record(name,xp){state.xp+=xp;state.completed.push(Date.now());state.sessions.push({name,date:new Date().toISOString(),xp});save();toast("Registro salvo! +"+xp+" XP");}
function openLesson(i){const l=lessons[i],done=(state.lessonDone||[]).includes(i);const modal=document.createElement("div");modal.className="modal-backdrop";modal.id="lessonModal";modal.innerHTML=`<section class="lesson-modal"><button class="modal-close" id="closeLesson" aria-label="Fechar">×</button><span class="eyebrow">AULA ${String(i+1).padStart(2,"0")} / FUNDAMENTOS</span><div class="modal-emblem">🥊</div><h2>${l[0]}</h2><p class="modal-lead">${l[1]}</p><div class="lesson-detail"><b>${l[2]}</b><p>${l[3]}</p></div><div class="lesson-detail"><b>${l[4]}</b><p>${l[5]}</p></div><div class="notice"><b>Aprendizado seguro</b><br>Não pratique golpes de impacto por conta própria. Use esta aula para estudar conceitos e procure um professor para correção técnica.</div><button class="btn block" id="completeLesson">${done?"Aula já concluída ✓":"Marcar aula como estudada · +5 XP"}</button></section>`;document.body.append(modal);const close=()=>{modal.remove();document.removeEventListener("keydown",onKey);};const onKey=e=>{if(e.key==="Escape")close();};document.addEventListener("keydown",onKey);$("#closeLesson").onclick=close;modal.onclick=e=>{if(e.target===modal)close();};$("#completeLesson").onclick=()=>{if(!done){state.lessonDone=state.lessonDone||[];state.lessonDone.push(i);state.xp+=5;state.completed.push(Date.now());save();toast("Aula registrada! +5 XP");}modal.remove();page("muaythai");};}
function openTimer(){if($("#timerModal"))return;timerSeconds=0;const m=document.createElement("div");m.className="modal-backdrop";m.id="timerModal";m.innerHTML='<section class="timer-modal"><button class="modal-close" id="closeTimer">×</button><span class="eyebrow">FERRAMENTA / TEMPO</span><h2>Cronômetro de treino</h2><div class="timer-display" id="timerValue">00:00</div><div class="timer-actions"><button class="btn" id="timerToggle">Iniciar</button><button class="btn secondary" id="timerReset">Zerar</button></div><p class="fine-print">Use pausas adequadas e ajuste a duração ao seu condicionamento.</p></section>';document.body.append(m);$("#closeTimer").onclick=closeTimer;$("#timerToggle").onclick=()=>{if(timerId){clearInterval(timerId);timerId=null;$("#timerToggle").textContent="Continuar";}else{timerId=setInterval(()=>{timerSeconds++;$("#timerValue").textContent=String(Math.floor(timerSeconds/60)).padStart(2,"0")+":"+String(timerSeconds%60).padStart(2,"0");},1000);$("#timerToggle").textContent="Pausar";}};$("#timerReset").onclick=()=>{clearInterval(timerId);timerId=null;timerSeconds=0;$("#timerValue").textContent="00:00";$("#timerToggle").textContent="Iniciar";};}
function openRestTimer(){
  if($("#restModal"))return;
  let remaining=60, running=false, interval=null;
  const format=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
  const m=document.createElement("div");m.className="modal-backdrop";m.id="restModal";
  m.innerHTML='<section class="timer-modal rest-modal"><button class="modal-close" id="closeRest" aria-label="Fechar">×</button><span class="eyebrow">FERRAMENTA / RECUPERAÇÃO</span><h2>Descanso entre séries</h2><p class="fine-print">Escolha uma pausa confortável. Não precisa correr para voltar ao exercício.</p><div class="rest-presets"><button class="rest-preset" data-seconds="30">30 s</button><button class="rest-preset selected" data-seconds="60">60 s</button><button class="rest-preset" data-seconds="90">90 s</button><button class="rest-preset" data-seconds="120">2 min</button></div><div class="timer-display" id="restValue">01:00</div><p class="rest-status" id="restStatus" role="status">Pronto para iniciar</p><div class="timer-actions"><button class="btn" id="restToggle">Iniciar pausa</button><button class="btn secondary" id="restReset">Reiniciar</button></div></section>';
  document.body.append(m);
  const value=m.querySelector("#restValue"),status=m.querySelector("#restStatus"),toggle=m.querySelector("#restToggle");
  const stop=()=>{if(interval)clearInterval(interval);interval=null;running=false;};
  const close=()=>{stop();m.remove();document.removeEventListener("keydown",onKey);};
  const onKey=e=>{if(e.key==="Escape")close();};
  const render=()=>{value.textContent=format(remaining);};
  const reset=n=>{stop();remaining=n;render();status.textContent="Pronto para iniciar";toggle.textContent="Iniciar pausa";};
  m.querySelectorAll("[data-seconds]").forEach(b=>b.onclick=()=>{m.querySelectorAll("[data-seconds]").forEach(x=>x.classList.toggle("selected",x===b));reset(+b.dataset.seconds);});
  toggle.onclick=()=>{if(running){stop();toggle.textContent="Continuar";status.textContent="Pausa pausada";return;}if(remaining<=0)remaining=60;running=true;toggle.textContent="Pausar";status.textContent="Recuperação em andamento";interval=setInterval(()=>{remaining=Math.max(0,remaining-1);render();if(remaining===0){stop();toggle.textContent="Começar de novo";status.textContent="Pausa concluída. Retome somente se estiver confortável.";toast("Descanso concluído");}},1000);};
  m.querySelector("#restReset").onclick=()=>reset(+(m.querySelector(".rest-preset.selected")?.dataset.seconds||60));
  m.querySelector("#closeRest").onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
  document.addEventListener("keydown",onKey);
}
function closeTimer(){clearInterval(timerId);timerId=null;$("#timerModal")?.remove();}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="fightquest-progresso.json";a.click();URL.revokeObjectURL(url);toast("Arquivo de progresso preparado.");}
function resetData(){if(confirm("Tem certeza de que deseja apagar todos os registros deste aparelho?")){state={...initial,completed:[],sessions:[],checks:{},lessonDone:[]};save();page("profile");toast("Progresso apagado.");}}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
$("#installBtn").onclick=async()=>{if(!deferredPrompt){toast("Abra o menu do navegador e escolha Instalar aplicativo.");return;}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;};
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
save();page("home");


