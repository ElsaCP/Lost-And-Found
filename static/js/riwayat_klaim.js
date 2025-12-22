function cekRiwayat() {
    const kodeKehilangan = document.getElementById("kodeKehilangan").value.trim();
    const kodeKlaim = document.getElementById("kodeKlaim").value.trim();

    if (!kodeKehilangan || !kodeKlaim) {
        alert("Kode kehilangan dan kode klaim wajib diisi!");
        return;
    }

    fetch("/api/cek-riwayat-klaim", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            kode_kehilangan: kodeKehilangan,
            kode_klaim: kodeKlaim
        }),
    })
    .then(response => response.json())
    .then(result => {

        if (result.status === "not_found") {
            let myModal = new bootstrap.Modal(
                document.getElementById('modalKodeTidakCocok')
            );
            myModal.show();
            return;
        }

        if (result.status === "success") {
            window.location.href = `/detail-klaim/${result.kode_klaim}`;
        }
    })
    .catch(() => {
        alert("Terjadi kesalahan sistem.");
    });
}

// Tekan Enter → submit
document.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        cekRiwayat();
    }
});
