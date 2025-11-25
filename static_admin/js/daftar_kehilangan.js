// ===============================
// === daftar_kehilangan.js =====
// ===============================

document.addEventListener("DOMContentLoaded", function () {

// === Fitur Ubah Status ===
const statusSelects = document.querySelectorAll("#dataTable select");
statusSelects.forEach(select => {
  select.dataset.prevIndex = select.selectedIndex;

  select.addEventListener("change", function (e) {
    const newStatus = this.value;
    const prevIndex = this.dataset.prevIndex;
    const row = this.closest("tr");
    const kode = row.querySelector("td:first-child").textContent.trim();

    Swal.fire({
      title: "Ubah Status?",
      text: `Apakah kamu yakin ingin mengubah status laporan ${kode} menjadi "${newStatus}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, ubah!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {

        fetch("/admin/api/kehilangan/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, status: newStatus }),
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {

            // 🔥 Jika statusnya Selesai, langsung ke arsip
            if (newStatus === "Selesai") {
              Swal.fire({
                icon: "success",
                title: "Dipindahkan ke Arsip",
                text: "Laporan telah selesai dan kini ada di arsip.",
                timer: 1200,
                showConfirmButton: false
              }).then(() => {
                window.location.href = "/admin/arsip";   // redirect ke halaman arsip
              });
              return; // hentikan proses
            }

            Swal.fire({
              icon: "success",
              title: "Status Diperbarui!",
              text: `Status berhasil diubah menjadi "${newStatus}".`,
              timer: 1500,
              showConfirmButton: false,
            });

            this.dataset.prevIndex = this.selectedIndex;
            row.classList.add("status-updated");
            setTimeout(() => row.classList.remove("status-updated"), 1000);

          } else {
            Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
            this.selectedIndex = prevIndex;
          }
        });

      } else {
        this.selectedIndex = prevIndex;
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

    // === DELETE (PERBAIKAN UTAMA ADA DI SINI) ===
    if (btn.classList.contains("btn-delete")) {

      const kode = btn.dataset.kode;

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

          // 🔥 FIX: hapus pakai kode, bukan id
          fetch("/admin/api/kehilangan/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kode })
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
                // hilangkan baris tanpa reload
                row.remove();
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
            body: JSON.stringify({ kode: kode, status: "Verifikasi" })
          })
          .then(res => res.json())
          .then(data => {

            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Diverifikasi!",
                text: `Status laporan ${kode} berhasil diubah.`,
                timer: 1500,
                showConfirmButton: false
              });

              const statusSelect = row.querySelector(".status-select");
              if (statusSelect) statusSelect.value = "Verifikasi";

              row.classList.add("status-updated");
              setTimeout(() => row.classList.remove("status-updated"), 1200);

            } else {
              Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
            }

          });

        }
      });
    }

  });

  // === Pencarian ===
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
