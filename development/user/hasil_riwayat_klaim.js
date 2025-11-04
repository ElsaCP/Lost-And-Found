// --- Data Barang ---
const barangData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", gambar: "image/domkul.jpg", deskripsi: "Warna Coklat", lokasi: "Terminal 1 - Area Kedatangan" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", gambar: "image/jam hitam.webp", deskripsi: "Warna Hitam", lokasi: "Terminal 2 - Area Keberangkatan" },
  { id: "LF-F003", nama: "Topi Biru", gambar: "image/topi biru.jpg", deskripsi: "Topi berwarna biru tua", lokasi: "Terminal 1 - Gate 5" },
  { id: "LF-F004", nama: "Airpods Putih", kategori: "Airpods", tanggal: "04/10/2025", gambar: "image/airpods.png", deskripsi: "Earphone nirkabel putih", lokasi: "Terminal 2 - Check-in Counter" },
  { id: "LF-F005", nama: "Ikat Pinggang Kulit", kategori: "Ikat Pinggang", tanggal: "05/10/2025", gambar: "image/ikatpinggang.png", deskripsi: "Warna coklat gelap", lokasi: "Terminal 1 - Ruang Tunggu" },
  { id: "LF-F006", nama: "Pouch Merah", kategori: "Pouch", tanggal: "06/10/2025", gambar: "image/pouch merah.webp", deskripsi: "Warna merah cerah", lokasi: "Terminal 2 - Area Bagasi" },
  { id: "LF-F007", nama: "Jam Tangan Putih", kategori: "Jam Tangan", tanggal: "07/10/2025", gambar: "image/jam putih.jpg", deskripsi: "Jam analog putih elegan", lokasi: "Terminal 1 - Check-in Counter" },
  { id: "LF-F008", nama: "Dompet Wanita Hitam", kategori: "Dompet", tanggal: "08/10/2025", gambar: "image/dompet wanita.webp", deskripsi: "Dompet kulit wanita warna hitam", lokasi: "Terminal 2 - Area Tunggu" },
  { id: "LF-F009", nama: "Topi Eiger Hitam", kategori: "Topi", tanggal: "09/10/2025", gambar: "image/topi eiger.webp", deskripsi: "Topi merk Eiger warna hitam", lokasi: "Terminal 1 - Gate 3" },
  { id: "LF-F010", nama: "Airpods Pro", kategori: "Airpods", tanggal: "10/10/2025", gambar: "image/airpods pro.webp", deskripsi: "Airpods Pro putih", lokasi: "Terminal 2 - Lounge Penumpang" },
  { id: "LF-F011", nama: "Dompet Coklat Kulit Buaya", kategori: "Dompet", tanggal: "11/10/2025", gambar: "image/dompet.png", deskripsi: "Kulit buaya asli", lokasi: "Terminal 1 - Area Kedatangan" },
  { id: "LF-F012", nama: "Pouch Hitam", kategori: "Pouch", tanggal: "12/10/2025", gambar: "image/pouch.png", deskripsi: "Pouch kecil warna hitam", lokasi: "Terminal 2 - Toilet Umum" },
  { id: "LF-F013", nama: "Topi Hitam Nike", kategori: "Topi", tanggal: "13/10/2025", gambar: "image/topi nike.webp", deskripsi: "Topi Nike warna hitam", lokasi: "Terminal 1 - Area Drop Zone" },
  { id: "LF-F014", nama: "Jam Analog Silver", kategori: "Jam Tangan", tanggal: "14/10/2025", gambar: "image/jam analog.webp", deskripsi: "Jam tangan analog warna silver", lokasi: "Terminal 2 - Gate 10" },
];

// --- Contoh data klaim (untuk testing tampilan) ---
const contohKlaim = [
  { email: "aulia@gmail.com", kodeBarang: "LF-F001", kodeLaporan: "LF-C001", status: "Verifikasi", catatan: "Barang sudah dikonfirmasi petugas." },
  { email: "aulia@gmail.com", kodeBarang: "LF-F002", kodeLaporan: "LF-C002", status: "Pending", catatan: "Menunggu verifikasi petugas." },
  { email: "aulia@gmail.com", kodeBarang: "LF-F003", kodeLaporan: "LF-C003", status: "Ditolak", catatan: "Deskripsi tidak sesuai barang." },
];

// Simpan ke localStorage agar tampil saat load halaman
if (!localStorage.getItem("dataKlaim")) {
  localStorage.setItem("dataKlaim", JSON.stringify(contohKlaim));
}

// Set email aktif untuk contoh
if (!localStorage.getItem("emailAktif")) {
  localStorage.setItem("emailAktif", "aulia@gmail.com");
}

// --- Saat halaman dimuat ---
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("emailAktif");
  const dataKlaim = JSON.parse(localStorage.getItem("dataKlaim")) || [];
  const listKlaim = document.getElementById("listKlaim");

  if (!email) {
    listKlaim.innerHTML = `<p class="text-center mt-5">Silakan login atau masukkan email terlebih dahulu.</p>`;
    return;
  }

  const klaimUser = dataKlaim.filter(k => k.email.toLowerCase() === email.toLowerCase());

  if (klaimUser.length === 0) {
    listKlaim.innerHTML = `<p class="text-center mt-5">Tidak ada riwayat klaim untuk email: <strong>${email}</strong></p>`;
    return;
  }

  klaimUser.forEach(k => {
    const barang = barangData.find(b => b.id === k.kodeBarang);
    const statusClass = k.status.toLowerCase();

    const card = document.createElement("div");
    card.className = "col-md-4";
    card.innerHTML = `
      <div class="card h-100 d-flex flex-column justify-content-between">
        <div>
          <img src="${barang?.gambar || 'image/no-image.png'}" class="card-img-top" alt="${barang?.nama || 'Barang'}">
          <div class="card-body">
            <h5 class="card-title">${barang?.nama || 'Barang Tidak Ditemukan'}</h5>
            <p class="card-text mb-1"><strong>Kode Barang:</strong> ${k.kodeBarang}</p>
            <p class="card-text mb-1"><strong>Kode Klaim:</strong> ${k.kodeLaporan}</p>
            <p class="card-text"><strong>Deskripsi:</strong> ${barang?.deskripsi || '-'}</p>
            <p class="card-text"><strong>Lokasi:</strong> ${barang?.lokasi || '-'}</p>
            <span class="status ${statusClass}">${k.status}</span>
            <p class="mt-2"><small>${k.catatan}</small></p>
          </div>
        </div>
        <div class="text-end p-3 pt-0">
          <a href="detail_riwayat_klaim.html?kode=${k.kodeLaporan}" class="btn btn-primary btn-sm lihat-detail">Lihat Detail</a>
        </div>
      </div>
    `;
    listKlaim.appendChild(card);
  });
});
