const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuid } = require("uuid");
const { incomeStack, expenseQueue } = require("./dataStore");
const fs = require("fs");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(cors({
  origin: [
    "https://financeflowdashboard.netlify.app",
    "https://financeflowdashboard1.netlify.app"
  ],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));

/* ---------- Middleware ---------- */
app.use(express.json());

app.use(cors({
  origin: "https://financeflowdashboard.netlify.app",
  methods: ["GET", "POST", "DELETE"],
}));

// If you are NOT serving frontend from backend in production, you can remove this later
app.use(express.static(path.join(__dirname, "frontend")));

/* ---------- In-memory store ---------- */
let transactions = loadData();

/* ---------- Routes ---------- */
app.get("/", (req, res) => {
  res.send("FinanceFlow backend is running");
});

app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

app.post("/api/transactions", (req, res) => {
  const tx = {
    id: uuid(),
    type: req.body.type,
    description: req.body.description,
    amount: Number(req.body.amount),
    category: req.body.category,
    date: new Date().toISOString()
  };

  if (tx.type === "income") incomeStack.push(tx);
  else expenseQueue.enqueue(tx);

  transactions.unshift(tx);
  saveData(transactions);
  res.json(tx);

});

app.get("/api/summary", (req, res) => {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);

  res.json({
    balance: income - expense,
    income,
    expense,
    count: transactions.length
  });
});

app.delete("/api/transactions", (req, res) => {
  transactions.length = 0;
saveData(transactions);
res.json({ ok: true });
  incomeStack.items.length = 0;
  expenseQueue.items.length = 0;
  res.json({ ok: true });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
