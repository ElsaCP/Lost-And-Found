document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const kodeBarang = params.get("id");     // dari detail barang
  const kodeLost   = params.get("lost");   // dari laporan kehilangan

  if (kodeBarang) {
    document.getElementById("kodeBarang").value = kodeBarang;
  }

  if (kodeLost) {
    const inputLost = document.getElementById("kodeKehilangan");
    inputLost.value = kodeLost;
    inputLost.readOnly = true;
    inputLost.classList.add("bg-light");
  }
});

document.getElementById("kirimBtn").addEventListener("click", () => {
  const form = document.getElementById("klaimForm");
  const nama = document.getElementById("nama").value.trim();
  const telp = document.getElementById("telp").value.trim();
  const email = document.getElementById("email").value.trim();
  const deskripsi = document.getElementById("deskripsiKhusus").value.trim();
  const kodeBarang = document.getElementById("kodeBarang").value.trim();
  const konfirmasi = document.getElementById("konfirmasi").checked;

  const fileIdentitas = form.querySelectorAll('input[type="file"]')[0].files.length;
  const fotoBarang = form.querySelectorAll('input[type="file"]')[2].files.length;

  if (!nama || !telp || !email || !deskripsi || !kodeBarang || !fileIdentitas || !fotoBarang || !konfirmasi) {
    alert("⚠️ Harap isi semua data wajib dan centang konfirmasi.");
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("konfirmasiModal"));
  modal.show();
});

document.getElementById("confirmKirim").addEventListener("click", async () => {
  const modal = bootstrap.Modal.getInstance(document.getElementById("konfirmasiModal"));
  modal.hide();

  // === TAMPILKAN LOADING ===
  const loading = document.getElementById("loadingOverlay");
  loading.style.display = "flex";

  // disable tombol supaya tidak double submit
  document.getElementById("kirimBtn").disabled = true;

  const formData = new FormData();
  formData.append("nama", document.getElementById("nama").value);
  formData.append("telp", document.getElementById("telp").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("deskripsiKhusus", document.getElementById("deskripsiKhusus").value);
  formData.append("kodeBarang", document.getElementById("kodeBarang").value);
  formData.append("kodeKehilangan", document.getElementById("kodeKehilangan").value);

  const fileInputs = document.querySelectorAll('input[type="file"]');
  formData.append("fileIdentitas", fileInputs[0].files[0]);
  formData.append("fileLaporan", fileInputs[1].files[0]);
  formData.append("fotoBarang", fileInputs[2].files[0]);

  try {
    const res = await fetch("/submit-klaim", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // === SEMBUNYIKAN LOADING ===
    loading.style.display = "none";

    if (data.success) {
      document.getElementById("kodeLaporanText").innerText = data.kode_laporan;
      document.getElementById("popupSukses").style.display = "flex";
    } else {
      alert("❌ Gagal mengirim klaim: " + data.message);
      document.getElementById("kirimBtn").disabled = false;
    }

  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    alert("Terjadi kesalahan koneksi ke server.");
    document.getElementById("kirimBtn").disabled = false;
  }
});

// === Fungsi Tutup Popup & Arahkan ke Riwayat Klaim ===
function tutupSukses() {
  const popup = document.getElementById("popupSukses");
  popup.style.opacity = "0";
  setTimeout(() => {
    popup.style.display = "none";
    window.location.href = "/riwayat-klaim"; // arahkan ke halaman riwayat klaim
  }, 300); // jeda animasi 0.3 detik sebelum pindah halaman
}
