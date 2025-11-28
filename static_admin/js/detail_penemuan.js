document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // UPDATE STATUS
  // ======================
  const btnUpdate = document.getElementById("btnUpdate");

  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {
      const kode = btnUpdate.dataset.kode;
      const newStatus = document.getElementById("status").value;

      const response = await fetch(`/admin/api/penemuan/update_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kode, status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Status diperbarui",
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          const from = new URLSearchParams(window.location.search).get("from");
          if (from === "beranda") {
            window.location.href = "/admin/beranda_admin";
          } else {
            window.location.href = "/admin/penemuan/daftar";
          }
        });
      }
    });
  }

  // ======================
  // BUTTON KLAIM BARANG
  // ======================
  const btnKlaim = document.getElementById("btnKlaim");
  if (btnKlaim) {
    btnKlaim.addEventListener("click", () => {
      const kode = btnKlaim.dataset.kode;
      window.location.href = `/admin/klaim/baru?kode_barang=${kode}`;
    });
  }

  // ======================
  // BUTTON KEMBALI
  // ======================
  const btnKembali = document.getElementById("btnKembali");
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      const from = new URLSearchParams(window.location.search).get("from");

      if (from === "beranda") {
        window.location.href = "/admin/beranda";
      } else {
        window.location.href = "/admin/penemuan/daftar";
      }
    });
  }
});
