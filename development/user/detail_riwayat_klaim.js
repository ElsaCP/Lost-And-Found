// === Ambil data klaim dari localStorage ===
const dataKlaim = JSON.parse(localStorage.getItem("dataKlaim")) || [];

// Ambil kode laporan dari URL
const kodeLaporan = new URLSearchParams(window.location.search).get("kode");
const klaim = dataKlaim.find(k => k.kodeLaporan === kodeLaporan);

// Data barang (dummy contoh)
const barangData = [
  { id: "LF-F001", nama: "Dompet Kulit Coklat", gambar: "image/domkul.jpg" },
  { id: "LF-F002", nama: "Jam Tangan Hitam", gambar: "image/jam hitam.webp" },
  { id: "LF-F003", nama: "Topi Biru", gambar: "image/topi biru.jpg" },
  { id: "LF-F004", nama: "Airpods Putih", gambar: "image/airpods.png" },
  { id: "LF-F005", nama: "Ikat Pinggang Kulit", gambar: "image/ikatpinggang.png" },
  { id: "LF-F006", nama: "Pouch Merah",  gambar: "image/pouch merah.webp" },
  { id: "LF-F007", nama: "Jam Tangan Putih", gambar: "image/jam putih.jpg" },
  { id: "LF-F008", nama: "Dompet Wanita Hitam", gambar: "image/dompet wanita.webp" },
  { id: "LF-F009", nama: "Topi Eiger Hitam", gambar: "image/topi eiger.webp" },
  { id: "LF-F010", nama: "Airpods Pro", gambar: "image/airpods pro.webp" },
  { id: "LF-F011", nama: "Dompet Kulit Buaya", gambar: "image/dompet.png" },
  { id: "LF-F012", nama: "Pouch Hitam", gambar: "image/pouch.png" },
  { id: "LF-F013", nama: "Topi Hitam Nike", gambar: "image/topi nike.webp" },
  { id: "LF-F014", nama: "Jam Analog Silver", gambar: "image/jam analog.webp" },
];

// Elemen DOM
const infoBarang = document.getElementById("infoBarang");
const detailLaporan = document.getElementById("detailLaporan");
const tabelStatus = document.getElementById("tabelStatus");
const detailBox = document.getElementById("detailBox");
const konten = document.getElementById("kontenDetail");

// Jika data tidak ditemukan
if (!klaim) {
  konten.innerHTML = `<p class="text-center mt-5">Data klaim tidak ditemukan.</p>`;
} else {
  const barang = barangData.find(b => b.id === klaim.kodeBarang);

  // === INFO BARANG ===
  infoBarang.innerHTML = `
    <img src="${barang.gambar}" alt="${barang.nama}">
    <div class="mt-3" style="text-align: justify;">
      <p><strong>Nama Barang :</strong> ${barang.nama}</p>
      <p><strong>Jenis Laporan :</strong> Klaim Barang</p>
      <p><strong>Tanggal :</strong> ${klaim.tanggal}</p>
      <p><strong>Waktu Klaim :</strong> ${klaim.waktu}</p>
      <p><strong>Deskripsi :</strong> ${klaim.deskripsi || '-'}</p>
    </div>
  `;

  // === Riwayat Status Dummy (STABIL, tidak ikut jam real) ===
  // Semua status dan tanggal disimpan di klaim.statusHistory
  const riwayatStatus = klaim.statusHistory || [
    {
      tanggal: klaim.tanggal,
      waktu: klaim.waktu,
      status: "Pending",
      catatan: "Menunggu verifikasi dari admin."
    }
  ];

  // === Ambil tanggal & waktu update terakhir dari riwayat ===
  const terakhir = riwayatStatus[riwayatStatus.length - 1];
  const tanggalUpdateTerakhir = terakhir.tanggal;
  const waktuUpdateTerakhir = terakhir.waktu || "-";

  // === DETAIL LAPORAN TERKINI ===
  let warnaKelas = "";
  switch (klaim.status.toLowerCase()) {
    case "pending": warnaKelas = "detail-pending"; break;
    case "verifikasi": warnaKelas = "detail-verifikasi"; break;
    case "ditolak": warnaKelas = "detail-ditolak"; break;
    case "siap diambil": warnaKelas = "detail-verifikasi"; break;
    default: warnaKelas = "detail-pending";
  }

  detailBox.classList.add(warnaKelas);

  detailLaporan.innerHTML = `
    <p><strong>Kode Laporan :</strong> ${klaim.kodeLaporan}</p>
    <p><strong>Status :</strong> ${klaim.status}</p>
    <p><strong>Catatan :</strong> ${klaim.catatan}</p>
    <p><strong>Update Terakhir :</strong> ${tanggalUpdateTerakhir} 
      <span class="text-primary fw-bold">${waktuUpdateTerakhir}</span>
    </p>
  `;

  // === ISI TABEL STATUS ===
  let tabelHTML = "";
  riwayatStatus.forEach(r => {
    let statusClass = "";
    if (r.status.toLowerCase() === "pending") statusClass = "status-pending";
    else if (r.status.toLowerCase() === "verifikasi") statusClass = "status-verifikasi";
    else if (r.status.toLowerCase() === "ditolak") statusClass = "status-ditolak";
    else if (r.status.toLowerCase() === "siap diambil") statusClass = "status-verifikasi";

    tabelHTML += `
      <tr>
        <td>${r.tanggal}</td>
        <td><span class="status-dot ${statusClass}"></span>${r.status}</td>
        <td>${r.catatan}</td>
      </tr>
    `;
  });

  tabelStatus.innerHTML = tabelHTML;
}

// --- Data dummy klaim (untuk testing) ---
const contohKlaim = [
  {
    email: "aulia@gmail.com",
    kodeBarang: "LF-F001",
    kodeLaporan: "LF-C001",
    tanggal: "25/10/2025",
    waktu: "09:30",
    status: "Verifikasi",
    catatan: "Barang sudah dikonfirmasi petugas.",
    deskripsi: "Dompet warna coklat dengan inisial A.H di dalamnya.",
    statusHistory: [
      {
        tanggal: "25/10/2025",
        waktu: "09:30",
        status: "Pending",
        catatan: "Menunggu verifikasi dari admin."
      },
      {
        tanggal: "27/10/2025",
        waktu: "13:30",
        status: "Verifikasi",
        catatan: "Barang sudah dikonfirmasi petugas."
      }
    ]
  },
  {
    email: "aulia@gmail.com",
    kodeBarang: "LF-F002",
    kodeLaporan: "LF-C002",
    tanggal: "26/10/2025",
    waktu: "10:15",
    status: "Pending",
    catatan: "Menunggu verifikasi petugas.",
    deskripsi: "Jam tangan warna hitam merek Casio ditemukan di ruang tunggu Gate 3.",
    statusHistory: [
      {
        tanggal: "26/10/2025",
        waktu: "10:15",
        status: "Pending",
        catatan: "Menunggu verifikasi dari admin."
      }
    ]
  },
  {
    email: "aulia@gmail.com",
    kodeBarang: "LF-F003",
    kodeLaporan: "LF-C003",
    tanggal: "24/10/2025",
    waktu: "08:45",
    status: "Ditolak",
    catatan: "Deskripsi tidak sesuai barang.",
    deskripsi: "Topi biru bertuliskan 'Juanda Airport'.",
    statusHistory: [
      {
        tanggal: "24/10/2025",
        waktu: "08:45",
        status: "Pending",
        catatan: "Menunggu verifikasi dari admin."
      },
      {
        tanggal: "25/10/2025",
        waktu: "14:00",
        status: "Ditolak",
        catatan: "Deskripsi tidak sesuai barang."
      }
    ]
  }
];

// Simpan ke localStorage hanya jika belum ada
if (!localStorage.getItem("dataKlaim")) {
  localStorage.setItem("dataKlaim", JSON.stringify(contohKlaim));
  console.log("✅ Data dummy klaim berhasil dimasukkan ke localStorage");
} else {
  console.log("ℹ️ Data klaim sudah ada di localStorage");
}
