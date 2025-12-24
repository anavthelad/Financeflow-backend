const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const { incomeStack, expenseQueue } = require("./dataStore");

const app = express();

/* ---------- Config ---------- */
const DATA_FILE = path.join(__dirname, "transactions.json");

/* ---------- Middleware ---------- */
app.use(express.json());

app.use(cors({
  origin: [
    "https://financeflowdashboard.netlify.app",
    "https://financeflowdashboard1.netlify.app"
  ],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// Handle preflight explicitly (important for browsers)
app.options("*", cors());

/* ---------- Persistence ---------- */
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Failed to load data:", err);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to save data:", err);
  }
}

let transactions = loadData();

/* ---------- Routes ---------- */
app.get("/", (req, res) => {
  res.send("FinanceFlow backend is running");
});

app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

app.post("/api/transactions", (req, res) => {
  const { type, description, amount, category } = req.body;

  if (!type || !description || amount == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const tx = {
    id: uuid(),
    type,
    description,
    amount: Number(amount),
    category: category || "Other",
    date: new Date().toISOString()
  };

  if (tx.type === "income") incomeStack.push(tx);
  else expenseQueue.enqueue(tx);

  transactions.unshift(tx);
  saveData(transactions);

  res.status(201).json(tx);
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
  incomeStack.items.length = 0;
  expenseQueue.items.length = 0;
  res.json({ ok: true });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
