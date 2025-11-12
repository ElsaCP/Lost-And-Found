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

    if (btn.classList.contains("btn-view")) {
      window.location.href = `/admin/kehilangan/detail?kode=${kode}`;
    } else if (btn.classList.contains("btn-edit")) {
      window.location.href = `/admin/kehilangan/edit?kode=${kode}`;
    } else if (btn.classList.contains("btn-delete")) {
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
          row.remove();
          Swal.fire({
            icon: "success",
            title: "Dihapus!",
            text: "Data laporan berhasil dihapus.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    } else if (btn.classList.contains("btn-archive")) {
      Swal.fire({
        title: "Arsipkan Laporan?",
        text: `Apakah kamu yakin ingin memindahkan laporan ${kode} ke arsip?`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#17a2b8",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, arsipkan",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/admin/arsip";
        }
      });
    }
  });

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
});
