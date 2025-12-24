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

        if (!json.success || !json.data) {
            Swal.fire("Error", "Data klaim tidak ditemukan", "error");
            return;
        }

        const klaim = json.data;

        // ============================
        // SURAT PENGAMBILAN (FINAL UX – AMAN)
        // ============================
        const suratBox = document.getElementById("suratPengambilanBox");
        const alertKosong = document.getElementById("alertSuratKosong");

        if (suratBox) {

            // 🔥 PENTING: surat BUKAN gambar → jangan ikut zoom
            suratBox.classList.remove("zoomable");

            const surat = klaim.surat_pengambilan;

            if (surat && surat.trim() !== "") {
                const fileUrl = `/static/uploads/surat/${encodeURIComponent(surat)}`;

                suratBox.innerHTML = `
                    <i class="bi bi-file-earmark-pdf" style="font-size:64px; color:#dc3545;"></i>
                    <span class="mt-2 fw-semibold">Surat Pengambilan</span>
                    <small class="text-muted">Klik untuk membuka dokumen</small>
                `;

                suratBox.style.cursor = "pointer";
                suratBox.onclick = () => window.open(fileUrl, "_blank");

                if (alertKosong) alertKosong.classList.add("d-none");

            } else {
                suratBox.innerHTML = `
                    <i class="bi bi-file-earmark-x" style="font-size:64px; color:#adb5bd;"></i>
                    <span class="mt-2 text-muted">Belum ada surat pengambilan</span>
                    <small class="text-muted">User belum mengunggah dokumen</small>
                `;

                suratBox.style.cursor = "not-allowed";
                suratBox.onclick = () => {
                    Swal.fire({
                        icon: "warning",
                        title: "Surat belum tersedia",
                        text: "User belum mengunggah surat pengambilan.",
                        confirmButtonColor: "#3085d6"
                    });
                };

                if (alertKosong) alertKosong.classList.remove("d-none");
            }
        }

        // ============================
        // === ISI DATA KE HALAMAN (DATA LAMA)
        // ============================
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

        // ============================
        // GAMBAR
        // ============================
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
    // TOMBOL KEMBALI (TIDAK DIUBAH)
    // ============================
    document.getElementById("btnKembali").addEventListener("click", () => {
        const from = new URLSearchParams(window.location.search).get("from");
        window.location.href =
            from === "beranda" ? "/admin/beranda" : "/admin/penemuan/klaim";
    });

    // ============================
    // UPDATE DATA (TIDAK DIUBAH)
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
                    window.location.href =
                        from === "beranda" ? "/admin/beranda" : "/admin/penemuan/klaim";
                }, 1500);

            } else {
                Swal.fire("Gagal!", "Terjadi kesalahan saat menyimpan perubahan.", "error");
            }
        });
    });

    // ============================
    // LIGHTBOX / ZOOM GAMBAR (HANYA IMG)
    // ============================
    const zoomImgs = document.querySelectorAll("img.zoomable");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector("#lightbox .lightbox-close");

    zoomImgs.forEach(img => {
        img.addEventListener("click", () => {
            lightbox.style.display = "flex";
            lightboxImg.src = img.src;
            document.body.style.overflow = "hidden";
        });
    });

    closeBtn.onclick = () => {
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
    };

    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };

    // ============================
    // EXPORT PDF (TIDAK DIUBAH SAMA SEKALI)
    // ============================
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

            hideElements.forEach(el => el.style.display = "none");
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
                const imgHeight = (canvas.height * pageWidth) / canvas.width;

                let remainingHeight = imgHeight;
                let yOffset = 0;

                pdf.addImage(imgData, "PNG", 0, yOffset, pageWidth, imgHeight);
                remainingHeight -= pageHeight;

                while (remainingHeight > 0) {
                    yOffset -= pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, yOffset, pageWidth, imgHeight);
                    remainingHeight -= pageHeight;
                }

                const kodePDF =
                    document.getElementById("kodeLaporan")?.innerText || "Klaim";

                pdf.save(`Detail_Klaim_${kodePDF}.pdf`);
                Swal.close();

            } catch (err) {
                console.error(err);
                Swal.fire("Gagal", "Gagal membuat PDF", "error");
            } finally {
                document.body.classList.remove("pdf-export");
                hideElements.forEach(el => el.style.display = "");
            }
        });
    }
});
