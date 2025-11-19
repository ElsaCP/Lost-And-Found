document.addEventListener("DOMContentLoaded", function () {
  const detailButtons = document.querySelectorAll(".btn-detail");

  detailButtons.forEach(button => {
    button.addEventListener("click", () => {
      const kode = button.getAttribute("data-kode");
      if (!kode) return;

      // FIX ROUTE DI SINI
      window.location.href = `/admin/penemuan/klaim/${kode}`;
    });
  });

  // search
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
