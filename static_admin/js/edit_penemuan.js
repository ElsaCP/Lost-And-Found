document.addEventListener("DOMContentLoaded", () => {
  
  // Flatpickr untuk update terakhir
  flatpickr("#updateTerakhir", {
    dateFormat: "Y-m-d H:i:S",
    enableTime: true,
  });

  // Tombol kembali
  const btnKembali = document.getElementById("btnKembali");
  btnKembali.addEventListener("click", () => {
    window.location.href = "/admin/penemuan/daftar_penemuan";
  });

});
