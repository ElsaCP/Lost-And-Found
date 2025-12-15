document.addEventListener("DOMContentLoaded", () => {

  const filterBulan = document.getElementById("filterBulan");
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll(".arsip-table tbody tr");

  if (!filterBulan || !searchInput || !rows.length) return;

  const bulanNama = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  // ===============================
  // AMBIL BULAN + TAHUN VALID SAJA
  // ===============================
  const bulanMap = new Map();

  rows.forEach(row => {
    const tanggalStr = row.dataset.tanggal;

    // 🔴 SKIP ROW TANPA TANGGAL
    if (!tanggalStr || tanggalStr === "None") return;

    const clean = tanggalStr.split(" ")[0]; // YYYY-MM-DD
    const parts = clean.split("-");

    // 🔴 VALIDASI FORMAT
    if (parts.length !== 3) return;

    const year = parts[0];
    const month = parts[1];

    if (!year || !month) return;

    const key = `${year}-${month}`;
    if (!bulanMap.has(key)) {
      bulanMap.set(key, {
        key,
        label: `${bulanNama[parseInt(month, 10) - 1]} ${year}`
      });
    }
  });

  // ===============================
  // SORT TERBARU → TERLAMA
  // ===============================
  const bulanList = Array.from(bulanMap.values()).sort((a, b) =>
    b.key.localeCompare(a.key)
  );

  // ===============================
  // ISI DROPDOWN
  // ===============================
  filterBulan.innerHTML = `<option value="all">Semua Arsip</option>`;

  bulanList.forEach(b => {
    if (!b.label.includes("undefined")) {
      filterBulan.insertAdjacentHTML(
        "beforeend",
        `<option value="${b.key}">${b.label}</option>`
      );
    }
  });

  // ===============================
  // FILTER + SEARCH
  // ===============================
  function applyFilter() {
    const keyword = searchInput.value.toLowerCase();
    const selectedMonth = filterBulan.value;

    rows.forEach(row => {
      const tanggalStr = row.dataset.tanggal || "";

      // ROW TANPA TANGGAL → TETAP MUNCUL JIKA SEARCH KOSONG
      if (!tanggalStr || tanggalStr === "None") {
        row.style.display =
          keyword ? row.textContent.toLowerCase().includes(keyword) ? "" : "none" : "";
        return;
      }

      const clean = tanggalStr.split(" ")[0];
      const [year, month] = clean.split("-");
      const key = `${year}-${month}`;

      const cocokBulan =
        selectedMonth === "all" || key === selectedMonth;

      const cocokSearch =
        row.textContent.toLowerCase().includes(keyword);

      row.style.display =
        cocokBulan && cocokSearch ? "" : "none";
    });
  }

  searchInput.addEventListener("keyup", applyFilter);
  filterBulan.addEventListener("change", applyFilter);

  applyFilter();
});
