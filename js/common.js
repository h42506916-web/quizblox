/* QuizBlox – shared helpers, storage, sound, UI utilities */
'use strict';
const $=(s,e=document)=>e.querySelector(s);
const $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const DIFF_NAMES=['','Easy','Medium','Hard'];
const dpips=d=>d>=1&&d<=3?`<span class="dpips d${d}" role="img" aria-label="Difficulty: ${DIFF_NAMES[d].toLowerCase()}" title="${DIFF_NAMES[d]}">${'●'.repeat(d)}${'○'.repeat(3-d)}</span>`:'';
const uid=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const avatarHTML=(p,px=36)=>`<span class="avatar${p.me?' me':''}" style="--s:${px}px;--bg:${p.color||'#eeecff'}" aria-hidden="true">${p.emoji||'🙂'}</span>`;
const LETTERS=['A','B','C','D'];

/* ---------- app root (file://, site root, or /quizblox/ subpath) ---------- */
const LIVE_BASE='https://h42506916-web.github.io/quizblox/';
function appBase(){
  if(typeof location==='undefined')return '';
  if(location.protocol==='file:')return location.href.replace(/[#?].*$/,'').replace(/[^/]*$/,'');
  const p=location.pathname||'/';
  const m=p.match(/^(.*\/quizblox)(?=\/|$)/);
  let path;if(m)path=m[1]+'/';
  else if(/\/$/.test(p))path=p;
  else if(/\.[a-zA-Z0-9]+$/.test(p))path=p.replace(/[^/]*$/,'');
  else path=p+'/';
  return location.origin+path;
}
function appPath(file){return appBase()+String(file||'').replace(/^\//,'')}
if(typeof location!=='undefined'&&location.protocol!=='file:'&&/\/quizblox$/.test(location.pathname)){
  location.replace(location.pathname+'/'+location.search+location.hash);
}

/* ---------- built-in sample sets ---------- */
const DEFAULT_TIME=20;
const MODES={
 gold:{name:'Gold Quest',emoji:'💰',desc:'Answer a question, then open one of three chests. Win gold, double up, or steal from a bot – but some chests cost you.',goals:[500,1000,1500,0],defGoal:1000,unit:'gold'},
 race:{name:'Quiz Race',emoji:'🏁',desc:'Earn points for every correct answer. Faster answers and longer streaks score more. First to the goal wins.',goals:[1500,2500,4000,0],defGoal:2500,unit:'points'},
 heist:{name:'Vault Heist',emoji:'🔐',desc:'Every right answer earns a shot at the vault. Stop the sliding marker in the green zone to crack it – nail the dead centre and you also swipe cash from a rival.',goals:[600,1000,1500,0],defGoal:1000,unit:'cash'},
 cafe:{name:'Café Rush',emoji:'☕',desc:'Every right answer brings a hungry customer. Tap the items in the order they ask for before their patience runs out. Quick, tidy service earns the biggest tips.',goals:[300,500,800,0],defGoal:500,unit:'coins'},
 fish:{name:'Lucky Catch',emoji:'🎣',desc:'A correct answer hooks something big. Mash the reel button before it escapes! Heavier fish are harder to land, and streaks attract the big ones.',goals:[60,100,150,0],defGoal:100,unit:'kg'},
 brawl:{name:'Monster Brawl',emoji:'👹',desc:'Every right answer powers an attack on a giant boss. Pick a sure jab, a risky smash or a power-up. Everyone chips away at the same boss, and whoever deals the most damage wins.',goals:[1000,2000,3500,0],defGoal:2000,unit:'damage'},
 rocket:{name:'Rocket Race',emoji:'🚀',desc:'Every right answer fuels your rocket. Play a card: Boost for a big jump, Shield to block sabotage, or Sabotage to knock back the leader. First rocket to space wins!',goals:[60,100,150,0],defGoal:100,unit:'km'}
};
const BOTS=[
 ['Captain Quill','🦊','#ffd9c2','Steady veteran',{accAdd:.04,spd:1}],
 ['Prof. Pickle','🥒','#d4f1c5','Know-it-all: rarely wrong, takes his time',{accAdd:.12,spd:.8}],
 ['Zippy','⚡','#fff0a8','Speedster: lightning fast, a bit sloppy',{accAdd:-.1,spd:1.3}],
 ['Nova','🪐','#e0dbff','Closer: heats up in the final stretch',{accAdd:0,spd:1,late:1.4}],
 ['Mochi','🐱','#ffd6e5','Napper: slow start, wakes up halfway',{accAdd:0,spd:.95,early:.55,late:1.3}],
 ['Turbo','🐢','#cdeee6','Slow and steady: slow, but very accurate',{accAdd:.2,spd:.7}],
 ['Bubbles','🐙','#d6ecff','Streaky: gets better the longer she rolls',{accAdd:-.05,spd:1,streaky:1}],
 ['Sir Squiggle','🦑','#ffe0b8','Show-off: average, but never stops talking',{accAdd:0,spd:1.05,chat:2}]
].map(([name,emoji,color,blurb,p])=>({name,emoji,color,blurb,p}));
const MY_EMOJIS=['😎','🤓','🦄','🐸','🚀','🍕','🐼','🔥'];
const MY_COLORS={'😎':'#ffe08a','🤓':'#d6ecff','🦄':'#ffd6f0','🐸':'#d4f1c5','🚀':'#e0dbff','🍕':'#ffd9c2','🐼':'#ececf2','🔥':'#ffd0c2'};
const pickQuip=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- storage (shared across pages) ---------- */
const KEY='quizblox.fun.v1';
const DEFAULT_SETTINGS=()=>({tts:false,volume:80,sfxVol:80,musicVol:80,sfx:true,music:false,reduceMotion:!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),contrast:false,bigText:false,taunts:true,haptics:true,noTimer:false,dyslexia:false});
function freshState(){return{v:2,sets:clone(ALL_SAMPLES),seen:ALL_SAMPLES.map(s=>s.id),name:'You',emoji:'😎',settings:DEFAULT_SETTINGS(),
  history:[],ach:{},weak:[],best:{},favs:[],mast:{},classes:[],tour:false,cfg:{setId:'sample-gk',mode:'gold',time:180,goal:{gold:1000,race:2500,heist:1000,fish:100,cafe:500,brawl:2000,rocket:100},diff:'normal',hard:false},games:0}}
let S=(function(){
  try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.sets)){
    const f=freshState();const o=Object.assign(f,d,{cfg:Object.assign(f.cfg,d.cfg||{},{goal:Object.assign(f.cfg.goal,(d.cfg||{}).goal||{})}),settings:Object.assign(f.settings,d.settings||{})});
    if(typeof d.muted==='boolean'&&!d.settings){o.settings.sfx=!d.muted}
    // add built-in sets introduced in newer versions (but never re-add ones the user deleted)
    const seen=new Set(d.seen||d.sets.map(s=>s.id));
    ALL_SAMPLES.forEach(sm=>{if(!seen.has(sm.id)){o.sets.push(clone(sm));seen.add(sm.id)}});
    o.seen=[...seen];delete o.muted;return o}}catch(e){}
  return freshState()})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- settings (applied on every page) ---------- */
(function migrateLevels(){let ch=false;(S.sets||[]).forEach(s=>{if(!s.builtin||s.qs.some(q=>q.d))return;const src=ALL_SAMPLES.find(x=>x.id===s.id);if(!src)return;s.qs.forEach(q=>{const m=src.qs.find(z=>z.q===q.q);if(m&&m.d){q.d=m.d;ch=true}})});if(ch)try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}})();
(function migrateMastery(){if(S.mastV)return;S.mast=S.mast||{};(S.history||[]).forEach(h=>{const st=S.sets.find(x=>x.title===h.set);if(!st||!Array.isArray(h.byD))return;const m=S.mast[st.id]||(S.mast[st.id]=[[0,0],[0,0],[0,0],[0,0]]);h.byD.forEach((p,i)=>{if(m[i]&&Array.isArray(p)){m[i][0]+=p[0]|0;m[i][1]+=p[1]|0}})});S.mastV=1;S.classes=S.classes||[];try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}})();
function volOf(k,def){const s=S.settings||{};const n=s[k];return Math.max(0,Math.min(100,n==null?(s.volume==null?def:+s.volume):+n))}
function applyVolume(){if(SFX_BUS)SFX_BUS.gain.value=volOf('sfxVol',80)/100;if(MUSIC_BUS)MUSIC_BUS.gain.value=volOf('musicVol',80)/100;if(MASTER)MASTER.gain.value=.9}
function setVolume(v){v=Math.max(0,Math.min(100,+v||0));S.settings.volume=v;S.settings.sfxVol=v;save();applyVolume()}
function setSfxVol(v){setVolume(v)}
function setMusicVol(v){S.settings.musicVol=Math.max(0,Math.min(100,+v||0));save();applyVolume()}
function applySettings(){const c=document.documentElement.classList;
  c.toggle('reduce-motion',!!S.settings.reduceMotion);c.toggle('high-contrast',!!S.settings.contrast);c.toggle('big-text',!!S.settings.bigText);c.toggle('dyslexic',!!S.settings.dyslexia);
}
applySettings();

/* ---------- audio engine ---------- */
let AC=null,MASTER=null,SFX_BUS=null,MUSIC_BUS=null;
function audio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=.9;MASTER.connect(AC.destination);SFX_BUS=AC.createGain();SFX_BUS.connect(MASTER);MUSIC_BUS=AC.createGain();MUSIC_BUS.connect(MASTER);applyVolume()}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC}
function tone(f,d,type='sine',v=.12,delay=0,slideTo=0,dest){
  if(!S.settings.sfx&&!dest)return;const a=audio();if(!a)return;
  try{const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||SFX_BUS||MASTER);o.start(t);o.stop(t+d+.05)}catch(e){}}
function noise(d,v=.08,freq=2000,delay=0,q=1){
  if(!S.settings.sfx)return;const a=audio();if(!a)return;
  try{const n=Math.floor(a.sampleRate*d),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);
  const src=a.createBufferSource();src.buffer=buf;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=a.createGain();g.gain.value=v;
  src.connect(f);f.connect(g);g.connect(SFX_BUS||MASTER);src.start(a.currentTime+delay)}catch(e){}}
const note=(n)=>440*Math.pow(2,(n-69)/12);
const SFX={
 click(){tone(700,.04,'sine',.05)},
 beep(){tone(440,.14,'sine',.14);tone(880,.14,'triangle',.05)},
 go(){tone(660,.1,'triangle',.14);tone(990,.3,'triangle',.16,.08);tone(1320,.35,'sine',.08,.08)},
 correct(){[72,76,79,84].forEach((n,i)=>{tone(note(n),.16,'triangle',.13,i*.07);tone(note(n)*2,.12,'sine',.04,i*.07)})},
 streak(k=3){const base=72+Math.min(k,10);[0,4,7,12].forEach((o,i)=>{tone(note(base+o),.18,'square',.05,i*.05);tone(note(base+o),.2,'triangle',.1,i*.05)})},
 wrong(){tone(220,.28,'triangle',.16,0,120);tone(165,.35,'sine',.12,.12,80);noise(.12,.04,300)},
 shake(){noise(.4,.05,500,0,3);tone(120,.3,'sine',.06,0,90)},
 chest(){noise(.15,.05,3000);tone(520,.08,'triangle',.07);tone(780,.1,'triangle',.07,.07)},
 creak(){tone(160,.35,'sawtooth',.04,0,240);noise(.3,.03,900,0,6)},
 coin(){tone(note(88),.08,'square',.05);tone(note(95),.28,'triangle',.09,.06);tone(note(100),.2,'sine',.05,.11)},
 jackpot(){[72,76,79,84,88,91,96].forEach((n,i)=>{tone(note(n),.22,'triangle',.12,i*.06);tone(note(n)*2,.2,'sine',.04,i*.06)});noise(.5,.03,6000,.3)},
 steal(){tone(520,.1,'sawtooth',.06,0,260);tone(390,.14,'sawtooth',.06,.1,200)},
 lose(){tone(300,.3,'triangle',.14,0,90);noise(.2,.05,400,.05)},
 tick(){tone(1000,.025,'square',.025)},
 whoosh(){noise(.25,.04,1200,0,2)},
 drum(){tone(90,.18,'sine',.2,0,50);noise(.08,.05,200)},
 win(){[72,72,76,79,84,79,84].forEach((n,i)=>{tone(note(n),.28,'triangle',.14,i*.11);tone(note(n)-12,.28,'sine',.06,i*.11)})},
 ding(){tone(note(96),.35,'sine',.1);tone(note(100),.4,'sine',.05,.02);tone(note(108),.2,'triangle',.03)},
 oops(){tone(180,.18,'square',.05,0,110)},
 lock(){tone(1800,.03,'square',.04);tone(1200,.05,'square',.03,.03)},
 unlock(){tone(110,.12,'sine',.2,0,60);noise(.08,.06,500);[84,88,91].forEach((n,i)=>tone(note(n),.25,'triangle',.1,.12+i*.07))},
 perfect(){[84,88,91,96,100].forEach((n,i)=>{tone(note(n),.2,'triangle',.11,i*.06);tone(note(n)*2,.2,'sine',.04,i*.06)});noise(.4,.03,7000,.25)},
 fever(){[72,76,79,84,88,91].forEach((n,i)=>{tone(note(n),.2,'sawtooth',.055,i*.05);tone(note(n)*2,.18,'triangle',.07,i*.05)});noise(.3,.04,2200,.18)},
 lap(){tone(880,.07,'square',.04);tone(1320,.1,'square',.04,.07);tone(1760,.14,'square',.03,.14);tone(90,.18,'sine',.16,0,50);noise(.08,.05,200)},
 alarm(){for(let i=0;i<4;i++){tone(i%2?600:900,.12,'square',.07,i*.14)}},
 splash(){noise(.3,.07,1500,0,1.5);tone(300,.18,'sine',.08,0,120)},
 reel(){tone(900+Math.random()*300,.03,'square',.03);noise(.03,.03,4000)},
 bite(){tone(400,.08,'triangle',.1);tone(600,.1,'triangle',.1,.09);noise(.15,.04,1000,.1)},
 catch(){[79,84,88,91].forEach((n,i)=>tone(note(n),.2,'triangle',.11,i*.07));noise(.25,.05,2500,.05)},
 escape(){tone(500,.4,'sine',.1,0,150);noise(.25,.05,800)},
 lose_game(){[67,64,60].forEach((n,i)=>tone(note(n),.3,'triangle',.12,i*.15))}
};
const HAP={correct:[18],streak:[12,40,12,40,24],wrong:[55,45,55],chest:[22],coin:[10],jackpot:[30,40,30,40,70],steal:[60],lose:[70],drum:[14],win:[30,50,30,50,130],ding:[16],oops:[45],lock:[10],unlock:[24],perfect:[18,25,18,25,45],alarm:[40,40,40,40,40],splash:[16],bite:[30,30,30],catch:[22,30,50],escape:[60],lose_game:[90],shake:[18,30,18],creak:[20],fever:[10,30,10,30,50],lap:[16,40,16]};
function buzz(p){try{if(S.settings.haptics!==false&&navigator.vibrate&&p)navigator.vibrate(p)}catch(e){}}
const sfx=(n,...a)=>{try{SFX[n](...a)}catch(e){}if(HAP[n])buzz(HAP[n])};

/* ---------- optional music loop (procedural, original) ---------- */
const Music=(function(){
  let timer=null,step=0,next=0,gain=null,wanted=false,bpm=108;
  const prog=[[0,4,7],[9,12,16],[5,9,12],[7,11,14]]; // C Am F G (relative semitones)
  const roots=[48,45,41,43];
  function sched(){const a=audio();if(!a||!gain)return;
    const spb=60/bpm/2; // 8th notes, 108bpm normally, faster in final lap
    while(next<a.currentTime+.4){
      const bar=Math.floor(step/8)%4,pos=step%8,ch=prog[bar];
      const nn=60+ch[[0,1,2,1,0,2,1,2][pos]]+(pos===7?12:0);
      const t=Math.max(next,a.currentTime);
      play(note(nn),.18,'triangle',.5,t);
      if(pos%4===0)play(note(roots[bar]-12),.4,'sine',.9,t);
      if(pos%2===1)play(note(nn+12),.08,'sine',.15,t);
      next+=spb;step++}}
  function play(f,d,type,v,t){const a=AC;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v*.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(gain);o.start(t);o.stop(t+d+.05)}
  return{get wanted(){return wanted},set wanted(v){wanted=v},
    start(){if(timer||!S.settings.music)return;const a=audio();if(!a)return;gain=a.createGain();gain.gain.value=.35;gain.connect(MUSIC_BUS||MASTER);step=0;next=a.currentTime+.1;if(!bpm)bpm=108;timer=setInterval(sched,120);sched()},
    hurry(on){bpm=on?136:108},
    stop(){bpm=108;if(timer){clearInterval(timer);timer=null}if(gain){try{gain.disconnect()}catch(e){}gain=null}}}
})();

/* ---------- settings dialog ---------- */
function openSettings(){
  const sfxV=volOf('sfxVol',80),musV=volOf('musicVol',80);
  const vol=(id,label,hint,val,aria)=>`<label class="set-line" for="${id}"><span><b>${label}</b><small>${hint}</small></span><span class="vol-ctl"><input type="range" id="${id}" min="0" max="100" step="5" value="${val}" aria-label="${aria}" style="width:130px;height:auto"><output id="${id}Val" for="${id}">${val}%</output></span></label>`;
  const row=(k,label,hint)=>`<label class="set-line"><span><b>${label}</b><small>${hint}</small></span><input type="checkbox" data-s="${k}" ${S.settings[k]?'checked':''}></label>`;
  modal(`<h2>Settings</h2><div class="settings-list">${row('sfx','Sound effects','Dings, whooshes and the occasional goblin.')}${vol('volRange','Effects volume','How loud the dings, chests and goblins are.',sfxV,'Effects volume')}${row('music','Background music','A gentle looping tune during games.')}${vol('musicVolRange','Music volume','How loud the background tune is.',musV,'Music volume')}${row('taunts','Rival taunts','Bots trash-talk in a little speech bubble. All in good fun.')}${navigator.vibrate?row('haptics','Vibration','Buzz on phones when you answer, catch, serve or win.'):''}${row('reduceMotion','Reduce motion','Calmer animations, no confetti.')}${row('dyslexia','Dyslexia-friendly text','Wider letter and line spacing and a clearer font (uses OpenDyslexic, Lexend or Atkinson if installed).')}${row('noTimer','No timers','Questions and mini-games wait for you: no question timer, patience bar or fish clock. The overall game clock still runs; pause with P.')}${row('contrast','High contrast','Stronger borders and darker text.')}${row('bigText','Larger text','Bigger questions and answers.')}${TTS_OK?row('tts','Read questions aloud','Speaks each question and its answers. The question timer keeps running.'):''}</div>
  <div class="btn-row" style="justify-content:flex-start;margin-top:4px"><button class="btn btn-secondary btn-sm" id="tourBtn">Replay the intro tour</button><button class="btn btn-secondary btn-sm" id="backupBtn">Backup &amp; restore</button></div>
  <div class="btn-row"><button class="btn btn-primary" data-m="close" id="settingsDone">Done</button></div>`,(o)=>{
    o.addEventListener('input',e=>{const id=e.target.id,v=+e.target.value;if(id==='volRange'){setSfxVol(v);const o1=$('#volRangeVal',o);if(o1)o1.textContent=v+'%';sfx('click')}if(id==='musicVolRange'){setMusicVol(v);const o2=$('#musicVolRangeVal',o);if(o2)o2.textContent=v+'%';tone(note(72),.18,'triangle',.1,0,0,MUSIC_BUS)}});
    o.addEventListener('change',e=>{const k=e.target.dataset.s;if(!k)return;S.settings[k]=e.target.checked;save();applySettings();if(k==='sfx'&&e.target.checked)sfx('click');if(k==='tts'&&!e.target.checked)stopSpeak();if(k==='music'){const live=typeof G!=='undefined'&&G&&G.phase!=='over';if(e.target.checked&&live)Music.start();else Music.stop()}
      const mb=$('#muteBtn');if(mb)mb.textContent='Sound: '+(S.settings.sfx?'on':'off');const mu=$('#musicBtn');if(mu)mu.textContent='Music: '+(S.settings.music?'on':'off')});
    const tb=$('#tourBtn',o);if(tb)tb.onclick=()=>{o.remove();startTour()};
    const bb=$('#backupBtn',o);if(bb)bb.onclick=()=>{o.remove();openBackup()};
    const f=$('input',o);if(f)f.focus()})}

/* ---------- stats history + achievements (plain milestone badges) ---------- */
const ACHIEVEMENTS=[
 {id:'first',e:'🎮',n:'Hello, world',d:'Finish your first game.',t:(c,h)=>h.length>=1},
 {id:'win',e:'🏆',n:'Top of the pile',d:'Win a game (1st place).',t:(c)=>c.rank===1},
 {id:'ten',e:'🔟',n:'Regular',d:'Play 10 games.',t:(c,h)=>h.length>=10},
 {id:'twentyfive',e:'🛋️',n:'Basically lives here',d:'Play 25 games.',t:(c,h)=>h.length>=25},
 {id:'streak5',e:'🔥',n:'On fire',d:'Answer 5 in a row.',t:(c)=>c.best>=5},
 {id:'streak10',e:'☄️',n:'Unstoppable',d:'Answer 10 in a row.',t:(c)=>c.best>=10},
 {id:'ace',e:'🎯',n:'Flawless',d:'100% accuracy over 8 or more questions.',t:(c)=>c.total>=8&&c.correct===c.total},
 {id:'speedy',e:'⚡',n:'Quick draw',d:'Average under 3 seconds over 8 or more correct answers.',t:(c)=>c.correct>=8&&c.avg>0&&c.avg<3},
 {id:'allmodes',e:'🧭',n:'Explorer',d:'Play every game mode.',t:(c,h)=>Object.keys(MODES).every(m=>h.some(x=>x.mode===m||(x.tourney&&(x.legs||[]).some(l=>l.mode===m))))},
 {id:'cracker',e:'💎',n:'Smooth criminal',d:'Land 3 flawless vault hits in one game.',t:(c)=>c.perfects>=3},
 {id:'bigfish',e:'🦈',n:'Big catch',d:'Land a fish of 18 kg or more.',t:(c)=>c.big},
 {id:'boot',e:'👢',n:'Vintage find',d:'Reel in an old boot. Somebody has to.',t:(c)=>c.boot},
 {id:'barista',e:'☕',n:'Barista',d:'Serve 5 perfect orders in one Café Rush game.',t:(c)=>c.orders>=5},
 {id:'study',e:'📘',n:'Study buddy',d:'Finish a practice session.',t:()=>false},
 {id:'hard',e:'🌶️',n:'Spicy',d:'Win a game on hard mode.',t:(c)=>c.rank===1&&c.hard},
 {id:'challenger',e:'🤜',n:'Challenge accepted',d:'Beat a friend\'s challenge link.',t:(c)=>!!c.chBeat},
 {id:'comeback',e:'🚀',n:'Plot twist',d:'Win after trailing at the half-way mark.',t:(c)=>c.rank===1&&c.trailed},
 {id:'cards',e:'🃏',n:'Card sharp',d:'Finish a study-card run of 8 or more cards.',t:()=>false}
];
function recordGame(c){
  const h=S.history=S.history||[];
  const row={t:Date.now(),daily:!!c.daily,mode:c.mode,set:c.set,sid:c.sid||undefined,rank:c.rank,score:c.score,hard:!!c.hard,byD:c.byD,acc:c.acc,best:c.best,correct:c.correct,total:c.total};if(c.tourney){row.tourney=true;if(Array.isArray(c.legs))row.legs=c.legs}h.push(row);
  if(h.length>200)h.splice(0,h.length-200);
  S.ach=S.ach||{};const fresh=[];
  ACHIEVEMENTS.forEach(a=>{if(!S.ach[a.id]&&a.t(c,h)){S.ach[a.id]=Date.now();fresh.push(a)}});
  save();return fresh}

/* ---------- categories, favourites, search ---------- */
const CATS=['Maths','Science','Humanities','Language','Fun & Culture','General','My sets'];
const CAT_OF={'sample-gk':'General','sample-maths':'Maths','sample-science':'Science','sample-history':'Humanities','sample-geo':'Humanities','sample-english':'Language','sample-aus':'Humanities','sample-animals':'Science','sample-space':'Science','sample-pop':'Fun & Culture','sample-body':'Science','sample-capitals':'Humanities','sample-ancient':'Humanities','sample-earth':'Science','sample-sport':'Fun & Culture','sample-music':'Fun & Culture','sample-tech':'Science','sample-food':'Fun & Culture','sample-fractions':'Maths','sample-grammar':'Language','sample-world':'Humanities','sample-emoji':'Fun & Culture','sample-tf':'General','sample-type':'General','sample-words':'Language','sample-civics':'Humanities','sample-punct':'Language','sample-summer':'General','sample-measure':'Maths','sample-maps':'Humanities'};
const catOf=s=>s.cat||CAT_OF[s.id]||'My sets';
const isFav=id=>(S.favs||[]).includes(id);
function bestKey(id,mode,time,hard,relaxed){return `${id}|${mode}|${time}${hard?'|h':''}${relaxed?'|r':''}`}
function bestOf(id,mode,time,hard,relaxed){const b=(S.best||{})[bestKey(id,mode,time,!!hard,!!relaxed)];return b&&b.score>0?b:null}
function recentSets(n=4){
  const seen=new Set(),out=[];
  for(const g of (S.history||[]).slice().reverse()){
    const s=S.sets.find(x=> (g.sid&&x.id===g.sid)||x.id===g.set||x.title===g.set);
    if(s&&s.qs&&s.qs.length&&!seen.has(s.id)){seen.add(s.id);out.push(s);if(out.length>=n)break}
  }
  return out}

function autoDiff(h){
  const g=(h||S.history||[]).filter(x=>x&&!x.tourney&&x.rank).slice(-5);
  if(g.length<2)return'normal';
  const avg=g.reduce((a,x)=>a+(x.rank||5),0)/g.length;
  return avg<=2.2?'hard':avg>=3.8?'easy':'normal'
}
function emptyHTML(o){
  o=o||{};
  return `<div class="${o.panel===false?'':'panel '}empty${o.small?' small':''}">${o.mascot===false?'':`<div class="mascot-wrap">${mascot(o.mood||'sad')}</div>`}${o.title?`<h3>${o.title}</h3>`:''}<p>${o.body||''}</p>${o.cta||''}</div>`
}
const TOURNEY_MODES=['gold','race','heist','fish','cafe','brawl','rocket'];
const TOURNEY_TIME=30;
const TOURNEY_PTS=[0,5,4,3,2,1];
function tourneyCard(){
  return `<div class="tourney-card" id="tourneyCard"><span class="tourney-e" aria-hidden="true">🏟️</span>
   <div class="tourney-t"><p class="tourney-kicker">New playlist</p><b>All-modes tournament</b><span>Seven short rounds, one after another, against the same four rivals. Placement points decide the winner.</span></div>
   <div class="tourney-act"><a class="btn btn-pop btn-sm" id="tourneyPlay" href="play.html?tourney=1">Play the tournament</a></div></div>`
}

function toggleFav(id){S.favs=S.favs||[];const i=S.favs.indexOf(id);if(i>=0)S.favs.splice(i,1);else S.favs.push(id);save();return i<0}
const FILT={q:'',cat:'all'};
function filterSets(list){
  const q=normAns(FILT.q);
  let out=list.filter(s=>(FILT.cat==='all'||(FILT.cat==='fav'?isFav(s.id):catOf(s)===FILT.cat))&&(!q||normAns(s.title+' '+catOf(s)).includes(q)));
  return out.map((s,i)=>({s,i})).sort((a,b)=>(isFav(b.s.id)-isFav(a.s.id))||a.i-b.i).map(x=>x.s)}
function chipsHTML(list){
  const cnt=c=>list.filter(s=>catOf(s)===c).length;
  const chip=(v,l,n)=>`<button type="button" class="chip ${FILT.cat===v?'on':''}" aria-pressed="${FILT.cat===v}" data-act="fcat" data-v="${esc(v)}">${l} <small>${n}</small></button>`;
  return chip('all','All',list.length)+chip('fav','★ Favourites',list.filter(s=>isFav(s.id)).length)+CATS.filter(c=>cnt(c)).map(c=>chip(c,esc(c),cnt(c))).join('')}

/* ---------- read aloud (Web Speech API, optional) ---------- */
const TTS_OK=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance);
function stopSpeak(){try{if(TTS_OK)speechSynthesis.cancel()}catch(e){}}
function speak(text){if(!TTS_OK)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1;u.lang=document.documentElement.lang||'en';speechSynthesis.speak(u)}catch(e){}}

/* ---------- first-visit walkthrough ---------- */
const TOUR=[
 {e:'👋',t:'Welcome to QuizBlox',p:'Turn any question set into a game against four cheeky bots. No sign-up, nothing leaves your browser. This takes 20 seconds.'},
 {e:'🎮',t:'Pick a set and a mode',p:'There are 30+ ready-made sets and seven modes: chests, a points race, a vault heist, fishing, a busy café, a monster brawl and a rocket race. Every correct answer unlocks that mode\'s mini-game.'},
 {e:'⌨️',t:'Answer fast, play your way',p:'Click or tap, or press 1 to 4. Press P to pause, M to mute. The 🔊 button reads a question aloud if you like.'},
 {e:'📈',t:'Learn from your misses',p:'Missed questions go into a weak-spot bank you can practise with no clocks or bots. Or flip through a set with Study cards before you play. Stats tracks bests and achievements.'}];
function startTour(){
  let i=0;
  const m=modal('<div id="tourBody"></div>',(o,close)=>{
    const draw=()=>{const s=TOUR[i];$('#tourBody',o).innerHTML=`<div class="tour"><div class="tour-e" aria-hidden="true">${s.e}</div><h2>${s.t}</h2><p>${s.p}</p>
      <div class="tour-dots" aria-hidden="true">${TOUR.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
      <div class="btn-row"><button class="btn btn-ghost" id="tourSkip">${i<TOUR.length-1?'Skip':'Close'}</button>${i?'<button class="btn btn-secondary" id="tourBack">Back</button>':''}${i===TOUR.length-1?'<button class="btn btn-secondary" id="tourDemo">Try a 30-second demo</button>':''}<button class="btn btn-primary" id="tourNext">${i<TOUR.length-1?'Next':'Let\'s play'}</button></div></div>`;
      $('#tourSkip',o).onclick=()=>{S.tour=true;save();close()};const b=$('#tourBack',o);if(b)b.onclick=()=>{i--;draw()};
      const td=$('#tourDemo',o);if(td)td.onclick=()=>{S.tour=true;save();close();if(typeof startDemo==='function')startDemo();else location.href='play.html?demo=1'};
      $('#tourNext',o).onclick=()=>{if(i<TOUR.length-1){i++;draw()}else{S.tour=true;save();close()}};$('#tourNext',o).focus()};
    draw()});
  return m}

/* ---------- UI utilities ---------- */
function toast(msg){let w=$('.toasts');if(!w){w=document.createElement('div');w.className='toasts';document.body.appendChild(w)}const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;w.appendChild(t);while(w.children.length>3)w.firstChild.remove();setTimeout(()=>t.remove(),2700)}
function openKeys(){
  if(document.querySelector('.overlay'))return;
  const inGame=!!(window.QB&&QB.G&&QB.G.phase&&QB.G.phase!=='over');
  let pausedFor=false;
  if(inGame&&!QB.G.paused&&typeof QB.pauseGame==='function'){QB.pauseGame();pausedFor=true}
  const row=(k,d)=>`<tr><th>${k}</th><td>${d}</td></tr>`;
  modal(`<h2>Keyboard shortcuts</h2>
   <p class="hint" style="margin-top:-6px">Press <span class="kbd">?</span> any time to open or close this list.</p>
   <div class="keys-list">
    <h3>Any page</h3>
    <table class="keys-tbl"><tbody>
     ${row('<span class="kbd">?</span>','Open or close this list')}
     ${row('<span class="kbd">M</span>','Mute or unmute sound effects')}
     ${row('<span class="kbd">Esc</span>','Close a dialog')}
    </tbody></table>
    <h3>In a game</h3>
    <table class="keys-tbl"><tbody>
     ${row('<span class="kbd">1</span>–<span class="kbd">4</span>','Pick an answer, a chest, a move, a rocket card or a café item')}
     ${row('<span class="kbd">T</span> / <span class="kbd">F</span>','True or False')}
     ${row('<span class="kbd">Space</span>','Stop the vault marker, or mash the reel')}
     ${row('<span class="kbd">Space</span> / <span class="kbd">Enter</span>','Ready on the Pass & Play screen')}
     ${row('<span class="kbd">P</span>','Pause or resume (the question is hidden)')}
    </tbody></table>
    <h3>Study cards</h3>
    <table class="keys-tbl"><tbody>
     ${row('<span class="kbd">Space</span> / <span class="kbd">Enter</span>','Flip the card')}
     ${row('Arrow keys','Move between cards')}
     ${row('<span class="kbd">1</span> / <span class="kbd">2</span>','Still learning / I know this')}
     ${row('<span class="kbd">Esc</span>','Back to setup')}
    </tbody></table>
    <h3>Practice</h3>
    <table class="keys-tbl"><tbody>
     ${row('<span class="kbd">1</span>–<span class="kbd">4</span>','Pick an answer')}
     ${row('<span class="kbd">Enter</span> / <span class="kbd">Space</span>','Next question after you answer')}
    </tbody></table>
   </div>
   <div class="btn-row"><button class="btn btn-primary" data-m="close" id="keysClose">Got it</button></div>`,(o,close)=>{
    const m=o.querySelector('.modal');if(m)m.classList.add('keys-modal');
    o._onClose=()=>{if(pausedFor&&window.QB&&QB.G&&QB.G.paused&&typeof QB.resumeGame==='function')QB.resumeGame();pausedFor=false};
  })}
function trapFocus(root,restore){
  const sel='a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const visible=el=>{if(el.disabled)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
  const nodes=()=>[...root.querySelectorAll(sel)].filter(visible);
  const prev=restore===undefined?document.activeElement:restore;
  const onKey=e=>{
    if(e.key!=='Tab')return;
    const list=nodes();if(!list.length)return;
    const first=list[0],last=list[list.length-1];
    if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first.focus()}
  };
  root.addEventListener('keydown',onKey);
  const list=nodes();if(list[0])setTimeout(()=>{try{list[0].focus()}catch(e){}},0);
  return ()=>{root.removeEventListener('keydown',onKey);if(prev&&prev.focus&&document.body.contains(prev))try{prev.focus()}catch(e){}};
}
function modal(html,onMount){const prev=document.activeElement;const o=document.createElement('div');o.className='overlay';o.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(o);
  const box=o.querySelector('.modal');const h=box&&box.querySelector('h2');if(h){if(!h.id)h.id='modalTitle';box.setAttribute('aria-labelledby',h.id)}
  let untrap=()=>{};
  const close=()=>{if(o._onClose)try{o._onClose()}catch(e){}untrap();o.remove();if(prev&&prev.focus&&document.body.contains(prev))try{prev.focus()}catch(e){}};
  o._close=close;
  o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-m=close]'))close()});
  if(onMount)onMount(o,close);
  untrap=trapFocus(box||o,null);
  return{el:o,close}}
function confirmBox(title,text,okLabel,onOk,danger=true){
  modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btn-row"><button class="btn btn-secondary" data-m="close">Cancel</button><button class="btn ${danger?'btn-solid-danger':'btn-primary'}" id="cfOk">${esc(okLabel)}</button></div>`,(o,close)=>{$('#cfOk',o).onclick=()=>{close();onOk()}})}

/* ---------- site chrome: mobile nav + active link ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  const page=document.body.dataset.page;
  $$('a[data-nav]').forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page')});
  const sb=$('#settingsBtn');if(sb)sb.addEventListener('click',openSettings);
  const ns=$('#navSettings');if(ns)ns.addEventListener('click',openSettings);
  const tools=document.querySelector('.header-tools');
  if(tools&&!$('#keysBtn')){
    const b=document.createElement('button');b.type='button';b.className='icon-btn keys-btn';b.id='keysBtn';
    b.setAttribute('aria-label','Keyboard shortcuts');b.title='Keyboard shortcuts (?)';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h2M17 10h.01M8 14h8"/></svg>';
    if(sb&&tools.contains(sb))tools.insertBefore(b,sb);else tools.prepend(b);
    b.addEventListener('click',openKeys);
  }
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName);
    if(e.key==='Escape'){const ov=document.querySelector('.overlay');if(ov){e.preventDefault();if(ov._close)ov._close();else{if(ov._onClose)try{ov._onClose()}catch(err){}ov._onClose=null;ov.remove()}return}if(typeof closeProjector==='function'&&document.getElementById('projView')){e.preventDefault();closeProjector();return}if(typing)return;return}
    if(typing)return;
    if(e.key==='?'||(e.key==='/'&&e.shiftKey)){e.preventDefault();const ov=document.querySelector('.overlay');if(ov&&ov.querySelector('.keys-list')){if(ov._close)ov._close();else{if(ov._onClose)try{ov._onClose()}catch(err){}ov._onClose=null;ov.remove()}}else if(!ov)openKeys()}
  });
  const t=$('#navToggle'),n=$('#nav'),side=$('#sidebar'),bd=$('#navBackdrop');
  if(t&&n){const isOpen=()=>(side&&side.classList.contains('open'))||n.classList.contains('open');
    const setNav=on=>{n.classList.toggle('open',on);if(side)side.classList.toggle('open',on);if(bd){bd.hidden=!on;bd.classList.toggle('show',on)}t.setAttribute('aria-expanded',on?'true':'false');t.setAttribute('aria-label',on?'Close menu':'Open menu')};
    t.addEventListener('click',()=>setNav(!isOpen()));
    n.addEventListener('click',e=>{if(e.target.closest('a'))setNav(false)});
    if(bd)bd.addEventListener('click',()=>setNav(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){setNav(false);t.focus()}})}
  const y=$('#year');if(y)y.textContent=new Date().getFullYear();
  if(typeof applySeason==='function')applySeason();
  // easter eggs: click the footer logo 5 times, or enter the Konami code
  let seq=[],code='ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a';
  document.addEventListener('keydown',e=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName))return;seq.push(e.key.length===1?e.key.toLowerCase():e.key);seq=seq.slice(-10);if(seq.join(',')===code){party('Konami code accepted. Blox does a little dance. +0 points, +100 style.')}});
  let clicks=0,ct;$$('.brand').forEach(b=>b.addEventListener('click',()=>{clicks++;clearTimeout(ct);ct=setTimeout(()=>clicks=0,1200);if(clicks===5){clicks=0;party('You found Blox\'s ticklish spot. Please stop. (Ha ha ha.)')}}));
  if(window.console&&console.log)console.log('%cQuizBlox','font:800 28px sans-serif;color:#5b4cf0','Psst… peeking under the hood? Try the Konami code.');
});
function party(msg){confetti(70,innerWidth/2,innerHeight/3,1.3);confetti(40,innerWidth*.2,innerHeight/2,.9);confetti(40,innerWidth*.8,innerHeight/2,.9);try{sfx('win')}catch(e){}toast(msg);
  const m=document.createElement('div');m.className='mascot-party';m.innerHTML=mascot('party');document.body.appendChild(m);setTimeout(()=>m.remove(),2600)}

/* ---------- mascot ("Blox") ---------- */
function mascot(mood='happy'){
  const ink='#1b1340';
  const mouth={happy:`<path d="M46 76 Q60 90 74 76" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`,
    party:`<path d="M44 72 Q60 100 76 72 Z" fill="${ink}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M52 84 Q60 91 68 84" fill="#ff6b57"/>`,
    sad:`<path d="M48 84 Q60 72 72 84" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`}[mood]||'';
  const hat=mood==='party'?`<path d="M42 28 L60 -6 L78 28 Z" fill="#ffcf3f" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><circle cx="60" cy="-7" r="6" fill="#ff6b57" stroke="${ink}" stroke-width="3"/>`:'';
  return `<svg class="mascot ${mood}" viewBox="0 -12 120 134" role="img" aria-label="Blox, the QuizBlox mascot"><ellipse cx="60" cy="116" rx="30" ry="5" fill="${ink}" opacity=".13"/>
  <rect x="14" y="24" width="92" height="88" rx="34" fill="#5b4cf0" stroke="${ink}" stroke-width="4"/><path d="M27 48 Q29 36 42 32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>
  <g class="eye"><ellipse cx="44" cy="58" rx="11" ry="13" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="46" cy="60" r="6" fill="${ink}"/><circle cx="48" cy="57" r="2" fill="#fff"/></g>
  <g class="eye"><ellipse cx="76" cy="58" rx="11" ry="13" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="78" cy="60" r="6" fill="${ink}"/><circle cx="80" cy="57" r="2" fill="#fff"/></g>
  <circle cx="30" cy="76" r="6" fill="#ff6b57" opacity=".55"/><circle cx="90" cy="76" r="6" fill="#ff6b57" opacity=".55"/>${mouth}${hat}</svg>`}

/* ---------- confetti (brand + pop colours only) ---------- */
function confetti(n=24,x,y,spread=1){
  if((S&&S.settings&&S.settings.reduceMotion)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  let box=$('.confetti');if(!box){box=document.createElement('div');box.className='confetti';box.setAttribute('aria-hidden','true');document.body.appendChild(box)}
  x=x==null?innerWidth/2:x;y=y==null?innerHeight/2.5:y;
  const cols=['#5b4cf0','#ffcf3f','#8f84ff','#ffe08a','#3f31c4'];
  for(let i=0;i<n;i++){const p=document.createElement('i');if(Math.random()<.35)p.className='dot';
    p.style.background=pick(cols);p.style.left=x+'px';p.style.top=y+'px';
    const ang=-Math.PI/2+(Math.random()-.5)*Math.PI*1.3*spread,dist=120+Math.random()*260*spread;
    p.style.setProperty('--dx',Math.cos(ang)*dist+'px');p.style.setProperty('--dy',Math.sin(ang)*dist+160+'px');p.style.setProperty('--r',rnd(-540,540)+'deg');
    box.appendChild(p);setTimeout(()=>{p.remove();if(box&&!box.childElementCount)box.remove()},1600)}}

/* ---------- shared encode/decode for share + challenge links ---------- */
const b64e=str=>btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=b=>decodeURIComponent(escape(atob(b.replace(/-/g,'+').replace(/_/g,'/'))));
function packSet(s){return{t:s.title,e:s.emoji||'',k:catOf(s),q:s.qs.map(q=>[q.q,q.a,q.c,q.t==null?null:q.t,q.type||'',q.pic||'',q.d||0])}}
function unpackSet(o){return{title:o.t,emoji:o.e||undefined,cat:o.k,qs:(o.q||[]).map(r=>({q:r[0],a:r[1],c:r[2],t:r[3]==null?undefined:r[3],type:r[4]||undefined,pic:r[5]||undefined,d:r[6]||undefined}))}}

/* ---------- backup & restore of all data ---------- */
function saveFile(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const numIn=(v,lo,hi,def)=>{v=Number(v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def};
const strIn=(v,n,def='')=>typeof v==='string'?v.slice(0,n):def;
function sanitizeState(d){
  if(!d||typeof d!=='object'||!Array.isArray(d.sets))return null;
  const o=freshState(),sampleIds=new Set(ALL_SAMPLES.map(s=>s.id));
  o.name=strIn(d.name,14,o.name)||o.name;o.emoji=MY_EMOJIS.includes(d.emoji)?d.emoji:o.emoji;
  const ds=d.settings&&typeof d.settings==='object'?d.settings:{};
  Object.keys(o.settings).forEach(k=>{if(typeof ds[k]===typeof o.settings[k])o.settings[k]=ds[k]});o.settings.volume=numIn(o.settings.volume,0,100,80);o.settings.sfxVol=numIn(o.settings.sfxVol,0,100,o.settings.volume);o.settings.musicVol=numIn(o.settings.musicVol,0,100,o.settings.volume);
  const seenIds=new Set();o.sets=[];
  d.sets.slice(0,300).forEach(r=>{if(!r||typeof r!=='object'||!Array.isArray(r.qs))return;const id=strIn(r.id,40).replace(/[^\w-]/g,'');if(!id||seenIds.has(id))return;
    const qs=r.qs.slice(0,200).map(cleanQ).filter(Boolean);if(!qs.length)return;seenIds.add(id);
    const s={id,title:strIn(r.title,40,'Untitled set').trim()||'Untitled set',qs};if(typeof r.emoji==='string'&&r.emoji.length<=8&&r.emoji)s.emoji=r.emoji;
    if(typeof r.cat==='string'&&CATS.includes(r.cat))s.cat=r.cat;if(r.builtin&&sampleIds.has(id))s.builtin=true;o.sets.push(s)});
  o.seen=[...new Set([...(Array.isArray(d.seen)?d.seen.filter(x=>typeof x==='string').slice(0,500).map(x=>x.slice(0,40)):[]),...o.sets.map(s=>s.id)])];
  o.history=(Array.isArray(d.history)?d.history:[]).slice(-200).filter(h=>h&&typeof h==='object'&&MODES[h.mode]).map(h=>{const o={t:numIn(h.t,0,4e12,0),daily:!!h.daily,mode:h.mode,set:strIn(h.set,40),rank:numIn(h.rank,1,5,5),score:numIn(h.score,0,1e6,0),hard:!!h.hard,acc:numIn(h.acc,0,100,0),best:numIn(h.best,0,1e4,0),correct:numIn(h.correct,0,1e4,0),total:numIn(h.total,0,1e4,0),byD:Array.isArray(h.byD)&&h.byD.length===4?h.byD.map(p=>Array.isArray(p)?[numIn(p[0],0,1e4,0),numIn(p[1],0,1e4,0)]:[0,0]):undefined};const sid=strIn(h.sid,40);if(sid)o.sid=sid;if(h.tourney){o.tourney=true;if(Array.isArray(h.legs))o.legs=h.legs.slice(0,8).map(l=>l&&MODES[l.mode]?{mode:l.mode,rank:numIn(l.rank,1,5,5),score:numIn(l.score,0,1e6,0)}:null).filter(Boolean)}return o});
  o.ach={};if(d.ach&&typeof d.ach==='object'){ACHIEVEMENTS.forEach(a=>{if(Number.isFinite(Number(d.ach[a.id]))&&d.ach[a.id])o.ach[a.id]=Number(d.ach[a.id])});['daily','mixer','roll'].forEach(id=>{if(Number.isFinite(Number(d.ach[id]))&&d.ach[id])o.ach[id]=Number(d.ach[id])})}
  o.weak=(Array.isArray(d.weak)?d.weak:[]).slice(0,60).map(w=>{const q=cleanQ(w);if(q)q.set=strIn(w&&w.set,40);return q}).filter(Boolean);
  o.best={};if(d.best&&typeof d.best==='object')Object.keys(d.best).slice(0,600).forEach(k=>{const b=d.best[k];if(k.length<=120&&b&&typeof b==='object')o.best[k]={score:numIn(b.score,0,1e6,0),rank:numIn(b.rank,1,5,5),t:numIn(b.t,0,4e12,0)}});
  o.favs=(Array.isArray(d.favs)?d.favs:[]).filter(x=>typeof x==='string').slice(0,300).map(x=>x.slice(0,40));o.tour=!!d.tour;o.games=numIn(d.games,0,1e6,o.history.length);
  o.mast={};if(d.mast&&typeof d.mast==='object')Object.keys(d.mast).slice(0,400).forEach(k=>{const m=d.mast[k];if(k.length<=40&&Array.isArray(m)&&m.length===4)o.mast[k]=m.map(p=>Array.isArray(p)?[numIn(p[0],0,1e4,0),numIn(p[1],0,1e4,0)]:[0,0]).map(p=>[Math.min(p[0],p[1]),p[1]])});o.mastV=1;
  o.classes=(Array.isArray(d.classes)?d.classes:[]).slice(0,30).map(cleanClass).filter(Boolean);
  const dc=d.cfg&&typeof d.cfg==='object'?d.cfg:{};
  o.cfg.setId=strIn(dc.setId,40,o.cfg.setId);if(MODES[dc.mode])o.cfg.mode=dc.mode;if([30,60,120,180,300].includes(dc.time))o.cfg.time=dc.time;
  if(['easy','normal','hard','auto'].includes(dc.diff))o.cfg.diff=dc.diff;o.cfg.hard=!!dc.hard;o.cfg.passPlay=!!dc.passPlay;o.cfg.passTeam=!!dc.passTeam;o.p2={name:strIn(d.p2&&d.p2.name,14,'Player 2')||'Player 2',emoji:MY_EMOJIS.includes(d.p2&&d.p2.emoji)?d.p2.emoji:'🐼'};if(dc.goal&&typeof dc.goal==='object')Object.keys(o.cfg.goal).forEach(k=>{o.cfg.goal[k]=numIn(dc.goal[k],0,1e5,o.cfg.goal[k])});
  if(d.daily&&typeof d.daily==='object'){const day=numIn(d.daily.day,1,1e7,0);if(day)o.daily={day,done:!!d.daily.done,rank:numIn(d.daily.rank,1,5,0)}}
  if(d.weekly&&typeof d.weekly==='object'){const week=numIn(d.weekly.week,0,1e7,-1);if(week>=0)o.weekly={week,done:!!d.weekly.done,rank:numIn(d.weekly.rank,1,5,0)}}
  if(d.qotd&&typeof d.qotd==='object'){const day=numIn(d.qotd.day,0,1e7,-1);if(day>=0)o.qotd={day,ok:!!d.qotd.ok,answered:!!(d.qotd.answered||d.qotd.ok||d.qotd.done)}}
  if(d.mix&&typeof d.mix==='object'){const day=numIn(d.mix.day,1,1e7,0);if(day){o.mix={day,done:!!d.mix.done,rank:numIn(d.mix.rank,1,5,0)};
    if(Array.isArray(d.mix.qs))o.mix.qs=d.mix.qs.slice(0,20).map(q=>{const c=cleanQ(q);if(!c)return null;if(typeof q._sid==='string')c._sid=strIn(q._sid,40);if(typeof q._st==='string')c._st=strIn(q._st,40);if(q.d===1||q.d===2||q.d===3)c.d=q.d;return c}).filter(Boolean)}}
  if(!o.sets.some(s=>s.id===o.cfg.setId)&&o.sets[0])o.cfg.setId=o.sets[0].id;
  return o}
function backupSummary(st){const mine=st.sets.filter(s=>!s.builtin).length;return `${st.sets.length} sets (${mine} of your own), ${st.history.length} games, ${Object.keys(st.ach).length} achievements, ${st.favs.length} favourites`+((st.classes||[]).length?`, ${st.classes.length} class${st.classes.length===1?'':'es'}`:'')}
function mergeInto(S0,B){
  const have=new Set(S0.sets.map(s=>s.id));let added=0;B.sets.forEach(s=>{if(!have.has(s.id)){S0.sets.push(s);added++}});
  S0.seen=[...new Set([...(S0.seen||[]),...B.seen])];S0.favs=[...new Set([...(S0.favs||[]),...B.favs])];
  Object.keys(B.ach).forEach(k=>{if(!S0.ach[k]||B.ach[k]<S0.ach[k])S0.ach[k]=B.ach[k]});
  Object.keys(B.best).forEach(k=>{const l=S0.best[k];if(!l||B.best[k].score>l.score)S0.best[k]=B.best[k]});
  const key=h=>h.t+'|'+h.mode+'|'+h.score;const hs=new Set((S0.history||[]).map(key));
  S0.history=[...(S0.history||[]),...B.history.filter(h=>!hs.has(key(h)))].sort((a,b)=>a.t-b.t).slice(-200);
  const wq=new Set((S0.weak||[]).map(w=>w.q));S0.weak=[...(S0.weak||[]),...B.weak.filter(w=>!wq.has(w.q))].slice(-60);
  S0.mast=S0.mast||{};Object.keys(B.mast||{}).forEach(k=>{const a=S0.mast[k],b=B.mast[k],tot=m=>m.reduce((x,p)=>x+p[1],0);if(!a||tot(b)>tot(a))S0.mast[k]=b});
  S0.classes=S0.classes||[];const ck=new Set(S0.classes.map(c=>c.k));(B.classes||[]).forEach(c=>{if(!ck.has(c.k))S0.classes.push(c)});
  if(B.mix&&B.mix.day){if(!S0.mix||B.mix.day>S0.mix.day)S0.mix=B.mix;else if(B.mix.day===S0.mix.day)S0.mix={day:S0.mix.day,done:!!(S0.mix.done||B.mix.done),rank:S0.mix.rank||B.mix.rank,qs:S0.mix.qs&&S0.mix.qs.length?S0.mix.qs:B.mix.qs}}
  if(B.daily&&B.daily.day){if(!S0.daily||B.daily.day>S0.daily.day)S0.daily=B.daily;else if(B.daily.day===S0.daily.day)S0.daily={day:S0.daily.day,done:!!(S0.daily.done||B.daily.done),rank:S0.daily.rank||B.daily.rank}}
  if(B.weekly&&B.weekly.week>=0){if(!S0.weekly||B.weekly.week>S0.weekly.week)S0.weekly=B.weekly;else if(B.weekly.week===S0.weekly.week)S0.weekly={week:S0.weekly.week,done:!!(S0.weekly.done||B.weekly.done),rank:S0.weekly.rank||B.weekly.rank}}
  if(B.qotd&&B.qotd.day>=0){if(!S0.qotd||B.qotd.day>S0.qotd.day)S0.qotd=B.qotd;else if(B.qotd.day===S0.qotd.day)S0.qotd={day:S0.qotd.day,answered:!!(S0.qotd.answered||B.qotd.answered),ok:!!(S0.qotd.ok||B.qotd.ok)}}
  S0.games=Math.max(S0.games||0,B.games);return added}
function openBackup(){
  const last=S.lastBackup?new Date(S.lastBackup).toLocaleDateString():'never';let pending=null;
  modal(`<h2>Backup &amp; restore</h2><p class="hint">Everything lives in this browser. Save a backup file to move to another device or to be safe if site data gets cleared.</p>
   <p><b>Right now:</b> ${esc(backupSummary(S))}.<br><span class="muted">Last backup: ${esc(last)}</span></p>
   <div class="btn-row" style="justify-content:flex-start"><button class="btn btn-primary" id="bkDownload">Download backup</button></div>
   <hr style="border:0;border-top:2px solid var(--line);margin:18px 0">
   <h3 style="font-size:17px;margin:0 0 6px">Restore from a backup</h3>
   <label class="label" for="rsFile" style="display:inline">File: </label><input type="file" id="rsFile" accept=".json,application/json">
   <label class="sr-only" for="rsText">Or paste the backup JSON</label><textarea class="textarea import-area" id="rsText" placeholder="Or paste the backup JSON here" style="margin-top:8px;min-height:70px"></textarea>
   <div id="rsPreview" role="status"></div>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Close</button><button class="btn btn-secondary" id="rsCheck">Check backup</button></div>`,(o,close)=>{
    $('#bkDownload',o).onclick=()=>{S.lastBackup=Date.now();save();saveFile('quizblox-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'quizblox-backup',version:1,exported:new Date().toISOString(),data:S},null,2));toast('Backup downloaded')};
    $('#rsFile',o).onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#rsText',o).value=r.result;$('#rsCheck',o).click()};r.readAsText(f)};
    $('#rsCheck',o).onclick=()=>{
      let st=null;try{const j=JSON.parse($('#rsText',o).value);if(j&&j.format==='quizblox-backup')st=sanitizeState(j.data)}catch(e){}
      const pv=$('#rsPreview',o);if(!st){pending=null;pv.innerHTML='<p class="bad-note">That does not look like a QuizBlox backup file.</p>';return}
      pending=st;pv.innerHTML=`<p style="margin:12px 0 6px"><b>Backup contains:</b> ${esc(backupSummary(st))}.</p>
       <fieldset class="print-opts"><label><input type="radio" name="rsMode" value="merge" checked> Merge <small>add missing sets, keep your newer bests, combine history</small></label><label><input type="radio" name="rsMode" value="replace"> Replace everything <small>this browser becomes a copy of the backup</small></label></fieldset>
       <div class="btn-row"><button class="btn btn-primary" id="rsGo">Restore</button></div>`;
      $('#rsGo',o).onclick=()=>{const mode=$('input[name=rsMode]:checked',o).value;
        const apply=()=>{if(mode==='replace'){Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,pending)}else mergeInto(S,pending);S.lastBackup=Date.now();save();close();toast('Backup restored');setTimeout(()=>location.reload(),700)};
        if(mode==='replace')confirmBox('Replace everything?','All sets, stats and settings in this browser will be replaced by the backup.','Replace',apply);else apply()}}})}

/* ---------- summer holidays season (Nov–Jan, Australia) ---------- */
function inSummerSeason(now){const d=now==null?new Date():new Date(now);const m=d.getMonth();return m===10||m===11||m===0}
function seasonEvent(now){
  if(!inSummerSeason(now))return null;
  const set=(S.sets||[]).find(s=>s.id==='sample-summer')||(S.sets||[]).find(s=>s.builtin&&s.qs&&s.qs.length);
  if(!set)return null;
  return{id:'summer',title:'Summer holidays',emoji:'☀️',set,mode:'race',blurb:'End of the school year. A sunny 3-minute Quiz Race on Summer Holidays.',href:'play.html?season=1'}
}
function seasonCard(){
  const ev=seasonEvent();if(!ev)return'';
  const s=ev.set,m=MODES[ev.mode];
  return `<div class="season-card" id="seasonCard"><span class="season-e" aria-hidden="true">${ev.emoji}</span>
   <div class="season-t"><p class="season-kicker">This season</p><b>${esc(ev.title)}</b><span>${esc(ev.blurb)} · ${m.emoji} ${esc(m.name)} · ${s.qs.length} questions</span></div>
   <div class="season-act"><a class="btn btn-pop btn-sm" id="seasonPlay" href="${ev.href}">Play the holiday race</a></div></div>`
}
function applySeason(now){
  const on=!!seasonEvent(now);
  if(document.body)document.body.classList.toggle('season-summer',on);
  const mount=document.getElementById('seasonMount');
  if(mount)mount.innerHTML=on?seasonCard():'';
}

/* ---------- mastery stars (from per-level accuracy on each set) ---------- */
function recMast(sid,d,ok){if(!sid)return;S.mast=S.mast||{};const m=S.mast[sid]||(S.mast[sid]=[[0,0],[0,0],[0,0],[0,0]]);const p=m[d>=1&&d<=3?d:0];p[1]++;if(ok)p[0]++;if(p[1]>60){p[0]=Math.round(p[0]/2);p[1]=Math.round(p[1]/2)}}
/* A level is "mastered" at 75%+ over at least 4 recent answers. Levelled sets earn a star per mastered level (scaled to 3).
   Sets without levels earn stars from overall accuracy: 1 star = 6 answers at 70%, 2 = 12 at 80%, 3 = 20 at 90%. */
function masteryOf(s){
  const m=((S.mast||{})[s.id])||[[0,0],[0,0],[0,0],[0,0]];const answered=m.reduce((a,p)=>a+p[1],0);
  const present=[1,2,3].filter(l=>(s.qs||[]).some(q=>q.d===l));
  const pct=p=>p[1]?Math.round(p[0]/p[1]*100):null;
  if(present.length>=2){
    const lv=present.map(l=>({l,n:m[l][1],pct:pct(m[l]),ok:m[l][1]>=4&&m[l][0]/m[l][1]>=.75}));
    const stars=Math.floor(3*lv.filter(x=>x.ok).length/present.length+1e-9);
    const tip=lv.map(x=>DIFF_NAMES[x.l]+' '+(x.n?(x.ok?'✓ ':'')+x.pct+'% ('+x.n+')':'not tried')).join(' · ');
    return{stars,answered,lv,tip}}
  const tot=m.reduce((a,p)=>a+p[0],0),acc=answered?tot/answered:0;
  const stars=answered>=20&&acc>=.9?3:answered>=12&&acc>=.8?2:answered>=6&&acc>=.7?1:0;
  return{stars,answered,lv:null,tip:answered?`${Math.round(acc*100)}% over ${answered} answers. 6 answers at 70% for ★, 12 at 80% for ★★, 20 at 90% for ★★★.`:''}}
function starsHTML(s){
  const m=masteryOf(s);const label=m.answered?`Mastery: ${m.stars} of 3 stars. ${m.tip}`:'Mastery: not played yet. Answer questions at each level to earn stars.';
  return `<span class="mstars s${m.stars}${m.answered?'':' none'}" role="img" aria-label="${esc(label)}" title="${esc(label)}">${'★'.repeat(m.stars)}${'☆'.repeat(3-m.stars)}</span>`}

function dayNum(){return Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5)}
function dayOf(t){t=Number(t)||0;return Math.floor((t-new Date(t).getTimezoneOffset()*60000)/864e5)}
function playDays(h){return new Set((h||S.history||[]).map(g=>dayOf(g.t)))}
function bestStreak(h){const days=[...playDays(h)].sort((a,b)=>a-b);let best=0,run=0,prev=null;for(const d of days){run=(prev!=null&&d===prev+1)?run+1:1;prev=d;if(run>best)best=run}return best}
function currentStreak(h){const days=[...playDays(h)].sort((a,b)=>b-a),today=dayNum();if(!days.length||days[0]<today-1)return{n:0,alive:false,today:false,best:bestStreak(h)};let n=0,expect=days[0];for(const d of days){if(d===expect){n++;expect--}else if(d<expect)break}return{n,alive:true,today:days[0]===today,best:bestStreak(h)}}
function dateFromDay(d){return new Date(d*864e5+new Date().getTimezoneOffset()*60000)}
function unlockAch(id){const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return false;S.ach=S.ach||{};if(S.ach[id])return false;S.ach[id]=Date.now();save();setTimeout(()=>toast('Achievement unlocked: '+a.e+' '+a.n),500);return true}

/* ---------- class mode: link for students, result code for teachers (all offline) ---------- */
const CLASS_AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const classKey=()=>Array.from({length:4},()=>CLASS_AL[Math.floor(Math.random()*CLASS_AL.length)]).join('');
function fnv(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36).padStart(7,'0').slice(-5)}
const plainName=n=>String(n==null?'':n).replace(/[~.<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,14);
const CLASS_QMAX=48;
function bitsHex(a){let h='';for(let i=0;i<a.length;i+=4){let v=0;for(let k=0;k<4;k++)v=v*2+(a[i+k]?1:0);h+=v.toString(16)}return h}
function hexBits(h,n){const out=[];for(let i=0;i<n;i++){const v=parseInt(h[i>>2],16);out.push((v>>(3-(i&3)))&1)}return out}
function makeClassCode(k,name,score,correct,total,best,seen,miss){
  const f=[k,plainName(name)||'Student',Math.round(score),correct,total,best];
  if(seen&&miss&&seen.length&&seen.length<=CLASS_QMAX){f.push(bitsHex(seen),bitsHex(miss))}
  const body=f.join('~');
  return 'QB1.'+b64e(body)+'.'+fnv(body+'|quizblox')}
function parseClassCode(txt){
  const m=/^QB1\.([A-Za-z0-9_-]+)\.([0-9a-z]{5})$/.exec(String(txt||'').trim());if(!m)return{err:'format'};
  let body;try{body=b64d(m[1])}catch(e){return{err:'format'}}
  if(fnv(body+'|quizblox')!==m[2])return{err:'check'};
  const f=body.split('~');if(f.length!==6&&f.length!==8)return{err:'format'};
  const n=i=>{const v=Number(f[i]);return Number.isInteger(v)&&v>=0?v:NaN};
  const r={k:f[0],name:plainName(f[1]),score:n(2),correct:n(3),total:n(4),best:n(5)};
  if(!/^[A-Z2-9]{4}$/.test(r.k)||!r.name||[r.score,r.correct,r.total,r.best].some(isNaN)||r.score>99999||r.total>9999||r.correct>r.total||r.best>r.total)return{err:'format'};
  if(f.length===8){if(!/^[0-9a-f]{1,12}$/.test(f[6])||f[6].length!==f[7].length||!/^[0-9a-f]+$/.test(f[7]))return{err:'format'};
    const sb=hexBits(f[6],f[6].length*4),mb=hexBits(f[7],f[7].length*4);if(mb.some((x,i)=>x&&!sb[i]))return{err:'format'};r.seen=f[6];r.miss=f[7]}
  return r}
/* the set a class plays (built-in by id, or the teacher's own set embedded in the link); same cleaning for both sides */
function classSetFrom(id,u,k){
  if(u){const x=unpackSet(u);const qs=(x.qs||[]).slice(0,200).map(cleanQ).filter(Boolean);if(!qs.length)return null;const set={id:'class-'+k,title:String(x.title||'Class set').slice(0,40),qs};if(x.emoji&&String(x.emoji).length<=8)set.emoji=x.emoji;return set}
  const b=ALL_SAMPLES.find(y=>y.id===id);return b?clone(b):null}
function classLink(c,base){
  const o={k:c.k,c:c.name,i:c.setId,m:c.mode,t:c.time};if(c.u)o.u=c.u;if(c.rules==='hard'||c.rules==='relaxed')o.r=c.rules;
  return(base||appPath('play.html'))+'#class='+b64e(JSON.stringify(o))}
function parseClassLink(h){
  try{const m=/^#class=([A-Za-z0-9_-]+)$/.exec(h);if(!m)return null;const o=JSON.parse(b64d(m[1]));
    if(!/^[A-Z2-9]{4}$/.test(o.k)||!MODES[o.m]||![30,60,120,180,300].includes(o.t))return null;
    const set=classSetFrom(o.i,o.u,o.k);if(!set)return null;
    return{k:o.k,name:String(o.c||'Class').replace(/[<>]/g,'').slice(0,30)||'Class',set,mode:o.m,time:o.t,rules:o.r==='hard'||o.r==='relaxed'?o.r:''}}catch(e){return null}}
function cleanClass(c){
  if(!c||typeof c!=='object'||!/^[A-Z2-9]{4}$/.test(c.k)||!MODES[c.mode]||![30,60,120,180,300].includes(c.time))return null;
  const o={k:c.k,name:strIn(c.name,30,'Class').replace(/[<>]/g,'').trim()||'Class',setId:strIn(c.setId,40),setTitle:strIn(c.setTitle,40),mode:c.mode,time:c.time,rules:c.rules==='hard'||c.rules==='relaxed'?c.rules:'',created:numIn(c.created,0,4e12,0)};
  if(c.u&&typeof c.u==='object'&&Array.isArray(c.u.q)&&c.u.q.length<=200){try{const u=unpackSet(c.u);if((u.qs||[]).map(cleanQ).filter(Boolean).length)o.u=c.u}catch(e){}}
  o.results=(Array.isArray(c.results)?c.results:[]).slice(0,500).map(r=>{if(!r||typeof r!=='object')return null;const p=parseClassCode(r.code);return p.err||p.k!==o.k?null:Object.assign({code:String(r.code),name:p.name,score:p.score,correct:p.correct,total:p.total,best:p.best,t:numIn(r.t,0,4e12,0)},p.seen?{seen:p.seen,miss:p.miss}:{})}).filter(Boolean);
  return o}

/* ---------- mastery goal: the level (or tier) that is holding back the next star ---------- */
function starGoal(set){
  const m=masteryOf(set);if(m.stars>=3)return null;
  if(m.lv){const cand=m.lv.filter(x=>!x.ok).sort((a,b)=>((b.pct==null?-1:b.pct)-(a.pct==null?-1:a.pct))||a.l-b.l);const x=cand[0];if(!x)return null;
    const pool=set.qs.filter(q=>q.d===x.l);
    const need=x.n<4?`${4-x.n} more answer${4-x.n===1?'':'s'} (and 75% right)`:'75% or more';
    return{sid:set.id,lvl:x.l,label:DIFF_NAMES[x.l],pool,text:`${DIFF_NAMES[x.l]} level: ${x.n?x.pct+'% over '+x.n+' recent answer'+(x.n===1?'':'s'):'not tried yet'}. Needs ${need}.`}}
  const next=m.stars+1,t=[null,[6,70],[12,80],[20,90]][next];
  return{sid:set.id,lvl:0,label:'★'.repeat(next),pool:set.qs.slice(),text:`Next star: ${t[0]} recent answers at ${t[1]}% (you have ${m.answered}).`}}

/* ---------- installable offline app (only over http/https; file:// is untouched) ---------- */
function showUpdateBanner(reg){
  if(document.getElementById('updBar'))return document.getElementById('updBar');
  const d=document.createElement('div');d.id='updBar';d.className='upd-bar';d.setAttribute('role','status');
  d.innerHTML='<span>✨ New version available — refresh to update.</span><button class="btn btn-primary btn-sm" id="updGo" type="button">Refresh</button><button class="btn btn-ghost btn-sm" id="updLater" type="button" aria-label="Dismiss">Later</button>';
  document.body.appendChild(d);
  const go=()=>{const w=reg&&reg.waiting;if(!w){location.reload();return}w.postMessage({type:'SKIP_WAITING'})};
  document.getElementById('updLater').onclick=()=>d.remove();
  document.getElementById('updGo').onclick=()=>{const G=window.QB&&window.QB.G;if(G&&G.phase&&G.phase!=='over'&&G.started)confirmBox('Reload now?','You are in the middle of a game. Reloading ends it. You can also tap Later and update after this game.','Reload',go,false);else go()};
  return d
}
(function(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  const banner=showUpdateBanner;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading||!window.__hadCtl)return;reloading=true;location.reload()});
  window.addEventListener('load',()=>{window.__hadCtl=!!navigator.serviceWorker.controller;
    const swUrl=typeof appPath==='function'?appPath('sw.js'):'sw.js';
    const swScope=typeof appBase==='function'?appBase():'./';
    navigator.serviceWorker.register(swUrl,{scope:swScope}).then(reg=>{
      if(reg.waiting&&navigator.serviceWorker.controller)banner(reg);
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)banner(reg)})});
      const poke=()=>reg.update().catch(()=>{});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)poke()});
      setInterval(poke,30*60*1000);
      window.__swReg=reg;window.showUpdateBanner=()=>banner(reg)}).catch(()=>{})});
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;const b=document.getElementById('installBtn');if(b)b.hidden=false});
  document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('installBtn');if(!b)return;if(deferred)b.hidden=false;
    b.addEventListener('click',()=>{if(!deferred)return;deferred.prompt();Promise.resolve(deferred.userChoice).then(()=>{deferred=null;b.hidden=true}).catch(()=>{})})});
  window.addEventListener('appinstalled',()=>{const b=document.getElementById('installBtn');if(b)b.hidden=true;toast('QuizBlox installed')});
})();

/* ---------- subtle offline badge (any protocol) ---------- */
(function(){
  function badge(){let b=document.getElementById('offBadge');if(!b){b=document.createElement('div');b.id='offBadge';b.className='off-badge';b.setAttribute('role','status');b.innerHTML='<span aria-hidden="true">●</span> Offline <small>· everything is saved on this device</small>';document.body.appendChild(b)}return b}
  const sync=()=>{if(!document.body)return;const off=navigator.onLine===false;const b=off?badge():document.getElementById('offBadge');if(b)b.classList.toggle('show',off)};
  window.addEventListener('offline',sync);window.addEventListener('online',sync);document.addEventListener('DOMContentLoaded',sync);
})();

/* ---------- printable worksheet (shared by the editor and Class mode) ---------- */
function shuffleQs(qs,seed){
  const a=(qs||[]).slice();let h=(seed>>>0)||1;
  const rnd=()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296};
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}
  return a
}
function closePreview(){const e=$('#printSheet');if(e)e.remove();const b=$('#previewBar');if(b)b.remove()}
function showPreviewBar(){
  let b=$('#previewBar');if(b)b.remove();
  b=document.createElement('div');b.id='previewBar';b.className='preview-bar';
  b.innerHTML='<span>Worksheet preview</span><button type="button" class="btn btn-primary btn-sm" id="previewPrint">Print this</button><button type="button" class="btn btn-secondary btn-sm" id="previewClose">Close preview</button>';
  document.body.appendChild(b);
  const pr=$('#previewPrint');if(pr)pr.onclick=()=>window.print();
  const cl=$('#previewClose');if(cl)cl.onclick=closePreview;
}
function buildSheetFor(s,kind,note,opts){
  opts=opts||{};
  let el=$('#printSheet');if(el)el.remove();
  el=document.createElement('div');el.id='printSheet';
  const qsAll=s.qs||[];
  const pips=!!opts.pips,versions=+opts.versions===2?2:1,twoup=!!opts.twoup,isTicket=kind==='ticket';
  if(opts.preview)el.classList.add('print-preview');
  if(twoup)el.classList.add('twoup');
  if(isTicket)el.classList.add('ticket-sheet');
  const body=q=>{const t=qType(q);return t==='tf'?'<p class="tfline">&#9744; True &nbsp;&nbsp;&nbsp; &#9744; False</p>':t==='type'?'<p class="blank">Answer: ______________________________</p>':`<ol type="A">${q.a.map(a=>`<li>${esc(a)}</li>`).join('')}</ol>`};
  const pipOf=q=>{const d=Math.min(3,Math.max(1,+(q.d||0)));if(!pips||!q.d)return'';return ` <span class="pd" title="${['Easy','Medium','Hard'][d-1]}"><span class="pips" data-d="${d}" aria-label="${['Easy','Medium','Hard'][d-1]}">${'●'.repeat(d)}${'○'.repeat(3-d)}</span></span>`};
  const qHtml=qs=>qs.map((q,i)=>`<div class="pq"><p><b>${i+1}.</b> ${esc(q.q)}${pipOf(q)}</p>${q.pic?`<div class="ppic">${esc(q.pic)}</div>`:''}${body(q)}</div>`).join('');
  const keyOf=q=>{const t=qType(q);return t==='tf'?`<b>${q.a[q.c]}</b>`:t==='type'?`<b>${esc(q.a[0])}</b>${q.a.length>1?' <small>(also: '+esc(q.a.slice(1).join(', '))+')</small>':''}`:`<b>${LETTERS[q.c]}</b> &ndash; ${esc(q.a[q.c])}`};
  const keyHtml=qs=>`<ol class="key">${qs.map(q=>`<li>${keyOf(q)}</li>`).join('')}</ol>`;
  const meta=[];
  if(opts.className)meta.push('Class: '+esc(opts.className));
  if(opts.teacher)meta.push('Teacher: '+esc(opts.teacher));
  if(opts.period)meta.push('Period: '+esc(opts.period));
  const metaLine=meta.length?`<p class="pmeta">${meta.join(' &nbsp;·&nbsp; ')}</p>`:'';
  const head=(t,ver)=>`<header><h1>${esc(s.emoji||'')} ${esc(s.title)}${ver?` <span class="pver">Version ${ver}</span>`:''}</h1><p class="sub">${t}</p>${metaLine}</header>`;
  const source=isTicket?qsAll.slice(0,Math.min(5,qsAll.length)):qsAll.slice();
  const packs=versions===2?[{ver:'A',qs:source.slice()},{ver:'B',qs:shuffleQs(source,2026)}]:[{ver:'',qs:source}];
  const inst=esc(note||(isTicket?'A quick check before you leave. Circle the best answer or write it on the line.':'Circle the best answer for each question.'));
  const nameLine=n=>'Name: ________________________ &nbsp; Date: ______________ &nbsp; Score: ____ / '+n;
  const oneSheet=pack=>`<section>${head(nameLine(pack.qs.length),pack.ver)}<p class="inst">${inst}</p>${qHtml(pack.qs)}</section>`;
  const oneKey=pack=>`<section class="pk">${head(pack.ver?'Answer key · Version '+pack.ver:'Answer key',pack.ver)}${keyHtml(pack.qs)}</section>`;
  const ticketBlock=(pack,copy)=>`<div class="ticket">${head('Exit ticket'+(pack.ver?' · Version '+pack.ver:''),pack.ver)}<p class="inst">${inst}</p>${qHtml(pack.qs)}<p class="ticket-copy">Copy ${copy}</p></div>`;
  let html='';
  if(isTicket) html=packs.map(pack=>`<section class="ticket-pair">${ticketBlock(pack,1)}${ticketBlock(pack,2)}</section>`).join('');
  else if(kind==='key') html=packs.map(oneKey).join('');
  else if(kind==='both') html=packs.map(oneSheet).join('')+packs.map(oneKey).join('');
  else if(twoup&&packs.length===1) html=`<section class="sheet-pair"><div class="sheet-col">${oneSheet(packs[0])}</div><div class="sheet-col">${oneSheet(packs[0])}</div></section>`;
  else if(twoup&&packs.length===2) html=`<section class="sheet-pair"><div class="sheet-col">${oneSheet(packs[0])}</div><div class="sheet-col">${oneSheet(packs[1])}</div></section>`;
  else html=packs.map(oneSheet).join('');
  el.innerHTML=html+'<footer>Made with QuizBlox</footer>';document.body.appendChild(el);
  if(opts.preview)showPreviewBar();
  return el
}


/* R18: team brawl – the class boss is picked from the class code so teacher page and students agree */
const BOSS_TEAM=[['👹','Grumblor'],['🐲','Sir Snorts-a-Lot'],['🦖','Rexy McStompface'],['👾','Glitchzilla'],['🧌','Gruff the Troll']];
const bossIdx=k=>{let h=0;for(const ch of String(k))h=(h*31+ch.charCodeAt(0))>>>0;return h%BOSS_TEAM.length};

/* R20: compact mode picker */
const MODE_SHORT={gold:'Open chests, steal gold',race:'Fast answers, big points',heist:'Crack the vault',fish:'Mash to reel big fish',cafe:'Serve before guests leave',brawl:'Team up to fell a boss',rocket:'Play cards, race to space'};
const MODE_NEW=['brawl','rocket'];
