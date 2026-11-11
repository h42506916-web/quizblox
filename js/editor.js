/* QuizBlox – question set library and editor */
const view=$('#view');
let E=null;
const SET_COLORS=['#ffe08a','#d6ecff','#ffd9c2','#d4f1c5','#e0dbff','#ffd6e5'];
const SET_EMOJI=['📚','🧪','🌍','➗','🎨','🏛️'];
function blankQ(type){return type==='tf'?{q:'',type:'tf',a:['True','False','',''],c:0,t:'',pic:''}:{q:'',type:type||'mc',a:['','','',''],c:0,t:'',pic:''}}
const PIC_PICKS=['🐘','🌍','🍎','🚗','⚽','🎵','🔥','🌈','🦁','🚀'];

const EMOJI_CHOICES=['📚','🧪','🌍','➗','🎨','🏛️','🚀','🐾','⚽','🎵','🍎','💡','🧠','🔬','🗺️','📖'];
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const slug=t=>(t||'set').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'set';
function exportSets(list,name){download(name,JSON.stringify({format:'quizblox-sets',version:1,exported:new Date().toISOString(),sets:list.map(s=>({title:s.title,emoji:s.emoji,cat:catOf(s),qs:s.qs}))},null,2))}
function cleanSet(raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.qs))return null;
  const qs=raw.qs.slice(0,200).map(cleanQ).filter(Boolean);if(!qs.length)return null;
  const o={id:uid(),title:String(raw.title||'Imported set').trim().slice(0,40)||'Imported set',qs};if(typeof raw.emoji==='string'&&raw.emoji.length<=8)o.emoji=raw.emoji;
  if(typeof raw.cat==='string'&&CATS.includes(raw.cat))o.cat=raw.cat;return o}
function importText(txt){
  const trimmed=String(txt||'').replace(/^\uFEFF/,'').trim();
  const looksJSON=/^[{\[]/.test(trimmed);
  if(looksJSON){
    let d;try{d=JSON.parse(trimmed)}catch(e){return{n:0,err:'That doesn\'t look like valid JSON. Blox squinted very hard.'}}
    const arr=Array.isArray(d)?d:Array.isArray(d&&d.sets)?d.sets:(d&&Array.isArray(d.qs))?[d]:[];
    const sets=arr.map(cleanSet).filter(Boolean);if(!sets.length)return{n:0,err:'No usable sets found. Each set needs a title and questions with answers and a correct index.'};
    sets.forEach(x=>S.sets.push(x));save();return{n:sets.length,q:sets.reduce((a,x)=>a+x.qs.length,0)}
  }
  const r=parseBulk(trimmed);
  if(!r.out.length)return{n:0,err:'No usable sets or questions found. Paste QuizBlox JSON, or questions in lines, CSV, or A/B/C/D blocks.'};
  const set=cleanSet({title:'Pasted questions',cat:'My sets',emoji:'📝',qs:r.out});
  if(!set)return{n:0,err:'Those questions could not be turned into a set. Check that each one has a prompt and answers.'};
  S.sets.push(set);save();return{n:1,q:set.qs.length,pasted:true}
}
function splitCsvLine(line){
  const out=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(q){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;
    else if(ch===','){out.push(cur.trim());cur=''}
    else cur+=ch
  }
  out.push(cur.trim());return out
}
function answersFrom(parts){
  const raw=parts.filter(Boolean).slice(0,4);
  let c=0;const a=raw.map((x,i)=>{const s=String(x);const star=/^\*/.test(s.trim())||/\*$/.test(s.trim());const t=s.trim().replace(/^\*/,'').replace(/\*$/,'');if(star)c=i;return t});
  return{a:[...a,'','','',''].slice(0,4),c}
}
function parsePipes(txt){
  const out=[];let skipped=0;
  txt.split(/\r?\n/).forEach(line=>{line=line.trim();if(!line)return;
    let type='mc',pic='',dl=0;const m=/^\[([^\]]*)\]\s*/.exec(line);
    if(m){line=line.slice(m[0].length);m[1].split(',').forEach(tag=>{tag=tag.trim();const l=tag.toLowerCase();if(l==='tf')type='tf';else if(l==='type')type='type';else if(/^pic\s*=/.test(l))pic=tag.slice(tag.indexOf('=')+1).trim();else if(/^d\s*=\s*[123]$/.test(l))dl=+l.slice(-1);else if(l==='easy')dl=1;else if(l==='medium')dl=2;else if(l==='hard')dl=3})}
    const p=line.split(/\s*[|\t]\s*/).map(x=>x.trim()).filter((x,i)=>i===0||x);
    if(!p[0]){skipped++;return}
    if(type==='tf'){const v=(p[1]||'').toLowerCase();if(!['true','false','t','f'].includes(v)){skipped++;return}out.push({q:p[0],type:'tf',a:['True','False','',''],c:v[0]==='t'?0:1,t:'',pic,d:dl||undefined});return}
    if(type==='type'){if(p.length<2){skipped++;return}out.push({q:p[0],type:'type',a:[...p.slice(1,5),'','','',''].slice(0,4),c:0,t:'',pic,d:dl||undefined});return}
    if(p.length<3){skipped++;return}const ans=answersFrom(p.slice(1));out.push({q:p[0],type:'mc',a:ans.a,c:ans.c,t:'',pic,d:dl||undefined})});
  return{out,skipped}
}
function parseCsv(txt){
  const out=[];let skipped=0;
  txt.split(/\r?\n/).forEach((line,idx)=>{line=line.trim();if(!line)return;
    const p=splitCsvLine(line).filter((x,i)=>i===0||x);
    if(!p[0]){skipped++;return}
    if(idx===0&&/^(question|prompt|q)$/i.test(p[0]))return;
    if(/^(true|false|t|f)$/i.test(p[1]||'')&&p.length===2){const v=p[1].toLowerCase();out.push({q:p[0],type:'tf',a:['True','False','',''],c:v[0]==='t'?0:1,t:'',pic:''});return}
    if(p.length===2){out.push({q:p[0],type:'type',a:[p[1],'','',''],c:0,t:'',pic:''});return}
    if(p.length<3){skipped++;return}const ans=answersFrom(p.slice(1));out.push({q:p[0],type:'mc',a:ans.a,c:ans.c,t:'',pic:''})});
  return{out,skipped}
}
function parseGift(txt){
  const out=[];let skipped=0;
  txt.split(/\r?\n/).forEach(line=>{line=line.trim();if(!line||line.startsWith('//'))return;
    const m=/^(.+?)\s*\{([^}]*)\}\s*$/.exec(line);if(!m){skipped++;return}
    const q=m[1].trim(),body=m[2].trim();
    if(/^[TtFf]$/.test(body)){out.push({q,type:'tf',a:['True','False','',''],c:/^[Tt]$/.test(body)?0:1,t:'',pic:''});return}
    const parts=[];let c=0,x,re=/([=~])([^=~]+)/g;
    while((x=re.exec(body))){const tt=x[2].trim();if(!tt)continue;if(x[1]==='=')c=parts.length;parts.push(tt)}
    if(!parts.length){skipped++;return}
    if(!body.includes('~')){out.push({q,type:'type',a:[...parts,'','','',''].slice(0,4),c:0,t:'',pic:''});return}
    out.push({q,type:'mc',a:[...parts,'','','',''].slice(0,4),c,t:'',pic:''})});
  return{out,skipped}
}
function parseBlocks(txt){
  const out=[];let skipped=0,cur=null;
  const ansRe=/^\*?\s*[\(\[]?\s*([A-Da-d]|[1-4])[\)\]\.:]\s+(.+)$/;
  const flush=()=>{
    if(!cur)return;
    const q=cur.q,ans=cur.ans;
    if(ans.length>=2){const c=Math.max(0,ans.findIndex(a=>a.star));out.push({q,type:'mc',a:[...ans.map(a=>a.t),'','','',''].slice(0,4),c:c<0?0:c,t:'',pic:''})}
    else if(ans.length===0&&cur.tf!=null){out.push({q,type:'tf',a:['True','False','',''],c:cur.tf,t:'',pic:''})}
    else skipped++;
    cur=null
  };
  String(txt).split(/\r?\n/).forEach(raw=>{
    const line=raw.trim();
    if(!line){flush();return}
    const m=ansRe.exec(line);
    if(m&&cur){const raw=m[2].trim();const star=/^\*/.test(line)||/^\*/.test(raw)||/\*$/.test(raw);cur.ans.push({t:raw.replace(/^\*+/,'').replace(/\*+$/,'').trim(),star});return}
    if(/^(true|false|t|f)\.?$/i.test(line)&&cur&&!cur.ans.length){cur.tf=/^t/i.test(line)?0:1;return}
    flush();
    cur={q:line.replace(/^(?:Q\s*)?\d+[\).:]\s*/i,''),ans:[]}
  });
  flush();
  return{out,skipped}
}
function parseBulk(txt){
  const raw=String(txt||'').replace(/^\uFEFF/,'');
  if(!raw.trim())return{out:[],skipped:0};
  if(/\{(?:=|~|[TtFf]\})/.test(raw)){const r=parseGift(raw);if(r.out.length)return r}
  if(/(^|\n)\s*\*?\s*[\(\[]?\s*[A-Da-d1-4][\)\]\.:]\s+\S/.test(raw)){const r=parseBlocks(raw);if(r.out.length)return r}
  const lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const csvish=lines.filter(l=>(l.match(/,/g)||[]).length>=2&&!/[|\t]/.test(l)).length;
  const pipeish=lines.filter(l=>/[|\t]/.test(l)).length;
  if(csvish>=1&&csvish>=pipeish){const r=parseCsv(raw);if(r.out.length)return r}
  return parsePipes(raw)
}
function bulkRight(q){return q.type==='tf'?(q.c?'False':'True'):q.type==='type'?(q.a[0]||''):(q.a[q.c]||q.a[0]||'')}
function renderBulkPreview(){
  const ta=$('#bulkText'),box=$('#bulkPreview');if(!ta||!box)return;
  const r=parseBulk(ta.value);
  if(!r.out.length){box.hidden=true;box.innerHTML=r.skipped?`<p class="hint">Nothing usable yet (${r.skipped} line${r.skipped>1?'s':''} skipped).</p>`:'';return}
  box.hidden=false;
  box.innerHTML=`<p class="hint" id="bulkSum">Ready to add <b>${r.out.length}</b> question${r.out.length>1?'s':''}${r.skipped?` · ${r.skipped} skipped`:''}.</p>
    <ul class="bulk-list" id="bulkList">${r.out.map((q,i)=>`<li><label class="bulk-item"><input type="checkbox" class="bulk-cb" data-i="${i}" checked> <span class="bulk-type">${q.type==='tf'?'T/F':q.type==='type'?'Type':'MC'}</span> <span class="bulk-q">${esc(q.q)}</span> <em>${esc(bulkRight(q))}</em></label></li>`).join('')}</ul>`}

/* ---- share by link ---- */
function shareLink(s){return location.href.split('#')[0]+'#share='+b64e(JSON.stringify(packSet(s)))}
function parseShare(h){
  try{const m=/^#share=([A-Za-z0-9_-]+)$/.exec(h);if(!m)return null;return cleanSet(unpackSet(JSON.parse(b64d(m[1]))))}catch(e){return null}}
function openShare(id){
  const s=S.sets.find(x=>x.id===id);if(!s)return;const link=shareLink(s);
  modal(`<h2>Share "${esc(s.title)}"</h2><p class="hint">Anyone who opens this link can add a copy of the set to their own browser. The questions travel inside the link, so nothing is uploaded anywhere.</p>
   <label class="sr-only" for="shareLink">Share link</label><input class="input" id="shareLink" readonly value="${esc(link)}" style="width:100%">
   ${link.length>2000?`<p class="hint" style="color:var(--coral-d)">This link is long (${link.length} characters). Some apps may cut it off. Export the set as a file if you have trouble.</p>`:''}
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Close</button><button class="btn btn-primary" id="copyShare">Copy link</button></div>`,(o)=>{
    const inp=$('#shareLink',o);inp.focus();inp.select();
    $('#copyShare',o).onclick=()=>{inp.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(()=>toast('Link copied'),()=>toast(ok?'Link copied':'Press Ctrl+C to copy the selected link'));else toast(ok?'Link copied':'Press Ctrl+C to copy the selected link')}})}
function checkIncomingShare(h){
  h=h||location.hash;if(!/^#share=/.test(h))return false;const set=parseShare(h);history.replaceState(null,'',location.pathname);
  if(!set){toast('That share link looks damaged. Ask for a fresh one.');return false}
  modal(`<h2>Add shared set?</h2><p><b>${esc(set.emoji||'📚')} ${esc(set.title)}</b><br><span class="muted">${set.qs.length} questions</span></p><p class="hint">Someone shared this set with you. It will be added next to your own sets.</p>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">No thanks</button><button class="btn btn-primary" id="addShared">Add to my sets</button></div>`,(o,close)=>{
    $('#addShared',o).onclick=()=>{S.sets.push(set);save();close();toast('Added "'+set.title+'"');renderList()}});return true}

/* ---- printable sheets ---- */
function buildPrint(id,kind,opts){const s=S.sets.find(x=>x.id===id);if(!s)return;return buildSheetFor(s,kind,opts&&opts.note,opts)}
function openPrint(id){
  const s=S.sets.find(x=>x.id===id);if(!s)return;
  modal(`<h2>Print "${esc(s.title)}"</h2><p class="hint">Opens your browser's print dialog. Choose "Save as PDF" if you'd rather have a file. Preview lets you check the sheet on screen first.</p>
   <fieldset class="print-opts"><label><input type="radio" name="pk" value="sheet" checked> Student sheet <small>questions with answer choices and a name line</small></label>
   <label><input type="radio" name="pk" value="key"> Answer key only</label><label><input type="radio" name="pk" value="both"> Both (sheet, then key on a new page)</label>
   <label><input type="radio" name="pk" value="ticket"> Exit ticket <small>five questions, two copies on one page</small></label></fieldset>
   <div class="print-meta"><label class="label" for="prClass">Class</label><input class="input" id="prClass" maxlength="40" placeholder="Optional"><label class="label" for="prTeacher">Teacher</label><input class="input" id="prTeacher" maxlength="40" placeholder="Optional"><label class="label" for="prPeriod">Period</label><input class="input" id="prPeriod" maxlength="20" placeholder="Optional"></div>
   <div class="print-flags"><label><input type="checkbox" id="prPips"> Show difficulty</label><label><input type="checkbox" id="prTwoup"> Two-up student sheets</label><label><input type="checkbox" id="prVer"> Version A and B (shuffled order)</label></div>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Cancel</button><button class="btn btn-secondary" id="doPreview">Preview</button><button class="btn btn-primary" id="doPrint">Print</button></div>`,(o,close)=>{
    const optsOf=()=>({className:$('#prClass',o).value.trim(),teacher:$('#prTeacher',o).value.trim(),period:$('#prPeriod',o).value.trim(),pips:$('#prPips',o).checked,twoup:$('#prTwoup',o).checked,versions:$('#prVer',o).checked?2:1});
    const run=preview=>{const k=$('input[name=pk]:checked',o).value;const opts=optsOf();opts.preview=!!preview;close();buildPrint(id,k,opts);if(!preview)setTimeout(()=>window.print(),60)};
    $('#doPrint',o).onclick=()=>run(false);
    $('#doPreview',o).onclick=()=>run(true)})}
window.addEventListener('afterprint',()=>{closePreview()});
function openImport(){
  modal(`<h2>Import question sets</h2><p class="hint">Paste JSON exported from QuizBlox, or choose a .json file. Imported sets are added alongside yours; nothing is overwritten.</p>
   <label class="sr-only" for="importText">JSON or questions</label><textarea class="textarea import-area" id="importText" placeholder='{"format":"quizblox-sets","sets":[…]}&#10;or: Question | Right | Wrong | Wrong'></textarea>
   <p class="hint">Paste a QuizBlox JSON export, or plain questions (pipes, CSV, A/B/C/D blocks, or GIFT <code>{=right ~wrong}</code>). A paste of questions becomes a new set called &ldquo;Pasted questions&rdquo;.</p>
   <p style="margin:10px 0"><label class="label" for="importFile" style="display:inline">Or file: </label><input type="file" id="importFile" accept=".json,application/json"></p>
   <div class="btn-row"><button class="btn btn-secondary" data-m="close">Cancel</button><button class="btn btn-primary" id="importGo">Import</button></div>`,(o,close)=>{
    $('#importFile',o).onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#importText',o).value=r.result};r.readAsText(f)};
    $('#importGo',o).onclick=()=>{const r=importText($('#importText',o).value);if(r.err){toast(r.err);return}close();toast(`Imported ${r.n} set${r.n>1?'s':''} (${r.q} questions). Blox is thrilled.`);renderList()}})}
function renderList(){
  history.replaceState(null,'',location.pathname);
  E=null;
  view.innerHTML=`<div class="page-head"><h1><span class="hl">Discover</span> sets</h1><p>Browse the library, star a favourite, or make your own. Everything stays in this browser.</p></div>
  <div class="page-body"><div class="toolbar"><button class="btn btn-primary" data-act="newset" id="newSetBtn">+ New question set</button>
   <button class="btn btn-secondary" data-act="import" id="importBtn">Import</button><button class="btn btn-secondary" data-act="exportall" id="exportAllBtn" ${S.sets.length?'':'disabled'}>Export all</button><button class="btn btn-secondary" data-act="restore">Restore sample sets</button><button class="btn btn-secondary" data-act="backup" id="backupBtn2">Backup &amp; restore</button><div class="sp"></div><span class="muted">${S.sets.length} set${S.sets.length===1?'':'s'}</span></div>
  ${S.sets.length?`<div class="set-tools"><label class="sr-only" for="listSearch">Search question sets</label><input class="input" id="listSearch" type="search" placeholder="Search ${S.sets.length} sets…" value="${esc(FILT.q)}" autocomplete="off"></div><div class="chips" id="listChips" role="group" aria-label="Filter sets by category"></div><div id="setList"></div>`
  :emptyHTML({title:'No question sets. Tumbleweeds.',body:'Make your first set and give Blox something to do.',cta:'<button class="btn btn-primary" data-act="newset">+ New question set</button>'})}</div>`;
  const ls=$('#listSearch');if(ls){ls.oninput=e=>{FILT.q=e.target.value;renderRows()}}renderRows();
}
function typeMix(s){const n=k=>s.qs.filter(q=>qType(q)===k).length,p=s.qs.filter(q=>q.pic).length;const bits=[];if(n('tf'))bits.push(n('tf')+' true/false');if(n('type'))bits.push(n('type')+' type-in');if(p)bits.push(p+' picture');{const l=[1,2,3].map(k=>s.qs.filter(q=>q.d===k).length);if(l.some(Boolean))bits.push('levelled '+l.join('/'))}return bits.length?' · '+bits.join(', '):''}
function renderRows(){
  const ch=$('#listChips');if(!ch)return;ch.innerHTML=chipsHTML(S.sets);const list=filterSets(S.sets);
  $('#setList').innerHTML=list.length?`<div class="set-list">${list.map((s,i)=>{const f=isFav(s.id);return `<div class="set-row" data-id="${esc(s.id)}"><span class="set-emoji" aria-hidden="true" style="background:${SET_COLORS[i%SET_COLORS.length]}">${s.emoji||SET_EMOJI[i%SET_EMOJI.length]}</span><div class="info"><b>${esc(s.title)}${s.builtin?'<span class="tag">Sample</span>':''}<span class="tag cat">${esc(catOf(s))}</span></b><span>${s.qs.length} question${s.qs.length===1?'':'s'}${typeMix(s)} ${starsHTML(s)}</span></div>
    <div class="set-acts"><button type="button" class="star ${f?'on':''}" data-act="fav" data-id="${esc(s.id)}" aria-pressed="${f}" aria-label="${f?'Remove':'Add'} ${esc(s.title)} ${f?'from':'to'} favourites" title="${f?'Unfavourite':'Favourite'}">${f?'★':'☆'}</button>
    <a class="btn btn-primary btn-sm" href="play.html?set=${encodeURIComponent(s.id)}">Play</a>
    <a class="btn btn-secondary btn-sm" href="play.html?study=${encodeURIComponent(s.id)}">Study</a>
    <button class="btn btn-secondary btn-sm" data-act="editset" data-id="${esc(s.id)}">Edit</button>
    <button class="btn btn-secondary btn-sm" data-act="dupset" data-id="${esc(s.id)}">Duplicate</button>
    <button class="btn btn-secondary btn-sm" data-act="exportset" data-id="${esc(s.id)}">Export</button>
    <button class="btn btn-secondary btn-sm" data-act="shareset" data-id="${esc(s.id)}">Share</button>
    <button class="btn btn-secondary btn-sm" data-act="printset" data-id="${esc(s.id)}">Print</button>
    <button class="btn btn-danger btn-sm" data-act="delset" data-id="${esc(s.id)}">Delete</button></div></div>`}).join('')}</div>`
   :emptyHTML({small:true,mascot:false,body:'No sets match'+(FILT.q?' “'+esc(FILT.q)+'”':' that filter')+'.',cta:'<button class="btn btn-secondary btn-sm" data-act="fclear">Clear filters</button>'})}

function renderEdit(id){
  if(id!==undefined){
    if(id==='new')E={id:uid(),title:'',cat:'My sets',qs:[blankQ()]};
    else{const s=S.sets.find(x=>x.id===id);if(!s){renderList();return}E=clone(s);E.qs=E.qs.map(q=>({q:q.q,type:qType(q),pic:q.pic||'',d:q.d,a:[...q.a,'','','',''].slice(0,4),c:q.c,t:q.t==null?'':q.t}));E.cat=catOf(s)}
  }
  const isNew=!S.sets.some(s=>s.id===E.id);
  view.innerHTML=`<div class="page-head"><p><a href="#" data-act="list">← All question sets</a></p><h1>${isNew?'Brand new <span class="hl">set</span>':'Tweak your <span class="hl">set</span>'}</h1>
  <p>Each question needs a prompt, at least two answers, and exactly one correct one. No pressure.</p></div>
  <div class="page-body"><div class="panel" style="margin-bottom:24px"><label class="label" for="setTitle">Set title</label>
   <input class="input" id="setTitle" data-f="title" maxlength="40" placeholder="e.g. Unreasonably Hard Geography" value="${esc(E.title)}"></div>
  <div class="panel" style="margin-bottom:24px"><label class="label" for="setCat">Category</label><select class="input" id="setCat" data-f="cat" style="max-width:260px">${CATS.map(c=>`<option ${E.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
  <div class="panel" style="margin-bottom:24px"><span class="label" id="lblEmoji">Set icon</span><div class="emoji-pick" role="group" aria-labelledby="lblEmoji">${EMOJI_CHOICES.map(e=>`<button type="button" class="${E.emoji===e?'on':''}" aria-pressed="${E.emoji===e}" data-act="seticon" data-v="${e}" aria-label="Icon ${e}">${e}</button>`).join('')}</div></div>
  <details class="panel bulk"><summary><b>Bulk add from text</b> <span class="muted">– paste many questions at once</span></summary>
   <p class="hint">Paste questions and a preview appears. Formats that work:<br>
    <code>Question | Right | Wrong | Wrong</code> (or mark the right one with <code>*</code>: <code>Q | 3 | *4 | 5</code>). Tabs too.<br>
    CSV: <code>Question,Right,Wrong,Wrong</code>. A/B/C/D blocks (put <code>*</code> on the correct line). GIFT: <code>Question {=right ~wrong ~wrong}</code> or <code>Statement {T}</code>.<br>
    Tags still work: <code>[tf] Statement | true</code>, <code>[type] Question | answer</code>, <code>[d=1]</code>–<code>[d=3]</code>, <code>[pic=🐘]</code>..</p>
   <label class="sr-only" for="bulkText">Bulk questions</label><textarea class="textarea import-area" id="bulkText" placeholder="What is 2 + 2? | 4 | 3 | 5&#10;Capital of France? | Paris | Lyon | Nice | Marseille"></textarea>
   <div id="bulkPreview" class="bulk-preview" hidden></div>
   <div class="btn-row" style="margin-top:12px"><button class="btn btn-secondary" data-act="bulkadd" id="bulkBtn">Add these questions</button></div></details>
  <div id="qlist">${E.qs.map(qHTML).join('')}</div>
  <button class="btn btn-secondary" data-act="addq">+ Add another question</button>
  <div class="sticky-save"><div class="editor-actions"><button class="btn btn-ghost" data-act="list">Cancel</button><div class="sp"></div><button class="btn btn-primary btn-lg" id="saveSet" data-act="saveset">Save set</button></div></div></div>`;
  const ta=$('#bulkText');if(ta){ta.addEventListener('input',renderBulkPreview);if(ta.value)renderBulkPreview()}
}
function qHTML(q,i){
  const type=q.type||'mc';
  const seg=`<div class="seg q-type" role="group" aria-label="Question type">${[['mc','Multiple choice'],['tf','True / false'],['type','Type the answer']].map(([v,l])=>`<button type="button" class="${type===v?'on':''}" aria-pressed="${type===v}" data-act="qtype" data-qi="${i}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const pic=`<div class="pic-row"><label for="p${i}">Picture <span class="muted">(emoji, optional)</span></label><input class="input" id="p${i}" data-f="pic" data-qi="${i}" maxlength="24" placeholder="e.g. 🐘" value="${esc(q.pic||'')}"><span class="pic-picks">${PIC_PICKS.map(e=>`<button type="button" data-act="picpick" data-qi="${i}" data-v="${e}" aria-label="Use ${e}">${e}</button>`).join('')}</span></div>`;
  let body;
  if(type==='tf')body=`<div class="tf-edit" role="radiogroup" aria-label="Correct answer">${[0,1].map(j=>`<label class="tf-opt t${j}"><input type="radio" name="c${i}" data-f="c" data-qi="${i}" data-ai="${j}" ${q.c===j?'checked':''}> <b>${TF_ANS[j]}</b> is correct</label>`).join('')}</div>`;
  else if(type==='type')body=`<div class="ans-edit">${[0,1,2,3].map(j=>`<div class="ans-line t${j}"><span class="badge">${j?'+':'✓'}</span><input type="text" data-f="a" data-qi="${i}" data-ai="${j}" maxlength="80" aria-label="${j?'Also accept':'Accepted answer'} ${j||''}" placeholder="${j?'Also accept (optional)':'Accepted answer'}" value="${esc(q.a[j]||'')}"></div>`).join('')}<p class="hint" style="margin:6px 0 0">Capitals, accents, "the/a/an" and small typos are forgiven automatically. Add alternatives for nicknames or spellings.</p></div>`;
  else body=`<div class="ans-edit">${q.a.map((a,j)=>`<div class="ans-line t${j}"><span class="badge">${LETTERS[j]}</span><input type="text" data-f="a" data-qi="${i}" data-ai="${j}" maxlength="80" aria-label="Answer ${LETTERS[j]}" placeholder="Answer ${LETTERS[j]}${j<2?'':' (optional)'}" value="${esc(a)}"><label class="correct"><input type="radio" name="c${i}" data-f="c" data-qi="${i}" data-ai="${j}" ${q.c===j?'checked':''}> Correct</label></div>`).join('')}</div>`;
  const dt=type==='type'?30:DEFAULT_TIME;
  return `<div class="q-edit" data-qi="${i}"><div class="q-edit-h"><b>Question ${i+1}</b><button class="btn btn-danger btn-sm" data-act="delq" data-qi="${i}" aria-label="Delete question ${i+1}">Delete</button></div>${seg}
  <label class="sr-only" for="q${i}">Question ${i+1} text</label><textarea class="textarea" id="q${i}" rows="2" data-f="q" data-qi="${i}" placeholder="${type==='tf'?'Type a statement, e.g. The Sun is a star.':'Type your question'}">${esc(q.q)}</textarea>${pic}${body}
  <div class="time-row"><label for="t${i}">Time limit (seconds)</label><input class="input" id="t${i}" type="number" min="0" max="120" data-f="t" data-qi="${i}" placeholder="${dt}" value="${esc(q.t)}"><span>Blank = ${dt}s, 0 = no limit</span><label for="d${i}" style="margin-left:14px">Level</label><select class="input" id="d${i}" data-f="d" data-qi="${i}" style="width:auto">${[['','Unrated'],[1,'Easy'],[2,'Medium'],[3,'Hard']].map(([v,l])=>`<option value="${v}" ${(q.d||'')===v?'selected':''}>${l}</option>`).join('')}</select></div></div>`}
function onEditInput(e){
  const t=e.target,f=t.dataset.f;if(!f||!E)return;const i=+t.dataset.qi,j=+t.dataset.ai;
  if(f==='title')E.title=t.value;
  else if(f==='cat')E.cat=t.value;else if(f==='d')E.qs[i].d=t.value?+t.value:undefined;else if(f==='pic')E.qs[i].pic=t.value;else if(f==='q')E.qs[i].q=t.value;else if(f==='a')E.qs[i].a[j]=t.value;else if(f==='c')E.qs[i].c=j;else if(f==='t')E.qs[i].t=t.value;
}
function saveSet(){
  const out={id:E.id,title:(E.title||'').trim()||'Untitled set',cat:E.cat||'My sets',qs:[]};
  const old=S.sets.find(s=>s.id===E.id);if(old&&old.builtin)out.builtin=true;
  if(E.emoji)out.emoji=E.emoji;else if(old&&old.emoji)out.emoji=old.emoji;
  $$('.q-edit').forEach(x=>x.classList.remove('bad'));
  for(let i=0;i<E.qs.length;i++){
    const q=E.qs[i];const type=q.type||'mc';const txt=q.q.trim();const ans=q.a.map(a=>a.trim());
    const filled=ans.filter(Boolean).length;
    const bad=m=>{const el=$(`.q-edit[data-qi="${i}"]`);if(el){el.classList.add('bad');el.scrollIntoView({block:'center',behavior:'smooth'})}toast(m)};
    if(!txt){bad(`Question ${i+1} is blank. Even a hard one needs words.`);return}
    let o;
    if(type==='tf')o={q:txt,type:'tf',a:TF_ANS.slice(),c:q.c===1?1:0};
    else if(type==='type'){const acc=ans.filter(Boolean);if(!acc.length){bad(`Question ${i+1} needs at least one accepted answer.`);return}o={q:txt,type:'type',a:acc,c:0}}
    else{
      if(filled<2||!ans[q.c]){bad(filled<2?`Question ${i+1} needs at least 2 answers. It's multiple choice, not single choice.`:`Question ${i+1}: the correct answer can't be empty`);return}
      const idxs=ans.map((a,k)=>a?k:-1).filter(k=>k>=0);o={q:txt,a:idxs.map(k=>ans[k]),c:idxs.indexOf(q.c)}}
    const pic=(q.pic||'').trim();if(pic)o.pic=pic.slice(0,24);if(q.d)o.d=q.d;
    const tv=String(q.t).trim();if(tv!==''){const n=Math.max(0,Math.min(120,parseInt(tv,10)));if(!isNaN(n))o.t=n}
    out.qs.push(o)}
  if(!out.qs.length){toast('Add at least one question');return}
  const k=S.sets.findIndex(s=>s.id===out.id);if(k>=0)S.sets[k]=out;else S.sets.push(out);
  save();toast('Saved! Your students are doomed (in a fun way).');renderList()}

document.addEventListener('input',onEditInput);
document.addEventListener('change',onEditInput);
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
  if(a==='list')e.preventDefault();
  switch(a){
   case'list':renderList();window.scrollTo(0,0);break;
   case'newset':renderEdit('new');window.scrollTo(0,0);break;
   case'restore':{let n=0;ALL_SAMPLES.forEach(s=>{if(!S.sets.find(x=>x.id===s.id)){S.sets.push(clone(s));n++}});save();toast(n?`Restored ${n} sample set${n>1?'s':''}`:'All sample sets are already here');renderList();break}
   case'editset':renderEdit(t.dataset.id);window.scrollTo(0,0);break;
   case'dupset':{const s=clone(S.sets.find(x=>x.id===t.dataset.id));s.id=uid();s.title+=' (copy)';delete s.builtin;S.sets.push(s);save();renderList();toast('Set duplicated');break}
   case'delset':{const s=S.sets.find(x=>x.id===t.dataset.id);confirmBox('Delete this set?',`"${s.title}" and its ${s.qs.length} questions will be gone for good. The questions will be sad.`,'Delete',()=>{S.sets=S.sets.filter(x=>x.id!==s.id);save();renderList()});break}
   case'addq':E.qs.push(blankQ());renderEdit();setTimeout(()=>{const l=$$('.q-edit');l[l.length-1]&&l[l.length-1].scrollIntoView({behavior:'smooth',block:'center'})},30);break;
   case'delq':if(E.qs.length>1){E.qs.splice(+t.dataset.qi,1);renderEdit()}else toast('A set with no questions is just a title. Keep at least one.');break;
   case'saveset':saveSet();break;
   case'backup':openBackup();break;
   case'fav':{const on=toggleFav(t.dataset.id);toast(on?'Added to favourites':'Removed from favourites');renderRows();break}
   case'fcat':FILT.cat=t.dataset.v;renderRows();break;
   case'fclear':FILT.q='';FILT.cat='all';{const ls=$('#listSearch');if(ls)ls.value=''}renderRows();break;
   case'import':openImport();break;
   case'shareset':openShare(t.dataset.id);break;
   case'printset':openPrint(t.dataset.id);break;
   case'exportall':exportSets(S.sets,'quizblox-sets.json');toast(`Exported ${S.sets.length} sets`);break;
   case'exportset':{const s=S.sets.find(x=>x.id===t.dataset.id);if(s){exportSets([s],`quizblox-${slug(s.title)}.json`);toast('Exported "'+s.title+'"')}break}
   case'qtype':{const q=E.qs[+t.dataset.qi],v=t.dataset.v;if((q.type||'mc')!==v){
       if(v==='tf'){q.type='tf';q.a=['True','False','',''];q.c=0}
       else if(v==='type'){const right=(q.a[q.c]||'').trim();q.type='type';q.a=[right,'','',''];q.c=0}
       else{q.type='mc';if(q.a[0]==='True'&&q.a[1]==='False'){q.a=['True','False','','']}else if(!q.a.some(x=>x))q.a=['','','',''];q.c=Math.min(q.c,3)}
       renderEdit()}break}
   case'picpick':{const q=E.qs[+t.dataset.qi];q.pic=(q.pic||'')+t.dataset.v;renderEdit();break}
   case'seticon':E.emoji=E.emoji===t.dataset.v?undefined:t.dataset.v;renderEdit();break;
   case'bulkadd':{const ta=$('#bulkText');const r=parseBulk(ta.value);let qs=r.out;const cbs=$$('.bulk-cb');if(cbs.length){const pick=new Set(cbs.filter(c=>c.checked).map(c=>+c.dataset.i));qs=r.out.filter((_,i)=>pick.has(i))}
     if(!qs.length){toast('Nothing to add. Use: Question | Right answer | Wrong | Wrong — or CSV, A/B/C/D blocks, or GIFT.');break}
     if(E.qs.length===1&&!E.qs[0].q.trim()&&!E.qs[0].a.some(x=>x.trim()))E.qs=[];E.qs.push(...qs.map(q=>Object.assign(blankQ(),q)));renderEdit();toast(`Added ${qs.length} question${qs.length>1?'s':''}`+(r.skipped?` (${r.skipped} line${r.skipped>1?'s':''} skipped)`:''));
     setTimeout(()=>{const l=$$('.q-edit');l[l.length-qs.length]&&l[l.length-qs.length].scrollIntoView({behavior:'smooth',block:'start'})},30);break}
  }
});
{const h0=location.hash;if(h0==='#new')renderEdit('new');else{renderList();checkIncomingShare(h0)}}
window.addEventListener('hashchange',()=>{if(/^#share=/.test(location.hash)){if(!E)renderList();checkIncomingShare()}});
window.QBE={buildPrint,buildSheetFor,shareLink,parseShare,parseBulk,parsePipes,parseCsv,parseGift,parseBlocks,closePreview};
