/* QuizBlox – landing page extras */
(function(){const w=document.getElementById('dailyWrap');if(w)w.innerHTML='<div class="daily-row">'+dailyCard()+mixCard()+weekCard()+streakCard()+'</div>'})();
(function(){if(S.games)return;const row=document.querySelector('.hero .btn-row');if(!row||document.getElementById('demoHome'))return;const a=document.createElement('a');a.id='demoHome';a.className='btn btn-secondary btn-lg';a.href='play.html?demo=1';a.textContent='Try a 30-second demo';row.appendChild(a)})();
(function(){
  const ev=typeof weekEvent==='function'&&weekEvent();
  const hero=document.querySelector('.hero .btn-row');
  if(!ev||!hero||document.getElementById('heroEvent'))return;
  const d=document.createElement('a');
  d.id='heroEvent';d.className='hero-event';
  d.href='play.html?set='+encodeURIComponent(ev.set.id)+'&mode='+ev.mode+'&week=1';
  d.innerHTML='<span class="he-e" aria-hidden="true">'+ev.emoji+'</span><span class="he-t"><b>This week: '+ev.theme+'</b> '+ev.set.title+' · '+(MODES[ev.mode]?MODES[ev.mode].name:'')+'</span><span class="he-go">Play the event</span>';
  hero.insertAdjacentElement('afterend',d);
})();
(function(){const el=document.getElementById('qotdMount');if(!el||typeof qotdCard!=='function')return;el.innerHTML=qotdCard();bindQotd(el)})();
(function(){const el=document.getElementById('tourneyMount');if(!el||typeof tourneyCard!=='function')return;el.innerHTML=tourneyCard()})();
