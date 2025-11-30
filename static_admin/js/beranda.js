document.addEventListener("DOMContentLoaded", function () {

  // =============================
  // 🔄 FITUR UBAH STATUS (FULL)
  // =============================
  const selects = document.querySelectorAll(".status-select");
  selects.forEach(select => {
    select.dataset.prevIndex = select.selectedIndex;

    select.addEventListener("change", function () {
      const newStatus = this.value;
      const prevIndex = this.dataset.prevIndex;

      const row = this.closest("tr");
      const kode = this.dataset.kode;
      const jenis = this.dataset.jenis?.toLowerCase();

      let apiUrl = "";
      let payload = {};

      if (jenis === "kehilangan") {
        apiUrl = "/admin/api/kehilangan/update_status";
        payload = { kode, status: newStatus };
      } else if (jenis === "penemuan") {
        apiUrl = "/admin/api/penemuan/update_status";
        payload = { kode, status: newStatus };
      } else if (jenis === "klaim") {
        apiUrl = "/admin/penemuan/klaim/update_status";
        payload = { kode_laporan: kode, status: newStatus };
      }

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
        if (!result.isConfirmed) {
          this.selectedIndex = prevIndex;
          return;
        }

        // KIRIM UPDATE KE SERVER
        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {

          if (!data.success) {
            Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
            this.selectedIndex = prevIndex;
            return;
          }

          // 🔥 JIKA STATUS SELESAI → PINDAH ARSIP
          if (newStatus === "Selesai") {
            Swal.fire({
              icon: "success",
              title: "Dipindahkan ke Arsip",
              text: "Laporan ini telah selesai dan kini berada di arsip.",
              timer: 1300,
              showConfirmButton: false
            }).then(() => {
              window.location.href = "/admin/arsip";
            });
            return;
          }

          // 🔥 NOTIFIKASI BERHASIL (NON-SELESAI)
          Swal.fire({
            icon: "success",
            title: "Status Diperbarui!",
            text: `Status berhasil diubah menjadi "${newStatus}".`,
            timer: 1500,
            showConfirmButton: false
          });

          // Simpan perubahan untuk next revert
          this.dataset.prevIndex = this.selectedIndex;

          // efek highlight row
          row.classList.add("status-updated");
          setTimeout(() => row.classList.remove("status-updated"), 1000);

        })
        .catch(err => {
          Swal.fire("Error!", "Terjadi kesalahan server.", "error");
          this.selectedIndex = prevIndex;
        });

      });
    });
  });


  // =============================
  // 🎛 TOMBOL VIEW / EDIT / DELETE
  // =============================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const kode = btn.dataset.kode;
    const jenis = btn.dataset.jenis?.toLowerCase();
    const row = btn.closest("tr");

    // ==== VIEW ====
    if (btn.classList.contains("btn-view")) {
      if (jenis === "kehilangan")
        window.location.href = `/admin/kehilangan/detail?kode=${kode}&from=beranda`;
      else if (jenis === "penemuan")
        window.location.href = `/admin/penemuan/detail?kode=${kode}&from=beranda`;
      else if (jenis === "klaim")
        window.location.href = `/admin/penemuan/klaim/detail/${kode}?from=beranda`;
      return;
    }

    // ==== TOMBOL TAMBAH KLAIM (FINAL) ====
    if (btn.classList.contains("btn-klaim")) {
      const kode = btn.dataset.kode;
      window.location.href = `/admin/klaim/baru?kode_barang=${kode}&from=beranda`;
      return;
    }

    // ==== EDIT ====
    if (btn.classList.contains("btn-edit")) {
      if (jenis === "kehilangan")
        window.location.href = `/admin/kehilangan/edit?kode=${kode}&from=beranda`;
      else if (jenis === "penemuan")
        window.location.href = `/admin/penemuan/edit?kode=${kode}&from=beranda`;
      else if (jenis === "klaim")
        Swal.fire("Tidak bisa mengedit laporan klaim.", "", "info");
      return;
    }

    // ==== DELETE ====
    if (btn.classList.contains("btn-delete")) {

      Swal.fire({
        title: "Hapus Laporan?",
        text: `Apakah kamu yakin ingin menghapus laporan ${kode}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal"
      }).then(res => {
        if (!res.isConfirmed) return;

        let deleteApi = "";

        if (jenis === "kehilangan") deleteApi = "/admin/api/kehilangan/delete";
        else if (jenis === "penemuan") deleteApi = "/admin/api/penemuan/delete";
        else if (jenis === "klaim") deleteApi = "/admin/penemuan/klaim/delete";

        fetch(deleteApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode })
        })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            Swal.fire({
              icon: "success",
              title: "Dihapus!",
              text: `Laporan ${kode} berhasil dihapus.`,
              timer: 1500,
              showConfirmButton: false
            });
            row.remove();
          } else {
            Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus.", "error");
          }
        });
      });

    }

  });


  // =============================
  // 🔍 FITUR PENCARIAN
  // =============================
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      tableRows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(keyword) ? "" : "none";
      });
    });
  }

});
