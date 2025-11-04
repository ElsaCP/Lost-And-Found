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
// Contoh Data Laporan Kehilangan
// (nanti bisa diambil dari input form kehilangan)
// ===============================
const laporanKehilangan = {
  nama: "Dompet Kulit Buaya",
  kategori: "Dompet",
  warna: "Coklat",
  lokasi: "Terminal 1 - Area Kedatangan"
};

// ===============================
// Fungsi bantu untuk cek terminal sama
// ===============================
function lokasiSama(lokasi1, lokasi2) {
  const regex = /terminal\s*(\d+)/i;
  const match1 = lokasi1.match(regex);
  const match2 = lokasi2.match(regex);
  if (!match1 || !match2) return false;
  return match1[1] === match2[1];
}

// ===============================
// Fungsi bantu: hitung kemiripan kata nama
// ===============================
function kemiripanKata(teks1, teks2) {
  const a = teks1.toLowerCase().split(" ");
  const b = teks2.toLowerCase().split(" ");
  const sama = a.filter(kata => b.includes(kata));
  return sama.length / Math.max(a.length, b.length);
}

// ===============================
// Fungsi utama: cari barang serupa
// ===============================
function cariBarangSerupa() {
  return barangData.filter(item => {
    const miripNama = kemiripanKata(laporanKehilangan.nama, item.nama) >= 0.3;
    const kategoriSama = item.kategori.toLowerCase() === laporanKehilangan.kategori.toLowerCase();
    const lokasiSamaTerminal = lokasiSama(item.lokasi, laporanKehilangan.lokasi);
    const warnaAda = item.deskripsi.toLowerCase().includes(laporanKehilangan.warna.toLowerCase());
    return kategoriSama && lokasiSamaTerminal && (miripNama || warnaAda);
  });
}

// ===============================
// Tampilkan barang serupa ke halaman
// ===============================
function tampilkanBarangSerupa() {
  const container = document.getElementById("barangSerupaContainer");
  const hasil = cariBarangSerupa();

  if (!container) return;

  if (hasil.length === 0) {
    container.innerHTML = `
      <p class="text-muted text-center mt-3">
        Tidak ada barang serupa yang ditemukan di terminal ini.
      </p>`;
    return;
  }

  container.innerHTML = hasil.map(item => `
    <div class="col-md-4 mb-4">
      <div class="card item-card border-0 shadow-sm">
        <img src="${item.gambar}" alt="${item.nama}" class="card-img-top rounded-top">
        <div class="card-body">
          <h5 class="card-title fw-bold">${item.nama}</h5>
          <p class="text-muted mb-1"><strong>Kategori:</strong> ${item.kategori}</p>
          <p class="text-muted mb-1"><strong>Deskripsi:</strong> ${item.deskripsi}</p>
          <p class="text-muted mb-1"><strong>Lokasi:</strong> ${item.lokasi}</p>
          <p class="text-muted mb-1"><strong>Tanggal:</strong> ${item.tanggal}</p>
          <p class="text-muted mb-3"><strong>Kode Barang:</strong> ${item.id}</p>
          <div class="d-flex justify-content-between">
            <button class="btn btn-outline-primary w-100 me-2" onclick="bukaDetail('${item.id}')">Detail</button>
            <button class="btn btn-primary w-100" onclick="klaimBarang('${item.id}')">Klaim Barang</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

// ===============================
// Aksi tombol
// ===============================
function bukaDetail(id) {
  window.location.href = `detail_barang.html?id=${id}`;
}

function klaimBarang(id) {
  window.location.href = `form_klaim_barang.html?id=${id}`;
}

// ===============================
// Jalankan saat halaman dimuat
// ===============================
document.addEventListener("DOMContentLoaded", tampilkanBarangSerupa);
