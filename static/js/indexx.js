document.addEventListener("DOMContentLoaded", async function () {
  const canvas = document.getElementById("grafikBulanan");
  if (!canvas) return;

  try {
    const res = await fetch("/api/statistik-bulanan");
    const data = await res.json();

    const labels = data.map(d => d.bulan);
    const kehilangan = data.map(d => d.kehilangan);
    const penemuan = data.map(d => d.penemuan);
    const klaim = data.map(d => d.klaim);

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Kehilangan",
            data: kehilangan
          },
          {
            label: "Penemuan",
            data: penemuan
          },
          {
            label: "Klaim",
            data: klaim
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });

  } catch (err) {
    console.error("Gagal memuat grafik:", err);
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

function goToCekRiwayat() {
  window.location.href = "/riwayat-klaim";
}
