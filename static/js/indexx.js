// ==============================
// Data Barang Terbaru
// ==============================
const barangTerbaruData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", kategori: "Dompet", tanggal: "01/10/2025", gambar: "/static/image/domkul.jpg" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", kategori: "Jam Tangan", tanggal: "02/10/2025", gambar: "/static/image/jam hitam.webp" },
  { id: "LF-F003", nama: "Topi Biru", kategori: "Topi", tanggal: "03/10/2025", gambar: "/static/image/topi biru.jpg" },
  { id: "LF-F004", nama: "Airpods Putih", kategori: "Airpods", tanggal: "04/10/2025", gambar: "/static/image/airpods.png" },
];

// ==============================
// Render Barang ke Dashboard
// ==============================
const barangTerbaruContainer = document.getElementById("barangTerbaru");

if (barangTerbaruContainer) {
  barangTerbaruData.slice(0, 6).forEach(item => {
    const col = document.createElement("div");
    col.classList.add("col-md-3", "mb-4");

    const card = document.createElement("div");
    card.classList.add("card", "shadow-sm", "h-100");
    card.innerHTML = `
      <img src="${item.gambar}" class="card-img-top" alt="${item.nama}">
      <div class="card-body">
        <h5 class="card-title">${item.nama}</h5>
        <p class="card-text"><strong>Kategori:</strong> ${item.kategori}</p>
        <p class="text-muted"><small>${item.tanggal}</small></p>
        <button class="btn btn-primary w-100" onclick="goToDetail('${item.id}')">Klaim</button>
      </div>
    `;

    col.appendChild(card);
    barangTerbaruContainer.appendChild(col);
  });
}

// ==============================
// Navigasi antar tab Hero Section
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".hero-nav-link");
  const infoSections = document.querySelectorAll(".info-section");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      // Hapus kelas 'active' dari semua link & section
      navLinks.forEach(nav => nav.classList.remove("active"));
      infoSections.forEach(section => section.classList.remove("active"));

      // Tambahkan 'active' ke link & section yang dipilih
      link.classList.add("active");
      const tab = link.getAttribute("data-tab");
      const targetSection = document.getElementById(`info-${tab}`);
      if (targetSection) targetSection.classList.add("active");
    });
  });
});

// ==============================
// Fungsi Tombol (versi Flask)
// ==============================
function goToForm() {
  window.location.href = "/form-kehilangan";
}

function goToCekLaporan() {
  window.location.href = "/cek-laporan";
}

function goToCariBarang() {
  window.location.href = "/cari-Barang";
}

function goToDetail(id) {
  window.location.href = `/detail-barang/${id}`;
}
