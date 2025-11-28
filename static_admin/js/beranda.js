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
  // 🔄 AUTO UPDATE STATUS ON CHANGE
  // ===============================
  document.querySelectorAll("select.status-select").forEach(select => {
    select.addEventListener("change", async function () {
      const newStatus = this.value;
      const jenisLaporan = this.dataset.jenis?.toLowerCase();
      let apiUrl = '';
      let payload = {};

      if (jenisLaporan === 'kehilangan') {
        apiUrl = '/admin/api/kehilangan/update_status';
        payload = { kode: this.dataset.id, status: newStatus };
      } else if (jenisLaporan === 'penemuan') {
        apiUrl = '/admin/api/penemuan/update_status';
        payload = { kode: this.dataset.id, status: newStatus };
      } else if (jenisLaporan === 'klaim') {
        apiUrl = '/admin/penemuan/klaim/update_status';
        payload = { kode_laporan: this.dataset.id, status: newStatus };
      } else {
        return Swal.fire('Tidak bisa update status!', '', 'info');
      }

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Status Diperbarui!",
            timer: 1200,
            showConfirmButton: false
          });
        } else {
          Swal.fire("Error!", result.message || "Terjadi masalah server.", "error");
        }
      } catch (err) {
        Swal.fire("Error!", "Terjadi masalah server.", "error");
      }
    });
  });

  // ===============================
  // 🎛 AKSI TOMBOL LAIN (VIEW, EDIT, DELETE)
  // ===============================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const jenis = btn.dataset.jenis?.toLowerCase();

    if (btn.classList.contains("btn-view")) {
      const kode = btn.dataset.kode;
      if (!kode) return;

      if (jenis === "kehilangan") {
        window.location.href = `/admin/kehilangan/detail?kode=${kode}&from=beranda`;
      } else if (jenis === "penemuan") {
        window.location.href = `/admin/penemuan/detail?kode=${kode}&from=beranda`;
      } else if (jenis === "klaim") {
        window.location.href = `/admin/penemuan/klaim/detail/${kode}?from=beranda`;
      }
    }

    if (btn.classList.contains("btn-edit")) {
      const kode = btn.dataset.kode;
      if (!kode) return;

      if (jenis === "kehilangan") {
        window.location.href = `/admin/kehilangan/edit?kode=${kode}&from=beranda`;
      } else if (jenis === "penemuan") {
        window.location.href = `/admin/penemuan/edit?kode=${kode}&from=beranda`;
      } else if (jenis === "klaim") {
        Swal.fire("Laporan klaim tidak bisa diedit!", "", "info");
      }
    }

    if (btn.classList.contains("btn-delete")) {
      const kode = btn.dataset.kode;
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
    }
  });

});
