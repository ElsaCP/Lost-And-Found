document.addEventListener("DOMContentLoaded", () => {

  // ======================================
  //  FITUR: TOMBOL LIHAT DETAIL
  //  (sekarang tabel sudah dipenerate Flask)
  // ======================================
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.dataset.kode;
      if (kode) {
        window.location.href = `/admin/arsip/detail?kode=${encodeURIComponent(kode)}`;
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "Kode laporan tidak ditemukan.",
          confirmButtonColor: "#d33"
        });
      }
    });
  });

  // ===========================================================
  //  FITUR: RESTORE (Tidak pakai dummy)
  //  Kamu nanti tinggal aktifkan setelah route restore selesai
  // ===========================================================
  document.querySelectorAll(".btn-restore").forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.dataset.kode;
      const jenis = btn.dataset.jenis; // dikirim dari HTML (Kehilangan/Penemuan)

      Swal.fire({
        icon: "question",
        title: "Pulihkan laporan?",
        text: `Apakah kamu yakin ingin memulihkan laporan ${kode}?`,
        showCancelButton: true,
        confirmButtonText: "Ya, pulihkan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {

          // === AJAX ke Flask untuk mengganti status jadi "Diproses" ===
          fetch(`/admin/arsip/restore?kode=${kode}`, {
            method: "POST"
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: `Laporan ${kode} telah dipulihkan.`,
                timer: 1800,
                showConfirmButton: false
              });

              setTimeout(() => {
                if (jenis.toLowerCase() === "penemuan") {
                  window.location.href = "/admin/penemuan";
                } else {
                  window.location.href = "/admin/kehilangan";
                }
              }, 1800);

            } else {
              Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: data.message || "Terjadi kesalahan."
              });
            }
          });
        }
      });
    });
  });

  // ======================
  //  FITUR PENCARIAN
  // ======================
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      document.querySelectorAll(".arsip-table tbody tr").forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }

});
