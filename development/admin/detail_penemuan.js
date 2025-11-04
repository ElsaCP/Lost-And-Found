document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const from = urlParams.get("from") || "daftar_penemuan";

  const dataPenemuan = [
    {
      kode: "LF-F001",
      namaPelapor: "Elsa Claudia P.",
      email: "elsa@gmail.com",
      noTelp: "08321xxxxxx",
      namaBarang: "Dompet Kulit Buaya",
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
      deskripsi: "Tas punggung warna hitam, terdapat gantungan kunci kecil di resleting.",
      lokasi: "Terminal 2, Keberangkatan",
      tanggalLapor: "24/09/2025",
      updateTerakhir: "25/09/2025",
      status: "Diverifikasi",
      foto: "https://placehold.co/344x375?text=Tas"
    }
  ];

  const laporan = dataPenemuan.find(item => item.kode === kode);
  if (!laporan) {
    Swal.fire("Oops!", "Data laporan tidak ditemukan!", "error");
    return;
  }

  document.getElementById("kodeLaporan").textContent = laporan.kode;
  document.getElementById("fotoBarang").src = laporan.foto;
  document.getElementById("namaPelapor").textContent = laporan.namaPelapor;
  document.getElementById("noTelp").textContent = laporan.noTelp;
  document.getElementById("email").textContent = laporan.email;
  document.getElementById("namaBarang").textContent = laporan.namaBarang;
  document.getElementById("deskripsi").textContent = laporan.deskripsi;
  document.getElementById("lokasi").textContent = laporan.lokasi;
  document.getElementById("tanggalLapor").textContent = laporan.tanggalLapor;
  document.getElementById("updateTerakhir").textContent = laporan.updateTerakhir;
  document.getElementById("status").value = laporan.status;

  // Tombol Update
  document.getElementById("btnUpdate").addEventListener("click", () => {
    const newStatus = document.getElementById("status").value;
    Swal.fire({
      icon: "success",
      title: "Status Diperbarui!",
      text: `Status barang berhasil diubah menjadi "${newStatus}".`,
      showConfirmButton: false,
      timer: 2000
    });
  });

  // Tombol Klaim
  document.getElementById("btnKlaim").addEventListener("click", () => {
    Swal.fire({
      title: "Klaim Barang?",
      text: "Apakah kamu ingin mengajukan klaim untuk barang ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, klaim",
      cancelButtonText: "Batal",
      confirmButtonColor: "#0055B8"
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `klaim_barang.html?kode=${laporan.kode}`;
      }
    });
  });

  // Tombol Kembali (sama seperti detail kehilangan)
  document.getElementById("btnKembali").addEventListener("click", () => {
    window.location.href = `${from}.html`;
  });
});
