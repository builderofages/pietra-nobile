// ==========================================================
// PIETRA NOBILE — admin.js (Staff Portal)
// Auth · Inquiries · Orders · KPIs
// ==========================================================
const sb = window.supabase.createClient(window.PN_CONFIG.SUPABASE_URL, window.PN_CONFIG.SUPABASE_ANON_KEY);

const $ = id => document.getElementById(id);
const INQ_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
const ORDER_STATUSES = ['deposit_pending', 'in_production', 'shipping', 'installing', 'complete', 'cancelled'];

// ---------- auth ----------
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  session ? showDash(session) : showLogin();
}

function showLogin() {
  $('loginView').classList.remove('hidden');
  $('dashView').classList.add('hidden');
}

async function showDash(session) {
  $('loginView').classList.add('hidden');
  $('dashView').classList.remove('hidden');
  $('whoami').textContent = session.user.email;
  await Promise.all([loadInquiries(), loadOrders()]);
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginErr').textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginPass').value
  });
  if (error) { $('loginErr').textContent = error.message; return; }
  showDash(data.session);
});

$('signOut').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

// ---------- tabs ----------
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  $('tab-' + t.dataset.tab).classList.remove('hidden');
}));

// ---------- helpers ----------
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtMoney = n => n == null ? '—' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const esc = s => (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function statusSelect(current, options, cls) {
  return `<select class="status ${cls}">` +
    options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o.replace(/_/g, ' ')}</option>`).join('') +
    `</select>`;
}

// ---------- inquiries ----------
let inquiries = [];
async function loadInquiries() {
  const { data, error } = await sb.from('pn_inquiries').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  inquiries = data;
  $('inqRows').innerHTML = data.map(q => `
    <tr data-id="${q.id}">
      <td class="dim">${fmtDate(q.created_at)}</td>
      <td>${esc(q.name)}</td>
      <td class="dim">${esc(q.email)}<br>${esc(q.phone || '')}</td>
      <td>${esc(q.interest || '—')}</td>
      <td class="dim">${esc(q.budget || '—')}</td>
      <td class="dim">${esc(q.message || '')}</td>
      <td>${statusSelect(q.status, INQ_STATUSES, 'inq-status')}</td>
      <td><button class="btn ghost to-order" style="padding:8px 14px">→ Order</button></td>
    </tr>`).join('') || '<tr><td colspan="8" class="dim">No inquiries yet.</td></tr>';

  document.querySelectorAll('.inq-status').forEach(sel => sel.addEventListener('change', async e => {
    const id = e.target.closest('tr').dataset.id;
    await sb.from('pn_inquiries').update({ status: e.target.value }).eq('id', id);
    refreshKpis();
  }));
  document.querySelectorAll('.to-order').forEach(btn => btn.addEventListener('click', e => {
    const q = inquiries.find(x => x.id === e.target.closest('tr').dataset.id);
    openOrderModal(q);
  }));
  refreshKpis();
}

// ---------- orders ----------
let orders = [];
async function loadOrders() {
  const { data, error } = await sb.from('pn_orders').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  orders = data;
  $('orderRows').innerHTML = data.map(o => `
    <tr data-id="${o.id}">
      <td class="dim">${fmtDate(o.created_at)}</td>
      <td>${esc(o.customer_name)}<br><span class="dim">${esc(o.email || '')}</span></td>
      <td>${esc(o.item)}<br><span class="dim">${esc(o.description || '')}</span></td>
      <td>${fmtMoney(o.amount)}</td>
      <td><span class="badge">${o.deposit_paid ? 'Paid' : 'Pending'}</span></td>
      <td>${statusSelect(o.status, ORDER_STATUSES, 'order-status')}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="dim">No orders yet.</td></tr>';

  document.querySelectorAll('.order-status').forEach(sel => sel.addEventListener('change', async e => {
    const id = e.target.closest('tr').dataset.id;
    await sb.from('pn_orders').update({ status: e.target.value }).eq('id', id);
    refreshKpis();
  }));
  refreshKpis();
}

// ---------- new order modal ----------
let linkedInquiryId = null;
function openOrderModal(inq) {
  linkedInquiryId = inq ? inq.id : null;
  if (inq) { $('oName').value = inq.name; $('oEmail').value = inq.email || ''; $('oPhone').value = inq.phone || ''; }
  $('orderModal').classList.remove('hidden');
}
$('newOrderBtn').addEventListener('click', () => openOrderModal(null));
$('orderCancel').addEventListener('click', () => { $('orderModal').classList.add('hidden'); $('orderForm').reset(); linkedInquiryId = null; });

$('orderForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('orderErr').textContent = '';
  const { error } = await sb.from('pn_orders').insert({
    inquiry_id: linkedInquiryId,
    customer_name: $('oName').value.trim(),
    email: $('oEmail').value.trim() || null,
    phone: $('oPhone').value.trim() || null,
    item: $('oItem').value.trim(),
    description: $('oDesc').value.trim() || null,
    amount: $('oAmount').value ? Number($('oAmount').value) : null
  });
  if (error) { $('orderErr').textContent = error.message; return; }
  $('orderModal').classList.add('hidden');
  $('orderForm').reset();
  linkedInquiryId = null;
  loadOrders();
});

// ---------- kpis ----------
function refreshKpis() {
  $('kpiNew').textContent = inquiries.filter(q => q.status === 'new').length;
  $('kpiInq').textContent = inquiries.length;
  const open = orders.filter(o => !['complete', 'cancelled'].includes(o.status));
  $('kpiOrders').textContent = open.length;
  $('kpiRev').textContent = fmtMoney(open.reduce((s, o) => s + Number(o.amount || 0), 0));
}

init();
