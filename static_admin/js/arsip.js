document.addEventListener("DOMContentLoaded", () => {


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
