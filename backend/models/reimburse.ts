import mongoose, { Schema } from 'mongoose';

const reimbursementSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title : {type : String, required : true},
    totalAmount : {type : Number, required : true},
    projectHead: { type: String, required: true },
    expenses: [{ type: Schema.Types.ObjectId, ref: 'Expense', required: true }],
    createdAt: { type: Date, default: Date.now },
});

export const ReimbursementModel = mongoose.model('Reimbursement', reimbursementSchema);