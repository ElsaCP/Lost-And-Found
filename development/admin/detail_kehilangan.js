document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const from = urlParams.get("from") || "daftar_kehilangan";

  // ==== DUMMY DATA LAPORAN ====
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

  // === Isi data ke elemen HTML ===
  document.getElementById("kodeLaporan").textContent = laporan.kode;
  document.getElementById("namaPelapor").textContent = laporan.namaPelapor;
  document.getElementById("email").textContent = laporan.email;
  document.getElementById("noTelp").textContent = laporan.noTelp;
  document.getElementById("namaBarang").textContent = laporan.namaBarang;
  document.getElementById("jenisLaporan").textContent = laporan.jenisLaporan;
  document.getElementById("deskripsi").textContent = laporan.deskripsi;
  document.getElementById("lokasi").textContent = laporan.lokasi;
  document.getElementById("tanggalLapor").textContent = laporan.tanggalLapor;
  document.getElementById("updateTerakhir").textContent = laporan.updateTerakhir;
  document.getElementById("fotoBarang").src = laporan.foto;
  document.getElementById("status").value = laporan.status;

  // === Tombol Update Status ===
  document.getElementById("btnUpdateStatus").addEventListener("click", () => {
    const newStatus = document.getElementById("status").value;
    laporan.status = newStatus;
    laporan.updateTerakhir = new Date().toLocaleDateString("id-ID");

    alert(`Status berhasil diubah menjadi "${newStatus}"`);
    document.getElementById("updateTerakhir").textContent = laporan.updateTerakhir;
  });

  // === Tombol Kembali ===
  document.getElementById("btnKembali").addEventListener("click", () => {
    window.location.href = `${from}.html`;
  });
});
