document.addEventListener("DOMContentLoaded", () => {

    const terminalSelect = document.getElementById("terminal");
    const tempatSelect = document.getElementById("tempat");
    const lokasiLainContainer = document.getElementById("lokasiLainContainer");
    const lokasiLain = document.getElementById("lokasi_lain");
    const lokasiInput = document.getElementById("lokasi");

    if (terminalSelect && tempatSelect && lokasiInput) {
        const terminalDB = terminalSelect.dataset.terminal || "";
        const tempatDB = tempatSelect.dataset.tempat || "";
        const lokasiLainDB = lokasiLain?.value || "";

        const tempatData = {
            "Terminal 1": ["Gate A", "Gate B", "Waiting Area T1", "Bagasi", "Lainnya"],
            "Terminal 2": ["Gate C", "Gate D", "Waiting Area T2", "Bagasi", "Lainnya"],
        };

        function updateLokasi() {
            const terminal = terminalSelect.value || "";
            const tempat = tempatSelect.value || "";
            const lainnya = lokasiLain.value.trim() || "";
            lokasiInput.value = [
                terminal,
                tempat === "Lainnya" ? lainnya : tempat,
            ]
                .filter(Boolean)
                .join(" - ");
        }

        terminalSelect.addEventListener("change", () => {
            const terminal = terminalSelect.value;

            tempatSelect.innerHTML = '<option value="">Pilih Lokasi</option>';
            lokasiLainContainer.style.display = "none";
            lokasiLain.value = "";

            if (tempatData[terminal]) {
                tempatData[terminal].forEach((t) => {
                    const opt = document.createElement("option");
                    opt.value = t;
                    opt.textContent = t;
                    tempatSelect.appendChild(opt);
                });
            }

            updateLokasi();
        });

        tempatSelect.addEventListener("change", () => {
            if (tempatSelect.value === "Lainnya") {
                lokasiLainContainer.style.display = "block";
            } else {
                lokasiLainContainer.style.display = "none";
                lokasiLain.value = "";
            }
            updateLokasi();
        });

        lokasiLain.addEventListener("input", updateLokasi);

        if (terminalDB) {
            terminalSelect.value = terminalDB;

            tempatSelect.innerHTML = '<option value="">Pilih Lokasi</option>';
            tempatData[terminalDB]?.forEach((t) => {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                tempatSelect.appendChild(opt);
            });

            if (tempatDB) {
                tempatSelect.value = tempatDB;
            }

            if (tempatDB === "Lainnya") {
                lokasiLainContainer.style.display = "block";
                lokasiLain.value = lokasiLainDB;
            } else {
                lokasiLainContainer.style.display = "none";
            }

            updateLokasi();
        }
    }

    const btnUpdate = document.getElementById("btnUpdateStatus");
    if (btnUpdate) {
        const kode = btnUpdate.dataset.kode;

        btnUpdate.addEventListener("click", async () => {
            const newStatus = document.getElementById("status").value;
            const fromPage = new URLSearchParams(window.location.search).get("from");

            try {
                const response = await fetch(`/admin/api/kehilangan/update_status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ kode: kode, status: newStatus }),
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Status Diperbarui!",
                        text: `Status berhasil diubah menjadi "${newStatus}".`,
                        timer: 1500,
                        showConfirmButton: false,
                    });

                    document.getElementById("updateTerakhir").textContent = result.update_terakhir;

                    setTimeout(() => {
                        if (newStatus === "Selesai" || newStatus === "Barang Tidak Ditemukan") {
                            window.location.href = "/admin/arsip";
                            return;
                        }

                        if (fromPage === "beranda") {
                            window.location.href = "/admin/beranda_admin";
                        } else if (fromPage === "daftar") {
                            window.location.href = "/admin/kehilangan/daftar_kehilangan";
                        } else if (fromPage === "detail") {
                            window.location.href = `/admin/kehilangan/detail?kode=${kode}`;
                        } else {
                            window.location.href = "/admin/kehilangan/daftar_kehilangan";
                        }
                    }, 1500);

                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Gagal!",
                        text: "Tidak dapat memperbarui status.",
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    title: "Kesalahan!",
                    text: "Terjadi kesalahan pada server.",
                });
            }
        });
    }

    const btnKembali = document.getElementById("btnKembali");

    if (btnKembali) {
        btnKembali.addEventListener("click", () => {
            const url = new URLSearchParams(window.location.search);
            const from = url.get("from");
            const kode = url.get("kode");

            if (from === "beranda") {
                window.location.href = "/admin/beranda_admin";
            } 
            else if (from === "daftar") {
                window.location.href = "/admin/kehilangan/daftar_kehilangan";
            } 
            else if (from === "detail") {
                window.location.href = `/admin/kehilangan/detail?kode=${kode}`;
            } 
            else {
                window.history.back();
            }
        });
    }
});
