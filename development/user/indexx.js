// ==============================
// Data Barang Terbaru
// ==============================
const barangTerbaruData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", kategori: "Dompet", tanggal: "01/10/2025", gambar: "image/domkul.jpg" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", kategori: "Jam Tangan", tanggal: "02/10/2025", gambar: "image/jam hitam.webp" },
  { id: "LF-F003", nama: "Topi Biru", kategori: "Topi", tanggal: "03/10/2025", gambar: "image/topi biru.jpg" },
  { id: "LF-F004", nama: "Airpods Putih", kategori: "Airpods", tanggal: "04/10/2025", gambar: "image/airpods.png" },
];

// ==============================
// Render Barang ke Dashboard
// ==============================
const barangTerbaruContainer = document.getElementById("barangTerbaru");

if (barangTerbaruContainer) {
  barangTerbaruData.slice(0, 6).forEach(item => {
    const card = document.createElement("div");
    card.classList.add("item-card");
    card.innerHTML = `
      <img src="${item.gambar}" alt="${item.nama}">
      <div class="card-body">
        <h5>${item.nama}</h5>
        <p><strong>Kategori:</strong> ${item.kategori}</p>
        <p><small>${item.tanggal}</small></p>
        <button class="btnKlaim" onclick="window.location.href='detail_barang.html?id=${item.id}'">Klaim</button>
      </div>
    `;
    barangTerbaruContainer.appendChild(card);
  });
}

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

  // Fungsi tombol
  function goToForm() {
    window.location.href = "form_kehilangan.html";
  }

  function goToCekLaporan() {
    window.location.href = "cek_laporan.html";
  }

  function goToCariBarang() {
    window.location.href = "cari_barang.html";
  }

