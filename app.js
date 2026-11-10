const $ = s => document.querySelector(s);
const KEY = "fightquest-v1";
const startDate = new Date("2026-11-14T00:00:00");
const initial = {xp:0,completed:[],sessions:[],checks:{},activeDays:0};
let state;
try { state = {...initial,...JSON.parse(localStorage.getItem(KEY) || "{}")}; } catch { state = {...initial}; }
const strengthA = [
 ["Agachamento","2 séries · 12 repetições","Movimento controlado, sem pressa."],
 ["Flexão inclinada","2 séries · 6–8 repetições","Use uma superfície firme e estável."],
 ["Remada com mochila leve","2 séries · 10–12 repetições","Mantenha a coluna neutra."],
 ["Ponte de glúteos","2 séries · 15 repetições","Suba sem forçar a lombar."],
 ["Elevação de panturrilha","2 séries · 15 repetições","Apoie-se se precisar de equilíbrio."],
 ["Dead bug","2 séries · 8 por lado","Controle a respiração e o tronco."]
];
const strengthB = [
 ["Afundo alternado","2 séries · 8 por perna","Use amplitude confortável."],
 ["Flexão com joelhos","2 séries · 5–7 repetições","Priorize a técnica."],
 ["Levantamento romeno leve","2 séries · 10 repetições","Comece sem carga ou com mochila leve."],
 ["Rosca com mochila leve","2 séries · 10 repetições","Sem balançar o tronco."],
 ["Bird dog","2 séries · 8 por lado","Movimento lento e estável."],
 ["Aperto de toalha","2 séries · 15 segundos","Contração moderada, sem dor."]
];
const lessons = [
 ["Base, postura e equilíbrio","Aprenda os princípios de uma posição estável."],
 ["Guarda e atenção","Conheça a função da guarda e mantenha os ombros relaxados."],
 ["Deslocamento básico","Pratique passos pequenos sem cruzar os pés."],
 ["Coordenação e respiração","Combine movimentos leves com respiração natural."]
];
function save(){localStorage.setItem(KEY,JSON.stringify(state));$("#level").textContent=1+Math.floor(state.xp/100);}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
function progress(){return Math.min(90,state.completed.length);}
function page(name){
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
 const app=$("#app");
 if(name==="home") app.innerHTML=home();
 if(name==="strength") app.innerHTML=strengthPage();
 if(name==="muaythai") app.innerHTML=muayPage();
 if(name==="progress") app.innerHTML=progressPage();
 if(name==="profile") app.innerHTML=profilePage();
 bind();
}
function home(){
 const days=Math.max(0,Math.ceil((startDate-new Date())/86400000));
 const started=days===0;
 return `<section class="hero"><div class="eyebrow">Projeto de 90 dias · 2026</div><h1>Construa sua<br>próxima versão.</h1><p>Força, condicionamento e fundamentos de Muay Thai. Evolua com consistência, uma sessão de cada vez.</p><div class="hero-stat"><div><strong>${progress()}/90</strong><small>DIAS REGISTRADOS</small></div><div><strong>${state.xp}</strong><small>XP CONQUISTADO</small></div><div><strong>${1+Math.floor(state.xp/100)}</strong><small>NÍVEL</small></div></div></section>
 <div class="section-head"><h2>${started?"Seu painel de treino":"Preparação para começar"}</h2><small>${started?"Dia 1 liberado":days+" dias para começar"}</small></div>
 <section class="card wide"><div class="eyebrow">${started?"Primeiro passo":"Data de início prevista · 14 nov 2026"}</div><h3>${started?"Comece pela base, sem pressa.":"Seu plano está sendo preparado."}</h3><p>${started?"Registre suas sessões e acompanhe sua evolução. Aumente o volume aos poucos e respeite a recuperação.":"Até lá, você pode conhecer as áreas do app. No primeiro dia, comece leve e ajuste o ritmo conforme sua recuperação."}</p><div class="progress-track"><div class="progress-fill" style="width:${progress()/90*100}%"></div></div><small class="muted">${progress()} de 90 dias registrados</small><div class="action-row"><button class="btn" data-go="strength">Ver treino de força →</button><button class="btn secondary" data-go="muaythai">Ver fundamentos</button></div></section>
 <div class="section-head"><h2>Seu treinamento</h2><small>Visão geral</small></div><div class="grid">
 <article class="card"><div class="card-icon">✦</div><h3>Musculação</h3><p>Treinos A e B, corpo todo e progressão gradual.</p></article>
 <article class="card"><div class="card-icon purple">🥊</div><h3>Muay Thai</h3><p>Fundamentos, equilíbrio e coordenação sem contato.</p></article>
 <article class="card"><div class="card-icon lime">◷</div><h3>Cronômetro</h3><p>Use intervalos para organizar suas sessões.</p><div class="action-row"><button class="btn ghost" data-timer> Abrir timer </button></div></article>
 <article class="card"><div class="card-icon">▥</div><h3>Evolução</h3><p>${state.sessions.length} sessões registradas até agora.</p></article></div>`;
}
function strengthPage(){
 return `<div class="eyebrow">Treinamento de força</div><h1 class="page-title">Força A / B</h1><p class="page-intro">Plano inicial de corpo todo. Faça os movimentos com controle, deixe 2–3 repetições de reserva e descanse entre as séries.</p><div class="grid"><button class="btn" data-workout="A">Treino A</button><button class="btn secondary" data-workout="B">Treino B</button></div><div class="section-head"><h2>Como progredir</h2></div><div class="card"><p>Comece com carga leve. Primeiro consolide a técnica; depois aumente gradualmente as repetições ou a carga. Não treine até a falha.</p></div><div class="notice"><strong>Segurança:</strong> pare se sentir dor, tontura ou mal-estar. Use apenas móveis firmes e equipamentos em boas condições.</div><div class="section-head"><h2>Registrar sessão</h2></div><button class="btn" data-log="Força">Concluir sessão de força +10 XP</button><div id="workoutList" class="list" style="margin-top:14px"></div>`;
}
function workout(type){
 const items=type==="A"?strengthA:strengthB;
 $("#workoutList").innerHTML=`<div class="section-head"><h2>Treino ${type}</h2><small>${items.length} exercícios</small></div>`+items.map((x,i)=>`<div class="list-row"><div class="card-icon">${i+1}</div><div class="grow"><strong>${x[0]}</strong><small>${x[1]} · ${x[2]}</small></div></div>`).join("");
}
function muayPage(){
 return `<div class="eyebrow">Trilha de fundamentos</div><h1 class="page-title">Muay Thai</h1><p class="page-intro">Estudo progressivo para iniciantes: postura, equilíbrio, deslocamento e coordenação. O foco inicial é aprender com segurança, sem contato.</p><div class="list">${lessons.map((l,i)=>`<div class="list-row"><div class="card-icon purple">${i+1}</div><div class="grow"><strong>${l[0]}</strong><small>${l[1]}</small></div><button class="btn secondary" data-lesson="${i}">Abrir</button></div>`).join("")}</div><div class="notice"><strong>Importante:</strong> este app não substitui um professor. Golpes de impacto, treino no saco, sparring, clinch, cotovelos e joelhos exigem orientação presencial qualificada e equipamento adequado.</div><div class="section-head"><h2>Registrar prática</h2></div><button class="btn" data-log="Fundamentos Muay Thai">Concluir prática leve +10 XP</button>`;
}
function progressPage(){
 const pct=progress()/90*100;
 return `<div class="eyebrow">Seu histórico</div><h1 class="page-title">Evolução</h1><p class="page-intro">Pequenos passos consistentes constroem progresso. Seus registros ficam salvos neste aparelho.</p><div class="metric-row"><div class="metric"><strong>${progress()}</strong><span>DIAS</span></div><div class="metric"><strong>${state.xp}</strong><span>XP</span></div><div class="metric"><strong>${state.sessions.length}</strong><span>SESSÕES</span></div></div><div class="section-head"><h2>Programa de 90 dias</h2><small>${Math.round(pct)}%</small></div><div class="card"><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><p>${progress()} dias registrados de 90. O calendário começa quando você registrar sua primeira sessão.</p></div><div class="section-head"><h2>Últimas sessões</h2></div><div class="list">${state.sessions.length?state.sessions.slice(-8).reverse().map(s=>`<div class="list-row"><div class="card-icon lime">✓</div><div class="grow"><strong>${s.name}</strong><small>${new Date(s.date).toLocaleDateString("pt-BR")}</small></div><span class="pill">+${s.xp} XP</span></div>`).join(""):'<div class="empty">Nenhuma sessão registrada ainda.</div>'}</div>`;
}
function profilePage(){
 return `<div class="eyebrow">Configurações</div><h1 class="page-title">Perfil</h1><p class="page-intro">Seu espaço de treino e preferências.</p><div class="card"><div class="eyebrow">Atleta FightQuest</div><h2 style="margin:8px 0">Iniciante · Nível ${1+Math.floor(state.xp/100)}</h2><p>Objetivo: desenvolver força, condicionamento e fundamentos técnicos com progressão responsável.</p></div><div class="section-head"><h2>Equipamentos disponíveis</h2></div><div class="list"><div class="list-row"><span>✓</span><div class="grow"><strong>Mochila e livros</strong><small>Para exercícios de força com carga leve e segura</small></div></div><div class="list-row"><span>✓</span><div class="grow"><strong>Espaço em casa</strong><small>Para mobilidade e exercícios sem contato</small></div></div></div><div class="section-head"><h2>Dados</h2></div><button class="btn secondary" id="exportBtn">Exportar meu progresso</button><button class="btn ghost" id="resetBtn" style="margin-left:8px">Apagar registros</button><p class="small muted" style="margin-top:14px">Os dados são armazenados localmente neste navegador. Limpar os dados do navegador pode apagá-los.</p>`;
}
function log(name){state.xp+=10;state.completed.push(Date.now());state.sessions.push({name,date:new Date().toISOString(),xp:10});save();toast("Sessão registrada! +10 XP");page("progress");}
function bind(){
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>page(b.dataset.go));
 document.querySelectorAll("[data-workout]").forEach(b=>b.onclick=()=>workout(b.dataset.workout));
 document.querySelectorAll("[data-log]").forEach(b=>b.onclick=()=>log(b.dataset.log));
 document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>{const l=lessons[+b.dataset.lesson];alert(l[0]+"\n\n"+l[1]+"\n\nPratique apenas movimentos leves e sem contato. Procure um professor para correção presencial.");});
 const timerBtn=$("[data-timer]");if(timerBtn)timerBtn.onclick=showTimer;
 const exp=$("#exportBtn");if(exp)exp.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fightquest-progresso.json";a.click();URL.revokeObjectURL(a.href);};
 const reset=$("#resetBtn");if(reset)reset.onclick=()=>{if(confirm("Apagar todo o progresso salvo neste aparelho?")){state={...initial,completed:[],sessions:[],checks:{}};save();page("profile");toast("Registros apagados.");}};
}
function showTimer(){
 const old=$("#timerPanel");if(old){old.remove();return;}
 const panel=document.createElement("section");panel.id="timerPanel";panel.className="card wide";panel.style.marginTop="16px";panel.innerHTML='<div class="eyebrow">Cronômetro de sessão</div><div class="timer" id="timerValue">00:00</div><div class="timer-controls"><button class="btn" id="timerStart">Iniciar</button><button class="btn secondary" id="timerReset">Zerar</button></div>';
 $("#app").append(panel);let sec=0,handle=null;const display=$("#timerValue");$("#timerStart").onclick=()=>{if(handle){clearInterval(handle);handle=null;$("#timerStart").textContent="Continuar";}else{handle=setInterval(()=>{sec++;display.textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");},1000);$("#timerStart").textContent="Pausar";}};$("#timerReset").onclick=()=>{clearInterval(handle);handle=null;sec=0;display.textContent="00:00";$("#timerStart").textContent="Iniciar";};
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
let deferredPrompt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
$("#installBtn").onclick=async()=>{if(!deferredPrompt){toast("Use o menu do navegador para instalar.");return;}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;};
if("serviceWorker" in navigator && location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
save();page("home");