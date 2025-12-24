class Stack {
  constructor() { this.items = []; }
  push(item) { this.items.push(item); }
  pop() { return this.items.pop(); }
  getAll() { return this.items; }
}

class Queue {
  constructor() { this.items = []; }
  enqueue(item) { this.items.push(item); }
  dequeue() { return this.items.shift(); }
  getAll() { return this.items; }
}

const incomeStack = new Stack();
const expenseQueue = new Queue();

module.exports = { incomeStack, expenseQueue };
