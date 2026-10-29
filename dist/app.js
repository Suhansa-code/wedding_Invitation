(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const cover = $('#cover'), main = $('#invitation'), header = $('.site-header');
  const openButton = $('#open-invitation'), status = $('#app-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const name = (new URLSearchParams(location.search).get('to') || 'family & friends').trim().slice(0, 80) || 'family & friends';
  document.querySelectorAll('.guest-copy').forEach(node => { node.textContent = name; });
  document.body.classList.add('has-js');

  let revealObserver;
  function revealContent() {
    if (!('IntersectionObserver' in window) || reduced.matches) {
      document.querySelectorAll('.reveal').forEach(node => node.classList.add('is-visible'));
      return;
    }
    if (!revealObserver) revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(node => revealObserver.observe(node));
  }
  let openingTimer, coupleTimer, coupleSequence = 0, opening = false;
  const coupleSheet = new Image(); coupleSheet.src = 'assets/original-couple-run.webp';
  function openInvitation(immediate = false) {
    if (opening || cover.hidden) return;
    opening = true;
    openButton.disabled = true;
    clearTimeout(coupleTimer); coupleSequence++;
    $('.couple-run').classList.add('has-met');
    cover.classList.add('is-opening');
    const finish = () => {
      cover.hidden = true;
      cover.classList.remove('is-opening');
      document.body.classList.remove('is-locked');
      main.inert = false; header.inert = false;
      opening = false; openButton.disabled = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      main.focus({ preventScroll: true });
      revealContent();
      status.textContent = `Your invitation is open, ${name}.`;
    };
    clearTimeout(openingTimer);
    if (immediate || reduced.matches) finish(); else openingTimer = setTimeout(finish, 1050);
  }
  function showCover() {
    clearTimeout(openingTimer); opening = false; openButton.disabled = false;
    $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded', 'false');
    cover.classList.remove('is-opening'); cover.hidden = false;
    main.inert = true; header.inert = true;
    document.body.classList.add('is-locked');
    // Re-mount the animation state so replay always begins at opposite sides.
    const run = $('.couple-run');
    clearTimeout(coupleTimer);
    const sequence = ++coupleSequence;
    run.classList.remove('is-running', 'has-met');
    if (!reduced.matches) {
      coupleSheet.decode().catch(() => {}).then(() => {
        if (sequence !== coupleSequence || cover.hidden || reduced.matches) return;
        void run.offsetWidth; run.classList.add('is-running');
        coupleTimer = setTimeout(() => { run.classList.add('has-met'); }, 2800);
      });
    }
    openButton.focus({ preventScroll: true });
  }
  openButton.addEventListener('click', () => openInvitation());
  $('#replay-opening').addEventListener('click', showCover);
  $('.skip-link').addEventListener('click', () => openInvitation(true));
  showCover();

  const menuButton = $('#menu-toggle'), menu = $('#mobile-nav');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
  menuButton.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
    menuButton.setAttribute('aria-label', menu.hidden ? 'Open navigation' : 'Close navigation');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });

  const progress = $('.scroll-progress');
  function updateScroll() {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${total > 0 ? Math.min(100, Math.max(0, scrollY / total * 100)) : 0}%`;
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll); updateScroll();
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  const petals = $('.petals');
  for (let index = 0; index < 20; index++) {
    const petal = document.createElement('span'); petal.className = 'petal';
    petal.style.setProperty('--x', `${(index * 37 + 4) % 100}%`);
    petal.style.setProperty('--size', `${6 + index % 5 * 1.4}px`);
    petal.style.setProperty('--duration', `${14 + index % 7 * 1.3}s`);
    petal.style.setProperty('--delay', `${-index * 1.35}s`);
    petal.style.setProperty('--drift', `${index % 2 ? -40 : 55}px`);
    petals.append(petal);
  }
  let motionPaused = false;
  try { motionPaused = localStorage.getItem('bloom:motion') === 'paused'; } catch { /* Optional preference. */ }
  const motionButton = $('#motion-toggle');
  function updateMotion() {
    const paused = motionPaused || reduced.matches;
    document.body.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume petals and decorative motion' : 'Pause petals and decorative motion');
    motionButton.title = reduced.matches ? 'Your device prefers reduced motion' : paused ? 'Resume petals' : 'Pause petals';
    motionButton.disabled = reduced.matches;
    motionButton.innerHTML = paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';
  }
  motionButton.addEventListener('click', () => {
    motionPaused = !motionPaused; updateMotion();
    try { localStorage.setItem('bloom:motion', motionPaused ? 'paused' : 'playing'); } catch { /* Optional preference. */ }
    status.textContent = motionPaused ? 'Decorative motion paused.' : 'Decorative motion resumed.';
  });
  reduced.addEventListener('change', () => { updateMotion(); if (reduced.matches) revealContent(); });
  updateMotion();
  document.addEventListener('visibilitychange', () => { petals.style.animationPlayState = document.hidden ? 'paused' : ''; petals.querySelectorAll('.petal').forEach(petal => petal.style.animationPlayState = document.hidden ? 'paused' : ''); });

  const audio = $('#wedding-music'), musicButton = $('#music-toggle'); audio.volume = 0.2;
  let playing = false;
  function updateMusic() {
    musicButton.setAttribute('aria-pressed', String(playing)); musicButton.setAttribute('aria-label', playing ? 'Pause music' : 'Play music'); musicButton.title = playing ? 'Pause music' : 'Play music';
  }
  musicButton.addEventListener('click', async () => {
    if (playing) { audio.pause(); playing = false; updateMusic(); return; }
    musicButton.disabled = true;
    try { await audio.play(); playing = true; status.textContent = 'Music playing.'; }
    catch { playing = false; status.textContent = 'The music could not play. You can try again.'; }
    finally { musicButton.disabled = false; updateMusic(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { audio.pause(); playing = false; updateMusic(); } });

  const calendar = $('#calendar-grid');
  ['M','T','W','T','F','S','S'].forEach(day => { const node = document.createElement('span'); node.className = 'week-day'; node.textContent = day; calendar.append(node); });
  for (let i = 0; i < 6; i++) calendar.append(document.createElement('span'));
  for (let day = 1; day <= 30; day++) {
    const node = document.createElement('span'); node.textContent = day;
    if (day === 23) node.className = 'wedding-day'; calendar.append(node);
  }
  const weddingTime = new Date('2026-11-23T10:00:00+05:30').getTime();
  function updateCountdown() {
    const seconds = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
    const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
    Object.entries(values).forEach(([key, value]) => { $(`#count-${key}`).textContent = String(value).padStart(2, '0'); });
    if (seconds === 0) $('#countdown-label').textContent = 'OUR FOREVER HAS BEGUN';
  }
  updateCountdown(); setInterval(updateCountdown, 1000);

  const form = $('#wishes-form'), wishName = $('#wish-name'), wishMessage = $('#wish-message'), ready = $('#wish-ready');
  try {
    const draft = JSON.parse(localStorage.getItem('bloom:wish') || 'null');
    if (draft && typeof draft.name === 'string' && typeof draft.message === 'string') { wishName.value = draft.name.slice(0,80); wishMessage.value = draft.message.slice(0,1000); }
  } catch { /* Drafts are optional and stay on this device. */ }
  form.addEventListener('input', () => { try { localStorage.setItem('bloom:wish', JSON.stringify({ name: wishName.value, message: wishMessage.value })); } catch { /* Continue with the form when storage is unavailable. */ } });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const from = wishName.value.trim(), message = wishMessage.value.trim();
    if (!from || !message) { $('#wish-status').textContent = 'Please add your name and a few words for the couple.'; return; }
    const text = `Dear Dulmi & Isuru,\n\n${message}\n\nWith love,\n${from}`;
    $('#wish-preview').textContent = text;
    $('#send-wishes').href = `https://wa.me/94762101024?text=${encodeURIComponent(text)}`;
    form.hidden = true; ready.hidden = false; ready.focus({ preventScroll: true });
    $('#wish-status').textContent = 'Your message is ready. Choose Send on WhatsApp to share it with Isuru.';
  });
  $('#edit-wishes').addEventListener('click', () => { ready.hidden = true; form.hidden = false; $('#wish-status').textContent = ''; wishMessage.focus({ preventScroll: true }); });
})();
