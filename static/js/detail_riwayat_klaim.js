const kode = window.location.pathname.split("/").pop();

fetch(`/api/riwayat-status/${kode}`)
  .then(res => res.json())
  .then(data => {
    const tabel = document.getElementById("tabelStatus");
    const ambilSection = document.getElementById("ambilSection");
    const uploadSection = document.getElementById("uploadSection");
    const notif = document.getElementById("notifStatus");

    let html = "";
    let statusTerakhir = "";

    data.forEach(row => {
      statusTerakhir = row.status;
      html += `
        <tr>
          <td>${row.waktu_update || '-'}</td>
          <td>${row.status}</td>
          <td>${row.catatan || '-'}</td>
        </tr>
      `;
    });

    tabel.innerHTML = html;

    // RESET
    notif.innerHTML = "";
    if (ambilSection) ambilSection.classList.add("d-none");
    if (uploadSection) uploadSection.classList.add("d-none");

    // =========================
    // STATUS: VERIFIKASI
    // =========================
    if (statusTerakhir === "Verifikasi") {
      notif.innerHTML = `
        <div class="alert alert-success shadow-sm">
          <i class="bi bi-check-circle-fill"></i>
          Data telah diverifikasi.  
          Silakan download surat dan upload kembali surat yang sudah ditandatangani.
        </div>
      `;

      if (uploadSection) uploadSection.classList.remove("d-none");
    }

    // =========================
    // STATUS: SIAP DIAMBIL
    // =========================
    if (statusTerakhir === "Siap Diambil") {
      notif.innerHTML = `
        <div class="alert alert-success shadow-sm">
          <i class="bi bi-box-seam"></i>
          Surat telah dicek admin. Barang siap diambil.
        </div>
      `;

      if (ambilSection) {
        ambilSection.classList.remove("d-none");

        document.getElementById("btnSendiri").href =
          `/download/surat-pengambilan/${kode}?tipe=sendiri`;

        document.getElementById("btnWakil").href =
          `/download/surat-pengambilan/${kode}?tipe=wakil`;
      }
    }

    // =========================
    // STATUS: DITOLAK (FINAL)
    // =========================
    if (statusTerakhir === "Ditolak") {
      notif.innerHTML = `
        <div class="alert alert-danger shadow-sm">
          <i class="bi bi-x-circle-fill"></i>
          Klaim ditolak oleh admin.  
          Proses tidak dapat dilanjutkan.
        </div>
      `;
    }
  });
