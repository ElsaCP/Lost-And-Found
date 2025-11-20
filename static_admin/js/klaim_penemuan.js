document.addEventListener("DOMContentLoaded", function () {

  // tombol detail
  const detailButtons = document.querySelectorAll(".btn-detail");

  detailButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.getAttribute("data-klaim");
      window.location.href = `/admin/penemuan/klaim/detail/${kode}`;
    });
  });

  // search
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#klaimTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const keyword = searchInput.value.toLowerCase();
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(keyword)
          ? ""
          : "none";
      });
    });
  }
});
