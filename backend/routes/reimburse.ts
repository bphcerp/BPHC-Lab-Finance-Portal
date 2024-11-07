import express, { Request, Response } from 'express';
import { ReimbursementModel } from '../models/reimburse';
import { ExpenseModel } from '../models/expense';
import { authenticateToken } from '../middleware/authenticateToken';
import mongoose from 'mongoose';
import { ProjectModel } from '../models/project';
import { AccountModel } from '../models/account';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
    try {
        const reimbursements = await ReimbursementModel.find().sort({ paidStatus: 1, createdAt: -1 }).populate('project expenses');
        res.status(200).json(reimbursements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reimbursements: ' + (error as Error).message });
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

router.post('/paid', async (req: Request, res: Response) => {
    try {
        const { reimbursementIds } = req.body;

        if (!Array.isArray(reimbursementIds) || reimbursementIds.length === 0) {
            res.status(400).json({ message: 'Invalid input. Please provide an array of reimbursement IDs.' });
            return;
        }

        const reimbursements = await ReimbursementModel.find({ _id: { $in: reimbursementIds } })
            .populate<{ expenses : {amount : number, settled : { type : String }}[] }>({
                path: 'expenses',
                populate: {
                    path: 'settled',
                    select: 'type'
                }
            });


        if (!reimbursements || reimbursements.length === 0) {
            res.status(404).json({ message: 'No reimbursements found with the provided IDs.' });
            return;
        }

        let totalTransferableAmount = 0, amount = 0;
        reimbursements.forEach(reimbursement => {
            amount += reimbursement.totalAmount
            reimbursement.expenses.forEach(expense => {

                if (expense.settled?.type === "Savings") {
                    totalTransferableAmount += expense.amount;
                }
            });
        });

        await new AccountModel({
            amount,
            type: "Current",
            remarks: "Reimbursement money",
            credited: true,
            transferable: totalTransferableAmount
        }).save();

        await ReimbursementModel.updateMany(
            { _id: { $in: reimbursementIds } },
            { paidStatus: true }
        );

        const updatePromises = reimbursements.map(reimbursement => {
            const { totalAmount, projectHead, project } = reimbursement;
            return ProjectModel.findByIdAndUpdate(
                project,
                {
                    $inc: { [`project_head_expenses.${projectHead}`]: totalAmount }
                }
            );
        });

        await Promise.all(updatePromises);

        res.status(200).json({ message: 'Reimbursements updated successfully, and project head expenses updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reimbursements: ' + (error as Error).message });
    }
});



router.post('/', async (req: Request, res: Response) => {
    try {
        const { expenseIds, projectId, projectHead, totalAmount, title, description } = req.body;

        const reimbursement = new ReimbursementModel({
            project: projectId,
            expenses: expenseIds,
            projectHead,
            totalAmount,
            title,
            description,
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