document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // ELEMENT DASAR
  // =========================
  const btnUpdate = document.getElementById("btnUpdate");
  const btnKembali = document.getElementById("btnKembali");
  const btnExport = document.getElementById("btnExportPdf");
  const btnCari = document.getElementById("btnCariFoto");
  const inputCari = document.getElementById("filterFoto");
  const fotoList = document.getElementById("fotoPenemuanList");
  const infoCari = document.getElementById("infoCari");
  const btnSimpan = document.getElementById("btnSimpanRekomendasi");
  const kodeKehilangan = document.getElementById("kodeLaporan")?.innerText.trim() || null;

  const fotoItems = document.querySelectorAll(".foto-item");

  // =========================
  // SEMBUNYIKAN SEMUA FOTO DEFAULT
  // =========================
  fotoItems.forEach(item => item.style.display = "none");

  // =========================
  // LOAD REKOMENDASI YANG SUDAH DISIMPAN
  // =========================
  async function loadRekomendasi() {
    if (!kodeKehilangan) return;
    try {
      const res = await fetch(`/admin/rekomendasi/list?kode_kehilangan=${kodeKehilangan}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rekomendasi)) {
        fotoItems.forEach(item => {
          if (data.rekomendasi.includes(item.dataset.id)) {
            item.style.display = "block";        // tampilkan foto
            item.classList.add("active");         // beri class active
            const checkbox = item.querySelector(".select-foto");
            if (checkbox) checkbox.checked = true; // centang checkbox
          }
        });
      }
    } catch (err) {
      console.error("Gagal load rekomendasi:", err);
    }
  }

  loadRekomendasi(); // panggil saat halaman dibuka

  // =========================
  // UPDATE STATUS
  // =========================
  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {
      const status = document.getElementById("status").value;
      try {
        const res = await fetch("/admin/api/kehilangan/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode: kodeKehilangan, status })
        });
        const result = await res.json();
        if (result.success) {
          Swal.fire({ icon: "success", title: "Status diperbarui", timer: 1500, showConfirmButton: false })
            .then(() => window.location.href = "/admin/kehilangan/daftar");
        }
      } catch {
        Swal.fire("Error", "Gagal update status", "error");
      }
    });
  }

  // =========================
  // KEMBALI
  // =========================
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      window.location.href = "/admin/kehilangan/daftar";
    });
  }

  // =========================
  // EXPORT PDF
  // =========================
  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const element = document.querySelector(".detail-container");
      const hideEls = document.querySelectorAll(".no-print");

      Swal.fire({ title: "Membuat PDF...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      hideEls.forEach(el => el.style.display = "none");

      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 10, width, height);
        pdf.save(`Detail_Kehilangan_${kodeKehilangan}.pdf`);
        Swal.close();
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "PDF gagal dibuat", "error");
      } finally {
        hideEls.forEach(el => el.style.display = "");
      }
    });
  }

  // =========================
  // CARI FOTO PENEMUAN
  // =========================
  if (btnCari) {
    btnCari.addEventListener("click", () => {
      const keyword = inputCari.value.toLowerCase().trim();
      if (!keyword) return Swal.fire("Masukkan kata kunci", "", "warning");

      let ditemukan = false;
      fotoList.classList.remove("hidden");
      infoCari.style.display = "none";

      fotoItems.forEach(item => {
        const nama = item.dataset.nama.toLowerCase() || "";
        if (nama.includes(keyword)) {
          item.style.display = "block";
          ditemukan = true;
        } else {
          item.style.display = "none";
        }
      });

      if (!ditemukan) Swal.fire("Tidak ditemukan", "Tidak ada foto penemuan yang cocok", "info");
    });
  }

  // =========================
  // PILIH FOTO (KLIK CARD)
  // =========================
  fotoItems.forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      item.classList.toggle("active");
      const checkbox = item.querySelector(".select-foto");
      if (checkbox) checkbox.checked = item.classList.contains("active");
    });
  });

  // =========================
  // SIMPAN REKOMENDASI
  // =========================
  if (btnSimpan) {
    btnSimpan.addEventListener("click", async () => {
      const selected = [];
      fotoItems.forEach(item => { if (item.classList.contains("active")) selected.push(item.dataset.id); });

      if (!selected.length) return Swal.fire("Pilih minimal satu foto", "", "warning");

      try {
        const res = await fetch("/admin/rekomendasi/simpan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode_kehilangan: kodeKehilangan, kode_penemuan_list: selected })
        });
        const data = await res.json();

        if (data.success) {
          Swal.fire("Berhasil", data.message, "success");
          loadRekomendasi(); // tampilkan rekomendasi terbaru langsung
        } else {
          Swal.fire("Gagal", data.message, "error");
        }

      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal menyimpan rekomendasi", "error");
      }
    });
  }

});
