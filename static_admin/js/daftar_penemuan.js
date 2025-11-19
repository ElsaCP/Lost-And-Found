document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // SET PREV STATUS SAAT LOAD
  // =========================
  document.querySelectorAll(".status-select").forEach(sel => {
    sel.dataset.prev = sel.value;
  });


  // =========================
  // FITUR UBAH STATUS
  // =========================
  document.addEventListener("change", function (e) {
    if (!e.target.matches(".status-select")) return;

    const select = e.target;
    const newStatus = select.value;
    const prevStatus = select.dataset.prev;

    const row = select.closest("tr");
    const kode = row.dataset.kode;

    if (!kode) {
      Swal.fire("Error!", "Kode barang tidak ditemukan.", "error");
      select.value = prevStatus;
      return;
    }

    Swal.fire({
      title: "Ubah Status?",
      text: `Ubah status menjadi "${newStatus}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    }).then(result => {
      if (!result.isConfirmed) {
        select.value = prevStatus;
        return;
      }

      fetch("/admin/api/penemuan/update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kode, status: newStatus })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          Swal.fire("Gagal!", data.message || "Tidak dapat memperbarui status.", "error");
          select.value = prevStatus;
          return;
        }

        Swal.fire({
          icon: "success",
          title: "Status Diubah!",
          timer: 1500,
          showConfirmButton: false
        });

        select.dataset.prev = newStatus;

        row.classList.add("status-updated");
        setTimeout(() => row.classList.remove("status-updated"), 800);
      });
    });
  });



  // =========================
  // FITUR DELETE / VERIFY / ARCHIVE
  // =========================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row.dataset.kode;

    if (!kode) {
      Swal.fire("Error!", "Kode tidak ditemukan!", "error");
      return;
    }

    // === DELETE ===
    if (btn.classList.contains("btn-delete")) {

      Swal.fire({
        title: "Hapus Laporan?",
        text: "Data yang dihapus tidak dapat dikembalikan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: "Batal"
      }).then(result => {
        if (!result.isConfirmed) return;

        fetch("/admin/penemuan/hapus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal!", data.message, "error");
            return;
          }

          Swal.fire({
            icon: "success",
            title: "Berhasil Dihapus!",
            timer: 1500,
            showConfirmButton: false
          });

          row.remove();
        });
      });

      return;
    }


// === VERIFIKASI ===
if (btn.classList.contains("btn-verify")) {

  const row = btn.closest("tr");
  const kode = btn.dataset.kode;

  Swal.fire({
    title: "Verifikasi Barang?",
    text: `Barang dengan kode ${kode} akan diverifikasi.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Verifikasi",
    cancelButtonText: "Batal",
  }).then(result => {

    if (!result.isConfirmed) return;

    fetch("/admin/api/penemuan/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode })
    })
    .then(res => res.json())
    .then(data => {

      if (!data.success) {
        Swal.fire("Error!", data.message, "error");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil Diverifikasi!",
        timer: 1500,
        showConfirmButton: false
      });

      // === UBAH STATUS DI DROPDOWN ===
      const select = row.querySelector(".status-select");
      if (select) select.value = "Verifikasi";
      // sesuaikan dengan opsi HTML

      // === Tambahkan efek visual ===
      row.classList.add("verified");
    });
  });

  return;
}

    // === ARCHIVE ===
    if (btn.classList.contains("btn-archive")) {

      Swal.fire({
        title: "Arsipkan Data?",
        text: `Data ${kode} akan dipindahkan ke arsip.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Arsipkan",
        cancelButtonText: "Batal",
      }).then(result => {

        if (!result.isConfirmed) return;

        fetch("/admin/api/penemuan/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode })
        })
        .then(res => res.json())
        .then(data => {

          if (!data.success) {
            Swal.fire("Error!", data.message, "error");
            return;
          }

          Swal.fire({
            icon: "success",
            title: "Diarsipkan!",
            timer: 1500,
            showConfirmButton: false
          });

          row.remove();
        });
      });

      return;
    }

  });



  // =========================
  // FITUR SEARCH
  // =========================
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const key = searchInput.value.toLowerCase();
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(key) ? "" : "none";
      });
    });
  }

});
