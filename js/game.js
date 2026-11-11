/* QuizBlox – play page: setup, game engine (Gold Quest / Quiz Race), end screen */
const view=$('#view');
let G=null,SEASON=false,TOURNEY=false;
const ICON={
  play:'<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 4l10 6-10 6z"/></svg>'
};

/* ---------------- setup ---------------- */
function params(){try{return new URLSearchParams(location.search)}catch(e){return new URLSearchParams()}}
const bestFor=id=>{const b=bestOf(id,S.cfg.mode,S.cfg.time,S.cfg.hard,S.settings.noTimer);return b?` · best ${b.score} ${MODES[S.cfg.mode].unit}`:''};
function renderSetup(){document.body.classList.remove('playing');
  const c=S.cfg;const sets=S.sets.filter(s=>s.qs&&s.qs.length);
  if(!sets.find(s=>s.id===c.setId))c.setId=sets[0]?sets[0].id:null;
  const m=MODES[c.mode];const set=sets.find(s=>s.id===c.setId);
  const timeLabel={30:'30 seconds',60:'1 minute',120:'2 minutes',180:'3 minutes',300:'5 minutes'}[c.time];
  const more=!!window.__moreOpen||!!c.passPlay||!!c.hard||!!TOURNEY;
  const extras=[
    '<div id="seasonMount">'+((typeof seasonCard==='function'&&seasonCard())||'')+'</div>',
    (typeof tourneyCard==='function'&&tourneyCard())||''
  ].join('');
  const note=SEASON?'<p class="daily-note season-note"><b>Summer holidays race is loaded.</b> Summer Holidays and a 3-minute Quiz Race are ready. Change anything and it becomes a regular game.</p>':TOURNEY?'<p class="daily-note tourney-note"><b>All-modes tournament is loaded.</b> All seven modes, 30 seconds each, same rivals all the way. Placement points decide it. Change anything and it becomes a regular game.</p>':'';
  view.innerHTML=`<div class="page-head"><h1>Let's <span class="hl">play</span>.</h1><p>${c.passPlay?(c.passTeam?'Two players, one score. Pass the device and take on the bots together.':'Two players, one device. Answer a question, then pass it over. No bots — just you and a friend.'):'Pick a set, pick a mode, then start. Four bots are already warming up.'}</p>${note}<div class="play-extras" id="playExtras">${extras}</div></div>
  <div class="setup-flow page-body">
   <section class="panel setup-step" id="stepSet">
    <h2 class="step-title" id="lblSet"><span class="step-n">1</span> Pick a set</h2>
    ${sets.length?`<div class="set-tools"><label class="sr-only" for="setSearch">Search question sets</label><input class="input" id="setSearch" type="search" placeholder="Search ${sets.length} sets…" value="${esc(FILT.q)}" autocomplete="off"><button type="button" class="btn btn-secondary btn-sm" id="randomBtn" data-act="randomset" title="Pick a random set from the list below">🎲 Random set</button></div><div class="chips" id="setChips" role="group" aria-label="Filter sets by category"></div><div id="recentRow"></div><div id="setGrid"></div><p class="muted scroll-hint" id="setHint"></p>`
     :emptyHTML({panel:false,title:'No question sets.',body:"It's quiet. Too quiet.",cta:'<a href="sets.html#new">Make one</a> and we\'ll get this party started.',mood:'sad'})}
   </section>
   <section class="panel setup-step" id="stepMode">
    <h2 class="step-title" id="lblMode"><span class="step-n">2</span> Pick a mode</h2>
    <div class="choice-grid mode-grid mode-grid-roomy" role="group" aria-labelledby="lblMode">${Object.entries(MODES).map(([k,v])=>`<button class="choice mode ${c.mode===k?'on':''}" aria-pressed="${c.mode===k}" data-act="cfg" data-k="mode" data-v="${k}">${MODE_NEW.includes(k)?'<i class="new-sticker">New</i>':''}<span class="mode-em" aria-hidden="true">${v.emoji}</span><b>${v.name}</b><span class="mode-short">${MODE_SHORT[k]||''}</span></button>`).join('')}</div>
    <p class="mode-desc" id="modeDesc" aria-live="polite"><b>${m.emoji} ${m.name}:</b> ${m.desc}</p>
   </section>
   <section class="panel setup-step setup-go" id="stepGo">
    <h2 class="step-title"><span class="step-n">3</span> Start</h2>
    <div class="go-row">
     <div class="summary" aria-label="Game summary">
      <dl style="margin:0"><dt>Question set</dt><dd>${set?esc(set.title):'–'}</dd><dt>Mode</dt><dd>${m.name}</dd><dt>Time limit</dt><dd>${timeLabel}</dd><dt>Goal</dt><dd>${c.goal[c.mode]?c.goal[c.mode]+' '+m.unit:'None'}</dd><dt>Opponents</dt><dd>${c.passPlay?(c.passTeam?'Team with '+esc((S.p2&&S.p2.name)||'Player 2')+' · 4 bots · '+(c.diff==='auto'?'Auto ('+autoDiff()+')':c.diff):'Pass & Play · '+esc((S.p2&&S.p2.name)||'Player 2')):'4 bots · '+(c.diff==='auto'?'Auto ('+autoDiff()+')':c.diff)}${c.hard?' · hard 🌶️':''}</dd><dt>You</dt><dd>${esc(S.name||'You')} ${S.emoji}</dd>${set?`<dt>Your best</dt><dd id="sumBest">${(()=>{const b=bestOf(set.id,c.mode,c.time,c.hard,S.settings.noTimer);return b?b.score+' '+m.unit:'First try on this setup'})()}</dd>`:''}</dl>
     </div>
     <div class="go-actions">
      <button class="btn btn-primary btn-lg" id="startBtn" data-act="start" ${set?'':'disabled'}>${ICON.play} Let's go!</button>
      <button type="button" class="btn btn-secondary" id="moreBtn" aria-expanded="${more?'true':'false'}" aria-controls="moreOpts">${more?'Hide options':'More options'}</button>
     </div>
    </div>
    <div id="moreOpts" class="more-opts"${more?'':' hidden'}>
      <div class="group"><span class="label">Time limit</span><div class="seg">${[[30,'30 sec'],[60,'1 min'],[120,'2 min'],[180,'3 min'],[300,'5 min']].map(([v,l])=>`<button class="${c.time===v?'on':''}" aria-pressed="${c.time===v}" data-act="cfg" data-k="time" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="group"><span class="label">${c.mode==='brawl'?'Boss HP':'Goal'} <span class="muted" style="font-weight:400">– ${c.mode==='brawl'?'everyone chips in, top damage wins':'first to reach it wins'}</span></span><div class="seg">${m.goals.map(v=>`<button class="${c.goal[c.mode]===v?'on':''}" aria-pressed="${c.goal[c.mode]===v}" data-act="cfg" data-k="goal" data-v="${v}">${v?v+' '+m.unit:'No goal'}</button>`).join('')}</div></div>
      <div class="group"><span class="label">Opponent difficulty</span><div class="seg">${['easy','normal','hard','auto'].map(v=>`<button class="${c.diff===v?'on':''}" aria-pressed="${c.diff===v}" data-act="cfg" data-k="diff" data-v="${v}">${v==='auto'?'Auto':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div>${c.diff==='auto'?`<p class="hint" id="autoHint" style="margin:8px 0 0">Rivals will play at <b>${autoDiff()[0].toUpperCase()+autoDiff().slice(1)}</b> based on your recent results${(S.history||[]).filter(x=>!x.tourney).length<2?' (after a couple of games they will start to adjust)':''}.</p>`:''}</div>
      <div class="group"><span class="label">Hard mode <span class="muted" style="font-weight:400">– optional</span></span><div class="seg">${[['0','Off'],['1','🌶️ On']].map(([v,l])=>`<button class="${(c.hard?'1':'0')===v?'on':''}" aria-pressed="${(c.hard?'1':'0')===v}" data-act="cfg" data-k="hard" data-v="${v}">${l}</button>`).join('')}</div><p class="hint" style="margin:8px 0 0">Question timers are 30% shorter, rivals are sharper, and every wrong answer costs 5% of your score.</p>
       <details class="rivals"${window.__rivOpen?' open':''}><summary>Meet the rivals</summary><ul>${BOTS.map(b=>`<li><span class="r-e" aria-hidden="true">${b.emoji}</span><span><b>${esc(b.name)}</b> ${esc(b.blurb)}</span></li>`).join('')}</ul></details></div>
      <div class="group"><label class="label" for="nameIn">Your name &amp; avatar</label><div class="btn-row name-row"><input class="input" id="nameIn" maxlength="14" value="${esc(S.name)}" placeholder="Your legendary name"><div class="seg emoji" role="group" aria-label="Choose avatar">${MY_EMOJIS.map(e=>`<button class="${S.emoji===e?'on':''}" aria-pressed="${S.emoji===e}" data-act="emoji" data-v="${e}" aria-label="Avatar ${e}">${e}</button>`).join('')}</div></div></div>
      <div class="group" id="passGroup"><label class="pass-toggle" for="passChk"><input type="checkbox" id="passChk"${c.passPlay?' checked':''}> Pass &amp; Play <span class="muted">– two players, one device</span></label>
       <p class="hint" style="margin:8px 0 0">Take turns on this screen. After each question, a prompt tells you to pass the device. Class, demo, tournament and challenge games stay one-player.</p>
       <div id="passFields"${c.passPlay?'':' hidden'}><label class="label" for="p2Name">Player 2 name &amp; avatar</label><div class="btn-row name-row"><input class="input" id="p2Name" maxlength="14" value="${esc((S.p2&&S.p2.name)||'Player 2')}" placeholder="Player 2"><div class="seg emoji" role="group" aria-label="Player 2 avatar">${MY_EMOJIS.map(e=>`<button class="${((S.p2&&S.p2.emoji)||'🐼')===e?'on':''}" aria-pressed="${((S.p2&&S.p2.emoji)||'🐼')===e}" data-act="p2emoji" data-v="${e}" aria-label="Player 2 avatar ${e}">${e}</button>`).join('')}</div></div>
       <label class="pass-toggle" for="teamChk" style="margin-top:12px"><input type="checkbox" id="teamChk"${c.passTeam?' checked':''}> Team up against the bots</label>
       <p class="hint" style="margin:8px 0 0">Share one score and take turns. The four rivals still play. Leave this off to play against each other.</p></div></div>
      <div class="more-tools">
        <button type="button" class="btn btn-secondary btn-sm" id="demoBtn" data-act="demo">⏱️ Try a 30-second demo</button>
        <button type="button" class="btn btn-secondary btn-sm" id="tourneyBtn" data-act="tourney">🏟️ All-modes tournament</button>
        <button class="btn btn-secondary btn-sm" id="muteBtn" data-act="mute">Sound: ${S.settings.sfx?'on':'off'}</button>
        <button class="btn btn-secondary btn-sm" id="musicBtn" data-act="music">Music: ${S.settings.music?'on':'off'}</button>
        <button class="btn btn-secondary btn-sm" id="levelBtn" data-act="levelpractice">Practise by level…</button>
        ${set?`<button class="btn btn-secondary btn-sm" id="studyBtn" data-act="study">🃏 Study cards (${set.qs.length})</button>`:''}
        ${(S.weak||[]).length?`<button class="btn btn-secondary btn-sm" id="practiceBtn" data-act="practice">Practise weak spots (${S.weak.length})</button>`:''}
      </div>
      ${set?goalBlock(set):''}
    </div>
   </section>
  </div>`;
  const rv=$('details.rivals');if(rv)rv.addEventListener('toggle',()=>{window.__rivOpen=rv.open});
  const ni=$('#nameIn');if(ni)ni.oninput=e=>{S.name=e.target.value.slice(0,14);save()};
  const pc=$('#passChk');if(pc)pc.onchange=()=>{S.cfg.passPlay=pc.checked;if(!pc.checked)S.cfg.passTeam=false;window.__moreOpen=true;save();renderSetup()};
  const tc=$('#teamChk');if(tc)tc.onchange=()=>{S.cfg.passTeam=tc.checked;window.__moreOpen=true;save();renderSetup()};
  const p2=$('#p2Name');if(p2)p2.oninput=e=>{S.p2=S.p2||{emoji:'🐼'};S.p2.name=e.target.value.slice(0,14);save()};
  const si=$('#setSearch');if(si){si.oninput=e=>{FILT.q=e.target.value;renderSetGrid()};renderSetGrid()}
  const g2=$('#setGrid .many');if(g2&&window.__gridScroll)g2.scrollTop=window.__gridScroll;
  const mb=$('#moreBtn');if(mb)mb.onclick=()=>{window.__moreOpen=!more;renderSetup();const el=$('#moreOpts');if(el&&window.__moreOpen)el.scrollIntoView({block:'nearest'})};
}
function goalBlock(set){const g=starGoal(set);
  if(!g)return `<p class="goal-hint" id="goalHint">★★★ All stars earned on this set. Nicely done!</p>`;
  return `<button class="btn btn-pop btn-sm" style="margin-top:8px;width:100%" id="goalBtn" data-act="stargoal">★ Practise for a star: ${esc(g.label)}</button><p class="goal-hint" id="goalHint">${esc(g.text)}</p>`}
function renderSetGrid(){
  const sets=S.sets.filter(s=>s.qs&&s.qs.length);const list=filterSets(sets);const ch=$('#setChips');if(!ch)return;ch.innerHTML=chipsHTML(sets);
  const rec=$('#recentRow');
  if(rec){const recs=(!FILT.q&&FILT.cat==='all')?recentSets(4):[];rec.innerHTML=recs.length?`<div class="recent-row"><span class="recent-label">Recently played</span><div class="recent-chips">${recs.map(s=>`<button type="button" class="recent-chip${s.id===S.cfg.setId?' on':''}" data-act="cfg" data-k="setId" data-v="${esc(s.id)}"><span aria-hidden="true">${s.emoji||'📚'}</span> ${esc(s.title)}</button>`).join('')}</div></div>`:''}
  $('#setGrid').innerHTML=list.length?`<div class="choice-grid${list.length>8?' many':''}" role="group" aria-labelledby="lblSet">${list.map(s=>{const f=isFav(s.id);return `<div class="choice-wrap"><button class="choice ${s.id===S.cfg.setId?'on':''}" aria-pressed="${s.id===S.cfg.setId}" data-act="cfg" data-k="setId" data-v="${esc(s.id)}"><b>${esc(s.title)}</b><span>${s.qs.length} questions${bestFor(s.id)} ${starsHTML(s)}</span></button><button type="button" class="star ${f?'on':''}" data-act="fav" data-id="${esc(s.id)}" aria-pressed="${f}" aria-label="${f?'Remove':'Add'} ${esc(s.title)} ${f?'from':'to'} favourites" title="${f?'Unfavourite':'Favourite'}">${f?'★':'☆'}</button></div>`}).join('')}</div>`
    :emptyHTML({panel:false,small:true,mascot:false,body:'No sets match'+(FILT.q?' “'+esc(FILT.q)+'”':' that filter')+'.',cta:'<button class="btn btn-secondary btn-sm" data-act="fclear">Clear filters</button>'});
  $('#setHint').innerHTML=list.length>8?`${list.length} of ${sets.length} sets: scroll the list for more, or <a href="sets.html#new">make your own</a>.`:(list.length<sets.length?`${list.length} of ${sets.length} sets shown.`:'')}

/* ---------------- game engine ---------------- */
const OUT=[['gold',30],['gold2',20],['jackpot',4],['double',6],['steal',14],['lose',11],['lose25',4],['dust',5]];
const KEY_EVERY=5,KEY_CAP=2;
const keyPays=o=>['gold','gold2','jackpot','double'].includes(o.type);
function rollOutcome(){
  const tot=OUT.reduce((a,o)=>a+o[1],0);let x=Math.random()*tot,type='gold';
  for(const [t,w] of OUT){x-=w;if(x<=0){type=t;break}}
  const o={type};
  if(type==='gold')o.amt=rnd(20,50);else if(type==='gold2')o.amt=rnd(60,110);else if(type==='jackpot')o.amt=rnd(160,260);else if(type==='lose')o.amt=rnd(15,40);
  return o}
const outLabel=o=>({gold:`+${o.amt} gold`,gold2:`+${o.amt} gold`,jackpot:`Jackpot! +${o.amt}`,double:'Double gold!',steal:'Steal from a bot',lose:`Goblin! -${o.amt} gold`,lose25:'Big goblin! -25%',dust:'Totally empty'}[o.type]);
const isGood=o=>['gold','gold2','jackpot','double','steal'].includes(o.type);
/* Virtual game clock: gnow() stops while paused, and schedule() runs on that clock (pumped by loop()), so pausing freezes everything cleanly. */
function gnow(){return G?((G.paused||G._held)?(G.paused?G.pausedAt:G._heldAt):performance.now())-G.pt:performance.now()}
function holdClock(on){if(!G)return;if(on){if(G._held)return;G._held=true;G._heldAt=performance.now()}else{if(!G._held)return;G.pt+=performance.now()-G._heldAt;G._held=false}}
function schedule(ms,fn){const g=G;if(!g)return;g.queue.push({at:gnow()+ms,fn})}
function loop(){
  const g=G;if(!g||g.paused||g.phase==='over')return;
  const n=gnow();const due=g.queue.filter(x=>x.at<=n);if(due.length){g.queue=g.queue.filter(x=>x.at>n);for(const x of due){if(G!==g||g.phase==='over')return;x.fn()}}
  if(G===g&&g.started&&g.phase!=='over'){tick();if(G===g&&g.phase==='fish')fishStep();else if(G===g&&g.phase==='cafe')cafeStep()}}
function pauseGame(){
  if(!G||G.paused||!G.started||G.phase==='over')return;
  G.paused=true;G.pausedAt=performance.now();Music.stop();stopSpeak();sfx('click');
  const q=$('#qcard');if(q){const o=document.createElement('div');o.className='pause-ov';o.id='pauseOv';o.innerHTML='<div class="mascot-wrap" aria-hidden="true">'+mascot('happy')+'</div><h2>Paused</h2><p>Clocks stopped. The bots are standing very still. Suspiciously still.</p><button class="btn btn-primary btn-lg" data-act="resume" id="resumeBtn">Resume <span class="kbd">P</span></button>';q.appendChild(o);const b=$('#resumeBtn');if(b)b.focus()}
  const pb=$('#pauseBtn');if(pb)pb.textContent='Resume';live('Game paused')}
function resumeGame(){
  if(!G||!G.paused)return;G.pt+=performance.now()-G.pausedAt;G.paused=false;const o=$('#pauseOv');if(o)o.remove();
  const pb=$('#pauseBtn');if(pb)pb.textContent='Pause';sfx('click');if(S.settings.music&&G.phase!=='over')Music.start();live('Game resumed')}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame()});
function addScore(p,n){
  p.prev=p.score;p.score=Math.max(0,p.score+n);G.dirty=true;
  if(p===G.me&&n)floatText((n>0?'+':'')+n);
  if(G.mode==='brawl'&&n>0)bossHit(n);
  checkGoal()}
function floatText(txt){const el=$('#myScore');if(!el)return;const r=el.getBoundingClientRect();const f=document.createElement('div');f.className='float-score';f.textContent=txt;f.style.left=(r.left)+'px';f.style.top=(r.bottom)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1000)}
function checkGoal(){
  if(!G||G.mode==='brawl'||!G.goal||G.phase==='over'||G.goalHit)return;
  const w=G.players.find(p=>p.score>=G.goal);if(!w)return;
  G.goalHit=true;
  if(w===G.me)schedule(1500,()=>endGame('goal'));else{toast(`${w.name} reached the goal`);endGame('goal')}}
function applyOutcome(p,o){
  const me=G.me;
  switch(o.type){
   case'gold':case'gold2':addScore(p,o.amt);return{text:pickQuip([`+${o.amt} gold. Cha-ching!`,`+${o.amt} gold. Shiny.`,`+${o.amt} gold. Pocket it.`,`+${o.amt} gold. Dragon-approved.`,`+${o.amt} gold. Sparkly!`]),good:true,s:'coin'};
   case'jackpot':addScore(p,o.amt);return{text:pickQuip([`JACKPOT! +${o.amt}. Treat yourself.`,`JACKPOT! +${o.amt}. Do a little dance.`]),good:true,s:'jackpot'};
   case'double':{const g=Math.min(Math.max(p.score,40),300);addScore(p,g);return{text:`Double gold! +${g}. Maths is power.`,good:true,s:'jackpot'}}
   case'steal':{
     const pool=G.players.filter(x=>x!==p);if(!pool.length)return{text:'Nobody to steal from. Awkward.',good:false,s:'lose'};
     let v;if(p===me){const rich=pool.filter(b=>b.score>0);v=pick(rich.length?rich:pool)}
     else{const others=pool.filter(b=>b!==me);v=(me.score>40&&Math.random()<.35)?me:(others.length?pick(others):me)}
     if(!v)return{text:'Nobody to steal from. Awkward.',good:false,s:'lose'};
     const amt=Math.min(v.score,rnd(25,70));addScore(v,-amt);addScore(p,amt);
     if(v===me&&amt){toast(`${p.name} stole ${amt} gold from you. Rude!`);sfx('steal')}
     return{text:amt?`Stole ${amt} from ${v.name}. Rude, but effective.`:`${v.name} had nothing. Awkward.`,good:amt>0,s:'steal'}}
   case'lose':{const l=Math.min(p.score,o.amt);addScore(p,-l);return{text:pickQuip([`A goblin swiped ${l} gold. Typical.`,`A goblin swiped ${l} gold. He said thanks.`]),good:false,s:'lose'}}
   case'lose25':{const l=Math.round(p.score*.25);addScore(p,-l);return{text:`A very large goblin took ${l} gold.`,good:false,s:'lose'}}
   default:return{text:pickQuip(['The chest was empty. Much like your gold.','Just air. Premium air, though.','Empty! The goblin got here first.','Empty! Even the cobwebs moved out.','Just one lonely sock. Weird.']),good:false,s:'lose'}}
}

/* ---------------- rival taunts ---------------- */
const TAUNTS={
 'Captain Quill':{lead:['Experience beats enthusiasm. Mostly.','Back in front where I belong.'],lost:['Well played. Do not get used to it.','Hm. Respectable.'],streak:['Four in a row. Routine.'],gloat:['A rookie mistake.','Happens to the best. Not to me, though.'],final:['Ten seconds. Make them count.'],win:['Good game. Next time, perhaps.','Experience wins again.'],lose:['You earned that one. Salute.']},
 'Prof. Pickle':{lead:['Technically, I am ahead. Technically.','Elementary, my dear competitor.'],lost:['That is statistically unlikely.','Interesting. I shall recalculate.'],streak:['My brain is simply too big.'],gloat:['Actually, the answer was different.','Did you read the question? I read it.'],final:['Time is a flat circle. Also nearly up.'],win:['The data is clear: I win.','Study more, play less. Actually, play. Study too.'],lose:['I demand a recount. (Fine, you won.)']},
 'Zippy':{lead:['ZOOM! Catch me if you can!','Too fast for you!'],lost:['Whoa, you are quick too!','Hey, no fair, I blinked!'],streak:['Four already! I am a blur!'],gloat:['Oof, slow down and still miss?','Fast AND right. You should try it.'],final:['Final sprint! Go go go!'],win:['Zoom zoom, I win!','Did you see that? Neither did I, I was too fast!'],lose:['Rematch! I was warming up!']},
 'Nova':{lead:['Gravity pulls me to first place.','Out of this world, huh?'],lost:['A shooting star! Impressive.','You orbit fast.'],streak:['I am heating up.'],gloat:['A miss. Houston, we have a problem.','That one drifted off course.'],final:['The final countdown. My favourite part.'],win:['I always shine in the last minute.','Starlight beats daylight.'],lose:['A supernova! Well done.']},
 'Mochi':{lead:['*yawn* ...oh, I am winning?','Nap time is over. Hello, first place.'],lost:['Mrrp. You woke me up.','Okay okay, I will try now.'],streak:['Four in a row and I did not even stretch.'],gloat:['Nyaa, bad luck.','Even I knew that one, and I was asleep.'],final:['Time for my final zoomies!'],win:['Purrfect. Now back to napping.','Nap, win, repeat.'],lose:['You win. I am going back to sleep.']},
 'Turbo':{lead:['Slow and steady. Look at me now.','Patience wins races.'],lost:['You are fast. I am sure.','No rush. I will catch up.'],streak:['One careful answer at a time.'],gloat:['Take your time. Oh wait.','Think it through next time!'],final:['Almost there. Slowly.'],win:['The tortoise strikes again.','Told you. Slow and steady.'],lose:['Well run. I mean, well answered.']},
 'Bubbles':{lead:['Bloop bloop, look who is on top!','I am on a roll!'],lost:['Blub! You splashed past me!','Nice wave!'],streak:['Four! The bubbles are bubbling!'],gloat:['Glub. That one sank.','Do not worry, you will float back up.'],final:['Make waves, final minute!'],win:['Bloop! A bubbly victory!','Splashy finish, if I say so myself.'],lose:['You were a tidal wave!']},
 'Sir Squiggle':{lead:['Behold! The leader returns!','Applause, please. I will wait.'],lost:['A fluke, surely. A magnificent fluke.','Hmph! I let you have that.'],streak:['Four in a row! Tell your friends!'],gloat:['Oh dear, oh dear, oh dear.','Was that on purpose? Brave.'],final:['The grand finale! Watch closely!'],win:['Magnificent! Truly, I am magnificent.','Sir Squiggle wins! Please bow.'],lose:['You win. This time. Magnificent effort.']}
};
function taunt(b,kind){
  const g=G;if(!g||S.settings.taunts===false||g.paused)return;
  const end=kind==='win'||kind==='lose';if(!end&&g.phase==='over')return;
  const nowW=performance.now();if(!end&&g.lastTaunt!=null&&nowW-g.lastTaunt<5500)return;
  if(!b){if(!g.bots.length)return;const ahead=g.bots.filter(x=>x.score>g.me.score);const pool=(ahead.length?ahead:g.bots);const tw=pool.flatMap(x=>Array((x.p&&x.p.chat)||1).fill(x));b=tw[Math.floor(Math.random()*tw.length)]}
  const lines=(TAUNTS[b.name]||{})[kind];if(!lines)return;
  g.lastTaunt=nowW;const line=lines[Math.floor(Math.random()*lines.length)];
  const el=$('#taunts');if(!el)return;const tok=++g.tauntTok||(g.tauntTok=1);
  {const sr=$('#srTaunt');if(sr)sr.textContent=`${b.name} says: ${line}`}
  el.innerHTML=`<div class="taunt" style="--tc:${b.color}"><span class="t-av" aria-hidden="true">${b.emoji}</span><span class="t-tx"><b>${esc(b.name)}</b>${esc(line)}</span></div>`;
  setTimeout(()=>{if(G===g&&g.tauntTok===tok){const e=$('#taunts');if(e)e.innerHTML=''}},4600)}
function botEff(b,pr){const P=b.p||{};let spd=b.speed,acc=b.acc;
  if(P.early&&pr<.35)spd*=P.early;else if(P.late&&pr>(P.early?.35:.7))spd*=P.late;
  if(P.streaky)acc=Math.min(.95,acc+Math.min(.15,.03*b.streak));
  return{spd,acc}}

/* ---------------- challenge links ---------------- */
let CH=null;
function challengeLink(g){
  const sid=g.set.id,builtin=ALL_SAMPLES.some(x=>x.id===sid);
  const diff=(g.diff&&g.diff!=='auto')?g.diff:(S.cfg.diff==='auto'?(typeof autoDiff==='function'?autoDiff():'normal'):(S.cfg.diff||'normal'));
  const o={i:sid,m:g.mode,t:g.time,d:['easy','normal','hard'].includes(diff)?diff:'normal',h:g.hard?1:0,s:g.me.score,n:g.me.name==='You'?'':g.me.name.slice(0,14)};
  if(!builtin)o.u=packSet(g.set);
  return appPath('play.html')+'#challenge='+b64e(JSON.stringify(o))}
function parseChallenge(h){
  try{const m=/^#challenge=([A-Za-z0-9_-]+)$/.exec(h);if(!m)return null;const o=JSON.parse(b64d(m[1]));
    if(!MODES[o.m]||![30,60,120,180,300].includes(o.t)||!['easy','normal','hard'].includes(o.d))return null;
    const score=Math.max(0,Math.min(99999,Math.round(+o.s)));if(!isFinite(score))return null;
    let set=null;if(o.u){const u=unpackSet(o.u);const qs=(u.qs||[]).slice(0,200).map(cleanQ).filter(Boolean);if(!qs.length)return null;set={id:String(o.i||uid()).slice(0,40),title:String(u.title||'Challenge set').slice(0,40),qs};if(u.emoji&&String(u.emoji).length<=8)set.emoji=u.emoji;if(CATS.includes(u.cat))set.cat=u.cat}
    else if(!ALL_SAMPLES.some(x=>x.id===o.i))return null;
    return{id:set?set.id:o.i,set,mode:o.m,time:o.t,diff:o.d,hard:!!o.h,score,name:String(o.n||'A friend').replace(/[<>]/g,'').slice(0,14)||'A friend'}}catch(e){return null}}
function checkIncomingChallenge(h){
  h=h||location.hash;if(!/^#challenge=/.test(h))return false;const c=parseChallenge(h);history.replaceState(null,'',location.pathname+location.search);
  if(!c){toast('That challenge link looks damaged. Ask for a fresh one.');return false}
  const m=MODES[c.mode];const sname=c.set?c.set.title:(ALL_SAMPLES.find(x=>x.id===c.id)||{}).title;
  modal(`<h2>🤜 ${esc(c.name)} challenges you!</h2><div class="ch-beat" id="chBeat"><span class="ch-beat-kicker">Beat this score</span><b>Beat ${c.score} ${m.unit}</b> in ${m.name}</div><p><span class="muted">${esc(sname||'')} · ${c.time>=60?c.time/60+' min':c.time+' sec'} · ${c.diff} rivals${c.hard?' · hard mode 🌶️':''}</span></p>
   <p class="hint">Everything is set up for you. The clock starts after the 3-2-1 countdown.</p>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Not now</button><button class="btn btn-primary" id="acceptCh">Accept challenge</button></div>`,(o,close)=>{
    $('#acceptCh',o).onclick=()=>{close();
      if(c.set&&!S.sets.some(x=>x.id===c.id)){const st=clone(c.set);S.sets.push(st);S.seen=S.seen||[];S.seen.push(st.id)}
      S.cfg.setId=c.id;S.cfg.mode=c.mode;S.cfg.time=c.time;S.cfg.goal[c.mode]=0;S.cfg.diff=c.diff;S.cfg.hard=c.hard;save();SEASON=false;TOURNEY=false;
      CH={score:c.score,name:c.name};P=null;startGame()}});return true}
function challengeQr(text,px){
  if(typeof qrcode!=='function'||!text||text.length>1500)return null;
  let q=null;for(const lvl of ['M','L']){try{const t=qrcode(0,lvl);t.addData(text);t.make();q=t;break}catch(e){}}
  if(!q)return null;const n=q.getModuleCount(),m=4;let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+m},${r+m}h1v1h-1z`;
  return `<svg class="qr ch-qr" viewBox="0 0 ${n+2*m} ${n+2*m}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code for the challenge link"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
}
function challengeInvite(g,link){
  g=g||CURRENT_END;if(!g||!g.me)return '';
  const un=(g.tourney?'pts':(MODES[g.mode]||{}).unit)||'';
  const mode=g.tourney?'an all-modes tournament':((MODES[g.mode]||{}).name||'QuizBlox');
  return 'I scored '+g.me.score+' '+un+' in '+mode+' on '+(g.set&&g.set.title||'a question set')+'. Can you beat me at QuizBlox? '+link
}
function copyText(text,okMsg){
  let ok=false;try{ok=document.execCommand('copy')}catch(e){}
  const done=()=>toast(okMsg||'Copied');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,()=>ok?done():toast('Press Ctrl+C to copy'));
  else ok?done():toast('Press Ctrl+C to copy')
}
function openChallenge(){
  const g=CURRENT_END;if(!g)return;const link=challengeLink(g),un=g.tourney?'pts':MODES[g.mode].unit,msg=challengeInvite(g,link),qr=challengeQr(link,148);
  const back=g.ch?`<p class="hint">You just played ${esc(g.ch.name)}'s challenge. Send a rematch at your new score.</p>`:'';
  modal(`<h2>${g.ch?'Challenge them back':'Challenge a friend'}</h2>${back}<p class="hint">Send this link. When your friend opens it, the same set, mode and time are loaded and they try to beat your <b>${g.me.score} ${un}</b>. Nothing is uploaded; it all travels in the link.</p>
   <div class="ch-share">${qr?`<div class="ch-qr-wrap">${qr}<p class="muted">Scan to play</p></div>`:''}<div class="ch-share-main">
   <label class="sr-only" for="chLink">Challenge link</label><input class="input" id="chLink" readonly value="${esc(link)}" style="width:100%">
   <label class="sr-only" for="chMsg">Invite message</label><textarea class="textarea" id="chMsg" rows="3" readonly style="width:100%;margin-top:8px">${esc(msg)}</textarea>
   </div></div>
   ${link.length>2000?`<p class="hint" style="color:var(--coral-d)">This link is long (${link.length} characters) because your set is custom. Some apps may cut it off.</p>`:''}
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Close</button>${navigator.share?`<button class="btn btn-secondary" id="shareCh" type="button">Share…</button>`:''}<button class="btn btn-secondary" id="copyMsg" type="button">Copy message</button><button class="btn btn-primary" id="copyCh">Copy link</button></div>`,(o)=>{
    const inp=$('#chLink',o);inp.focus();inp.select();
    const mark=btn=>{if(!btn)return;const old=btn.textContent;btn.textContent='Copied!';setTimeout(()=>{if(btn)btn.textContent=old},1600)};
    $('#copyCh',o).onclick=()=>{inp.select();copyText(link,'Link copied');mark($('#copyCh',o))};
    const cm=$('#copyMsg',o);if(cm)cm.onclick=()=>{const ta=$('#chMsg',o);if(ta){ta.focus();ta.select()}copyText(msg,'Message copied');mark(cm)};
    const sh=$('#shareCh',o);if(sh)sh.onclick=()=>{navigator.share({title:'QuizBlox challenge',text:msg,url:link}).catch(()=>{})};
});
}
/* ---------------- class mode (student side) ---------------- */
function checkIncomingClass(h){
  h=h||location.hash;if(!/^#class=/.test(h))return false;const c=parseClassLink(h);history.replaceState(null,'',location.pathname+location.search);
  if(!c){toast('That class link looks damaged. Ask your teacher for a fresh one.');return false}
  const m=MODES[c.mode];$$('.overlay').forEach(x=>x.remove());const rl=c.rules==='hard'?'🌶️ Hard mode: shorter timers, rivals are sharper and wrong answers cost points.':c.rules==='relaxed'?'🧘 No timers: take your time on every question.':'';
  modal(`<h2>🏫 ${esc(c.name)}</h2><p>Your teacher set up a class challenge.<br><span class="muted">${esc(c.set.title)} · ${m.emoji} ${esc(m.name)} · ${c.time>=60?c.time/60+' min':c.time+' sec'}</span></p>
   ${rl?`<p class="rules-note" id="clRules"><b>Teacher's rule:</b> ${rl}</p>`:''}<label class="label" for="clName">Your name <span class="muted" style="font-weight:400">(your teacher will see it)</span></label><input class="input" id="clName" maxlength="14" autocomplete="off" value="${S.name&&S.name!=='You'?esc(S.name):''}" placeholder="First name and initial" style="width:100%">
   <p class="hint">Play one game. At the end you get a short result code to send back to your teacher. Nothing is uploaded: your score travels inside the code.</p>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Not now</button><button class="btn btn-primary" id="startCl">Start the challenge</button></div>`,(o,close)=>{
    const go=()=>{const nm=plainName($('#clName',o).value);if(!nm){toast('Type your name first so your teacher knows it is you');$('#clName',o).focus();return}
      S.name=nm;save();close();SEASON=false;TOURNEY=false;CH=null;P=null;startGame({tag:'class',set:c.set,mode:c.mode,time:c.time,goal:0,hard:c.rules==='hard',relaxed:c.rules==='relaxed',rules:c.rules,cl:{k:c.k,name:c.name}})};
    $('#startCl',o).onclick=go;$('#clName',o).addEventListener('keydown',e=>{if(e.key==='Enter')go()});$('#clName',o).focus()});return true}
function classPanel(g){
  const me=g.me,n=g.set.qs.length,ql=g.qlog||{};const seen=n<=CLASS_QMAX?Array.from({length:n},(_,i)=>ql[i]?1:0):null,miss=seen?Array.from({length:n},(_,i)=>ql[i]===2?1:0):null;const code=makeClassCode(g.ov.cl.k,me.name,me.score,me.correct,me.total,me.best,seen,miss);
  return `<div class="class-code" id="classPanel"><h3>🏫 Your result code</h3><p class="hint" style="margin:0 0 10px">Send this code to your teacher (paste it into chat, email or a note). It holds your name, score and accuracy for <b>${esc(g.ov.cl.name)}</b>.</p>
   <label class="sr-only" for="clCode">Result code</label><input class="input" id="clCode" readonly value="${esc(code)}" style="width:100%;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px">
   <div class="btn-row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-act="copycode" id="copyCode">Copy code</button></div></div>`}
function showCoach(msg,key){
  if(!G||!G.demo)return;
  G._coach=G._coach||{};if(key&&G._coach[key])return;if(key)G._coach[key]=true;
  live(msg);
  let el=$('#coachTip');
  if(!el){el=document.createElement('div');el.id='coachTip';el.className='coach-tip';el.setAttribute('role','status');const q=$('#qcard');(q||view).appendChild(el)}
  el.textContent=msg;el.hidden=false;
}
function startDemo(){
  const set=S.sets.find(s=>s.id==='sample-gk')||S.sets[0];
  if(!set||!set.qs.length){toast('Pick a question set first');return}
  S.cfg.setId=set.id;S.cfg.mode='gold';S.cfg.time=30;S.cfg.goal=S.cfg.goal||{};S.cfg.goal.gold=0;S.cfg.diff='easy';S.cfg.hard=false;save();
  startGame({set,mode:'gold',time:30,goal:0,diff:'easy',hard:false,demo:true,tag:'demo'});
}
function startGame(ov){
  if(!ov||!ov.set)ov=null;
  const wasTourney=!!(TOURNEY||(ov&&ov.tag==='tourney'));
  TOURNEY=false;
  if(wasTourney&&!ov){
    const ts=S.sets.find(s=>s.id===S.cfg.setId);
    if(ts&&ts.qs&&ts.qs.length)ov={tag:'tourney',set:ts,time:TOURNEY_TIME,goal:0,diff:S.cfg.diff,hard:!!S.cfg.hard};
  }
  if(ov&&ov.tag==='tourney'){
    const modes=(ov.modes&&ov.modes.length)?ov.modes.filter(m=>MODES[m]):TOURNEY_MODES.slice();
    ov.modes=modes.length?modes:TOURNEY_MODES.slice();
    ov.mode=ov.modes[0];ov.time=ov.time||TOURNEY_TIME;ov.goal=0;
  }
  const c=ov?{setId:ov.set.id,mode:ov.mode,time:ov.time,goal:{[ov.mode]:ov.goal||0},diff:ov.diff||S.cfg.diff||'normal',hard:!!ov.hard}:S.cfg;const set=ov?ov.set:S.sets.find(s=>s.id===c.setId);if(!set||!set.qs.length){toast('Pick a question set first');return}
  if(G)stopGame();
  const resolvedDiff=c.diff==='auto'?autoDiff():(c.diff||'normal');
  const d=Object.assign({},{easy:{a:.8,s:.8},normal:{a:1,s:1},hard:{a:1.12,s:1.25}}[resolvedDiff]||{a:1,s:1});if(c.hard){d.a*=1.06;d.s*=1.1}
  const bots=shuffle(BOTS).slice(0,4).map((b0,i)=>({id:'b'+i,bot:true,name:b0.name,emoji:b0.emoji,color:b0.color,blurb:b0.blurb,p:b0.p,score:0,prev:0,streak:0,keys:0,acc:Math.min(.95,(.5+Math.random()*.35)*d.a+b0.p.accAdd),speed:(.75+Math.random()*.6)*d.s*b0.p.spd,next:0}));
  const me={id:'me',me:true,human:true,name:(S.name||'You').trim()||'You',emoji:S.emoji||'😎',color:MY_COLORS[S.emoji]||'#ffe08a',score:0,prev:0,streak:0,best:0,correct:0,total:0,times:[],keys:0};
  const now=0;
  SEASON=false;const ch=CH;CH=null;
  const wantPass=!!((ov&&ov.pass)||(!ov&&S.cfg.passPlay));
  const pass=wantPass&&!ch&&!(ov&&(ov.demo||ov.cl||ov.tag==='class'||ov.tag==='tourney'));
  const team=pass&&!!((ov&&ov.team)||(!ov&&S.cfg.passTeam));
  let botList=bots,players;
  const p2e=(S.p2&&MY_EMOJIS.includes(S.p2.emoji))?S.p2.emoji:'🐼';
  const p2name=((S.p2&&S.p2.name)||'Player 2').trim()||'Player 2';
  const mates=[{name:me.name,emoji:me.emoji},{name:p2name,emoji:p2e}];
  if(pass&&team){me.team=true;me.mateName=p2name;me.soloName=me.name;me.name=me.name+' & '+p2name;botList=bots;players=[me,...bots]}
  else if(pass){const p2={id:'p2',me:false,human:true,name:p2name,emoji:p2e,color:MY_COLORS[p2e]||'#ececf2',score:0,prev:0,streak:0,best:0,correct:0,total:0,times:[],keys:0};botList=[];players=[me,p2]}
  else players=[me,...bots];
  G={ov,relaxed:!!(S.settings.noTimer||(ov&&ov.relaxed)),ch,hard:!!c.hard,diff:resolvedDiff,autoDiff:c.diff==='auto',leader:null,mode:c.mode,set,qs:set.ordered?set.qs.slice():shuffle(set.qs),qi:-1,nq:0,me,bots:botList,players,pass,team,mates:pass?mates:null,hands:pass?mates[0]:null,phase:'countdown',start:now,endAt:Infinity,goal:c.goal[c.mode]||0,timeouts:[],queue:[],pt:0,paused:false,started:false,dirty:true,timer:null,time:c.time};const _pb=bestOf(set.id,c.mode,c.time,G.hard,G.relaxed);G.beat=_pb?_pb.score:0;G.beatHit=false;G.demo=!!(ov&&ov.demo);
  if(c.mode==='brawl'){const bb=ov&&ov.cl?bossForClass(ov.cl.k):pick(BOSSES);G.boss={max:G.goal||0,hp:G.goal||0,e:bb[0],n:bb[1],x:bb[2],sn:0}}
  if(ov&&ov.tag==='tourney'){G.tourney={modes:ov.modes.slice(),i:0,pts:{},legs:[],time:ov.time||TOURNEY_TIME};G.players.forEach(p=>G.tourney.pts[p.id]=0);G.goal=0;G.time=G.tourney.time;G.beat=0;G.beatHit=false}
  renderGameShell();if(G.mode==='rocket'){trackBar();const gg=G;schedule(900,()=>{if(G===gg)toast(pick(ROCKET_INTRO))})}if(G.boss){bossBar();const gg=G;schedule(900,()=>{if(G===gg&&G.boss)toast(G.boss.x.intro)})}sfx('click');window.scrollTo(0,0);audio();
  const g=G;const cd=$('#countdown');
  g.timer=setInterval(loop,50);
  [3,2,1].forEach((n,k)=>schedule(k*1000,()=>{cd.innerHTML=`<span class="cd-num">${n}</span>`;sfx('beep');live(String(n))}));
  schedule(3000,()=>{cd.innerHTML='<span class="cd-num go">Go!</span>';sfx('go')});
  schedule(3600,()=>{cd.remove();const t=gnow();g.start=t;g.endAt=t+c.time*1000;bots.forEach(b=>b.next=t+rnd(4000,9000)/b.speed);g.started=true;nextQuestion();if(S.settings.music)Music.start()});
}
function live(t){const el=$('#srLive');if(el)el.textContent=t}
function countTo(el,to,ms=450){if(!el)return;const from=parseInt(el.textContent,10)||0;if(from===to)return;
  if(S.settings.reduceMotion){el.textContent=to;return}
  const t0=performance.now();cancelAnimationFrame(el._r);const step=t=>{const k=Math.min(1,(t-t0)/ms);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)el._r=requestAnimationFrame(step)};el._r=requestAnimationFrame(step)}

function clearJuice(){
  document.documentElement.classList.remove('on-fire','final-lap');
  try{Music.hurry(false)}catch(e){}
  const b=$('#juiceBanner');if(b){clearTimeout(b._t);b.remove()}
}
function noteClutch(q,el){
  if(!G||G.photo||G.phase==='over')return false;
  const qLeft=q&&q.limit?Math.max(0,q.limit-el):Infinity;
  const gameLeft=G.endAt<Infinity?(G.endAt-gnow())/1000:Infinity;
  if(!((q&&q.limit>0&&qLeft<=1)||(gameLeft<=1&&gameLeft>=0)))return false;
  juiceBanner('⏰ BUZZER BEATER!','fire');sfx('fever');
  return true
}
function juiceBanner(text,cls,ms){
  ms=ms==null?1800:ms;
  live(text);
  if(S.settings.reduceMotion){toast(text);return}
  let el=$('#juiceBanner');
  if(!el){el=document.createElement('div');el.id='juiceBanner';el.setAttribute('aria-hidden','true');(view||document.body).appendChild(el)}
  el.className='juice-banner '+(cls||'');
  el.textContent=text;
  el.hidden=false;
  el.classList.remove('out');
  void el.offsetWidth;
  el.classList.add('in');
  clearTimeout(el._t);
  el._t=setTimeout(()=>{el.classList.add('out');setTimeout(()=>{if(el.classList.contains('out'))el.hidden=true},280)},ms);
}
function setFever(on){
  document.documentElement.classList.toggle('on-fire',!!on);
  const q=$('#qcard');if(q)q.classList.toggle('on-fire',!!on);
}
function tiedForFirst(g){
  const top=Math.max(...g.players.map(p=>p.score));
  return top>0&&g.me.score===top&&g.players.some(p=>!p.me&&p.score===top);
}
function startPhoto(){
  const g=G;if(!g||g.photoDone)return;
  g.queue=[];g.photo=true;g.photoDone=true;g.photoPending=true;g.phase='photo';
  g.endAt=gnow();
  const ck=$('#clock');if(ck){ck.textContent='0:00';ck.parentElement.classList.add('low','photo')}
  juiceBanner('📸 PHOTO FINISH!','photo',2000);
  sfx('lap');toast('Tied for first! One more question decides it.');
  live('Photo finish. One more question to break the tie.');
  g.bots.forEach(b=>{b.next=1e12});
  schedule(700,()=>{
    if(G!==g||g.phase==='over')return;
    g.photoPending=false;
    nextQuestion();
    if(G===g){const n=$('#qnum');if(n)n.textContent='Photo finish';const c=$('#qcard');if(c)c.classList.add('photo-q')}
  });
}

function updateKeyPill(){const p=$('#keyPill');if(!p||!G)return;const n=G.me.keys||0;p.hidden=n<=0;const b=$('#keyNum');if(b)b.textContent=n}
function grantLuckyKey(p){
  if(!G||G.mode!=='gold'||!p)return;
  const n=p.streak;if(n<KEY_EVERY||n%KEY_EVERY)return;
  p.keys=Math.min(KEY_CAP,(p.keys||0)+1);
  if(p===G.me){updateKeyPill();toast(p.keys===1?'Lucky key! A dud chest can be rerolled.':'Lucky key banked (max 2).');sfx('coin');live('Lucky key earned.')}}
function updateStreak(){const p=$('#streakPill');if(!p||!G)return;const n=G.me.streak;$('#streakNum').textContent=n;p.className='stat-pill streak '+(n>=7?'lv3':n>=5?'lv2':n>=3?'lv1':'lv0');if(n>=2){p.classList.add('bump');setTimeout(()=>p.classList.remove('bump'),400)}setFever(n>=5);if(n===5||n===8||n===10){if(G._juiceStreak!==n){G._juiceStreak=n;juiceBanner(n===5?'🔥 ON FIRE!':n===8?'☄️ UNSTOPPABLE!':'🌟 LEGENDARY!','fire');sfx(n===10?'jackpot':'fever')}}else if(n<5)G._juiceStreak=0;if(n>=KEY_EVERY&&n%KEY_EVERY===0)grantLuckyKey(G.me)}
function stopGame(){if(G){clearInterval(G.timer);save()}clearJuice();G=null;Music.stop();stopSpeak()}
function renderGameShell(){document.body.classList.add('playing');
  const m=MODES[G.mode];
  view.innerHTML=`<div class="hud${G.pass?" pass-hud":""}"><div class="stat-pill"><span>Time</span><b id="clock">${fmt(G.time*1000)}</b></div>
    ${G.tourney?`<div class="stat-pill tourney-pill" id="legPill"><span>Tournament</span><b>Leg ${G.tourney.i+1}/${G.tourney.modes.length}</b></div>`:''}<div class="stat-pill"><span>Mode</span><b style="font-size:15px">${m.name}</b></div>${G.tourney?`<div class="stat-pill" id="tPtsPill"><span>Pts</span><b id="tPts">${G.tourney.pts[G.me.id]||0}</b></div>`:''}${G.autoDiff?`<div class="stat-pill" id="diffPill"><span>Rivals</span><b>Auto · ${G.diff[0].toUpperCase()+G.diff.slice(1)}</b></div>`:''}
    <div class="stat-pill"><span>${G.mode==='brawl'?'Boss HP':'Goal'}</span><b style="font-size:15px">${G.goal?G.goal+(G.mode==='brawl'?'':' '+m.unit):(G.mode==='brawl'?'∞':'None')}</b></div>${G.relaxed?'<div class="stat-pill relaxpill"><b style="font-size:15px">🧘 No timers</b></div>':''}${G.hard?'<div class="stat-pill hardpill"><b style="font-size:15px">🌶️ Hard</b></div>':''}${G.ch?`<div class="stat-pill target" id="targetPill"><span>Beat ${esc(G.ch.name)}</span><b>${G.ch.score}</b></div>`:''}${G.beat?`<div class="stat-pill target best-pill" id="bestPill"><span>Your best</span><b>${G.beat}</b></div>`:''}
    <div style="flex:1"></div>
    <div class="stat-pill streak lv0" id="streakPill" title="Answer streak"><span>Streak</span><b><span class="flame" aria-hidden="true">🔥</span><i id="streakNum">0</i></b></div>
    ${G.pass?`<div class="stat-pill" id="turnPill"><span>Turn</span><b>${esc((G.team&&G.hands&&G.hands.name)||G.me.name)}</b></div>`+(G.team?`<div class="stat-pill score on" id="scorePill"><span>${esc(G.me.name)}</span><b id="myScore">${G.me.score}</b></div>`:G.players.filter(p=>p.human||p===G.me||p.id==='p2').map(p=>`<div class="stat-pill score pass-score${p===G.me?' on':''}" data-pid="${p.id}" id="${p.id==='me'?'scorePill':'p2Pill'}"><span>${esc(p.name)}</span><b id="${p.id==='me'?'myScore':'p2Score'}">${p.score}</b></div>`).join('')):`<div class="stat-pill score" id="scorePill"><span>Your ${m.unit}</span><b id="myScore">${G.me.score}</b></div>`}
    ${G.mode==='gold'?`<div class="stat-pill key-pill" id="keyPill" hidden><span>Lucky key</span><b>🔑 <i id="keyNum">0</i></b></div>`:''}
    <button class="btn btn-secondary btn-sm" data-act="pause" id="pauseBtn" title="Pause (P)">Pause</button><button class="btn btn-secondary btn-sm" data-act="mute" id="muteBtn">Sound: ${S.settings.sfx?'on':'off'}</button>
    <button class="btn btn-danger btn-sm" data-act="quit">Quit</button></div>
  <div class="juice-banner" id="juiceBanner" hidden></div>
  <div class="game-grid page-body"><section class="q-card" id="qcard"><div class="tbar"><i id="tfill"></i></div>
    <div class="q-meta"><span id="qnum">Get ready</span><span id="qdiff"></span>${TTS_OK?'<button class="speak-btn" data-act="speak" aria-label="Read question aloud" title="Read aloud">🔊</button>':''}<span id="qstreak"></span></div>
    <h2 class="q-title" id="qtext">Warming up the chests…</h2><div class="q-pic" id="qpic"></div><div class="answers" id="answers"></div><div class="feedback" id="feedback" role="status"></div>
    <div class="countdown" id="countdown" aria-hidden="true"><span class="cd-num">Ready?</span></div></section>
  <aside class="panel lb-panel"><h3>Leaderboard</h3>${G.mode==='race'?`<div class="race-pack" id="racePack"><div class="rp-gap" id="raceGap"></div><div class="rp-track" id="raceTrack" aria-hidden="true"></div></div>`:''}<div class="taunts" id="taunts" aria-hidden="true"></div><div id="board"></div></aside></div><div class="sr-only" id="srLive" aria-live="polite"></div><div class="sr-only" id="srTaunt" aria-live="polite"></div>`;
  renderBoard();
}

function updateRacePack(){
  if(!G||G.mode!=='race')return;
  const track=$('#raceTrack'),gap=$('#raceGap');if(!track)return;
  const ps=G.players,top=Math.max(0,...ps.map(p=>p.score));
  let mx=Math.max(100,Math.round(top*1.25)||100);
  if(G.goal&&top>=G.goal*.8)mx=Math.max(mx,G.goal);
  const ranked=[...ps].sort((a,b)=>b.score-a.score||(a.me?1:b.me?-1:0));
  const me=G.me,lead=ranked[0],chaser=ranked.find(p=>p!==lead);
  if(gap){
    if(!lead||(lead.score||0)<=0)gap.textContent='On the line — first points set the pace.';
    else if(lead===me||(lead.score===me.score&&me.score>0&&!ranked.some(p=>!p.me&&p.score===me.score)))gap.textContent=chaser?('Leading by '+(me.score-chaser.score)):'In the lead.';
    else gap.textContent=(lead.score-me.score)+' behind '+lead.name+'.';
    const st=me.streak||0;if(st>=2)gap.textContent+='  Streak +'+Math.min(st-1,5)*20+'.';
  }
  track.innerHTML=ps.map(p=>{
    const pct=Math.max(4,Math.min(96,(p.score||0)/mx*100));
    return `<span class="rp-racer ${p.me?'me':''}" style="left:${pct}%;--rc:${p.color||'#ffcf3f'}" title="${esc(p.name)} · ${p.score}">${p.emoji||'●'}</span>`;
  }).join('');
}

function renderBoard(){
  const el=$('#board');if(!el||!G)return;
  const ps=[...G.players].sort((a,b)=>b.score-a.score||(a.me?1:b.me?-1:0));
  const mx=Math.max(...ps.map(p=>p.score));const scale=(G.mode==='brawl'?0:G.goal)||Math.max(500,mx*1.1);
  el.innerHTML=ps.map((p,i)=>`<div class="lb-row ${p.me?'me':''}"><span class="rk">${i+1}</span>${avatarHTML(p,36)}<span class="n"${p.blurb?` title="${esc(p.blurb)}"`:''}>${esc(p.name)}${p.me?' (you)':''}${G.mode==='gold'&&p.keys?`<span class="key-mark" title="Lucky key">🔑</span>`:''}</span><span class="sc">${p.score}</span><span class="bar"><i style="width:${Math.min(100,p.score/scale*100)}%"></i></span></div>`).join('');
  const rk=ps.indexOf(G.me)+1,now=gnow();
  if(G.lastRank&&G.me.score>0&&G.phase!=='countdown'&&G.phase!=='over'){
    if(rk>G.lastRank&&now-(G.lastToast||0)>4000&&ps[rk-2]){G.lastToast=now;toast(`${ps[rk-2].name} just passed you. Rude.`)}
    else if(rk===1&&G.lastRank>1&&now-(G.lastToast||0)>4000){G.lastToast=now;toast('You took the lead! Enjoy it while it lasts.');if(G.lastRank>=4){juiceBanner('🔥 COMEBACK!','fire');sfx('jackpot')}}}
  G.lastRank=rk;if(G.mode==='rocket')updateTrack();
  if(G.pass){G.players.forEach(p=>{const el=document.querySelector('.pass-score[data-pid="'+p.id+'"] b');if(el&&G.phase!=='countdown')countTo(el,p.score);const row=document.querySelector('.pass-score[data-pid="'+p.id+'"]');if(row)row.classList.toggle('on',p===G.me)});const tp=$('#turnPill');if(tp)tp.innerHTML='<span>Turn</span><b>'+esc((G.team&&G.hands&&G.hands.name)||G.me.name)+'</b>'}else{const s=$('#myScore');if(s&&G.phase!=='countdown')countTo(s,G.me.score)}
  if(G.mode==='race')updateRacePack();
}
const qSpeech=q=>q.type==='type'?q.text+'. Type your answer.':q.type==='tf'?q.text+'. True or false?':q.text+'. '+q.answers.map((x,i)=>LETTERS[i]+': '+x.t).join('. ');
function picHTML(q){return q.pic?`<span class="q-pic-e" role="img" aria-label="Picture clue">${esc(q.pic)}</span>`:''}
function answersHTML(q,act){
  if(q.type==='type')return `<form class="type-box" autocomplete="off"><label class="sr-only" for="typeIn">Your answer</label><input class="input" id="typeIn" type="text" maxlength="80" placeholder="Type your answer…" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done"><button class="btn btn-primary" type="submit" id="typeGo">Answer</button><p class="type-hint">Capitals and small typos are forgiven.</p></form>`;
  return q.answers.map((x,i)=>`<button class="answer t${i}" data-act="${act}" data-i="${i}"><span class="badge">${q.type==='tf'?(i?'✕':'✓'):LETTERS[i]}</span><span class="t">${esc(x.t)}</span><span class="key" aria-hidden="true">${i+1}</span></button>`).join('')}
function mountQ(q,act,cls){
  const p=$('#qpic');if(p){p.innerHTML=picHTML(q);p.className='q-pic'+(q.pic?' on':'')}
  const a=$('#answers');a.className='answers'+(q.type==='tf'?' tf':'')+(q.type==='type'?' typed':'')+(cls?' '+cls:'');a.innerHTML=answersHTML(q,act);
  const ti=$('#typeIn');if(ti)setTimeout(()=>{try{ti.focus({preventScroll:true})}catch(e){}},30)}
function typedValue(){const t=$('#typeIn');return t?t.value:''}
function typedResult(q,ok,typed,close){const a=$('#answers');if(!a)return;a.innerHTML=`<div class="type-result ${ok?'ok':'no'}"><span>${typed?'You typed: <b>'+esc(typed)+'</b>':'<i>No answer</i>'}${close?' <em>(typo forgiven)</em>':''}</span><span>Answer: <b>${esc(q.accept[0])}</b>${q.accept.length>1?' <small>also accepted: '+esc(q.accept.slice(1).join(', '))+'</small>':''}</span></div>`}
function passNext(){if(!G||!G.pass)return null;if(G.team&&G.mates){const cur=G.hands||G.mates[0];return G.mates.find(m=>m!==cur)||G.mates[1]}return G.players.find(p=>p!==G.me)||G.players[1]}
function showPass(){
  if(!G||!G.pass||G.phase==='over')return;
  G.phase='pass';holdClock(true);
  const nxt=passNext(),cur=G.team?(G.hands||(G.mates&&G.mates[0])):G.me;
  const old=$('#passOv');if(old)old.remove();
  const scores=G.team?`<span class="pass-sc on"><b>${esc(G.me.emoji)} ${esc(G.me.name)}</b> ${G.me.score}</span>`:G.players.map(p=>`<span class="pass-sc${p===cur?' on':''}"><b>${esc(p.emoji)} ${esc(p.name)}</b> ${p.score}</span>`).join('');
  const kicker=G.team?'Team Pass &amp; Play':'Pass &amp; Play';
  const o=document.createElement('div');o.className='pass-ov';o.id='passOv';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-labelledby','passTitle');
  o.innerHTML=`<div class="pass-card"><p class="pass-kicker">${kicker}</p><h2 id="passTitle">Pass the device to ${esc(nxt.name)}</h2><p class="pass-scores">${scores}</p><button type="button" class="btn btn-primary btn-lg" data-act="passready" id="passReady">I'm ${esc(nxt.name)} — let's go <span class="kbd">Space</span></button></div>`;
  const q=$('#qcard');(q||view).appendChild(o);
  const b=$('#passReady');if(b)try{b.focus()}catch(e){}
  if(typeof trapFocus==='function'){if(G._untrapPass)G._untrapPass();G._untrapPass=trapFocus(o.querySelector('.pass-card')||o,null)}
  live('Pass the device to '+nxt.name);sfx('whoosh');
}
function readyPass(){
  if(!G||G.phase!=='pass')return;
  if(G.team&&G.mates){G.hands=passNext()}
  else{const nxt=G.players.find(p=>p!==G.me);if(nxt){G.me.me=false;nxt.me=true;G.me=nxt}}
  if(G._untrapPass){try{G._untrapPass()}catch(e){}G._untrapPass=null}
  holdClock(false);const o=$('#passOv');if(o)o.remove();
  G._skipPass=true;renderBoard();nextQuestion();
}
function nextQuestion(){
  if(!G||G.phase==='over'||G.phase==='tourney')return;
  if(G.pass&&!G.photo&&G.nq>0&&!G._skipPass&&G.phase!=='pass'){showPass();return}
  G._skipPass=false;
  G.qi++;if(G.qi>=G.qs.length){let n=shuffle(G.set.qs);if(n.length>1&&n[0]===G.qs[G.qs.length-1])n.push(n.shift());G.qs=n;G.qi=0}
  const raw=G.qs[G.qi];
  G.q=buildQ(raw);G.q.limit=raw.t==null?(G.q.type==='type'?30:DEFAULT_TIME):raw.t;if(G.hard&&G.q.limit>0)G.q.limit=Math.max(5,Math.round(G.q.limit*.7));if(G.relaxed)G.q.limit=0;$('#qcard').classList.toggle('notimer',!!G.relaxed);
  G.nq++;G.phase='question';G.qStart=gnow();
  $('#qnum').textContent=`Question ${G.nq}`+(G.set.mix&&raw._st?` · ${raw._st}`:'');$('#qdiff').innerHTML=dpips(raw.d);$('#qstreak').textContent='';sfx('whoosh');live(`Question ${G.nq}. ${G.q.text}`);if(S.settings.tts)speak(qSpeech(G.q));
  $('#qtext').textContent=G.q.text;const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';$('#qcard').className='q-card'+(G.relaxed?' notimer':'');
  mountQ(G.q,'ans');
  $('#tfill').style.width='100%';$('#tfill').className='';
  if(G.demo&&G.nq===1)showCoach('Tap an answer, or press 1 to 4.','firstq');
  if(G.boss)bossSpecial();
}
const QUIPS={ok:['Nailed it.','Big brain energy.','Chef\'s kiss.','Look at you go!','Correct. Show-off.','Smarty pants alert.','Brain: 1, Doubt: 0.','Tap, tap, genius.','Easy peasy, lemon squeezy.','Somebody studied!'],
 no:['Bold choice. Wrong, but bold.','Plot twist: it wasn\'t that one.','So close! (Not really.)','Brain buffering…','The answer was right there, being shy.','Even geniuses have off days.','Not quite, but the confidence was top tier.','Oops-a-daisy. Onwards!','That one tripped over its own shoelaces.','Wrong answer, great attitude.'],
 late:['Time\'s up! The clock waits for no one.','Tick tock… that was your chance leaving.','Too slow! The question got bored.','The clock won that round. Rematch?','Time zipped past. Rude of it.']};
function feedback(cls,main,sub,emoji){const b=$('#feedback');if(!b)return;live(main+(sub?'. '+sub:''));b.className=`feedback ${cls} show`;b.innerHTML=`<span class="fb-emoji" aria-hidden="true">${emoji||''}</span><span>${main}${sub?`<small>${sub}</small>`:''}</span>`}
function answer(i,typedIn){
  if(!G||G.phase!=='question'||G.paused)return;stopSpeak();
  const g=G,me=g.me,q=g.q,el=(gnow()-g.qStart)/1000;let ok,close=false,typed='';
  if(q.type==='type'){typed=(typedIn!=null?typedIn:typedValue()).trim();const m=matchTyped(typed,q.accept);ok=m>0;close=m===2}
  else ok=i>=0&&!!q.answers[i]&&q.answers[i].correct;
  g.phase='feedback';me.total++;recMast(q.raw._sid||g.set.id,q.raw.d||0,ok);if(g.ov&&g.ov.cl){const ix=g.set.qs.indexOf(q.raw);g.qlog=g.qlog||{};if(ix>=0&&!g.qlog[ix])g.qlog[ix]=ok?1:2}{const dd=q.raw.d||0;me.byD=me.byD||[[0,0],[0,0],[0,0],[0,0]];me.byD[dd][1]++;if(ok)me.byD[dd][0]++}if(!ok){S.weak=S.weak||[];if(!S.weak.some(w=>w.q===q.raw.q)){S.weak.push(Object.assign({},q.raw,{set:q.raw._st||g.set.title}));if(S.weak.length>60)S.weak.shift();save()}me.missed=me.missed||[];if(!me.missed.some(m=>m.q===q.text))me.missed.push({q:q.text,pic:q.pic,right:rightText(q),said:q.type==='type'?(typed||null):(i>=0&&q.answers[i]?q.answers[i].t:null)})}
  if(q.type==='type')typedResult(q,ok,typed,close);
  else $$('#answers .answer').forEach((b,k)=>{b.disabled=true;
    if(q.answers[k].correct)b.classList.add('right');else if(k===i)b.classList.add('wrong');else b.classList.add('dim')});
  if(ok){
    me.correct++;me.streak++;me.best=Math.max(me.best,me.streak);me.times.push(el);sfx('correct');if(me.streak>=3)setTimeout(()=>sfx('streak',me.streak),260);updateStreak();
    if(!g.photo)noteClutch(q,el);
    if(me.streak===5)taunt(null,'lost');
    if(me.streak>=3&&me.streak%3===0){const r=$('#qcard').getBoundingClientRect();confetti(me.streak>=6?36:22,r.left+r.width/2,r.top+60,.8)}
    if(g.photo){
      addScore(me,1);
      feedback('ok',close?'Close enough! Typo forgiven.':'Photo finish!','+1 to break the tie. First place is yours.','📸');
      const r=$('#qcard').getBoundingClientRect();confetti(40,r.left+r.width/2,r.top+40,1);
      schedule(1400,()=>endGame('photo'));return;
    }
    if(g.mode==='race'){
      const remFrac=q.limit?Math.max(0,1-el/q.limit):.5;
      const pts=100+Math.min(me.streak-1,5)*20+Math.round(remFrac*40);
      addScore(me,pts);feedback('ok',close?'Close enough! Typo forgiven.':pickQuip(QUIPS.ok),`+${pts} points`+(me.streak>1?` · ${me.streak} in a row, you absolute unit`:''),me.streak>2?'🔥':'✅');
      schedule(1300,nextQuestion);
    }else{
      const R=REWARD[g.mode],un=MODES[g.mode].unit;let sub=R.sub;
      if(me.streak>=3&&g.mode!=='brawl'&&g.mode!=='rocket'){const b=g.mode==='fish'?Math.min(Math.floor(me.streak/3),3):5*Math.min(me.streak,8);addScore(me,b);sub=`${me.streak} in a row! Streak bonus +${b} ${un}. ${R.sub}`}
      feedback('ok',close?'Close enough! Typo forgiven.':pickQuip(QUIPS.ok),sub,me.streak>2?'🔥':'✅');schedule(1000,()=>{const p=$('#qpic');if(p){p.innerHTML='';p.className='q-pic'}R.start()});
    }
  }else{
    me.streak=0;sfx('wrong');updateStreak();
    if(g.photo){feedback('no',pickQuip(i<0?QUIPS.late:QUIPS.no),'So close. The tie stands.','📸');schedule(1600,()=>endGame('photo-loss'));return}
    let pen=0;if(g.hard&&me.score>0){pen=Math.min(me.score,Math.max(10,Math.round(me.score*.05)));addScore(me,-pen)}
    feedback('no',pickQuip(i<0?QUIPS.late:QUIPS.no),(q.type==='type'?`The answer was “${q.accept[0]}”. Study it. Respect it.`:'The right answer is lit up above. Study it. Respect it.')+(pen?` Hard mode: −${pen} ${MODES[g.mode].unit}.`:''),i<0?'⏰':'🙈');
    if(Math.random()<.45)taunt(null,'gloat');
    schedule(2400,nextQuestion);
  }
}
const chestSVG=()=>`<svg viewBox="0 0 100 90" aria-hidden="true"><rect x="8" y="40" width="84" height="46" rx="8" fill="#c9803d" stroke="#1b1340" stroke-width="4"/><rect x="8" y="52" width="84" height="8" fill="#ffcf3f" stroke="#1b1340" stroke-width="3"/><g class="lid"><path d="M8 46 Q8 12 50 12 Q92 12 92 46Z" fill="#e0994f" stroke="#1b1340" stroke-width="4"/><rect x="42" y="38" width="16" height="22" rx="4" fill="#ffcf3f" stroke="#1b1340" stroke-width="3"/></g></svg>`;
function noteHotStreak(good){
  if(!G||!G.me)return 0;
  const a=$('#answers');
  if(good){
    G.me.chestStreak=(G.me.chestStreak||0)+1;
    if(G.me.chestStreak>=3){
      if(a)a.classList.add('hot-streak');
      if(G.me.chestStreak===3||G.me.chestStreak%3===0)juiceBanner('🔥 HOT STREAK!','lap');
    }
    return G.me.chestStreak;
  }
  G.me.chestStreak=0;if(a)a.classList.remove('hot-streak');return 0
}
function showChests(){
  if(!G||G.phase!=='feedback')return;
  G.phase='chest';G.chests=[rollOutcome(),rollOutcome(),rollOutcome()];
  if(G.chests.every(o=>!isGood(o)))G.chests[rnd(0,2)]={type:'gold',amt:rnd(30,60)};
  sfx('chest');
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';
  $('#qtext').textContent=(G.me.keys?'Pick a chest. You have a lucky key if this one\'s a dud.':'Pick a chest. Any chest.');
  if(G.demo)showCoach('Now pick a chest. One might be a trick.','chest');
  const a=$('#answers');a.className='answers chests';
  a.innerHTML=G.chests.map((o,i)=>`<button class="chest" data-act="chest" data-i="${i}" aria-label="Chest ${i+1}">${chestSVG()}<span class="res">Open me</span><span class="key" aria-hidden="true">${i+1}</span></button>`).join('');
}
function popBits(el,glyphs,n,cls){
  if(S.settings.reduceMotion||!el)return;const r=el.getBoundingClientRect(),box=$('.confetti')||(()=>{const d=document.createElement('div');d.className='confetti';d.setAttribute('aria-hidden','true');document.body.appendChild(d);return d})();
  for(let k=0;k<n;k++){const p=document.createElement('i');p.className='bit '+(cls||'');p.textContent=pick(glyphs);p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/3)+'px';
    p.style.setProperty('--dx',rnd(-90,90)+'px');p.style.setProperty('--dy',(-rnd(60,150))+'px');p.style.animationDelay=(k*25)+'ms';box.appendChild(p);setTimeout(()=>{p.remove();if(box&&!box.childElementCount)box.remove()},1500)}}
function pickChest(i){
  if(!G||G.phase!=='chest'||G.paused)return;
  G.phase='reveal';const o=G.chests[i];const btns=$$('#answers .chest');
  btns.forEach((b,k)=>{b.disabled=true;if(k===i)b.classList.add('shaking');else b.classList.add('faded')});sfx('shake');
  schedule(700,()=>{
    const canKey=!isGood(o)&&(G.me.keys||0)>0;
    if(canKey){
      sfx('creak');setTimeout(()=>sfx('lose'),180);
      btns.forEach((b,k)=>{b.classList.remove('shaking');b.classList.add('open');const res=b.querySelector('.res');
        if(k===i){b.classList.add('picked','bad');res.textContent=outLabel(o)+' · key ready'}else{res.textContent=outLabel(G.chests[k])}});
      popBits(btns[i],['💨','💨','👺'],5,'puff');
      G.phase='keywait';G.keyIdx=i;G.keyLoss=o;
      const hold=document.createElement('div');hold.id='keyActions';hold.className='key-actions';
      hold.innerHTML='<button type="button" class="btn btn-pop" data-act="usekey" id="useKeyBtn">🔑 Use lucky key</button><button type="button" class="btn btn-secondary" data-act="skipkey">Keep this chest</button>';
      const a=$('#answers');(a&&a.parentNode)?a.after(hold):view.appendChild(hold);
      live('Dud chest. Use your lucky key to reroll, or keep it.');
      schedule(8000,()=>{if(G&&G.phase==='keywait')skipLuckyKey()});
      return;
    }
    const r=applyOutcome(G.me,o);sfx('creak');setTimeout(()=>sfx(r.s),180);noteHotStreak(r.good);
    btns.forEach((b,k)=>{b.classList.remove('shaking');b.classList.add('open');const res=b.querySelector('.res');
      if(k===i){b.classList.add('picked',r.good?'good':'bad');res.textContent=r.text}else{res.textContent=outLabel(G.chests[k])}});
    popBits(btns[i],r.good?['🪙','✨','⭐']:['💨','💨','👺'],r.good?10:5,r.good?'gold':'puff');
    schedule(2000,nextQuestion)})
}
function skipLuckyKey(){
  if(!G||G.phase!=='keywait')return;
  G.phase='reveal';
  const o=G.keyLoss,i=G.keyIdx;
  if(o){
    const r=applyOutcome(G.me,o);sfx(r.s);noteHotStreak(r.good);
    const btn=$$('#answers .chest')[i],res=btn&&btn.querySelector('.res');
    if(res)res.textContent=r.text;
  }
  const el=$('#keyActions');if(el)el.remove();
  schedule(600,nextQuestion);
}
function useLuckyKey(){
  if(!G||G.phase!=='keywait'||!(G.me.keys>0))return;
  G.phase='reveal';G.me.keys--;updateKeyPill();
  const el=$('#keyActions');if(el)el.remove();
  let o=rollOutcome(),g=0;while(!keyPays(o)&&g++<24)o=rollOutcome();
  if(!keyPays(o))o={type:'gold',amt:rnd(30,60)};
  const i=G.keyIdx,btns=$$('#answers .chest');
  if(typeof i==='number')G.chests[i]=o;
  const r=applyOutcome(G.me,o);sfx('unlock');noteHotStreak(true);
  if(btns[i]){btns[i].classList.remove('bad');btns[i].classList.add('good','keyed');const res=btns[i].querySelector('.res');if(res)res.textContent='Key reroll! '+r.text;popBits(btns[i],['🔑','✨','🪙'],10,'gold')}
  live('Lucky key used. '+r.text);
  toast('Lucky key rerolled the chest!');
  schedule(1800,nextQuestion);
}
function tick(){
  const g=G;if(!g||g.phase==='over'||g.phase==='tourney'||g.phase==='pass')return;
  const now=gnow(),left=g.endAt-now;
  const ck=$('#clock');if(ck){const txt=fmt(g.photo?0:left);if(ck.textContent!==txt)ck.textContent=txt;ck.parentElement.classList.toggle('low',g.photo||left<10000);ck.parentElement.classList.toggle('lap',!g.photo&&left>0&&left<=15000&&g.time>=30);ck.parentElement.classList.toggle('photo',!!g.photo)}
  if(g.photo){
    if(g.phase==='question'&&g.q&&g.q.limit){const f=$('#tfill');const frac=1-(now-g.qStart)/1000/g.q.limit;if(f){f.style.width=Math.max(0,frac*100)+'%';f.className=frac<.25?'low':''}if(frac<=0)answer(-1)}
    return;
  }
  if(left<=0){endGame('time');return}
  if(g.boss&&!g.boss.rage)checkRage();
  if(!g.halfChecked&&left<g.time*500){g.halfChecked=true;const riv=g.players.filter(p=>p!==g.me);const top=riv.length?Math.max(...riv.map(b=>b.score)):0;g.me.trailed=g.me.score<top}
  if(left<=15000&&left>0&&g.time>=30&&!g.finalLap){g.finalLap=true;document.documentElement.classList.add('final-lap');juiceBanner('⏱ FINAL LAP!','lap');sfx('lap');try{Music.hurry(true)}catch(e){}}
  if(g.finalLap&&!g.neckToast){const lead=Math.max(...g.players.map(p=>p.score));const gap=Math.abs(lead-g.me.score);const close=Math.max(20,Math.round(lead*.08)||20);if(lead>0&&gap<=close){g.neckToast=true;toast(g.me.score===lead?'Neck and neck! Hold your lead!':'So close! You can still take it!')}}
  if(left<10000&&!g.finalTaunt&&g.time>=30){g.finalTaunt=true;if(g.bots.length){const bs=[...g.bots].sort((a,b)=>b.score-a.score);taunt(bs[0].score>g.me.score?bs[0]:bs.find(b=>b.score<=g.me.score)||bs[0],'final')}}
  if(left<10000){const sec=Math.ceil(left/1000);if(sec!==g.lastTick){g.lastTick=sec;sfx('tick')}}
  if(g.phase==='question'){
    const f=$('#tfill');
    if(g.q.limit){const frac=1-(now-g.qStart)/1000/g.q.limit;if(f){f.style.width=Math.max(0,frac*100)+'%';f.className=frac<.25?'low':''}if(frac<=0){answer(-1)}}
  }
  const pr=g.endAt<Infinity?Math.max(0,Math.min(1,(now-g.start)/(g.endAt-g.start))):.5;
  for(const b of g.bots){
    if(g.phase==='over')return;
    if(now<b.next)continue;
    const ef=botEff(b,pr);
    b.next=now+rnd(5000,10000)/ef.spd*({gold:1.15,race:1,heist:1.1,fish:1,cafe:1.05,brawl:1.05,rocket:1.2}[g.mode]||1);
    if(Math.random()<ef.acc){b.streak++;if(b.streak===4)taunt(b,'streak');
      if(g.mode==='race')addScore(b,100+Math.min(b.streak-1,5)*20+rnd(0,40));else botReward(b)
    }else b.streak=0;
  }
  if(g.started&&g.phase!=='over'){const mx=Math.max(...g.players.map(p=>p.score));if(mx>0){const ld=(g.leader&&g.leader.score===mx)?g.leader:g.players.find(p=>p.score===mx);
    if(ld!==g.leader){const pv=g.leader;g.leader=ld;if(pv===g.me&&ld.bot)taunt(ld,'lead');else if(ld===g.me&&pv&&pv.bot)taunt(pv,'lost')}}
    if(g.ch&&!g.chHit&&g.me.score>g.ch.score){g.chHit=true;const tp=$('#targetPill');if(tp)tp.classList.add('hit');toast(`You passed ${g.ch.name}'s score!`);sfx('perfect')}
  if(g.beat&&!g.beatHit&&g.me.score>g.beat){g.beatHit=true;const bp=$('#bestPill');if(bp)bp.classList.add('hit');toast('New personal best!');sfx('perfect')}}
  if(g.dirty&&g.phase!=='over'){g.dirty=false;renderBoard()}
}
function awardTourneyLeg(g,reason){
  if(!g||!g.tourney)return null;
  const ranked=[...g.players].sort((a,b)=>b.score-a.score||(a.me?1:b.me?-1:0));
  ranked.forEach((p,i)=>{const pts=TOURNEY_PTS[i+1]||0;g.tourney.pts[p.id]=(g.tourney.pts[p.id]||0)+pts;p.tpts=g.tourney.pts[p.id]});
  const meR=ranked.indexOf(g.me)+1;
  const row={mode:g.mode,reason,rank:meR,score:g.me.score,ranks:ranked.map((p,i)=>({id:p.id,name:p.name,score:p.score,pts:TOURNEY_PTS[i+1]||0}))};
  g.tourney.legs.push(row);
  return row
}
function wipeModeChrome(){
  ['#rtrack','#altBar','#bossBar','#keyActions'].forEach(s=>{const e=$(s);if(e)e.remove()});
  document.documentElement.classList.remove('final-lap','on-fire');
  if(!G)return;
  G.finalLap=false;G.halfChecked=false;G.neckToast=false;G.finalTaunt=false;G.goalHit=false;G.photo=false;G.photoDone=false;G.photoPending=false;
  G.heists=0;G._altBand=null;G._juiceStreak=0;G.boss=null;G.heist=null;G.fish=null;
  G.players.forEach(p=>{p.score=0;p.prev=0;p.streak=0;p.keys=0;p.shield=false;p.chestStreak=0});
  G.queue=[]
}
function showTourneyBreak(){
  const g=G;if(!g||!g.tourney)return;
  const leg=g.tourney.legs[g.tourney.legs.length-1],next=g.tourney.modes[g.tourney.i+1],m=MODES[leg.mode],nm=MODES[next];
  const pts=g.tourney.pts[g.me.id]||0;
  const stand=[...g.players].sort((a,b)=>(g.tourney.pts[b.id]||0)-(g.tourney.pts[a.id]||0)||(a.me?1:b.me?-1:0));
  const old=$('#tourneyOv');if(old)old.remove();
  const o=document.createElement('div');o.className='pass-ov tourney-ov';o.id='tourneyOv';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-labelledby','tourneyTitle');
  o.innerHTML=`<div class="pass-card tourney-card-ov"><p class="pass-kicker">Tournament · leg ${g.tourney.i+1} of ${g.tourney.modes.length}</p>
    <h2 id="tourneyTitle">${m.emoji} ${esc(m.name)} · you placed ${esc(nth(leg.rank))}</h2>
    <p class="pass-scores"><span class="pass-sc on"><b>+${TOURNEY_PTS[leg.rank]||0} pts</b> · ${pts} total</span></p>
    <ol class="tourney-stand">${stand.map((p,i)=>`<li class="${p.me?'me':''}"><span>${i+1}. ${esc(p.emoji)} ${esc(p.name)}</span><b>${g.tourney.pts[p.id]||0}</b></li>`).join('')}</ol>
    <p class="tourney-next">Next up: ${nm.emoji} <b>${esc(nm.name)}</b></p>
    <button type="button" class="btn btn-primary btn-lg" data-act="tourneygo" id="tourneyGo">Let's go <span class="kbd">Space</span></button></div>`;
  const q=$('#qcard');(q||view).appendChild(o);
  const b=$('#tourneyGo');if(b)try{b.focus()}catch(e){}
  if(typeof trapFocus==='function'){if(g._untrapTourney)g._untrapTourney();g._untrapTourney=trapFocus(o.querySelector('.pass-card')||o,null)}
  live(m.name+': you placed '+nth(leg.rank)+'. Next, '+nm.name+'.');sfx('whoosh');
}
function startTourneyLeg(i){
  const g=G;if(!g||!g.tourney||!g.tourney.modes[i])return;
  g.tourney.i=i;g.mode=g.tourney.modes[i];g.time=g.tourney.time||TOURNEY_TIME;g.goal=0;g.reason=null;
  wipeModeChrome();
  if(g.mode==='brawl'){const bb=pick(BOSSES);g.boss={max:0,hp:0,e:bb[0],n:bb[1],x:bb[2],sn:0}}
  g.phase='countdown';g.started=false;
  renderGameShell();
  if(g.mode==='rocket')trackBar();
  if(g.boss)bossBar();
  const cd=$('#countdown');
  const gg=g;
  if(cd)cd.innerHTML='<span class="cd-num go">Go!</span>';sfx('go');
  schedule(700,()=>{
    if(G!==gg)return;
    if(cd&&cd.parentNode)cd.remove();
    const t=gnow();g.start=t;g.endAt=t+g.time*1000;g.started=true;
    g.bots.forEach(b=>b.next=t+rnd(4000,9000)/b.speed);
    nextQuestion();
  });
}
function readyTourney(){
  if(!G||G.phase!=='tourney')return;
  if(G._untrapTourney){try{G._untrapTourney()}catch(e){}G._untrapTourney=null}
  holdClock(false);const o=$('#tourneyOv');if(o)o.remove();
  startTourneyLeg(G.tourney.i+1);
}
function closeTourneyLeg(reason){
  const g=G;if(!g||!g.tourney||g.phase==='tourney'||g.phase==='over')return;
  g.queue=[];
  awardTourneyLeg(g,reason);
  g.phase='tourney';
  holdClock(true);
  showTourneyBreak();
}
function applyTourneyFinal(reason){
  const g=G;if(!g||!g.tourney)return;
  awardTourneyLeg(g,reason);
  g.players.forEach(p=>{p.legScore=p.score;p.score=g.tourney.pts[p.id]||0});
  g.tourney.done=true;
}
function endGame(reason){
  const g=G;if(!g||g.phase==='over'||g.phase==='tourney')return;
  if(reason==='time'&&!g.photoDone&&!(g.pass&&!g.team)&&tiedForFirst(g)&&g.qs&&g.qs.length){startPhoto();return}
  if(g.tourney&&g.tourney.i<g.tourney.modes.length-1){closeTourneyLeg(reason);return}
  if(g.tourney)applyTourneyFinal(reason);
  if(g.pass){holdClock(false);if(g._untrapPass){try{g._untrapPass()}catch(e){}g._untrapPass=null}const owner=g.players.find(p=>p.id==='me')||g.players[0];g.players.forEach(p=>p.me=(p===owner));g.me=owner;if(!g.team)g.passRival=g.players.find(p=>p!==owner)}
  g.phase='over';Music.stop();stopSpeak();clearInterval(g.timer);g.reason=reason;clearJuice();
  g.ranked=[...g.players].sort((a,b)=>b.score-a.score||(a.me?1:b.me?-1:0));
  g.rank=g.ranked.indexOf(g.me)+1;
  S.games=(S.games||0)+1;
  const avgT=g.me.times.length?g.me.times.reduce((a,b)=>a+b,0)/g.me.times.length:0;
  g.newAch=recordGame({mode:g.mode,set:g.set.title,sid:g.set.id,rank:g.rank,score:g.me.score,acc:g.me.total?Math.round(g.me.correct/g.me.total*100):0,best:g.me.best,correct:g.me.correct,total:g.me.total,avg:avgT,perfects:g.me.perfects||0,big:!!g.me.big,boot:!!g.me.boot,trailed:!!g.me.trailed,daily:false,orders:g.me.orders||0,byD:g.me.byD,hard:g.hard,chBeat:!!(g.ch&&g.me.score>g.ch.score),tourney:!!g.tourney,legs:g.tourney?g.tourney.legs.map(l=>({mode:l.mode,rank:l.rank,score:l.score})):undefined});
  if(!g.tourney){{const bk=`${g.set.id}|${g.mode}|${g.time}${g.hard?'|h':''}${g.relaxed?'|r':''}`;S.best=S.best||{};const pb=S.best[bk];g.prevBest=pb?pb.score:null;if(!pb||g.me.score>pb.score){S.best[bk]={score:g.me.score,rank:g.rank,t:Date.now()};g.newBest=!!pb&&g.me.score>0}save()}}
  else save();
  renderEnd();
}

/* ---------------- Vault Heist ---------------- */
function heistPos(h,now){now=now==null?gnow():now;const x=((now-h.t0)/1000*h.speed)%2;return x<1?x:2-x}
const HEIST_SEC={1:['Low','A quiet night at the vault.'],2:['Medium','Guards are on their rounds.'],3:['High','Lasers on. Steady hands.']};
function heistSecurity(h){h=h||(G&&G.heist);if(!h)return 1;return (h.zw<=.13||h.speed>=1.25)?3:(h.zw<=.16||h.speed>=1.05)?2:1}
function showHeist(){
  if(!G||G.phase!=='feedback')return;
  G.phase='heist';G.heists=(G.heists||0)+1;
  const zw=Math.max(.1,.2-G.heists*.004+Math.min(G.me.streak,6)*.012);
  const h=G.heist={t0:gnow(),speed:.75+Math.min(G.heists,10)*.07,zw,zc:.2+Math.random()*.6};
  const sec=heistSecurity(h),secL=HEIST_SEC[sec];
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';
  $('#qtext').textContent='Crack the vault!';sfx('chest');live('Vault time. Security '+secL[0]+'. Press space or the button to stop the marker in the green zone.');
  const a=$('#answers');a.className='answers heist';
  a.innerHTML=`<div class="vault sec-${sec}" id="vault"><div class="vault-top"><span class="vault-door" aria-hidden="true">🔐</span><div><b>Stop the marker in the green zone</b><span>Dead centre also swipes cash from a rival. Alarms cost you.</span></div></div>
   <p class="heist-sec" id="heistSec"><b>Security: ${secL[0]}</b> ${secL[1]}</p>
   <div class="lockbar" id="lockbar" role="img" aria-label="Lock bar. Stop the marker in the green zone, dead centre for a perfect pick."><i class="zone" style="left:${(h.zc-h.zw/2)*100}%;width:${h.zw*100}%"></i><i class="perfect" style="left:${(h.zc-h.zw*.12)*100}%;width:${h.zw*24}%"></i><b class="marker" id="marker"></b></div>
   <button class="btn btn-primary btn-lg" data-act="pick" id="pickBtn">Pick the lock <span class="kbd">Space</span></button><div class="heist-res" id="heistRes" aria-hidden="true"></div></div>`;
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  const g=G;const mk=$('#marker');
  (function raf(){if(G!==g||g.phase!=='heist'||!mk.isConnected)return;if(!g.paused)mk.style.left=(heistPos(h)*100)+'%';
    const q=Math.floor(heistPos(h)*20);if(q!==g.hq){g.hq=q;if(g.heists<3&&!g.paused)sfx('lock')}requestAnimationFrame(raf)})();
  if(!G.relaxed)schedule(6000,()=>heistStop(true));
}
function heistKind(h,pos){const d=Math.abs(pos-h.zc);return d<=h.zw*.12?'perfect':d<=h.zw/2?'good':d<=h.zw?'near':'miss'}
function heistApply(p,kind){
  const rich=()=>{const o=G.players.filter(x=>x!==p&&x.score>0).sort((a,b)=>b.score-a.score);return o[0]};
  if(kind==='perfect'){if(p===G.me)p.perfects=(p.perfects||0)+1;const amt=rnd(90,140);addScore(p,amt);const v=rich();let st=0;if(v){st=Math.min(v.score,rnd(25,45));addScore(v,-st);addScore(p,st);if(v===G.me&&st){toast(`${p.name} cracked a vault and swiped ${st} cash from you!`);sfx('steal')}}
    return{text:st?`Flawless! +${amt} and ${st} swiped from ${v.name}.`:`Flawless! +${amt} cash. Smooth criminal.`,good:true,s:'perfect',em:['💎','💰','✨']}}
  if(kind==='good'){const amt=rnd(40,70);addScore(p,amt);return{text:pickQuip([`Cracked it! +${amt} cash.`,`Click, click, cha-ching. +${amt} cash.`,`Clean job. +${amt} cash.`,`Ninja-level sneaky. +${amt} cash.`,`Vault cracked, nobody noticed. +${amt} cash.`]),good:true,s:'unlock',em:['💵','💰','✨']}}
  if(kind==='near'){addScore(p,15);return{text:'Barely grazed the lock. +15 cash for effort.',good:true,s:'coin',em:['💵']}}
  const l=Math.min(p.score,rnd(15,35));addScore(p,-l);return{text:l?pickQuip([`ALARM! Security fined you ${l} cash.`,`ALARM! The guard dog was NOT asleep. -${l} cash.`]):'ALARM! Luckily you were already broke.',good:false,s:'alarm',em:['🚨','🚨','💨']}}
function heistStop(timeout){
  if(!G||G.phase!=='heist'||(G.paused&&timeout!==true))return;
  const h=G.heist,pos=heistPos(h);G.phase='reveal';const kind=timeout===true?'miss':heistKind(h,pos);
  const mk=$('#marker');if(mk)mk.style.left=(pos*100)+'%';
  const r=heistApply(G.me,kind);sfx(r.s);const v=$('#vault');if(v){v.classList.add('done',kind==='miss'?'alarm':kind==='near'?'near-hit':'ok');if(kind==='perfect')v.classList.add('perfect-hit')}
  const lb=$('#lockbar');if(lb&&kind==='perfect')lb.classList.add('perfect-hit');
  if(kind==='perfect'){G.me.heistStreak=(G.me.heistStreak||0)+1;if(G.me.heistStreak>=3&&G.me.heistStreak%3===0)juiceBanner('💎 MASTER THIEF!','fire')}else G.me.heistStreak=0;
  if(kind==='near')toast('Close call!');
  if(kind==='perfect'&&!S.settings.reduceMotion){const el=v||lb;if(el){const rc=el.getBoundingClientRect();confetti(28,rc.left+rc.width/2,rc.top+rc.height/2,.9)}}
  const res=$('#heistRes');if(res){res.textContent=r.text;res.className='heist-res show '+(r.good?'good':'bad');res.removeAttribute('aria-hidden')}live(r.text);
  const pb=$('#pickBtn');if(pb)pb.disabled=true;popBits($('#lockbar'),r.em,r.good?10:6,r.good?'gold':'puff');
  schedule(1600,nextQuestion);
}
const botHeist=()=>{const x=Math.random();return x<.15?'perfect':x<.55?'good':x<.7?'near':'miss'};

/* ---------------- Lucky Catch ---------------- */
const FISH=[{n:'Minnow',e:'🐟',kg:1,need:5,w:30},{n:'Perch',e:'🐠',kg:3,need:9,w:26},{n:'Pufferfish',e:'🐡',kg:6,need:13,w:16},{n:'Shark',e:'🦈',kg:12,need:19,w:8},{n:'Giant Octopus',e:'🐙',kg:18,need:24,w:4},{n:'Golden Fish',e:'🏆',kg:25,need:20,w:2},{n:'Old Boot',e:'👢',kg:0,need:3,w:9}];
function rollFish(streak){const f=FISH.map(x=>({x,w:x.w*(x.kg>=6?1+.18*Math.min(streak,6):1)}));let t=f.reduce((a,b)=>a+b.w,0),r=Math.random()*t;for(const o of f){r-=o.w;if(r<=0)return o.x}return FISH[0]}
function showFish(){
  if(!G||G.phase!=='feedback')return;
  G.phase='fish';const f=G._forceFish||rollFish(G.me.streak);G._forceFish=null;G.fish={f,prog:0,t0:gnow(),taps:0,limit:G.relaxed?Infinity:3000+100*f.need};
  const deep=f.need>=19?'deep':f.need>=13?'mid':'shallow';const big=f.kg>=12;
  const dlab=deep==='deep'?'Deep water — this one will fight.':deep==='mid'?'A bit deeper…':'Near the surface.';
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';$('#qtext').textContent=big?(f.kg>=18?'Something HUGE is biting!':'Something heavy is biting!'):'Something is biting!';sfx('bite');
  if(big)juiceBanner(f.kg>=18?"🐋 IT'S A BIG ONE!":'🐟 HEAVY BITE!','fire');
  live((big?"It's a big one. ":'')+`A fish is biting. Mash the reel button or press space repeatedly.`);
  const a=$('#answers');a.className='answers fishing';
  a.innerHTML=`<div class="pond ${deep}${big?' big':''}" id="pond"><div class="wave w1"></div><div class="wave w2"></div><span class="bobber" aria-hidden="true">🎣</span><span class="fish-e" id="fishE" aria-hidden="true">🐟</span><div class="reel-meter" aria-hidden="true"><i id="reelFill"></i></div><div class="fish-time" aria-hidden="true"><i id="fishTime"></i></div><p class="fish-depth" id="fishDepth">${dlab}</p></div>
   <button class="btn btn-primary btn-lg reel-btn" id="reelBtn" data-act="reel">REEL! <span class="kbd">Space</span></button><div class="heist-res" id="fishRes" aria-hidden="true"></div>`;
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  G.fish.last=gnow();
}
function fishStep(){
  const g=G,fs=g.fish,now=gnow(),dt=now-fs.last;fs.last=now;fs.prog=Math.max(0,fs.prog-(.0025+.0001*fs.f.need)*(dt/50));
  const pf=$('#reelFill');if(pf)pf.style.height=(fs.prog*100)+'%';const e=$('#fishE');if(e){e.textContent=fs.f.e;e.style.setProperty('--p',fs.prog)}
  const el=now-fs.t0;const ft=$('#fishTime');if(ft)ft.style.width=Math.max(0,100-el/fs.limit*100)+'%';
  if(fs.f.need>=9&&!S.settings.reduceMotion){if(!fs.nextLunge)fs.nextLunge=now+800+Math.random()*700;if(now>=fs.nextLunge){fs.nextLunge=now+900+Math.random()*800;const pond=$('#pond');if(pond){pond.classList.remove('lunge');void pond.offsetWidth;pond.classList.add('lunge')}}}
  if(el>=fs.limit)fishEnd(false)
}
function fishTap(){
  if(!G||G.phase!=='fish'||G.paused)return;const fs=G.fish;fs.taps++;fs.prog=Math.min(1,fs.prog+1/fs.f.need);sfx('reel');
  const b=$('#reelBtn');if(b){b.classList.remove('tap');void b.offsetWidth;b.classList.add('tap')}
  if(fs.prog>=1)fishEnd(true)}
function fishEnd(ok){
  if(!G||G.phase!=='fish')return;const fs=G.fish;const close=ok&&fs.limit!==Infinity&&(fs.limit-(gnow()-fs.t0))<fs.limit*.18;G.phase='reveal';const f=fs.f;
  let text,good,s='catch';
  if(ok){addScore(G.me,f.kg);if(f.kg>=18)G.me.big=true;if(!f.kg)G.me.boot=true;good=f.kg>0;text=f.kg?pickQuip([`Landed a ${f.n}! +${f.kg} kg.`,`${f.n}! That's +${f.kg} kg of bragging rights.`,`Whoa, a ${f.n}! +${f.kg} kg.`,`The ${f.n} never saw it coming. +${f.kg} kg.`]):pickQuip(['An old boot. 0 kg, but it has character.','An old boot! Somebody is missing one.']);if(!f.kg)s='lose';else if(f.kg>=18)s='jackpot'}
  else{good=false;s='escape';text=pickQuip([`The ${f.n} got away! Reel faster next time.`,`The ${f.n} wriggled free. Cheeky.`])}
  if(close)toast('Close call!');
  sfx(s);const e=$('#fishE');if(e){e.classList.add(ok?'caught':'gone');if(ok&&f.kg>0)e.classList.add('leap');if(ok&&f.kg>=18)e.classList.add('splash-big')}
  const pond=$('#pond');if(pond){pond.classList.add(ok?(f.kg>=18?'splash-big':'splash'):'splash-miss');if(ok&&f.kg>=18&&!S.settings.reduceMotion){const rc=pond.getBoundingClientRect();confetti(24,rc.left+rc.width/2,rc.top+30,.85)}}
  const res=$('#fishRes');if(res){res.textContent=text;res.className='heist-res show '+(good?'good':'bad')}live(text);
  const rb=$('#reelBtn');if(rb)rb.disabled=true;popBits($('#pond'),good?['🐟','✨','💦']:['💦','💨'],good?10:5,good?'gold':'puff');
  schedule(1900,nextQuestion);
}
function botFish(p){if(Math.random()<.7){const f=rollFish(p.streak);addScore(p,f.kg)}}
function botGold(b){
  if(!G)return;
  grantLuckyKey(b);
  let o=rollOutcome();
  if(!isGood(o)&&(b.keys||0)>0){
    b.keys--;
    let n=0;o=rollOutcome();while(!keyPays(o)&&n++<24)o=rollOutcome();
    if(!keyPays(o))o={type:'gold',amt:rnd(20,50)};
    toast(b.name+' used a lucky key. Cheeky.');
  }
  applyOutcome(b,o);
}
const botReward=b=>{const m=G.mode;if(m==='cafe')botCafe(b);else if(m==='heist')heistApply(b,botHeist());else if(m==='fish')botFish(b);else if(m==='brawl')botBrawl(b);else if(m==='rocket')botRocket(b);else if(m==='gold')botGold(b);else applyOutcome(b,rollOutcome())};
const REWARD={rocket:{sub:'Fuel tanks full!',start:()=>showRocket()},gold:{sub:'Now pick a chest. No pressure.',start:()=>showChests()},heist:{sub:'Vault time. Steady hands.',start:()=>showHeist()},fish:{sub:'Something is biting…',start:()=>showFish()},cafe:{sub:'A customer is waiting…',start:()=>showCafe()},brawl:{sub:'Pick your attack!',start:()=>showBrawl()}};


/* ---------------- Rocket Race ---------------- */
const RCARDS=[{n:'Boost',e:'🚀',d:'+10 km, more with a streak'},{n:'Shield',e:'🛡️',d:'+4 km and block the next sabotage'},{n:'Sabotage',e:'🌀',d:'+2 km, and the leader loses 8 km'}];
const ROCKET_INTRO=['Countdown complete. Please keep all limbs inside the rocket.','Houston, we have a quiz.','Strap in! Snacks are in the cargo bay.'],
 ROCKET_BOOST=['WHOOSH! +{d} km and a very smug flame.','Afterburners lit! +{d} km.','Zoom! The clouds are filing complaints. +{d} km.','Fuel go brrr. +{d} km.'],
 ROCKET_SLIP=['Slipstream! Drafting off the rocket ahead. +{d} km.','In the wash! +{d} km with a little help from the leader.','Slipstream boost! +{d} km. The draft did the rest.'],
 ROCKET_SHIELD=['Shield up! +{d} km, and it is surprisingly shiny.','Force field online. +{d} km of smugness.'],
 ROCKET_SAB=['Space goo launched at {v}! -{x} km.','{v} hit a surprise asteroid. -{x} km. Totally an accident.','{v} just got a space-pigeon in the engine. -{x} km.'],
 ROCKET_BLOCK=['The shield on {v} went BZZT. Sabotage blocked!','Sabotage bounced off {v}. Rude, but fair.'],
 ROCKET_MISSED=['Nobody to sabotage. The goo is sad.'],
 ROCKET_WIN=['Space! It is very big and very quiet.','You reached orbit and waved at a satellite.'];
const rcombo=s=>2*Math.min(Math.max(s-1,0),4);
function trackBar(){const h=$('.hud');if(!h)return;
  h.insertAdjacentHTML('afterend',`<div class="rtrack" id="rtrack" role="img" aria-label="Rocket race track. Rockets climb towards space."><span class="rt-space" aria-hidden="true">🌟 SPACE${G.goal?' · '+G.goal+' km':''}</span>${G.players.map((p,i)=>`<div class="rlane${p.me?' me':''}" data-i="${i}"><span class="rkt" style="--p:0" id="rk${i}"><b class="rk-e" aria-hidden="true">🚀</b><i class="rk-sh" aria-hidden="true">🛡️</i></span><span class="rl-n">${esc(p.me?'You':p.name)}</span></div>`).join('')}</div>`);updateTrack()}
const SLIP_GAP=12,SLIP_BONUS=4;
function slipstream(p,g){g=g||G;if(!g||!p)return 0;const ahead=g.players.filter(x=>x!==p&&x.score>p.score).map(x=>x.score);if(!ahead.length)return 0;const gap=Math.min(...ahead)-p.score;return gap>0&&gap<=SLIP_GAP?SLIP_BONUS:0}
const ALT_BANDS=[{at:0,n:'Launch pad',e:'🚀'},{at:.25,n:'Upper air',e:'☁️'},{at:.5,n:'Orbit',e:'🛰️'},{at:.8,n:'Space',e:'🌟'}];
function rocketAlt(p,g){
  g=g||G;if(!g||!p)return ALT_BANDS[0];
  const mx=Math.max(0,...g.players.map(x=>x.score||0));
  const scale=g.goal||Math.max(60,mx*1.15);
  const frac=Math.min(1,(p.score||0)/Math.max(1,scale));
  let band=ALT_BANDS[0];
  for(const b of ALT_BANDS) if(frac>=b.at) band=b;
  return Object.assign({},band,{frac})
}
function updateAltitude(){
  if(!G||G.mode!=='rocket'||!$('#rtrack'))return;
  let bar=$('#altBar');
  if(!bar){const t=$('#rtrack');if(!t)return;t.insertAdjacentHTML('afterend',`<div class="alt-bar" id="altBar" role="status" aria-live="polite"></div>`);bar=$('#altBar')}
  const b=rocketAlt(G.me);
  bar.innerHTML=ALT_BANDS.map(x=>`<span class="alt-band${x.n===b.n?' on':''}">${x.e} ${esc(x.n)}</span>`).join('')+`<span class="alt-now">${b.e} You are at ${esc(b.n)}</span>`;
  if(G._altBand!==b.n){
    const prev=G._altBand;G._altBand=b.n;
    if(prev&&b.at>0){juiceBanner(`${b.e} ${b.n.toUpperCase()}!`,'lap');live('Reached '+b.n)}
  }
}
function updateTrack(){const g=G;if(!g||!$('#rtrack'))return;const mx=Math.max(...g.players.map(p=>p.score));const scale=g.goal||Math.max(60,mx*1.15);
  g.players.forEach((p,i)=>{const r=$('#rk'+i);if(!r)return;r.style.setProperty('--p',Math.min(1,p.score/scale));r.classList.toggle('shielded',!!p.shield);r.classList.toggle('slip',!!slipstream(p,g));
  });updateAltitude()}
function rocketApply(p,i){let d=0,text,good=true,vic=null,blk=false;
  if(i===0){const slip=slipstream(p);d=10+rcombo(p.streak)+slip;addScore(p,d+2);text=(slip?pick(ROCKET_SLIP):pick(ROCKET_BOOST)).replace('{d}',d+2)}
  else if(i===1){p.shield=true;addScore(p,6);text=pick(ROCKET_SHIELD).replace('{d}',6)}
  else{addScore(p,4);const riv=G.players.filter(x=>x!==p&&x.score>0).sort((a,b)=>b.score-a.score)[0];
    if(!riv){text=pick(ROCKET_MISSED);good=false}
    else if(riv.shield){riv.shield=false;text=pick(ROCKET_BLOCK).replace('{v}',riv.me?'You':riv.name);good=false;vic=riv;blk=true}
    else{vic=riv;const x=Math.min(riv.score,8);addScore(riv,-x);text=pick(ROCKET_SAB).replace('{v}',riv.me?'you':riv.name).replace('{x}',x)}
    if(riv&&riv.me&&!p.me)text=`${p.name} sabotaged you! `+text}
  updateTrack();return{text,good,vic,blk}}
function showRocket(){
  if(!G||G.phase!=='feedback')return;
  G.phase='rocket';sfx('chest');
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';
  const slip=slipstream(G.me);
  $('#qtext').textContent=slip?'You\'re in the slipstream! Boost will get an extra kick.':(G.me.shield?'Fuel loaded, shield on! Pick a card.':'Fuel loaded! Pick a card.');
  const a=$('#answers');a.className='answers brawl rocket';
  const cards=RCARDS.map((m,i)=>{const d=i===0&&slip?m.d+' · slipstream +'+SLIP_BONUS+' km':m.d;return `<button class="move rcard${i===0&&slip?' slip-ready':''}" data-act="rcard" data-i="${i}" aria-label="${m.n}: ${d}"><span class="mv-e" aria-hidden="true">${m.e}</span><b>${m.n}</b><span class="mv-d">${d}</span><span class="key" aria-hidden="true">${i+1}</span></button>`});
  a.innerHTML=cards.join('');
  live(slip?`You're in the slipstream. Boost gets +${SLIP_BONUS} km extra. 1 ${RCARDS[0].n}, 2 ${RCARDS[1].n}, 3 ${RCARDS[2].n}.`:`Pick a card. 1 ${RCARDS[0].n}, 2 ${RCARDS[1].n}, 3 ${RCARDS[2].n}.`);
}
function rocketCard(i){
  if(!G||G.phase!=='rocket'||G.paused)return;
  G.phase='reveal';const me=G.me;const o=rocketApply(me,i);
  sfx(i===0?'catch':i===1?'coin':'chest');
  $$('#answers .move').forEach((x,k)=>{x.disabled=true;x.classList.add(k===i?'picked':'dim')});
  const r=document.createElement('div');r.className='heist-res show brawl-res '+(i===2&&!o.good?'bad':'good');r.textContent=o.text;$('#answers').after(r);live(o.text);
  const rk=$('#rk0');popBits(rk,i===0?['🔥','✨','💨']:i===1?['🛡️','✨']:['🌀','💫','☄️'],8,i===2?'puff':'gold');if(rk)rk.classList.add('burn'),setTimeout(()=>rk.classList.remove('burn'),700);
  schedule(1500,()=>{r.remove();nextQuestion()});
}
function botRocket(p){const x=Math.random();const o=rocketApply(p,x<.4?0:x<.7?1:2);if(o.vic&&o.vic.me)toast(o.blk?`${p.name} tried to sabotage you. Your shield said no!`:o.text)}
/* ---------------- Monster Brawl ---------------- */
const BOSSES=[
 ['👹','Grumblor',{intro:'Grumblor wakes up grumpy. Nobody is surprised.',hurt:['Grumblor grumbles "that was my good shoulder".','Grumblor: "Rude. Also ow."'],rage:'Grumblor is ENRAGED! His eyebrows are on fire.',sc:'Grumble Shuffle',dr:'Grumpy Stare'}],
 ['🐲','Sir Snorts-a-Lot',{intro:'Sir Snorts-a-Lot snorts. A small cloud of glitter escapes.',hurt:['Sir Snorts-a-Lot sneezes sparks. Ow.','Sir Snorts-a-Lot: "Unhand my tail!"'],rage:'Sir Snorts-a-Lot is ENRAGED! The snorting is now unstoppable.',sc:'Snort Storm',dr:'Smoke Screen'}],
 ['🦖','Rexy McStompface',{intro:'Rexy McStompface stomps in. The floor files a complaint.',hurt:['Rexy tries to clap in shock. Tiny arms, big fail.','Rexy McStompface: "I felt that in my feelings."'],rage:'Rexy McStompface is ENRAGED! Stomping speed: maximum.',sc:'Stomp Shuffle',dr:'Tiny Arm Tickle'}],
 ['👾','Glitchzilla',{intro:'Glitchzilla loads… 99%… 99%… 99%… FIGHT!',hurt:['Glitchzilla flickers. "Error 404: dignity not found."','Glitchzilla lags in pain.'],rage:'Glitchzilla is ENRAGED! It is now running in turbo mode.',sc:'Pixel Scramble',dr:'Lag Spike'}],
 ['🧌','Gruff the Troll',{intro:'Gruff the Troll blocks the bridge. Tolls are paid in answers.',hurt:['Gruff the Troll: "That bridge was a rental!"','Gruff the Troll rubs his nose. It is a very big nose.'],rage:'Gruff the Troll is ENRAGED! He wants his bridge back.',sc:'Bridge Shake',dr:'Toll Booth Delay'}],
 ['🐙','Inky the Squid',{intro:'Inky the Squid inks first and asks questions later.',hurt:['Inky squirts a polite amount of ink.','Inky the Squid: "My tentacle! The good one!"'],rage:'Inky the Squid is ENRAGED! The ink is now extra inky.',sc:'Tentacle Shuffle',dr:'Ink Drain',fog:'Ink Cloud',pats:['fog']}],
 ['🪨','Boulderfist',{intro:'Boulderfist rumbles in. Several pebbles file a complaint.',hurt:['Boulderfist cracks a little. Only a little.','Boulderfist: "That tickled. In a geological way."'],rage:'Boulderfist is ENRAGED! The ground has been warned.',sc:'Rubble Shuffle',dr:'Dust Drain',quake:'Stomp Quake',pats:['quake']}],
 ['🕷️','Lady Hex',{intro:'Lady Hex curtsies. A tiny spark jumps from her crown.',hurt:['Lady Hex: "Rude. And sparkly."','Lady Hex flicks a sparkle off her sleeve.'],rage:'Lady Hex is ENRAGED! The sparkles have teeth now.',sc:'Charm Shuffle',dr:'Hourglass Drain',hex:'Hex Mark',pats:['hex']}]];
const bossForClass=k=>BOSSES[bossIdx(k)];
const MOVES=[{n:'Quick Jab',e:'🗡️',d:'Always hits for 25'},{n:'Mega Smash',e:'💥',d:'60% chance to hit for 65'},{n:'Power Up',e:'⚡',d:'Hit for 15. Your next attack is doubled'}];
const BRAWL_HIT=['BONK! {b} loses {d} HP.','{b} says "ow" in a very small voice. -{d} HP.','Direct hit! {b} is questioning their life choices. -{d}.','KAPOW! -{d} HP and one bruised ego.','{b} just sneezed a tooth. -{d} HP.'],
 BRAWL_MISS=['Swing and a miss! {b} giggles.','Whoosh! That was only air. Spicy air.','{b} dodged with suspicious grace.'],
 BRAWL_WIN=['{b} is defeated! Someone call a very large nurse.','{b} fell over dramatically. Victory!','{b} has left the building. Through the floor.'];
const combo=s=>4*Math.min(Math.max(s-1,0),6);
function bossBar(){const b=G.boss;if(!b)return;const h=$('.hud');if(!h)return;
  h.insertAdjacentHTML('afterend',`<div class="boss" id="boss" role="group" aria-label="${esc(b.n)} health"><span class="boss-e" id="bossE" aria-hidden="true">${b.e}</span><div class="boss-main"><div class="boss-name">${esc(b.n)}</div><div class="boss-hp"><i id="bossFill"></i></div><div class="boss-warn" id="bossWarn" role="status"></div></div><b class="boss-txt" id="bossTxt"></b></div>`);updateBoss(false)}
function updateBoss(hit){const b=G&&G.boss;if(!b)return;const f=$('#bossFill'),t=$('#bossTxt'),e=$('#bossE');
  const pct=b.max?Math.max(0,b.hp/b.max*100):100;if(f){f.style.width=pct+'%';f.className=pct<25?'low':''}if(t)t.textContent=b.max?`${b.hp} / ${b.max} HP`:'∞ HP';
  if(hit&&e){e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit')}}
function bossHit(n){const b=G.boss;if(!b)return;if(b.max)b.hp=Math.max(0,b.hp-n);updateBoss(true);checkRage();
  if(b.max&&b.hp<=0&&!G.bossDown){G.bossDown=true;const g=G;sfx('jackpot');toast(pick(BRAWL_WIN).replace('{b}',b.n));const e=$('#bossE');if(e)e.classList.add('down');schedule(1400,()=>endGame('boss'))}}
function checkRage(){const g=G,b=g&&g.boss;if(!b||b.rage||g.bossDown||g.phase==='over')return;
  const hit=b.max?b.hp<=b.max*.25:(g.endAt<Infinity&&g.endAt-gnow()<=g.time*250);
  if(!hit)return;b.rage=true;const el=$('#boss');if(el)el.classList.add('rage');const t=$('#bossE');if(t)t.setAttribute('data-rage','🔥');
  sfx('streak',6);toast(b.x.rage);live(b.x.rage+' Watch out for special attacks.')}
function pickBossSpecial(b,q,g){
  const canSc=q.type!=='type'&&q.type!=='tf'&&q.answers.length>2,canDr=q.limit>0&&!g.relaxed;
  const extra=(b.x&&b.x.pats)||[];
  if(!extra.length) return canSc&&(!canDr||Math.random()<.6)?'sc':canDr?'dr':null;
  const pool=[];if(canSc)pool.push('sc');if(canDr)pool.push('dr');extra.forEach(p=>pool.push(p));
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:null
}
function bossSpecial(){const g=G,b=g.boss,q=g.q;if(!b||!b.rage||g.bossDown||!q)return;
  if(b.sn++%2)return;
  const kind=pickBossSpecial(b,q,g);if(!kind)return;
  const names={sc:b.x.sc,dr:b.x.dr,fog:b.x.fog,quake:b.x.quake,hex:b.x.hex};
  const nm=names[kind]||'a special attack',el=$('#boss'),w=$('#bossWarn');
  const say=kind==='sc'?`⚠️ ${b.n} is winding up ${nm}… answers will shuffle!`:kind==='dr'?`⚠️ ${b.n} is winding up ${nm}… time will drain!`:kind==='fog'?`⚠️ ${b.n} is winding up ${nm}… ink incoming!`:kind==='quake'?`⚠️ ${b.n} is winding up ${nm}… hold on!`:`⚠️ ${b.n} is winding up ${nm}… watch the answers!`;
  if(el)el.classList.add('warn');if(w)w.textContent=say;live(say);sfx('tick');
  schedule(1900,()=>{
    if(el)el.classList.remove('warn');if(w)w.textContent='';
    if(G!==g||g.phase!=='question'||g.q!==q)return;
    if(kind==='sc'){q.answers=shuffle(q.answers);mountQ(q,'ans');$('#answers').classList.add('scrambled');sfx('whoosh');toast(`${nm}! The answers got shuffled.`);live('Answers shuffled.')}
    else if(kind==='dr'){const left=q.limit*1000-(gnow()-g.qStart),cut=Math.max(0,Math.min(3000,left-1500));g.qStart-=cut;const f=$('#tfill');if(f){f.classList.add('zap');setTimeout(()=>f.classList.remove('zap'),700)}sfx('escape');toast(`${nm}! Time drained.`);live('Three seconds drained.')}
    else if(kind==='fog'){const a=$('#answers');if(a){a.classList.add('ink-fog');setTimeout(()=>{if(a)a.classList.remove('ink-fog')},1200)}const qc=$('#qcard');if(qc){qc.classList.add('inked');setTimeout(()=>qc.classList.remove('inked'),1200)}sfx('whoosh');toast(`${nm}! The answers hide in the ink.`);live('Answers hidden in ink for a moment.')}
    else if(kind==='quake'){const qc=$('#qcard');if(qc){qc.classList.remove('quake');void qc.offsetWidth;qc.classList.add('quake')}if(el){el.classList.remove('quake');void el.offsetWidth;el.classList.add('quake')}sfx('chest');toast(`${nm}! The floor shook. The answers did not.`);live('The boss stomped. The answers stayed put.')}
    else if(kind==='hex'){const btns=$$('#answers .answer');const wrong=[...btns].filter((x,i)=>q.answers[i]&&!q.answers[i].correct);const t=wrong.length?pick(wrong):btns[0];if(t){t.classList.add('hexed');setTimeout(()=>t.classList.remove('hexed'),2500)}sfx('whoosh');toast(`${nm}! A sparkle landed on one answer. It still works.`);live('One answer was hexed, but it still works.')}
  })}
function showBrawl(){
  if(!G||G.phase!=='feedback')return;
  G.phase='brawl';sfx('chest');
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';
  const cb=combo(G.me.streak),mul=G.powered?2:1,jab=(25+cb)*mul,smash=(65+cb)*mul,hp=G.boss&&G.boss.max?G.boss.hp:0;
  const canFin=i=>hp>0&&(i===0?jab:i===1?smash:0)>=hp;
  const desc=i=>i===0?`Always hits for ${jab}`:i===1?`60% chance to hit for ${smash}`:MOVES[2].d;
  $('#qtext').textContent=G.powered?'POWERED UP! Pick your attack.':'Pick your attack!';
  const a=$('#answers');a.className='answers brawl';
  a.innerHTML=MOVES.map((m,i)=>`<button class="move${canFin(i)?' finish':''}" data-act="move" data-i="${i}" aria-label="${m.n}: ${desc(i)}${canFin(i)?' Finish it!':''}"><span class="mv-e" aria-hidden="true">${m.e}</span><b>${m.n}${canFin(i)?' · FINISH IT!':''}</b><span class="mv-d">${desc(i)}</span><span class="key" aria-hidden="true">${i+1}</span></button>`).join('');
  live(`Attack time. 1 ${MOVES[0].n}, 2 ${MOVES[1].n}, 3 ${MOVES[2].n}.`);
}
function brawlMove(i){
  if(!G||G.phase!=='brawl'||G.paused)return;
  G.phase='reveal';const me=G.me,b=G.boss,mv=MOVES[i];let d=0,text,good=true;const cb=combo(me.streak);const dbl=!!G.powered;
  if(i===0)d=25+cb;else if(i===1){if(Math.random()<.6)d=65+cb}else{d=15;G.powered=true}
  if(i<2&&dbl){d*=2;G.powered=false}
  if(i===2&&dbl)G.powered=true;
  if(d>0&&b&&b.max&&b.hp>0&&d>=b.hp){juiceBanner('💀 FINISHING BLOW!','fire');sfx('jackpot')}
  if(d>0){addScore(me,d);text=i===2?`Power Up! +${d} damage and your next attack is doubled.`:(dbl?`DOUBLE POWER! ${pick(BRAWL_HIT)}`:(b.x&&Math.random()<.35?pick(b.x.hurt):pick(BRAWL_HIT))).replace('{b}',b.n).replace('{d}',d)}
  else{good=false;text=pick(BRAWL_MISS).replace('{b}',b.n)}
  sfx(i===2?'coin':d>0?'catch':'escape');
  $$('#answers .move').forEach((x,k)=>{x.disabled=true;x.classList.add(k===i?'picked':'dim')});
  const r=document.createElement('div');r.className='heist-res show brawl-res '+(good?'good':'bad');r.textContent=text;$('#answers').after(r);live(text);
  popBits($('#bossE'),good?['💥','⭐','✨']:['💨','💨'],good?10:5,good?'gold':'puff');
  schedule(1500,()=>{r.remove();nextQuestion()});
}
function botBrawl(p){const cb=combo(p.streak);let d=0;if(Math.random()<.5)d=20+cb;else if(Math.random()<.6)d=55+cb;if(d)addScore(p,d)}

/* ---------------- Café Rush ---------------- */
const CAFE_ITEMS=['☕','🥐','🍰','🥪','🍩','🍕','🥤','🍪','🍔','🧁','🍓','🥞'],CAFE_GUESTS=['👩‍🦰','👴','🧒','🧑‍🚀','🐻','🦊','🐸','🐧','🧙','👸'];
function showCafe(){
  if(!G||G.phase!=='feedback')return;
  G.phase='cafe';G.cafes=(G.cafes||0)+1;const L=G.cafes<=3?2:G.cafes<=9?3:4;
  const items=shuffle(CAFE_ITEMS).slice(0,4),order=shuffle([0,1,2,3]).slice(0,L);
  const regular=(G.me.orders||0)>=3;if(regular&&!G._regularGuest)G._regularGuest=pick(CAFE_GUESTS);
  G.cafe={items,order,L,pos:0,mistakes:0,t0:gnow(),limit:G.relaxed?Infinity:3500+L*1400,guest:regular?G._regularGuest:pick(CAFE_GUESTS),regular};
  const fb=$('#feedback');fb.className='feedback';fb.innerHTML='';$('#qtext').textContent=regular?'A regular is back — the usual!':'Customer at the counter!';sfx('chest');
  if(regular)juiceBanner('⭐ A REGULAR IS BACK!','fire');
  live((regular?'A regular wants the usual. ':'A customer wants ')+`${order.map(k=>items[k]).join(', then ')}. Press the matching number keys in order.`);
  const a=$('#answers');a.className='answers cafe';
  a.innerHTML=`<div class="counter${regular?' regular':''}" id="counter"><div class="guest"><span class="guest-e" aria-hidden="true">${G.cafe.guest}</span>
    <div class="bubble" aria-label="Order">${order.map((k,n)=>`<span class="ord" id="ord${n}">${items[k]}</span>`).join('')}</div></div>
    <div class="patience" aria-hidden="true"><i id="patFill"></i></div>
    <div class="tray">${items.map((e,i)=>`<button class="item" data-act="cafe" data-i="${i}" aria-label="Item ${i+1}: ${e}"><span class="ie" aria-hidden="true">${e}</span><span class="key" aria-hidden="true">${i+1}</span></button>`).join('')}</div>
    <p class="cafe-streak" id="cafeStreak">${(G.me.orders||0)?('Perfect streak: '+(G.me.orders||0)):'Land three perfects and a regular will drop by.'}</p>
    <div class="heist-res" id="cafeRes" aria-hidden="true"></div></div>`;
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  if(innerWidth<=560){const qc=$('#qcard');if(qc){const r=qc.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight)qc.scrollIntoView({block:'start',behavior:'auto'})}}
}
function cafeStep(){
  const g=G,c=g.cafe,el=gnow()-c.t0;const pf=$('#patFill');if(pf){const f=Math.max(0,1-el/c.limit);pf.style.width=(f*100)+'%';pf.className=f<.3?'low':''}
  if(el>=c.limit)cafeEnd(false)}
function cafeTap(i){
  if(!G||G.phase!=='cafe'||G.paused)return;const c=G.cafe;
  if(i===c.order[c.pos]){const o=$('#ord'+c.pos);if(o)o.classList.add('done');c.pos++;sfx('ding');
    const b=$$('.tray .item')[i];if(b){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
    if(c.pos>=c.L)cafeEnd(true)}
  else{c.mistakes++;c.t0-=450;sfx('oops');const b=$$('.tray .item')[i];if(b){b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope')}}}
function cafeEnd(ok){
  if(!G||G.phase!=='cafe')return;const c=G.cafe,el=gnow()-c.t0;G.phase='reveal';let text,good,s='coin';
  if(ok){const left=c.limit===Infinity?.4:Math.max(0,1-el/c.limit);const amt=Math.max(8,10+8*c.L+Math.round(left*25)-4*c.mistakes+(c.mistakes?0:8));
    addScore(G.me,amt);good=true;if(!c.mistakes){G.me.orders=(G.me.orders||0)+1;s='perfect';if(G.me.orders===3)juiceBanner('⭐ YOU HAVE A REGULAR!','fire')}
    text=c.mistakes?`Served, a bit clumsily. +${amt} coins in tips.`:pickQuip([`Perfect order! +${amt} coins in tips.`,`Smooth service. +${amt} coins in tips.`,`Order up! +${amt} coins. They left a smiley.`,`Five stars! +${amt} coins in tips.`,`+${amt} coins. They tipped in cookies.`])}
  else{const l=Math.min(G.me.score,10);addScore(G.me,-l);good=false;s='lose';text=l?pickQuip([`Customer stormed out. -${l} coins for the bad review.`,`Customer left hungry and grumpy. -${l} coins.`]):'Customer stormed out. Luckily you had no coins to lose.'}
  sfx(s);const cr=$('#cafeRes');if(cr){cr.textContent=text;cr.className='heist-res show '+(good?'good':'bad')}live(text);
  const ge=$('.guest-e');if(ge)ge.classList.add(ok?'happy':'angry');$$('.tray .item').forEach(b=>b.disabled=true);
  const ctr=$('#counter');if(ok&&!c.mistakes){if(ctr)ctr.classList.add('perfect-order');floatText('PERFECT!')}
  popBits($('#counter'),good?['🪙','⭐','✨']:['💢','💨'],good?9:5,good?'gold':'puff');schedule(1500,nextQuestion)}
const botCafe=b=>{addScore(b,rnd(25,60))};

/* ---------------- practice mode (no clocks, no bots) ---------------- */
let P=null;
let SC=null;
function studyAns(q){const t=qType(q);return t==='type'?(q.a||[]).filter(Boolean).join('  ·  '):t==='tf'?(TF_ANS[q.c]||(q.c===0?'True':'False')):((q.a&&q.a[q.c])||'')}
function studyOthers(q){return qType(q)==='mc'?(q.a||[]).filter((_,i)=>i!==q.c).join('  ·  '):''}
function clearStudyT(){if(SC&&SC.tid){clearTimeout(SC.tid);SC.tid=0}}
function startStudy(set,list){
  const qs=(list&&list.length?list:(set&&set.qs)||[]).map(q=>Object.assign({},q));
  if(!qs.length){toast('This set has no questions to study');return}
  clearStudyT();P=null;if(G)stopGame();
  SC={set:set||{title:'Study cards',qs},qs,i:0,flip:false,done:false,mark:{},fromMiss:!!(list&&list.length)};
  renderStudy();window.scrollTo(0,0)}
function studyFlip(){if(!SC||SC.done)return;SC.flip=!SC.flip;renderStudy();if(SC.flip)sfx('whoosh')}
function studyGoto(i){if(!SC||SC.done)return;if(i<0||i>=SC.qs.length)return;clearStudyT();SC.i=i;SC.flip=false;renderStudy()}
function studyNav(dir){
  if(!SC||SC.done)return;clearStudyT();
  const n=SC.i+dir;if(n<0)return;if(n>=SC.qs.length){finishStudy();return}
  SC.i=n;SC.flip=false;renderStudy()}
function studyMark(v){
  if(!SC||SC.done)return;if(!SC.flip){SC.flip=true;renderStudy();return}
  SC.mark[SC.i]=v;sfx(v>0?'correct':'tick');renderStudy();
  const wait=S.settings.reduceMotion?0:450;
  clearStudyT();SC.tid=setTimeout(()=>studyNav(1),wait)}
function finishStudy(){
  if(!SC)return;clearStudyT();SC.done=true;SC.flip=false;
  if(SC.qs.length>=8)unlockAch('cards');
  renderStudyEnd()}
function renderStudy(){
  if(!SC)return;if(SC.done){renderStudyEnd();return}
  const q=SC.qs[SC.i],n=SC.qs.length,k=SC.i+1,typ=qType(q),ans=studyAns(q),oth=studyOthers(q),fl=SC.flip,mk=SC.mark[SC.i];
  const known=Object.values(SC.mark).filter(v=>v>0).length,learn=Object.values(SC.mark).filter(v=>v<0).length;
  const pips=SC.qs.map((qq,i)=>`<button type="button" class="study-pip${i===SC.i?' on':''}${SC.mark[i]>0?' yes':SC.mark[i]<0?' no':''}" data-act="studygoto" data-i="${i}" aria-label="Card ${i+1}${SC.mark[i]>0?' (known)':SC.mark[i]<0?' (still learning)':''}${i===SC.i?', current':''}" aria-current="${i===SC.i?'true':'false'}"></button>`).join('');
  const faceQ=`${q.pic?`<div class="q-pic on" aria-hidden="true">${picHTML({pic:q.pic})}</div>`:''}<p class="study-type muted">${typ==='tf'?'True or false':typ==='type'?'Type-the-answer':'Multiple choice'} ${dpips(q.d)}</p><h2 class="q-title" id="studyQ">${esc(q.q)}</h2><p class="study-prompt muted">Tap the card or press <span class="kbd">Space</span> to flip.</p>`;
  const faceA=`<p class="eyebrow" style="margin-bottom:12px">Answer</p><p class="study-ans" id="studyA">${esc(ans)}</p>${oth?`<p class="study-oth muted">Not: ${esc(oth)}</p>`:''}${typ==='type'&&(q.a||[]).length>1?`<p class="muted" style="margin-top:8px;font-size:14px">Any of these is accepted.</p>`:''}`;
  view.innerHTML=`<div class="hud"><div class="stat-pill"><span>Study cards</span><b>${k} / ${n}</b></div><div class="stat-pill"><span>Known</span><b>${known}</b></div><div class="stat-pill"><span>Learning</span><b>${learn}</b></div><div style="flex:1"></div>${TTS_OK?'<button class="speak-btn" data-act="speak" aria-label="Read card aloud" title="Read aloud">🔊</button>':''}<button class="btn btn-ghost btn-sm" data-act="setup" id="studyBack">Back</button></div>
  <div class="page-body study-page" style="max-width:720px;margin:0 auto">
   <p class="muted" style="text-align:center;margin:0 0 14px">${SC.fromMiss?'Questions you missed in the last game':'Flip through <b>'+esc((SC.set&&SC.set.title)||'this set')+'</b>. No clocks, no score.'}</p>
   <div class="flip-wrap">
    <div class="flip-card${fl?' on':''}" id="flipCard" data-act="studyflip" role="button" tabindex="0" aria-pressed="${fl}" aria-label="${fl?'Hide answer':'Show answer'}">
     <span class="flip-face front">${faceQ}</span>
     <span class="flip-face back">${faceA}</span>
    </div>
   </div>
   <div class="study-pips" role="group" aria-label="Cards">${pips}</div>
   <div class="btn-row study-marks" style="justify-content:center;margin-top:18px">${fl?`<button class="btn btn-secondary" id="studyNo" data-act="studymark" data-v="-1"${mk<0?' aria-pressed="true"':''}>🙈 Still learning <span class="kbd">1</span></button><button class="btn btn-primary" id="studyYes" data-act="studymark" data-v="1"${mk>0?' aria-pressed="true"':''}>✅ I know this <span class="kbd">2</span></button>`:`<button class="btn btn-secondary" data-act="studynav" data-v="-1" ${SC.i?'':'disabled'}>← Back</button><button class="btn btn-primary" id="studyShow" data-act="studyflip">Show answer <span class="kbd">Space</span></button><button class="btn btn-secondary" data-act="studynav" data-v="1">${SC.i===n-1?'Finish':'Next →'}</button>`}</div>
  </div><div class="sr-only" id="srLive" aria-live="polite"></div>`;
  live(fl?('Answer: '+ans):('Card '+k+' of '+n+'. '+q.q));
  if(S.settings.tts)speak(fl?('The answer is '+ans):q.q)}
function renderStudyEnd(){
  if(!SC)return;
  const n=SC.qs.length,known=Object.values(SC.mark).filter(v=>v>0).length,learn=Object.values(SC.mark).filter(v=>v<0).length,rest=n-known-learn;
  const shaky=learn,line=n?`${known} felt solid, ${learn} still shaky${rest?`, ${rest} skipped`:''}.`:'No cards.';
  view.innerHTML=`<div class="page-body study-end" style="max-width:680px;margin:24px auto">
   <div class="end-head"><div class="mascot-wrap">${mascot(known>=learn?'happy':'sad')}</div>
    <span class="eyebrow">Study cards · ${esc((SC.set&&SC.set.title)||'Set')}</span>
    <h1 id="endTitle">That's the deck.</h1>
    <p class="muted">You flipped through ${n} card${n===1?'':'s'}. ${esc(line)}</p></div>
   <div class="btn-row" style="margin-top:28px;justify-content:center">
    ${shaky?`<button class="btn btn-pop btn-lg" id="studyPrac" data-act="studypractice">Practise the ${shaky} shaky one${shaky===1?'':'s'}</button>`:''}
    <button class="btn btn-secondary btn-lg" data-act="studyagain">Flip them again</button>
    <button class="btn btn-primary btn-lg" id="studyPlay" data-act="studyplay">Play this set</button>
    <button class="btn btn-ghost" data-act="setup">Back to setup</button>
   </div>
  </div><div class="sr-only" id="srLive" aria-live="polite"></div>`;
  live('Study finished. '+line)}

function startPractice(list,src,adaptive,sid,goal){
  const bank=list||S.weak||[];if(!bank.length){toast('Nothing to practise. Suspiciously perfect.');return}
  if(G)stopGame();
  const qs=shuffle(bank).slice(0,12).map(x=>Object.assign({},x,{tried:false}));
  P={queue:qs,total:qs.length,first:0,mastered:0,cur:null,src:src||'weak',sid:sid||null,goal:goal||null};
  if(adaptive){const pool=shuffle(bank).slice(0,60).map(x=>Object.assign({},x,{tried:false}));P.queue=[];P.pool=pool;P.total=Math.min(12,pool.length);P.asked=0;P.ad={lvl:adaptStart(),run:0,path:[]}}
  nextPractice();window.scrollTo(0,0)}
function openLevelPractice(){
  const sets=S.sets.filter(s=>s.qs&&s.qs.length);let lvl=0;
  const pool=(src)=>src==='weak'?(S.weak||[]):((sets.find(s=>s.id===src)||{qs:[]}).qs.map(q=>Object.assign({},q,{set:(sets.find(s=>s.id===src)||{}).title})));
  const cnt=(src,l)=>pool(src).filter(q=>!l||q.d===l).length;
  modal(`<h2>Practise by level</h2><p class="hint">No clocks, no bots. Pick where the questions come from and how hard they should be. Misses go into your weak spots.</p>
   <label class="label" for="lpSrc">Questions from</label><select class="input" id="lpSrc" style="width:100%"><option value="weak">My weak spots (${(S.weak||[]).length})</option>${sets.map(s=>`<option value="${esc(s.id)}" ${s.id===S.cfg.setId?'selected':''}>${esc(s.title)}</option>`).join('')}</select>
   <span class="label" style="margin-top:14px">Level</span><div class="seg" id="lpLvl"></div><label class="set-line" style="margin-top:8px;padding:8px 0;border:0"><span><b>Adaptive</b><small>Starts at your level, steps up after 2 right in a row and down after a miss.</small></span><input type="checkbox" id="lpAdapt"></label><p class="hint" id="lpInfo" style="margin-top:10px"></p>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Cancel</button><button class="btn btn-primary" id="lpGo">Start practice</button></div>`,(o,close)=>{
    const draw=()=>{const src=$('#lpSrc',o).value;$('#lpLvl',o).innerHTML=[[0,'All'],[1,'Easy'],[2,'Medium'],[3,'Hard']].map(([l,n])=>`<button type="button" class="${lvl===l?'on':''}" aria-pressed="${lvl===l}" data-l="${l}">${n} <small>${cnt(src,l)}</small></button>`).join('');
      const n=cnt(src,lvl);$('#lpInfo',o).textContent=n?`${Math.min(12,n)} of ${n} questions will be picked.`:(lvl&&pool(src).length?'No questions at this level. Questions get a level in the editor, and the newer built-in sets are all levelled.':'Nothing to practise here yet.');$('#lpGo',o).disabled=!n};
    $('#lpSrc',o).onchange=draw;$('#lpAdapt',o).onchange=e=>{$('#lpLvl',o).style.opacity=e.target.checked?.4:1};$('#lpLvl',o).onclick=e=>{const b=e.target.closest('button[data-l]');if(!b)return;lvl=+b.dataset.l;draw()};
    $('#lpGo',o).onclick=()=>{const src=$('#lpSrc',o).value;const ad=$('#lpAdapt',o).checked;const list=pool(src).filter(q=>ad||!lvl||q.d===lvl);close();startPractice(list,src==='weak'?'weak':'set',ad,src==='weak'?null:src)};draw()})}
function startStarGoal(){
  const set=S.sets.find(x=>x.id===S.cfg.setId);const g=set&&starGoal(set);if(!g||!g.pool.length){toast(set?'All stars earned on this set. Nicely done!':'Pick a question set first');return}
  const pool=g.pool.map(q=>Object.assign({},q,{set:set.title}));const want=Math.min(12,Math.max(6,pool.length));let list=[];while(list.length<want)list=list.concat(shuffle(pool));
  startPractice(list.slice(0,want),'set',false,set.id,{sid:set.id,lvl:g.lvl,label:g.label})}
function adaptStart(){const t=[0,0,0,0].map(()=>[0,0]);(S.history||[]).forEach(h=>(h.byD||[]).forEach((p,i)=>{t[i][0]+=p[0];t[i][1]+=p[1]}));
  const acc=i=>t[i][1]>=5?t[i][0]/t[i][1]:null;if(acc(2)!=null&&acc(2)>=.75)return 3;if(acc(2)!=null&&acc(2)<.5)return 1;if(acc(2)==null&&acc(1)!=null)return acc(1)>=.8?2:1;return 2}
function nextPractice(){
  if(P.ad){if(P.asked>=P.total||!P.pool.length){endPractice();return}
    const L=P.ad.lvl;P.pool.sort((a,b)=>Math.abs((a.d||2)-L)-Math.abs((b.d||2)-L)||Math.random()-.5);const raw=P.pool.shift();P.asked++;P.ad.path.push(L);P.cur=Object.assign(buildQ(raw),{done:false,lvl:L});renderPractice();return}
  if(!P.queue.length){endPractice();return}
  const raw=P.queue.shift();P.cur=Object.assign(buildQ(raw),{done:false});renderPractice()}
function renderPractice(){
  const c=P.cur,left=P.ad?P.total-P.asked+1:P.queue.length+1,pct=Math.round((P.mastered/P.total)*100);
  view.innerHTML=`<div class="hud"><div class="stat-pill"><span>Practice</span><b>${left} left</b></div><div class="stat-pill"><span>Mastered</span><b>${P.mastered} / ${P.total}</b></div>${P.ad?`<div class="stat-pill" id="adLevel"><span>Level</span><b>${DIFF_NAMES[P.ad.lvl]}</b></div>`:''}${P.goal?`<div class="stat-pill" id="goalPill"><span>Star goal</span><b>${esc(P.goal.label)}</b></div>`:''}<div style="flex:1"></div><button class="btn btn-danger btn-sm" data-act="setup">Stop practising</button></div>
  <div class="page-body" style="max-width:820px;margin:0 auto"><section class="q-card" id="qcard"><div class="tbar"><i style="width:${pct}%"></i></div>
   <div class="q-meta"><span>From ${esc(c.raw.set||'your sets')} ${dpips(c.raw.d)}</span>${TTS_OK?'<button class="speak-btn" data-act="speak" aria-label="Read question aloud" title="Read aloud">🔊</button>':''}<span>No clocks. No bots. No judgement.</span></div>
   <h2 class="q-title" id="qtext">${esc(c.raw.q)}</h2><div class="q-pic${c.pic?' on':''}" id="qpic">${picHTML(c)}</div>
   <div class="answers${c.type==='tf'?' tf':''}${c.type==='type'?' typed':''}" id="answers">${answersHTML(c,'pans')}</div>
   <div class="feedback" id="feedback" role="status"></div><div class="btn-row" id="pnext" style="margin-top:16px"></div></section></div><div class="sr-only" id="srLive" aria-live="polite"></div>`;
  live(`Practice question. ${c.raw.q}`);if(S.settings.tts)speak(qSpeech(c));const ti=$('#typeIn');if(ti)setTimeout(()=>{try{ti.focus({preventScroll:true})}catch(e){}},30)}
function practiceAnswer(i,typedIn){
  if(!P||!P.cur||P.cur.done)return;const c=P.cur;c.done=true;let ok,close=false;const msid=P.sid||c.raw._sid||(S.sets.find(x=>x.title===c.raw.set)||{}).id;
  if(c.type==='type'){const typed=(typedIn!=null?typedIn:typedValue()).trim();const m=matchTyped(typed,c.accept);ok=m>0;close=m===2;typedResult(c,ok,typed,close)}
  else{ok=!!c.answers[i]&&c.answers[i].correct;
    $$('#answers .answer').forEach((b,k)=>{b.disabled=true;if(c.answers[k].correct)b.classList.add('right');else if(k===i)b.classList.add('wrong');else b.classList.add('dim')})}
  recMast(msid,c.raw.d||0,ok);
  if(P.ad){if(ok){P.ad.run++;if(P.ad.run>=2){P.ad.lvl=Math.min(3,P.ad.lvl+1);P.ad.run=0}}else{P.ad.run=0;P.ad.lvl=Math.max(1,P.ad.lvl-1)}}
  if(ok){sfx('correct');P.mastered++;if(!c.raw.tried)P.first++;S.weak=(S.weak||[]).filter(w=>w.q!==c.raw.q);save();
    feedback('ok',close?'Close enough! Typo forgiven.':c.raw.tried?'Got it this time. That is how learning works.':pickQuip(QUIPS.ok),'Removed from your weak spots.','✅')}
  else{sfx('wrong');c.raw.tried=true;if(!P.ad)P.queue.push(c.raw);if(P.src==='set'){S.weak=S.weak||[];if(!S.weak.some(w=>w.q===c.raw.q)){S.weak.push(Object.assign({},c.raw,{tried:undefined}));if(S.weak.length>60)S.weak.shift();save()}}feedback('no',c.type==='type'?'Not quite. The answer is shown above.':'Not quite. Take a good look at the green one.',P.ad?'Added to your weak spots. The next one gets a little easier.':'This one comes back later so it sticks.','🙈')}
  const more=P.ad?(P.asked<P.total&&P.pool.length):P.queue.length;
  $('#pnext').innerHTML=`<button class="btn btn-primary" data-act="pnext" id="pnextBtn">${more?'Next question':'Finish'} <span class="kbd">Enter</span></button>`;const b=$('#pnextBtn');if(b)b.focus()}
function endPractice(){
  const n=P.total,f=P.first,left=(S.weak||[]).length;S.practiced=(S.practiced||0)+1;let fresh=false;S.ach=S.ach||{};if(!S.ach.study){S.ach.study=Date.now();fresh=true}save();if(fresh)setTimeout(()=>toast('Achievement unlocked: 📘 Study buddy'),600);
  let goalMsg='';if(P.goal){const st=S.sets.find(x=>x.id===P.goal.sid);if(st){const m=masteryOf(st),g2=starGoal(st);const lv=P.goal.lvl&&m.lv?m.lv.find(x=>x.l===P.goal.lvl):null;
    goalMsg=P.goal.lvl?(lv&&lv.ok?`🌟 <b>${esc(P.goal.label)} level mastered!</b> That set now has ${m.stars} of 3 stars.`:`Star goal not reached yet: ${esc((g2&&g2.text)||'')} Another round will push it up.`):(g2?`Star goal: ${esc(g2.text)}`:`🌟 <b>All three stars earned</b> on ${esc(st.title)}!`)}}
  view.innerHTML=`<div class="end-head"><div class="mascot-wrap">${mascot('party')}</div><span class="eyebrow">Practice complete</span><h1 id="endTitle">${f===n?'Spotless.':'Weak spots, meet strong spots.'}</h1>
   <p class="muted">${f} of ${n} right first time. Every one you finished is now off your list.${P&&P.ad?` Adaptive path: ${P.ad.path.map(l=>DIFF_NAMES[l][0]).join(' → ')}. You finished at <b>${DIFF_NAMES[P.ad.lvl]}</b>.`:''}</p>${goalMsg?`<p class="goal-msg" id="goalMsg" role="status">${goalMsg}</p>`:''}</div>
   <div class="panel page-body"><div class="stats"><div class="stat"><b>${n}</b><span>Questions practised</span></div><div class="stat"><b>${f}</b><span>Right first time</span></div><div class="stat"><b>${n-f}</b><span>Needed a second go</span></div><div class="stat"><b>${left}</b><span>Weak spots left</span></div></div>
   <div class="btn-row" style="margin-top:30px"><button class="btn btn-primary btn-lg" data-act="setup" id="backBtn">Back to games</button>${left?'<button class="btn btn-secondary btn-lg" data-act="practice">Practise more ('+left+')</button>':''}</div></div>`;
  P=null;confetti(f===n?60:30,innerWidth/2,200,1);sfx('win')}

/* ---------------- end screen ---------------- */
function endCopy(g){
  const me=g.me,acc=me.total?Math.round(me.correct/me.total*100):0;
  if(g.tourney){const n=g.tourney.modes.length;return g.rank===1?{t:'Tournament champion!',s:'First across all '+n+' modes. The rivals would like a word.'}:g.rank===2?{t:'So close to the title.',s:'Silver over '+n+' short rounds. One more push.'}:g.rank===3?{t:'On the tournament podium.',s:'Bronze over '+n+' modes. A rematch would be rude to refuse.'}:{t:'Tournament complete.',s:'Every mode, one after another. The board tells the story.'}}
  if(g.demo)return{t:me.correct?'That\'s a game of QuizBlox!':'A short spin, just to see the ropes.',s:me.correct?'You\'ve got the hang of it. Pick a set and a mode when you\'re ready for a proper game.':'No worries — pick a set, hit Let\'s go, and the chests will wait for you.'};
  if(g.reason==='photo')return{t:'Photo finish!',s:'You nicked first place by a single point. The bots want a rematch — and a slower clock.'};
  if(g.reason==='photo-loss')return{t:'The tie stands.',s:'One more correct answer would have stolen first. So close you can taste it.'};
  if(!me.correct)return{t:'Did you play with your eyes closed?',s:'Zero correct answers. Blox believes in you anyway. Try again!'};
  if(g.rank===1)return acc>=80?pickQuip([{t:'Absolute legend.',s:`${acc}% accuracy. The bots are filing a complaint.`},{t:'Practically a wizard.',s:`${acc}% accuracy. The bots want to see your wand.`}]):pickQuip([{t:'Champion! (We double-checked.)',s:'You won, and nobody is allowed to ask how.'},{t:'First place, baby!',s:'Cue the confetti cannon. Gently, please.'}]);
  if(g.rank===2)return pickQuip([{t:'So close you can taste it.',s:'Silver is just gold that did a little less homework. Rematch?'},{t:'Silver! Shiny and a little smug.',s:'One more game and gold is yours.'}]);
  if(g.rank===3)return pickQuip([{t:'Podium! Barely, but it counts.',s:'Bronze looks great on you. Go again?'},{t:'Third place, still on the stage!',s:'Bronze is the colour of a comeback. Go again?'}]);
  return acc>=50?{t:'Respectable effort.',s:'The bots got lucky. Probably. Go again?'}:pickQuip([{t:'Well… you showed up.',s:'That counts for something. Blox is proud of you. Mostly.'},{t:'Every champion started here.',s:'Blox has seen worse. (Blox has not.) Try again!'}]);
}
let CURRENT_END=null;
function rivalLine(g){if(S.settings.taunts===false)return'';const top=g.ranked[0];let b,kind;
  if(top.bot){b=top;kind='win'}else{b=g.ranked[1];kind='lose'}
  const L=(TAUNTS[b.name]||{})[kind];if(!L)return'';
  return `<div class="rival-line" role="status" style="--tc:${b.color}"><span class="t-av" aria-hidden="true">${b.emoji}</span><span class="t-tx"><b>${esc(b.name)}</b>${esc(L[Math.floor(Math.random()*L.length)])}</span></div>`}

function nth(n){n=+n;const s=n%100;if(s>=11&&s<=13)return n+'th';return n+(['th','st','nd','rd'][n%10]||'th')}
function recapTime(g){return g.time>=60?(g.time%60?g.time+' sec':(g.time/60===1?'1 minute':g.time/60+' minutes')):g.time+' sec'}
function recapText(g){
  g=g||CURRENT_END;if(!g||!g.me)return'';
  const unit=g.tourney?'pts':MODES[g.mode].unit,acc=g.me.total?Math.round(g.me.correct/g.me.total*100):0;
  const place=nth(g.rank)+' of '+g.players.length;
  let t=g.tourney?('I placed '+place+' in an all-modes tournament on '+g.set.title+' — '+g.me.score+' pts over '+(g.tourney.modes&&g.tourney.modes.length)+' modes, '+acc+'% accuracy, best streak '+g.me.best+'.'):('I placed '+place+' in '+MODES[g.mode].name+' on '+g.set.title+' — '+g.me.score+' '+unit+', '+acc+'% accuracy, best streak '+g.me.best+' ('+recapTime(g)+').');
  if(g.newBest)t+=' New personal best!';
  if(g.pass&&g.passRival)t+=' Versus '+g.passRival.name+' ('+g.passRival.score+' '+unit+').';
  if(g.team&&g.mates&&g.mates[1])t+=' Team-up with '+g.mates[1].name+' against the bots.';
  return t+' Play QuizBlox!'}
function recapCardHTML(g){
  const me=g.me,unit=MODES[g.mode].unit,acc=me.total?Math.round(me.correct/me.total*100):0,copy=endCopy(g);
  return '<div class="recap-wrap" id="recapWrap"><div class="recap-card" id="recapCard">'
    +'<div class="recap-brand"><span class="recap-logo" aria-hidden="true">▦</span> QuizBlox</div>'
    +'<div class="recap-mode">'+MODES[g.mode].emoji+' '+esc(MODES[g.mode].name)+' · '+esc(g.set.title)+'</div>'
    +'<div class="recap-rank" id="recapRank">'+nth(g.rank)+' <small>of '+g.players.length+'</small></div>'
    +'<div class="recap-score" id="recapScore">'+me.score+' '+esc(unit)+'</div>'
    +'<div class="recap-bits">'+acc+'% accuracy · streak '+me.best+' · '+recapTime(g)+(g.newBest?' · new best':'')+(g.hard?' · hard':'')+'</div>'
    +'<p class="recap-line">'+esc(copy.t)+'</p>'
    +'</div>'
    +'<div class="btn-row recap-actions">'
    +'<button type="button" class="btn btn-primary btn-sm" data-act="copyrecap" id="copyRecap">Copy recap</button>'
    +'<button type="button" class="btn btn-secondary btn-sm" data-act="sharerecap" id="shareRecap">Share</button>'
    +'<button type="button" class="btn btn-secondary btn-sm" data-act="saverecap" id="saveRecap">Save image</button>'
    +'</div></div>'}
function drawRecap(g){
  g=g||CURRENT_END;if(!g||!g.me)return'';
  const me=g.me,unit=MODES[g.mode].unit,acc=me.total?Math.round(me.correct/me.total*100):0,copy=endCopy(g);
  const c=document.createElement('canvas');c.width=1200;c.height=675;
  const x=c.getContext('2d');
  x.fillStyle='#fff8ec';x.fillRect(0,0,1200,675);
  x.fillStyle='#5b4cf0';x.fillRect(0,0,1200,96);
  x.fillStyle='#ffcf3f';x.fillRect(0,96,1200,8);
  x.fillStyle='#fff';x.font='800 42px Trebuchet MS,Segoe UI,sans-serif';x.fillText('QuizBlox',48,64);
  x.fillStyle='#3b3366';x.font='600 28px Trebuchet MS,Segoe UI,sans-serif';
  x.fillText(MODES[g.mode].name+'  ·  '+g.set.title,48,170);
  x.fillStyle='#1b1340';x.font='800 96px Trebuchet MS,Segoe UI,sans-serif';
  x.fillText(nth(g.rank)+' of '+g.players.length,48,300);
  x.font='800 52px Trebuchet MS,Segoe UI,sans-serif';x.fillText(me.score+' '+unit,48,380);
  x.fillStyle='#3b3366';x.font='600 28px Trebuchet MS,Segoe UI,sans-serif';
  x.fillText(acc+'% accuracy   ·   streak '+me.best+'   ·   '+recapTime(g)+(g.newBest?'   ·   new best':''),48,450);
  x.fillStyle='#1b1340';x.font='700 32px Trebuchet MS,Segoe UI,sans-serif';
  const line=copy.t||'';x.fillText(line.length>48?line.slice(0,45)+'\u2026':line,48,530);
  x.fillStyle='#6f6894';x.font='600 22px Trebuchet MS,Segoe UI,sans-serif';
  x.fillText('A classroom quiz game  ·  no sign-up',48,620);
  return c.toDataURL('image/png')}
function copyRecap(){
  const t=recapText();if(!t)return;
  const done=ok=>toast(ok?'Recap copied. Paste it anywhere.':'Select the text and copy it yourself.');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>done(true),()=>done(fallbackCopy(t)));
  else done(fallbackCopy(t))}
function fallbackCopy(t){try{const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return!!ok}catch(e){return false}}
async function shareRecap(){
  const t=recapText();if(!t)return;
  if(navigator.share){try{await navigator.share({title:'My QuizBlox recap',text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
  copyRecap()}
function saveRecap(){
  const url=drawRecap();if(!url)return;
  const a=document.createElement('a');a.href=url;a.download='quizblox-recap.png';document.body.appendChild(a);a.click();a.remove();toast('Recap image saved.')}

function renderEnd(){
  const g=G,me=g.me,r=g.ranked;const acc=me.total?Math.round(me.correct/me.total*100):0;
  const avg=me.times.length?(me.times.reduce((a,b)=>a+b,0)/me.times.length).toFixed(1)+'s':'–';
  const unit=g.tourney?'pts':MODES[g.mode].unit;const copy=endCopy(g);const mood=g.rank<=3&&me.correct?'party':'sad';
  const pod=(p,k)=>p?`<div class="pod p${k}">${avatarHTML(p,k===1?68:56)}<div class="nm">${esc(p.name)}${p.me?' (you)':''}</div><div class="sc">${p.score} ${unit}</div><div class="stand">${k}</div></div>`:'<div></div>';
  view.innerHTML=`<div class="end-head"><div class="mascot-wrap">${mascot(mood)}</div><span class="eyebrow">${g.tourney?'Tournament complete':g.demo?'Demo complete':g.reason==='photo'?'Photo finish!':g.reason==='photo-loss'?'The tie stands':g.reason==='boss'?(g.boss?g.boss.n+' defeated':'Boss defeated'):g.reason==='goal'?(g.mode==='rocket'?'Reached space!':'Goal reached'):(g.mode==='brawl'&&g.boss&&g.boss.max?'Time\'s up, the boss survived':'Time\'s up')} · ${g.tourney?'all '+g.tourney.modes.length+' modes':MODES[g.mode].name}</span>
   <h1 id="endTitle">${esc(copy.t)}</h1><p class="muted">${esc(copy.s)}</p><p class="muted" style="font-size:14px">Set played: ${esc(g.set.title)}${g.hard?' · hard mode 🌶️':''}${g.ov&&g.ov.cl?' · class: '+esc(g.ov.cl.name):''}</p>${rivalLine(g)}</div>
  <div class="podium" aria-label="Podium">${pod(r[1],2)}${pod(r[0],1)}${pod(r[2],3)}</div>
  <div class="panel page-body"><h3 style="margin-bottom:16px">Your stats</h3>
   <div class="stats"><div class="stat"><b>${acc}%</b><span>Accuracy</span></div><div class="stat"><b>${me.correct} / ${me.total}</b><span>Correct answers</span></div>
   <div class="stat"><b>${me.best}</b><span>Best streak</span></div><div class="stat"><b>${avg}</b><span>Average answer time</span></div></div>
   ${g.ch?(me.score>g.ch.score?`<div class="ch-result ok" role="status">🤜 <b>Challenge beaten!</b> You scored ${me.score} ${unit} against ${esc(g.ch.name)}'s ${g.ch.score}.</div>`:`<div class="ch-result no" role="status">🤜 <b>${g.ch.score-me.score} ${unit} short.</b> ${esc(g.ch.name)} scored ${g.ch.score}; you scored ${me.score}. ${g.ch.score-me.score<=g.ch.score*.15?'So close!':'Go again?'}</div>`):''}
   ${g.ov&&g.ov.cl?classPanel(g):''}
   ${g.newBest?`<div class="best-chip" role="status">🎉 New personal best on this set: <b>${me.score} ${unit}</b> (was ${g.prevBest})</div>`:(g.prevBest&&me.score<=g.prevBest?`<div class="best-chip near" role="status">Your best on this setup is still <b>${g.prevBest} ${unit}</b>${g.prevBest-me.score<=Math.max(8,g.prevBest*.1)?' — so close!':''}</div>`:'')}
   ${g.tourney?`<div class="tourney-legs" id="tourneyLegs"><h3 style="margin:24px 0 8px">Leg by leg</h3><ol>${g.tourney.legs.map((l,i)=>`<li><b>${MODES[l.mode].emoji} ${esc(MODES[l.mode].name)}</b> · ${esc(nth(l.rank))} · +${TOURNEY_PTS[l.rank]||0} pts</li>`).join('')}</ol></div>`:''}
   ${recapCardHTML(g)}
   ${me.missed&&me.missed.length?`<details class="revisit" id="revisit"><summary><b>Questions to revisit</b> <span class="muted">(${me.missed.length})</span></summary><div class="btn-row" style="padding:0 0 12px"><button class="btn btn-pop btn-sm" data-act="practice" id="practiceEnd">Practise these now</button><button class="btn btn-secondary btn-sm" data-act="studymissed" id="studyMissed">Study as cards</button></div><ul>${me.missed.map(m=>`<li><span class="rq">${m.pic?esc(m.pic)+' ':''}${esc(m.q)}</span><span class="ra">Answer: <b>${esc(m.right)}</b></span><span class="rs">${m.said?'You said: '+esc(m.said):'You ran out of time'}</span></li>`).join('')}</ul></details>`:''}
   ${g.newAch&&g.newAch.length?`<div class="ach-new" role="status"><b>${g.newAch.length>1?'Achievements unlocked':'Achievement unlocked'}</b>${g.newAch.map(a=>`<span class="ach-chip"><span aria-hidden="true">${a.e}</span> ${esc(a.n)} <small>${esc(a.d)}</small></span>`).join('')}</div>`:''}
   <h3 style="margin:30px 0 8px">Final leaderboard</h3><div class="final-lb" id="finalBoard">${r.map((p,i)=>`<div class="lb-row ${p.me?'me':''}"><span class="rk">${i+1}</span>${avatarHTML(p,36)}<span class="n">${esc(p.name)}${p.me?' (you)':''}</span><span class="sc">${p.score} ${unit}</span></div>`).join('')}</div>
   <div class="btn-row" style="margin-top:30px"><button class="btn btn-primary btn-lg" id="againBtn" data-act="again">Play again</button>${(g.ov||g.pass)?'':'<button class="btn btn-secondary btn-lg" data-act="challenge" id="challengeBtn">Challenge a friend</button>'}<button class="btn btn-secondary btn-lg" data-act="setup">Change settings</button><a class="btn btn-ghost" href="stats.html">Your stats</a></div></div>`;
  window.scrollTo(0,0);
  const delays=S.settings.reduceMotion?[0,0,0]:[200,900,1800];[3,2,1].forEach((k,n)=>{if(r[k-1])setTimeout(()=>{if(CURRENT_END===g)sfx('drum')},delays[n])});
  const done=S.settings.reduceMotion?0:2300;
  setTimeout(()=>{if(CURRENT_END!==g)return;sfx(g.rank<=3?'win':'lose_game');
    if(g.rank===1){confetti(90,innerWidth/2,150,1.2);confetti(40,innerWidth*.2,200,.8);confetti(40,innerWidth*.8,200,.8)}else if(g.rank<=3&&me.correct)confetti(36,innerWidth/2,150,1)},done);
  CURRENT_END=g;if(g.newAch&&g.newAch.length)setTimeout(()=>{if(CURRENT_END===g)sfx('perfect')},S.settings.reduceMotion?200:2600);
  $$('.stat b',view).forEach(el=>{const t=el.textContent;if(/^\d+%$/.test(t)){const n=parseInt(t,10);el.textContent='0%';let c=0;const iv=setInterval(()=>{c+=Math.max(1,Math.round(n/18));if(c>=n){c=n;clearInterval(iv)}el.textContent=c+'%'},30)}});
}

/* ---------------- events ---------------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
  if(a!=='ans'&&a!=='chest'&&a!=='move'&&a!=='pick'&&a!=='reel'&&a!=='pans'&&a!=='cafe')sfx('click');else audio();
  switch(a){
   case'cfg':{const k=t.dataset.k,v=t.dataset.v;
     window.__gridScroll=($('#setGrid .many')||{}).scrollTop||0;SEASON=false;TOURNEY=false;if(['time','goal','diff','hard'].includes(k))window.__moreOpen=true;if(k==='time')S.cfg.time=+v;else if(k==='goal')S.cfg.goal[S.cfg.mode]=+v;else if(k==='hard')S.cfg.hard=v==='1';else S.cfg[k]=v;save();renderSetup();break}
   case'mute':S.settings.sfx=!S.settings.sfx;save();t.textContent='Sound: '+(S.settings.sfx?'on':'off');if(S.settings.sfx)sfx('click');break;
   case'music':S.settings.music=!S.settings.music;save();t.textContent='Music: '+(S.settings.music?'on':'off');if(S.settings.music)audio();break;
   case'fav':{const on=toggleFav(t.dataset.id);toast(on?'Added to favourites':'Removed from favourites');const gs=($('#setGrid .many')||{}).scrollTop||0;renderSetGrid();const g3=$('#setGrid .many');if(g3)g3.scrollTop=gs;break}
   case'fcat':FILT.cat=t.dataset.v;renderSetGrid();break;
   case'fclear':FILT.q='';FILT.cat='all';{const si=$('#setSearch');if(si)si.value=''}renderSetGrid();break;
   case'challenge':openChallenge();break;
   case'copyrecap':copyRecap();break;
   case'sharerecap':shareRecap();break;
   case'saverecap':saveRecap();break;
   case'start':P=null;startGame();break;
   case'passready':readyPass();break;
   case'p2emoji':{S.p2=S.p2||{name:'Player 2'};S.p2.emoji=t.dataset.v;save();renderSetup();break}
   case'demo':P=null;startDemo();break;
   case'tourney':P=null;TOURNEY=true;startGame();break;
   case'tourneygo':readyTourney();break;
   case'usekey':useLuckyKey();break;
   case'skipkey':skipLuckyKey();break;
   case'again':{P=null;const o=CURRENT_END&&CURRENT_END.ov;startGame(o&&o.tag==='mix'?null:o);break}
   case'copycode':{const i=$('#clCode');if(!i)break;i.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(i.value).then(()=>toast('Code copied'),()=>toast(ok?'Code copied':'Press Ctrl+C to copy the selected code'));else toast(ok?'Code copied':'Press Ctrl+C to copy the selected code');break}
   case'study':{const s=S.sets.find(x=>x.id===S.cfg.setId);if(s)startStudy(s);break}
   case'studymissed':{if(G&&G.me&&G.me.missed&&G.me.missed.length){const list=G.me.missed.map(m=>(G.set.qs||[]).find(q=>q.q===m.q)).filter(Boolean);if(list.length)startStudy(G.set,list);else toast('Those questions are not in the set any more')}break}
   case'studyflip':studyFlip();break;
   case'studymark':studyMark(+t.dataset.v);break;
   case'studynav':studyNav(+t.dataset.v);break;
   case'studygoto':studyGoto(+t.dataset.i);break;
   case'studyagain':if(SC){SC.i=0;SC.flip=false;SC.done=false;SC.mark={};renderStudy()}break;
   case'studyplay':{const id=SC&&SC.set&&SC.set.id;SC=null;if(id){S.cfg.setId=id;save()}renderSetup();window.scrollTo(0,0);break}
   case'studypractice':{if(!SC)break;const shaky=SC.qs.filter((q,i)=>SC.mark[i]<0).map(q=>Object.assign({},q,{set:(SC.set&&SC.set.title)||q.set}));const sid=SC.set&&SC.set.id;SC=null;if(shaky.length)startPractice(shaky,'set',false,sid);else toast('Nothing marked as still learning');break}
   case'practice':startPractice();break;
   case'randomset':{const sets=S.sets.filter(s=>s.qs&&s.qs.length);const list=filterSets(sets).filter(s=>s.id!==S.cfg.setId);if(!list.length){toast('No other sets to pick from');break}
     const s=list[Math.floor(Math.random()*list.length)];S.cfg.setId=s.id;SEASON=false;TOURNEY=false;save();window.__gridScroll=0;renderSetup();toast('Random pick: '+s.title);const on=$('#setGrid .choice.on');if(on)on.scrollIntoView({block:'nearest'});break}
   case'levelpractice':openLevelPractice();break;
   case'stargoal':startStarGoal();break;
   case'pans':practiceAnswer(+t.dataset.i);break;
   case'pnext':nextPractice();break;
   case'setup':P=null;SC=null;clearStudyT();stopGame();renderSetup();window.scrollTo(0,0);break;
   case'emoji':S.emoji=t.dataset.v;save();renderSetup();break;
   case'ans':answer(+t.dataset.i);break;
   case'chest':pickChest(+t.dataset.i);break;
   case'move':brawlMove(+t.dataset.i);break;
   case'rcard':rocketCard(+t.dataset.i);break;
   case'pick':heistStop();break;
   case'pause':G&&G.paused?resumeGame():pauseGame();break;
   case'resume':resumeGame();break;
   case'reel':fishTap();break;
   case'cafe':cafeTap(+t.dataset.i);break;
   case'speak':if(G&&G.q)speak(qSpeech(G.q));else if(P&&P.cur)speak(qSpeech(P.cur));else if(SC&&SC.qs[SC.i]){const q=SC.qs[SC.i];speak(SC.flip?('The answer is '+studyAns(q)):q.q)}break;
   case'quit':if(G&&G.phase!=='over')confirmBox('Quit this game?','Your progress in this game will be lost.','Quit game',()=>{stopGame();renderSetup()});break;
  }
});
document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('.type-box');if(!f)return;e.preventDefault();const v=typedValue();if(G&&G.phase==='question')answer(0,v);else if(P&&P.cur&&!P.cur.done)practiceAnswer(0,v)});
document.addEventListener('keydown',e=>{
  const tg=e.target;if(tg&&/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(document.querySelector('.overlay')){if(e.key==='Escape'){const ov=document.querySelector('.overlay');if(ov._close)ov._close();else{if(ov._onClose)try{ov._onClose()}catch(err){}ov._onClose=null;ov.remove()}}return}
  if(e.key==='m'||e.key==='M'){S.settings.sfx=!S.settings.sfx;save();const b=$('#muteBtn');if(b)b.textContent='Sound: '+(S.settings.sfx?'on':'off');return}
  if(SC&&!G&&!P){if(e.key==='Escape'){e.preventDefault();clearStudyT();SC=null;renderSetup();return}
    if(SC.done){if(e.key==='Enter'||e.key===' '){e.preventDefault();const b=$('#studyPlay');if(b)b.click()}return}
    if(e.key===' '||e.key==='Enter'){e.preventDefault();studyFlip();return}
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();studyNav(1);return}
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();studyNav(-1);return}
    if(SC.flip&&e.key==='1'){e.preventDefault();studyMark(-1);return}
    if(SC.flip&&e.key==='2'){e.preventDefault();studyMark(1);return}
    return}
  if(P&&!G){const n=parseInt(e.key,10);if(P.cur&&!P.cur.done&&n&&n<=P.cur.answers.length)practiceAnswer(n-1);else if(P.cur&&P.cur.done&&(e.key==='Enter'||e.key===' ')){const b=$('#pnextBtn');if(!b||document.activeElement!==b){e.preventDefault();nextPractice()}}return}
  if(G&&G.phase!=='over'){
    if(e.key==='p'||e.key==='P'){e.preventDefault();G.paused?resumeGame():pauseGame();return}
    if(G.paused)return;
    if(G.phase==='pass'&&(e.key===' '||e.key==='Enter')){e.preventDefault();readyPass();return}
    if(G.phase==='tourney'&&(e.key===' '||e.key==='Enter')){e.preventDefault();readyTourney();return}
    if(e.key===' '||e.key==='Enter'){if(G.phase==='heist'){e.preventDefault();heistStop();return}if(G.phase==='fish'){e.preventDefault();fishTap();return}}
    if(G.phase==='question'&&G.q.type==='tf'&&(e.key==='t'||e.key==='T')){answer(0);return}
    if(G.phase==='question'&&G.q.type==='tf'&&(e.key==='f'||e.key==='F')){answer(1);return}
    const n=parseInt(e.key,10);if(!n)return;
    if(G.phase==='question'&&G.q.type!=='type'&&n<=G.q.answers.length)answer(n-1);
    else if(G.phase==='chest'&&n<=3)pickChest(n-1);
    else if(G.phase==='brawl'&&n<=3)brawlMove(n-1);
    else if(G.phase==='rocket'&&n<=3)rocketCard(n-1);
    else if(G.phase==='cafe'&&n<=4)cafeTap(n-1);
  }
});
(function init(){
  const p=params();const sid=p.get('set');if(sid&&S.sets.find(s=>s.id===sid)){S.cfg.setId=sid;save()}
  const md=p.get('mode');if(md&&MODES[md]){S.cfg.mode=md;save()}
  if(p.get('season')==='1'){const ev=typeof seasonEvent==='function'&&seasonEvent();if(ev){S.cfg.setId=ev.set.id;S.cfg.mode=ev.mode;S.cfg.time=180;S.cfg.goal[ev.mode]=0;S.cfg.hard=false;save();SEASON=true;TOURNEY=false}}
  if(p.get('tourney')==='1'||p.get('tournament')==='1'){TOURNEY=true;SEASON=false}
  if(p.get('pass')==='1'){S.cfg.passPlay=true;save()}
  if(p.get('team')==='1'){S.cfg.passPlay=true;S.cfg.passTeam=true;save()}
  const st=p.get('study');
  if(st){const set=S.sets.find(s=>s.id===(st==='1'?S.cfg.setId:st));if(set){S.cfg.setId=set.id;save();history.replaceState(null,'',location.pathname+(p.get('set')?'?set='+encodeURIComponent(set.id):''));renderSetup();startStudy(set);return}}
  renderSetup();
  if(p.get('demo')==='1'){history.replaceState(null,'',location.pathname);S.tour=true;save();startDemo();return}
  if(location.hash.startsWith('#class='))setTimeout(()=>checkIncomingClass(),50);
  else if(location.hash.startsWith('#challenge='))setTimeout(()=>checkIncomingChallenge(),50);
  else if(!S.tour&&(!navigator.webdriver||p.get('tour')==='1'))setTimeout(startTour,500);
})();
window.addEventListener('hashchange',()=>{if(/^#class=/.test(location.hash)&&(!G||G.phase==='over'))checkIncomingClass();if(/^#challenge=/.test(location.hash)&&(!G||G.phase==='over'))checkIncomingChallenge()});
window.QB={get P(){return P},pauseGame,resumeGame,noteClutch,appBase,appPath,showUpdateBanner,get G(){return G},get S(){return S},get SC(){return SC},startGame,startStudy,startDemo,heistPos,heistKind,heistSecurity,heistStop,showHeist,slipstream,recapText,drawRecap,copyRecap,shareRecap,saveRecap,grantLuckyKey,botGold,KEY_EVERY,KEY_CAP,updateRacePack,showPass,readyPass,showCafe,showFish,rollFish,FISH,trapFocus,rocketAlt,updateTrack,updateAltitude,ALT_BANDS,noteHotStreak,showChests,endGame,readyTourney,startTourneyLeg,awardTourneyLeg,autoDiff,TOURNEY_MODES,TOURNEY_TIME,TOURNEY_PTS,challengeLink,challengeInvite,challengeQr,openChallenge,parseChallenge,pickBossSpecial,bossSpecial,BOSSES};
