// === Fungsi untuk cek riwayat berdasarkan email ===
function cekRiwayat() {
  const email = document.getElementById("emailInput").value.trim().toLowerCase();

  if (email === "") {
    alert("Silakan masukkan email terlebih dahulu.");
    return;
  }

  // Ambil data klaim dari localStorage
  const dataKlaim = JSON.parse(localStorage.getItem("dataKlaim")) || [];

  // Cek apakah ada klaim dengan email ini
  const klaimUser = dataKlaim.filter(k => k.email.toLowerCase() === email);

  if (klaimUser.length > 0) {
    // Simpan email sementara agar bisa dipakai di halaman hasil
    localStorage.setItem("emailAktif", email);
    window.location.href = "hasil_riwayat_klaim.html";
  } else {
    // Jika tidak ada, tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("modalEmailTidakTerdaftar"));
    modal.show();
  }
}

// === Jalankan fungsi saat tombol diklik ===
document.getElementById("cekRiwayatBtn").addEventListener("click", cekRiwayat);

// === Jalankan juga saat pengguna menekan Enter di input email ===
document.getElementById("emailInput").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Supaya halaman tidak reload
    cekRiwayat();
  }
});
