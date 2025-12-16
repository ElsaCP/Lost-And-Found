document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const navbar = document.querySelector('.navbar');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      if (!validateEmail(email)) {
        showNotif('Format email tidak valid!');
        return;
      }

      if (password.length < 6) {
        showNotif('Password minimal 6 karakter!');
        return;
      }

      submitBtn.textContent = 'Loading...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            showNotif('Login berhasil!');
            setTimeout(() => {
              window.location.href = '/admin/beranda';
            }, 1000);
          } else {
            showNotif(result.message || 'Email atau password salah!');
          }
        } else {
          showNotif('Gagal menghubungi server. Coba lagi.');
        }
      } catch (error) {
        console.error(error);
        showNotif('Terjadi kesalahan koneksi.');
      }

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  }

  let lastScroll = 0;
  if (navbar) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
      } else {
        navbar.style.transform = 'translateY(0)';
      }
      lastScroll = currentScroll;
    });
  }

  const pwdInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.toggle-password');
  const eyeIcon = document.getElementById('eyeIcon');

  if (pwdInput && toggleBtn && eyeIcon) {
    toggleBtn.addEventListener('click', function () {
      const isHidden = pwdInput.type === 'password';
      pwdInput.type = isHidden ? 'text' : 'password';
      eyeIcon.classList.toggle('bi-eye', !isHidden);
      eyeIcon.classList.toggle('bi-eye-slash', isHidden);
    });
  }

  const circles = document.querySelectorAll('.circle-decoration');
  circles.forEach(circle => {
    circle.addEventListener('mouseenter', () => {
      circle.style.transform = 'scale(1.2)';
      circle.style.transition = 'transform 0.3s ease';
    });
    circle.addEventListener('mouseleave', () => {
      circle.style.transform = 'scale(1)';
    });
  });
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

function showNotif(message) {
  const notif = document.createElement('div');
  notif.className = 'notif-box';
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #0d6efd;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: "Poppins", sans-serif;
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
