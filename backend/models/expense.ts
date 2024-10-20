import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  expenseReason: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  reimbursedStatus: { type: Boolean, default: false },
  paidBy : {type : String, required : true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

expenseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const ExpenseModel = mongoose.model('Expense', expenseSchema);
