(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;

  const nav = $('#mainNav');
  const menu = $('#menuBtn');
  const closeMenu = () => {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation');
  };
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      $$('.modal:not([hidden])').forEach((modal) => closeModal(modal));
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  let lastFocused = null;
  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('button, input, textarea, select')?.focus();
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

  const posts = [
    {
      id: 'impact-player',
      initials: 'RM',
      author: 'Riya M.',
      time: '2h',
      type: 'discussion',
      label: 'Discussion',
      title: 'Has the impact-player rule changed the soul of the IPL?',
      text: 'It has definitely made teams more flexible and matches more unpredictable, but sometimes it feels like it takes away from building a balanced, long-term playing XI.',
      likes: 128,
      comments: 47,
    },
    {
      id: 'spell',
      initials: 'AK',
      author: 'Arjun K.',
      time: '4h',
      type: 'performance',
      label: 'Player performance',
      title: 'The spell that turned the match.',
      text: 'What a spell through the middle overs. The way he set up the batters, kept the pressure on and still nailed the yorkers was a masterclass in fast bowling.',
      likes: 86,
      comments: 21,
      image: '/assets/stadium.webp',
    },
    {
      id: 'fielding',
      initials: 'DS',
      author: 'Dev S.',
      time: '6h',
      type: 'opinion',
      label: 'Opinion',
      title: 'Why fielding is still the most underrated skill.',
      text: 'We talk about big scores and match-winning spells, but elite fielding consistently changes games by saving runs and creating pressure.',
      likes: 72,
      comments: 29,
    },
  ];

  function postMarkup(post) {
    return `<article class="post" data-post-type="${post.type}" data-post-id="${post.id}">
      <div class="post-meta"><span class="avatar">${post.initials}</span><div><strong>${post.author}</strong><br><small>${post.time} · ${post.label}</small></div><button class="post-menu" data-report aria-label="Report ${post.title}">•••</button></div>
      <h3>${post.title}</h3><p>${post.text}</p>
      ${post.image ? `<img class="post-image" src="${post.image}" alt="A cricket match under stadium lights">` : ''}
      <div class="post-actions"><button data-like>♡ Like <span>${post.likes}</span></button><button data-comments>◯ Comments <span>${post.comments}</span></button><button data-share>↗ Share</button></div>
      <div class="panel panel-pad" data-comments-panel hidden style="margin-top:12px"><div class="field"><label>Add a comment</label><input class="input" maxlength="500" placeholder="Join this discussion…"></div><p><strong>Dev S.</strong> · The planning was spot on. The pressure built over several overs.</p><p><strong>Neha M.</strong> · That was the game-changing moment for me.</p></div>
    </article>`;
  }

  function initFeed(containerSelector) {
    const container = $(containerSelector);
    if (!container) return;
    let activeFilter = 'all';
    const render = () => {
      const visible = activeFilter === 'all' ? posts : posts.filter((post) => post.type === activeFilter);
      container.innerHTML = visible.length ? visible.map(postMarkup).join('') : '<div class="empty-state"><h2 class="display">No posts here yet.</h2><p>Try another filter or start the conversation.</p><button class="btn btn-primary" data-filter-reset>Reset filters</button></div>';
      $$('[data-like]', container).forEach((button) => button.addEventListener('click', () => {
        const count = $('span', button);
        const liked = button.classList.toggle('liked');
        count.textContent = String(Number(count.textContent) + (liked ? 1 : -1));
        button.firstChild.textContent = liked ? '♥ Liked ' : '♡ Like ';
      }));
      $$('[data-comments]', container).forEach((button) => button.addEventListener('click', () => {
        const panel = $('[data-comments-panel]', button.closest('.post'));
        panel.hidden = !panel.hidden;
        if (!panel.hidden) $('input', panel)?.focus();
      }));
      $$('[data-share]', container).forEach((button) => button.addEventListener('click', async () => {
        const post = button.closest('.post');
        const title = $('h3', post)?.textContent || 'Cricket Monster';
        const url = location.origin + '/feed/#' + post.dataset.postId;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else await navigator.clipboard.writeText(url);
          button.textContent = '✓ Link copied';
        } catch {}
      }));
      $$('[data-report]', container).forEach((button) => button.addEventListener('click', () => openModal($('#reportModal'))));
      $('[data-filter-reset]', container)?.addEventListener('click', () => {
        activeFilter = 'all';
        $$('[data-filter]').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === 'all'));
        render();
      });
    };
    $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      $$('[data-filter]').forEach((item) => item.classList.toggle('active', item === chip));
      render();
    }));
    render();
  }

  function initComposer() {
    const modal = $('#composerModal');
    $$('[data-open-composer]').forEach((button) => button.addEventListener('click', () => openModal(modal)));
    const textarea = $('textarea[maxlength="1000"]', modal);
    const count = $('[data-char-count]', modal);
    textarea?.addEventListener('input', () => { count.textContent = String(textarea.value.length); });
    $$('.chip', $('#postTypes') || modal).forEach((chip) => chip.addEventListener('click', () => {
      $$('.chip', chip.parentElement).forEach((item) => item.classList.toggle('active', item === chip));
    }));
    const publish = $('#publishFeedPost') || $('#publishHomePost');
    publish?.addEventListener('click', () => {
      if (!textarea.value.trim()) {
        textarea.setCustomValidity('Write something before publishing.');
        textarea.reportValidity();
        return;
      }
      textarea.setCustomValidity('');
      const newPost = {
        id: 'local-' + Date.now(),
        initials: 'AK',
        author: 'Arjun K.',
        time: 'now',
        type: $('#postTypes .chip.active')?.dataset.type || 'discussion',
        label: $('#postTypes .chip.active')?.textContent || 'Discussion',
        title: textarea.value.trim().split(/\n/)[0].slice(0, 90),
        text: textarea.value.trim(),
        likes: 0,
        comments: 0,
      };
      posts.unshift(newPost);
      textarea.value = '';
      count.textContent = '0';
      closeModal(modal);
      initFeed(page === 'home' ? '#homePosts' : '#feedPosts');
    });
    $('#submitReport')?.addEventListener('click', (event) => {
      event.currentTarget.textContent = 'Report submitted';
      setTimeout(() => closeModal($('#reportModal')), 650);
    });
  }

  if (page === 'home') {
    initFeed('#homePosts');
    initComposer();
    const video = $('#heroVideo');
    if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
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
    $('#showExpired')?.addEventListener('click', () => show(expired));
    $('#newLink')?.addEventListener('click', () => show(formView));
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
    $('#previewResolved')?.addEventListener('click', () => show('resolved'));
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
