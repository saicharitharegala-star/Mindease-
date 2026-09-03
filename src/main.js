import './styles.css';

const moods = [
  { key: 'good', icon: '☀️', label: 'Good', note: 'Light & bright', color: 'gold' },
  { key: 'okay', icon: '☁️', label: 'Okay', note: 'Taking it easy', color: 'teal' },
  { key: 'low', icon: '🌧️', label: 'Low', note: 'Need a little care', color: 'lavender' },
];

const navItems = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'journal', label: 'Journal', icon: '◉' },
  { key: 'wellness', label: 'Wellness', icon: '✦' },
  { key: 'community', label: 'Community', icon: '♧' },
  { key: 'profile', label: 'Profile', icon: '○' },
];

const app = document.querySelector('#app');
let activeView = 'home';
let selectedMood = 'okay';
let journalStarted = false;

function icon(name) {
  const icons = {
    arrow: '<span aria-hidden="true">→</span>',
    back: '<span aria-hidden="true">←</span>',
    bolt: '<span aria-hidden="true">✦</span>',
    play: '<span aria-hidden="true">▶</span>',
    mic: '<span aria-hidden="true">●</span>',
  };
  return icons[name] || '';
}

function render() {
  app.innerHTML = `
    <div class="app-frame">
      <aside class="sidebar">
        <a class="brand" href="#home" data-view="home" aria-label="MindEase home">
          <span class="brand-mark">✦</span>
          <span>mind<span>ease</span></span>
        </a>
        <div class="sidebar-intro">
          <p class="overline">YOUR WELLNESS COMPANION</p>
          <p class="sidebar-copy">Small steps. Softer days.</p>
        </div>
        <nav class="side-nav" aria-label="Main navigation">
          ${navItems.map((item) => `<button class="side-nav-item ${activeView === item.key ? 'is-active' : ''}" data-view="${item.key}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></button>`).join('')}
        </nav>
        <button class="side-sos" data-action="sos"><span class="sos-dot">!</span><span><strong>Need urgent help?</strong><small>Connect in under 60 sec</small></span>${icon('arrow')}</button>
        <div class="sidebar-footer"><span class="status-dot"></span> AI companion online</div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="mobile-brand"><span class="brand-mark">✦</span> mind<span>ease</span></div>
          <div class="topbar-actions">
            <button class="icon-button notification-button" aria-label="Notifications">♧<span class="notification-badge">2</span></button>
            <button class="profile-chip" data-view="profile"><span class="avatar">AS</span><span class="profile-name">Arjun Sharma</span><span class="chevron">⌄</span></button>
          </div>
        </header>
        <div class="page-content">${renderView()}</div>
      </main>
      <button class="floating-sos" data-action="sos" aria-label="Get urgent help"><span>!</span><small>SOS</small></button>
    </div>
    <div class="toast" role="status" aria-live="polite"></div>
    <div class="modal-backdrop" data-action="close-modal" hidden>
      <section class="sos-modal" role="dialog" aria-modal="true" aria-labelledby="sos-title">
        <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
        <div class="modal-icon">!</div>
        <p class="overline">YOU ARE NOT ALONE</p>
        <h2 id="sos-title">Let’s get you support.</h2>
        <p>Our crisis support line is available 24/7. A trained counselor can connect with you in under 60 seconds.</p>
        <button class="primary-button full-width" data-action="connect">Connect to a counselor ${icon('arrow')}</button>
        <button class="text-button full-width" data-action="close-modal">I’m safe for now</button>
        <p class="emergency-note">If you are in immediate danger, please contact your local emergency services.</p>
      </section>
    </div>
  `;
  attachEvents();
}

function renderView() {
  if (activeView === 'journal') return renderJournal();
  if (activeView === 'wellness') return renderWellness();
  if (activeView === 'community') return renderCommunity();
  if (activeView === 'profile') return renderProfile();
  return renderHome();
}

function renderHome() {
  return `<div class="view home-view">
    <div class="welcome-row"><div><p class="overline">TUESDAY, OCTOBER 15</p><h1>Hey Arjun, <em>how are you?</em></h1><p class="page-subtitle">You don’t have to have it all figured out today.</p></div><div class="robot-orb"><span class="robot-face">◡</span><span class="spark spark-one">✦</span><span class="spark spark-two">·</span></div></div>
    <section class="checkin-card"><div class="checkin-heading"><div><span class="step-label">DAILY CHECK-IN <span>01 / 03</span></span><h2>What’s your energy like?</h2></div><span class="checkin-icon">✺</span></div><div class="mood-options">${moods.map((mood) => `<button class="mood-option ${selectedMood === mood.key ? 'is-selected' : ''} mood-${mood.color}" data-mood="${mood.key}"><span class="mood-icon">${mood.icon}</span><span class="mood-label">${mood.label}</span><small>${mood.note}</small></button>`).join('')}</div><button class="primary-button checkin-button" data-action="check-in">Save check-in ${icon('arrow')}</button></section>
    <div class="section-heading"><div><p class="overline">YOUR SPACE</p><h2>Keep feeling better</h2></div><button class="link-button" data-view="wellness">See all ${icon('arrow')}</button></div>
    <div class="resource-grid"><article class="resource-card resource-teal"><span class="resource-symbol">◒</span><div><p class="overline">2 MINUTES</p><h3>Reset your breath</h3><p>Find your calm with box breathing.</p></div><button class="circle-arrow" data-view="wellness">${icon('arrow')}</button></article><article class="resource-card resource-purple"><span class="resource-symbol">✧</span><div><p class="overline">GENTLE PROMPT</p><h3>Untangle a thought</h3><p>A quick CBT reframe for busy minds.</p></div><button class="circle-arrow" data-view="wellness">${icon('arrow')}</button></article></div>
    <div class="bottom-grid"><section class="streak-card"><div class="streak-top"><span class="streak-icon">♨</span><span class="streak-count">4 day streak</span></div><h3>You're building a habit of showing up.</h3><div class="week-dots"><span class="done">M</span><span class="done">T</span><span class="done">W</span><span class="done">T</span><span>F</span><span>S</span><span>S</span></div></section><section class="insight-card"><span class="insight-icon">✦</span><div><p class="overline">MINDEASE INSIGHT</p><h3>Your check-ins are most consistent around 9 PM.</h3><button class="text-link" data-view="wellness">View your week ${icon('arrow')}</button></div></section></div>
  </div>`;
}

function renderJournal() {
  return `<div class="view journal-view"><div class="view-header"><div><p class="overline">A PRIVATE SPACE FOR YOU</p><h1>Voice journal</h1><p class="page-subtitle">Say what’s on your mind. We’re listening.</p></div><span class="header-art">◌</span></div><section class="journal-recorder ${journalStarted ? 'is-recording' : ''}"><div class="recorder-orbit"><button class="mic-button" data-action="record" aria-label="${journalStarted ? 'Stop recording' : 'Start recording'}"><span class="mic-glyph">${journalStarted ? '■' : '●'}</span></button></div><p class="recording-status">${journalStarted ? 'Listening gently…' : 'Tap to speak'}</p><p class="recording-hint">${journalStarted ? 'Tap again when you’re ready to pause' : 'No typing, no judgment. Just your voice.'}</p>${journalStarted ? '<div class="sound-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}</section><div class="section-heading journal-history-heading"><div><p class="overline">YOUR REFLECTIONS</p><h2>Recent recordings</h2></div><span class="count-label">3 entries</span></div><div class="recording-list"><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>Late night thoughts</h3><p>Yesterday · 2 min 14 sec</p></div><span class="recording-mood">☁️</span><span class="recording-more">•••</span></article><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>A small win today</h3><p>Sunday · 1 min 48 sec</p></div><span class="recording-mood">☀️</span><span class="recording-more">•••</span></article><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>Before the exam</h3><p>Friday · 3 min 02 sec</p></div><span class="recording-mood">🌧️</span><span class="recording-more">•••</span></article></div></div>`;
}

function renderWellness() {
  return `<div class="view wellness-view"><div class="view-header"><div><p class="overline">YOUR WEEK IN FEELINGS</p><h1>A little more ease.</h1><p class="page-subtitle">Notice the patterns, celebrate the progress.</p></div><span class="header-art wellness-art">✺</span></div><section class="mood-chart-card"><div class="chart-heading"><div><h2>Monday — today</h2><p>Your mood has been gently rising.</p></div><span class="trend-badge">↗ 18%</span></div><div class="mood-chart"><div class="chart-labels"><span>Good</span><span>Okay</span><span>Low</span></div><svg viewBox="0 0 560 150" role="img" aria-label="Mood trend rising through the week"><path class="chart-grid" d="M0 20H560M0 75H560M0 130H560"/><path class="chart-line" d="M10 107 C70 110, 80 75, 140 88 S200 110, 250 65 S310 75, 355 54 S415 79, 470 42 S520 55, 550 27"/><circle cx="10" cy="107" r="5"/><circle cx="140" cy="88" r="5"/><circle cx="250" cy="65" r="5"/><circle cx="355" cy="54" r="5"/><circle cx="470" cy="42" r="5"/><circle cx="550" cy="27" r="7"/></svg><div class="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div></section><p class="overline wellness-label">MADE FOR THIS MOMENT</p><div class="wellness-grid"><article class="wellness-card breathing-card"><span class="card-number">01</span><span class="wellness-illustration">◌</span><h3>Box breathing</h3><p>Find your center in four easy counts.</p><button class="outline-button" data-action="start-resource">Start exercise ${icon('arrow')}</button></article><article class="wellness-card cbt-card"><span class="card-number">02</span><span class="wellness-illustration">✧</span><h3>Thought reframing</h3><p>Turn a heavy thought into a kinder one.</p><button class="outline-button" data-action="start-resource">Try a prompt ${icon('arrow')}</button></article><article class="wellness-card audio-card"><span class="card-number">03</span><span class="wellness-illustration">♫</span><h3>Soft focus</h3><p>Ambient sounds for deep, gentle focus.</p><button class="outline-button" data-action="start-resource">Listen now ${icon('arrow')}</button></article></div></div>`;
}

function renderCommunity() { return `<div class="view community-view"><div class="view-header"><div><p class="overline">A SPACE TO FEEL SEEN</p><h1>You’re in good company.</h1><p class="page-subtitle">Anonymous, moderated, and kind by design.</p></div><span class="header-art">♧</span></div><div class="community-banner"><div><span class="overline">TODAY’S COMMUNITY THEME</span><h2>What helped you feel a little lighter today?</h2><button class="primary-button" data-action="share">Share anonymously ${icon('arrow')}</button></div><span class="banner-art">☼</span></div><div class="section-heading"><div><p class="overline">FROM YOUR PEERS</p><h2>Recent reflections</h2></div><button class="link-button" data-action="filter">Latest ⌄</button></div><div class="post-list"><article class="post-card"><div class="post-meta"><span class="post-avatar avatar-lavender">S</span><span>student_07 · 8 min ago</span><span class="post-tag">EXAMS</span></div><p>“I finally took a proper break between study sessions today. It felt uncomfortable at first, but my brain thanked me later.”</p><div class="post-actions"><button data-action="support">♡ 24 found this helpful</button><button data-action="reply">○ Reply</button></div></article><article class="post-card"><div class="post-meta"><span class="post-avatar avatar-gold">A</span><span>anonymous · 32 min ago</span><span class="post-tag">SMALL WINS</span></div><p>“Asked a friend for help instead of pretending I understood the assignment. Tiny step, huge relief.”</p><div class="post-actions"><button data-action="support">♡ 18 found this helpful</button><button data-action="reply">○ Reply</button></div></article></div></div>`; }

function renderProfile() { return `<div class="view profile-view"><div class="profile-hero"><div class="large-avatar">AS</div><div><p class="overline">YOUR MINDEASE PROFILE</p><h1>Arjun Sharma</h1><p class="page-subtitle">B.Tech CSE · Year 2</p></div><button class="icon-button edit-button" data-action="edit">✎</button></div><div class="profile-stat-row"><div><strong>12</strong><span>check-ins</span></div><div><strong>4</strong><span>day streak</span></div><div><strong>7</strong><span>reflections</span></div></div><section class="settings-card"><p class="overline">YOUR PREFERENCES</p><button class="setting-row" data-action="toggle"><span class="setting-icon">♧</span><span><strong>Daily check-in reminder</strong><small>Every day at 9:00 PM</small></span><span class="toggle is-on"><i></i></span></button><button class="setting-row" data-action="toast"><span class="setting-icon">◈</span><span><strong>Privacy & safety</strong><small>Your reflections stay yours</small></span>${icon('arrow')}</button><button class="setting-row" data-action="toast"><span class="setting-icon">?</span><span><strong>Help center</strong><small>Answers and support</small></span>${icon('arrow')}</button></section><p class="profile-owner">MindEase companion · Built with care for students</p></div>`; }

function showToast(message) { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 2800); }
function attachEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { activeView = button.dataset.view; render(); }));
  document.querySelectorAll('[data-mood]').forEach((button) => button.addEventListener('click', () => { selectedMood = button.dataset.mood; render(); }));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAction(button.dataset.action)));
}
function handleAction(action) {
  if (action === 'sos') { document.querySelector('.modal-backdrop').hidden = false; return; }
  if (action === 'close-modal') { document.querySelector('.modal-backdrop').hidden = true; return; }
  if (action === 'connect') { document.querySelector('.modal-backdrop').hidden = true; showToast('Connecting you with a counselor now.'); return; }
  if (action === 'record') { journalStarted = !journalStarted; render(); return; }
  if (action === 'check-in') { showToast(`Check-in saved. ${selectedMood === 'good' ? 'Keep that bright energy going.' : 'Thanks for checking in with yourself.'}`); return; }
  if (action === 'start-resource') { showToast('Your exercise is ready. Take two quiet minutes for yourself.'); return; }
  if (action === 'share') { showToast('Your reflection space is ready when you are.'); return; }
  if (action === 'support') { showToast('Sent a little support their way.'); return; }
  if (action === 'edit') { showToast('Profile editing will be available soon.'); return; }
  if (action === 'toggle') { const toggle = document.querySelector('.toggle'); toggle.classList.toggle('is-on'); showToast(toggle.classList.contains('is-on') ? 'Reminder turned on.' : 'Reminder turned off.'); return; }
  showToast('This space is being prepared for you.');
}

render();
