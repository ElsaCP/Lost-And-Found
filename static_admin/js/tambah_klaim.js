document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const kode = params.get("kode_barang");
  const fromPage = params.get("from");  

  if (kode) {
    const el = document.getElementById("kodeBarang");
    if (el) el.value = kode;
  }

  function generateTimestamp() {
    const now = new Date();
    const tgl = now.toISOString().split("T")[0];
    const waktu = now.toTimeString().split(" ")[0];

    const tglEl = document.getElementById("tanggalLapor");
    const wktEl = document.getElementById("waktuLapor");
    const updEl = document.getElementById("updateTerakhir");

    if (tglEl) tglEl.value = tgl;
    if (wktEl) wktEl.value = waktu;
    if (updEl) updEl.value = tgl + " " + waktu;
  }
  generateTimestamp();

  const btnBatal = document.getElementById("btnKembali");
  if (btnBatal) {
    btnBatal.addEventListener("click", () => {
      Swal.fire({
        title: "Yakin ingin membatalkan?",
        text: "Perubahan akan hilang.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, batal",
        cancelButtonText: "Tidak",
        reverseButtons: true
      }).then((result) => {

        if (result.isConfirmed) {

          if (fromPage === "beranda") {
            window.location.href = "/admin/beranda";
            return;
          }

          window.location.href = "/admin/penemuan/daftar";
        }

      });
    });
  }

  const kirimBtn = document.getElementById("kirimBtn");
  const form = document.getElementById("klaimForm");

  if (kirimBtn && form) {
    kirimBtn.addEventListener("click", () => {

      const nama = document.getElementById("nama")?.value.trim() || "";
      const telp = document.getElementById("telp")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const deskripsi = document.getElementById("deskripsiKhusus")?.value.trim() || "";
      const kodeBarang = document.getElementById("kodeBarang")?.value.trim() || "";

      const fileIdentitas = document.querySelector('input[name="foto_identitas"]')?.files.length || 0;
      const fotoBarang = document.querySelector('input[name="foto_barang"]')?.files.length || 0;

      if (!nama || !telp || !email || !deskripsi || !kodeBarang || !fileIdentitas || !fotoBarang) {
        Swal.fire({
          icon: "warning",
          title: "Data belum lengkap",
          text: "Harap isi semua field wajib."
        });
        return;
      }

      Swal.fire({
        title: "Kirim klaim barang?",
        text: "Pastikan semua data sudah benar!",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Kirim",
        cancelButtonText: "Batal"
      }).then((result) => {

        if (result.isConfirmed) {

          let inputFrom = document.querySelector('input[name="from"]');
          if (!inputFrom) {
            inputFrom = document.createElement("input");
            inputFrom.type = "hidden";
            inputFrom.name = "from";
            form.appendChild(inputFrom);
          }

          inputFrom.value = fromPage || "";

          form.submit();
        }

      });

    });
  }

});
