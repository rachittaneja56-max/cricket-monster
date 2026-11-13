(() => {
  const scene = document.querySelector('.stadium-scene');
  const video = document.getElementById('stadiumVideo');
  if (!scene || !video) return;

  const desktop = matchMedia('(min-width: 851px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let inView = false;
  let suspended = false;
  let blocked = false;
  let failed = false;
  let revision = 0;
  let playPending = false;

  const eligible = () => desktop.matches && !reduced.matches &&
    !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType || '');
  const shouldPlay = () => eligible() && inView && !document.hidden &&
    !suspended && !blocked && !failed;

  async function sync() {
    const request = ++revision;
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
      if (playPending || !video.paused) return;
      playPending = true;
      try {
        await video.play();
        if (!shouldPlay()) video.pause();
      } catch {
        if (request === revision) blocked = true;
        // Keep the poster visible if the browser blocks autoplay.
      } finally { playPending = false; }
      if (request !== revision && shouldPlay() && video.paused) { sync(); return; }
    } else video.pause();
  }

  video.addEventListener('playing', () => {
    if (!shouldPlay()) { video.pause(); return; }
    scene.classList.add('is-video-ready');
  });
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
