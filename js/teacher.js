/* QuizBlox – teacher class mode: create a class link, paste student result codes, leaderboard, CSV and print (all offline) */
const view=$('#view');
let CUR=null,MSG=null;
const classes=()=>(S.classes=S.classes||[]);
const curClass=()=>classes().find(c=>c.k===CUR)||null;
const TIMES=[[30,'30 seconds'],[60,'1 minute'],[120,'2 minutes'],[180,'3 minutes'],[300,'5 minutes']];
const RULES={'':'Standard',hard:'Hard mode',relaxed:'No timers'};
const rulesName=c=>RULES[c.rules||''];
function qrSvg(text,px){
  let q=null;for(const lvl of ['M','L']){try{const t=qrcode(0,lvl);t.addData(text);t.make();q=t;break}catch(e){}}
  if(!q)return null;const n=q.getModuleCount(),m=4;let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+m},${r+m}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${n+2*m} ${n+2*m}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code for the class link"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
const timeName=t=>(TIMES.find(x=>x[0]===t)||[0,t+' s'])[1];
function boardOf(c){
  const by=new Map();
  c.results.forEach(r=>{const key=r.name.toLowerCase();let e=by.get(key);if(!e){e={name:r.name,tries:0,best:null};by.set(key,e)}e.tries++;if(!e.best||r.score>e.best.score||(r.score===e.best.score&&r.correct>e.best.correct))e.best=r});
  const rows=[...by.values()].sort((a,b)=>b.best.score-a.best.score||b.best.correct-a.best.correct||a.name.localeCompare(b.name)).map(e=>({name:e.name,tries:e.tries,score:e.best.score,correct:e.best.correct,total:e.best.total,acc:e.best.total?Math.round(e.best.correct/e.best.total*100):0,streak:e.best.best}));
  rows.forEach((r,i)=>{const p=rows[i-1];r.rank=p&&p.score===r.score&&p.correct===r.correct?p.rank:i+1});
  return rows}
const csvCell=v=>{let t=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return /[",\n\r]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t};
function classCSV(c){
  const unit=MODES[c.mode].unit;
  const head=['Rank','Student','Score','Unit','Correct','Questions','Accuracy %','Best streak','Attempts','Class','Set','Mode','Rules'];
  const rows=boardOf(c).map(r=>[r.rank,r.name,r.score,unit,r.correct,r.total,r.acc,r.streak,r.tries,c.name,c.setTitle,MODES[c.mode].name,rulesName(c)]);
  return[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n'}
function missedStats(c,only){
  const set=classSetFrom(c.setId,c.u,c.k);if(!set)return{n:0,rows:[],detailed:0};const n=set.qs.length,need=Math.ceil(n/4);
  const seen=Array(n).fill(0),miss=Array(n).fill(0);let det=0;
  c.results.forEach(r=>{if(!r.seen||r.seen.length!==need)return;if(only&&r.name.toLowerCase()!==only.toLowerCase())return;det++;const sb=hexBits(r.seen,n),mb=hexBits(r.miss,n);for(let i=0;i<n;i++){seen[i]+=sb[i];miss[i]+=mb[i]}});
  const rows=set.qs.map((q,i)=>({i,q,seen:seen[i],miss:miss[i],pct:seen[i]?Math.round(miss[i]/seen[i]*100):0})).filter(x=>x.seen>0&&x.miss>0).sort((a,b)=>b.pct-a.pct||b.miss-a.miss||b.seen-a.seen);
  return{n,rows,detailed:det,total:c.results.length}}
function missedCSV(c){
  const ms=missedStats(c);const head=['Rank','Question','Type','Correct answer','Times seen','Times missed','Missed %','Class','Set'];
  const TY={mc:'Multiple choice',tf:'True / false',type:'Type the answer'};
  const rows=ms.rows.map((x,i)=>[i+1,x.q.q,TY[x.q.type||'mc']||'Multiple choice',ansText(x.q),x.seen,x.miss,x.pct,c.name,c.setTitle]);
  return[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n'}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'class';
/* build a new question set from missed questions (copies, so the original set is untouched) */
function makePractice(c,rows,who){
  const qs=rows.map(x=>{const q=JSON.parse(JSON.stringify(x.q));return q});
  if(!qs.length)return null;
  let base=(who?who+': ':'')+'Practise missed – '+c.setTitle;base=base.slice(0,60);let title=base,n=2;
  while(S.sets.some(x=>x.title===title))title=base.slice(0,56)+' '+(n++);
  const set={id:uid(),title,emoji:'🎯',cat:'My sets',qs};S.sets.push(set);save();return set}
function practiceDone(set){
  const share=location.href.split('#')[0].replace(/teacher\.html.*$/,'sets.html')+'#share='+b64e(JSON.stringify(packSet(set)));
  const play=location.href.split('#')[0].replace(/teacher\.html.*$/,'play.html')+'?set='+encodeURIComponent(set.id);
  modal(`<h2>Practice set ready 🎯</h2><p><b id="pdTitle">${esc(set.title)}</b> has ${set.qs.length} question${set.qs.length===1?'':'s'} and is saved in your sets.</p>
   <div class="btn-row" style="justify-content:flex-start"><a class="btn btn-primary" id="pdPlay" href="${esc(play)}">Play it now</a><a class="btn btn-secondary" id="pdSets" href="sets.html">Open my sets</a></div>
   <label class="label" for="pdShare" style="margin-top:14px">Share link <span class="muted" style="font-weight:400">– students open it to add the set to their own browser</span></label>
   <div class="copy-row"><input class="input" id="pdShare" readonly value="${esc(share)}"><button class="btn btn-secondary" id="pdCopy" type="button">Copy link</button></div>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Close</button></div>`,(o)=>{$('#pdCopy',o).onclick=()=>copy(share,'Share link copied')})}
const ansText=q=>q.type==='type'?q.a[0]:q.a[q.c];
function addResults(c,text){
  const toks=(String(text||'').match(/QB1\.[^\s,;]+/g)||[]).map(t=>t.replace(/[.,;:)\]]+$/,''));
  const r={added:0,dupe:0,other:0,bad:0,total:toks.length};
  const have=new Set(c.results.map(x=>x.code));
  toks.forEach(t=>{const p=parseClassCode(t);if(p.err){r.bad++;return}if(p.k!==c.k){r.other++;return}if(have.has(t)){r.dupe++;return}have.add(t);c.results.push(Object.assign({code:t,name:p.name,score:p.score,correct:p.correct,total:p.total,best:p.best,t:Date.now()},p.seen?{seen:p.seen,miss:p.miss}:{}));r.added++});
  if(c.results.length>500)c.results.splice(0,c.results.length-500);
  save();return r}
function summary(r){
  if(!r.total)return{ok:false,t:'No result codes found. Codes start with QB1. and are shown on the student\'s end screen.'};
  const bits=[];if(r.added)bits.push(`${r.added} added`);if(r.dupe)bits.push(`${r.dupe} already on the board`);if(r.other)bits.push(`${r.other} from a different class`);if(r.bad)bits.push(`${r.bad} not valid (typo or cut off; ask for it again)`);
  return{ok:r.added>0,t:bits.join(', ')+'.'}}
function copy(text,msg){let ok=false;const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{ok=document.execCommand('copy')}catch(e){}t.remove();
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>toast(msg),()=>toast(ok?msg:'Select the link and press Ctrl+C'));else toast(ok?msg:'Select the link and press Ctrl+C')}
function missedTable(c,max){const ms=missedStats(c);if(!ms.detailed||!ms.rows.length)return'';
  return `<h2 class="mq-h">Most missed questions</h2><table class="mq"><thead><tr><th>Question</th><th>Missed</th><th>Answer</th></tr></thead><tbody>${ms.rows.slice(0,max).map(x=>`<tr><td>${x.q.pic?esc(x.q.pic)+' ':''}${esc(x.q.q)}</td><td>${x.miss} of ${x.seen} (${x.pct}%)</td><td>${esc(ansText(x.q))}</td></tr>`).join('')}</tbody></table>`}
function buildJoinSheet(c){
  let el=$('#printSheet');if(el)el.remove();el=document.createElement('div');el.id='printSheet';el.className='class-sheet join-card';const link=classLink(c);const svg=qrSvg(link,300);
  el.innerHTML=`<header><h1>Join ${esc(c.name)}</h1><p class="sub">${esc(c.setTitle)} · ${esc(MODES[c.mode].name)} · ${esc(timeName(c.time))}${c.rules?' · '+esc(rulesName(c)):''}</p></header>
   ${svg?`<div class="jc-qr">${svg}</div><p class="jc-step"><b>1.</b> Scan the code with a tablet or phone camera, or open the link below.</p>`:`<p class="jc-step"><b>1.</b> Open the link below.</p>`}
   <p class="jc-step"><b>2.</b> Type your name and play one game.</p><p class="jc-step"><b>3.</b> Give your teacher the result code shown at the end.</p>
   <p class="jc-code">Class code <b>${esc(c.k)}</b></p><p class="jc-link">${esc(link)}</p><footer>Made with QuizBlox</footer>`;
  document.body.appendChild(el);return el}
function buildPrintSheet(c){
  let el=$('#printSheet');if(el)el.remove();el=document.createElement('div');el.id='printSheet';el.className='class-sheet';
  const b=boardOf(c),unit=MODES[c.mode].unit;
  el.innerHTML=`<header><h1>${esc(c.name)}: class results</h1><p class="sub">${esc(c.setTitle)} · ${esc(MODES[c.mode].name)} · ${esc(timeName(c.time))}${c.rules?' · '+esc(rulesName(c)):''} · Class code ${esc(c.k)} · ${new Date().toLocaleDateString()}</p></header>
   <table><thead><tr><th>#</th><th>Student</th><th>Score (${esc(unit)})</th><th>Correct</th><th>Accuracy</th><th>Best streak</th><th>Tries</th></tr></thead><tbody>${b.map(r=>`<tr><td>${r.rank}</td><td>${esc(r.name)}</td><td>${r.score}</td><td>${r.correct} / ${r.total}</td><td>${r.acc}%</td><td>${r.streak}</td><td>${r.tries}</td></tr>`).join('')}</tbody></table>
   ${teamBoss(c)}${missedTable(c,5)}<p class="sum">${b.length} student${b.length===1?'':'s'}${b.length?` · class average accuracy ${Math.round(b.reduce((a,r)=>a+r.acc,0)/b.length)}%`:''}</p><footer>Made with QuizBlox</footer>`;
  document.body.appendChild(el);return el}
function render(){
  const list=classes();if(!CUR||!curClass())CUR=list.length?list[list.length-1].k:null;const c=curClass();
  const sets=S.sets.filter(s=>s.qs&&s.qs.length);
  view.innerHTML=`<div class="page-head"><span class="eyebrow">For teachers</span><h1>Class <span class="hl">mode</span></h1><p>Run a class challenge with no accounts and no server. You make a link, students play, and each student sends back a short result code that you paste into a leaderboard.</p></div>
  <div class="page-body">
  <ol class="steps-inline"><li><b>Create</b> a class challenge and share the link.</li><li>Students <b>play</b> and get a result code.</li><li><b>Paste</b> the codes here for a leaderboard, CSV and printout.</li></ol>
  <form class="panel" id="newClass" style="margin-top:20px"><h2 class="h3">1. Create a class challenge</h2>
   <div class="form-grid"><div><label class="label" for="clsName">Class name</label><input class="input" id="clsName" maxlength="30" placeholder="e.g. Year 7 Science" required></div>
   <div><label class="label" for="clsSet">Question set</label><select class="input" id="clsSet">${sets.map(s=>`<option value="${esc(s.id)}" ${s.id===S.cfg.setId?'selected':''}>${esc((s.emoji||'')+' '+s.title)} (${s.qs.length})</option>`).join('')}</select></div>
   <div><label class="label" for="clsMode">Game mode</label><select class="input" id="clsMode">${Object.entries(MODES).map(([k,m])=>`<option value="${k}" ${k==='race'?'selected':''}>${m.emoji} ${esc(m.name)}</option>`).join('')}</select></div>
   <div id="clsBossWrap" hidden><label class="label" for="clsBoss">Class boss HP <span class="muted" style="font-weight:400">(everyone's damage adds up)</span></label><select class="input" id="clsBoss">${BOSS_HPS.map(([v,l])=>`<option value="${v}" ${v===10000?'selected':''}>${l}</option>`).join('')}</select></div>
   <div><label class="label" for="clsRules">Special rules <span class="muted" style="font-weight:400">(locked for students)</span></label><select class="input" id="clsRules"><option value="">Standard</option><option value="hard">🌶️ Hard mode</option><option value="relaxed">🧘 No timers</option></select></div>
   <div><label class="label" for="clsTime">Time</label><select class="input" id="clsTime">${TIMES.map(([v,l])=>`<option value="${v}" ${v===120?'selected':''}>${l}</option>`).join('')}</select></div></div>
   <div class="btn-row" style="justify-content:flex-start"><button class="btn btn-primary" type="submit" id="clsCreate">Create class link</button></div></form>
  ${list.length?`<div class="panel" style="margin-top:24px"><h2 class="h3">Your classes</h2><div class="chips" id="classChips" role="group" aria-label="Choose a class">${list.map(x=>`<button type="button" class="chip ${x.k===CUR?'on':''}" aria-pressed="${x.k===CUR}" data-act="pick" data-k="${x.k}">${esc(x.name)} <small>${boardOf(x).length}</small></button>`).join('')}</div>${c?detail(c):''}</div>`
  :emptyHTML({mood:'happy',title:'No classes yet.',body:'Name a class, pick a set and a mode, then copy the student link. Results stay in this browser.'})}</div>
  <div class="sr-only" id="srLive" aria-live="polite"></div>`;
  if(MSG){const m=$('#pasteMsg');if(m){m.textContent=MSG.t;m.className='paste-msg '+(MSG.ok?'ok':'no')}}
}
function joinBlock(c,link){const svg=qrSvg(link,176);
  return `<div class="join-block" id="joinBlock">${svg?`<div class="qr-box" id="qrBox">${svg}</div>`:''}<div><b>Join card</b><p class="hint" style="margin:4px 0 10px">${svg?'Students can scan this QR code instead of typing the link. ':'<span id="qrLong">This link is too long for a QR code (a big custom set). Use Copy link instead. </span>'}Print a card to hand out or stick on the board.</p><button class="btn btn-secondary btn-sm" data-act="joincard" id="joinCardBtn">Print join card</button></div></div>`}
function missedPanel(c){const ms=missedStats(c);
  if(!ms.detailed)return `<div class="missed" id="missedPanel"><h2 class="h3" style="margin-top:26px">Most missed questions</h2><p class="muted" id="missedNone">No question detail yet. Codes from sets of up to ${CLASS_QMAX} questions carry it automatically.</p></div>`;
  if(!ms.rows.length)return `<div class="missed" id="missedPanel"><h2 class="h3" style="margin-top:26px">Most missed questions</h2><p class="muted">Nobody has missed a question yet (${ms.detailed} game${ms.detailed===1?'':'s'} checked). Impressive.</p></div>`;
  return `<div class="missed" id="missedPanel"><h2 class="h3" style="margin-top:26px">Most missed questions <span class="muted" style="font-weight:600;font-size:16px">from ${ms.detailed} game${ms.detailed===1?'':'s'}</span></h2><ol class="mq-list" id="mqList">${ms.rows.slice(0,12).map(x=>`<li><label class="mq-pick"><input type="checkbox" class="mq-cb" data-i="${x.i}" checked aria-label="Include in practice set"><span>Include</span></label><div class="mq-q">${x.q.pic?`<span aria-hidden="true">${esc(x.q.pic)}</span> `:''}${esc(x.q.q)}</div><div class="mq-bar" aria-hidden="true"><i style="width:${x.pct}%"></i></div><div class="mq-meta"><b>${x.miss} of ${x.seen}</b> missed (${x.pct}%) · answer: <b>${esc(ansText(x.q))}</b></div></li>`).join('')}</ol>${ms.rows.length>12?`<p class="muted" style="font-size:14px;margin:6px 0 0">Showing the 12 most missed of ${ms.rows.length}. The CSV has them all.</p>`:''}<div class="btn-row" style="justify-content:flex-start;margin-top:12px"><button class="btn btn-primary" data-act="mkpractice" id="mkPractice">🎯 Make a practice set from ticked questions</button><button class="btn btn-secondary" data-act="worksheet" id="worksheetBtn">🖨️ Print worksheet</button><button class="btn btn-secondary" data-act="missedcsv" id="missedCsvBtn">Download missed-questions CSV</button></div><p class="muted" style="font-size:14px;margin:8px 0 0">Based on each question's first attempt in every pasted game.</p></div>`}
function printWorksheet(c,rows,who){
  const set={title:(who?who+': ':'')+'Practise missed questions',emoji:'🎯',qs:rows.map(x=>JSON.parse(JSON.stringify(x.q)))};
  buildSheetFor(set,'both',(who?'For '+who+'. ':'')+'From '+c.setTitle+' ('+c.name+'). Circle the best answer or write it on the line.');
  setTimeout(()=>window.print(),60)}
function studentMissed(c,name){
  const ms=missedStats(c,name),games=c.results.filter(r=>r.name.toLowerCase()===name.toLowerCase());
  let body;
  if(!ms.detailed)body=`<p class="muted" id="smNone">${esc(name)}'s codes do not include question detail (the set has more than ${CLASS_QMAX} questions, or the codes came from an older version).</p>`;
  else if(!ms.rows.length)body=`<p id="smNone">${esc(name)} did not miss a single question across ${ms.detailed} game${ms.detailed===1?'':'s'} checked. 🌟</p>`;
  else body=`<ol class="mq-list" id="smList">${ms.rows.map(x=>`<li><div class="mq-q">${x.q.pic?`<span aria-hidden="true">${esc(x.q.pic)}</span> `:''}${esc(x.q.q)}</div><div class="mq-meta"><b>Missed ${x.miss} of ${x.seen}</b> time${x.seen===1?'':'s'} · answer: <b>${esc(ansText(x.q))}</b></div></li>`).join('')}</ol>`;
  modal(`<h2 id="smTitle">${esc(name)}: missed questions</h2><p class="muted" style="margin-top:-6px">${ms.detailed} of ${games.length} game${games.length===1?'':'s'} with question detail · ${esc(c.setTitle)}</p><div class="sm-body">${body}</div>
   <div class="btn-row">${ms.rows.length?`<button class="btn btn-primary" id="smPractice" type="button">🎯 Practice set for ${esc(name)}</button><button class="btn btn-secondary" id="smSheet" type="button">🖨️ Print worksheet</button>`:''}<button class="btn btn-secondary" data-m="close">Close</button></div>`,(o,close)=>{
    const sh=$('#smSheet',o);if(sh)sh.onclick=()=>printWorksheet(c,ms.rows,name);
    const b=$('#smPractice',o);if(b)b.onclick=()=>{const set=makePractice(c,ms.rows,name);close();practiceDone(set)}})}
const BOSS_HPS=[[5000,'5,000 HP (small class)'],[10000,'10,000 HP'],[20000,'20,000 HP (big class)']];
function teamBoss(c){if(c.mode!=='brawl')return'';const max=c.bossHp||10000,b=boardOf(c),dmg=b.reduce((a,r)=>a+r.score,0),hp=Math.max(0,max-dmg),pct=Math.round(hp/max*100),bs=BOSS_TEAM[bossIdx(c.k)],dead=hp<=0,rage=!dead&&pct<=25;
  const mvp=b[0];
  return `<div class="team-boss${dead?' dead':''}${rage?' rage':''}" id="teamBoss"><div class="tb-top"><span class="tb-e" aria-hidden="true">${dead?'💫':bs[0]}</span><div><b class="tb-n">${esc(bs[1])}</b> <span class="muted">· class boss${rage?' · ENRAGED 🔥':''}</span><div class="tb-line" id="tbLine">${dead?`Defeated by the class! 🎉${mvp?' Top damage: <b>'+esc(mvp.name)+'</b> ('+mvp.score+').':''}`:b.length?`${b.length} student${b.length===1?'':'s'} fighting so far. Everyone's best game counts.`:'Paste result codes to start the fight.'}</div></div></div>
   <div class="tb-hp" role="progressbar" aria-label="Class boss health" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${hp}"><i style="width:${pct}%"></i></div>
   <p class="tb-line"><b id="tbHp">${hp.toLocaleString()} / ${max.toLocaleString()} HP left</b> · ${dmg.toLocaleString()} damage dealt${dead&&dmg>max?' ('+(dmg-max).toLocaleString()+' overkill)':''}</p></div>`}

function classHighlights(c){
  const b=boardOf(c);if(!b.length)return null;
  const top=b[0];
  const pool=b.filter(r=>r.total>=3);
  const sharp=(pool.length?pool:b).slice().sort((a,x)=>x.acc-a.acc||x.correct-a.correct||x.score-a.score)[0];
  const hot=b.slice().sort((a,x)=>x.streak-a.streak||x.score-a.score)[0];
  return {top,sharp,hot};
}
function highlightsHTML(h,cls){
  if(!h)return'';
  const card=(id,e,l,n,s)=>`<div class="hl-card" id="${id}"><span class="hl-e" aria-hidden="true">${e}</span><div><span class="hl-l">${l}</span><b class="hl-n">${esc(n)}</b><span class="hl-s">${s}</span></div></div>`;
  return `<div class="class-hls${cls?' '+cls:''}" id="classHls" aria-label="Class highlights">${card('hlTop','🏆','Top score',h.top.name,h.top.score+' pts')}
    ${card('hlSharp','🎯','Sharpshooter',h.sharp.name,h.sharp.acc+'%')}
    ${card('hlHot','🔥','Hot streak',h.hot.name,h.hot.streak+' in a row')}</div>`;
}
function reusedName(name){
  const base=(name||'Class').replace(/\s*\(\d+\)\s*$/,'').trim()||'Class';
  const names=new Set(classes().map(x=>x.name));
  let i=2,n;
  do{n=base+' ('+i+')';i++}while(names.has(n));
  return n;
}
function reuseClass(c){
  if(!c)return null;
  const keys=new Set(classes().map(x=>x.k));
  let k;do{k=classKey()}while(keys.has(k));
  const n={k,name:reusedName(c.name),setId:c.setId,setTitle:c.setTitle,mode:c.mode,time:c.time,rules:c.rules||'',created:Date.now(),results:[]};
  if(c.mode==='brawl')n.bossHp=c.bossHp||10000;
  if(c.u)n.u=c.u;
  classes().push(n);if(classes().length>30)classes().shift();
  CUR=k;MSG=null;save();
  return n;
}
function closeProjector(){
  const el=$('#projView');if(el)el.remove();
  document.body.classList.remove('is-projecting');
}
function projHTML(c){
  const unit=MODES[c.mode].unit,b=boardOf(c),h=classHighlights(c);
  const pod=(p,k)=>p?`<div class="pod p${k}"><div class="nm">${esc(p.name)}</div><div class="sc">${p.score} ${esc(unit)}</div><div class="stand">${k}</div></div>`:'<div></div>';
  return `<div class="proj-bar"><div class="proj-meta"><span class="eyebrow">Classroom view</span><h1>${esc(c.name)}</h1><p>${esc(c.setTitle)} · ${MODES[c.mode].emoji} ${esc(MODES[c.mode].name)} · ${esc(timeName(c.time))}${c.rules?' · '+esc(rulesName(c)):''}</p></div>
    <button type="button" class="btn btn-secondary" id="projClose" data-act="projclose">Close <span class="kbd">Esc</span></button></div>
   ${h?highlightsHTML(h,'proj-hls'):''}
   ${b.length?`<div class="proj-pods" aria-hidden="${b.length<1}">${pod(b[1],2)}${pod(b[0],1)}${pod(b[2],3)}</div>
    <ol class="proj-board" id="projBoard">${b.map(r=>`<li class="proj-row r${r.rank}"><span class="pr">${r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':r.rank}</span><b class="pn">${esc(r.name)}</b><span class="ps">${r.score} ${esc(unit)}</span><span class="pa">${r.acc}%</span></li>`).join('')}</ol>`
    :emptyHTML({panel:false,small:true,mascot:false,body:'<b>Waiting for the first result code.</b> Paste codes below as students finish.'}).replace('empty small','empty small proj-empty')}
   <div class="proj-paste"><label class="label" for="projPaste">Paste new result codes</label><div class="copy-row"><textarea class="textarea import-area" id="projPaste" rows="2" placeholder="QB1.WTIyNn5Bb…"></textarea><button class="btn btn-primary" data-act="projadd" id="projAdd">Add</button></div><p id="projMsg" class="paste-msg" role="status"></p></div>`;
}
function openProjector(c){
  if(!c)return;
  let el=$('#projView');
  if(!el){el=document.createElement('div');el.id='projView';el.className='proj-view';el.setAttribute('role','dialog');el.setAttribute('aria-label','Classroom leaderboard');document.body.appendChild(el)}
  document.body.classList.add('is-projecting');
  el.innerHTML=projHTML(c);
  const close=$('#projClose',el);if(close)close.focus();
}
function refreshProjector(){
  const el=$('#projView');const c=curClass();if(!el||!c)return;
  const keep=$('#projPaste')?$('#projPaste').value:'';
  const msg=$('#projMsg')?{t:$('#projMsg').textContent,ok:$('#projMsg').classList.contains('ok')}:null;
  el.innerHTML=projHTML(c);
  if(keep){const p=$('#projPaste');if(p)p.value=keep}
  if(msg&&msg.t){const m=$('#projMsg');if(m){m.textContent=msg.t;m.className='paste-msg '+(msg.ok?'ok':'no')}}
}

function detail(c){
  const link=classLink(c),unit=MODES[c.mode].unit,b=boardOf(c);
  return `<div class="class-detail" id="classDetail"><div class="class-meta"><b>${esc(c.name)}</b><span>${esc(c.setTitle)} · ${MODES[c.mode].emoji} ${esc(MODES[c.mode].name)} · ${esc(timeName(c.time))}${c.rules?' · <b class="rules-tag">'+esc(rulesName(c))+'</b>':''} · class code <b class="ck">${esc(c.k)}</b></span></div>
   ${teamBoss(c)}
   <label class="label" for="classLink">Student link <span class="muted" style="font-weight:400">– send this to your class</span></label>
   <div class="copy-row"><input class="input" id="classLink" readonly value="${esc(link)}"><button class="btn btn-primary" data-act="copylink" id="copyLink">Copy link</button></div>
   ${link.length>2000?`<p class="hint" style="color:var(--coral-d)">This link is long (${link.length} characters) because the set is your own. Some apps may cut it off; a built-in set gives a much shorter link.</p>`:''}
   ${joinBlock(c,link)}
   <h2 class="h3" style="margin-top:26px">2. Paste result codes</h2>
   <label class="label" for="pasteBox">Paste one or many codes <span class="muted" style="font-weight:400">– any separators, even a whole chat or email</span></label>
   <textarea class="textarea import-area" id="pasteBox" placeholder="QB1.WTIyNn5Bb…"></textarea>
   <div class="btn-row" style="justify-content:flex-start;margin-top:10px"><button class="btn btn-primary" data-act="addcodes" id="addCodes">Add to leaderboard</button></div><p id="pasteMsg" class="paste-msg" role="status"></p>
   <h2 class="h3" style="margin-top:26px">3. Class leaderboard <span class="muted" style="font-weight:600;font-size:16px">${b.length} student${b.length===1?'':'s'}</span></h2>
   ${b.length?`${highlightsHTML(classHighlights(c))}<div class="tbl-wrap"><table class="tbl" id="classTbl"><thead><tr><th>#</th><th>Student</th><th>Score (${esc(unit)})</th><th>Correct</th><th>Accuracy</th><th>Best streak</th><th>Tries</th><th><span class="sr-only">Missed questions and remove</span></th></tr></thead><tbody>${b.map(r=>`<tr><td>${r.rank===1?'🥇':r.rank===2?'🥈':r.rank===3?'🥉':r.rank}</td><td><b>${esc(r.name)}</b></td><td>${r.score}</td><td>${r.correct} / ${r.total}</td><td>${r.acc}%</td><td>${r.streak}</td><td>${r.tries}</td><td class="nowrap"><button class="btn btn-ghost btn-sm" data-act="stumissed" data-n="${esc(r.name)}" aria-label="Missed questions for ${esc(r.name)}" title="Missed questions">📝</button> <button class="btn btn-ghost btn-sm" data-act="rmstu" data-n="${esc(r.name)}" aria-label="Remove ${esc(r.name)}">✕</button></td></tr>`).join('')}</tbody></table></div>
   <p class="muted" style="font-size:14px;margin:8px 0 0">Each student's best game counts; “Tries” is how many codes you pasted for them.</p>
   ${missedPanel(c)}
   <div class="btn-row class-actions" style="justify-content:flex-start;margin-top:16px"><button class="btn btn-primary" data-act="project" id="projBtn">🖥️ Classroom view</button><button class="btn btn-secondary" data-act="reuse" id="reuseBtn">Reuse class</button><button class="btn btn-secondary" data-act="csv" id="csvBtn">Download CSV</button><button class="btn btn-secondary" data-act="print" id="printBtn">Print results</button><button class="btn btn-secondary" data-act="clear" id="clearBtn">Clear results</button><button class="btn btn-danger" data-act="delclass" id="delClass">Delete class</button></div>`
   :emptyHTML({small:true,mascot:false,body:'No results yet. Paste the first code above.'})+`<div class="btn-row class-actions" style="justify-content:flex-start"><button class="btn btn-primary" data-act="project" id="projBtn">🖥️ Classroom view</button><button class="btn btn-secondary" data-act="reuse" id="reuseBtn">Reuse class</button><button class="btn btn-danger" data-act="delclass" id="delClass">Delete class</button></div>`}
   <p class="hint" style="margin-top:18px">Result codes are checked for typos but they are honour-based: they are not secure, so treat them as classroom fun rather than a test.</p></div>`}
document.addEventListener('submit',e=>{if(e.target.id!=='newClass')return;e.preventDefault();
  const name=($('#clsName').value||'').replace(/[<>]/g,'').trim().slice(0,30);if(!name){toast('Give the class a name');return}
  const set=S.sets.find(s=>s.id===$('#clsSet').value);if(!set){toast('Pick a question set');return}
  const keys=new Set(classes().map(c=>c.k));let k;do{k=classKey()}while(keys.has(k));
  const c={k,name,setId:set.id,setTitle:set.title,mode:$('#clsMode').value,time:+$('#clsTime').value,rules:$('#clsRules').value,created:Date.now(),results:[]};if(c.mode==='brawl')c.bossHp=+$('#clsBoss').value||10000;
  if(!ALL_SAMPLES.some(x=>x.id===set.id))c.u=packSet(set);
  classes().push(c);if(classes().length>30)classes().shift();CUR=k;MSG=null;save();render();toast('Class link ready. Copy it and send it to your students.');const d=$('#classDetail');if(d)d.scrollIntoView({block:'start',behavior:'smooth'})});
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,c=curClass();
  switch(a){
   case'pick':CUR=t.dataset.k;MSG=null;render();break;
   case'copylink':if(c)copy(classLink(c),'Link copied');break;
   case'addcodes':{if(!c)break;const box=$('#pasteBox');const r=addResults(c,box.value);MSG=summary(r);const keep=$('#pasteBox').value;const projecting=!!$('#projView');render();if(r.added)toast(r.added+' result'+(r.added>1?'s':'')+' added');else $('#pasteBox').value=keep;if(projecting)openProjector(curClass()||c);break}
   case'rmstu':if(c){const n=t.dataset.n.toLowerCase();c.results=c.results.filter(r=>r.name.toLowerCase()!==n);save();MSG=null;render()}break;
   case'csv':if(c){const a2=document.createElement('a');a2.href=URL.createObjectURL(new Blob(['\ufeff'+classCSV(c)],{type:'text/csv;charset=utf-8'}));a2.download='quizblox-'+(c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'class')+'-results.csv';document.body.appendChild(a2);a2.click();a2.remove();setTimeout(()=>URL.revokeObjectURL(a2.href),2000)}break;
   case'missedcsv':if(c){if(!missedStats(c).rows.length){toast('No missed questions to export yet');break}download('quizblox-'+slug(c.name)+'-most-missed.csv',missedCSV(c))}break;
   case'mkpractice':if(c){const ms=missedStats(c);const pick=new Set($$('.mq-cb:checked').map(x=>+x.dataset.i));const rows=ms.rows.filter(x=>pick.has(x.i));if(!rows.length){toast('Tick at least one question');break}const set=makePractice(c,rows);practiceDone(set)}break;
   case'worksheet':if(c){const ms=missedStats(c);const pick=new Set($$('.mq-cb:checked').map(x=>+x.dataset.i));const rows=ms.rows.filter(x=>pick.has(x.i));if(!rows.length){toast('Tick at least one question');break}printWorksheet(c,rows)}break;
   case'stumissed':if(c)studentMissed(c,t.dataset.n);break;
   case'joincard':if(c){buildJoinSheet(c);setTimeout(()=>window.print(),60)}break;
   case'print':if(c){buildPrintSheet(c);setTimeout(()=>window.print(),60)}break;
   case'project':if(c)openProjector(c);break;
   case'projclose':closeProjector();break;
   case'projadd':{if(!c)break;const box=$('#projPaste');if(!box)break;const r=addResults(c,box.value);const s=summary(r);if(r.added){toast(r.added+' result'+(r.added>1?'s':'')+' added');box.value='';render();openProjector(curClass()||c);const m=$('#projMsg');if(m){m.textContent=s.t;m.className='paste-msg '+(s.ok?'ok':'no')}}else{const m=$('#projMsg');if(m){m.textContent=s.t;m.className='paste-msg '+(s.ok?'ok':'no')}}break}
   case'reuse':if(c){const n=reuseClass(c);if(n){closeProjector();render();toast('New class ready with the same settings. The old results stay on “'+c.name+'”.')}}break;
   case'clear':if(c)confirmBox('Clear all results?','Every pasted result for this class will be removed. The class link keeps working.','Clear results',()=>{c.results=[];save();MSG=null;render()});break;
   case'delclass':if(c)confirmBox('Delete this class?','The class and its results are removed from this browser. Links you already shared still open for students, but you can no longer collect their codes here.','Delete class',()=>{S.classes=classes().filter(x=>x.k!==c.k);CUR=null;MSG=null;save();render()});break;
  }
});
window.addEventListener('afterprint',()=>{const e=$('#printSheet');if(e)e.remove()});
window.TC={missedStats,missedCSV,makePractice,qrSvg,boardOf,classCSV,addResults,render,classHighlights,reuseClass,openProjector,closeProjector,get cur(){return curClass()}};
render();
document.addEventListener('change',e=>{if(e.target&&e.target.id==='clsMode'){const w=$('#clsBossWrap');if(w)w.hidden=e.target.value!=='brawl'}});
