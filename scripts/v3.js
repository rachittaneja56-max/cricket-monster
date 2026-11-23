(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;

  const params = new URLSearchParams(location.search);
  const isGuest = params.has('guest');
  // Leaderboard rows from 4th place down. "You" sits at its real rank: inside the list
  // when it falls there (others shift down), otherwise after a gap row at the end.
  const rankRows = (board, row) => {
    const [rank, score, time] = board.me;
    const rows = board.rows.map(([name, s, t]) => [name, s, t, false]);
    const me = ['You · Arjun K.', score, time, true];
    const inList = rank <= rows.length + 1;
    if (inList) rows.splice(rank - 1, 0, me);
    let html = rows.slice(3).map(([name, s, t, isMe], i) => row(i + 4, name, s, t, isMe)).join('');
    if (!inList) html += `<li class="gap" aria-hidden="true"><span>···</span></li>` + row(rank, ...me);
    return html;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatCount = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') $$('.modal:not([hidden])').forEach((modal) => closeModal(modal));
  });

  let lastFocused = null;
  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('textarea, input:not([type=radio]), button:not([data-close-modal])')?.focus();
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocused?.focus?.();
  }
  $$('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(button.closest('.modal'))));
  $$('.modal').forEach((modal) => modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  }));

  // ---------- Feed ----------
  const TYPE_LABELS = { discussion: 'Discussion', performance: 'Performance', opinion: 'Opinion', meme: 'Meme' };
  // Cricket icons per post type: ball, bat, the umpire's raised finger, and a grin for memes.
  const TYPE_ICONS = {
    discussion: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.3 4.4c2.2 2.4 2.2 12.8 0 15.2M15.7 4.4c-2.2 2.4-2.2 12.8 0 15.2"/></svg>',
    performance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 3.2l6.2 6.2-8.6 8.6a2 2 0 0 1-2.8 0L6 14.6a2 2 0 0 1 0-2.8z"/><path d="M7.4 16.6 3.2 20.8"/></svg>',
    opinion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 12V4.5a1.5 1.5 0 0 1 3 0V12"/><path d="M13.5 10.5a1.5 1.5 0 0 1 3 0V12a1.5 1.5 0 0 1 3 0v2.5A6.5 6.5 0 0 1 13 21h-1a6 6 0 0 1-5.3-3.2L5 14.5a1.5 1.5 0 0 1 2.5-1.6l3 2.6"/></svg>',
    meme: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg>',
  };
  const PROMPTS = ['Who’s your player of the match?', 'Best spell you’ve seen this week?', 'Your XI for the next Test?', 'Which chase will you remember?', 'Hot take on the impact-player rule?'];
  const posts = [
    { id: 'impact-player', initials: 'RM', tone: 'a2', author: 'Riya M.', handle: 'riya_bowls', minutes: 18, type: 'discussion',
      title: 'Has the impact-player rule changed the soul of the IPL?',
      text: 'Teams are more flexible and chases feel open till the last over — but are we losing the genuine all-rounder? Where do you stand?',
      likes: 128, comments: 47 },
    { id: 'spell', initials: 'AK', tone: 'a1', author: 'Arjun K.', handle: 'arjun_k_42', minutes: 52, type: 'performance',
      title: 'The spell that turned the match.',
      text: '4-0-19-3 through the middle overs. Set the batter up with two outswingers, then the yorker. Masterclass.',
      likes: 86, comments: 21, image: '/assets/stadium.webp', alt: 'A floodlit cricket ground at night' },
    { id: 'meme-dls', initials: 'NK', tone: 'a3', author: 'Nikhil K.', handle: 'nikhil_cover', minutes: 95, type: 'meme',
      title: 'Me explaining DLS to my family',
      text: 'Every single rain delay.',
      meme: ['Target revised to 147', 'from 31 balls. Trust me.'], likes: 642, comments: 58 },
    { id: 'fielding', initials: 'DS', tone: 'a4', author: 'Dev S.', handle: 'devsays', minutes: 140, type: 'opinion',
      title: 'Fielding is still the most underrated skill.',
      text: 'We celebrate big scores and five-fors, but a direct hit from deep midwicket changes games just as often. Saving 15 runs is a fifty.',
      likes: 72, comments: 29 },
    { id: 'openers', initials: 'PP', tone: 'a5', author: 'Priya P.', handle: 'priya_pitchside', minutes: 210, type: 'discussion',
      title: 'Will India’s new opening pair work long term?',
      text: 'One aggressive, one anchor. Powerplay numbers look great but I want to see them against quality swing in England.',
      likes: 214, comments: 312 },
    { id: 'keeper', initials: 'AS', tone: 'a3', author: 'Anish S.', handle: 'anish_stumped', minutes: 320, type: 'performance',
      title: 'That stumping was 0.08 seconds.',
      text: 'Ball hit the gloves, bails were off before the batter even turned. Best hands in world cricket right now.',
      likes: 391, comments: 44 },
    { id: 'test-cricket', initials: 'SG', tone: 'a2', author: 'Sneha G.', handle: 'sneha_slip', minutes: 460, type: 'opinion',
      title: 'Test cricket is having its best era.',
      text: 'Results in almost every match, aggressive declarations, and fourth-innings chases that actually go down to the wire.',
      likes: 157, comments: 63 },
    { id: 'meme-nets', initials: 'VK', tone: 'a4', author: 'Vikram K.', handle: 'vik_yorker', minutes: 600, type: 'meme',
      title: 'Net bowlers be like',
      text: 'One good ball and you start practising your celebration.',
      meme: ['Bowled him once', 'in nets. Selection pending.'], likes: 523, comments: 37 },
  ];

  const timeAgo = (minutes) => (minutes < 1 ? 'now' : minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`);
  const icons = {
    comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>',
    // Applause: two raised palms with motion lines (likes, labelled as applause)
    like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 21a5.5 5.5 0 0 1-5.5-5.5V10a1.4 1.4 0 0 1 2.8 0v2.5"/><path d="M6.8 10V6.5a1.4 1.4 0 0 1 2.8 0V11"/><path d="M9.6 9.5V5a1.4 1.4 0 0 1 2.8 0v6"/><path d="M12.4 8.5a1.4 1.4 0 0 1 2.8 0V15a6 6 0 0 1-5.7 6"/><path d="M17 3.5l.8-1.3M19.6 6.2l1.4-.6M19.5 9.8h1.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  };

  function postMarkup(post) {
    const media = post.image
      ? `<img class="post-image" src="${post.image}" alt="${escapeHtml(post.alt || '')}" loading="lazy">`
      : post.meme ? `<div class="post-meme" role="img" aria-label="Meme: ${escapeHtml(post.meme.join(' '))}">${escapeHtml(post.meme[0])}<span>${escapeHtml(post.meme[1])}</span></div>` : '';
    return `<article class="post is-${post.type}" data-post-id="${post.id}" aria-labelledby="t-${post.id}">
      <div class="post-head">
        <span class="avatar ${post.tone || ''}" aria-hidden="true">${escapeHtml(post.initials)}</span>
        <span class="post-who"><strong class="post-name">${escapeHtml(post.author)}</strong><span class="post-time">${timeAgo(post.minutes)}</span></span>
        <span class="type-chip type-${post.type}">${TYPE_ICONS[post.type]}${TYPE_LABELS[post.type]}</span>
        <button class="post-menu" data-report aria-label="More options for post by ${escapeHtml(post.author)}">${icons.more}</button>
      </div>
      <p class="post-text"><strong id="t-${post.id}">${escapeHtml(post.title)}</strong>${post.text && post.text !== post.title ? escapeHtml(post.text) : ''}</p>
      ${media}
      <div class="post-actions">
        <button data-like aria-pressed="${post.liked ? 'true' : 'false'}" aria-label="Applaud, ${post.likes} applause">${icons.like}<span>${formatCount(post.likes)}</span></button>
        <button data-comments aria-expanded="false" aria-label="${post.comments} replies">${icons.comment}<span>${formatCount(post.comments)}</span></button>
        <button data-share aria-label="Share post">${icons.share}<span class="share-label">Share</span></button>
      </div>
      <div class="comments-panel" data-comments-panel hidden>
        <form class="comment-form" data-comment-form><label class="sr-only" for="c-${post.id}">Write a reply</label><input class="input" id="c-${post.id}" maxlength="500" placeholder="Add your reply"><button class="btn btn-primary btn-small">Reply</button></form>
        <p class="comment"><strong>Dev S.</strong> <span class="muted">· 12m</span><br>The planning was spot on. Pressure built over several overs.</p>
        <p class="comment"><strong>Neha M.</strong> <span class="muted">· 9m</span><br>That was the moment the game turned for me.</p>
      </div>
    </article>`;
  }

  const promoDaily = `<div class="promo"><a class="promo-card" href="/daily-monster/"><span class="label">Daily Monster · Today</span><h3>Five questions. Ninety seconds.</h3><div class="promo-meta"><span>Closes 23:59 IST</span><span>You were #18</span></div><span class="text-link">Play today’s five →</span></a></div>`;
  const promoMatch = '';
  const welcomeCard = `<div class="welcome-card"><span class="label">Welcome to Cricket Monster</span><h2>Every fan has a take. What’s yours?</h2><p>Reading is free. Sign in with your email to post, applaud and reply, and to play Daily Monster and Match Monster.</p><div class="welcome-actions"><a class="btn btn-primary" href="/sign-in/">Join free</a><a class="btn" href="/daily-monster/">Try today’s quiz</a></div></div>`;
  const skeletons = Array.from({ length: 3 }, () => '<div class="skeleton" aria-hidden="true"><div class="sk-row"><span class="sk sk-avatar"></span><div class="sk sk-line w40"></div></div><div class="sk sk-line w90"></div><div class="sk sk-line w70"></div></div>').join('');
  const EMPTY = {
    all: 'No posts yet. Open the batting.',
    discussion: 'No discussions yet. Start one.',
    performance: 'Seen a special innings or spell? Be the first to post it.',
    opinion: 'No hot takes yet. Got one?',
    meme: 'No memes yet. The dressing room is waiting.',
  };

  let activeFilter = 'all';
  let sortMode = 'newest';
  let feedContainer = null;
  let feedLimit = 0;

  function renderFeed({ loading = false } = {}) {
    const container = feedContainer;
    if (!container) return;
    container.setAttribute('aria-busy', String(loading));
    if (loading) { container.innerHTML = skeletons; return; }
    if (params.get('state') === 'error') {
      container.innerHTML = `<div class="feed-state" role="alert"><h2>Rain delay</h2><p>We couldn’t load the feed. Check your connection and try again.</p><button class="btn btn-primary" data-retry>Try again</button></div>`;
      $('[data-retry]', container).addEventListener('click', () => { params.delete('state'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '')); renderFeed({ loading: true }); setTimeout(() => renderFeed(), 450); });
      return;
    }
    let visible = activeFilter === 'all' ? [...posts] : posts.filter((post) => post.type === activeFilter);
    if (params.get('state') === 'empty') visible = [];
    visible.sort(sortMode === 'liked' ? (a, b) => b.likes - a.likes : (a, b) => a.minutes - b.minutes);
    if (!visible.length) {
      container.innerHTML = `<div class="feed-state"><h2>Bad light</h2><p>${EMPTY[activeFilter]}</p><button class="btn btn-primary" data-open-composer>Write a post</button>${activeFilter === 'all' ? '' : ' <button class="btn" data-filter-reset>Show all posts</button>'}</div>`;
    } else {
      if (feedLimit) visible = visible.slice(0, feedLimit);
      const parts = visible.map(postMarkup);
      if (activeFilter === 'all' && !feedLimit && parts.length > 2) parts.splice(2, 0, promoDaily);
      container.innerHTML = (isGuest && !feedLimit ? welcomeCard : '') + parts.join('') + (feedLimit ? '' : '<p class="end-of-feed">You’re all caught up.</p>');
    }
    bindFeed(container);
  }

  function requireSignIn() {
    if (!isGuest) return false;
    location.href = '/sign-in/';
    return true;
  }

  function bindFeed(container) {
    $$('[data-like]', container).forEach((button) => button.addEventListener('click', () => {
      if (requireSignIn()) return;
      const post = posts.find((p) => p.id === button.closest('.post').dataset.postId);
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      button.setAttribute('aria-pressed', String(post.liked));
      button.setAttribute('aria-label', `Applaud, ${post.likes} applause`);
      $('span', button).textContent = formatCount(post.likes);
    }));
    $$('[data-comments]', container).forEach((button) => button.addEventListener('click', () => {
      const panel = $('[data-comments-panel]', button.closest('.post'));
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) $('input', panel)?.focus();
    }));
    $$('[data-comment-form]', container).forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (requireSignIn()) return;
      const input = $('input', form);
      const value = input.value.trim();
      if (!value) return;
      form.insertAdjacentHTML('afterend', `<p class="comment"><strong>Arjun K.</strong> <span class="muted">· now</span><br>${escapeHtml(value)}</p>`);
      input.value = '';
      const post = posts.find((p) => p.id === form.closest('.post').dataset.postId);
      post.comments += 1;
      $('[data-comments] span', form.closest('.post')).textContent = formatCount(post.comments);
    }));
    $$('[data-share]', container).forEach((button) => button.addEventListener('click', async () => {
      const article = button.closest('.post');
      const title = $('.post-text strong', article)?.textContent || 'Cricket Monster';
      const url = location.origin + '/feed/#' + article.dataset.postId;
      try {
        if (navigator.share) await navigator.share({ title, url });
        else { await navigator.clipboard.writeText(url); $('.share-label', button).textContent = 'Copied'; setTimeout(() => { $('.share-label', button).textContent = 'Share'; }, 1600); }
      } catch {}
    }));
    $$('[data-report]', container).forEach((button) => button.addEventListener('click', () => {
      if (requireSignIn()) return;
      openModal($('#reportModal'));
    }));
    $$('[data-open-composer]', container).forEach((button) => button.addEventListener('click', openComposer));
    $('[data-filter-reset]', container)?.addEventListener('click', () => setFilter('all'));
  }

  function setFilter(filter) {
    activeFilter = filter;
    $$('[data-filter]').forEach((chip) => {
      const on = chip.dataset.filter === filter;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-pressed', String(on));
    });
    renderFeed();
  }

  function initFeed(containerSelector) {
    feedContainer = $(containerSelector);
    if (!feedContainer) return;
    if (isGuest) $$('.composer').forEach((el) => { el.hidden = true; });
    $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));
    // Rotate cricket prompts in the post box
    const prompt = $('[data-prompt]');
    if (prompt && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let i = 0;
      setInterval(() => {
        i = (i + 1) % PROMPTS.length;
        prompt.textContent = PROMPTS[i];
        $('#postText')?.setAttribute('placeholder', PROMPTS[i]);
      }, 4000);
    }
    $$('[data-sort]').forEach((button) => button.addEventListener('click', () => {
      sortMode = sortMode === 'newest' ? 'liked' : 'newest';
      const label = sortMode === 'newest' ? 'Newest' : 'Most applauded';
      $('span', button).textContent = label;
      button.setAttribute('aria-label', `Sort posts: ${label}`);
      renderFeed();
    }));
    renderFeed({ loading: true });
    setTimeout(() => renderFeed(), 450);
  }

  function openComposer() {
    if (requireSignIn()) return;
    openModal($('#composerModal'));
  }

  function initComposer() {
    const modal = $('#composerModal');
    if (!modal) return;
    $$('[data-open-composer]').forEach((button) => button.addEventListener('click', openComposer));
    const textarea = $('#postText', modal);
    const count = $('[data-char-count]', modal);
    textarea?.addEventListener('input', () => { count.textContent = String(textarea.value.length); textarea.setCustomValidity(''); });
    $$('#postTypes .chip', modal).forEach((chip) => chip.addEventListener('click', () => {
      $$('#postTypes .chip', modal).forEach((item) => { item.classList.toggle('active', item === chip); item.setAttribute('aria-pressed', String(item === chip)); });
    }));
    $('#publishPost', modal)?.addEventListener('click', () => {
      const value = textarea.value.trim();
      if (!value) {
        textarea.setCustomValidity('Write something before posting.');
        textarea.reportValidity();
        return;
      }
      const type = $('#postTypes .chip.active', modal)?.dataset.type || 'discussion';
      const lines = value.split(/\n/);
      posts.unshift({
        id: 'local-' + Date.now(), initials: 'AK', tone: 'a1', author: 'Arjun K.', handle: 'arjun_k_42', minutes: 0, type,
        title: lines[0].slice(0, 120), text: lines.slice(1).join(' ').trim(), likes: 0, comments: 0,
      });
      textarea.value = '';
      count.textContent = '0';
      closeModal(modal);
      sortMode = 'newest';
      $$('[data-sort]').forEach((button) => { $('span', button).textContent = 'Newest'; button.setAttribute('aria-label', 'Sort posts: Newest'); });
      setFilter('all');
      feedContainer?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  $('#submitReport')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    button.textContent = 'Report submitted';
    setTimeout(() => { closeModal($('#reportModal')); button.textContent = 'Submit report'; }, 700);
  });

  // Live countdowns (illustrative: counts down from the seconds in data-countdown)
  // Elements are looked up on every tick, so countdowns rendered later (Match Monster) keep ticking too.
  const pageOpenedAt = Date.now();
  const fmtClock = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  const tickCountdowns = () => $$('[data-countdown]').forEach((el) => {
    const left = Math.max(0, Number(el.dataset.countdown) - Math.floor((Date.now() - pageOpenedAt) / 1000));
    el.textContent = fmtClock(left);
  });
  setInterval(tickCountdowns, 1000);
  setTimeout(tickCountdowns, 0);

  if (page === 'home') {
    feedLimit = 3;
    initFeed('#homePosts');

    // Header turns solid once the hero scrolls away
    const header = $('.site-header');
    const onScroll = () => header?.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hero video: right poster per screen; poster only for reduced motion or data saver
    const video = $('#heroVideo');
    if (video) {
      const mobile = matchMedia('(max-width: 767px)').matches;
      video.poster = mobile ? '/assets/hero-shot-mobile-poster.webp' : '/assets/hero-shot-poster.webp';
      const saveData = navigator.connection?.saveData;
      if (saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.removeAttribute('autoplay');
        video.pause();
        video.hidden = true;
        $$('[data-lazy-video]').forEach((v) => { v.hidden = true; });
      } else {
        video.play?.().catch(() => {});
        // Night-ground footage further down: load and play only when it scrolls into view.
        const lazy = $$('[data-lazy-video]');
        if (lazy.length && 'IntersectionObserver' in window) {
          const io = new IntersectionObserver((entries) => entries.forEach((e) => {
            if (e.isIntersecting) e.target.play?.().catch(() => {}); else e.target.pause();
          }), { threshold: .2 });
          lazy.forEach((v) => io.observe(v));
        }
      }
    }

    // Match Monster module: winner pick shares storage with the Match Monster page
    const pickKey = 'cm-v3-match-picks';
    let picks = {};
    try { picks = JSON.parse(localStorage.getItem(pickKey) || '{}'); } catch {}
    const status = $('#homePickStatus');
    const renderHomePick = () => {
      $$('[data-home-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.homePick === picks.winner)));
      if (picks.winner && status) status.textContent = `Saved: ${picks.winner} to win. ${Object.values(picks).filter(Boolean).length} of 5 picked.`;
    };
    $$('[data-home-pick]').forEach((button) => button.addEventListener('click', () => {
      picks.winner = button.dataset.homePick;
      try { localStorage.setItem(pickKey, JSON.stringify(picks)); } catch {}
      renderHomePick();
    }));
    renderHomePick();

    // Daily Monster warm-up question
    const feedback = $('#warmupFeedback');
    $$('[data-warmup]').forEach((button) => button.addEventListener('click', () => {
      const options = $$('[data-warmup]');
      if (options.some((b) => b.disabled)) return;
      const right = button.hasAttribute('data-correct');
      options.forEach((b) => { b.disabled = true; if (b.hasAttribute('data-correct')) b.classList.add('correct'); });
      if (!right) button.classList.add('wrong');
      const ball = $('.module .balls span');
      ball?.classList.remove('now'); ball?.classList.add(right ? 'good' : 'bad');
      if (feedback) feedback.textContent = right ? 'Correct, +10. A bowler can bowl at most four overs in a T20 innings.' : 'Not quite. The limit is four overs per bowler in a T20 innings.';
    }));
  }
  if (page === 'feed') {
    initFeed('#feedPosts');
    initComposer();
  }

  if (page === 'auth') {
    const form = $('#magicLinkForm');
    const formView = $('#authForm');
    const inbox = $('#inboxView');
    const expired = $('#expiredView');
    const show = (view) => [formView, inbox, expired].forEach((item) => { item.hidden = item !== view; });
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      $('#sentEmail').textContent = $('#email').value;
      show(inbox);
    });
    $('#differentEmail')?.addEventListener('click', () => show(formView));
    $('#newLink')?.addEventListener('click', () => show(formView));
    // Link states for review: /sign-in/?state=expired or ?state=invalid
    const linkState = params.get('state');
    if (linkState === 'expired' || linkState === 'invalid') {
      if (linkState === 'invalid') {
        $('#linkTitle').textContent = 'This link isn’t valid';
        $('#linkText').textContent = 'It may have been used already or copied incompletely. Get a new one to continue.';
      }
      show(expired);
    }
  }

  if (page === 'profile') {
    const form = $('#profileForm');
    const username = $('#username');
    try { username.value = localStorage.getItem('cm-username') || username.value; } catch {}
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      try { localStorage.setItem('cm-username', username.value.trim()); } catch {}
      const toast = $('#profileToast');
      toast.hidden = false;
      setTimeout(() => { toast.hidden = true; }, 2200);
    });
  }

  if (page === 'daily') {
    const questions = [
      { q: 'How many legal deliveries make up a standard over?', options: ['4', '5', '6', '8'], answer: 2, explanation: 'A standard over has six legal deliveries.' },
      { q: 'What does LBW stand for?', options: ['Leg Before Wicket', 'Long Ball Wicket', 'Last Batter Wins', 'Leg By Wide'], answer: 0, explanation: 'LBW is short for Leg Before Wicket.' },
      { q: 'How many overs does each side normally get in a T20 innings?', options: ['10', '20', '40', '50'], answer: 1, explanation: 'Each side normally gets 20 overs in a T20 innings.' },
      { q: 'Which dismissal is not credited to the bowler?', options: ['Bowled', 'Caught', 'LBW', 'Run out'], answer: 3, explanation: 'A run out is a fielding dismissal, so the bowler doesn’t get the wicket.' },
      { q: 'Which method revises a target after rain in limited-overs cricket?', options: ['Boundary count', 'DLS method', 'Net run rate', 'Super Over'], answer: 1, explanation: 'The Duckworth–Lewis–Stern (DLS) method revises targets after interruptions.' },
    ];
    const TOTAL = 90;
    const KEYS = ['A', 'B', 'C', 'D'];
    const views = [$('#dailyIntro'), $('#dailyQuiz'), $('#dailyResult'), $('#dailyLeaderboard')];
    const show = (view) => { views.forEach((item) => { item.hidden = item !== view; }); scrollTo({ top: 0 }); };
    const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Intro: today's IST date and time left until the quiz closes at midnight IST
    const istNow = () => new Date(Date.now() + 5.5 * 3600 * 1000);
    const dateLabel = istNow().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    $('#dmDate').textContent = `Daily Monster · ${dateLabel}`;
    const tickCloses = () => {
      const n = istNow();
      const left = 86400 - (n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds());
      $('#dmCloses').textContent = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((v) => String(v).padStart(2, '0')).join(':');
    };
    tickCloses();
    setInterval(tickCloses, 1000);

    let index = 0;
    let answers = Array(questions.length).fill(null);
    let remaining = TOTAL;
    let startedAt = 0;
    let timerId = null;

    const renderBalls = () => {
      $('#dailyBalls').innerHTML = questions.map((_, i) => `<span class="${i === index ? 'now' : answers[i] !== null ? 'done' : ''}"></span>`).join('');
    };
    const renderTimer = () => {
      $('#dailyTimer').textContent = mmss(remaining);
      const low = remaining <= 10;
      $('#dailyTimer').classList.toggle('low', low);
      const bar = $('#dailyTimebar');
      bar.style.width = `${(remaining / TOTAL) * 100}%`;
      bar.classList.toggle('low', low);
    };
    const renderQuestion = () => {
      const question = questions[index];
      $('#dailyCounter').textContent = `Question ${index + 1} of ${questions.length}`;
      $('#dailyQuestion').textContent = question.q;
      $('#dailyAnswers').innerHTML = question.options.map((option, i) => `<button class="quiz-option dm-option" aria-pressed="${answers[index] === i}" data-answer="${i}"><span class="key">${KEYS[i]}</span>${escapeHtml(option)}</button>`).join('');
      $$('[data-answer]').forEach((button) => button.addEventListener('click', () => {
        answers[index] = Number(button.dataset.answer);
        renderQuestion();
      }));
      $('#dailyPrevious').disabled = index === 0;
      $('#dailyNext').disabled = answers[index] === null;
      $('#dailyNext').textContent = index === questions.length - 1 ? 'Submit' : 'Next';
      renderBalls();
    };
    const tick = () => {
      remaining = Math.max(0, TOTAL - Math.floor((Date.now() - startedAt) / 1000));
      renderTimer();
      if (remaining === 0) finishQuiz();
    };
    const finishQuiz = () => {
      clearInterval(timerId);
      const results = questions.map((question, i) => answers[i] === question.answer);
      const correct = results.filter(Boolean).length;
      const elapsed = Math.min(TOTAL, Math.round((Date.now() - startedAt) / 1000));
      $('#dailyCorrect').textContent = `${correct} of 5 correct`;
      $('#dailyTime').textContent = mmss(elapsed);
      $('#dailyOver').innerHTML = results.map((good, i) => `<span class="over-ball ${good ? 'good' : 'bad'}"><span class="dot"></span><span class="num">Q${i + 1}</span></span>`).join('');
      $('#dailyReview').innerHTML = questions.map((question, i) => {
        const good = results[i];
        const yours = answers[i] === null ? 'No answer' : question.options[answers[i]];
        return `<details class="review-row ${good ? 'good' : 'bad'}"><summary><span class="over-ball ${good ? 'good' : 'bad'}"><span class="dot"></span></span>Q${i + 1}. ${escapeHtml(question.q)}</summary><div class="review-body">${good ? '' : `<p><strong>You:</strong> ${escapeHtml(yours)}</p>`}<p><strong>Answer:</strong> ${escapeHtml(question.options[question.answer])}</p><p class="muted">${escapeHtml(question.explanation)}</p></div></details>`;
      }).join('');
      show($('#dailyResult'));
      // Count the score up
      const target = correct * 10;
      const scoreEl = $('#dailyScore');
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0) { scoreEl.textContent = String(target); }
      else {
        const t0 = performance.now();
        const step = (now) => { const p = Math.min(1, (now - t0) / 700); scoreEl.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }
      $('#shareDaily').dataset.share = `Daily Monster ${dateLabel}: ${target}/50 in ${mmss(elapsed)}\n${results.map((g) => (g ? '🟩' : '🟥')).join('')}`;
    };
    $('#startDaily')?.addEventListener('click', () => {
      index = 0; answers = Array(questions.length).fill(null); remaining = TOTAL; startedAt = Date.now();
      show($('#dailyQuiz')); renderQuestion(); renderTimer(); clearInterval(timerId); timerId = setInterval(tick, 250);
    });
    $('#dailyPrevious')?.addEventListener('click', () => { if (index > 0) { index--; renderQuestion(); } });
    $('#dailyNext')?.addEventListener('click', () => { if (answers[index] === null) return; if (index < questions.length - 1) { index++; renderQuestion(); } else finishQuiz(); });
    $('#dailyRestart')?.addEventListener('click', () => show($('#dailyIntro')));
    $('#shareDaily')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const text = button.dataset.share || 'Daily Monster';
      try {
        if (navigator.share) await navigator.share({ title: 'Daily Monster', text, url: location.origin + '/daily-monster/' });
        else { await navigator.clipboard.writeText(`${text}\n${location.origin}/daily-monster/`); button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Share score'; }, 1600); }
      } catch {}
    });

    // Leaderboard: podium, list and a pinned "You" row per period
    const BOARDS = {
      day: { unit: '/50', note: 'Ties go to the faster time.', rows: [['Riya M.', 50, '01:03'], ['Dev S.', 50, '01:07'], ['Nikhil K.', 50, '01:09'], ['Anish S.', 50, '01:12'], ['Priya P.', 50, '01:14'], ['Sneha G.', 50, '01:19'], ['Vikram K.', 50, '01:22'], ['Neha M.', 40, '00:58']], me: [18, 40, '01:27'] },
      week: { unit: 'pts', note: 'Monday to Sunday. Ties go to the faster total time.', rows: [['Dev S.', 340, '07:41'], ['Riya M.', 330, '07:12'], ['Priya P.', 320, '08:03'], ['Nikhil K.', 310, '07:55'], ['Anish S.', 300, '08:20'], ['Sneha G.', 300, '08:41'], ['Vikram K.', 290, '08:02'], ['Neha M.', 280, '07:30']], me: [24, 250, '08:44'] },
      month: { unit: 'pts', note: 'This calendar month (IST).', rows: [['Riya M.', 1180, ''], ['Dev S.', 1160, ''], ['Priya P.', 1110, ''], ['Anish S.', 1090, ''], ['Nikhil K.', 1070, ''], ['Neha M.', 1040, ''], ['Sneha G.', 1020, ''], ['Vikram K.', 990, '']], me: [31, 860, ''] },
      all: { unit: 'pts', note: 'Every Daily Monster you’ve played.', rows: [['Dev S.', 8420, ''], ['Riya M.', 8310, ''], ['Priya P.', 7980, ''], ['Nikhil K.', 7720, ''], ['Anish S.', 7650, ''], ['Sneha G.', 7400, ''], ['Neha M.', 7210, ''], ['Vikram K.', 7090, '']], me: [112, 3940, ''] },
    };
    const renderBoard = (period) => {
      const board = BOARDS[period];
      const pts = (n) => `${n}${board.unit === '/50' ? '<small>/50</small>' : '<small> pts</small>'}`;
      const [first, second, third] = board.rows;
      $('#dmPodium').innerHTML = [[2, second], [1, first], [3, third]].map(([pos, [name, score, time]]) => `<li class="podium-${pos}"><span class="podium-pos num">${pos}</span><span class="podium-name">${name}</span><span class="podium-score num">${pts(score)}</span>${time ? `<span class="podium-time num">${time}</span>` : ''}<span class="podium-step"></span></li>`).join('');
      const row = (pos, name, score, time, me) => `<li${me ? ' class="is-me" aria-current="true"' : ''}><span class="pos num">${pos}</span><span>${name}</span>${time ? `<span class="time num">${time}</span>` : '<span></span>'}<span class="pts num">${pts(score)}</span></li>`;
      $('#dmList').innerHTML = rankRows(board, row);
      $('#dmBoardNote').textContent = board.note;
    };
    $$('[data-period]').forEach((chip) => chip.addEventListener('click', () => {
      $$('[data-period]').forEach((c) => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      renderBoard(chip.dataset.period);
    }));
    renderBoard('day');
    const openBoard = () => show($('#dailyLeaderboard'));
    $('#showDailyLeaderboard')?.addEventListener('click', openBoard);
    $('#dailyToLeaderboard')?.addEventListener('click', openBoard);
    $('#dailyBack')?.addEventListener('click', () => show($('#dailyIntro')));
    if (params.get('view') === 'leaderboard') openBoard();
  }

  if (page === 'match') {
    const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    const MATCHES = {
      brc: { format: 'T20', a: { code: 'BRC', name: 'Bengaluru', color: '#c8102e' }, b: { code: 'CSK', name: 'Chennai', color: '#f2c230' }, when: 'Today · 7:30 PM IST', venue: 'Bengaluru', status: 'upcoming', lockIn: 4356,
        questions: [
          { key: 'winner', q: 'Who will win?', short: 'Winner', options: ['Bengaluru', 'Chennai'] },
          { key: 'team-total', q: 'How many runs will Bengaluru score?', short: 'Bengaluru total', options: ['<140', '140–164', '165–189', '190–214', '215+'] },
          { key: 'wickets', q: 'How many wickets will fall in the match?', short: 'Total wickets', options: ['0–9', '10–12', '13–15', '16+'] },
          { key: 'top-scorer', q: 'Who will be the top run scorer?', short: 'Top run scorer', options: ['Virat Kohli', 'Rajat Patidar', 'Ruturaj Gaikwad', 'Shivam Dube', 'Someone else'] },
          { key: 'player-runs', q: 'How many runs will Virat Kohli score?', short: 'Kohli’s runs', options: ['0–9', '10–29', '30–49', '50–74', '75+'] },
        ] },
      ind: { format: 'ODI', a: { code: 'IND', name: 'India', color: '#1f6fd1' }, b: { code: 'SA', name: 'South Africa', color: '#2f8a4f' }, when: 'Started 1:30 PM IST', venue: 'Ranchi', status: 'live',
        questions: [
          { key: 'winner', q: 'Who will win?', short: 'Winner', options: ['India', 'South Africa'] },
          { key: 'team-total', q: 'How many runs will India score?', short: 'India total', options: ['<240', '240–269', '270–299', '300–329', '330+'] },
          { key: 'wickets', q: 'How many wickets will fall in the match?', short: 'Total wickets', options: ['0–9', '10–12', '13–15', '16+'] },
          { key: 'top-scorer', q: 'Who will be the top run scorer?', short: 'Top run scorer', options: ['Shubman Gill', 'Rohit Sharma', 'Aiden Markram', 'Quinton de Kock', 'Someone else'] },
          { key: 'player-runs', q: 'How many runs will Shubman Gill score?', short: 'Gill’s runs', options: ['0–9', '10–29', '30–49', '50–74', '75+'] },
        ],
        picks: { winner: 'India', 'team-total': '300–329', wickets: '13–15', 'top-scorer': 'Shubman Gill', 'player-runs': '50–74' } },
      mi: { format: 'T20', a: { code: 'MI', name: 'Mumbai', color: '#2a6fd6' }, b: { code: 'KKR', name: 'Kolkata', color: '#6b3fa0' }, when: 'Yesterday', venue: 'Mumbai', status: 'result', score: 'MI 186/6 · KKR 172/8', points: 30, available: 40,
        results: [
          ['Who will win?', 'Mumbai', 'Mumbai', 'correct'],
          ['How many runs will Mumbai score?', '165–189', '186', 'correct'],
          ['How many wickets will fall in the match?', '10–12', '14', 'wrong'],
          ['Who will be the top run scorer?', 'Someone else', 'Someone else', 'correct'],
          ['How many runs will the selected batter score?', '30–49', 'Did not bat', 'void'],
        ] },
    };
    const STATUS = { upcoming: 'Upcoming', live: 'Live', result: 'Result' };
    const storageKey = 'cm-v3-match-picks';
    let picks = {};
    try { picks = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
    const savePicks = () => { try { localStorage.setItem(storageKey, JSON.stringify(picks)); } catch {} };
    // Only keep values that are real options (guards against stale saved data)
    const validPicks = (m) => {
      const out = {};
      m.questions.forEach((q) => { const v = (m.picks || picks)[q.key]; if (q.options.includes(v)) out[q.key] = v; });
      return out;
    };

    const sections = { matches: $('#mmMatches'), picks: $('#mmPicks'), match: $('#mmMatch'), results: $('#mmResults'), leaderboard: $('#mmBoard') };
    const show = (name, tab = name) => {
      Object.entries(sections).forEach(([key, section]) => { section.hidden = key !== name; });
      $$('[data-match-view]').forEach((button) => { const on = button.dataset.matchView === tab; button.classList.toggle('active', on); button.setAttribute('aria-pressed', String(on)); });
      $('#mmHead').hidden = name === 'match';
      $('#mmTabs').hidden = name === 'match';
      scrollTo({ top: 0 });
    };
    const teams = (m, cls = 'bug-teams') => `<span class="${cls}"><span class="team-code" style="--team:${m.a.color}">${m.a.code}</span><span class="bug-vs">v</span><span class="team-code" style="--team:${m.b.color}">${m.b.code}</span></span>`;
    const ballsFor = (n, total = 5) => `<span class="balls" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${i < n ? 'done' : ''}"></span>`).join('')}</span>`;

    // ----- Fixture cards -----
    const fixtureCard = (key) => {
      const m = MATCHES[key];
      let meta, progress, action;
      if (m.status === 'upcoming') {
        const n = Object.keys(validPicks(m)).length;
        meta = `<span>${m.when}</span><span>Locks in <strong class="num" data-countdown="${m.lockIn}">${fmtClock(Math.max(0, m.lockIn - Math.floor((Date.now() - pageOpenedAt) / 1000)))}</strong></span>`;
        progress = `${ballsFor(n)}<span>${n} of 5 picked</span>`;
        action = `<button class="btn ${n === 5 ? '' : 'btn-primary'} btn-block" data-open-match="${key}">${n === 0 ? 'Make your picks' : n === 5 ? 'Edit picks' : 'Finish your picks'}</button>`;
      } else if (m.status === 'live') {
        meta = `<span>${m.when}</span><span class="fx-locked">${LOCK}Picks locked</span>`;
        progress = `${ballsFor(5)}<span>5 of 5 picked</span>`;
        action = `<button class="btn btn-block" data-open-match="${key}">View my picks</button>`;
      } else {
        meta = `<span class="num">${m.score}</span>`;
        progress = `<span class="fx-points num">+${m.points}</span><span>points from ${m.available} available</span>`;
        action = `<button class="btn btn-block" data-open-results="${key}">See how you did</button>`;
      }
      return `<article class="fixture" style="--a:${m.a.color};--b:${m.b.color}">
        <div class="fx-top"><span class="label">${m.format} · ${m.venue}</span><span class="fx-status ${m.status}">${STATUS[m.status]}</span></div>
        <div class="fx-teams"><div class="fx-team"><span class="code">${m.a.code}</span><span>${m.a.name}</span></div><span class="fx-vs">v</span><div class="fx-team right"><span class="code">${m.b.code}</span><span>${m.b.name}</span></div></div>
        <div class="fx-meta">${meta}</div>
        <div class="fx-progress">${progress}</div>
        ${action}
      </article>`;
    };
    const bindCards = (root) => {
      $$('[data-open-match]', root).forEach((b) => b.addEventListener('click', () => openMatch(b.dataset.openMatch)));
      $$('[data-open-results]', root).forEach((b) => b.addEventListener('click', () => { renderResults(); show('results'); }));
    };
    const renderLists = () => {
      $('#mmList').innerHTML = ['brc', 'ind', 'mi'].map(fixtureCard).join('');
      bindCards($('#mmList'));
      // My picks: a team sheet per match
      $('#mmPickList').innerHTML = ['brc', 'ind'].map((key) => {
        const m = MATCHES[key];
        const p = validPicks(m);
        const locked = m.status !== 'upcoming';
        return `<article class="fixture sheet-card" style="--a:${m.a.color};--b:${m.b.color}">
          <div class="fx-top">${teams(m, 'md-teams')}<span class="fx-status ${m.status}">${locked ? 'Locked' : STATUS[m.status]}</span></div>
          <ol class="sheet-rows">${m.questions.map((q) => `<li><span>${q.short}</span><strong>${p[q.key] ? escapeHtml(p[q.key]) : '<span class="muted">Not picked</span>'}</strong></li>`).join('')}</ol>
          <button class="btn btn-block" data-open-match="${key}">${locked ? 'View' : 'Edit picks'}</button>
        </article>`;
      }).join('') + fixtureCard('mi');
      bindCards($('#mmPickList'));
    };

    // ----- Match screen: one question at a time + team sheet -----
    let current = 'brc';
    let step = 0;
    const openMatch = (key) => { current = key; step = 0; renderMatch(); show('match', 'matches'); };
    const renderMatch = () => {
      const m = MATCHES[current];
      const locked = m.status !== 'upcoming';
      const p = validPicks(m);
      const q = m.questions[step];
      const count = Object.keys(p).length;
      sections.match.innerHTML = `
        <button class="text-link mm-back" data-back>← All matches</button>
        <div class="score-bug mm-bug"><span class="bug-tag">${m.format}</span><span class="bug-body">${teams(m)}<span class="bug-meta">${m.when}</span><span class="bug-meta">${locked ? `${LOCK} Locked` : `Locks in <strong data-countdown="${m.lockIn}">${fmtClock(Math.max(0, m.lockIn - Math.floor((Date.now() - pageOpenedAt) / 1000)))}</strong>`}</span></span></div>
        ${locked ? `<div class="mm-locked" role="status">${LOCK}<span><strong>Picks are locked.</strong> They closed at the first ball. Results arrive after the match.</span></div>` : ''}
        <div class="mm-layout">
          <div class="mm-main">
            <ol class="mm-steps" aria-label="Questions">${m.questions.map((qq, i) => `<li><button class="${i === step ? 'now' : ''} ${p[qq.key] ? 'done' : ''}" data-step="${i}" aria-label="Question ${i + 1}${p[qq.key] ? ', picked' : ''}" ${i === step ? 'aria-current="step"' : ''}>${i + 1}</button></li>`).join('')}</ol>
            <div class="mm-q">
              <span class="label">Question ${step + 1} of 5</span>
              <h2 id="mmQuestion">${q.q}</h2>
              <div class="mm-options ${q.options.length > 4 ? 'many' : ''}" role="group" aria-labelledby="mmQuestion">
                ${q.options.map((o) => `<button class="mm-option" data-value="${escapeHtml(o)}" aria-pressed="${p[q.key] === o}" ${locked ? 'disabled' : ''}>${escapeHtml(o)}</button>`).join('')}
              </div>
              <p class="mm-saved" aria-live="polite">${p[q.key] ? (locked ? 'Your pick' : 'Saved') + `: ${escapeHtml(p[q.key])}` : locked ? 'No pick' : 'Tap an option. It saves straight away.'}</p>
            </div>
            <div class="quiz-nav mm-nav"><button class="btn" data-prev ${step === 0 ? 'disabled' : ''}>Back</button><button class="btn btn-primary" data-next>${step === 4 ? 'Done' : 'Next'}</button></div>
          </div>
          <aside class="mm-sheet" aria-label="My picks">
            <button class="mm-sheet-toggle" aria-expanded="false" data-sheet-toggle><span>My picks</span><span class="num">${count} of 5</span></button>
            <div class="mm-sheet-body">
              <h3>Team sheet</h3>
              <ol class="sheet-rows">${m.questions.map((qq, i) => `<li><button data-step="${i}"><span>${qq.short}</span><strong>${p[qq.key] ? escapeHtml(p[qq.key]) : '<span class="muted">—</span>'}</strong></button></li>`).join('')}</ol>
              <p class="form-note">${locked ? 'Locked at the first ball.' : 'Picks lock at the first ball.'}</p>
            </div>
          </aside>
        </div>`;
      const root = sections.match;
      $('[data-back]', root).addEventListener('click', () => { renderLists(); show('matches'); });
      $$('[data-step]', root).forEach((b) => b.addEventListener('click', () => { step = Number(b.dataset.step); renderMatch(); }));
      $('[data-prev]', root).addEventListener('click', () => { if (step > 0) { step--; renderMatch(); } });
      $('[data-next]', root).addEventListener('click', () => {
        if (step < 4) { step++; renderMatch(); return; }
        const sheet = $('.mm-sheet', root); sheet.classList.add('open'); $('[data-sheet-toggle]', root).setAttribute('aria-expanded', 'true');
        sheet.scrollIntoView({ block: 'nearest' });
      });
      $('[data-sheet-toggle]', root).addEventListener('click', (e) => {
        const sheet = $('.mm-sheet', root); const open = sheet.classList.toggle('open');
        e.currentTarget.setAttribute('aria-expanded', String(open));
      });
      if (!locked) $$('.mm-option', root).forEach((b) => b.addEventListener('click', () => {
        picks[q.key] = b.dataset.value;
        savePicks();
        renderMatch();
        // Move on to the next unanswered question after a short beat
        const next = m.questions.findIndex((qq, i) => i > step && !validPicks(m)[qq.key]);
        if (next !== -1) setTimeout(() => { if (sections.match.hidden) return; step = next; renderMatch(); }, 450);
      }));
    };

    // ----- Results -----
    const renderResults = () => {
      const m = MATCHES.mi;
      const BADGE = { correct: 'Correct', wrong: 'Wrong', void: 'Void' };
      sections.results.innerHTML = `
        <div class="score-bug mm-bug"><span class="bug-tag">${m.format}</span><span class="bug-body">${teams(m)}<span class="bug-meta num">${m.score}</span><span class="bug-meta">Mumbai won by 14 runs</span></span></div>
        <div class="mm-total"><span class="label">Your points</span><div class="dm-score"><strong class="num">${m.points}</strong><span class="num">/${m.available}</span></div><p class="muted">One question was voided, so 40 points were available instead of 50.</p></div>
        <ol class="mm-results">${m.results.map(([q, yours, actual, state]) => `<li class="res ${state}"><div><span class="res-q">${q}</span><span class="res-line">You: <strong>${escapeHtml(yours)}</strong> · Result: <strong>${escapeHtml(actual)}</strong></span>${state === 'void' ? '<span class="res-note">The selected batter didn’t bat, so this question doesn’t count.</span>' : ''}</div><span class="status ${state}">${BADGE[state]}</span><span class="res-pts num">${state === 'correct' ? '+10' : state === 'void' ? '—' : '0'}</span></li>`).join('')}</ol>`;
    };

    // ----- Leaderboard -----
    const BOARDS = {
      overall: { note: 'All featured matches this season.', rows: [['Riya M.', 440], ['Dev S.', 420], ['Priya S.', 400], ['Vikram K.', 390], ['Sneha G.', 380], ['Nikhil K.', 370], ['Neha M.', 360], ['Anish S.', 350]], me: [17, 320] },
      mi: { note: 'MI v KKR only. 40 points were available after one void.', rows: [['Dev S.', 40], ['Neha M.', 40], ['Riya M.', 30], ['Priya S.', 30], ['Anish S.', 30], ['Sneha G.', 20], ['Vikram K.', 20], ['Nikhil K.', 20]], me: [5, 30] },
    };
    const renderBoard = (scope) => {
      const board = BOARDS[scope];
      const pts = (n) => `${n}<small> pts</small>`;
      const [first, second, third] = board.rows;
      $('#mmPodium').innerHTML = [[2, second], [1, first], [3, third]].map(([pos, [name, score]]) => `<li class="podium-${pos}"><span class="podium-pos num">${pos}</span><span class="podium-name">${name}</span><span class="podium-score num">${pts(score)}</span><span class="podium-step"></span></li>`).join('');
      const row = (pos, name, score, time, me) => `<li${me ? ' class="is-me" aria-current="true"' : ''}><span class="pos num">${pos}</span><span>${name}</span><span></span><span class="pts num">${pts(score)}</span></li>`;
      $('#mmRankList').innerHTML = rankRows(board, row);
      $('#mmBoardNote').textContent = board.note;
    };
    $$('[data-scope]').forEach((chip) => chip.addEventListener('click', () => {
      $$('[data-scope]').forEach((c) => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      renderBoard(chip.dataset.scope);
    }));

    $$('[data-match-view]').forEach((button) => button.addEventListener('click', () => {
      const view = button.dataset.matchView;
      if (view === 'results') renderResults();
      if (view === 'matches' || view === 'picks') renderLists();
      show(view);
    }));
    renderLists();
    renderBoard('overall');
    // Deep links for review: ?view=match&m=brc|ind, ?view=results, ?view=leaderboard, ?view=picks
    const view = params.get('view');
    if (view === 'match') openMatch(MATCHES[params.get('m')] ? params.get('m') : 'brc');
    else if (view === 'results') { renderResults(); show('results'); }
    else if (view === 'leaderboard' || view === 'picks') show(view);
  }

  if (page === 'admin') {
    const sections = {
      questions: $('#adminQuestions'),
      preview: $('#adminPreview'),
      attention: $('#adminAttention'),
      moderation: $('#adminModeration'),
    };
    $$('[data-admin-tab]').forEach((tab) => tab.addEventListener('click', (event) => {
      event.preventDefault();
      Object.entries(sections).forEach(([key, section]) => { section.hidden = key !== tab.dataset.adminTab; });
      $$('[data-admin-tab]').forEach((item) => item.classList.toggle('active', item === tab));
    }));
    $('#regenerateQuiz')?.addEventListener('click', () => openModal($('#regenModal')));
  }
})();
