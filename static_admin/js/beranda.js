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
        payload = { kode_laporan: kode, status: newStatus, catatan_admin: "" };
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
  // 🎛 TOMBOL VIEW / EDIT / DELETE / VERIFY / KLAIM
  // =============================
  document.addEventListener("click", async function (e) {
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

    // 🔹 Kirim semua ke /admin/beranda/hapus
    fetch("/admin/beranda/hapus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode, jenis })  // pastikan jenis ada
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
        Swal.fire("Gagal!", d.message || "Terjadi kesalahan saat menghapus.", "error");
      }
    })
    .catch(err => {
      Swal.fire("Error!", "Server tidak merespon.", "error");
    });
  });
  return;
}

// ==== VERIFY ====
if (btn.classList.contains("btn-verify")) {
  Swal.fire({
    title: "Verifikasi Laporan?",
    text: `Apakah kamu yakin ingin memverifikasi laporan ${kode}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, verifikasi",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    let apiUrl = "";
    let payload = {};

    if (jenis === "kehilangan") {
      apiUrl = "/admin/api/kehilangan/update_status";
      payload = { kode, status: "Verifikasi" };
    } else if (jenis === "penemuan") {
      apiUrl = "/admin/api/penemuan/update_status";
      payload = { kode, status: "Verifikasi" };
    } else if (jenis === "klaim") {
      // 🔹 FIX: selalu kirim catatan_admin walau kosong
      apiUrl = "/admin/penemuan/klaim/update_status";
      payload = { kode_laporan: kode, status: "Verifikasi", catatan_admin: "" };
    }

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: `Laporan ${kode} berhasil diverifikasi.`,
          timer: 1500,
          showConfirmButton: false
        });

        // Update dropdown select agar bisa dipilih lagi
        const selectElem = row.querySelector(".status-select");
        if (selectElem) {
          selectElem.value = "Verifikasi";
          selectElem.dataset.prevIndex = selectElem.selectedIndex;
        }

      } else {
        Swal.fire("Gagal!", "Terjadi kesalahan saat verifikasi.", "error");
      }

    } catch (err) {
      Swal.fire("Error!", "Server tidak merespon.", "error");
    }
  });
  return;
}

    // ==== KLAIM BARANG ====
    if (btn.classList.contains("btn-klaim")) {
      window.location.href = `/admin/klaim/baru?kode_barang=${kode}&from=beranda`;
      return;
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
