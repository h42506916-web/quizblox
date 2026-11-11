/* QuizBlox – stats: history, personal bests, charts, achievements */
const view=$('#view');
const medal=r=>r===1?'🥇':r===2?'🥈':r===3?'🥉':'#'+r;
const modeName=m=>(MODES[m]||{name:m}).name;
const modeLabel=g=>g&&g.tourney?'Tournament':modeName(g&&g.mode);
function chart(h){
  const d=h.slice(-20);if(!d.length)return'';
  const W=640,H=200,pad=28,padL=44,bw=Math.min(26,(W-padL-pad)/d.length-6);const step=(W-padL-pad)/d.length;
  const col=r=>r===1?'#ffcf3f':r===2?'#b9b4d6':r===3?'#e5a17a':'#8f84ff';
  const showN=d.length<=12;
  const bars=d.map((g,i)=>{const hh=Math.max(3,(H-pad*1.6)*g.acc/100),x=padL+i*step+(step-bw)/2,y=H-pad-hh;
    return `<g><title>${esc((MODES[g.mode]||{}).name||g.mode)} · ${esc(g.set||'')} · ${g.acc}% · ${medal(g.rank)}</title><rect x="${x}" y="${y}" width="${bw}" height="${hh}" rx="5" fill="${col(g.rank)}" stroke="#1b1340" stroke-width="2"/>${showN?`<text class="bar-lab" x="${x+bw/2}" y="${y-5}" text-anchor="middle" font-size="10" font-weight="700" fill="#1b1340">${g.acc}</text>`:''}</g>`}).join('');
  const grid=[0,50,100].map(v=>{const y=H-pad-(H-pad*1.6)*v/100;return `<line x1="${padL-6}" x2="${W-pad+6}" y1="${y}" y2="${y}" stroke="#e6dfcf" stroke-dasharray="4 4"/><text x="${padL-10}" y="${y+4}" text-anchor="end" font-size="10" fill="#6b6590">${v}%</text>`}).join('');
  return `<svg class="chart" id="accChart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Accuracy for your last ${d.length} games, newest on the right. Average ${Math.round(d.reduce((a,g)=>a+g.acc,0)/d.length)} percent.">${grid}${bars}</svg>
  <p class="chart-key"><span><i style="background:#ffcf3f"></i>1st</span><span><i style="background:#b9b4d6"></i>2nd</span><span><i style="background:#e5a17a"></i>3rd</span><span><i style="background:#8f84ff"></i>Other</span></p>`}
function formGuide(h){
  const d=h.slice(-10);if(!d.length)return'';
  const lab=r=>r===1?'1st':r===2?'2nd':r===3?'3rd':r+'th';
  return `<div class="form-guide" id="formGuide" role="img" aria-label="Your last ${d.length} places, newest on the right."><span class="form-lab">Form</span>${d.map(g=>`<span class="form-pip r${g.rank}" title="${esc((MODES[g.mode]||{}).name||'')} · ${lab(g.rank)} · ${g.acc}%">${g.rank===1?'W':g.rank}</span>`).join('')}</div>`}
function rankChart(h){
  const d=h.slice(-20);if(d.length<2)return'';
  const W=640,H=180,pad=24,padL=44,padR=16;
  const innerW=W-padL-padR,innerH=H-pad*1.7,step=d.length>1?innerW/(d.length-1):0;
  const yOf=r=>pad+((Math.min(5,Math.max(1,r))-1)/4)*innerH;
  const pts=d.map((g,i)=>[padL+i*step,yOf(g.rank)]);
  const col=r=>r===1?'#ffcf3f':r===2?'#b9b4d6':r===3?'#e5a17a':'#8f84ff';
  const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area='M'+pts[0][0].toFixed(1)+' '+(H-pad)+' '+pts.map(p=>'L'+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H-pad)+' Z';
  const dots=pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="${col(d[i].rank)}" stroke="#1b1340" stroke-width="2"><title>${esc((MODES[d[i].mode]||{}).name||'')} · place ${d[i].rank}</title></circle>`).join('');
  const grid=[1,2,3,4,5].map(r=>{const y=yOf(r);return `<line x1="${padL-6}" x2="${W-padR}" y1="${y}" y2="${y}" stroke="#e6dfcf" stroke-dasharray="4 4"/><text x="${padL-10}" y="${y+4}" text-anchor="end" font-size="10" fill="#6b6590">${r===1?'1st':r}</text>`}).join('');
  const avg=(d.reduce((a,g)=>a+g.rank,0)/d.length).toFixed(1);
  return `<svg class="rank-chart" id="rankChart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Place over your last ${d.length} games, newest on the right. Average place ${avg}.">${grid}<path d="${area}" fill="rgba(91,77,255,.10)"></path><path d="${line}" fill="none" stroke="#5b4cf0" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></path>${dots}</svg>
  <p class="chart-key"><span>Average place ${avg} over the last ${d.length} games (1st is at the top).</span></p>`}
function modeChart(h){
  const rows=Object.keys(MODES).map(m=>{const g=h.filter(x=>x.mode===m&&!x.tourney);return{m,n:g.length,w:g.filter(x=>x.rank===1).length,acc:g.length?Math.round(g.reduce((a,x)=>a+x.acc,0)/g.length):0}}).filter(r=>r.n);
  if(!rows.length)return'';
  const mx=Math.max(1,...rows.map(r=>r.n));
  return `<div class="mode-chart" id="modeChart">${rows.map(r=>{
    const pct=Math.max(4,Math.round(r.n/mx*100));
    return `<div class="mode-bar"><span class="mb-n">${MODES[r.m].emoji} ${esc(MODES[r.m].name)}</span><span class="mb-track"><i style="width:${pct}%"></i></span><span class="mb-v">${r.n} game${r.n===1?'':'s'} · ${r.w} win${r.w===1?'':'s'} · ${r.acc}%</span></div>`;
  }).join('')}</div>`}
function weekGlance(h){
  const now=Date.now(),w=7*864e5;
  const cur=h.filter(g=>g.t>=now-w),prev=h.filter(g=>g.t>=now-2*w&&g.t<now-w);
  if(!cur.length&&!prev.length)return'';
  const acc=a=>a.length?Math.round(a.reduce((s,g)=>s+g.acc,0)/a.length):null;
  const wins=a=>a.filter(g=>g.rank===1).length;
  const cell=(lab,a)=>`<div class="stat"><b>${a.length?a.length:'–'}</b><span>${lab} games</span></div><div class="stat"><b>${a.length?wins(a):'–'}</b><span>${lab} wins</span></div><div class="stat"><b>${acc(a)==null?'–':acc(a)+'%'}</b><span>${lab} accuracy</span></div>`;
  return `<div class="week-glance" id="weekGlance"><div class="stats">${cell('This week',cur)}${cell('Last week',prev)}</div></div>`}
function render(){
  const h=S.history||[];const ach=S.ach||{};
  const wins=h.filter(g=>g.rank===1).length,podiums=h.filter(g=>g.rank<=3).length;
  const tot=h.reduce((a,g)=>a+g.total,0),cor=h.reduce((a,g)=>a+g.correct,0);
  const bestStreak=h.reduce((a,g)=>Math.max(a,g.best||0),0);
  const unlocked=ACHIEVEMENTS.filter(a=>ach[a.id]).length;
  const bests=Object.keys(MODES).map(m=>{const g=h.filter(x=>x.mode===m&&!x.tourney);const top=g.reduce((a,x)=>x.score>a?x.score:a,0);return{m,n:g.length,w:g.filter(x=>x.rank===1).length,top,acc:g.length?Math.round(g.reduce((a,x)=>a+x.acc,0)/g.length):0}});
  const dBars=h=>{const t=[0,0,0,0].map(()=>[0,0]);h.forEach(g=>(g.byD||[]).forEach((p,i)=>{t[i][0]+=p[0];t[i][1]+=p[1]}));if(!t.slice(1).some(x=>x[1]))return'';
    return `<div class="panel" id="diffPanel" style="margin-top:24px"><h3>Accuracy by question level</h3>${[1,2,3].map(i=>{const a=t[i][1]?Math.round(t[i][0]/t[i][1]*100):null;return `<div class="dbar"><span class="dl">${dpips(i)} ${DIFF_NAMES[i]}</span><span class="dtrack"><i style="width:${a||0}%"></i></span><b>${a==null?'–':a+'%'}</b><small>${t[i][1]} answered</small></div>`}).join('')}<p class="muted" style="font-size:14px;margin:8px 0 0">Only questions with a level count here. Add levels in the editor, or play the levelled sets (Times Tables Sprint, Spelling Bee and friends).</p></div>`};
  const mastRows=S.sets.map(st=>({st,m:masteryOf(st)})).filter(x=>x.m.answered>0).sort((a,b)=>b.m.stars-a.m.stars||b.m.answered-a.m.answered);
  const mastPanel=mastRows.length?`<div class="panel" id="mastPanel" style="margin-top:24px"><h3>Mastery stars</h3><p class="muted" style="font-size:14px;margin:0 0 8px">A star for every level (Easy, Medium, Hard) where you answer 75% or more over at least 4 recent answers. Sets without levels earn stars from overall accuracy.</p><div class="tbl-wrap"><table class="tbl" id="mastTbl"><thead><tr><th>Set</th><th>Stars</th><th>Where you are</th></tr></thead><tbody>${mastRows.slice(0,12).map(x=>`<tr><td>${esc(x.st.title)}</td><td>${starsHTML(x.st)}</td><td style="white-space:normal">${esc(x.m.tip)}</td></tr>`).join('')}</tbody></table></div></div>`:'';
  view.innerHTML=`<div class="page-head"><h1>Your <span class="hl">stats</span></h1><p>Every game you've played, kept in this browser only. No leaderboards, no accounts, no shame.</p></div><div class="page-body">
  ${h.length?`<div class="stats big">
    <div class="stat"><b>${h.length}</b><span>Games played</span></div><div class="stat"><b>${wins}</b><span>Wins (${Math.round(wins/h.length*100)}%)</span></div>
    <div class="stat"><b>${tot?Math.round(cor/tot*100):0}%</b><span>Overall accuracy</span></div><div class="stat"><b>${bestStreak}</b><span>Best streak</span></div></div>
  <div class="panel" style="margin-top:24px" id="accPanel"><h3>Accuracy, last ${Math.min(20,h.length)} games</h3>${chart(h)}${formGuide(h)}</div>
  ${h.length>=2?`<div class="panel" style="margin-top:24px" id="rankPanel"><h3>Place over time</h3>${rankChart(h)}</div>`:''}
  <div class="panel" style="margin-top:24px" id="modePanel"><h3>By game mode</h3>${modeChart(h)}</div>
  ${weekGlance(h)?`<div class="panel" style="margin-top:24px" id="weekPanel"><h3>This week and last week</h3>${weekGlance(h)}</div>`:''}
  ${dBars(h)}
  ${mastPanel}
  <div class="panel" style="margin-top:24px"><h3>Personal bests</h3><div class="tbl-wrap"><table class="tbl" id="bestTbl"><thead><tr><th>Mode</th><th>Games</th><th>Wins</th><th>Best score</th><th>Avg accuracy</th></tr></thead><tbody>
   ${bests.map(b=>`<tr><td><span aria-hidden="true">${MODES[b.m].emoji}</span> ${esc(modeName(b.m))}</td><td>${b.n}</td><td>${b.w}</td><td>${b.n?b.top+' '+MODES[b.m].unit:'–'}</td><td>${b.n?b.acc+'%':'–'}</td></tr>`).join('')}</tbody></table></div></div>`
  :emptyHTML({title:'No games yet. The chart is bored.',body:'Play one game and this page fills up with numbers. A tournament is a nice first one: every mode, one after another.',cta:'<a class="btn btn-primary" href="play.html">Start a game</a> <a class="btn btn-secondary" href="play.html?tourney=1">All-modes tournament</a>'})}
  <div class="panel" style="margin-top:24px"><h3>Achievements <span class="muted" style="font-weight:600;font-size:16px">${unlocked} / ${ACHIEVEMENTS.length}</span></h3>
   <div class="ach-grid" id="achGrid">${ACHIEVEMENTS.map(a=>`<div class="ach ${ach[a.id]?'on':'off'}"><span class="ach-e" aria-hidden="true">${ach[a.id]?a.e:'🔒'}</span><div><b>${esc(a.n)}</b><span>${esc(a.d)}</span>${ach[a.id]?`<small>Unlocked ${new Date(ach[a.id]).toLocaleDateString()}</small>`:''}</div></div>`).join('')}</div></div>
  ${h.length?`<div class="panel" style="margin-top:24px"><h3>Recent games</h3><div class="tbl-wrap"><table class="tbl" id="recentTbl"><thead><tr><th>When</th><th>Mode</th><th>Set</th><th>Place</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>
   ${h.slice(-10).reverse().map(g=>`<tr><td>${new Date(g.t).toLocaleDateString(undefined,{day:'numeric',month:'short'})} ${new Date(g.t).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</td><td>${esc(modeLabel(g))}</td><td>${esc(g.set)}</td><td>${medal(g.rank)}</td><td>${g.score}</td><td>${g.acc}%</td></tr>`).join('')}</tbody></table></div>
   <div class="btn-row" style="margin-top:20px"><button class="btn btn-danger btn-sm" data-act="reset">Reset stats</button></div></div>`:''}
  </div>`;
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=reset]');if(!t)return;
  confirmBox('Reset all stats?','Your history and achievements will be cleared. Your question sets stay put.','Reset stats',()=>{S.history=[];S.ach={};save();render();toast('Stats cleared. Fresh start!')})});
render();
