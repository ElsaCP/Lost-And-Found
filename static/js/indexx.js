document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("barangTerbaru");
  if (!container) return;

  try {
    const res = await fetch("/api/barang-terbaru"); // API kamu yang ambil 4 data publik terbaru
    const data = await res.json();

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = `<p class="text-muted text-center">Belum ada barang publik terbaru.</p>`;
      return;
    }

    data.forEach(item => {
      const card = `
        <div class="item-card">
          <img src="${item.gambar_barang}" alt="${item.nama_barang}">
          <div class="item-info">
            <h5>${item.nama_barang}</h5>
            <p><strong>Kategori:</strong> ${item.kategori}</p>
            <p><small>${item.tanggal_lapor}</small></p>
            <a href="/detail-barang/${item.kode_barang}" class="btn-detail">Lihat Detail</a>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", card);
    });
  } catch (error) {
    console.error("Gagal memuat data barang:", error);
    container.innerHTML = `<p class="text-danger text-center">Gagal memuat data barang.</p>`;
  }
});

  // ==============================
  // Fungsi Navigasi Tab Hero
  // ==============================
  const navLinks = document.querySelectorAll(".hero-nav-link");
  const infoSections = document.querySelectorAll(".info-section");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(nav => nav.classList.remove("active"));
      infoSections.forEach(section => section.classList.remove("active"));

      link.classList.add("active");
      const tab = link.getAttribute("data-tab");
      const targetSection = document.getElementById(`info-${tab}`);
      if (targetSection) targetSection.classList.add("active");
    });
  });

// ==============================
// Fungsi Tombol
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
