document.addEventListener("DOMContentLoaded", function () {
  // === FITUR DETAIL ===
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

  // === FITUR PENCARIAN (disamakan dengan daftar_penemuan.js) ===
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }
});
