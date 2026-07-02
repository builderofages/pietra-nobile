// ==========================================================
// PIETRA NOBILE — main.js
// Preloader · Nav · Reveals · Section videos · Inquiry form
// ==========================================================

// ---------- preloader ----------
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 1400);
});

// ---------- nav ----------
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

// ---------- mobile menu ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

// ---------- scroll reveals ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- section videos (hero + full-bleed breaks) ----------
function mountVideo(containerId, src) {
  if (!src) return;
  const m = document.getElementById(containerId);
  if (!m) return;
  const v = document.createElement('video');
  v.src = src; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('playsinline', '');
  m.appendChild(v);
  v.addEventListener('canplay', () => { const img = m.querySelector('img'); if (img) img.style.display = 'none'; });
}
mountVideo('heroMedia', window.PN_CONFIG.HERO_VIDEO);
mountVideo('fountainMedia', window.PN_CONFIG.FOUNTAIN_VIDEO);
mountVideo('fireMedia', window.PN_CONFIG.FIRE_VIDEO);

// ---------- consultation form ----------
// Showcase mode: no backend keys → form confirms without saving.
// Live mode: keys present in js/config.js → saves to database.
const consultForm = document.getElementById('consultForm');
if (consultForm) consultForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const f = this;
  const status = document.getElementById('formStatus');
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  status.textContent = 'Sending…';

  const cfg = window.PN_CONFIG;
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    await new Promise(r => setTimeout(r, 700));
    f.reset();
    status.textContent = 'Thank you. A design consultant will contact you within one business day.';
    btn.disabled = false;
    return;
  }

  const payload = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim() || null,
    interest: f.interest.value,
    budget: f.budget.value,
    message: f.message.value.trim() || null
  };
  try {
    const r = await fetch(cfg.SUPABASE_URL + '/rest/v1/pn_inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    f.reset();
    status.textContent = 'Thank you. A design consultant will contact you within one business day.';
  } catch (err) {
    status.textContent = 'Something went wrong — please try again shortly.';
  }
  btn.disabled = false;
});
