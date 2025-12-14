document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // UPDATE STATUS (PENEMUAN / KLAIM)
  // ======================
  const btnUpdate = document.getElementById("btnUpdate");

  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {

      const kode = btnUpdate.dataset.kode;
      const newStatus = document.getElementById("status").value;
      const jenis = btnUpdate.dataset.jenis || "penemuan";

      let apiUrl = "";

      if (jenis === "penemuan") {
        apiUrl = "/admin/api/penemuan/update_status";
      } else if (jenis === "klaim") {
        apiUrl = "/admin/penemuan/klaim/update_status";
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode, status: newStatus })
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
          window.location.href = from === "beranda"
            ? "/admin/beranda"
            : "/admin/penemuan/daftar";
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
      const from = new URLSearchParams(window.location.search).get("from");

      window.location.href =
        `/admin/klaim/baru?kode_barang=${kode}&from=${from || "penemuan"}`;
    });
  }

  // ======================
  // BUTTON KEMBALI
  // ======================
  const btnKembali = document.getElementById("btnKembali");
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from === "beranda"
        ? "/admin/beranda"
        : "/admin/penemuan/daftar";
    });
  }

  // ======================
  // EXPORT PDF (PENEMUAN)
  // ======================
  const btnExport = document.getElementById("btnExportPdf");

  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const element = document.querySelector(".detail-container");
      const hideElements = document.querySelectorAll(".no-print"); // ✅ TAMBAHAN

      Swal.fire({
        title: "Membuat PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // ✅ SEMBUNYIKAN BUTTON SEBELUM CAPTURE
      hideElements.forEach(el => el.style.display = "none");

      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);

        const kodeBarang =
          document.getElementById("kodeLaporan")?.innerText || "PENEMUAN";

        pdf.save(`Detail_Penemuan_${kodeBarang}.pdf`);

        Swal.close();
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Gagal membuat PDF", "error");
      } finally {
        // ✅ TAMPILKAN LAGI BUTTON SETELAH EXPORT
        hideElements.forEach(el => el.style.display = "");
      }
    });
  }
  
});