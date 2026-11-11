/* QuizBlox – landing page extras */
(function(){
  const w=document.getElementById('dailyWrap');if(w)w.innerHTML=dailyCard();
  const h=document.querySelector('.hero-quiet');
  if(h&&!(S.games>0)&&!((S.history||[]).length)){
    const a=document.createElement('a');
    a.id='demoHome';a.href='play.html?demo=1';a.textContent='Try a 30-second demo';
    h.appendChild(document.createTextNode(' · '));
    h.appendChild(a);
  }
})();
