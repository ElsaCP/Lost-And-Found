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
    const kode = row.dataset.kode;     // <-- FIX PENTING

    if (!kode) {
      console.error("❌ ERROR: data-kode tidak ditemukan pada <tr>.");
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

      // ==== JIKA BATAL ====
      if (!result.isConfirmed) {
        select.value = prevStatus;
        return;
      }

      // ==== UPDATE KE SERVER ====
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

          // Simpan sebagai previous
          select.dataset.prev = newStatus;

          // Highlight baris
          row.classList.add("status-updated");
          setTimeout(() => row.classList.remove("status-updated"), 1000);
        })
        .catch(err => {
          console.error(err);
          Swal.fire("Error!", "Terjadi kesalahan server.", "error");
          select.value = prevStatus;
        });

    });
  });

  // =========================
  // FITUR BUTTON DETAIL/EDIT/DELETE/VERIFY/ARCHIVE
  // =========================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row.dataset.kode;

    if (!kode) {
      Swal.fire("Error!", "Kode barang tidak ditemukan.", "error");
      return;
    }

    // === DETAIL ===
    if (btn.classList.contains("btn-detail")) {
      window.location.href = `/admin/penemuan/detail?kode=${kode}`;
    }

    // === EDIT ===
    else if (btn.classList.contains("btn-edit")) {
      window.location.href = `/admin/penemuan/edit?kode=${kode}`;
    }

    // === DELETE ===
    else if (btn.classList.contains("btn-delete")) {

      Swal.fire({
        title: "Hapus Data?",
        text: `Data ${kode} akan dihapus permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: "Batal",
      }).then(result => {

        if (result.isConfirmed) {

          fetch("/admin/api/penemuan/delete", {
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
                title: "Berhasil Dihapus!",
                timer: 1500,
                showConfirmButton: false
              });

              row.remove();
            });
        }

      });
    }

    // === VERIFY ===
    else if (btn.classList.contains("btn-verify")) {

      Swal.fire({
        title: "Verifikasi Barang?",
        text: `Barang dengan kode ${kode} akan diverifikasi.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Verifikasi",
        cancelButtonText: "Batal",
      }).then(result => {

        if (result.isConfirmed) {

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

              row.classList.add("verified");
            });
        }

      });
    }

    // === ARCHIVE ===
    else if (btn.classList.contains("btn-archive")) {

      Swal.fire({
        title: "Arsipkan Data?",
        text: `Data ${kode} akan dipindahkan ke arsip.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Arsipkan",
        cancelButtonText: "Batal",
      }).then(result => {

        if (result.isConfirmed) {

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
        }

      });
    }

  });



  // =========================
  // FITUR PENCARIAN
  // =========================
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const key = searchInput.value.toLowerCase();
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(key)
          ? ""
          : "none";
      });
    });
  }

});
