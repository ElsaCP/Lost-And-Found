// Form Validation and Submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (validateEmail(email) && password.length >= 6) {
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Loading...';
                submitBtn.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    // Here you would normally make an API call
                    console.log('Login attempt with:', { email, password });
                    
                    // Show success message
                    alert('Login berhasil!');
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    // Redirect or perform other actions
                    // window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                if (!validateEmail(email)) {
                    alert('Email tidak valid!');
                } else if (password.length < 6) {
                    alert('Password harus minimal 6 karakter!');
                }
            }
        });
    }
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add focus effect to inputs
const inputs = document.querySelectorAll('.form-control');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
        this.parentElement.style.transition = 'transform 0.3s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Add animation to circles on hover
const circles = document.querySelectorAll('.circle-decoration');
circles.forEach(circle => {
    circle.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    circle.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Password visibility toggle (optional enhancement)
function createPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const passwordContainer = passwordInput.parentElement;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1.2rem;
    `;
    
    passwordContainer.style.position = 'relative';
    passwordContainer.appendChild(toggleBtn);
    
    toggleBtn.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    });
}

// Uncomment to enable password visibility toggle
// createPasswordToggle();


// Validasi Login
document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;
      if (user && pass) {
        showNotif("Login berhasil!");
      } else {
        showNotif("Username dan password wajib diisi!");
      }
    });
  }

  // Validasi Forgot Password
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value;
      if (validateEmail(email)) {
        showNotif("Link reset password sudah dikirim ke email Anda!");
      } else {
        showNotif("Email tidak valid, coba lagi.");
      }
    });
  }
});

// Validasi email
function validateEmail(email) {
  const re = /^[^@]+@[^@]+\.[^@]+$/;
  return re.test(email.toLowerCase());
}

// Fungsi Notifikasi
function showNotif(message) {
  const notif = document.createElement("div");
  notif.className = "notif-box";
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

// Toggle visibility password (letakkan di script.js atau sebelum </body>)
document.addEventListener('DOMContentLoaded', function () {
  const pwdInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.toggle-password');
  const eyeIcon = document.getElementById('eyeIcon');

  if (!pwdInput || !toggleBtn || !eyeIcon) return;

  toggleBtn.addEventListener('click', function () {
    const isHidden = pwdInput.type === 'password';
    pwdInput.type = isHidden ? 'text' : 'password';

    // ganti ikon (bi-eye / bi-eye-slash)
    eyeIcon.classList.toggle('bi-eye', !isHidden);
    eyeIcon.classList.toggle('bi-eye-slash', isHidden);

    // aksesibilitas
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
    toggleBtn.title = isHidden ? 'Sembunyikan password' : 'Tampilkan password';
  });

  // support: toggle dengan keyboard (Enter / Space)
  toggleBtn.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleBtn.click();
    }
  });
});

