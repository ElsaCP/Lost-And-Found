document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const kode = urlParams.get("kode");
  const from = urlParams.get("from") || "daftar_penemuan";

  // =====================
  //  BUTTON UPDATE STATUS
  // =====================
  const btnUpdate = document.getElementById("btnUpdate");
  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {
      const newStatus = document.getElementById("status").value;

      try {
        const response = await fetch(`/admin/api/penemuan/update_status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode: kode,
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
            window.location.href = "/admin/penemuan/daftar";   // <-- FIXED
          });

        } else {
          Swal.fire("Gagal!", "Tidak dapat memperbarui status.", "error");
        }

      } catch (error) {
        console.error(error);
        Swal.fire("Error!", "Terjadi kesalahan pada server.", "error");
      }
    });
  }

  // =====================
  //  TOMBOL KEMBALI
  // =====================
  const btnKembali = document.getElementById("btnKembali");
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      if (from === "daftar_penemuan") {
        window.location.href = "/admin/penemuan/daftar";   // <-- FIXED
      } else if (from === "beranda") {
        window.location.href = "/admin/beranda_admin";
      } else {
        window.history.back();
      }
    });
  }
});
