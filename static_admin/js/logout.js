// ===============================
// === logout.js GLOBAL =========
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  const logoutLink = document.querySelector(".logout");

  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault(); // cegah link langsung jalan

      Swal.fire({
        title: "Keluar dari Sistem?",
        text: "Apakah kamu yakin ingin logout sekarang?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, keluar",
        cancelButtonText: "Batal",
        reverseButtons: true, // biar tombol Batal di kiri
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Keluar!",
            text: "Mengalihkan ke halaman login...",
            showConfirmButton: false,
            timer: 1300,
            willClose: () => {
              // arahkan ke route Flask logout
              window.location.href = "{{ url_for('admin_bp.logout_admin') }}";
            }
          });
        }
      });
    });
  }
});
