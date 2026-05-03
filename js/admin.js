console.log("ADMIN JS RUNNING");
document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // AUTH PROTECTION
  // =========================
  const { data: sessionData } = await window.supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "login.html";
    return;
  }

  // =========================
  // LOGOUT
  // =========================
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  }

  // =========================
  // ELEMENTS
  // =========================
  const tableBody = document.querySelector("#bookingTable tbody");
  const calendarEl = document.getElementById("calendar");

  const totalBookingsEl = document.getElementById("totalBookings");
  const totalGuestsEl = document.getElementById("totalGuests");
  const upcomingBookingsEl = document.getElementById("upcomingBookings");
  const monthlyIncomeEl = document.getElementById("monthlyIncome");

  // =========================
  // FETCH BOOKINGS
  // =========================
  const { data, error } = await window.supabaseClient
    .from("bookings")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.log(error);
    alert("Failed to load bookings");
    return;
  }

  // =========================
  // MONTH-WISE STATS
  // =========================
  function updateStatsForMonth(start, end) {
    const monthBookings = data.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= start && bookingDate < end;
    });

    totalBookingsEl.textContent = monthBookings.length;

    totalGuestsEl.textContent = monthBookings.reduce((sum, booking) => {
      return sum + Number(booking.guests || 0);
    }, 0);

    const today = new Date();

    upcomingBookingsEl.textContent = monthBookings.filter((booking) => {
      return new Date(booking.date) >= today;
    }).length;

    const monthlyIncome = monthBookings.reduce((sum, booking) => {
      return sum + Number(booking.amount || 0);
    }, 0);

    monthlyIncomeEl.textContent = `₹${monthlyIncome}`;
  }

  // =========================
  // TABLE
  // =========================
  tableBody.innerHTML = "";

  data.forEach((booking) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.email}</td>
      <td>${booking.phone}</td>
      <td>${booking.date}</td>
      <td>${booking.guests}</td>
      <td>${booking.package || "-"}</td>
      <td>₹${booking.amount || 0}</td>
      <td>${booking.payment_status || "pending"}</td>
      <td>
        ${
          booking.payment_status === "paid"
            ? `<span class="paid-badge">Paid</span>`
            : `<button class="pay-btn" data-id="${booking.id}">Mark Paid</button>`
        }
      </td>
    `;

    tableBody.appendChild(row);
  });

  // =========================
  // MARK AS PAID
  // =========================
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("pay-btn")) {
      const id = e.target.dataset.id;

      const { error } = await window.supabaseClient
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", id);

      document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("pay-btn")) {
    const btn = e.target;
    const id = btn.dataset.id;

    btn.disabled = true;
    btn.textContent = "Updating...";

    const { error } = await window.supabaseClient
      .from("bookings")
      .update({ payment_status: "paid" })
      .eq("id", id);

    if (error) {
      console.log(error);
      showToast("Failed to update payment", "error");

      btn.disabled = false;
      btn.textContent = "Mark Paid";
      return;
    }

    showToast("Payment marked as paid", "success");

    const paidBadge = document.createElement("span");
    paidBadge.className = "paid-badge";
    paidBadge.textContent = "Paid";

    btn.replaceWith(paidBadge);
  }
});
    }
  });

  // =========================
  // CALENDAR
  // =========================
  const events = data.map((booking) => ({
    title: `${booking.name} - ₹${booking.amount || 0}`,
    start: booking.date,
    allDay: true,
    extendedProps: {
      email: booking.email,
      phone: booking.phone,
      guests: booking.guests,
      package: booking.package,
      amount: booking.amount,
      payment_status: booking.payment_status
    }
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 620,
    events: events,

    datesSet: function(info) {
      updateStatsForMonth(info.start, info.end);
    },

    eventClick: function(info) {
      alert(
        `Booking Details\n\n` +
        `Name: ${info.event.title}\n` +
        `Date: ${info.event.startStr}\n` +
        `Package: ${info.event.extendedProps.package || "-"}\n` +
        `Amount: ₹${info.event.extendedProps.amount || 0}\n` +
        `Guests: ${info.event.extendedProps.guests || "-"}\n` +
        `Payment: ${info.event.extendedProps.payment_status || "pending"}\n` +
        `Email: ${info.event.extendedProps.email}\n` +
        `Phone: ${info.event.extendedProps.phone}`
      );
    }
  });

  calendar.render();

  // =========================
// REALTIME UPDATES
// =========================
window.supabaseClient
  .channel("bookings-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "bookings"
    },
    (payload) => {
      console.log("Realtime change:", payload);

      showToast("Dashboard updated", "info");

      setTimeout(() => {
        location.reload();
      }, 700);
    }
  )
  .subscribe();
});
