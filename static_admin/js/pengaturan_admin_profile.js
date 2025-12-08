/* ============================
   UPLOAD & PREVIEW FOTO PROFIL
   ============================ */

const avatarWrapper = document.querySelector(".avatar-wrapper");
const avatarFile = document.getElementById("avatarFile");
const pvAvatar = document.getElementById("pvAvatar");
const profileHeaderImg = document.querySelector(".profile-header-img");
const toast = document.getElementById("toast");

// Klik pada foto → buka file picker
avatarWrapper?.addEventListener("click", () => {
    avatarFile.click();
});

// Ketika file dipilih
avatarFile?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        // Preview langsung
        pvAvatar.src = reader.result;
        if (profileHeaderImg) profileHeaderImg.src = reader.result;

        // Upload ke backend
        const formData = new FormData();
        formData.append("photo", file);

        fetch("/admin/pengaturan/upload-photo", {
            method: "POST",
            body: formData,
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === "success") {
                toast.classList.remove("hidden");
                toast.innerHTML = `<i class="bi bi-check-circle"></i> ${data.message}`;
                setTimeout(() => toast.classList.add("hidden"), 1600);
            } else {
                alert(data.message);
            }
        })
        .catch((err) => console.error(err));
    };

    reader.readAsDataURL(file);
});


/* ============================
   MODAL OPEN & CLOSE
   ============================ */

const btnEdit = document.getElementById("btnEditProfile");
const modal = document.getElementById("modalEdit");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("btnCancel");

btnEdit?.addEventListener("click", () => {
    modal.classList.remove("hidden");
});

closeBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
});

cancelBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// Klik area luar modal → close
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});


/* ============================
   NOTIFIKASI UPDATE BERHASIL
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("updated") === "1") {
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 2000);
    }
});

