document.addEventListener("DOMContentLoaded", async () => {
  console.log("booking.js loaded");

  const form = document.getElementById("bookingForm");
  const btn = document.getElementById("submitBtn");

  const packageInput = document.getElementById("package");
  const amountInput = document.getElementById("amount");
  const paymentModeInput = document.getElementById("paymentMode");

  const FUNCTION_URL =
    "https://hvvrvskeyxwkxkrpwvcj.supabase.co/functions/v1/send-booking-email";

  const prices = {
    Silver: 6000,
    Golden: 15000,
    Premium: 20000
  };

  function updateSummary() {
    document.getElementById("summaryName").textContent =
      document.getElementById("name").value || "-";

    document.getElementById("summaryEmail").textContent =
      document.getElementById("email").value || "-";

    document.getElementById("summaryPhone").textContent =
      document.getElementById("phone").value || "-";

    document.getElementById("summaryDate").textContent =
      document.getElementById("date").value || "-";

    document.getElementById("summaryGuests").textContent =
      document.getElementById("guests").value || "-";

    document.getElementById("summaryPackage").textContent =
      packageInput.value || "-";

    document.getElementById("summaryAmount").textContent =
      amountInput.value || "-";

    document.getElementById("summaryPayment").textContent =
      paymentModeInput.value || "cash";
  }

  const params = new URLSearchParams(window.location.search);
  const selectedPackageFromUrl = params.get("package");
  const selectedAmountFromUrl = params.get("amount");

  if (selectedPackageFromUrl) {
    packageInput.value = selectedPackageFromUrl;
    amountInput.value =
      selectedAmountFromUrl || prices[selectedPackageFromUrl] || "";
  }

  packageInput.addEventListener("change", () => {
    amountInput.value = prices[packageInput.value] || "";
    updateSummary();
  });

  async function initDatePicker() {
    let bookedDates = [];

    const { data, error } = await window.supabaseClient
      .from("bookings")
      .select("date");

    if (error) {
      console.log("Date fetch error:", error);
    } else {
      bookedDates = data.map((item) => item.date);
    }

    flatpickr("#date", {
      minDate: "today",
      dateFormat: "Y-m-d",
      disable: bookedDates,
      allowInput: false
    });
  }

  await initDatePicker();

  document.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", updateSummary);
    field.addEventListener("change", updateSummary);
  });

  updateSummary();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const guests = document.getElementById("guests").value;

    const selectedPackage = packageInput.value;
    const amount = Number(amountInput.value);
    const payment_mode = paymentModeInput.value;
    const payment_status = "pending";

    btn.disabled = true;
    btn.textContent = "Booking...";

    try {
      const { data: existing, error: checkError } = await window.supabaseClient
        .from("bookings")
        .select("id")
        .eq("date", date);

      if (checkError) {
        console.log(checkError);
        alert("Error checking availability: " + checkError.message);
        return;
      }

      if (existing.length > 0) {
        showToast("Selected date is already booked!", "error");
        return;
      }

      const { error } = await window.supabaseClient
        .from("bookings")
        .insert([
          {
            name,
            email,
            phone,
            date,
            guests,
            package: selectedPackage,
            amount,
            payment_mode,
            payment_status
          }
        ]);

      if (error) {
        console.log(error);
        showToast("Booking failed. Try again.", "error");
        return;
      }

      const emailResponse = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey : window.SUPABASE_KEY,
          Authorization: `Bearer ${window.SUPABASE_KEY}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          date,
          guests,
          package: selectedPackage,
          amount
        })
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.log("Email function error:", errorText);
        throw new Error("Email failed");
      }

      showToast("Booking confirmed successfully!", "success");

      form.reset();

      document.querySelectorAll("span[id^='summary']").forEach((el) => {
        el.textContent = "-";
      });

      document.getElementById("summaryPayment").textContent = "cash";

      await initDatePicker();
    } catch (err) {
      console.log(err);
      alert("Booking saved, but email could not be sent.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Confirm Booking";
    }
  });
});
