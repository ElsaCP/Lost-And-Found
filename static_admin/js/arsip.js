document.addEventListener("DOMContentLoaded", () => {
  // ==== DUMMY DATA ARSIP ====
  const dataArsip = [
    { kode: "LF-A001", namaBarang: "Dompet Kulit Coklat", jenis: "Kehilangan", status: "Arsip" },
    { kode: "LF-A002", namaBarang: "Jam Tangan Hitam", jenis: "Penemuan", status: "Arsip" },
    { kode: "LF-A003", namaBarang: "Topi Hitam", jenis: "Penemuan", status: "Arsip" }
  ];

  // ==== RENDER TABEL DINAMIS ====
  const tbody = document.querySelector(".arsip-table tbody");
  if (tbody) {
    tbody.innerHTML = dataArsip.map(item => `
      <tr>
        <td>${item.kode}</td>
        <td>${item.namaBarang}</td>
        <td>${item.jenis}</td>
        <td>${item.status}</td>
        <td class="aksi">
          <button class="btn-view" data-kode="${item.kode}" title="Lihat Detail">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn-restore" data-kode="${item.kode}" title="Pulihkan Laporan">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  // ==== EVENT: TOMBOL LIHAT DETAIL ====
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.dataset.kode;
      if (kode) {
      window.location.href = `/admin/arsip/detail?kode=${encodeURIComponent(kode)}`;
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "Kode laporan tidak ditemukan.",
          confirmButtonColor: "#d33"
        });
      }
    });
  });

  // ==== EVENT: TOMBOL PULIHKAN ====
  document.querySelectorAll(".btn-restore").forEach(btn => {
    btn.addEventListener("click", () => {
      const kode = btn.dataset.kode;
      const item = dataArsip.find(i => i.kode === kode);
      if (!item) return;

      Swal.fire({
        icon: "question",
        title: "Pulihkan laporan?",
        text: `Apakah kamu yakin ingin memulihkan laporan ${kode}?`,
        showCancelButton: true,
        confirmButtonText: "Ya, pulihkan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: `Laporan ${kode} berhasil dipulihkan ke daftar ${item.jenis.toLowerCase()}.`,
            timer: 2200,
            showConfirmButton: false,
            timerProgressBar: true,
          });

          setTimeout(() => {
            if (item.jenis.toLowerCase() === "penemuan") {
              window.location.href = "{{ url_for('admin_bp.daftar_penemuan') }}";
            } else {
              window.location.href = "{{ url_for('admin_bp.daftar_kehilangan') }}";
            }
          }, 2200);
        }
      });
    });
  });

  // ==== FITUR PENCARIAN ====
  const searchInput = document.querySelector(".search-bar input"); // ambil input di dalam search-bar
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const keyword = this.value.toLowerCase();
      document.querySelectorAll(".arsip-table tbody tr").forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }
});
