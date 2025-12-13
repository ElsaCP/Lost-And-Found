document.addEventListener("DOMContentLoaded", function () {

  // =====================================================
  // 🔄 FITUR UBAH STATUS
  // =====================================================
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
            this.selectedIndex = prevIndex;
            Swal.fire("Gagal", "Status tidak berubah", "error");
            return;
          }

          this.dataset.prevIndex = this.selectedIndex;

          if (newStatus === "Selesai") {
            Swal.fire({
              icon: "success",
              title: "Dipindahkan ke Arsip",
              timer: 1200,
              showConfirmButton: false
            }).then(() => location.href = "/admin/arsip");
          }
        });
      });
    });
  });

  // =====================================================
  // 🎛 AKSI BUTTON (VIEW / EDIT / DELETE / VERIFY)
  // =====================================================
  document.addEventListener("click", async function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const kode = btn.dataset.kode;
    const jenis = btn.dataset.jenis?.toLowerCase();
    const row = btn.closest("tr");

    // VIEW
    if (btn.classList.contains("btn-view")) {
      if (jenis === "kehilangan")
        location.href = `/admin/kehilangan/detail?kode=${kode}&from=beranda`;
      else if (jenis === "penemuan")
        location.href = `/admin/penemuan/detail?kode=${kode}&from=beranda`;
      else
        location.href = `/admin/penemuan/klaim/detail/${kode}?from=beranda`;
    }

    // EDIT
    if (btn.classList.contains("btn-edit")) {
      if (jenis === "klaim") {
        Swal.fire("Info", "Klaim tidak bisa diedit", "info");
        return;
      }
      location.href = `/admin/${jenis}/edit?kode=${kode}&from=beranda`;
    }

    // DELETE
    if (btn.classList.contains("btn-delete")) {
      Swal.fire({
        title: "Hapus Laporan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus"
      }).then(res => {
        if (!res.isConfirmed) return;

        fetch("/admin/beranda/hapus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, jenis })
        })
        .then(r => r.json())
        .then(d => {
          if (d.success) row.remove();
        });
      });
    }

    // VERIFY
    if (btn.classList.contains("btn-verify")) {
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
      }).then(() => {
        const sel = row.querySelector(".status-select");
        if (sel) sel.value = "Verifikasi";
      });
    }
  });

  // =====================================================
  // 🗓 FILTER 3 BULAN TERAKHIR + SEARCH (GABUNGAN)
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

