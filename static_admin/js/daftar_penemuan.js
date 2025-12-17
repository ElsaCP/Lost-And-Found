document.addEventListener("DOMContentLoaded", function () {

  const rows = document.querySelectorAll("#dataTable tbody tr");
  const searchInput = document.getElementById("searchInput");
  const filterBulan = document.getElementById("filterBulan");

  document.querySelectorAll(".status-select").forEach(sel => {
    sel.dataset.prev = sel.value;
  });

  document.addEventListener("change", function (e) {
    if (!e.target.matches(".status-select")) return;

    const select = e.target;
    const newStatus = select.value;
    const prevStatus = select.dataset.prev;
    const row = select.closest("tr");
    const kode = row.dataset.kode;

    if (!kode) {
      Swal.fire("Error!", "Kode barang tidak ditemukan.", "error");
      select.value = prevStatus;
      return;
    }

    Swal.fire({
      title: "Ubah Status?",
      text: `Ubah status menjadi "${newStatus}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    }).then(result => {
      if (!result.isConfirmed) {
        select.value = prevStatus;
        return;
      }

      fetch("/admin/api/penemuan/update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode, status: newStatus })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          Swal.fire("Gagal!", data.message || "Tidak dapat memperbarui status.", "error");
          select.value = prevStatus;
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
          title: "Status Diubah!",
          timer: 1500,
          showConfirmButton: false
        });

        select.dataset.prev = newStatus;
        row.classList.add("status-updated");
        setTimeout(() => row.classList.remove("status-updated"), 800);
      });
    });
  });

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row.dataset.kode;
    if (!kode) return;

    if (btn.classList.contains("btn-delete")) {
      Swal.fire({
        title: "Hapus Laporan?",
        text: "Data yang dihapus tidak dapat dikembalikan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: "Batal"
      }).then(result => {
        if (!result.isConfirmed) return;
        fetch("/admin/penemuan/hapus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            Swal.fire("Gagal!", data.message, "error");
            return;
          }
          Swal.fire({ icon: "success", title: "Berhasil Dihapus!", timer: 1500, showConfirmButton: false });
          row.remove();
        });
      });
      return;
    }

if (btn.classList.contains("btn-verify")) {

  const statusSelect = row.querySelector(".status-select");
  const currentStatus = statusSelect ? statusSelect.value : "";

  if (currentStatus === "Verifikasi") {
    Swal.fire({
      icon: "info",
      title: "Sudah Diverifikasi",
      text: `Barang dengan kode ${kode} memang sudah diverifikasi sebelumnya.`,
      confirmButtonText: "Oke",
    });
    return;
  }

  Swal.fire({
    title: "Verifikasi Barang?",
    text: `Barang dengan kode ${kode} akan diverifikasi.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Verifikasi",
    cancelButtonText: "Batal",
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch("/admin/api/penemuan/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        Swal.fire("Error!", data.message, "error");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil Diverifikasi!",
        timer: 1500,
        showConfirmButton: false
      });

      const select = row.querySelector(".status-select");
      if (select) select.value = "Verifikasi";

      row.classList.add("verified");
    });
  });

  return;
}
  });

  if (searchInput && filterBulan && rows.length) {

    // setup 3 bulan terakhir
    const bulanNama = ["Januari","Februari","Maret","April","Mei","Juni",
                       "Juli","Agustus","September","Oktober","November","Desember"];
    const today = new Date();
    const bulanList = [];
    for (let i=0; i<3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth()-i, 1);
      bulanList.push({
        key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
        label: `${bulanNama[d.getMonth()]} ${d.getFullYear()}`
      });
    }

    filterBulan.innerHTML = `<option value="all">Semua Data</option>`;
    bulanList.forEach(b => {
      filterBulan.insertAdjacentHTML("beforeend", `<option value="${b.key}">${b.label}</option>`);
    });

    function applyFilter() {
      const keyword = searchInput.value.toLowerCase();
      const selectedMonth = filterBulan.value;

      rows.forEach(row => {
        const tanggalStr = row.dataset.tanggal;
        if (!tanggalStr) return;

        const cleanTanggal = tanggalStr.split(" ")[0];
        const parts = cleanTanggal.split("-");
        const tgl = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        const key = `${tgl.getFullYear()}-${String(tgl.getMonth()+1).padStart(2,"0")}`;

        const cocokBulan = selectedMonth === "all" ? bulanList.some(b => b.key === key) : key === selectedMonth;
        const cocokSearch = row.textContent.toLowerCase().includes(keyword);
        row.style.display = (cocokBulan && cocokSearch) ? "" : "none";
      });
    }

    searchInput.addEventListener("keyup", applyFilter);
    filterBulan.addEventListener("change", applyFilter);

    applyFilter();
  }

});
