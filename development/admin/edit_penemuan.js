document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const from = urlParams.get("from") || "daftar_penemuan";

  // ==== DATA CONTOH PENEMUAN ====
  const dataPenemuan = [
    {
      kode: "LF-F001",
      namaPelapor: "Elsa Claudia P.",
      email: "elsa@gmail.com",
      noTelp: "08321xxxxxx",
      namaBarang: "Dompet Kulit Buaya",
      jenisLaporan: "Penemuan",
      deskripsi: "Warna coklat",
      lokasi: "Terminal 1, Kedatangan",
      tanggalLapor: "21/09/2025",
      updateTerakhir: "21/09/2025",
      status: "Pending",
      foto: "https://placehold.co/344x375?text=Dompet"
    },
    {
      kode: "LF-F002",
      namaPelapor: "Aulia Agstya H.",
      email: "aulia@gmail.com",
      noTelp: "08214xxxxxx",
      namaBarang: "Tas Punggung Hitam",
      jenisLaporan: "Penemuan",
      deskripsi: "Tas punggung warna hitam dengan gantungan kunci kecil.",
      lokasi: "Terminal 2, Keberangkatan",
      tanggalLapor: "24/09/2025",
      updateTerakhir: "25/09/2025",
      status: "Diverifikasi",
      foto: "https://placehold.co/344x375?text=Tas"
    }
  ];

  if (!kode) {
    alert("Kode laporan tidak ditemukan!");
    return;
  }

  const laporan = dataPenemuan.find(item => item.kode === kode);
  if (!laporan) {
    alert("Data laporan tidak ditemukan!");
    return;
  }

  // === ISI DATA KE FORM ===
  document.getElementById("kodeLaporan").textContent = laporan.kode;
  document.getElementById("fotoBarang").src = laporan.foto;
  document.getElementById("namaPelapor").value = laporan.namaPelapor;
  document.getElementById("noTelp").value = laporan.noTelp;
  document.getElementById("email").value = laporan.email;
  document.getElementById("namaBarang").value = laporan.namaBarang;
  document.getElementById("lokasi").value = laporan.lokasi;
  document.getElementById("deskripsi").value = laporan.deskripsi;
  document.getElementById("tanggalLapor").value = laporan.tanggalLapor;
  document.getElementById("status").value = laporan.status;

  // === INISIALISASI FLATPICKR UNTUK UPDATE TERAKHIR ===
  flatpickr("#updateTerakhir", {
    dateFormat: "d/m/Y",
    defaultDate: laporan.updateTerakhir,
    locale: { firstDayOfWeek: 1 }
  });

  // === TOMBOL SIMPAN ===
  document.getElementById("btnSimpan").addEventListener("click", () => {
    laporan.namaPelapor = document.getElementById("namaPelapor").value;
    laporan.noTelp = document.getElementById("noTelp").value;
    laporan.email = document.getElementById("email").value;
    laporan.namaBarang = document.getElementById("namaBarang").value;
    laporan.lokasi = document.getElementById("lokasi").value;
    laporan.deskripsi = document.getElementById("deskripsi").value;
    laporan.status = document.getElementById("status").value;

    const newDate = document.getElementById("updateTerakhir").value;
    if (newDate) {
      laporan.updateTerakhir = newDate;
    }

    alert("Perubahan berhasil disimpan!");
  });

  // === TOMBOL KEMBALI ===
  document.getElementById("btnKembali").addEventListener("click", () => {
    window.location.href = `${from}.html`;
  });
});
