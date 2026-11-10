const C = CONFIG;
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const start = new Date(C.date);
const [y, mo, dd] = new Intl.DateTimeFormat('en-CA', { timeZone: C.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(start).split('-').map(Number);
// ponytail: Azerbaijani names hardcoded, many browsers ship Intl without 'az' (it printed "2027 M05 15, Sat")
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const WEEKDAYS = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'];
const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, dd)).getUTCDay()];
const cap = (s) => s[0].toLocaleUpperCase('az') + s.slice(1);

// ---- Fill text from CONFIG (textContent only, never innerHTML with user data) ----
const text = {
  ...C,
  couple: `${C.groom} & ${C.bride}`,
  initials: `${C.groom[0]}&${C.bride[0]}`,
  dateDots: `${pad(dd)} · ${pad(mo)} · ${y}`,
  dateLong: `${cap(weekday)}, ${dd} ${MONTHS[mo - 1]} ${y}`,
  monthYear: `${MONTHS[mo - 1]} ${y}`,
};
document.querySelectorAll('[data-c]').forEach((el) => {
  const v = text[el.dataset.c];
  if (v) el.textContent = v; else el.remove();
});

const guest = new URLSearchParams(location.search).get('to');
if (guest) $('#guest').textContent = guest.slice(0, 60);

// Greeting: one span per word so each can light up as it scrolls in (see .verse .w in CSS)
const verse = $('#verse');
if (verse) verse.replaceChildren(...verse.textContent.split(' ').flatMap((w, i) => {
  const s = document.createElement('span');
  s.className = 'w';
  s.style.setProperty('--i', i);
  s.textContent = w;
  return [s, ' '];
}));

// ---- Opening: curtains part, camera flies through the floral arch into the garden ----
const gate = $('#gate');
const audio = $('#audio');
const musicBtn = $('#music');
function openInvite() {
  if (gate.classList.contains('open')) return;
  gate.classList.add('open');
  document.body.classList.add('revealing');
  window.scrollTo(0, 0);
  setTimeout(() => document.body.classList.add('revealed'), rm ? 0 : 3000);
  setTimeout(() => {
    document.body.classList.remove('locked');
    gate.remove();
    $('#floralGate').remove();
  }, rm ? 300 : 4000);
  if (C.music) {   // the tap is the user gesture browsers require for audio
    audio.src = C.music;
    audio.volume = 0.7;
    musicBtn.hidden = false;
    audio.play().catch(() => {});
  }
}
$('#open').addEventListener('click', openInvite);
musicBtn.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
audio.addEventListener('play', () => { musicBtn.classList.add('playing'); musicBtn.ariaLabel = 'Musiqini dayandır'; });
audio.addEventListener('pause', () => { musicBtn.classList.remove('playing'); musicBtn.ariaLabel = 'Musiqini aç'; });

// ---- Petals ----
// ponytail: 14 CSS-animated imgs; canvas only if you want hundreds
const petals = $('.petals');
for (let i = 0; i < 14; i++) {
  const p = document.createElement('img');
  p.src = `assets/petal-${1 + (i % 6)}.webp`;
  p.alt = '';
  const size = 14 + Math.random() * 14;
  Object.assign(p.style, {
    left: `${Math.random() * 100}%`,
    width: `${size}px`,
    animationDuration: `${10 + Math.random() * 9}s`,
    animationDelay: `${-Math.random() * 18}s`,
  });
  p.style.setProperty('--x', `${(Math.random() - 0.5) * 220}px`);
  petals.append(p);
}

// ---- Calendar (month of the wedding, Monday first) ----
const firstDow = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7;
const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
const cells = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'].map((d) => `<span class="wd">${d}</span>`);
for (let i = 0; i < firstDow; i++) cells.push('<span></span>');
for (let d = 1; d <= daysInMonth; d++) {
  cells.push(d === dd
    ? `<span class="the-day">${d}<svg viewBox="0 0 60 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M44 9C33 2 12 6 7 24c-4 16 8 30 25 29 17-1 25-14 22-29-2-9-10-14-20-14"/></svg></span>`
    : `<span>${d}</span>`);
}
$('#cal').innerHTML = cells.join('');

// ---- Countdown ----
function set(id, v) {
  const el = $(id);
  if (el.textContent === String(v)) return;
  el.textContent = v;
  if (!rm) el.animate([{ transform: 'translateY(-55%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
}
function tick() {
  const ms = start - Date.now();
  if (ms <= 0) {
    $('#timer').outerHTML = '<p class="verse" style="margin:0 auto">Biz artıq ailəyik! Sevincimizi bizimlə bölüşdüyünüz üçün təşəkkür edirik.</p>';
    return clearInterval(timer);
  }
  set('#d', Math.floor(ms / 864e5));
  set('#h', pad(Math.floor(ms / 36e5) % 24));
  set('#m', pad(Math.floor(ms / 6e4) % 60));
  set('#s', pad(Math.floor(ms / 1e3) % 60));
}
const timer = setInterval(tick, 1000);
tick();

// ---- Venue ----
const eventsEl = $('#events');
C.events.forEach((ev) => {
  const box = document.createElement('div');
  box.className = 'event';
  for (const [cls, val] of [['e-title', ev.title], ['e-time', ev.time], ['e-place', ev.place], ['e-addr', ev.address]]) {
    if (!val) continue;
    const el = document.createElement('p');
    el.className = cls;
    el.textContent = val;
    box.append(el);
  }
  eventsEl.append(box);
});
$('#map').src = `https://maps.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&z=15&output=embed`;
$('#directions').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(C.mapQuery)}`;
