const api = "https://financeflow-backend-s8ze.onrender.com/api";

/* ---------------- ELEMENTS ---------------- */

const list = document.getElementById("list");
const balance = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");

const txCountEl = document.getElementById("txCount");
const avgExpenseEl = document.getElementById("avgExpense");
const savingsRateEl = document.getElementById("savingsRate");
const savingsLabelEl = document.querySelector(".small-label.success");

const lineCanvas = document.getElementById("spendingLineChart");

const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("openModal");
const addBtn = document.getElementById("add");
const clearBtn = document.getElementById("clearAll");

const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");

/* Soft dropdowns */
const typeDropdown = document.getElementById("typeDropdown");
const typeValue = document.getElementById("typeValue");

const categoryDropdown = document.getElementById("categoryDropdown");
const categoryValue = document.getElementById("categoryValue");

let chart;

/* ----------------- DASHBOARD ----------------- */

async function load() {
  const txs = await fetch(api + "/transactions").then(r => r.json());
  const s = await fetch(api + "/summary").then(r => r.json());

  const income = Number(s.income) || 0;
  const expense = Number(s.expense) || 0;
  const balanceVal = Number(s.balance) || 0;

  list.innerHTML = "";

  const expenseTimeline = [];
  const labels = [];

  txs.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="transaction-desc">${t.description}</span>
      <span class="transaction-amount ${t.type}">
        ${t.type === "income" ? "+" : "-"}₹${Number(t.amount).toFixed(2)}
      </span>`;
    list.appendChild(li);

    if (t.type === "expense") {
      expenseTimeline.push(Number(t.amount));
      labels.push(t.date ? new Date(t.date).toLocaleDateString() : "Tx");
    }
  });

  balance.textContent = "₹" + balanceVal.toFixed(2);
  incomeEl.textContent = "₹" + income.toFixed(2);
  expenseEl.textContent = "₹" + expense.toFixed(2);

  txCountEl.textContent = txs.length;

  const expenses = txs.filter(t => t.type === "expense");
  const avg = expenses.length
    ? expenses.reduce((a, b) => a + Number(b.amount), 0) / expenses.length
    : 0;

  avgExpenseEl.textContent = "₹" + avg.toFixed(2);

  let rate = 0;
  let label = "";

  if (income === 0 && expense > 0) label = "No income yet";
  else if (income > 0 && expense > income) {
    rate = ((income - expense) / income) * 100;
    label = "Overspending";
  } else if (income > 0) {
    rate = ((income - expense) / income) * 100;
    label = rate >= 20 ? "Great job!" : "Can improve";
  }

  savingsRateEl.textContent = rate.toFixed(1) + "%";
  savingsLabelEl.textContent = label;

  drawChart(labels, expenseTimeline);
}

/* ----------------- CHART ----------------- */

function drawChart(labels, data) {
  if (chart) chart.destroy();
  if (!labels.length) return (lineCanvas.style.display = "none");

  lineCanvas.style.display = "block";

  chart = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: "rgba(20,184,166,0.15)",
        borderColor: "#14b8a6",
        pointBackgroundColor: "#14b8a6",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

/* ----------------- MODAL ----------------- */

openModalBtn.onclick = () => modal.classList.remove("hidden");

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden");
};

addBtn.onclick = async () => {
  if (!descInput.value || !amountInput.value) return alert("Fill all fields");

  const type = typeDropdown?.dataset.value || "income";
  const category = categoryDropdown?.dataset.value || "Other";

  await fetch(api + "/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      description: descInput.value,
      amount: Number(amountInput.value),
      category
    })
  });

  modal.classList.add("hidden");
  descInput.value = "";
  amountInput.value = "";
  load();
};

/* ----------------- CLEAR ALL ----------------- */

clearBtn.onclick = async () => {
  if (!confirm("Clear all transactions?")) return;
  await fetch(api + "/transactions", { method: "DELETE" });
  load();
};

/* ----------------- SOFT DROPDOWN LOGIC ----------------- */

function setupDropdown(dropdown, valueEl) {
  if (!dropdown) return;
  const trigger = dropdown.querySelector(".soft-trigger");
  const items = dropdown.querySelectorAll(".soft-item");

  trigger.onclick = () => dropdown.classList.toggle("open");

  items.forEach(item => {
    item.onclick = () => {
      valueEl.textContent = item.textContent;
      dropdown.dataset.value = item.dataset.value;
      dropdown.classList.remove("open");
    };
  });

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });
}

setupDropdown(typeDropdown, typeValue);
setupDropdown(categoryDropdown, categoryValue);

/* ----------------- QUICK TIPS ----------------- */

const tips = [
  ["Track every expense to understand your spending patterns", "Review subscriptions monthly to cut unnecessary costs"],
  ["Aim for a 20% savings rate for long-term financial health", "Set a monthly budget and stick to it"],
  ["Create an emergency fund with 3–6 months of expenses", "Automate your savings so you don’t forget"],
  ["Avoid impulse purchases — wait 24 hours before buying", "Separate needs from wants when spending"],
  ["Pay off high-interest debt as a priority", "Avoid minimum payments on credit cards"],
  ["Invest early to benefit from compounding", "Diversify your investments to reduce risk"]
];

let tipIndex = 0;
const tipsList = document.getElementById("tipsList");
const tipsCard = document.getElementById("tipsCard");

function renderTip() {
  if (!tipsList) return;
  tipsList.style.opacity = 0;

  setTimeout(() => {
    tipsList.innerHTML = tips[tipIndex].map(t => `<li>${t}</li>`).join("");
    tipsList.style.opacity = 1;
    tipIndex = (tipIndex + 1) % tips.length;
  }, 250);
}

renderTip();
let tipInterval = setInterval(renderTip, 4000);

let startX = 0;
let isSwiping = false;

if (tipsCard) {
  tipsCard.addEventListener("touchstart", e => { startX = e.touches[0].clientX; isSwiping = true; });
  tipsCard.addEventListener("touchend", e => { if (isSwiping) handleSwipe(e.changedTouches[0].clientX - startX); isSwiping = false; });
  tipsCard.addEventListener("mousedown", e => { startX = e.clientX; isSwiping = true; });
  tipsCard.addEventListener("mouseup", e => { if (isSwiping) handleSwipe(e.clientX - startX); isSwiping = false; });
}

function handleSwipe(deltaX) {
  if (Math.abs(deltaX) < 40) return;
  tipIndex = deltaX < 0 ? (tipIndex + 1) % tips.length : (tipIndex - 1 + tips.length) % tips.length;
  renderTip();
  clearInterval(tipInterval);
  tipInterval = setInterval(renderTip, 4000);
}

/* ----------------- INIT ----------------- */

load();
