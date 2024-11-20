import mongoose, { Schema } from 'mongoose';

const reimbursementSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    projectHead: { type: String, required: true },
    expenses: [{ type: Schema.Types.ObjectId, ref: 'Expense', required: true }],
    paidStatus: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    description : {type : String, default : null},
    reference_id: { type: Schema.Types.ObjectId, ref: 'references.files' }
});

export const ReimbursementModel = mongoose.model('reimbursements', reimbursementSchema);