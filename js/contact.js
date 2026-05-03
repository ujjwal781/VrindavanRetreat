console.log("contact.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const btn = document.getElementById("contactBtn");

  const FUNCTION_URL =
    "https://hvvrvskeyxwkxkrpwvcj.supabase.co/functions/v1/send-contact-email";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    btn.disabled = true;
    btn.textContent = "Sending...";

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, message })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Contact email error:", errorText);
        throw new Error("Message failed");
      }

      showToast("Message sent successfully!", "success");
      form.reset();

    } catch (err) {
      console.log(err);
      showToast("Failed to send message.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Send Message";
    }
  });
});
