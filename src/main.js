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
let selectedMood = localStorage.getItem('mindease:mood') || 'okay';
let journalStarted = false;
let authError = '';
let notificationOpen = false;
const storedSettings = JSON.parse(localStorage.getItem('mindease:settings') || '{}');
const storedData = JSON.parse(localStorage.getItem('mindease:data') || '{}');
const data = {
  checkins: storedData.checkins || [],
  journalEntries: storedData.journalEntries || [],
  notifications: storedData.notifications || [
    { id: 1, title: 'Your gentle check-in is waiting', detail: 'Take a moment for yourself today.', unread: true },
    { id: 2, title: 'A new breathing exercise is here', detail: 'Two quiet minutes can make a difference.', unread: true },
  ],
  beta: storedData.beta || 'not-joined',
  subscription: storedData.subscription || 'free',
};
function persistData() { localStorage.setItem('mindease:data', JSON.stringify(data)); }
function setAuthError(message) { authError = message; render(); }
function isOnline() { return navigator.onLine !== false; }
const session = {
  authenticated: localStorage.getItem('mindease:session') === 'active',
  stage: 'welcome',
  email: localStorage.getItem('mindease:email') || '',
  role: localStorage.getItem('mindease:role') || 'student',
};
const settings = {
  notifications: storedSettings.notifications ?? true,
  analytics: storedSettings.analytics ?? false,
  crashReports: storedSettings.crashReports ?? true,
  healthData: storedSettings.healthData ?? false,
  beta: storedSettings.beta ?? false,
};
function persistSettings() { localStorage.setItem('mindease:settings', JSON.stringify(settings)); }
function track(event) {
  if (!settings.analytics) return;
  window.__mindeaseAnalytics = [...(window.__mindeaseAnalytics || []), { event, at: new Date().toISOString() }];
}
function reportError(error) {
  if (!settings.crashReports) return;
  window.__mindeaseLastError = error instanceof Error ? error.message : String(error);
}
window.addEventListener('error', (event) => reportError(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => reportError(event.reason));
window.addEventListener('online', () => { document.body.classList.remove('is-offline'); showToast('You’re back online.'); });
window.addEventListener('offline', () => { document.body.classList.add('is-offline'); showToast('You’re offline. Your changes stay on this device.'); });

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
  if (!session.authenticated) {
    app.innerHTML = renderAuth();
    attachAuthEvents();
    return;
  }
  app.innerHTML = `
    <div class="offline-banner" role="status">You’re offline. Changes will stay on this device until you reconnect.</div>
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
          ${navItems.map((item) => `<button class="side-nav-item ${activeView === item.key ? 'is-active' : ''}" data-view="${item.key}" aria-current="${activeView === item.key ? 'page' : 'false'}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></button>`).join('')}
        </nav>
        <button class="side-sos" data-action="sos"><span class="sos-dot">!</span><span><strong>Need urgent help?</strong><small>Connect in under 60 sec</small></span>${icon('arrow')}</button>
        <div class="sidebar-footer"><span class="status-dot"></span> AI companion online</div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="mobile-brand"><span class="brand-mark">✦</span> mind<span>ease</span></div>
          <div class="topbar-actions">
            <button class="icon-button notification-button" data-action="notifications" aria-label="Notifications" aria-expanded="${notificationOpen}">♧<span class="notification-badge">${data.notifications.filter((item) => item.unread).length}</span></button>
            <button class="profile-chip" data-view="profile"><span class="avatar">AS</span><span class="profile-name">Arjun Sharma</span><span class="chevron">⌄</span></button>
          </div>
        </header>
        <div class="page-content">${renderView()}</div>
      </main>
      <button class="floating-sos" data-action="sos" aria-label="Get urgent help"><span>!</span><small>SOS</small></button>
    </div>
    ${notificationOpen ? `<section class="notification-panel" aria-label="Notifications"><div class="notification-panel-heading"><strong>Notifications</strong><button class="text-button" data-action="notifications">Close</button></div>${data.notifications.length ? data.notifications.map((item) => `<button class="notification-item ${item.unread ? 'is-unread' : ''}" data-notification="${item.id}"><strong>${item.title}</strong><small>${item.detail}</small></button>`).join('') : '<p class="empty-state">You’re all caught up.</p>'}</section>` : ''}
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

function renderAuth() {
  const stages = {
    welcome: `<div class="auth-card auth-welcome"><div class="auth-brand"><span class="brand-mark">✦</span> mind<span>ease</span></div><div class="auth-robot">◡<i>✦</i></div><p class="overline">YOUR JOYFUL WELLNESS COMPANION</p><h1>Feel better,<br><em>one small step</em> at a time.</h1><p class="auth-copy">A private space to check in, reflect, and find your calm — made for student life.</p><button class="primary-button full-width" data-auth="signup">Get started ${icon('arrow')}</button><button class="text-button full-width" data-auth="login">I already have an account</button><p class="auth-footnote">By continuing, you agree to our privacy-first approach.</p></div>`,
    signup: `<div class="auth-card"><button class="auth-back" data-auth="welcome">${icon('back')} Back</button><p class="overline">CREATE YOUR SPACE</p><h1>Let’s make room<br><em>for you.</em></h1><p class="auth-copy">Start with a private account. You can change your preferences anytime.</p><form class="auth-form" data-form="signup"><label>First name<input name="name" type="text" placeholder="Arjun" required autocomplete="given-name"></label><label>University email<input name="email" type="email" placeholder="you@university.edu" required autocomplete="email"></label><label>Password<input name="password" type="password" placeholder="At least 8 characters" minlength="8" required autocomplete="new-password"></label><label class="checkbox-label"><input name="terms" type="checkbox" required><span>I agree to the <button type="button" class="inline-link" data-auth="privacy">privacy policy</button> and community guidelines.</span></label><button class="primary-button full-width" type="submit">Create account ${icon('arrow')}</button></form><p class="auth-switch">Already a member? <button data-auth="login">Log in</button></p></div>`,
    login: `<div class="auth-card"><button class="auth-back" data-auth="welcome">${icon('back')} Back</button><p class="overline">WELCOME BACK</p><h1>Good to see<br><em>you again.</em></h1><form class="auth-form" data-form="login"><label>Email<input name="email" type="email" placeholder="you@university.edu" required autocomplete="email"></label><label>Password<input name="password" type="password" placeholder="Your password" required autocomplete="current-password"></label><button type="button" class="forgot-link" data-auth="reset">Forgot password?</button><button class="primary-button full-width" type="submit">Log in ${icon('arrow')}</button></form><p class="auth-switch">New to MindEase? <button data-auth="signup">Create an account</button></p></div>`,
    verify: `<div class="auth-card auth-centered"><span class="auth-status-icon">✉</span><p class="overline">ONE LAST STEP</p><h1>Check your<br><em>inbox.</em></h1><p class="auth-copy">We sent a verification link to <strong>${session.email || 'your email'}</strong>. Verify it to keep your wellness space secure.</p><button class="primary-button full-width" data-auth="privacy">I’ve verified my email ${icon('arrow')}</button><button class="text-button full-width" data-auth="signup">Use a different email</button><p class="auth-footnote">Didn’t receive it? <button class="inline-link" data-action="resend">Resend email</button></p></div>`,
    privacy: `<div class="auth-card"><p class="overline">YOUR PRIVACY, YOUR CHOICE</p><h1>Set up your<br><em>safe space.</em></h1><p class="auth-copy">MindEase is designed to support you, never to judge you. Choose what you’re comfortable sharing.</p><div class="consent-list"><label class="consent-row"><span class="consent-icon">♧</span><span><strong>Gentle reminders</strong><small>Daily check-in notifications</small></span><input type="checkbox" data-setting="notifications" ${settings.notifications ? 'checked' : ''}></label><label class="consent-row"><span class="consent-icon">◈</span><span><strong>Health connections</strong><small>Optional wearable insights</small></span><input type="checkbox" data-setting="healthData" ${settings.healthData ? 'checked' : ''}></label><label class="consent-row"><span class="consent-icon">⌁</span><span><strong>Improve MindEase</strong><small>Anonymous product analytics</small></span><input type="checkbox" data-setting="analytics" ${settings.analytics ? 'checked' : ''}></label></div><button class="primary-button full-width" data-auth="complete">Enter my space ${icon('arrow')}</button><p class="auth-footnote">You can review or withdraw permissions anytime in Profile.</p></div>`,
    reset: `<div class="auth-card"><button class="auth-back" data-auth="login">${icon('back')} Back to login</button><p class="overline">ACCOUNT RECOVERY</p><h1>Let’s get you<br><em>back in.</em></h1><p class="auth-copy">Enter your email and we’ll send a secure password reset link.</p><form class="auth-form" data-form="reset"><label>Email<input name="email" type="email" placeholder="you@university.edu" required autocomplete="email"></label><button class="primary-button full-width" type="submit">Send reset link ${icon('arrow')}</button></form></div>`,
  };
  return `<main class="auth-shell">${stages[session.stage]}${authError ? `<p class="form-error" role="alert">${authError}</p>` : ''}</main>`;
}
function attachAuthEvents() {
  document.querySelectorAll('[data-auth]').forEach((button) => button.addEventListener('click', () => {
    const target = button.dataset.auth;
    if (target === 'complete') { session.authenticated = true; localStorage.setItem('mindease:session', 'active'); const accounts = JSON.parse(localStorage.getItem('mindease:accounts') || '{}'); if (accounts[session.email]) { accounts[session.email].verified = true; localStorage.setItem('mindease:accounts', JSON.stringify(accounts)); } persistSettings(); track('onboarding_complete'); activeView = 'home'; render(); return; }
    authError = '';
    session.stage = target; render();
  }));
  document.querySelectorAll('[data-setting]').forEach((input) => input.addEventListener('change', () => { settings[input.dataset.setting] = input.checked; persistSettings(); }));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.action === 'resend') showAuthMessage('A fresh verification email is on its way.'); }));
  document.querySelectorAll('[data-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    if (form.dataset.form === 'reset') { const accounts = JSON.parse(localStorage.getItem('mindease:accounts') || '{}'); if (!accounts[values.email]) { setAuthError('No MindEase account was found for that email.'); return; } session.email = values.email; session.stage = 'login'; showAuthMessage('Reset link sent. For this demo, your existing password remains active.'); return; }
    const accounts = JSON.parse(localStorage.getItem('mindease:accounts') || '{}');
    if (form.dataset.form === 'login') {
      if (!accounts[values.email] || accounts[values.email].password !== values.password) { setAuthError('We couldn’t sign you in with those details. Try your demo account or create a new one.'); return; }
      session.email = values.email;
      localStorage.setItem('mindease:email', session.email);
      session.stage = accounts[values.email].verified ? 'privacy' : 'verify';
    } else {
      accounts[values.email] = { name: values.name, password: values.password, verified: false };
      localStorage.setItem('mindease:accounts', JSON.stringify(accounts));
      session.email = values.email;
      localStorage.setItem('mindease:email', session.email);
      session.stage = 'verify';
    }
    authError = '';
    track(form.dataset.form);
    render();
  }));
}
function showAuthMessage(message) { const existing = document.querySelector('.auth-card'); const notice = document.createElement('p'); notice.className = 'form-notice'; notice.textContent = message; existing.querySelector('.auth-form').append(notice); }

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
    <section class="checkin-card"><div class="checkin-heading"><div><span class="step-label">DAILY CHECK-IN <span>01 / 03</span></span><h2>What’s your energy like?</h2></div><span class="checkin-icon">✺</span></div><div class="mood-options">${moods.map((mood) => `<button class="mood-option ${selectedMood === mood.key ? 'is-selected' : ''} mood-${mood.color}" data-mood="${mood.key}" aria-pressed="${selectedMood === mood.key}"><span class="mood-icon">${mood.icon}</span><span class="mood-label">${mood.label}</span><small>${mood.note}</small></button>`).join('')}</div><button class="primary-button checkin-button" data-action="check-in">Save check-in ${icon('arrow')}</button></section>
    <div class="section-heading"><div><p class="overline">YOUR SPACE</p><h2>Keep feeling better</h2></div><button class="link-button" data-view="wellness">See all ${icon('arrow')}</button></div>
    <div class="resource-grid"><article class="resource-card resource-teal"><span class="resource-symbol">◒</span><div><p class="overline">2 MINUTES</p><h3>Reset your breath</h3><p>Find your calm with box breathing.</p></div><button class="circle-arrow" data-view="wellness">${icon('arrow')}</button></article><article class="resource-card resource-purple"><span class="resource-symbol">✧</span><div><p class="overline">GENTLE PROMPT</p><h3>Untangle a thought</h3><p>A quick CBT reframe for busy minds.</p></div><button class="circle-arrow" data-view="wellness">${icon('arrow')}</button></article></div>
    <div class="bottom-grid"><section class="streak-card"><div class="streak-top"><span class="streak-icon">♨</span><span class="streak-count">4 day streak</span></div><h3>You're building a habit of showing up.</h3><div class="week-dots"><span class="done">M</span><span class="done">T</span><span class="done">W</span><span class="done">T</span><span>F</span><span>S</span><span>S</span></div></section><section class="insight-card"><span class="insight-icon">✦</span><div><p class="overline">MINDEASE INSIGHT</p><h3>Your check-ins are most consistent around 9 PM.</h3><button class="text-link" data-view="wellness">View your week ${icon('arrow')}</button></div></section></div>
  </div>`;
}

function renderJournal() {
  return `<div class="view journal-view"><div class="view-header"><div><p class="overline">A PRIVATE SPACE FOR YOU</p><h1>Voice journal</h1><p class="page-subtitle">Say what’s on your mind. We’re listening.</p></div><span class="header-art">◌</span></div><section class="journal-recorder ${journalStarted ? 'is-recording' : ''}"><div class="recorder-orbit"><button class="mic-button" data-action="record" aria-label="${journalStarted ? 'Stop recording' : 'Start recording'}"><span class="mic-glyph">${journalStarted ? '■' : '●'}</span></button></div><p class="recording-status">${journalStarted ? 'Listening gently…' : 'Tap to speak'}</p><p class="recording-hint">${journalStarted ? 'Tap again when you’re ready to pause' : 'No typing, no judgment. Just your voice.'}</p>${journalStarted ? '<div class="sound-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}</section><div class="section-heading journal-history-heading"><div><p class="overline">YOUR REFLECTIONS</p><h2>Recent recordings</h2></div><span class="count-label">${data.journalEntries.length} entries</span></div><div class="recording-list"><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>Late night thoughts</h3><p>Yesterday · 2 min 14 sec</p></div><span class="recording-mood">☁️</span><span class="recording-more">•••</span></article><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>A small win today</h3><p>Sunday · 1 min 48 sec</p></div><span class="recording-mood">☀️</span><span class="recording-more">•••</span></article><article class="recording-card"><span class="recording-play">${icon('play')}</span><div><h3>Before the exam</h3><p>Friday · 3 min 02 sec</p></div><span class="recording-mood">🌧️</span><span class="recording-more">•••</span></article></div></div>`;
}

function renderWellness() {
  return `<div class="view wellness-view"><div class="view-header"><div><p class="overline">YOUR WEEK IN FEELINGS</p><h1>A little more ease.</h1><p class="page-subtitle">Notice the patterns, celebrate the progress.</p></div><span class="header-art wellness-art">✺</span></div><section class="mood-chart-card"><div class="chart-heading"><div><h2>Monday — today</h2><p>Your mood has been gently rising.</p></div><span class="trend-badge">↗ 18%</span></div><div class="mood-chart"><div class="chart-labels"><span>Good</span><span>Okay</span><span>Low</span></div><svg viewBox="0 0 560 150" role="img" aria-label="Mood trend rising through the week"><path class="chart-grid" d="M0 20H560M0 75H560M0 130H560"/><path class="chart-line" d="M10 107 C70 110, 80 75, 140 88 S200 110, 250 65 S310 75, 355 54 S415 79, 470 42 S520 55, 550 27"/><circle cx="10" cy="107" r="5"/><circle cx="140" cy="88" r="5"/><circle cx="250" cy="65" r="5"/><circle cx="355" cy="54" r="5"/><circle cx="470" cy="42" r="5"/><circle cx="550" cy="27" r="7"/></svg><div class="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div></section><p class="overline wellness-label">MADE FOR THIS MOMENT</p><div class="wellness-grid"><article class="wellness-card breathing-card"><span class="card-number">01</span><span class="wellness-illustration">◌</span><h3>Box breathing</h3><p>Find your center in four easy counts.</p><button class="outline-button" data-action="start-resource">Start exercise ${icon('arrow')}</button></article><article class="wellness-card cbt-card"><span class="card-number">02</span><span class="wellness-illustration">✧</span><h3>Thought reframing</h3><p>Turn a heavy thought into a kinder one.</p><button class="outline-button" data-action="start-resource">Try a prompt ${icon('arrow')}</button></article><article class="wellness-card audio-card"><span class="card-number">03</span><span class="wellness-illustration">♫</span><h3>Soft focus</h3><p>Ambient sounds for deep, gentle focus.</p><button class="outline-button" data-action="start-resource">Listen now ${icon('arrow')}</button></article></div></div>`;
}

function renderCommunity() { return `<div class="view community-view"><div class="view-header"><div><p class="overline">A SPACE TO FEEL SEEN</p><h1>You’re in good company.</h1><p class="page-subtitle">Anonymous, moderated, and kind by design.</p></div><span class="header-art">♧</span></div><div class="community-banner"><div><span class="overline">TODAY’S COMMUNITY THEME</span><h2>What helped you feel a little lighter today?</h2><button class="primary-button" data-action="share">Share anonymously ${icon('arrow')}</button></div><span class="banner-art">☼</span></div><div class="section-heading"><div><p class="overline">FROM YOUR PEERS</p><h2>Recent reflections</h2></div><button class="link-button" data-action="filter">Latest ⌄</button></div><div class="post-list"><article class="post-card"><div class="post-meta"><span class="post-avatar avatar-lavender">S</span><span>student_07 · 8 min ago</span><span class="post-tag">EXAMS</span></div><p>“I finally took a proper break between study sessions today. It felt uncomfortable at first, but my brain thanked me later.”</p><div class="post-actions"><button data-action="support">♡ 24 found this helpful</button><button data-action="reply">○ Reply</button></div></article><article class="post-card"><div class="post-meta"><span class="post-avatar avatar-gold">A</span><span>anonymous · 32 min ago</span><span class="post-tag">SMALL WINS</span></div><p>“Asked a friend for help instead of pretending I understood the assignment. Tiny step, huge relief.”</p><div class="post-actions"><button data-action="support">♡ 18 found this helpful</button><button data-action="reply">○ Reply</button></div></article></div></div>`; }

function renderProfile() { return `<div class="view profile-view"><div class="profile-hero"><div class="large-avatar">AS</div><div><p class="overline">YOUR MINDEASE PROFILE</p><h1>Arjun Sharma</h1><p class="page-subtitle">B.Tech CSE · Year 2 · ${session.email || 'verified student'}</p></div><button class="icon-button edit-button" data-action="edit" aria-label="Edit profile">✎</button></div><div class="profile-stat-row"><div><strong>${data.checkins.length}</strong><span>check-ins</span></div><div><strong>${Math.min(data.checkins.length, 4)}</strong><span>day streak</span></div><div><strong>${data.journalEntries.length}</strong><span>reflections</span></div></div><section class="settings-card"><p class="overline">PRIVACY & PERMISSIONS</p>${settingRow('notifications', 'Gentle reminders', 'Daily check-in notifications', '♧')}${settingRow('healthData', 'Health connections', 'Wearable data is optional', '◈')}${settingRow('analytics', 'Anonymous analytics', 'Help us improve MindEase', '⌁')}${settingRow('crashReports', 'Crash reporting', 'Send diagnostic reports privately', '⚕')}</section><section class="settings-card account-card"><p class="overline">YOUR ACCOUNT</p><button class="setting-row" data-action="payment"><span class="setting-icon">₹</span><span><strong>MindEase Plus</strong><small>${data.subscription === 'plus' ? 'Plus is active in demo mode' : 'Unlock personalized care · ₹299/month'}</small></span><span class="plan-badge">${data.subscription === 'plus' ? 'ACTIVE' : 'UPGRADE'}</span></button><button class="setting-row" data-action="beta"><span class="setting-icon">✦</span><span><strong>Join the student beta</strong><small>${data.beta === 'joined' ? 'You’re on the early access list' : 'Help shape what comes next'}</small></span>${icon('arrow')}</button><button class="setting-row" data-action="logout"><span class="setting-icon">↪</span><span><strong>Log out</strong><small>End this session on this device</small></span>${icon('arrow')}</button><button class="setting-row danger-row" data-action="delete"><span class="setting-icon">×</span><span><strong>Delete account</strong><small>Permanently remove your data</small></span>${icon('arrow')}</button></section><p class="profile-owner">MindEase companion · Built with care for students</p></div>`; }
function settingRow(key, title, detail, glyph) { return `<label class="setting-row setting-label"><span class="setting-icon">${glyph}</span><span><strong>${title}</strong><small>${detail}</small></span><input type="checkbox" data-setting="${key}" ${settings[key] ? 'checked' : ''}><span class="toggle ${settings[key] ? 'is-on' : ''}"><i></i></span></label>`; }

function showToast(message) { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 2800); }
function attachEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { activeView = button.dataset.view; render(); }));
  document.querySelectorAll('[data-mood]').forEach((button) => button.addEventListener('click', () => { selectedMood = button.dataset.mood; render(); }));
  document.querySelectorAll('[data-setting]').forEach((input) => input.addEventListener('change', () => { settings[input.dataset.setting] = input.checked; persistSettings(); track(`setting_${input.dataset.setting}`); render(); }));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAction(button.dataset.action)));
  document.querySelectorAll('[data-notification]').forEach((button) => button.addEventListener('click', () => { const item = data.notifications.find((entry) => String(entry.id) === button.dataset.notification); if (item) item.unread = false; persistData(); render(); }));
}
function handleAction(action) {
  if (action === 'sos') { document.querySelector('.modal-backdrop').hidden = false; return; }
  if (action === 'close-modal') { document.querySelector('.modal-backdrop').hidden = true; return; }
  if (action === 'connect') { document.querySelector('.modal-backdrop').hidden = true; showToast('Connecting you with a counselor now.'); return; }
  if (action === 'record') { journalStarted = !journalStarted; if (!journalStarted) { data.journalEntries.unshift({ title: 'A moment to myself', at: new Date().toISOString() }); persistData(); showToast('Your reflection was saved privately on this device.'); } render(); return; }
  if (action === 'check-in') { if (!isOnline()) { showToast('You’re offline. Your check-in is saved locally.'); } data.checkins.push({ mood: selectedMood, at: new Date().toISOString() }); persistData(); localStorage.setItem('mindease:mood', selectedMood); track('mood_check_in'); showToast(`Check-in saved. ${selectedMood === 'good' ? 'Keep that bright energy going.' : 'Thanks for checking in with yourself.'}`); return; }
  if (action === 'start-resource') { track('wellness_resource_started'); showToast('Your exercise is ready. Take two quiet minutes for yourself.'); return; }
  if (action === 'share') { showToast('Your reflection space is ready when you are.'); return; }
  if (action === 'support') { showToast('Sent a little support their way.'); return; }
  if (action === 'edit') { showToast('Profile editing will be available soon.'); return; }
  if (action === 'resend') { showToast('A fresh verification email is on its way.'); return; }
  if (action === 'payment') { data.subscription = 'plus'; persistData(); track('payment_completed'); showToast('Demo subscription activated. No payment was collected.'); render(); return; }
  if (action === 'beta') { data.beta = data.beta === 'joined' ? 'not-joined' : 'joined'; persistData(); showToast(data.beta === 'joined' ? 'You’re on the MindEase student beta list.' : 'You left the student beta list.'); render(); return; }
  if (action === 'logout') { session.authenticated = false; session.stage = 'welcome'; localStorage.removeItem('mindease:session'); render(); return; }
  if (action === 'delete') { if (window.confirm('Delete your MindEase demo account and all MindEase data from this device?')) { Object.keys(localStorage).filter((key) => key.startsWith('mindease:')).forEach((key) => localStorage.removeItem(key)); session.authenticated = false; session.stage = 'welcome'; authError = ''; render(); } return; }
  if (action === 'notifications') { notificationOpen = !notificationOpen; if (!notificationOpen) { data.notifications.forEach((item) => { item.unread = false; }); persistData(); } render(); return; }
  if (action === 'toggle') { const toggle = document.querySelector('.toggle'); toggle.classList.toggle('is-on'); showToast(toggle.classList.contains('is-on') ? 'Reminder turned on.' : 'Reminder turned off.'); return; }
  showToast('This space is being prepared for you.');
}

render();
