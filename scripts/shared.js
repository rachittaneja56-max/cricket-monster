(()=>{
 const menu=document.getElementById('menuBtn'),nav=document.getElementById('mainNav');
 function close(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation')}
 menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){close();menu.focus()}});
 document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))close()});
 nav?.addEventListener('click',e=>{if(e.target.closest('a'))close()});
})();
