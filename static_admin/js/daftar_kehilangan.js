// ===============================
// === daftar_kehilangan.js =====
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname;

  // === Fitur ubah status dengan SweetAlert2 ===
  if (currentPage.includes("daftar_kehilangan")) {
    const statusSelects = document.querySelectorAll("#dataTable select");
    statusSelects.forEach(select => {
      select.dataset.prevIndex = select.selectedIndex;

      select.addEventListener("change", function (e) {
        const selectedStatus = this.value;
        const prevIndex = this.dataset.prevIndex;
        const row = this.closest("tr");

        Swal.fire({
          title: "Ubah Status?",
          text: `Apakah kamu yakin ingin mengubah status menjadi "${selectedStatus}"?`,
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
          } else {
            this.selectedIndex = prevIndex;
            e.preventDefault();
          }
        });
      });
    });
  }

  // === Delegasi tombol kehilangan ===
  document.addEventListener("click", function (e) {
    const target = e.target.closest("button");
    if (!target) return;

    const row = target.closest("tr");
    const kode = row?.querySelector("td:first-child")?.textContent.trim();
    if (!kode) return;

    // === Tombol DETAIL ===
    if (target.classList.contains("btn-view") || target.classList.contains("btn-detail")) {
      Swal.fire({
        title: "Membuka Detail...",
        text: `Menampilkan laporan dengan kode ${kode}`,
        timer: 800,
        showConfirmButton: false,
        didClose: () => {
          // arahkan ke route Flask
          window.location.href = `/admin/kehilangan/detail?kode=${encodeURIComponent(kode)}`;
        }
      });
    }

    // === Tombol EDIT ===
    else if (target.classList.contains("btn-edit")) {
      window.location.href = `/admin/kehilangan/edit?kode=${encodeURIComponent(kode)}`;
    }

    // === Tombol HAPUS ===
    else if (target.classList.contains("btn-delete")) {
      Swal.fire({
        title: "Hapus Laporan?",
        text: "Apakah kamu yakin ingin menghapus laporan ini?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
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
    }

    // === Tombol VERIFIKASI ===
    else if (target.classList.contains("btn-verify")) {
      const select = row.querySelector("select");
      Swal.fire({
        title: "Verifikasi Laporan",
        text: "Apakah kamu yakin ingin memverifikasi laporan ini?",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, verifikasi",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed && select) {
          select.value = "Verifikasi";
          select.dataset.prevIndex = select.selectedIndex;

          row.classList.add("status-updated");
          setTimeout(() => row.classList.remove("status-updated"), 1000);

          Swal.fire({
            icon: "success",
            title: "Berhasil Diverifikasi!",
            text: "Status laporan telah diperbarui menjadi 'Verifikasi'.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    }

    // === Tombol ARSIP ===
    else if (target.classList.contains("btn-archive")) {
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
          Swal.fire({
            icon: "success",
            title: "Diarsipkan!",
            text: `Laporan ${kode} berhasil dipindahkan ke arsip.`,
            timer: 2000,
            showConfirmButton: false,
          });
          window.location.href = "/admin/arsip";
        }
      });
    }
  });

  // === FITUR PENCARIAN ===
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
