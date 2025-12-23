document.addEventListener("DOMContentLoaded", () => {
  const btnUpdate = document.getElementById("btnUpdate");

  if (!btnUpdate) return;

  btnUpdate.addEventListener("click", async () => {
    const kode = btnUpdate.dataset.kode;
    const jenis = btnUpdate.dataset.jenis || "penemuan";

    const statusLaporanEl = document.getElementById("status_laporan");
    const statusBarangEl = document.getElementById("status_barang");

    const payload = {
      kode: kode,
      status: statusLaporanEl ? statusLaporanEl.value : null,
      status_barang: statusBarangEl ? statusBarangEl.value : null
    };

    let apiUrl =
      jenis === "penemuan"
        ? "/admin/api/penemuan/update_status"
        : "/admin/penemuan/klaim/update_status";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update gagal");
      }

      Swal.fire({
        icon: "success",
        title: "Status berhasil diperbarui",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        const from = new URLSearchParams(window.location.search).get("from");
        window.location.href =
          from === "beranda"
            ? "/admin/beranda"
            : "/admin/penemuan/daftar";
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", err.message, "error");
    }
  });

  // ==========================
  // KLAIM BARANG (TETAP)
  // ==========================
  const btnKlaim = document.getElementById("btnKlaim");
  if (btnKlaim) {
    btnKlaim.addEventListener("click", () => {
      const kode = btnKlaim.dataset.kode;
      const from = new URLSearchParams(window.location.search).get("from");

      window.location.href =
        `/admin/klaim/baru?kode_barang=${kode}&from=${from || "penemuan"}`;
    });
  }

  // ==========================
  // KEMBALI
  // ==========================
  const btnKembali = document.getElementById("btnKembali");
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href =
        from === "beranda"
          ? "/admin/beranda"
          : "/admin/penemuan/daftar";
    });
  }

  // ==========================
  // EXPORT PDF (TIDAK DIUBAH)
  // ==========================
  const btnExport = document.getElementById("btnExportPdf");

  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const element = document.querySelector(".detail-container");
      const hideElements = document.querySelectorAll(".no-print");

      Swal.fire({
        title: "Membuat PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

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
        hideElements.forEach(el => el.style.display = "");
      }
    });
  }
});
