document.addEventListener("DOMContentLoaded", function () {

  /* ===============================
     STATUS SELECT
     =============================== */
  document.querySelectorAll(".status-select").forEach(select => {
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
        text: `Apakah kamu yakin ingin mengubah status ${kode} menjadi "${newStatus}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, ubah",
        cancelButtonText: "Batal"
      }).then(result => {
        if (!result.isConfirmed) {
          this.selectedIndex = prevIndex;
          return;
        }

        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal", "Status tidak berubah", "error");
            this.selectedIndex = prevIndex;
            return;
          }

          this.dataset.prevIndex = this.selectedIndex;

          const rowShouldMove = 
            (jenis === "kehilangan" && ["Selesai","Barang Tidak Ditemukan"].includes(newStatus)) ||
            (jenis === "penemuan" && newStatus === "Selesai") ||
            (jenis === "klaim" && ["Ditolak","Selesai"].includes(newStatus));

          if (rowShouldMove) {
            // Tampilkan Swal sukses
            Swal.fire({
              icon: "success",
              title: "Dipindahkan ke Arsip",
              timer: 1200,
              showConfirmButton: false
            }).then(() => {
              // Hapus row dari tabel beranda
              row.remove();

              // Redirect ke halaman arsip
              window.location.href = "/admin/arsip";
            });
            return;
          }

          // Kalau bukan status yang masuk arsip, tetap tampilkan Swal update status
          Swal.fire({
            icon: "success",
            title: "Status Diperbarui",
            timer: 1200,
            showConfirmButton: false
          });
        });
      });
    });
  });

  /* ===============================
     BUTTON ACTIONS
     =============================== */
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const kode = btn.dataset.kode;
    const jenis = btn.dataset.jenis?.toLowerCase();
    const row = btn.closest("tr");

    /* ==== VIEW ==== */
    if (btn.classList.contains("btn-view")) {
      if (jenis === "kehilangan")
        location.href = `/admin/kehilangan/detail?kode=${kode}&from=beranda`;
      else if (jenis === "penemuan")
        location.href = `/admin/penemuan/detail?kode=${kode}&from=beranda`;
      else
        location.href = `/admin/penemuan/klaim/detail/${kode}?from=beranda`;
      return;
    }

    /* ==== EDIT ==== */
    if (btn.classList.contains("btn-edit")) {
      if (jenis === "klaim") {
        Swal.fire("Info", "Klaim tidak bisa diedit", "info");
        return;
      }
      location.href = `/admin/${jenis}/edit?kode=${kode}&from=beranda`;
      return;
    }

    /* ==== DELETE ==== */
    if (btn.classList.contains("btn-delete")) {
      Swal.fire({
        title: "Hapus Laporan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal"
      }).then(res => {
        if (!res.isConfirmed) return;

        fetch("/admin/beranda/hapus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, jenis })
        })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            row.remove();
            Swal.fire("Dihapus", "Laporan berhasil dihapus", "success");
          }
        });
      });
      return;
    }

    /* ==== VERIFY (FIX SESUAI CONTOH KAMU) ==== */
    if (btn.classList.contains("btn-verify")) {

      const statusSelect = row.querySelector(".status-select");
      const currentStatus = statusSelect ? statusSelect.value : "";

      /* 🔒 SUDAH DIVERIFIKASI */
      if (currentStatus === "Verifikasi") {
        Swal.fire({
          icon: "info",
          title: "Sudah Diverifikasi",
          text: `Laporan ${kode} memang sudah diverifikasi sebelumnya.`,
          confirmButtonText: "Oke"
        });
        return;
      }

      /* ⚠️ KONFIRMASI VERIFIKASI */
      Swal.fire({
        title: "Verifikasi Laporan?",
        text: `Apakah kamu yakin ingin memverifikasi laporan ${kode}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, verifikasi",
        cancelButtonText: "Batal"
      }).then(result => {
        if (!result.isConfirmed) return;

        let apiUrl = "";
        let payload = {};

        if (jenis === "kehilangan" || jenis === "penemuan") {
          apiUrl = `/admin/api/${jenis}/update_status`;
          payload = { kode, status: "Verifikasi" };
        } else {
          apiUrl = "/admin/penemuan/klaim/update_status";
          payload = { kode_laporan: kode, status: "Verifikasi", catatan_admin: "" };
        }

        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal", "Tidak dapat memverifikasi", "error");
            return;
          }

          if (statusSelect) statusSelect.value = "Verifikasi";

          Swal.fire({
            icon: "success",
            title: "Diverifikasi!",
            text: `Status laporan ${kode} berhasil diperbarui.`,
            timer: 1500,
            showConfirmButton: false
          });

          row.classList.add("status-updated");
          setTimeout(() => row.classList.remove("status-updated"), 1200);
        });
      });
    }
  });

  /* ===============================
     SEARCH & FILTER BULAN
     =============================== */
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

      const cleanTanggal = tanggalStr.split(" ")[0];
      const [y, m, d] = cleanTanggal.split("-");

      const key = `${y}-${m}`;
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

/* ===============================
   EXPORT PDF & EXCEL (PER BULAN)
   =============================== */

const btnPdf = document.getElementById("btnExportPdf");
const btnExcel = document.getElementById("btnExportExcel");

function getSelectedMonth() {
  const bulan = document.getElementById("filterBulan").value;
  if (bulan === "all") {
    Swal.fire("Pilih Bulan", "Silakan pilih bulan terlebih dahulu", "warning");
    return null;
  }
  return bulan;
}

if (btnPdf) {
  btnPdf.addEventListener("click", () => {
    const bulan = getSelectedMonth();
    if (!bulan) return;

    window.open(`/admin/export/pdf?bulan=${bulan}`, "_blank");
  });
}

if (btnExcel) {
  btnExcel.addEventListener("click", () => {
    const bulan = getSelectedMonth();
    if (!bulan) return;

    window.location.href = `/admin/export/excel?bulan=${bulan}`;
  });
}