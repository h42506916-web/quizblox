/* QuizBlox – question types: multiple choice (default), true/false, type-the-answer; optional emoji picture */
const TF_ANS=['True','False'];
const NUMW={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20};
function normAns(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9\s]/g,' ').replace(/\b(the|a|an)\b/g,' ').replace(/\s+/g,' ').trim()}
const canonNum=s=>normAns(s).split(' ').map(w=>Object.prototype.hasOwnProperty.call(NUMW,w)?String(NUMW[w]):w).join(' ');
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
/* 0 = wrong, 1 = right, 2 = right but with a forgiven typo */
function matchTyped(typed,accepts){
  const t=canonNum(typed);if(!t)return 0;let best=0;
  for(const ac of accepts){const a=canonNum(ac);if(!a)continue;
    if(t===a||t.replace(/ /g,'')===a.replace(/ /g,''))return 1;
    const tol=/\d/.test(a)?0:a.length<=3?0:a.length<=7?1:2;
    if(tol&&Math.abs(a.length-t.length)<=tol&&lev(a,t)<=tol)best=2}
  return best}
const qType=q=>q&&(q.type==='tf'||q.type==='type')?q.type:'mc';
/* build a playable question from a raw one */
function buildQ(raw,shuf=true){
  const type=qType(raw);
  const answers=type==='type'?[]:type==='tf'?TF_ANS.map((t,i)=>({t,correct:i===raw.c})):(shuf?shuffle:(x=>x))(raw.a.map((t,i)=>({t,correct:i===raw.c})));
  return{raw,type,pic:raw.pic||'',text:raw.q,answers,accept:type==='type'?raw.a.slice():null}}
const rightText=q=>q.type==='type'?q.accept[0]:(q.answers.find(x=>x.correct)||{}).t;
/* sanitise one question (used by import, share links) */
function cleanQ(q){
  if(!q||typeof q.q!=='string'||!Array.isArray(q.a))return null;
  const text=q.q.trim().slice(0,300);if(!text)return null;const type=qType(q);
  const a=q.a.map(x=>String(x==null?'':x).trim().slice(0,80));let o;
  if(type==='tf'){if(q.c!==0&&q.c!==1)return null;o={q:text,a:TF_ANS.slice(),c:q.c,type:'tf'}}
  else if(type==='type'){const acc=a.filter(Boolean).slice(0,4);if(!acc.length)return null;o={q:text,a:acc,c:0,type:'type'}}
  else{const idx=a.map((x,k)=>x?k:-1).filter(k=>k>=0).slice(0,4);const c=Number.isInteger(q.c)?idx.indexOf(q.c):-1;if(idx.length<2||c<0)return null;o={q:text,a:idx.map(k=>a[k]),c}}
  const pic=typeof q.pic==='string'?q.pic.trim().slice(0,24):'';if(pic)o.pic=pic;
  if(Number.isFinite(q.t))o.t=Math.max(0,Math.min(120,Math.round(q.t)));
  if(q.d===1||q.d===2||q.d===3)o.d=q.d;
  return o}
