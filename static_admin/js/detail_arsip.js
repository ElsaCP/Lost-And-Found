document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");

  // ==== DUMMY DATA ARSIP ====
  const dataArsip = [
    {
      kode: "LF-A001",
      namaPelapor: "Elsa Claudia P.",
      email: "elsa@gmail.com",
      noTelp: "08321xxxxxx",
      namaBarang: "Dompet Kulit Coklat",
      jenisLaporan: "Kehilangan",
      kategori: "Aksesoris / Dompet",
      deskripsi: "Dompet kulit warna coklat, berisi KTP dan kartu ATM",
      lokasi: "Terminal 1, Kedatangan",
      tanggalLapor: "21/09/2025",
      tanggalArsip: "15/10/2025",
      status: "Selesai",
      foto: "https://placehold.co/230x260?text=Dompet"
    },
    {
      kode: "LF-A002",
      namaPelapor: "Aulia Agstya H.",
      email: "aulia@gmail.com",
      noTelp: "08214xxxxxx",
      namaBarang: "Jam Tangan Hitam",
      jenisLaporan: "Penemuan",
      kategori: "Aksesoris / Jam Tangan",
      deskripsi: "Jam tangan warna hitam dengan tali kulit",
      lokasi: "Terminal 2, Keberangkatan",
      tanggalLapor: "23/09/2025",
      tanggalArsip: "20/10/2025",
      status: "Selesai",
      foto: "https://placehold.co/230x260?text=Jam"
    },
    {
      kode: "LF-A003",
      namaPelapor: "Rina Maharani",
      email: "rina@gmail.com",
      noTelp: "08123xxxxxx",
      namaBarang: "Topi Hitam",
      jenisLaporan: "Penemuan",
      kategori: "Pakaian / Aksesoris",
      deskripsi: "Topi warna hitam bertuliskan 'Bandara Soetta'",
      lokasi: "Terminal 3, Area Check-In",
      tanggalLapor: "25/09/2025",
      tanggalArsip: "28/10/2025",
      status: "Selesai",
      foto: "https://placehold.co/230x260?text=Topi"
    }
  ];

  // === Validasi kode ===
  if (!kode) {
    Swal.fire({
      icon: "error",
      title: "Oops!",
      text: "Kode laporan tidak ditemukan!",
      confirmButtonColor: "#d33",
    }).then(() => (window.location.href = "arsip.html"));
    return;
  }

  const laporan = dataArsip.find(item => item.kode === kode);
  if (!laporan) {
    Swal.fire({
      icon: "error",
      title: "Data tidak ditemukan!",
      text: `Data arsip ${kode} tidak ditemukan.`,
      confirmButtonColor: "#d33",
    }).then(() => (window.location.href = "arsip.html"));
    return;
  }

  // === Tampilkan data ke halaman ===
  document.getElementById("kodeLaporan").textContent = laporan.kode;
  document.getElementById("namaPelapor").textContent = laporan.namaPelapor;
  document.getElementById("email").textContent = laporan.email;
  document.getElementById("noTelp").textContent = laporan.noTelp;
  document.getElementById("namaBarang").textContent = laporan.namaBarang;
  document.getElementById("jenisLaporan").textContent = laporan.jenisLaporan;
  document.getElementById("kategori").textContent = laporan.kategori;
  document.getElementById("deskripsi").textContent = laporan.deskripsi;
  document.getElementById("lokasi").textContent = laporan.lokasi;
  document.getElementById("tanggalLapor").textContent = laporan.tanggalLapor;
  document.getElementById("tanggalArsip").textContent = laporan.tanggalArsip;
  document.getElementById("status").textContent = laporan.status;
  document.getElementById("fotoBarang").src = laporan.foto;

  // === Tombol kembali ===
  document.getElementById("btnKembali").addEventListener("click", () => {
    window.location.href = "arsip.html";
  });

  // === Tombol pulihkan (versi SweetAlert2) ===
  document.getElementById("btnPulihkan").addEventListener("click", () => {
    Swal.fire({
      icon: "question",
      title: "Pulihkan laporan?",
      text: `Apakah kamu yakin ingin memulihkan laporan ${laporan.kode}?`,
      showCancelButton: true,
      confirmButtonText: "Ya, pulihkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: `Laporan ${laporan.kode} berhasil dipulihkan ke daftar ${laporan.jenisLaporan.toLowerCase()}.`,
          timer: 2200,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        setTimeout(() => {
          if (laporan.jenisLaporan.toLowerCase() === "penemuan") {
            window.location.href = "daftar_penemuan.html";
          } else {
            window.location.href = "daftar_kehilangan.html";
          }
        }, 2200);
      }
    });
  });
});
