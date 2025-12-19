document.addEventListener("DOMContentLoaded", () => {
  const cekBtn = document.getElementById("cekLaporanBtn");
  const emailInput = document.getElementById("emailInput");
  const kodeInput = document.getElementById("kodeInput");

  // ==========================
  // 🔄 RESET INPUT SAAT HALAMAN DIMUAT
  // ==========================
  emailInput.value = "";
  kodeInput.value = "";

  async function cekLaporan() {
    const email = emailInput.value.trim();
    const kode = kodeInput.value.trim();

    // 🔴 WAJIB ISI EMAIL & KODE
    if (!email || !kode) {
      const modal = new bootstrap.Modal(
        document.getElementById("modalEmailTidakTerdaftar")
      );
      modal.show();
      return;
    }

    try {
      const response = await fetch("/proses-cek-laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          kode_kehilangan: kode
        }),
      });

      const result = await response.json();

      if (result.success) {
        // ✅ Redirect pakai KODE (lebih aman)
        window.location.href =
          `/hasil-cek?kode=${encodeURIComponent(kode)}`;
      } else {
        const modal = new bootstrap.Modal(
          document.getElementById("modalEmailTidakTerdaftar")
        );
        modal.show();
      }
    } catch (error) {
      console.error("Error:", error);
      const modal = new bootstrap.Modal(
        document.getElementById("modalEmailTidakTerdaftar")
      );
      modal.show();
    }
  }

  // Klik tombol
  cekBtn.addEventListener("click", cekLaporan);

  // Enter dari input email / kode
  [emailInput, kodeInput].forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        cekLaporan();
      }
    });
  });
});

// ==========================
// 🔁 HANDLE BACK BUTTON (bfcache)
// ==========================
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    document.querySelectorAll("input").forEach(input => {
      input.value = "";
    });
  }
});
