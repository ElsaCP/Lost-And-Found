document.addEventListener("DOMContentLoaded", function () {

  // ===============================
  // 🔎 SEARCH
  // ===============================
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("keyup", function () {
    const filter = this.value.toUpperCase();
    const rows = document.querySelector("#dataTable tbody").rows;

    for (let row of rows) {
      let match = false;
      for (let j = 0; j < row.cells.length - 1; j++) {
        if (row.cells[j].textContent.toUpperCase().includes(filter)) {
          match = true;
          break;
        }
      }
      row.style.display = match ? "" : "none";
    }
  });

  // ===============================
  // 🎛 AKSI TOMBOL
  // ===============================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = btn.dataset.kode;
    const jenis = btn.dataset.jenis?.toLowerCase();

    if (!kode || !jenis) return;

    // ===============================
    // 🔍 DETAIL
    // ===============================
    if (btn.classList.contains("btn-view")) {

      if (jenis === "kehilangan") {
        window.location.href = `/admin/kehilangan/detail?kode=${kode}&from=beranda`;
      }

      else if (jenis === "penemuan") {
        window.location.href = `/admin/penemuan/detail?kode=${kode}&from=beranda`;
      }

      else if (jenis === "klaim") {
        window.location.href = `/admin/penemuan/klaim/detail/${kode}?&from=beranda`;
      }

      return;
    }

    // ===============================
    // ✏ EDIT
    // ===============================
    if (btn.classList.contains("btn-edit")) {

      if (jenis === "kehilangan") {
        window.location.href = `/admin/kehilangan/edit?kode=${kode}&from=beranda`;
      }

      else if (jenis === "penemuan") {
        window.location.href = `/admin/penemuan/edit?kode=${kode}&from=beranda`;
      }

      else if (jenis === "klaim") {
        Swal.fire("Laporan klaim tidak bisa diedit!", "", "info");
      }

      return;
    }

    // ===============================
    // ❌ DELETE
    // ===============================
    if (btn.classList.contains("btn-delete")) {
      Swal.fire({
        title: "Hapus?",
        text: `Hapus laporan ${kode}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya",
        cancelButtonText: "Batal",
      }).then(res => {
        if (res.isConfirmed) {
          row.remove();
          Swal.fire("Berhasil!", "Data dihapus.", "success");
        }
      });
      return;
    }

    // ===============================
    // ✔ VERIFY
    // ===============================
    if (btn.classList.contains("btn-verify")) {
      const select = row.querySelector("select");
      if (select) select.value = "Verifikasi";

      Swal.fire({
        icon: "success",
        title: "Diverifikasi!",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

  });

});
