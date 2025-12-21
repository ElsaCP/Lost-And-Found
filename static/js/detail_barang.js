function klaimBarang(kodeBarang) {
  const kodeKehilangan = document.getElementById("kodeKehilanganAktif")?.value;

  let url = `/form_klaim_barang?id=${kodeBarang}`;

  if (kodeKehilangan) {
    url += `&lost=${kodeKehilangan}`;
  }

  window.location.href = url;
}
