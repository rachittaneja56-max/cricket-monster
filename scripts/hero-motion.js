(() => {
  const scene = document.querySelector('.stadium-scene');
  const video = document.getElementById('stadiumVideo');
  const control = document.getElementById('heroMotionControl');
  if (!scene || !video || !control) return;

  const desktop = matchMedia('(min-width: 851px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let inView = false;
  let suspended = false;
  let blocked = false;
  let failed = false;
  let userPaused = false;
  let revision = 0;
  let playPending = false;
  try { userPaused = sessionStorage.getItem('cm-hero-paused') === 'true'; } catch {}

  const eligible = () => desktop.matches && !reduced.matches &&
    !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType || '');
  const shouldPlay = () => eligible() && inView && !document.hidden &&
    !suspended && !userPaused && !blocked && !failed;

  function updateControl() {
    const playing = !video.paused;
    control.textContent = playing ? 'Pause motion' : 'Play motion';
    control.setAttribute('aria-label', playing ? 'Pause stadium animation' : 'Play stadium animation');
  }

  async function sync() {
    const request = ++revision;
    control.hidden = !eligible() || failed;
    if (!eligible()) {
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      scene.classList.remove('is-video-ready');
    } else if (shouldPlay()) {
      if (!video.hasAttribute('src')) {
        video.src = video.dataset.src;
        video.muted = true;
      }
      if (playPending || !video.paused) { updateControl(); return; }
      playPending = true;
      try {
        await video.play();
        if (!shouldPlay()) video.pause();
      } catch {
        if (request === revision) blocked = true;
        // The poster and an explicit play control remain available.
      } finally { playPending = false; }
      if (request !== revision && shouldPlay() && video.paused) { sync(); return; }
    } else video.pause();
    updateControl();
  }

  control.addEventListener('click', () => {
    userPaused = !video.paused;
    blocked = false;
    try { sessionStorage.setItem('cm-hero-paused', String(userPaused)); } catch {}
    sync();
  });
  video.addEventListener('playing', () => {
    if (!shouldPlay()) { video.pause(); return; }
    scene.classList.add('is-video-ready');
    updateControl();
  });
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => {
    if (!video.hasAttribute('src')) return;
    failed = true;
    scene.classList.remove('is-video-ready');
    sync();
  });
  desktop.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  connection?.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { suspended = true; sync(); });
  window.addEventListener('pageshow', () => { suspended = false; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.05;
      sync();
    }, {threshold: 0.05}).observe(scene);
  } else inView = true;
  sync();
})();
