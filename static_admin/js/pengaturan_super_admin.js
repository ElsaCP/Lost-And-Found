// ===== Utilities =====
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const STORAGE_KEY = 'adminUsers';

// seed awal (jika kosong) — gunakan ROLE baru: "Super Admin" & "Admin"
const seedAdmins = [
  {
    id: cryptoRandomId(),
    name: 'Super Admin',
    email: 'super@domain.com',
    phone: '081234567890',
    role: 'Super Admin',
    status: 'aktif',
    lastLogin: '2025-10-10 09:15',
    avatar: 'image/default-avatar.png'
  },
  {
    id: cryptoRandomId(),
    name: 'Admin Operasional',
    email: 'admin.op@domain.com',
    phone: '081234567891',
    role: 'Admin',
    status: 'aktif',
    lastLogin: '2025-10-12 14:02',
    avatar: 'image/default-avatar.png'
  }
];

function cryptoRandomId(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2,10);
}

function getAdmins(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAdmins)); return seedAdmins; }
  try { return JSON.parse(raw) || []; } catch { return []; }
}

function saveAdmins(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// ===== State & Elements =====
let admins = getAdmins();

const adminList   = $('#adminList');
const searchInput = $('#searchInput');
const roleFilter  = $('#roleFilter');
const statusFilter= $('#statusFilter');

const btnAddAdmin = $('#btnAddAdmin');
const modal       = $('#modalAdmin');
const closeModal  = $('#closeModal');
const btnCancel   = $('#btnCancel');

const adminForm = $('#adminForm');
const fId     = $('#fId');
const fName   = $('#fName');
const fEmail  = $('#fEmail');
const fPhone  = $('#fPhone');
const fRole   = $('#fRole');   // "Super Admin" | "Admin"
const fStatus = $('#fStatus');
const fAvatar = $('#fAvatar');

const toast = $('#toast');

// ===== Render =====
function render(){
  const term = (searchInput.value || '').toLowerCase();
  const rf   = roleFilter.value;   // "" | "Super Admin" | "Admin"
  const sf   = statusFilter.value;

  const filtered = admins.filter(a => {
    const matchesTerm = !term ||
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      (a.role||'').toLowerCase().includes(term);
    const matchesRole = !rf || a.role === rf;
    const matchesStatus = !sf || a.status === sf;
    return matchesTerm && matchesRole && matchesStatus;
  });

  adminList.innerHTML = filtered.map(a => cardHTML(a)).join('') || emptyHTML();
  bindCardEvents();
}

function cardHTML(a){
  const roleClass = (a.role === 'Super Admin') ? 'super' : '';
  const statusClass = a.status === 'aktif' ? 'aktif' : 'nonaktif';
  const toggleLabel = a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan';
  return `
    <div class="card" data-id="${a.id}">
      <img class="avatar" src="${a.avatar||'image/default-avatar.png'}" alt="${escapeHtml(a.name)}"/>
      <div class="admin-info">
        <h3>${escapeHtml(a.name)}</h3>
        <div class="sub">
          <span><i class="bi bi-envelope"></i> ${escapeHtml(a.email)}</span>
          <span><i class="bi bi-telephone"></i> ${escapeHtml(a.phone||'-')}</span>
        </div>
        <div class="sub">
          <span class="chip ${roleClass}"><i class="bi bi-person-badge"></i> ${escapeHtml(a.role)}</span>
          <span class="chip ${statusClass}"><i class="bi bi-record-fill"></i> ${a.status}</span>
          <span class="chip"><i class="bi bi-clock"></i> ${escapeHtml(a.lastLogin||'-')}</span>
        </div>
        <div class="admin-actions">
          <button class="btn-sm act-edit"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="btn-sm act-toggle"><i class="bi bi-power"></i> ${toggleLabel}</button>
          <button class="btn-sm act-delete"><i class="bi bi-trash"></i> Hapus</button>
          <a class="btn-sm" href="ganti_password.html"><i class="bi bi-shield-lock"></i> Ganti PW</a>
        </div>
      </div>
    </div>
  `;
}

function emptyHTML(){
  return `
    <div class="card" style="grid-column: 1 / -1;display:flex;justify-content:center;align-items:center;">
      <div style="text-align:center;color:#666;">
        <i class="bi bi-inboxes" style="font-size:26px;"></i>
        <div style="margin-top:6px;">Belum ada admin yang cocok dengan filter.</div>
      </div>
    </div>
  `;
}

function bindCardEvents(){
  $$('.act-edit').forEach(btn => btn.addEventListener('click', onEdit));
  $$('.act-delete').forEach(btn => btn.addEventListener('click', onDelete));
  $$('.act-toggle').forEach(btn => btn.addEventListener('click', onToggleStatus));
}

// ===== Actions =====
function onEdit(e){
  const card = e.currentTarget.closest('.card');
  const id = card?.dataset.id;
  const a = admins.find(x => x.id === id);
  if (!a) return;

  fId.value = a.id;
  fName.value = a.name || '';
  fEmail.value = a.email || '';
  fPhone.value = a.phone || '';
  fRole.value = a.role || 'Admin';
  fStatus.value = a.status || 'aktif';
  fAvatar.value = ''; // reset file input

  $('#modalTitle').textContent = 'Edit Admin';
  openModal();
}

function onDelete(e){
  const card = e.currentTarget.closest('.card');
  const id = card?.dataset.id;
  const a = admins.find(x => x.id === id);
  if (!a) return;

  // Cegah hapus Super Admin terakhir
  if (a.role === 'Super Admin'){
    const countSuper = admins.filter(x => x.role === 'Super Admin').length;
    if (countSuper <= 1){
      alert('Tidak bisa menghapus Super Admin terakhir.');
      return;
    }
  }

  if (confirm(`Hapus admin "${a.name}"?`)){
    admins = admins.filter(x => x.id !== id);
    saveAdmins(admins);
    render();
    showToast('Admin dihapus.');
  }
}

function onToggleStatus(e){
  const card = e.currentTarget.closest('.card');
  const id = card?.dataset.id;
  const a = admins.find(x => x.id === id);
  if (!a) return;

  a.status = (a.status === 'aktif') ? 'nonaktif' : 'aktif';
  saveAdmins(admins);
  render();
  showToast('Status diperbarui.');
}

function openAdd(){
  fId.value = '';
  adminForm.reset();
  fRole.value = 'Admin';
  fStatus.value = 'aktif';
  $('#modalTitle').textContent = 'Tambah Admin';
  openModal();
}

function openModal(){ modal.classList.remove('hidden'); }
function closeModalFn(){ modal.classList.add('hidden'); }

// ===== Form Submit =====
adminForm.addEventListener('submit', async (e)=>{
  e.preventDefault();

  const id     = fId.value || cryptoRandomId();
  const name   = fName.value.trim();
  const email  = fEmail.value.trim();
  const phone  = fPhone.value.trim();
  const role   = fRole.value;   // "Super Admin" | "Admin"
  const status = fStatus.value;

  if (!name || !email){ alert('Nama dan Email wajib diisi.'); return; }

  // optional avatar
  let avatarDataUrl = null;
  if (fAvatar.files && fAvatar.files[0]){
    avatarDataUrl = await fileToDataURL(fAvatar.files[0]);
  }

  const existingIdx = admins.findIndex(a => a.id === id);
  if (existingIdx >= 0){
    // edit
    const prev = admins[existingIdx];

    // Cegah hilang semua Super Admin saat mengubah role
    if (prev.role === 'Super Admin' && role !== 'Super Admin'){
      const otherSuper = admins.filter(a => a.id !== id && a.role === 'Super Admin').length;
      if (otherSuper === 0){
        alert('Minimal harus ada 1 Super Admin. Tidak bisa mengubah role ini menjadi Admin.');
        return;
      }
    }

    const next = {
      ...prev,
      name, email, phone, role, status,
      avatar: avatarDataUrl || prev.avatar
    };
    admins[existingIdx] = next;
  } else {
    // add
    admins.push({
      id, name, email, phone, role, status,
      lastLogin: '-',
      avatar: avatarDataUrl || 'image/default-avatar.png'
    });
  }

  saveAdmins(admins);
  closeModalFn();
  render();
  showToast('Tersimpan.');
});

// ===== Helpers =====
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showToast(msg){
  toast.innerHTML = `<i class="bi bi-check-circle"></i> ${msg}`;
  toast.classList.remove('hidden');
  setTimeout(()=> toast.classList.add('hidden'), 1600);
}

function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ===== Events =====
btnAddAdmin.addEventListener('click', openAdd);
closeModal.addEventListener('click', closeModalFn);
btnCancel.addEventListener('click', closeModalFn);

searchInput.addEventListener('input', render);
roleFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);

// ===== Init =====
document.addEventListener('DOMContentLoaded', render);