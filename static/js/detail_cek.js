document.addEventListener("DOMContentLoaded", () => {
    const kode = "{{ laporan.kode_kehilangan }}";
    console.log("Kode kehilangan:", kode);

    const container = document.getElementById("barangSerupaContainer");

    if (!container) return;

    const url = `/api/rekomendasi/${kode}`;
    console.log("URL fetch:", url);

    loadRekomendasi(url);

    document.getElementById("btnBukanBarangSaya").addEventListener("click", () => {
        loadRekomendasi(`/api/rekomendasi_baru/${kode}`);
    });
});

function loadRekomendasi(url) {
    fetch(url)
        .then(res => {
            console.log("Status response:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("Data diterima:", data);

            const container = document.getElementById("barangSerupaContainer");
            container.innerHTML = "";

            if (!data || data.length === 0) {
                container.innerHTML = `<p class="text-muted">Tidak ada rekomendasi ditemukan.</p>`;
                return;
            }

            data.forEach(item => {
                const card = `
                    <div class="col-md-4">
                        <div class="card rekom-card shadow-sm">
                            <img src="${item.gambar_barang_url}" class="rekom-foto" alt="">
                            <div class="p-3">
                                <h6 class="fw-bold">${item.nama_barang}</h6>
                                <p class="mb-1"><b>Kategori:</b> ${item.kategori}</p>
                                <p class="mb-1"><b>Lokasi:</b> ${item.lokasi}</p>
                                <p><b>Tanggal:</b> ${item.tanggal_lapor}</p>
                                <a href="/detail-barang/${item.kode_barang}" class="btn btn-primary btn-sm w-100 mt-2">Lihat Detail</a>
                            </div>
                        </div>
                    </div>`;
                container.innerHTML += card;
            });
        })
        .catch(err => console.error("Fetch error:", err));
}
