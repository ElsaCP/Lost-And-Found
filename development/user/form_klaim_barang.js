// === Ambil kode barang otomatis dari URL ===
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const kode = params.get("id");
  if (kode) {
    document.getElementById("kodeBarang").value = kode;
  }
});

// === Fungsi generate kode laporan berurutan (LF-C001, LF-C002, dst.) ===
function generateKodeLaporan() {
  // Ambil nomor terakhir dari localStorage (jika belum ada, mulai dari 0)
  let lastNumber = parseInt(localStorage.getItem("lastKodeNumber")) || 0;

  // Tambah 1 untuk klaim berikutnya
  lastNumber++;

  // Simpan kembali nomor terakhir
  localStorage.setItem("lastKodeNumber", lastNumber);

  // Format jadi 3 digit, misal 1 → 001, 10 → 010
  const formattedNumber = lastNumber.toString().padStart(5, "0");

  return `LF-C${formattedNumber}`;
}

// === Tombol "Kirim Klaim" ditekan ===
document.getElementById("kirimBtn").addEventListener("click", () => {
  const form = document.getElementById("klaimForm");

  const nama = document.getElementById("nama").value.trim();
  const telp = document.getElementById("telp").value.trim();
  const email = document.getElementById("email").value.trim();
  const deskripsi = document.getElementById("deskripsiKhusus").value.trim();
  const kodeBarang = document.getElementById("kodeBarang").value.trim();
  const konfirmasi = document.getElementById("konfirmasi").checked;

  const fileIdentitas = form.querySelector('input[type="file"]:nth-of-type(1)').files.length;
  const fileFotoBarang = form.querySelector('input[type="file"]:nth-of-type(3)').files.length;

  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove();

  if (!nama || !telp || !email || !deskripsi || !kodeBarang || !fileIdentitas || !fileFotoBarang || !konfirmasi) {
    const alert = document.createElement("div");
    alert.className = "alert alert-danger mt-3";
    alert.innerHTML = "<strong>Harap isi semua data wajib!</strong> Pastikan semua kolom dan file telah diisi.";
    form.prepend(alert);
    form.scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Tampilkan modal konfirmasi
  const modal = new bootstrap.Modal(document.getElementById("konfirmasiModal"));
  modal.show();
});

// === Saat klik tombol "Kirim Klaim" di dalam modal ===
document.getElementById("confirmKirim").addEventListener("click", () => {
  const modal = bootstrap.Modal.getInstance(document.getElementById("konfirmasiModal"));
  modal.hide();

  const nama = document.getElementById("nama").value.trim();
  const telp = document.getElementById("telp").value.trim();
  const email = document.getElementById("email").value.trim();
  const deskripsi = document.getElementById("deskripsiKhusus").value.trim();
  const kodeBarang = document.getElementById("kodeBarang").value.trim();
  const kodeLaporan = generateKodeLaporan();

  // Pisahkan tanggal dan waktu (format Indonesia)
  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID"); // dd/mm/yyyy
  const waktu = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit"});

  const status = "Pending";
  const catatan = "Menunggu verifikasi oleh admin.";

  const klaimBaru = {
    kodeLaporan,
    kodeBarang,
    nama,
    telp,
    email,
    deskripsi,
    tanggal,
    waktu,
    status,
    catatan
  };

  // Simpan ke localStorage
  let dataKlaim = JSON.parse(localStorage.getItem("dataKlaim")) || [];
  dataKlaim.push(klaimBaru);
  localStorage.setItem("dataKlaim", JSON.stringify(dataKlaim));

  // === Notifikasi sukses seperti versi awal ===
  setTimeout(() => {
    const alertSuccess = document.createElement("div");
    alertSuccess.className =
      "alert alert-success text-center position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
    alertSuccess.style.zIndex = "2000";
    alertSuccess.innerHTML = `✅ Klaim barang berhasil dikirim!<br>Kode Laporan Anda: <strong>${kodeLaporan}</strong>`;
    document.body.appendChild(alertSuccess);

    // Hilangkan notifikasi dan redirect ke halaman list
    setTimeout(() => {
      alertSuccess.remove();
      window.location.href = "cari_barang.html";
    }, 2500);
  }, 700);
});
