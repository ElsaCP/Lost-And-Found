document.addEventListener("DOMContentLoaded", async () => {
    const listKlaim = document.getElementById("listKlaim");

    // email disimpan dari halaman cek riwayat sebelumnya
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
            const statusClass = k.status.toLowerCase();

            const card = document.createElement("div");
            card.className = "col-md-4";
            card.innerHTML = `
                <div class="card h-100">
                    <img src="${k.gambar_penemuan || '/static/image/no-image.png'}"
                         class="card-img-top">

                    <div class="card-body">
                        <h5 class="card-title">${k.nama_barang}</h5>

                        <p class="card-text"><strong>Kode Barang:</strong> ${k.kode_barang}</p>
                        <p class="card-text"><strong>Kode Laporan:</strong> ${k.kode_laporan}</p>
                        <p class="card-text"><strong>Lokasi:</strong> ${k.lokasi || '-'}</p>
                        <p class="card-text"><strong>Status:</strong> 
                           <span class="status ${statusClass}">${k.status}</span>
                        </p>
                    </div>

                    <div class="text-end p-3">
                        <a href="/detail-klaim/${k.kode_laporan}"
                           class="btn btn-primary btn-sm">Lihat Detail</a>
                    </div>
                </div>
            `;
            listKlaim.appendChild(card);
        });

    } catch (err) {
        listKlaim.innerHTML = `
            <p class="text-center mt-5 text-danger">Terjadi kesalahan memuat data.</p>`;
    }
});
