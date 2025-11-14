document.addEventListener("DOMContentLoaded", () => {
  const kode = document.getElementById("btnUpdateStatus").dataset.kode;

  // Tombol Update Status → kirim ke Flask pakai fetch()
  document.getElementById("btnUpdateStatus").addEventListener("click", async () => {
    const newStatus = document.getElementById("status").value;

    try {
      const response = await fetch(`/admin/api/kehilangan/update_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            kode: kode,            // WAJIB: sesuai yang dibaca Flask
            status: newStatus      // WAJIB: variabel yang benar
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
        // 🔥 setelah update → kembali ke daftar
        window.location.href = "/admin/kehilangan/daftar";
      });

      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Tidak dapat memperbarui status.",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Kesalahan!",
        text: "Terjadi kesalahan pada server.",
      });
    }
  });

// Tombol kembali (detail_kehilangan.js dan edit_kehilangan.js)
document.getElementById("btnKembali").addEventListener("click", () => {
  const from = new URLSearchParams(window.location.search).get("from");
  if (from === "daftar_kehilangan") {
    window.location.href = "/admin/kehilangan/daftar_kehilangan"; // sesuai nama fungsi route Flask
  } else if (from === "beranda") {
    window.location.href = "/admin/beranda_admin";
  } else {
    window.history.back();
  }
});
});