document.addEventListener("DOMContentLoaded", async () => {
    const listKlaim = document.getElementById("listKlaim");

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    if (!email) {
        listKlaim.innerHTML = `
            <p class="text-center mt-5">
                Email tidak ditemukan. Silakan kembali dan isi email terlebih dahulu.
            </p>`;
        return;
    }

    try {
        const res = await fetch(`/api/riwayat-klaim/${email}`);
        const data = await res.json();

        if (data.length === 0) {
            listKlaim.innerHTML = `
                <p class="text-center mt-5">
                    Tidak ada riwayat klaim untuk email: <strong>${email}</strong>
                </p>`;
            return;
        }

        data.forEach(k => {
            const statusClass = (k.status_klaim || "")
                .toLowerCase()
                .replace(/ /g, "_");  // ubah spasi jadi underscore


            const card = document.createElement("div");
            card.className = "col-md-4";

            card.innerHTML = `
                <div class="card h-100">
                    <img src="/static/uploads/${k.gambar_barang || 'no-image.png'}"
                         class="card-img-top">

                    <div class="card-body">
                        <h5 class="card-title">${k.nama_barang}</h5>

                        <p class="card-text"><strong>Kode Barang:</strong> ${k.kode_barang}</p>
                        <p class="card-text"><strong>Kode Laporan:</strong> ${k.kode_laporan}</p>
                        <p class="card-text"><strong>Lokasi:</strong> ${k.lokasi || '-'}</p>

                        <!-- STATUS hanya isi -->
                        <p class="card-text">
                            <span class="status ${statusClass}">
                                ${k.status_klaim || ""}
                            </span>
                        </p>

                        <!-- CATATAN hanya isi -->
                        ${k.catatan_admin ? `<p class="card-text">${k.catatan_admin}</p>` : ""}
                    </div>

                    <div class="text-end p-3">
                        <a href="/detail-klaim/${k.kode_laporan}"
                           class="btn btn-primary btn-sm lihat-detail">Lihat Detail</a>
                    </div>
                </div>
            `;

            listKlaim.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        listKlaim.innerHTML = `
            <p class="text-center mt-5 text-danger">Terjadi kesalahan memuat data.</p>`;
    }
});
