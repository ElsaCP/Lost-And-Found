function cekRiwayat() {
    const email = document.getElementById("emailInput").value.trim();

    if (!email) {
        alert("Email tidak boleh kosong!");
        return;
    }

    fetch("/api/cek-riwayat-klaim", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
    })
    .then(response => response.json())
    .then(result => {

        // Jika tidak ditemukan → tampilkan modal
        if (result.status === "not_found") {
            let myModal = new bootstrap.Modal(document.getElementById('modalEmailTidakTerdaftar'));
            myModal.show();
            return;
        }

        // Jika ditemukan → redirect ke halaman hasil riwayat
        if (result.status === "success") {
            // simpan data ke localStorage untuk halaman berikutnya
            localStorage.setItem("riwayat_klaim", JSON.stringify(result.data));

            window.location.href = `/hasil-riwayat-klaim?email=${email}`;
        }
    });
}
// Tekan Enter untuk menjalankan cekRiwayat()
document.getElementById("emailInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();   // mencegah form reload
        cekRiwayat();            // panggil fungsi
    }
});
