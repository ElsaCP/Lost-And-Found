const kode = window.location.pathname.split("/").pop();

fetch(`/api/riwayat-status/${kode}`)
  .then(res => res.json())
  .then(data => {
    const tabel = document.getElementById("tabelStatus");
    const ambilSection = document.getElementById("ambilSection");
    let html = "";
    let statusTerakhir = "";

    data.forEach(row => {
      statusTerakhir = row.status; // ambil status terakhir
      html += `
        <tr>
          <td>${row.waktu_update || '-'}</td>
          <td>${row.status}</td>
          <td>${row.catatan}</td>
        </tr>
      `;
    });

    tabel.innerHTML = html;

    // ✅ JIKA STATUS SIAP DIAMBIL
    if (statusTerakhir === "Siap Diambil") {
      ambilSection.classList.remove("d-none");

      document.getElementById("btnSendiri").href =
        `/download/surat-pengambilan/${kode}?tipe=sendiri`;

      document.getElementById("btnWakil").href =
        `/download/surat-pengambilan/${kode}?tipe=wakil`;
    }
  });
