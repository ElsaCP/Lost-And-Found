// ===============================
// === beranda.js (versi baru) ===
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // ==========================================================
  // === 🔍 FITUR PENCARIAN DI BERANDA ========================
  // ==========================================================
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const filter = this.value.toUpperCase();
      const rows = document.querySelector("#dataTable tbody").rows;

      for (let i = 0; i < rows.length; i++) {
        let match = false;
        for (let j = 0; j < rows[i].cells.length - 1; j++) {
          if (rows[i].cells[j].textContent.toUpperCase().includes(filter)) {
            match = true;
            break;
          }
        }
        rows[i].style.display = match ? "" : "none";
      }
    });
  }

  // ==========================================================
  // === 📝 FITUR UBAH STATUS DENGAN SWEETALERT2 ==============
  // ==========================================================
  document.querySelectorAll("#dataTable select").forEach(select => {
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

  // ==========================================================
  // === ⚙️ TOMBOL AKSI NOTIFIKASI DI BERANDA ================
  // ==========================================================
  document.addEventListener("click", function (e) {
    const target = e.target.closest("button");
    if (!target) return;

    const row = target.closest("tr");
    const kode = row?.querySelector("td:first-child")?.textContent.trim();
    // Pastikan kolom jenis berada di kolom ke-3 (ubah angka kalau posisinya beda)
    const jenis = row?.querySelector("td:nth-child(3)")?.textContent.trim().toLowerCase(); 
    if (!kode || !jenis) return;

    // === 🔍 Tombol DETAIL ===
    if (target.classList.contains("btn-detail") || target.classList.contains("btn-view")) {
      if (jenis.includes("kehilangan")) {
        window.location.href = `detail_kehilangan.html?kode=${kode}&from=beranda`;
      } else if (jenis.includes("penemuan")) {
        window.location.href = `detail_penemuan.html?kode=${kode}&from=beranda`;
      }
    }

    // === ✏️ Tombol EDIT ===
    else if (target.classList.contains("btn-edit")) {
      if (jenis.includes("kehilangan")) {
        window.location.href = `edit_kehilangan.html?kode=${kode}&from=beranda`;
      } else if (jenis.includes("penemuan")) {
        window.location.href = `edit_penemuan.html?kode=${kode}&from=beranda`;
      }
    }

    // === 🗑️ Tombol HAPUS ===
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

    // === ✅ Tombol VERIFIKASI ===
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

    // === 📦 Tombol ARSIP ===
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

          // Arahkan ke halaman arsip (bisa disesuaikan kalau nanti dibedakan)
          window.location.href = "arsip.html";
        }
      });
    }
  });
});
