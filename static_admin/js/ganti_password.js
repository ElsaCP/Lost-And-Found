function togglePassword(id, icon) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("bi-eye", "bi-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("bi-eye-slash", "bi-eye");
  }
}

// ====== Tombol Batal ======
const btnCancel = document.querySelector(".btn-cancel");
btnCancel?.addEventListener("click", () => {
  // arahkan langsung ke halaman profil admin
  window.location.href = "pengaturan.html";
});

// ====== Validasi Form Password ======
document.getElementById("passwordForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    alert("Semua kolom harus diisi!");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Konfirmasi password tidak cocok!");
  } else if (newPassword.length < 8) {
    alert("Password minimal 8 karakter!");
  } else {
    alert("Password berhasil diubah!");
    // setelah sukses, bisa arahkan balik ke halaman pengaturan
    window.location.href = "pengaturan.html";
  }
});
