// === File: tambah_klaim.js ===

// Tombol kembali
document.addEventListener("DOMContentLoaded", function () {
  const kembaliBtn = document.querySelector(".kembali");
  if (kembaliBtn) {
    kembaliBtn.addEventListener("click", function () {
      // Ganti dengan halaman tujuan kamu
      window.location.href = "daftar_penemuan.html";
    });
  }
});

// Pesan konfirmasi sebelum submit
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", function (e) {
    const konfirmasi = confirm("Apakah data sudah benar dan ingin disimpan?");
    if (!konfirmasi) {
      e.preventDefault(); // batal submit kalau user klik 'Cancel'
    }
  });
}
