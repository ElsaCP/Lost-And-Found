document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("grafikBulanan");
  if (!canvas) return;

  const isMobile = window.innerWidth <= 576;

  const res = await fetch("/api/statistik-bulanan");
  const data = await res.json();

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(d => d.bulan),
      datasets: [
        {
          label: "Kehilangan",
          data: data.map(d => d.kehilangan),
          backgroundColor: "#f1b5b5",
          borderRadius: 12,
          barThickness: isMobile ? 26 : 20
        },
        {
          label: "Penemuan",
          data: data.map(d => d.penemuan),
          backgroundColor: "#bfe3d0",
          borderRadius: 12,
          barThickness: isMobile ? 26 : 20
        },
        {
          label: "Klaim",
          data: data.map(d => d.klaim),
          backgroundColor: "#c7d8f5",
          borderRadius: 12,
          barThickness: isMobile ? 26 : 20
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 20
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            color: "#374151",
            font: {
              size: isMobile ? 13 : 12
            }
          }
        },

        datalabels: {
          color: "#374151",
          anchor: "center",
          align: "center",
          font: {
            weight: "600",
            size: isMobile ? 13 : 11
          },
          formatter: value => value > 0 ? value : ""
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#6b7280",
            font: { size: isMobile ? 12 : 11 }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: "#6b7280",
            font: { size: isMobile ? 12 : 11 }
          },
          grid: {
            color: "#e5e7eb"
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
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
