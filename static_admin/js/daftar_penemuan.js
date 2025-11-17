document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // FITUR UBAH STATUS
  // =========================
  document.addEventListener("change", function (e) {
    if (!e.target.matches(".status-select")) return;

    const select = e.target;
    const newStatus = select.value;
    const prevStatus = select.dataset.prev;
    const row = select.closest("tr");
    const kode = row.dataset.kode;

    Swal.fire({
      title: "Ubah Status?",
      text: `Ubah status menjadi "${newStatus}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    }).then(result => {
      if (result.isConfirmed) {

        // === KIRIM UPDATE KE BACKEND
        fetch("/admin/api/penemuan/update_status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            kode: kode,
            status: newStatus
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Status Diubah!",
                timer: 1500,
                showConfirmButton: false
              });
              select.dataset.prev = newStatus;
              row.classList.add("status-updated");
              setTimeout(() => row.classList.remove("status-updated"), 1000);
            }
          });
      } else {
        select.value = prevStatus; // batal → balik
      }
    });
  });

  // =========================
  // FITUR TOMBOL DETAIL / EDIT / DELETE
  // =========================
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const row = btn.closest("tr");
    const kode = row.dataset.kode;

    // === DETAIL ===
    if (btn.classList.contains("btn-detail")) {
      window.location.href = `/admin/penemuan/detail?kode=${kode}`;
    }

    // === EDIT ===
    else if (btn.classList.contains("btn-edit")) {
      window.location.href = `/admin/penemuan/edit?kode=${kode}`;
    }

    // === DELETE ===
    else if (btn.classList.contains("btn-delete")) {

      Swal.fire({
        title: "Hapus Data?",
        text: `Data ${kode} akan dihapus permanen`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: "Batal",
        confirmButtonColor: "#d33",
      }).then(result => {
        if (result.isConfirmed) {

          fetch("/admin/api/penemuan/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kode })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                Swal.fire({
                  icon: "success",
                  title: "Berhasil Dihapus!",
                  timer: 1500,
                  showConfirmButton: false
                });
                row.remove();
              }
            });
        }
      });
    }

  });

  // =========================
  // FITUR PENCARIAN
  // =========================
  const searchInput = document.getElementById("searchInput");
  const rows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const key = searchInput.value.toLowerCase();
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(key)
          ? ""
          : "none";
      });
    });
  }

});
