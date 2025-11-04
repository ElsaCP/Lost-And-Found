function cekLaporan() {
  const email = document.getElementById("emailInput").value.trim();

  // Validasi format email
  if (email === "" || !email.includes("@") || !email.includes(".")) {
    alert("Masukkan email yang valid!");
    return;
  }

  // Simulasi data email yang sudah memiliki laporan
  const emailTerdaftar = ["user@contoh.com", "aulia@gmail.com", "angelina@gmail.com"];

  // Jika email ditemukan, arahkan ke halaman hasil
  if (emailTerdaftar.includes(email.toLowerCase())) {
    window.location.href = "hasil_cek.html";
  } else {
    // Jika tidak ditemukan, tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("modalEmailTidakTerdaftar"));
    modal.show();
  }
}

// Pastikan tombol klik dan tombol Enter berfungsi
document.addEventListener("DOMContentLoaded", function () {
  const cekBtn = document.getElementById("cekLaporanBtn");
  const emailInput = document.getElementById("emailInput");

  // Klik tombol
  if (cekBtn) cekBtn.addEventListener("click", cekLaporan);

  // Tekan Enter di input email
  if (emailInput) {
    emailInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault(); // mencegah reload form
        cekLaporan();
      }
    });
  }
});
