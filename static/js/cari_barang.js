// ===============================
// Variabel DOM
// ===============================
const container = document.getElementById("barangContainer");
const searchInput = document.getElementById("searchInput");
const btnCari = document.getElementById("btnCari");
const btnReset = document.getElementById("btnReset");
const filterKategori = document.getElementById("filterKategori");
const filterDari = document.getElementById("filterDari");
const filterHingga = document.getElementById("filterHingga");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInput = document.getElementById("pageInput");
const pageTotal = document.getElementById("pageTotal");

let currentPage = 1;
const perPage = 12;

// ===============================
// Fetch data dari API Flask
// ===============================
async function fetchBarang() {
  const q = searchInput.value.trim();
  const kategori = filterKategori.value;
  const dari = filterDari.value;
  const hingga = filterHingga.value;

  const url = new URL("/api/penemuan", window.location.origin);
  url.searchParams.set("page", currentPage);
  url.searchParams.set("per_page", perPage);
  if (q) url.searchParams.set("q", q);
  if (kategori) url.searchParams.set("kategori", kategori);
  if (dari) url.searchParams.set("dari", dari);
  if (hingga) url.searchParams.set("hingga", hingga);

  const res = await fetch(url);
  const data = await res.json();

  renderBarang(data.items);
  updatePagination(data.total);
}

// ===============================
// Render barang ke halaman
// ===============================
function renderBarang(items) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-5">Tidak ada barang ditemukan.</div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <img src="/static/uploads/${item.gambar_barang}" alt="${item.nama_barang}">
      <div class="card-body">
        <h5>${item.nama_barang}</h5>
        <p class="text-muted">Kategori: ${item.kategori}</p>
        <p class="text-muted">Tanggal: ${item.tanggal_lapor}</p>
        <button class="btnKlaim" data-id="${item.kode_barang}">Lihat Detail</button>
      </div>`;
    container.appendChild(card);
  });
}

// ===============================
// Pagination
// ===============================
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / perPage);
  pageInput.value = currentPage;
  pageTotal.textContent = `/ ${totalPages}`;
  prevPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= totalPages;
}

// ===============================
// Event Listener
// ===============================
btnCari.addEventListener("click", () => {
  currentPage = 1;
  fetchBarang();
});
btnReset.addEventListener("click", () => {
  searchInput.value = "";
  filterKategori.value = "";
  filterDari.value = "";
  filterHingga.value = "";
  currentPage = 1;
  fetchBarang();
});
prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchBarang();
  }
});
nextPage.addEventListener("click", () => {
  currentPage++;
  fetchBarang();
});

container.addEventListener("click", e => {
  if (e.target.classList.contains("btnKlaim")) {
    const kode = e.target.dataset.id;
    window.location.href = `/detail-barang/${kode}`;
  }
});

// Tombol kaca pembesar di hero section
const searchBtnHero = document.getElementById("searchBtnHero");

// Ketika klik tombol kaca pembesar
if (searchBtnHero) {
  searchBtnHero.addEventListener("click", () => {
    currentPage = 1;
    fetchBarang();
  });
}

// Ketika tekan Enter di input pencarian
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    currentPage = 1;
    fetchBarang();
  }
});

// ===============================
// Load awal
// ===============================
fetchBarang();
