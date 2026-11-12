(()=>{
 const choices=[...document.querySelectorAll('[data-team]')];
 choices.forEach(btn=>btn.addEventListener('click',()=>{choices.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));document.getElementById('continuePicks').href='/match-monster/?winner='+btn.dataset.team;document.getElementById('pick-note').textContent=btn.textContent.trim()+' selected. Continue to complete your picks.'}));
 const track=document.getElementById('feed-track'),prev=document.getElementById('feed-prev'),next=document.getElementById('feed-next');
 function update(){prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2}
 function move(n){track.scrollBy({left:n*(track.querySelector('article').getBoundingClientRect().width+18),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));track.addEventListener('scroll',update);window.addEventListener('resize',update);track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});update();
})();
