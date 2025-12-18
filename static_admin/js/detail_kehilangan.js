document.addEventListener("DOMContentLoaded", () => {

  const btnUpdate = document.getElementById("btnUpdate");
  const btnKembali = document.getElementById("btnKembali");
  const btnExport = document.getElementById("btnExportPdf");

  const kode = btnUpdate ? btnUpdate.dataset.kode : null;

  // ======================
  // UPDATE STATUS
  // ======================
  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {
      const newStatus = document.getElementById("status").value;

      try {
        const response = await fetch(`/admin/api/kehilangan/update_status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode, status: newStatus })
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
            window.location.href = from === "beranda"
              ? "/admin/beranda"
              : "/admin/kehilangan/daftar";
          });
        }
      } catch {
        Swal.fire("Error!", "Terjadi masalah server.", "error");
      }
    });
  }

  // ======================
  // BUTTON KEMBALI
  // ======================
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from === "beranda"
        ? "/admin/beranda"
        : "/admin/kehilangan/daftar";
    });
  }

  // ======================
  // EXPORT PDF (FIXED + NO BUTTON)
  // ======================
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

        const kodeLaporan = document.getElementById("kodeLaporan").innerText;
        pdf.save(`Detail_Kehilangan_${kodeLaporan}.pdf`);

        Swal.close();
      } catch (e) {
        console.error(e);
        Swal.fire("Gagal", "Gagal membuat PDF", "error");
      } finally {
        // ✅ TAMPILKAN LAGI BUTTON SETELAH EXPORT
        hideElements.forEach(el => el.style.display = "");
      }
    });
  }

});