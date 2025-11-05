document.addEventListener("DOMContentLoaded", function () {
  // Tangkap semua tombol detail
  const detailButtons = document.querySelectorAll(".btn-detail");

  detailButtons.forEach(button => {
    button.addEventListener("click", () => {
      const kode = button.getAttribute("data-kode");

      // Kalau data-kode nggak ada, jangan lanjut
      if (!kode) {
        console.error("data-kode tidak ditemukan!");
        return;
      }

      // Arahkan ke halaman detail sesuai kode
      window.location.href = `detail_klaim_penemuan.html?kode=${kode}`;
    });
  });
});
