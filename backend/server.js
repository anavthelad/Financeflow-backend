const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const { incomeStack, expenseQueue } = require("./dataStore");

const app = express();
const DATA_FILE = path.join(__dirname, "transactions.json");

/* ---------- Middleware ---------- */
app.use(express.json());

// 🔥 Allow all origins (fixes CORS for Netlify + Render)
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.options("*", cors());

/* ---------- Persistence ---------- */
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
  } catch (e) {
    console.error("Load failed:", e);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Save failed:", e);
  }
}

let transactions = loadData();

/* ---------- Routes ---------- */
app.get("/", (_, res) => res.send("FinanceFlow backend is running"));

app.get("/api/transactions", (_, res) => res.json(transactions));

app.post("/api/transactions", (req, res) => {
  const { type, description, amount, category } = req.body;

  if (!type || !description || amount == null) {
    return res.status(400).json({ error: "Missing fields" });
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

app.get("/api/summary", (_, res) => {
  const income = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);

  res.json({ balance: income - expense, income, expense, count: transactions.length });
});

app.delete("/api/transactions", (_, res) => {
  transactions = [];
  saveData(transactions);
  incomeStack.items.length = 0;
  expenseQueue.items.length = 0;
  res.json({ ok: true });
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
