import mongoose, { Schema } from 'mongoose';
import { ExpenseModel } from './expense';

const reimbursementSchema = new Schema({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    projectHead: { type: String, required: true },
    expenses: [{ type: Schema.Types.ObjectId, ref: 'Expense', required: true }],
    paidStatus: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

reimbursementSchema.post('updateMany', async function (res) {
    // Access the filter used in the updateMany operation
    const filter = this.getFilter();

    // Find all updated reimbursement IDs
    const updatedReimbursementIds = await ReimbursementModel.find(filter).select('_id');

    // Extract the IDs into an array
    const reimbursementIds = updatedReimbursementIds.map(doc => new mongoose.Types.ObjectId(doc._id));

    // Update the related expenses' paidStatus to true
    await ExpenseModel.updateMany(
        { reimbursedID: { $in: reimbursementIds } },
        { paidStatus: true }
    );
});

export const ReimbursementModel = mongoose.model('reimbursements', reimbursementSchema);