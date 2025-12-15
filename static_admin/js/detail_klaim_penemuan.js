document.addEventListener("DOMContentLoaded", async function () {

    // ============================
    // AMBIL KODE KLAIM DARI URL
    // ============================
    const pathParts = window.location.pathname.split("/");
    const kode = pathParts[pathParts.length - 1];

    if (!kode) {
        console.error("Kode klaim tidak ditemukan di URL.");
        return;
    }

    // ============================
    // FETCH DATA DARI API
    // ============================
    try {
        const response = await fetch(`/admin/penemuan/klaim/api?kode=${kode}`);
        const json = await response.json();

        if (!json.success) {
            console.error("Data klaim tidak ditemukan.");
            return;
        }

        const klaim = json.data;

        // === ISI DATA KE HALAMAN ===
        document.getElementById("kodeLaporan").textContent = klaim.kode_laporan ?? "-";
        document.getElementById("kodeBarang").textContent = klaim.kode_barang ?? "-";
        document.getElementById("kodeLaporanKehilangan").textContent = klaim.kode_laporan_kehilangan ?? "-";

        document.getElementById("namaBarang").textContent = klaim.nama_barang ?? "-";
        document.getElementById("namaPelapor").textContent = klaim.nama_pelapor ?? "-";
        document.getElementById("noTelp").textContent = klaim.no_telp ?? "-";
        document.getElementById("emailPelapor").textContent = klaim.email ?? "-";
        document.getElementById("deskripsiKhusus").textContent = klaim.deskripsi_khusus ?? "-";

        document.getElementById("tanggalLapor").textContent = klaim.tanggal_lapor ?? "-";
        document.getElementById("waktuLapor").textContent = klaim.waktu_lapor ?? "-";
        document.getElementById("updateTerakhir").textContent = klaim.update_terakhir ?? "-";

        // GAMBAR
        document.getElementById("imgFotoBarangPenemuan").src =
            klaim.foto_barang_penemuan ? `/static/uploads/${klaim.foto_barang_penemuan}` : "/static/no-image.png";

        document.getElementById("imgFotoBarangSebelum").src =
            klaim.foto_barang_klaim ? `/static/uploads/${klaim.foto_barang_klaim}` : "/static/no-image.png";

        document.getElementById("imgBukti").src =
            klaim.bukti_laporan ? `/static/uploads/${klaim.bukti_laporan}` : "/static/no-image.png";

        document.getElementById("imgIdentitas").src =
            klaim.identitas_diri ? `/static/uploads/${klaim.identitas_diri}` : "/static/no-image.png";

        // STATUS
        document.getElementById("statusSelect").value = klaim.status ?? "Pending";

        // CATATAN
        document.getElementById("catatanAdmin").value = klaim.catatan_admin ?? "";

    } catch (error) {
        console.error("Gagal memuat data klaim:", error);
    }

    // ============================
    // TOMBOL KEMBALI (FINAL)
    // ============================
    document.getElementById("btnKembali").addEventListener("click", () => {
        const from = new URLSearchParams(window.location.search).get("from");

        if (from === "beranda") {
            window.location.href = "/admin/beranda";
        } else {
            window.location.href = "/admin/penemuan/klaim";
        }
    });

    // ============================
    // UPDATE DATA
    // ============================
    document.getElementById("btnUpdate").addEventListener("click", async () => {

        const status = document.getElementById("statusSelect").value;
        const catatan = document.getElementById("catatanAdmin").value;
        const from = new URLSearchParams(window.location.search).get("from");

        Swal.fire({
            title: "Simpan Perubahan?",
            text: `Status akan diubah menjadi "${status}"`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Ya, simpan",
            cancelButtonText: "Batal",
        }).then(async (result) => {

            if (!result.isConfirmed) return;

            const res = await fetch("/admin/penemuan/klaim/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kode_laporan: kode,
                    status: status,
                    catatan_admin: catatan
                })
            });

            const resultUpdate = await res.json();

            if (resultUpdate.success) {
                Swal.fire({
                    icon: "success",
                    title: "Berhasil!",
                    text: "Data klaim berhasil diperbarui.",
                    timer: 2000,
                    showConfirmButton: false,
                });

                setTimeout(() => {
                    if (from === "beranda") {
                        window.location.href = "/admin/beranda";
                    } else {
                        window.location.href = "/admin/penemuan/klaim";
                    }
                }, 1500);

            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal!",
                    text: "Terjadi kesalahan saat menyimpan perubahan."
                });
            }
        });
    });

    // ============================
    // LIGHTBOX / ZOOM GAMBAR
    // ============================
    const zoomImgs = document.querySelectorAll(".zoomable");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector("#lightbox .lightbox-close");

    zoomImgs.forEach(img => {
        img.addEventListener("click", () => {
            lightbox.style.display = "flex";
            lightboxImg.src = img.src;
            document.body.style.overflow = "hidden"; // disable scroll
        });
    });

    // tombol X
    closeBtn.onclick = () => {
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
    };

    // klik area gelap
    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };


    const btnExport = document.getElementById("btnExport");

    if (btnExport) {
    btnExport.addEventListener("click", async () => {
        const { jsPDF } = window.jspdf;
        const element = document.querySelector(".detail-wrapper");
        const hideElements = document.querySelectorAll(".no-print");

        Swal.fire({
        title: "Membuat PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
        });

        // SEMBUNYIKAN TOMBOL
        hideElements.forEach(el => el.style.display = "none");

        // 🔥 AKTIFKAN MODE EXPORT (INI KUNCI UTAMA)
        document.body.classList.add("pdf-export");

        try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            scrollY: -window.scrollY
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let remainingHeight = imgHeight;
        let yOffset = 0;

        /* =========================
            HALAMAN 1
        ========================= */
        pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
        remainingHeight -= pageHeight;

        /* =========================
            HALAMAN 2 & SETERUSNYA
            (TANPA ZOOM, TANPA NUMPUK)
        ========================= */
        while (remainingHeight > 0) {
            yOffset -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
            remainingHeight -= pageHeight;
        }

        const kode =
            document.getElementById("kodeLaporan")?.innerText || "Klaim";

        pdf.save(`Detail_Klaim_${kode}.pdf`);

        Swal.close();

        } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Gagal membuat PDF", "error");
        } finally {
        // 🔥 MATIKAN MODE EXPORT
        document.body.classList.remove("pdf-export");

        // TAMPILKAN LAGI TOMBOL
        hideElements.forEach(el => el.style.display = "");
        }
    });
    }
});
