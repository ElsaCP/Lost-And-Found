document.addEventListener("DOMContentLoaded", () => {

  // ======================================
  //  FITUR: TOMBOL LIHAT DETAIL
  //  (sekarang tabel sudah dipenerate Flask)
  // ======================================
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.dataset.kode;
      if (kode) {
        window.location.href = `/admin/arsip/detail?kode=${encodeURIComponent(kode)}`;
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "Kode laporan tidak ditemukan.",
          confirmButtonColor: "#d33"
        });
      }
    });
  });


  // ======================
  //  FITUR PENCARIAN
  // ======================
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      document.querySelectorAll(".arsip-table tbody tr").forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }

});
