// ===============================
// === daftar_kehilangan.js =====
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // ===============================
  // === Fitur Ubah Status ===
  // ===============================
  const statusSelects = document.querySelectorAll("#dataTable select");

  statusSelects.forEach(select => {
    select.dataset.prevIndex = select.selectedIndex;

    select.addEventListener("change", function () {
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
        if (!result.isConfirmed) {
          this.selectedIndex = prevIndex;
          return;
        }

        fetch("/admin/api/kehilangan/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, status: newStatus }),
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
            this.selectedIndex = prevIndex;
            return;
          }

          if (newStatus === "Selesai") {
            Swal.fire({
              icon: "success",
              title: "Dipindahkan ke Arsip",
              text: "Laporan telah selesai dan kini ada di arsip.",
              timer: 1200,
              showConfirmButton: false
            }).then(() => {
              window.location.href = "/admin/arsip";
            });
            return;
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
        });
      });
    });
  });

  // ===============================
  // === Tombol Aksi ===
  // ===============================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row?.querySelector("td:first-child")?.textContent.trim();

    if (btn.classList.contains("btn-view")) {
      window.location.href = `/admin/kehilangan/detail?kode=${kode}`;
      return;
    }

    if (btn.classList.contains("btn-edit")) {
      window.location.href = `/admin/kehilangan/edit?kode=${kode}`;
      return;
    }

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
        if (!result.isConfirmed) return;

        fetch("/admin/api/kehilangan/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus.", "error");
            return;
          }

          Swal.fire({
            icon: "success",
            title: "Dihapus!",
            text: `Laporan ${kode} berhasil dihapus.`,
            timer: 1500,
            showConfirmButton: false
          }).then(() => row.remove());
        });
      });
    }

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
        if (!result.isConfirmed) return;

        fetch("/admin/api/kehilangan/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, status: "Verifikasi" })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
            return;
          }

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
        });
      });
    }
  });

  // =====================================================
  // 🗓 FILTER BULAN + SEARCH (GABUNGAN, FIX)
  // =====================================================
  const filterBulan = document.getElementById("filterBulan");
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#dataTable tbody tr");

  if (!filterBulan || !searchInput || !rows.length) return;

  const bulanNama = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const today = new Date();
  const bulanList = [];

  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    bulanList.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${bulanNama[d.getMonth()]} ${d.getFullYear()}`
    });
  }

  filterBulan.innerHTML = `<option value="all">Semua Data</option>`;
  bulanList.forEach(b => {
    filterBulan.insertAdjacentHTML(
      "beforeend",
      `<option value="${b.key}">${b.label}</option>`
    );
  });

  function applyFilter() {
    const keyword = searchInput.value.toLowerCase();
    const selectedMonth = filterBulan.value;

    rows.forEach(row => {
      const tanggalStr = row.dataset.tanggal;
      if (!tanggalStr) return;

      // ambil YYYY-MM-DD saja
      const cleanTanggal = tanggalStr.split(" ")[0]; 
      const parts = cleanTanggal.split("-");

      const tgl = new Date(
        parseInt(parts[0]),      // year
        parseInt(parts[1]) - 1,  // month (0-based)
        parseInt(parts[2])       // day
      );
      const key = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, "0")}`;

      const cocokBulan =
        selectedMonth === "all"
          ? bulanList.some(b => b.key === key)
          : key === selectedMonth;

      const cocokSearch = row.textContent.toLowerCase().includes(keyword);

      row.style.display = (cocokBulan && cocokSearch) ? "" : "none";
    });
  }

  searchInput.addEventListener("keyup", applyFilter);
  filterBulan.addEventListener("change", applyFilter);

  applyFilter();

});
