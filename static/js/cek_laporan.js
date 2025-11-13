document.addEventListener("DOMContentLoaded", () => {
  const cekBtn = document.getElementById("cekLaporanBtn");
  const emailInput = document.getElementById("emailInput");

  async function cekLaporan() {
    const email = emailInput.value.trim();

    if (!email) {
      // Jika kosong → tampilkan modal
      const modal = new bootstrap.Modal(document.getElementById("modalEmailTidakTerdaftar"));
      modal.show();
      return;
    }

    try {
      const response = await fetch("/proses-cek-laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = `/hasil-cek?email=${encodeURIComponent(email)}`;
      } else {
        const modal = new bootstrap.Modal(document.getElementById("modalEmailTidakTerdaftar"));
        modal.show();
      }
    } catch (error) {
      console.error("Error:", error);
      const modal = new bootstrap.Modal(document.getElementById("modalEmailTidakTerdaftar"));
      modal.show();
    }
  }

  cekBtn.addEventListener("click", cekLaporan);

  // Tekan Enter untuk submit
  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      cekLaporan();
    }
  });
});
