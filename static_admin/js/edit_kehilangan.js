document.addEventListener("DOMContentLoaded", () => {
  // Tombol kembali
  document.getElementById("btnKembali").addEventListener("click", () => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "beranda") {
      window.location.href = "/admin/beranda";
    } else {
      window.location.href = "/admin/kehilangan/daftar";
    }
  });

  // Flatpickr untuk update terakhir
  flatpickr("#updateTerakhir", {
    enableTime: true,          // agar bisa pilih jam juga
    dateFormat: "Y-m-d H:i:S"  // format MySQL DATETIME
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Tombol kembali ke halaman sebelumnya
  document.getElementById("btnKembali").addEventListener("click", () => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "beranda") {
      window.location.href = "/admin/beranda";
    } else {
      window.location.href = "/admin/kehilangan/daftar";
    }
  });
});

