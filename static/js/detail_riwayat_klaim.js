// Ambil kode laporan dari URL path
const kode = window.location.pathname.split("/").pop();

fetch(`/api/riwayat-status/${kode}`)
  .then(res => res.json())
  .then(data => {
    const tabel = document.getElementById("tabelStatus");
    let html = "";

    data.forEach(row => {
      html += `
        <tr>
          <td>${row.waktu_update || '-'}</td>
          <td>${row.status}</td>
          <td>${row.catatan}</td>
        </tr>
      `;
    });

    tabel.innerHTML = html;
  });
