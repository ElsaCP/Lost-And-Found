// ===============================
// === daftar_kehilangan.js =====
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // === Fitur ubah status dengan SweetAlert2 ===
  const statusSelects = document.querySelectorAll("#dataTable select");
  statusSelects.forEach(select => {
    select.dataset.prevIndex = select.selectedIndex;

    select.addEventListener("change", function (e) {
      const selectedStatus = this.value;
      const prevIndex = this.dataset.prevIndex;
      const row = this.closest("tr");
      const kode = row.querySelector("td:first-child").textContent.trim();

      Swal.fire({
        title: "Ubah Status?",
        text: `Apakah kamu yakin ingin mengubah status laporan ${kode} menjadi "${selectedStatus}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, ubah!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          this.dataset.prevIndex = this.selectedIndex;
          row.classList.add("status-updated");
          setTimeout(() => row.classList.remove("status-updated"), 1000);

          Swal.fire({
            icon: "success",
            title: "Status Diperbarui!",
            text: `Status berhasil diubah menjadi "${selectedStatus}".`,
            timer: 2000,
            showConfirmButton: false,
          });

          // 🔄 Kirim ke Flask API
          fetch("/admin/api/kehilangan/update_status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kode, status: selectedStatus }),
          });

        } else {
          this.selectedIndex = prevIndex;
          e.preventDefault();
        }
      });
    });
  });

  // === Tombol Aksi ===
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row?.querySelector("td:first-child")?.textContent.trim();

    // === VIEW ===
    if (btn.classList.contains("btn-view")) {
      window.location.href = `/admin/kehilangan/detail?kode=${kode}`;
      return;
    }

    // === EDIT ===
    if (btn.classList.contains("btn-edit")) {
      window.location.href = `/admin/kehilangan/edit?kode=${kode}`;
      return;
    }

    // === DELETE ===
    if (btn.classList.contains("btn-delete")) {
      const id = btn.dataset.id;

      Swal.fire({
        title: "Hapus Laporan?",
        text: `Apakah kamu yakin ingin menghapus laporan ${kode}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {

          fetch("/admin/api/kehilangan/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
          })
          .then(res => res.json())
          .then(data => {

            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Dihapus!",
                text: `Laporan ${kode} berhasil dihapus.`,
                timer: 1500,
                showConfirmButton: false
              }).then(() => {
                window.location.reload();
              });

            } else {
              Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus.", "error");
            }

          });

        }
      });
      return;
    }

    // === VERIFIKASI ===
    if (btn.classList.contains("btn-verify")) {

      Swal.fire({
        title: "Verifikasi Laporan?",
        text: `Ubah status laporan ${kode} menjadi 'Verifikasi'?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, verifikasi!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {

          fetch("/admin/api/kehilangan/update_status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kode: kode,
              status: "Verifikasi"
            })
          })
          .then(res => res.json())
          .then(data => {

            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Diverifikasi!",
                text: `Status laporan ${kode} berhasil diubah menjadi Verifikasi.`,
                timer: 1500,
                showConfirmButton: false
              });

              // update dropdown status
              const statusSelect = row.querySelector(".status-select");
              if (statusSelect) {
                statusSelect.value = "Verifikasi";
              }

              row.classList.add("status-updated");
              setTimeout(() => row.classList.remove("status-updated"), 1200);

            } else {
              Swal.fire("Gagal!", "Terjadi kesalahan saat memperbarui status.", "error");
            }

          });

        }
      });
      return;
    }

  }); // END tombol aksi

  // === Fitur Pencarian ===
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }

}); // END DOMContentLoaded
