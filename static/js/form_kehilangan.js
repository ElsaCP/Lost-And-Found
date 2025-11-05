const form = document.getElementById("laporForm");
const popupKonfirmasi = document.getElementById("popupKonfirmasi");
const popupSukses = document.getElementById("popupSukses");
const kodeKehilanganEl = document.getElementById("kodeKehilangan");
const jenisBarang = document.getElementById("jenis_barang");
const lainnyaContainer = document.getElementById("lainnyaContainer");

jenisBarang.addEventListener("change", () => {
  lainnyaContainer.style.display = (jenisBarang.value === "Lainnya") ? "block" : "none";
});

let dataLaporan = {};

// === Saat tombol Submit ditekan ===
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validasi form
  if (!form.checkValidity()) {
    alert("Harap isi semua data dengan lengkap!");
    return;
  }

  // Ambil semua input form
  const formData = new FormData(form);
  dataLaporan = Object.fromEntries(formData.entries());

  // Jika user pilih "Lainnya", ambil input tambahan
  if (dataLaporan.jenis_barang === "Lainnya") {
    dataLaporan.jenis_barang = document.getElementById("jenis_lainnya").value || "Tidak disebutkan";
  }

  popupKonfirmasi.style.display = "flex";
});

// === Tutup popup konfirmasi ===
function tutupPopup() {
  popupKonfirmasi.style.display = "none";
}

// === Buat kode laporan otomatis ===
function getNextKode() {
  const data = JSON.parse(localStorage.getItem("dataKehilangan")) || [];
  const nextNumber = data.length + 1;
  return "LF-L" + String(nextNumber).padStart(4, "0");
}

// === Simpan laporan ke localStorage ===
function kirimData() {
  const kode = getNextKode();
  const waktuSekarang = new Date();

  dataLaporan.kode_kehilangan = kode;
  dataLaporan.status = "Pending";
  dataLaporan.tanggal_submit = waktuSekarang.toLocaleDateString("id-ID");
  dataLaporan.waktu_submit = waktuSekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // Simpan nama file foto
  const fileInput = form.querySelector('input[name="foto_barang"]');
  dataLaporan.foto_barang = fileInput.files[0] ? fileInput.files[0].name : "";

  // Simpan riwayat awal (status pertama)
  dataLaporan.riwayat = [
    {
      tanggal: dataLaporan.tanggal_kehilangan,
      status: "Pending",
      catatan: "Menunggu verifikasi oleh admin."
    }
  ];

  // Ambil data lama dan tambahkan
  const simpan = JSON.parse(localStorage.getItem("dataKehilangan")) || [];
  simpan.push(dataLaporan);
  localStorage.setItem("dataKehilangan", JSON.stringify(simpan));

  // Tampilkan kode laporan di popup sukses
  kodeKehilanganEl.textContent = kode;

  // Tampilkan popup sukses
  popupKonfirmasi.style.display = "none";
  popupSukses.style.display = "flex";
}

// === Tutup popup sukses ===
function tutupSukses() {
  popupSukses.style.display = "none";
  form.reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
