document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("passwordForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // cegah reload halaman

      const oldPassword = document.getElementById("oldPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      // Validasi sederhana
      if (!oldPassword || !newPassword || !confirmPassword) {
        Swal.fire("Error", "Semua kolom harus diisi!", "error");
        return;
      }

      if (newPassword.length < 8) {
        Swal.fire("Error", "Password minimal 8 karakter!", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        Swal.fire("Error", "Konfirmasi password tidak cocok!", "error");
        return;
      }

      // Kirim POST via fetch
      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            old_password: oldPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
          Swal.fire("Berhasil", data.message, "success").then(() => {
            // Redirect ke halaman pengaturan setelah klik OK
            window.location.href = "/admin/pengaturan";
          });
          form.reset();
        } else {
          Swal.fire("Error", data.message || "Terjadi kesalahan", "error");
        }

      } catch (err) {
        Swal.fire("Error", "Gagal menghubungi server!", "error");
        console.error(err);
      }
    });
  }

  // Tombol batal
  const btnCancel = document.querySelector(".btn-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      window.location.href = "/admin/pengaturan";
    });
  }
});
