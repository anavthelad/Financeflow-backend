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

/* ----------------- LOAD DASHBOARD ----------------- */

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
      labels.push(new Date(t.date).toLocaleDateString());
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

  if (income > 0) {
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
  if (!labels.length) return;

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
        pointRadius: 4
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

/* ----------------- MODAL ----------------- */

openModalBtn.onclick = () => modal.classList.remove("hidden");

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden");
};

/* ----------------- ADD TRANSACTION ----------------- */

addBtn.onclick = async () => {
  if (!descInput.value || !amountInput.value) {
    alert("Fill all fields");
    return;
  }

  const type = typeDropdown?.dataset.value || "income";
  const category = categoryDropdown?.dataset.value || "Other";

  const res = await fetch(api + "/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      description: descInput.value,
      amount: Number(amountInput.value),
      category
    })
  });

  if (!res.ok) {
    alert("Failed to add transaction");
    return;
  }

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

/* ----------------- DROPDOWNS ----------------- */

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
}

setupDropdown(typeDropdown, typeValue);
setupDropdown(categoryDropdown, categoryValue);

/* ----------------- INIT ----------------- */

load();
