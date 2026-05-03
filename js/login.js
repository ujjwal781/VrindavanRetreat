document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    btn.disabled = true;
    btn.textContent = "Logging in...";

    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Invalid login details");
      console.log(error);
      btn.disabled = false;
      btn.textContent = "Login";
      return;
    }

    window.location.href = "admin.html";
  });
});
