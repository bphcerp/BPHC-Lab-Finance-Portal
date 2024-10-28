import express, { Request, Response } from 'express';
import { ReimbursementModel } from '../models/reimburse';
import { ExpenseModel } from '../models/expense';
import { authenticateToken } from '../middleware/authenticateToken';
import mongoose from 'mongoose';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
    try {
        const reimbursements = await ReimbursementModel.find().populate('project expenses');
        res.status(200).json(reimbursements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
    }
});

router.get('/total-expenses/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Use aggregation to group expenses by projectHead and sum totalAmount
        const totalExpenses = await ReimbursementModel.aggregate([
            {
                $match: { project: new mongoose.Types.ObjectId(projectId) }
            },
            {
                $group: {
                    _id: "$projectHead",
                    totalExpense: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Format the result to an object with heads as keys and total expenses as values
        const expensesByHead: { [key: string]: number } = {};
        
        totalExpenses.forEach((item: { _id: string; totalExpense: number }) => {
            expensesByHead[item._id] = item.totalExpense;
        });

        res.status(200).json(expensesByHead);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching total expenses: ' + (error as Error).message });
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const reimbursements = await ReimbursementModel.find({ project: projectId }).populate('expenses');
        res.status(200).json(reimbursements);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
    }
});

router.get('/:projectId/:head', async (req, res) => {
    try {
        const { projectId, head } = req.params;
        const reimbursements = await ReimbursementModel.find({ project: projectId, projectHead: head }).populate('expenses');
        res.status(200).json(reimbursements);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const { expenseIds, projectId, projectHead, totalAmount, title } = req.body;

        const reimbursement = new ReimbursementModel({
            project: projectId,
            expenses: expenseIds,
            projectHead,
            totalAmount,
            title,
            submittedAt: new Date(),
        });

        await reimbursement.save();

        await ExpenseModel.updateMany(
            { _id: { $in: expenseIds } },
            { reimbursedID: reimbursement._id }
        );

        await reimbursement.populate('project expenses')

        res.status(201).json(reimbursement);
    } catch (error) {
        res.status(400).json({ message: 'Error creating reimbursement: ' + (error as Error).message });
    }
});

export default router;
