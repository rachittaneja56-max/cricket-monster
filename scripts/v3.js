(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;

  const params = new URLSearchParams(location.search);
  const isGuest = params.has('guest');
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
  const TYPE_LABELS = { discussion: 'Discussion', performance: 'Player performance', opinion: 'Opinion', meme: 'Meme' };
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
    like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.4-9.2-9.3C1.6 7.6 4 4 7.6 4c2 0 3.4 1.1 4.4 2.6C13 5.1 14.4 4 16.4 4 20 4 22.4 7.6 21.2 11.2 19.5 16.1 12 20.5 12 20.5z"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  };

  function postMarkup(post) {
    const media = post.image
      ? `<img class="post-image" src="${post.image}" alt="${escapeHtml(post.alt || '')}" loading="lazy">`
      : post.meme ? `<div class="post-meme" role="img" aria-label="Meme: ${escapeHtml(post.meme.join(' '))}">${escapeHtml(post.meme[0])}<span>${escapeHtml(post.meme[1])}</span></div>` : '';
    return `<article class="post" data-post-id="${post.id}" aria-labelledby="t-${post.id}">
      <span class="avatar ${post.tone || ''}" aria-hidden="true">${escapeHtml(post.initials)}</span>
      <div>
        <div class="post-head"><strong class="post-name">${escapeHtml(post.author)}</strong><span class="post-handle">@${escapeHtml(post.handle)}</span><span class="post-dot" aria-hidden="true">·</span><span class="post-time">${timeAgo(post.minutes)}</span>
          <button class="post-menu" data-report aria-label="More options for post by ${escapeHtml(post.author)}">${icons.more}</button></div>
        <span class="type-chip type-${post.type}">${TYPE_LABELS[post.type]}</span>
        <p class="post-text"><strong id="t-${post.id}">${escapeHtml(post.title)}</strong>${post.text && post.text !== post.title ? escapeHtml(post.text) : ''}</p>
        ${media}
        <div class="post-actions">
          <button data-comments aria-expanded="false" aria-label="${post.comments} comments">${icons.comment}<span>${formatCount(post.comments)}</span></button>
          <button data-like aria-pressed="${post.liked ? 'true' : 'false'}" aria-label="Like, ${post.likes} likes">${icons.like}<span>${formatCount(post.likes)}</span></button>
          <button data-share aria-label="Share post">${icons.share}<span class="share-label"></span></button>
        </div>
        <div class="comments-panel" data-comments-panel hidden>
          <form class="comment-form" data-comment-form><label class="sr-only" for="c-${post.id}">Write a reply</label><input class="input" id="c-${post.id}" maxlength="500" placeholder="Post your reply"><button class="btn btn-primary btn-small">Reply</button></form>
          <p class="comment"><strong>Dev S.</strong> <span class="muted">@devsays</span><br>The planning was spot on. Pressure built over several overs.</p>
          <p class="comment"><strong>Neha M.</strong> <span class="muted">@neha_midon</span><br>That was the game-changing moment for me.</p>
        </div>
      </div>
    </article>`;
  }

  const promoDaily = `<div class="promo"><a class="promo-card" href="/daily-monster/"><span class="eyebrow">Daily Monster · Today</span><h3>Five questions. Ninety seconds.</h3><p>Can you beat yesterday’s #18?</p><div class="promo-meta"><span>5 Qs</span><span>90 s</span><span>50 pts max</span></div><span class="btn btn-gold btn-small">Play now</span></a></div>`;
  const promoMatch = `<div class="promo"><a class="promo-card match" href="/match-monster/"><span class="eyebrow" style="color:#f5e2ad">Match Monster · Featured T20</span><h3>Bengaluru v Chennai</h3><p>Five calls before the first ball.</p><div class="promo-meta"><span>Locks in 01:12:36</span><span>0 of 5 picked</span></div><span class="btn btn-gold btn-small">Make your picks</span></a></div>`;
  const welcomeCard = `<div class="welcome-card"><span class="eyebrow" style="color:var(--brick)">Welcome to Cricket Monster</span><h2>Every fan has a take. What’s yours?</h2><p>Read freely. Sign in with your email to post, like, reply and climb the leaderboards.</p><div class="welcome-actions"><a class="btn btn-primary" href="/sign-in/">Join the conversation</a><a class="btn" href="/daily-monster/">Try today’s quiz</a></div></div>`;
  const skeletons = Array.from({ length: 3 }, () => '<div class="skeleton" aria-hidden="true"><span class="sk sk-avatar"></span><div><div class="sk sk-line w40"></div><div class="sk sk-line w90"></div><div class="sk sk-line w70"></div></div></div>').join('');
  const EMPTY = {
    discussion: 'Start the first discussion of the day.',
    performance: 'Seen a special innings or spell? Tell everyone.',
    opinion: 'Got a hot take? This is the place.',
    meme: 'Be the first to post a meme today.',
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
      container.innerHTML = `<div class="feed-state" role="alert"><div class="state-icon error" aria-hidden="true">!</div><h2>Couldn’t load the feed</h2><p>Check your connection and try again. Your drafts are safe.</p><button class="btn btn-primary" data-retry>Try again</button></div>`;
      $('[data-retry]', container).addEventListener('click', () => { params.delete('state'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '')); renderFeed({ loading: true }); setTimeout(() => renderFeed(), 450); });
      return;
    }
    let visible = activeFilter === 'all' ? [...posts] : posts.filter((post) => post.type === activeFilter);
    visible.sort(sortMode === 'liked' ? (a, b) => b.likes - a.likes : (a, b) => a.minutes - b.minutes);
    if (!visible.length) {
      container.innerHTML = `<div class="feed-state"><div class="state-icon" aria-hidden="true">✎</div><h2>Nothing here yet</h2><p>${EMPTY[activeFilter] || 'Start the conversation.'}</p><button class="btn btn-primary" data-open-composer>Write a post</button> <button class="btn" data-filter-reset>Show all posts</button></div>`;
    } else {
      if (feedLimit) visible = visible.slice(0, feedLimit);
      const parts = visible.map(postMarkup);
      if (activeFilter === 'all' && !feedLimit) {
        if (parts.length > 2) parts.splice(2, 0, promoDaily);
        if (parts.length > 5) parts.splice(5, 0, promoMatch);
      }
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
      button.setAttribute('aria-label', `Like, ${post.likes} likes`);
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
      form.insertAdjacentHTML('afterend', `<p class="comment"><strong>Arjun K.</strong> <span class="muted">@arjun_k_42 · now</span><br>${escapeHtml(value)}</p>`);
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
        else { await navigator.clipboard.writeText(url); $('.share-label', button).textContent = 'Copied'; setTimeout(() => { $('.share-label', button).textContent = ''; }, 1600); }
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
    $$('[data-sort]').forEach((button) => button.addEventListener('click', () => {
      sortMode = sortMode === 'newest' ? 'liked' : 'newest';
      const label = sortMode === 'newest' ? 'Newest' : 'Most liked';
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
  const countdowns = $$('[data-countdown]');
  if (countdowns.length) {
    const startedAt = Date.now();
    const fmt = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
    const tickCountdowns = () => countdowns.forEach((el) => {
      const left = Math.max(0, Number(el.dataset.countdown) - Math.floor((Date.now() - startedAt) / 1000));
      el.textContent = fmt(left);
    });
    tickCountdowns();
    setInterval(tickCountdowns, 1000);
  }

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
      { q: 'How many legal deliveries make up a standard over?', options: ['4', '5', '6', '8'], answer: 2, explanation: 'A standard over contains six legal deliveries.' },
      { q: 'What does LBW stand for?', options: ['Leg Before Wicket', 'Long Ball Wicket', 'Last Batter Wins', 'Leg By Wide'], answer: 0, explanation: 'LBW is short for Leg Before Wicket.' },
      { q: 'How many overs does each side normally have in a T20 innings?', options: ['10', '20', '40', '50'], answer: 1, explanation: 'Each team normally receives 20 overs in a T20 innings.' },
      { q: 'Which dismissal is not credited as a wicket to the bowler?', options: ['Bowled', 'Caught', 'LBW', 'Run out'], answer: 3, explanation: 'A run out is a fielding dismissal and is not credited to the bowler.' },
      { q: 'Which method revises a target after rain in limited-overs cricket?', options: ['Boundary count', 'DLS method', 'Net run rate', 'Super Over'], answer: 1, explanation: 'The Duckworth–Lewis–Stern method is used to revise targets after interruptions.' },
    ];
    const views = [$('#dailyIntro'), $('#dailyQuiz'), $('#dailyResult'), $('#dailyLeaderboard')];
    const show = (view) => views.forEach((item) => { item.hidden = item !== view; });
    let index = 0;
    let answers = Array(questions.length).fill(null);
    let remaining = 90;
    let startedAt = 0;
    let timerId = null;
    const renderQuestion = () => {
      const question = questions[index];
      $('#dailyCounter').textContent = `Question ${index + 1} of ${questions.length}`;
      $('#dailyQuestion').textContent = question.q;
      $('#dailyProgress').style.width = `${(index / questions.length) * 100}%`;
      $('#dailyAnswers').innerHTML = question.options.map((option, optionIndex) => `<button class="answer" aria-pressed="${answers[index] === optionIndex}" data-answer="${optionIndex}"><span class="radio"></span>${option}</button>`).join('');
      $$('[data-answer]').forEach((button) => button.addEventListener('click', () => {
        answers[index] = Number(button.dataset.answer);
        renderQuestion();
      }));
      $('#dailyPrevious').disabled = index === 0;
      $('#dailyNext').disabled = answers[index] === null;
      $('#dailyNext').textContent = index === questions.length - 1 ? 'Submit quiz' : 'Next';
    };
    const updateTimer = () => {
      remaining = Math.max(0, remaining - 1);
      $('#dailyTimer').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      if (remaining === 0) finishQuiz();
    };
    const finishQuiz = () => {
      clearInterval(timerId);
      const correct = questions.reduce((sum, question, i) => sum + (answers[i] === question.answer ? 1 : 0), 0);
      const elapsed = Math.min(90, Math.round((Date.now() - startedAt) / 1000));
      $('#dailyScore').textContent = `${correct * 10} / 50`;
      $('#dailyCorrect').textContent = `${correct} correct answer${correct === 1 ? '' : 's'}`;
      $('#dailyTime').textContent = `Completed in ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
      $('#dailyReview').innerHTML = questions.map((question, i) => {
        const good = answers[i] === question.answer;
        return `<details class="review-row ${good ? 'good' : 'bad'}" ${i === 0 ? 'open' : ''}><summary>${good ? '✓' : '×'} Q${i + 1}. ${question.q}</summary><div class="review-body"><strong>Your answer:</strong> ${answers[i] === null ? 'Skipped' : question.options[answers[i]]}<br><strong>Correct answer:</strong> ${question.options[question.answer]}<p>${question.explanation}</p></div></details>`;
      }).join('');
      show($('#dailyResult'));
    };
    $('#startDaily')?.addEventListener('click', () => {
      index = 0; answers = Array(5).fill(null); remaining = 90; startedAt = Date.now();
      show($('#dailyQuiz')); renderQuestion(); clearInterval(timerId); timerId = setInterval(updateTimer, 1000);
    });
    $('#dailyPrevious')?.addEventListener('click', () => { if (index > 0) { index--; renderQuestion(); } });
    $('#dailyNext')?.addEventListener('click', () => { if (answers[index] === null) return; if (index < 4) { index++; renderQuestion(); } else finishQuiz(); });
    $('#showDailyLeaderboard')?.addEventListener('click', () => show($('#dailyLeaderboard')));
    $('#dailyToLeaderboard')?.addEventListener('click', () => show($('#dailyLeaderboard')));
    $('#dailyBack')?.addEventListener('click', () => show($('#dailyIntro')));
    $('#dailyRestart')?.addEventListener('click', () => { show($('#dailyIntro')); });
    $('#shareDaily')?.addEventListener('click', async (event) => {
      try {
        if (navigator.share) await navigator.share({ title: 'My Daily Monster score', text: $('#dailyScore').textContent, url: location.href });
        else await navigator.clipboard.writeText(`Daily Monster: ${$('#dailyScore').textContent}`);
        event.currentTarget.textContent = 'Score copied';
      } catch {}
    });
    $$('.leaderboard-tabs .chip').forEach((chip) => chip.addEventListener('click', () => {
      $$('.leaderboard-tabs .chip').forEach((item) => item.classList.toggle('active', item === chip));
    }));
  }

  if (page === 'match') {
    const sections = {
      matches: $('#matchMatches'),
      predictions: $('#matchPredictions'),
      resolved: $('#matchResolved'),
      leaderboard: $('#matchLeaderboard'),
    };
    const show = (name) => {
      Object.entries(sections).forEach(([key, section]) => { section.hidden = key !== name; });
      $$('[data-match-view]').forEach((button) => button.classList.toggle('active', button.dataset.matchView === name));
      scrollTo({ top: 300, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    $$('[data-match-view]').forEach((button) => button.addEventListener('click', () => show(button.dataset.matchView)));
    $$('[data-start-picks]').forEach((button) => button.addEventListener('click', () => show('predictions')));
    const storageKey = 'cm-v3-match-picks';
    let picks = {};
    try { picks = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
    const labels = {
      winner: 'Winner',
      'team-total': 'Bengaluru total',
      wickets: 'Total wickets',
      'top-scorer': 'Top run scorer',
      'player-runs': 'Virat Kohli runs',
    };
    const cards = $$('.prediction-card');
    const renderPicks = () => {
      cards.forEach((card) => {
        const value = picks[card.dataset.question] || '';
        $$('[data-value]', card).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.value === value)));
        const select = $('[data-pick-select]', card);
        if (select) select.value = value;
        $('[data-saved]', card).textContent = value ? '✓ Saved' : '';
      });
      const entries = Object.entries(picks).filter(([, value]) => value);
      $('#matchPickCount').textContent = `${entries.length} of 5`;
      $('#matchPickList').innerHTML = entries.length ? entries.map(([key, value]) => `<li><strong>${labels[key]}</strong><br><span class="muted">${value}</span></li>`).join('') : '<li class="muted">Your selections appear here. They save automatically.</li>';
      try { localStorage.setItem(storageKey, JSON.stringify(picks)); } catch {}
    };
    cards.forEach((card) => {
      $$('[data-value]', card).forEach((button) => button.addEventListener('click', () => {
        picks[card.dataset.question] = button.dataset.value;
        renderPicks();
      }));
      $('[data-pick-select]', card)?.addEventListener('change', (event) => {
        picks[card.dataset.question] = event.target.value;
        renderPicks();
      });
    });
    renderPicks();
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
