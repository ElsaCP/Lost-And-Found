document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const btnCancel = document.querySelector(".btn-cancel");

  // Saat klik tombol SIMPAN
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Ambil semua input dan select di form
    const inputs = form.querySelectorAll("input, select, textarea");

    // Cek apakah ada yang kosong
    let isEmpty = false;
    inputs.forEach((el) => {
      if (el.type !== "file" && !el.value.trim()) {
        isEmpty = true;
      }
    });

    if (isEmpty) {
      Swal.fire({
        icon: "warning",
        title: "Data belum lengkap!",
        text: "Harap isi semua kolom sebelum menyimpan.",
        confirmButtonText: "OK",
        confirmButtonColor: "#f8bb86",
      });
      return; // stop proses simpan
    }

    // Jika semua terisi, tampilkan notifikasi sukses
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data kehilangan berhasil disimpan.",
      confirmButtonText: "OK",
      confirmButtonColor: "#3085d6",
      timer: 2500,
      timerProgressBar: true,
    }).then(() => {
      window.location.href = "daftar_kehilangan.html";
    });
  });

  // Saat klik tombol BATAL
  btnCancel.addEventListener("click", function () {
    Swal.fire({
      icon: "question",
      title: "Batalkan perubahan?",
      text: "Data yang belum disimpan akan hilang.",
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "daftar_kehilangan.html";
      }
    });
  });
});
