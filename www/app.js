const $ = s => document.querySelector(s);
const KEY = 'hejab-factor-v1';
let state = { customer: '', rows: [{ name: '', qty: '', price: '' }], no: 1 };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.rows) state = s; } catch (e) {}

const toNum = v => {
  const en = String(v || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g, '');
  return en ? parseInt(en, 10) : 0;
};
const fmt = n => n.toLocaleString('fa-IR');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toLocaleDateString('fa-IR-u-ca-persian');
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const total = r => toNum(r.qty) * toNum(r.price);
const grand = () => state.rows.reduce((a, r) => a + total(r), 0);

function renderRows() {
  $('#rows').innerHTML = state.rows.map((r, i) => `
    <div class="row" data-i="${i}">
      <input data-k="name" placeholder="نام کالا" value="${esc(r.name)}">
      <div class="grid">
        <input data-k="qty" inputmode="numeric" placeholder="تعداد" value="${esc(r.qty)}">
        <input data-k="price" inputmode="numeric" placeholder="قیمت واحد (تومان)" value="${esc(r.price)}">
      </div>
      <div class="line"><span>قیمت کل: <b class="lt">${fmt(total(r))}</b> تومان</span>
        ${state.rows.length > 1 ? '<button class="del" data-del="' + i + '">حذف</button>' : ''}</div>
    </div>`).join('');
  updateTotals();
}
function updateTotals() {
  $('#grand').textContent = fmt(grand()) + ' تومان';
  $('#meta').textContent = 'شماره ' + fmt(state.no) + ' • ' + today();
  document.querySelectorAll('.row').forEach(el => { el.querySelector('.lt').textContent = fmt(total(state.rows[+el.dataset.i])); });
}

$('#rows').addEventListener('input', e => {
  const row = e.target.closest('.row'); if (!row) return;
  state.rows[+row.dataset.i][e.target.dataset.k] = e.target.value;
  save(); updateTotals();
});
$('#rows').addEventListener('click', e => {
  if (e.target.dataset.del !== undefined) { state.rows.splice(+e.target.dataset.del, 1); save(); renderRows(); }
});
$('#add').onclick = () => { state.rows.push({ name: '', qty: '', price: '' }); save(); renderRows(); };
$('#customer').value = state.customer;
$('#customer').oninput = e => { state.customer = e.target.value; save(); };
$('#reset').onclick = () => {
  if (!confirm('فاکتور جدید ساخته شود؟')) return;
  state = { customer: '', rows: [{ name: '', qty: '', price: '' }], no: state.no + 1 };
  $('#customer').value = ''; save(); renderRows();
};

function buildSheet() {
  const rows = state.rows.filter(r => r.name.trim() || total(r));
  $('#sheet').innerHTML = `
    <div class="h"><img src="logo.jpg"><div><h2>مجتمع حجاب اهواز</h2><p>فاکتور فروش</p></div></div>
    <div class="info"><span>شماره: ${fmt(state.no)}</span><span>تاریخ: ${today()}</span></div>
    ${state.customer ? '<div class="info"><span>مشتری: ' + esc(state.customer) + '</span></div>' : ''}
    <table><tr><th>#</th><th>نام کالا</th><th>تعداد</th><th>قیمت واحد</th><th>قیمت کل</th></tr>
    ${rows.map((r, i) => `<tr><td>${fmt(i + 1)}</td><td>${esc(r.name)}</td><td>${fmt(toNum(r.qty))}</td><td>${fmt(toNum(r.price))}</td><td>${fmt(total(r))}</td></tr>`).join('')}
    </table>
    <div class="tot"><span>مجموع کل</span><span>${fmt(grand())} تومان</span></div>
    <div class="foot">با تشکر از خرید شما</div>`;
}

$('#share').onclick = async () => {
  const btn = $('#share'); btn.disabled = true; const old = btn.textContent; btn.textContent = 'در حال ساخت عکس...';
  try {
    buildSheet();
    await new Promise(r => setTimeout(r, 300));
    const canvas = await html2canvas($('#sheet'), { scale: 2, backgroundColor: '#ffffff' });
    const dataUrl = canvas.toDataURL('image/png');
    const name = 'factor-' + state.no + '-' + Date.now() + '.png';
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      const { Filesystem, Share } = cap.Plugins;
      const f = await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: 'CACHE' });
      await Share.share({ title: 'فاکتور', files: [f.uri] });
    } else {
      const a = document.createElement('a'); a.href = dataUrl; a.download = name; a.click();
    }
  } catch (e) { if (!/cancel/i.test(String(e))) alert('خطا: ' + e); }
  btn.disabled = false; btn.textContent = old;
};
renderRows();
