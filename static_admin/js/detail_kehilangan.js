document.addEventListener("DOMContentLoaded", () => {
  const kode = document.getElementById("btnUpdateStatus").dataset.kode;

  // ======================
  // UPDATE STATUS
  // ======================
  document.getElementById("btnUpdateStatus").addEventListener("click", async () => {
    const newStatus = document.getElementById("status").value;

    try {
      const response = await fetch(`/admin/api/kehilangan/update_status`, {
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
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          const from = new URLSearchParams(window.location.search).get("from");
          if (from === "beranda") {
            window.location.href = "/admin/beranda";
          } else {
            window.location.href = "/admin/kehilangan/daftar";
          }
        });
      }

    } catch (error) {
      Swal.fire("Error!", "Terjadi masalah server.", "error");
    }
  });

  // ======================
  // BUTTON KEMBALI
  // ======================
  document.getElementById("btnKembali").addEventListener("click", () => {
    const from = new URLSearchParams(window.location.search).get("from");

    if (from === "beranda") {
      window.location.href = "/admin/beranda";
    } else {
      window.location.href = "/admin/kehilangan/daftar";
    }
  });
});
