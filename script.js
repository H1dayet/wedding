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
  cardTime: C.events[0] && C.events[0].time ? `Saat ${C.events[0].time}` : '',
  venueLine: C.events[0] ? [C.events[0].place, C.events[0].address].filter(Boolean).join(' · ') : '',
};
document.querySelectorAll('[data-c]').forEach((el) => {
  const v = text[el.dataset.c];
  if (v) el.textContent = v; else el.remove();
});
document.querySelectorAll('img[data-photo]').forEach((img) => {
  const src = C.photos[img.dataset.photo];
  if (src) img.src = src; else (img.closest('figure') || img).remove();
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

// ---- Envelope open + music ----
const gate = $('#gate');
const audio = $('#audio');
const musicBtn = $('#music');
// s1 seal cracks + flap opens, s2 card rises out, s3 envelope falls away + card comes forward, s4 card text + Continue
function openInvite() {
  if (gate.dataset.opened) return;
  gate.dataset.opened = '1';
  const at = rm ? [0, 0, 0, 0] : [0, 1300, 2500, 3500];
  ['s1', 's2', 's3', 's4'].forEach((cls, i) => setTimeout(() => gate.classList.add(cls), at[i]));
  if (C.music) {   // the tap on the seal is the user gesture browsers require for audio
    audio.src = C.music;
    musicBtn.hidden = false;
    audio.play().catch(() => {});
  }
}
function enterSite() {
  gate.classList.add('leave');
  window.scrollTo(0, 0);
  setTimeout(() => document.body.classList.add('revealed'), rm ? 0 : 500);
  setTimeout(() => { document.body.classList.remove('locked'); gate.remove(); }, rm ? 250 : 1100);
}
$('#seal').addEventListener('click', openInvite);
$('#enter').addEventListener('click', enterSite);
musicBtn.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
audio.addEventListener('play', () => { musicBtn.classList.add('playing'); musicBtn.ariaLabel = 'Musiqini dayandır'; });
audio.addEventListener('pause', () => { musicBtn.classList.remove('playing'); musicBtn.ariaLabel = 'Musiqini aç'; });

// ---- Petals ----
// ponytail: 14 CSS-animated spans; canvas only if you want hundreds
const petals = $('.petals');
for (let i = 0; i < 14; i++) {
  const p = document.createElement('span');
  const size = 9 + Math.random() * 9;
  Object.assign(p.style, {
    left: `${Math.random() * 100}%`,
    width: `${size}px`, height: `${size * 0.8}px`,
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
    ? `<span class="the-day">${d}<img src="assets/date-circle.webp" alt=""></span>`
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
    $('#timer').outerHTML = '<p class="verse" style="margin:0 auto 40px">Biz artıq ailəyik! Sevincimizi bizimlə bölüşdüyünüz üçün təşəkkür edirik.</p>';
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
