// ==========================================================
// PIETRA NOBILE — main.js
// Preloader · Nav · Scroll reveals · Hero video · Inquiry form
// ==========================================================

// ---------- preloader ----------
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 1400);
});

// ---------- nav ----------
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

// ---------- scroll reveals ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- hero video ----------
(function () {
  const src = window.PN_CONFIG.HERO_VIDEO;
  if (!src) return;
  const m = document.getElementById('heroMedia');
  const v = document.createElement('video');
  v.src = src; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('playsinline', '');
  m.appendChild(v);
  v.addEventListener('canplay', () => { m.querySelector('img').style.display = 'none'; });
})();

// ---------- consultation form → Supabase ----------
document.getElementById('consultForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const f = this;
  const status = document.getElementById('formStatus');
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  status.textContent = 'Sending…';
  const payload = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim() || null,
    interest: f.interest.value,
    budget: f.budget.value,
    message: f.message.value.trim() || null
  };
  try {
    const r = await fetch(window.PN_CONFIG.SUPABASE_URL + '/rest/v1/pn_inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': window.PN_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + window.PN_CONFIG.SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    f.reset();
    status.textContent = 'Thank you. A design consultant will contact you within one business day.';
  } catch (err) {
    status.textContent = 'Something went wrong — please email office@udroofing.com directly.';
    btn.disabled = false;
    return;
  }
  btn.disabled = false;
});
