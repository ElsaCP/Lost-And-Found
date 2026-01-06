document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("formPenemuan");
  const btnCancel = document.querySelector(".btn-cancel");

  const terminalSelect = document.getElementById("terminal_penemuan");
  const tempatSelect = document.getElementById("tempat_penemuan");
  const lokasiLainContainer = document.getElementById("lokasiLainContainerPenemuan");
  const lokasiLain = document.getElementById("lokasi_lain_penemuan");
  const lokasiInput = document.getElementById("lokasi_penemuan");

  const tempatData = {
    "Terminal 1": ["Gate A", "Gate B", "Waiting Area T1", "Bagasi", "Lainnya"],
    "Terminal 2": ["Gate C", "Gate D", "Waiting Area T2", "Bagasi", "Lainnya"]
  };

  function updateLokasi() {
    const terminal = terminalSelect.value;
    const tempat = tempatSelect.value;
    const lainnya = lokasiLain.value.trim();

    if (tempat === "Lainnya") {
      lokasiInput.value = lainnya ? `${terminal} - ${lainnya}` : "";
    } else {
      lokasiInput.value = terminal && tempat ? `${terminal} - ${tempat}` : "";
    }
  }

  terminalSelect.addEventListener("change", () => {
    const selected = terminalSelect.value;

    tempatSelect.innerHTML = '<option value="">Pilih Lokasi</option>';
    lokasiLainContainer.style.display = "none";
    lokasiLain.value = "";

    if (tempatData[selected]) {
      tempatData[selected].forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        tempatSelect.appendChild(opt);
      });
    }

    updateLokasi();
  });

  tempatSelect.addEventListener("change", () => {
    lokasiLainContainer.style.display = tempatSelect.value === "Lainnya" ? "block" : "none";
    updateLokasi();
  });

  lokasiLain.addEventListener("input", updateLokasi);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let errors = [];

    function cek(name, label) {
      const el = form.querySelector(`[name="${name}"]`);
      if (!el || !el.value.trim()) {
        errors.push(label);
      }
    }

    cek("nama_pelapor", "Nama Pelapor");
    cek("no_telp", "Nomor Telepon");
    cek("email", "Email");
    cek("nama_barang", "Nama Barang");
    cek("kategori", "Kategori");
    cek("jenis_barang", "Jenis Barang");
    cek("tanggal_lapor", "Tanggal Penemuan");
    cek("deskripsi", "Deskripsi");

    if (!terminalSelect.value.trim()) errors.push("Terminal");
    if (!tempatSelect.value.trim()) errors.push("Tempat");
    if (tempatSelect.value === "Lainnya" && !lokasiLain.value.trim()) {
      errors.push("Lokasi Lainnya");
    }

    const foto = form.querySelector('[name="foto"]');
    if (!foto || !foto.files.length) {
      errors.push("Foto Barang");
    }

    if (errors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Form belum lengkap!",
        html: "<b>Harap isi:</b><br>" + errors.join("<br>"),
        confirmButtonText: "OK"
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Data berhasil disimpan",
      text: "Laporan penemuan telah ditambahkan",
      showConfirmButton: false,
      timer: 1200
    }).then(() => {
      form.submit();
    });
  });

  btnCancel.addEventListener("click", () => {
    Swal.fire({
      icon: "question",
      title: "Batalkan?",
      text: "Data yang belum disimpan akan hilang.",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Tidak"
    }).then(res => {
      if (res.isConfirmed) {
        window.location.href = "/admin/penemuan/daftar";
      }
    });
  });

});
