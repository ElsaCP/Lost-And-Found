// ===== Helper DOM =====
const $ = (sel) => document.querySelector(sel);

const modal      = $('#modalEdit');
const closeModal = $('#closeModal');
const btnEdit    = $('#btnEditProfile');
const btnCancel  = $('#btnCancel');
const toast      = $('#toast');

// === Buka Modal Edit ===
btnEdit?.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

// === Tutup Modal Edit ===
closeModal?.addEventListener('click', () => modal.classList.add('hidden'));
btnCancel?.addEventListener('click', () => modal.classList.add('hidden'));

// === Notifikasi (toast) jika update profil sukses ===
if (window.location.search.includes("updated=1")) {
  toast.classList.remove("hidden");
  toast.innerHTML = `<i class="bi bi-check-circle"></i> Profil berhasil diperbarui.`;
  setTimeout(() => toast.classList.add("hidden"), 1600);
}

// =====================================================
//  GANTI FOTO – KLIK FOTO MEMBUKA INPUT FILE
// =====================================================
const avatarWrapper = document.querySelector('.avatar-wrapper');
const avatarFile = document.getElementById("avatarFile");
const pvAvatar = document.getElementById("pvAvatar");

avatarWrapper?.addEventListener('click', () => avatarFile.click());

// =====================================================
//  PREVIEW FOTO DAN AUTO-KIRIM KE BACKEND
// =====================================================
avatarFile?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    // preview langsung
    pvAvatar.src = reader.result;

    // Upload ke backend
    const formData = new FormData();
    formData.append("photo", file);

    fetch("/admin/pengaturan/upload-photo", {
      method: "POST",
      body: formData,
    })
    .then(res => {
      // tampilkan notif
      toast.classList.remove("hidden");
      toast.innerHTML = `<i class="bi bi-check-circle"></i> Foto profil diperbarui.`;
      setTimeout(() => toast.classList.add("hidden"), 1600);
    })
    .catch(err => console.error(err));
  };

  reader.readAsDataURL(file);
});
