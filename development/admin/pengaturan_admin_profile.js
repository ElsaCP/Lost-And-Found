// ===== Konstanta & Default =====
const STORAGE_KEY = 'adminProfile';
const DEFAULT_PROFILE = {
  name: 'Nama Admin',
  email: 'admin@example.com',
  phone: '',
  role: 'Admin',
  avatar: 'image/default-avatar.png'
};

// ===== Helper DOM =====
const $ = (sel) => document.querySelector(sel);

const pvName  = $('#pvName');
const pvEmail = $('#pvEmail');
const pvPhone = $('#pvPhone');
const pvRole  = $('#pvRole');
const pvAvatar= $('#pvAvatar');

const avatarFile = $('#avatarFile');

const modal      = $('#modalEdit');
const closeModal = $('#closeModal');
const btnEdit    = $('#btnEditProfile');
const btnCancel  = $('#btnCancel');
const editForm   = $('#editForm');

const fName  = $('#fName');
const fEmail = $('#fEmail');
const fPhone = $('#fPhone');
const fRole  = $('#fRole');

const toast = $('#toast');

// ===== Data Load/Save =====
function loadProfile(){
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : DEFAULT_PROFILE;

  pvName.textContent  = data.name  || '—';
  pvEmail.textContent = data.email || '—';
  pvPhone.textContent = data.phone || '—';
  pvRole.textContent  = data.role  || '—';
  pvAvatar.src        = data.avatar || 'image/default-avatar.png';

  // badge warna berdasarkan role
  if ((data.role || '').toLowerCase().includes('pusat')) {
    pvRole.style.background   = '#fff3e8';
    pvRole.style.color        = '#d26a00';
    pvRole.style.borderColor  = '#ffd7b0';
  } else {
    pvRole.style.background   = '#f5f9ff';
    pvRole.style.color        = '#1e90ff';
    pvRole.style.borderColor  = '#dbe8ff';
  }

  return data;
}

function saveProfile(partial){
  const prev = loadProfile();
  const next = { ...prev, ...partial, role: prev.role };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  loadProfile();
}

// ===== Modal Open/Close =====
function openEdit(){
  const data = loadProfile();
  fName.value  = data.name  || '';
  fEmail.value = data.email || '';
  fPhone.value = data.phone || '';
  fRole.value  = data.role  || '';
  modal.classList.remove('hidden');
}
function closeEdit(){ modal.classList.add('hidden'); }

// ===== Events =====
document.addEventListener('DOMContentLoaded', loadProfile);

btnEdit?.addEventListener('click', openEdit);
closeModal?.addEventListener('click', closeEdit);
btnCancel?.addEventListener('click', closeEdit);

editForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name  = fName.value.trim();
  const email = fEmail.value.trim();
  const phone = fPhone.value.trim();

  if (!name || !email){
    alert('Nama dan Email wajib diisi.');
    return;
  }

  saveProfile({ name, email, phone });
  closeEdit();

  // toast
  toast.classList.remove('hidden');
  setTimeout(()=> toast.classList.add('hidden'), 1600);
});

// ===== Ganti Foto (dengan konfirmasi) =====
const avatarWrapper = document.querySelector('.avatar-wrapper');
avatarWrapper?.addEventListener('click', () => avatarFile.click());

avatarFile?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const previewSrc = reader.result;

    // buat modal konfirmasi sementara
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.innerHTML = `
      <div class="modal-content" style="text-align:center; max-width:420px;">
        <h3 style="margin-bottom:12px;">Konfirmasi Ganti Foto</h3>
        <img src="${previewSrc}" alt="Preview Foto Baru" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:2px solid #1e90ff; margin-bottom:15px;">
        <div style="display:flex; justify-content:center; gap:10px;">
          <button id="btnCancelPhoto" class="btn ghost">Batal</button>
          <button id="btnSavePhoto" class="btn primary"><i class="bi bi-check-circle"></i> Simpan Foto</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModal);

    // event untuk batal dan simpan
    const btnCancelPhoto = document.getElementById('btnCancelPhoto');
    const btnSavePhoto   = document.getElementById('btnSavePhoto');

    btnCancelPhoto.addEventListener('click', () => confirmModal.remove());
    btnSavePhoto.addEventListener('click', () => {
      pvAvatar.src = previewSrc;     // tampilkan foto baru
      saveProfile({ avatar: previewSrc }); // simpan
      confirmModal.remove();

      toast.classList.remove('hidden');
      toast.innerHTML = '<i class="bi bi-check-circle"></i> Foto profil diperbarui.';
      setTimeout(()=> toast.classList.add('hidden'), 1600);
    });
  };
  reader.readAsDataURL(file);
});
