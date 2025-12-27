document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll(".status-select").forEach(select => {
    select.dataset.prev = select.value;

    select.addEventListener("change", function () {
      const newStatus = this.value;
      const prevStatus = this.dataset.prev;
      const kodeLaporan = this.dataset.kode;

      Swal.fire({
        title: "Yakin ubah status?",
        text: `Status akan diubah menjadi: ${newStatus}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, ubah!",
        cancelButtonText: "Batal",
      }).then(result => {
        if (!result.isConfirmed) {
          this.value = prevStatus;
          return;
        }

        fetch("/admin/penemuan/klaim/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode_laporan: kodeLaporan,
            status: newStatus
          })
        })
        .then(res => res.json())
        .then(() => {

          if (newStatus === "Selesai" || newStatus === "Ditolak") {
            Swal.fire({
              icon: "success",
              title: "Dipindahkan ke Arsip",
              timer: 1200,
              showConfirmButton: false
            }).then(() => window.location.href = "/admin/arsip");
            return;
          }

          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Status klaim diperbarui",
            timer: 1200,
            showConfirmButton: false
          });

          this.dataset.prev = newStatus;
        });
      });
    });
  });

const filterBulan = document.getElementById("filterBulan");
const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll("#dataTable tbody tr");

if (!filterBulan || !searchInput) return;

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
    const bulanRow = row.dataset.bulan; 
    const cocokBulan =
      selectedMonth === "all" || bulanRow === selectedMonth;

    const cocokSearch =
      row.textContent.toLowerCase().includes(keyword);

    row.style.display = (cocokBulan && cocokSearch) ? "" : "none";
  });
}

searchInput.addEventListener("keyup", applyFilter);
filterBulan.addEventListener("change", applyFilter);

applyFilter();
});

function openSurat(url) {
  window.open(url, "_blank");
}



