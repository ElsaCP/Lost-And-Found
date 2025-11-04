// ==========================================
// Ambil data barang dari localStorage jika ada (update dari klaim)
// ==========================================
const defaultBarangData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", kategori: "Dompet", tanggal: "01/10/2025", gambar: "image/domkul.jpg" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", kategori: "Jam Tangan", tanggal: "02/10/2025", gambar: "image/jam hitam.webp" },
  { id: "LF-F003", nama: "Topi Biru", kategori: "Topi", tanggal: "03/10/2025", gambar: "image/topi biru.jpg" },
  { id: "LF-F004", nama: "Airpods Putih", kategori: "Airpods", tanggal: "04/10/2025", gambar: "image/airpods.png" },
  { id: "LF-F005", nama: "Ikat Pinggang Kulit", kategori: "Ikat Pinggang", tanggal: "05/10/2025", gambar: "image/ikatpinggang.png" },
  { id: "LF-F006", nama: "Pouch Merah", kategori: "Pouch", tanggal: "06/10/2025", gambar: "image/pouch merah.webp" },
  { id: "LF-F007", nama: "Jam Tangan Putih", kategori: "Jam Tangan", tanggal: "07/10/2025", gambar: "image/jam putih.jpg" },
  { id: "LF-F008", nama: "Dompet Wanita Hitam", kategori: "Dompet", tanggal: "08/10/2025", gambar: "image/dompet wanita.webp" },
  { id: "LF-F009", nama: "Topi Eiger Hitam", kategori: "Topi", tanggal: "09/10/2025", gambar: "image/topi eiger.webp" },
  { id: "LF-F010", nama: "Airpods Pro", kategori: "Airpods", tanggal: "10/10/2025", gambar: "image/airpods pro.webp" },
  { id: "LF-F011", nama: "Dompet Kulit Buaya", kategori: "Dompet", tanggal: "11/10/2025", gambar: "image/dompet.png" },
  { id: "LF-F012", nama: "Pouch Hitam", kategori: "Pouch", tanggal: "12/10/2025", gambar: "image/pouch.png" },
  { id: "LF-F013", nama: "Topi Hitam Nike", kategori: "Topi", tanggal: "13/10/2025", gambar: "image/topi nike.webp" },
  { id: "LF-F014", nama: "Jam Analog Silver", kategori: "Jam Tangan", tanggal: "14/10/2025", gambar: "image/jam analog.webp" },
];

// Gunakan data dari localStorage jika sudah ada klaim
let barangData = JSON.parse(localStorage.getItem("barangData")) || defaultBarangData;

// Simpan ulang agar sinkron
localStorage.setItem("barangData", JSON.stringify(barangData));


// ==========================================a
// Elemen DOM
// ==========================================
const container = document.getElementById("barangContainer");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchBtnHero");
const filterKategori = document.getElementById("filterKategori");
const filterDari = document.getElementById("filterDari");
const filterHingga = document.getElementById("filterHingga");
const btnCari = document.getElementById("btnCari");
const btnReset = document.getElementById("btnReset");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInput = document.getElementById("pageInput");
const pageTotal = document.getElementById("pageTotal");

let filteredData = [...barangData];
let currentPage = 1;
const itemsPerPage = 12;

// ==========================================
// Konversi tanggal "dd/mm/yyyy" ke Date
// ==========================================
function parseTanggal(tglStr) {
  const [d, m, y] = tglStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// ==========================================
// Render Barang
// ==========================================
function renderBarang() {
  container.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const currentItems = filteredData.slice(start, end);

  if (currentItems.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-5">Tidak ada barang ditemukan.</div>`;
  } else {
    currentItems.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <img src="${item.gambar}" alt="${item.nama}">
        <div class="card-body">
          <h5>${item.nama}</h5>
          <p class="text-muted">Kategori: ${item.kategori}</p>
          <p class="text-muted">Tanggal: ${item.tanggal}</p>
          <button class="btnKlaim" data-id="${item.id}">Klaim Barang</button>
        </div>`;
      container.appendChild(card);
    });
  }

  // Update navigasi halaman
  pageInput.value = currentPage;
  const totalHalaman = Math.ceil(filteredData.length / itemsPerPage) || 1;
  pageTotal.textContent = `/ ${totalHalaman}`;
  pageInput.max = totalHalaman;
  prevPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === totalHalaman;
}

// ==========================================
// Pencarian dan Filter
// ==========================================
function applyFilter() {
  const keyword = searchInput.value.trim().toLowerCase();
  const kategori = filterKategori.value;
  const dari = filterDari.value ? new Date(filterDari.value) : null;
  const hingga = filterHingga.value ? new Date(filterHingga.value) : null;

  filteredData = barangData.filter(item => {
    const namaMatch = item.nama.toLowerCase().includes(keyword);
    const kategoriMatch = !kategori || item.kategori === kategori;
    const tanggal = parseTanggal(item.tanggal);
    const dariMatch = !dari || tanggal >= dari;
    const hinggaMatch = !hingga || tanggal <= hingga;
    return namaMatch && kategoriMatch && dariMatch && hinggaMatch;
  });

  currentPage = 1;
  renderBarang();
}

// ==========================================
// Event Listener
// ==========================================
btnCari.addEventListener("click", applyFilter);
btnReset.addEventListener("click", () => {
  searchInput.value = "";
  filterKategori.value = "";
  filterDari.value = "";
  filterHingga.value = "";
  filteredData = [...barangData];
  currentPage = 1;
  renderBarang();
});
searchInput.addEventListener("keyup", e => {
  if (e.key === "Enter") applyFilter();
});
if (searchButton) searchButton.addEventListener("click", applyFilter);

prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderBarang();
  }
});
nextPage.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderBarang();
  }
});

pageInput.addEventListener("change", () => {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  let val = parseInt(pageInput.value);
  if (!isNaN(val) && val >= 1 && val <= totalPages) {
    currentPage = val;
    renderBarang();
  } else {
    pageInput.value = currentPage;
  }
});

// ==========================================
// Arahkan ke halaman detail barang
// ==========================================
container.addEventListener("click", e => {
  if (e.target.classList.contains("btnKlaim")) {
    const id = e.target.dataset.id;
    window.location.href = `detail_barang.html?id=${id}`;
  }
});

// ==========================================
// Render Awal
// ==========================================
renderBarang();
