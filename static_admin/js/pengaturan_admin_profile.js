const avatarWrapper = document.querySelector(".avatar-wrapper");
const avatarFile = document.getElementById("avatarFile");
const pvAvatar = document.getElementById("pvAvatar");
const profileHeaderImg = document.querySelector(".profile-header-img");
const toast = document.getElementById("toast");

avatarWrapper?.addEventListener("click", () => {
    avatarFile.click();
});

avatarFile?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        pvAvatar.src = reader.result;
        if (profileHeaderImg) profileHeaderImg.src = reader.result;

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

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("updated") === "1") {
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 2000);
    }
});

