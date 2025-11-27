const avatarWrapper = document.querySelector('.avatar-wrapper');
const avatarFile = document.getElementById("avatarFile");
const pvAvatar = document.getElementById("pvAvatar");
const profileHeaderImg = document.querySelector(".profile-header-img");
const toast = document.getElementById("toast");

avatarWrapper?.addEventListener('click', () => avatarFile.click());

avatarFile?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    // preview langsung
    pvAvatar.src = reader.result;
    if (profileHeaderImg) profileHeaderImg.src = reader.result;

    // Upload ke backend
    const formData = new FormData();
    formData.append("photo", file);

    fetch("/admin/pengaturan/upload-photo", {
      method: "POST",
      body: formData,
    })
    .then(res => res.json())
    .then(data => {
      if(data.status === "success"){
        toast.classList.remove("hidden");
        toast.innerHTML = `<i class="bi bi-check-circle"></i> ${data.message}`;
        setTimeout(() => toast.classList.add("hidden"), 1600);
      } else {
        alert(data.message);
      }
    })
    .catch(err => console.error(err));
  };

  reader.readAsDataURL(file);
});
