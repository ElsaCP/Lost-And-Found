document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const from = urlParams.get("from") || "daftar_kehilangan";

  // ==== DATA CONTOH (sama seperti detail laporan) ====
  const dataLaporan = [
    {
      kode: "LF-L001",
      namaPelapor: "Elsa Claudia P.",
      email: "elsa@gmail.com",
      noTelp: "08321xxxxxx",
      namaBarang: "Dompet Kulit Buaya",
      jenisLaporan: "Kehilangan",
      deskripsi: "Warna coklat",
      lokasi: "Terminal 1, Kedatangan",
      tanggalLapor: "21/09/2025",
      updateTerakhir: "21/09/2025",
      status: "Pending",
      foto: "https://placehold.co/344x375?text=Dompet"
    },
    {
      kode: "LF-L002",
      namaPelapor: "Aulia Agstya H.",
      email: "aulia@gmail.com",
      noTelp: "08214xxxxxx",
      namaBarang: "Jam Tangan",
      jenisLaporan: "Kehilangan",
      deskripsi: "Warna hitam",
      lokasi: "Terminal 2, Keberangkatan",
      tanggalLapor: "23/09/2025",
      updateTerakhir: "25/09/2025",
      status: "Verifikasi",
      foto: "https://placehold.co/344x375?text=Jam"
    }
  ];

  if (!kode) {
    alert("Kode laporan tidak ditemukan!");
    return;
  }

  const laporan = dataLaporan.find(item => item.kode === kode);
  if (!laporan) {
    alert("Data laporan tidak ditemukan!");
    return;
  }

  // === ISI DATA KE INPUT ===
  document.getElementById("kodeLaporan").textContent = laporan.kode;
  document.getElementById("fotoBarang").src = laporan.foto;
  document.getElementById("namaPelapor").value = laporan.namaPelapor;
  document.getElementById("noTelp").value = laporan.noTelp;
  document.getElementById("email").value = laporan.email;
  document.getElementById("namaBarang").value = laporan.namaBarang;
  document.getElementById("jenisLaporan").value = laporan.jenisLaporan;
  document.getElementById("lokasi").value = laporan.lokasi;
  document.getElementById("deskripsi").value = laporan.deskripsi;
  document.getElementById("tanggalLapor").value = laporan.tanggalLapor; // readonly
  document.getElementById("status").value = laporan.status;

  // === INISIALISASI FLATPICKR (UPDATE TERAKHIR) ===
  flatpickr("#updateTerakhir", {
    dateFormat: "d/m/Y", // tampil dd/mm/yyyy
    defaultDate: laporan.updateTerakhir,
    locale: {
      firstDayOfWeek: 1
    }
  });

  // === TOMBOL SIMPAN ===
  document.getElementById("btnSimpan").addEventListener("click", () => {
    laporan.namaPelapor = document.getElementById("namaPelapor").value;
    laporan.noTelp = document.getElementById("noTelp").value;
    laporan.email = document.getElementById("email").value;
    laporan.namaBarang = document.getElementById("namaBarang").value;
    laporan.jenisLaporan = document.getElementById("jenisLaporan").value;
    laporan.lokasi = document.getElementById("lokasi").value;
    laporan.deskripsi = document.getElementById("deskripsi").value;
    laporan.status = document.getElementById("status").value;

    const newDate = document.getElementById("updateTerakhir").value;
    if (newDate) {
      laporan.updateTerakhir = newDate; // sudah dalam format dd/mm/yyyy
    }

    alert("Perubahan berhasil disimpan!");
  });

  // === TOMBOL KEMBALI ===
  document.getElementById("btnKembali").addEventListener("click", () => {
    window.location.href = `${from}.html`;
  });
});
