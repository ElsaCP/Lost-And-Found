document.addEventListener("DOMContentLoaded", () => {
  
  // ============================
  // BUTTON UPDATE STATUS
  // ============================
  const btnUpdate = document.getElementById("btnUpdate");

  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {

      const kode_barang = btnUpdate.dataset.kode;
      const newStatus = document.getElementById("status").value;

      if (!newStatus) {
        return Swal.fire("Peringatan!", "Pilih status dulu.", "warning");
      }

      try {
        const response = await fetch(`/admin/api/penemuan/update_status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode: kode_barang,
            status: newStatus
          })
        });

        const result = await response.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Status Diperbarui!",
            text: `Status berhasil diubah menjadi "${newStatus}".`,
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            window.location.href = "/admin/penemuan/daftar";
          });
        } else {
          Swal.fire("Gagal!", result.message || "Tidak dapat memperbarui status.", "error");
        }

      } catch (error) {
        console.error("JS Error:", error);
        Swal.fire("Error!", "Terjadi kesalahan server.", "error");
      }

    });
  }

  // ============================
  // BUTTON KLAIM BARANG
  // ============================
  const btnKlaim = document.getElementById("btnKlaim");

  if (btnKlaim) {
    btnKlaim.addEventListener("click", () => {
      const kode = btnKlaim.dataset.kode;

      // ROUTE BARU YANG BENAR
      window.location.href = `/admin/klaim/baru?kode_barang=${kode}`;
    });
  }

  // ============================
  // BUTTON KEMBALI
  // ============================
  const btnKembali = document.getElementById("btnKembali");
  const urlParams = new URLSearchParams(window.location.search);
  const from = urlParams.get("from") || "daftar_penemuan";

  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      if (from === "daftar_penemuan") {
        window.location.href = "/admin/penemuan/daftar";
      } else if (from === "beranda") {
        window.location.href = "/admin/beranda_admin";
      } else {
        window.history.back();
      }
    });
  }

});
