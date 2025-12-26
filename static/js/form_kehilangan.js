const form = document.getElementById("laporForm");
const popupKonfirmasi = document.getElementById("popupKonfirmasi");
const popupSukses = document.getElementById("popupSukses");
const kodeKehilanganEl = document.getElementById("kodeKehilangan");
const kategori = document.getElementById("kategori");
const lainnyaContainer = document.getElementById("lainnyaContainer");

let formDataGlobal = null;

// === Tampilkan input tambahan jika kategori "Lainnya" ===
kategori.addEventListener("change", () => {
  lainnyaContainer.style.display = (kategori.value === "Lainnya") ? "block" : "none";
});

// === Saat tombol Submit ditekan ===
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validasi semua input wajib
  if (!form.checkValidity()) {
    alert("⚠️ Harap isi semua data dengan lengkap sebelum mengirim laporan!");
    form.reportValidity();
    return;
  }

  // Simpan form data ke variabel global
  formDataGlobal = new FormData(form);

  // ==== Ambil dan gabungkan lokasi ====
  const terminal = document.getElementById("terminal")?.value || "";
  const tempat = document.getElementById("tempat")?.value || "";
  const lokasiLain = document.getElementById("lokasi_lain")?.value.trim() || "";

  let lokasiGabungan = "";
  if (tempat === "Lainnya" && lokasiLain) {
    lokasiGabungan = `${terminal} - ${lokasiLain}`;
  } else if (terminal && tempat) {
    lokasiGabungan = `${terminal} - ${tempat}`;
  } else if (terminal) {
    lokasiGabungan = terminal;
  } else if (tempat) {
    lokasiGabungan = tempat;
  }

  // Simpan lokasi gabungan ke FormData
  formDataGlobal.set("lokasi", lokasiGabungan);

  // ==== Jika kategori "Lainnya", ambil input tambahan ====
  if (formDataGlobal.get("kategori") === "Lainnya") {
    const kategoriLain = document.getElementById("kategori_lainnya").value.trim();
    if (!kategoriLain) {
      alert("Harap isi kategori barang lainnya!");
      return;
    }
    formDataGlobal.set("kategori", kategoriLain);
  }

  // Tampilkan popup konfirmasi
  popupKonfirmasi.style.display = "flex";
});

// === Tutup popup konfirmasi ===
function tutupPopup() {
  popupKonfirmasi.style.display = "none";
  window.location.href = "/form-kehilangan";
}

// === Kirim data ke backend Flask ===
function kirimData() {
  popupKonfirmasi.style.display = "none";

  // 🔵 TAMPILKAN LOADING
  const loading = document.getElementById("loadingOverlay");
  loading.style.display = "flex";

  fetch("/submit-kehilangan", {
    method: "POST",
    body: formDataGlobal
  })
    .then(response => response.json())
    .then(result => {
      // 🔴 SEMBUNYIKAN LOADING
      loading.style.display = "none";

      if (result.success) {
        kodeKehilanganEl.textContent = result.kode_kehilangan;
        popupSukses.style.display = "flex";
      } else {
        alert("Gagal mengirim laporan: " + result.message);
      }
    })
    .catch(err => {
      loading.style.display = "none";
      console.error(err);
      alert("Terjadi kesalahan saat mengirim laporan!");
    });
}

// === Tutup popup sukses ===
function tutupSukses() {
  popupSukses.style.display = "none";
  form.reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.location.href = "/cek-laporan";
}
