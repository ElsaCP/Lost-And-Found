document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // SIMULASI DATA KLAIM BARANG
  // =========================
  const dataKlaim = {
    "LF-F001": {
      kode: "LF-F001",
      namaPelapor: "Angelina Werdita Leksono",
      telp: "085231256392",
      email: "angelina087@gmail.com",
      namaBarang: "Dompet Kulit Buaya",
      jenisLaporan: "Klaim Barang",
      lokasi: "Terminal 1, Kedatangan",
      deskripsi: "Warna Coklat",
      deskripsiKhusus: "Terdapat goresan",
      tanggalLapor: "21/09/2025",
      updateTerakhir: "21/09/2025",
      status: "Pending",
      catatan: "",
      fotoBarang: "image/dompet.jpg"
    },
    "LF-F002": {
      kode: "LF-F002",
      namaPelapor: "Marsanda Sofi Aminarti",
      telp: "082233445566",
      email: "marsandasofi@gmail.com",
      namaBarang: "Airpods Samsung Putih",
      jenisLaporan: "Klaim Barang",
      lokasi: "Terminal 2, Kedatangan",
      deskripsi: "Earbuds putih kecil di dalam casing oval",
      deskripsiKhusus: "Bagian kanan sedikit lecet",
      tanggalLapor: "25/09/2025",
      updateTerakhir: "25/09/2025",
      status: "Ditolak",
      catatan: "Barang tidak sesuai dengan deskripsi kehilangan",
      fotoBarang: "image/airpods.jpg"
    },
    "LF-F003": {
      kode: "LF-F003",
      namaPelapor: "Dwi Amanda Yona",
      telp: "085612345678",
      email: "amandayona@gmail.com",
      namaBarang: "Handphone Samsung Putih",
      jenisLaporan: "Klaim Barang",
      lokasi: "Terminal 3, Keberangkatan",
      deskripsi: "Handphone Samsung warna putih dengan casing bening",
      deskripsiKhusus: "Ada stiker kucing di bagian belakang",
      tanggalLapor: "27/09/2025",
      updateTerakhir: "27/09/2025",
      status: "Pending",
      catatan: "",
      fotoBarang: "image/hp_putih.jpg"
    }
  };

  // =========================
  // AMBIL DATA BERDASARKAN KODE
  // =========================
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const data = dataKlaim[kode];

  if (!data) return;

  // =========================
  // ISI HALAMAN DETAIL
  // =========================
  const leftColumn = document.querySelector(".left-column");
  const rightColumn = document.querySelector(".right-column");

  leftColumn.innerHTML = `
    <img src="${data.fotoBarang}" alt="${data.namaBarang}" class="item-img">
    <h3>${data.kode}</h3>
  `;

  rightColumn.innerHTML = `
    <div class="section">
      <h4>Data Pelapor</h4>
      <div class="data-row"><span>Nama :</span><p>${data.namaPelapor}</p></div>
      <div class="data-row"><span>No. Telp :</span><p>${data.telp}</p></div>
      <div class="data-row"><span>Email :</span><p>${data.email}</p></div>
    </div>

    <div class="section">
      <h4>Data Barang</h4>
      <div class="data-row"><span>Nama Barang :</span><p>${data.namaBarang}</p></div>
      <div class="data-row"><span>Jenis Laporan :</span><p>${data.jenisLaporan}</p></div>
      <div class="data-row"><span>Lokasi :</span><p>${data.lokasi}</p></div>
      <div class="data-row"><span>Deskripsi :</span><p>${data.deskripsi}</p></div>
      <div class="data-row"><span>Deskripsi Khusus :</span><p>${data.deskripsiKhusus}</p></div>

      <div class="data-row">
        <span>Identitas Diri<br>(KTP/Paspor/SIM) :</span>
        <button class="lihat-btn">Lihat Gambar</button>
      </div>

      <div class="data-row">
        <span>Bukti Laporan<br>Kehilangan (Polisi, dll) :</span>
        <button class="lihat-btn">Lihat Gambar</button>
      </div>

      <div class="data-row">
        <span>Foto Barang<br>Sebelum Hilang :</span>
        <button class="lihat-btn">Lihat Gambar</button>
      </div>

      <div class="data-row"><span>Tanggal Lapor :</span><p>${data.tanggalLapor}</p></div>
      <div class="data-row"><span>Update Terakhir :</span><p>${data.updateTerakhir}</p></div>

      <div class="data-row">
        <span>Status :</span>
        <select id="status">
          <option ${data.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${data.status === "Verifikasi" ? "selected" : ""}>Verifikasi</option>
          <option ${data.status === "Ditolak" ? "selected" : ""}>Ditolak</option>
        </select>
      </div>

      <div class="data-row">
        <span>Catatan Admin :</span>
        <textarea id="catatan" placeholder="Masukkan catatan...">${data.catatan}</textarea>
      </div>

      <div class="button-group" style="display:flex;justify-content:flex-end;gap:10px;margin-top:25px;">
        <button id="btnKembali"
          style="background-color:#e9ecef;color:#000;font-family:'Poppins',sans-serif;
          font-size:14px;font-weight:500;border:none;border-radius:6px;
          padding:8px 18px;cursor:pointer;transition:background-color 0.3s;"
          onclick="window.location.href='klaim_penemuan.html'">
          Kembali
        </button>

        <button id="updateBtn"
          style="background-color:#0852c0;color:#fff;font-family:'Poppins',sans-serif;
          font-size:14px;font-weight:500;border:none;border-radius:6px;
          padding:8px 18px;cursor:pointer;transition:background-color 0.3s;">
          Update Status
        </button>
      </div>
    </div>
  `;

  // =========================
  // EVENT UPDATE STATUS
  // =========================
  document.getElementById("updateBtn").addEventListener("click", () => {
    const status = document.getElementById("status").value;
    const catatan = document.getElementById("catatan").value.trim();

    Swal.fire({
      title: "Simpan Perubahan?",
      text: `Status akan diubah menjadi "${status}"`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Perubahan Disimpan!",
          text: `Status laporan berhasil diperbarui menjadi "${status}".`,
          timer: 2000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          window.location.href = "klaim_penemuan.html";
        }, 2000);
      }
    });
  });
});
