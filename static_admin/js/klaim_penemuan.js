document.addEventListener("DOMContentLoaded", function () {

  // ============================
  // === FITUR UBAH STATUS ======
  // ============================
  const selects = document.querySelectorAll(".status-select");

  selects.forEach(select => {
    // simpan status sebelum diubah
    select.dataset.prev = select.value;

    select.addEventListener("change", function () {
      const newStatus = this.value;
      const prevStatus = this.dataset.prev;
      const kodeLaporan = this.dataset.kode;  // FIX: ini KODE LAPORAN

      Swal.fire({
        title: "Yakin ubah status?",
        text: `Status akan diubah menjadi: ${newStatus}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, ubah!",
        cancelButtonText: "Batal",
      }).then(result => {

        if (result.isConfirmed) {
          // Kirim perubahan ke backend
          fetch("/admin/penemuan/klaim/update_status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kode_laporan: kodeLaporan,   // FIX
              status: newStatus            // FIX
            })
          })
          .then(res => res.json())
          .then(data => {

            if (newStatus === "Selesai") {
              Swal.fire({
                icon: "success",
                title: "Dipindahkan ke Arsip",
                text: "Klaim telah selesai dan kini ada di arsip.",
                timer: 1200,
                showConfirmButton: false
              }).then(() => {
                window.location.href = "/admin/arsip";   // ⬅️ redirect langsung
              });

              return; // hentikan proses agar tidak lanjut
            }

            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Status klaim telah diperbarui.",
              timer: 1500,
              showConfirmButton: false
            });

            select.dataset.prev = newStatus;
          });

        } else {
          select.value = prevStatus;
        }

      });

    });
  });

  // ============================
  // ==== FITUR SEARCH ==========
  // ============================
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#dataTable tbody tr");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const keyword = searchInput.value.toLowerCase();

      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
      });
    });
  }

});
