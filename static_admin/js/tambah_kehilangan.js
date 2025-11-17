document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formTambah");
  const btnCancel = document.querySelector(".btn-cancel");

  const terminalSelect = document.getElementById("terminal");
  const tempatSelect = document.getElementById("tempat");
  const lokasiLainContainer = document.getElementById("lokasiLainContainer");
  const lokasiLain = document.getElementById("lokasi_lain");
  const lokasiInput = document.getElementById("lokasi");

  const tempatData = {
    "Terminal 1": ["Gate A", "Gate B", "Waiting Area T1", "Bagasi", "Lainnya"],
    "Terminal 2": ["Gate C", "Gate D", "Waiting Area T2", "Bagasi", "Lainnya"]
  };

  // =========================
  // UPDATE LOKASI OTOMATIS
  // =========================
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

  // =========================
  // VALIDASI WAJIB DIISI
  // =========================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  let errors = [];

  function cek(name, label) {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el || !el.value.trim()) {
      errors.push(label);
    }
  }

  // CEK FIELD WAJIB
  cek("nama_pelapor", "Nama Pelapor");
  cek("no_telp", "Nomor Telepon");
  cek("email", "Email");
  cek("asal_negara", "Asal Negara");
  cek("kota", "Kota");
  cek("nama_barang", "Nama Barang");
  cek("kategori", "Kategori");
  cek("tanggal_kehilangan", "Tanggal Kehilangan");
  cek("deskripsi", "Deskripsi");

  // Lokasi khusus
  if (!terminalSelect.value.trim()) errors.push("Terminal");
  if (!tempatSelect.value.trim()) errors.push("Tempat");

  // Jika memilih "Lainnya"
  if (tempatSelect.value === "Lainnya" && !lokasiLain.value.trim()) {
    errors.push("Lokasi Lainnya");
  }

  // Foto barang
  const foto = form.querySelector('[name="foto"]');
  if (!foto.files.length) {
    errors.push("Foto Barang");
  }

  // TAMPILKAN ERROR
  if (errors.length > 0) {
    Swal.fire({
      icon: "warning",
      title: "Form belum lengkap!",
      html: "<b>Harap isi:</b><br>" + errors.join("<br>"),
      confirmButtonText: "OK"
    });
    return;
  }

  // Jika sudah lengkap → submit
  Swal.fire({
    icon: "success",
    title: "Menyimpan...",
    timer: 800,
    showConfirmButton: false
  }).then(() => form.submit());
});

  // =========================
  // BUTTON CANCEL
  // =========================
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
        window.location.href = "/admin/kehilangan/daftar";
      }
    });
  });
});
