// ===============================
// Data Barang (harus sama dengan cari_barang.js)
// ===============================
const barangData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", kategori: "Dompet", tanggal: "01/10/2025", gambar: "image/domkul.jpg", deskripsi: "Warna Coklat", lokasi: "Terminal 1 - Area Kedatangan" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", kategori: "Jam Tangan", tanggal: "02/10/2025", gambar: "image/jam hitam.webp", deskripsi: "Warna Hitam", lokasi: "Terminal 2 - Area Keberangkatan" },
  { id: "LF-F003", nama: "Topi Biru", kategori: "Topi", tanggal: "03/10/2025", gambar: "image/topi biru.jpg", deskripsi: "Topi berwarna biru tua", lokasi: "Terminal 1 - Gate 5" },
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


// ===============================
// Ambil parameter ID dari URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const idBarang = urlParams.get("id");
const detailContainer = document.getElementById("detailContainer");

// ===============================
// Tampilkan detail barang
// ===============================
const barang = barangData.find(b => b.id === idBarang);

if (barang) {
  detailContainer.innerHTML = `
    <div class="col-md-5 text-center detail-img">
      <img src="${barang.gambar}" alt="${barang.nama}">
    </div>

    <div class="col-md-7 detail-info">
      <h2>${barang.nama}</h2>
      <div class="badge-kategori">${barang.kategori}</div>
      <p><strong>Deskripsi:</strong> ${barang.deskripsi}</p>
      <p><strong>Informasi Penemuan:</strong></p>
      <p><i class="fa-regular fa-clock icon"></i> ${barang.tanggal}</p>
      <p><i class="fa-solid fa-location-dot icon"></i> ${barang.lokasi}</p>

      <button class="btn-klaim" onclick="klaimBarang('${barang.id}')">Klaim Barang</button>
    </div>
  `;
} else {
  detailContainer.innerHTML = `
    <div class="text-center py-5">
      <h3 class="text-danger">Barang tidak ditemukan</h3>
      <p>Silakan kembali ke halaman <a href="cari_barang.html">Cari Barang</a>.</p>
    </div>
  `;
}

// ===============================
// Fungsi Tombol Klaim
// ===============================
function klaimBarang(id) {
  window.location.href = `form_klaim_barang.html?id=${id}`;
}
