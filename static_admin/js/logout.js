// ===============================
// === logout.js ================
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  const logoutLink = document.querySelector(".logout");

  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault(); // cegah langsung pindah halaman

      Swal.fire({
        title: "Keluar dari Sistem?",
        text: "Apakah kamu yakin ingin logout sekarang?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, keluar",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          // Tambahkan efek animasi ringan sebelum logout
          document.body.style.transition = "opacity 0.5s";
          document.body.style.opacity = "0";

          setTimeout(() => {
            Swal.fire({
              icon: "success",
              title: "Berhasil Keluar!",
              text: "Mengalihkan ke halaman login...",
              timer: 1200,
              showConfirmButton: false,
            });

            setTimeout(() => {
              window.location.href = "login.html";
            }, 1200);
          }, 300);
        }
      });
    });
  }
});
