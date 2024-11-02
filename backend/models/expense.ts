import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  expenseReason: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
  amount: { type: Number, required: true },
  reimbursedID: { type: mongoose.Schema.Types.ObjectId, ref: 'reimbursements', default: null },
  paidBy: { type: String, required: true },
  settled: { type: String, enum: ['Current', 'Savings', null], default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

expenseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const ExpenseModel = mongoose.model('Expense', expenseSchema);
