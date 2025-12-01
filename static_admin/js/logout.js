// ===============================
// === logout.js GLOBAL =========
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  // tunggu DOM siap
  const logoutLink = document.querySelector(".logout");

  if (!logoutLink) {
    console.warn("Tombol logout tidak ditemukan!");
    return;
  }

  logoutLink.addEventListener("click", function (event) {
    event.preventDefault(); // cegah langsung ke link

    // 🔹 Konfirmasi logout
    Swal.fire({
      title: "Keluar dari Sistem?",
      text: "Apakah kamu yakin ingin logout sekarang?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 🔹 Notifikasi sukses
      Swal.fire({
        icon: "success",
        title: "Berhasil Keluar!",
        text: "Mengalihkan ke halaman login...",
        showConfirmButton: false,
        timer: 1200,
        didOpen: () => Swal.showLoading(),
        willClose: () => {
          // 🔹 arahkan ke route logout
          window.location.href = "/admin/logout"; // hardcode route logout
        }
      });
    });
  });
});
