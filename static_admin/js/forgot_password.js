document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgotForm");

  if (forgotForm) {
    forgotForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("forgotEmail").value;

      const response = await fetch(forgotPasswordURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Email Terkirim!",
          text: result.message,
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = loginURL;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: result.message,
        });
      }
    });
  }
});
