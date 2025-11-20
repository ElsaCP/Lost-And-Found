document.addEventListener("DOMContentLoaded", async function () {

    // ============================
    // AMBIL KODE DARI URL PATH
    // /admin/penemuan/klaim/detail/LF-C001
    // ============================
    const path = window.location.pathname.split("/");
    const kode = path[path.length - 1];

    if (!kode) {
        console.error("Kode klaim tidak ditemukan di URL.");
        return;
    }

    // ============================
    // FETCH DATA DARI API BARU
    // ============================
    try {
        const response = await fetch(`/admin/penemuan/klaim/api?kode=${kode}`);
        const data = await response.json();

        if (!data.success) {
            console.error("Data klaim tidak ditemukan.");
            return;
        }

        const klaim = data.data;

        // === ISI DATA KE HALAMAN ===
        document.getElementById("kodeLaporan").textContent = klaim.kode_laporan;
        document.getElementById("kodeBarang").textContent = klaim.kode_barang ?? "-";
        document.getElementById("namaBarang").textContent = klaim.nama_barang;
        document.getElementById("namaPelapor").textContent = klaim.nama_pelapor;
        document.getElementById("noTelp").textContent = klaim.no_telp;
        document.getElementById("emailPelapor").textContent = klaim.email;
        document.getElementById("deskripsiKhusus").textContent = klaim.deskripsi_khusus;

        document.getElementById("tanggalLapor").textContent = klaim.tanggal_lapor;
        document.getElementById("waktuLapor").textContent = klaim.waktu_lapor;
        document.getElementById("updateTerakhir").textContent = klaim.update_terakhir;

        // GAMBAR
        document.getElementById("imgIdentitas").src = `/uploads/${klaim.identitas_diri}`;
        document.getElementById("imgBukti").src = `/uploads/${klaim.bukti_laporan}`;
        document.getElementById("imgFotoBarang").src = `/uploads/${klaim.foto_barang}`;

        // STATUS
        document.getElementById("statusSelect").value = klaim.status;

        // CATATAN
        document.getElementById("catatanAdmin").value = klaim.catatan_admin;

    } catch (error) {
        console.error("Gagal memuat data klaim:", error);
    }

    // ============================
    // TOMBOL KEMBALI
    // ============================
    document.getElementById("btnKembali").addEventListener("click", () => {
        window.location.href = "/admin/penemuan/klaim";
    });

    // ============================
    // TOMBOL UPDATE STATUS
    // ============================
    document.getElementById("btnUpdate").addEventListener("click", async () => {
        const status = document.getElementById("statusSelect").value;
        const catatan = document.getElementById("catatanAdmin").value;

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
                    window.location.href = "/admin/penemuan/klaim";
                }, 1500);
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal!",
                    text: "Terjadi kesalahan saat menyimpan perubahan."
                });
                const pathParts = window.location.pathname.split("/");
                const kode = pathParts[pathParts.length - 1]; // "LF-C001"
            }
        });
    });
});
