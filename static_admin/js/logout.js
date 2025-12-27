document.addEventListener("DOMContentLoaded", function () {
  const logoutLink = document.querySelector(".logout");

  if (!logoutLink) {
    console.warn("Tombol logout tidak ditemukan!");
    return;
  }

  logoutLink.addEventListener("click", function (event) {
    event.preventDefault(); 
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

      Swal.fire({
        icon: "success",
        title: "Berhasil Keluar!",
        text: "Mengalihkan ke halaman login...",
        showConfirmButton: false,
        timer: 1200,
        didOpen: () => Swal.showLoading(),
        willClose: () => {
          window.location.href = "/admin/logout"; 
        }
      });
    });
  });
});
