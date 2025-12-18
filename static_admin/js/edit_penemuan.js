document.addEventListener("DOMContentLoaded", () => {
  const terminalSelect = document.getElementById("terminal");
  const tempatSelect = document.getElementById("tempat");
  const lokasiLainContainer = document.getElementById("lokasiLainContainer");
  const lokasiLain = document.getElementById("lokasi_lain");
  const lokasiInput = document.getElementById("lokasi");

  const tempatData = {
    "Terminal 1": ["Gate A", "Gate B", "Waiting Area T1", "Bagasi", "Lainnya"],
    "Terminal 2": ["Gate C", "Gate D", "Waiting Area T2", "Bagasi", "Lainnya"],
  };

const lokasiDB = lokasiInput.value?.trim() || "";

// ===== PREFILL LOKASI =====
if (lokasiDB) {
  let terminalDB = "";
  let tempatDB = "";

  if (lokasiDB.includes(" - ")) {
    [terminalDB, tempatDB] = lokasiDB.split(" - ");
  } else {
    // fallback kalau data lama
    terminalDB = terminalSelect.value;
    tempatDB = lokasiDB;
  }

  if (terminalDB) {
    terminalSelect.value = terminalDB;

    tempatSelect.innerHTML = '<option value="">Pilih Lokasi</option>';
    if (tempatData[terminalDB]) {
      tempatData[terminalDB].forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        tempatSelect.appendChild(opt);
      });
    }

    if (tempatData[terminalDB]?.includes(tempatDB)) {
      tempatSelect.value = tempatDB;
      lokasiLainContainer.style.display = "none";
    } else {
      tempatSelect.value = "Lainnya";
      lokasiLainContainer.style.display = "block";
      lokasiLain.value = tempatDB;
    }
  }
}


  /** Update Lokasi otomatis */
  function updateLokasi() {
    const terminal = terminalSelect.value;
    const tempat = tempatSelect.value;
    const lainnya = lokasiLain.value.trim();

    lokasiInput.value =
      tempat === "Lainnya"
        ? `${terminal} - ${lainnya}`
        : `${terminal} - ${tempat}`;
  }

  terminalSelect.addEventListener("change", () => {
    const terminal = terminalSelect.value;

    tempatSelect.innerHTML = '<option value="">Pilih Lokasi</option>';
    lokasiLainContainer.style.display = "none";
    lokasiLain.value = "";

    if (tempatData[terminal]) {
      tempatData[terminal].forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        tempatSelect.appendChild(opt);
      });
    }

    updateLokasi();
  });

  tempatSelect.addEventListener("change", () => {
    if (tempatSelect.value === "Lainnya") {
      lokasiLainContainer.style.display = "block";
    } else {
      lokasiLainContainer.style.display = "none";
      lokasiLain.value = "";
    }
    updateLokasi();
  });

  lokasiLain.addEventListener("input", updateLokasi);

  // Tombol kembali
  document.getElementById("btnKembali").addEventListener("click", function () {
    window.location.href = this.dataset.url;
  });
});
