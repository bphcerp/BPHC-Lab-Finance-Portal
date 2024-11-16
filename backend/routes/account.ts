import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { AccountModel } from '../models/account';

const router = express.Router();

router.use(authenticateToken);

router.get('/:type', async (req: Request, res: Response) => {

    const { type } = req.params

    if (!type) {
        res.status(400).send("Mention the account type")
        return
    }

    try {
        const account = await AccountModel.find({ type });
        res.status(200).json(account);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account: ' + (error as Error).message });
    }
});

router.post('/entry', async (req: Request, res: Response) => {
    try {
        const { type, amount, credited, remarks } = req.body

        const entry = new AccountModel({
            type,
            amount,
            credited,
            remarks
        })

        const newEntry = await entry.save()
        res.status(200).json(newEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account: ' + (error as Error).message });
    }
});

router.post('/transfer', async (req: Request, res: Response) => {
    try {
        const { amount } = req.body

        try {      
            const savingsEntry = new AccountModel({
                type: 'Savings',
                amount,
                credited: true,
                remarks: `Transferred ${amount} from Current`
            });

            const currentEntry = new AccountModel({
                type: 'Current',
                amount,
                credited: false,
                remarks: `Transferred ${amount} to Savings`,
                transferable: -amount,
                transfer : savingsEntry._id
            });
        
            const [savedCurrentEntry, savedSavingsEntry] = await Promise.all([currentEntry.save(), savingsEntry.save()]);
        
            res.status(200).json({
                currentEntry: savedCurrentEntry,
                savingsEntry: savedSavingsEntry
            });
        
        } catch (error) {
            console.error('Error processing transaction:', error);
            res.status(500).json({ error: 'An error occurred while processing the transaction.' });
        }
        
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account: ' + (error as Error).message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const account = await AccountModel.findById(id);

        if (!account) {
            res.status(404).json({ message: 'Account not found' });
            return
        }

        if (account.transferable < 0) {
            const deletedAccount = await AccountModel.findByIdAndDelete(id);
            await AccountModel.findByIdAndDelete(deletedAccount!.transfer);
            res.status(200).json({ message: 'Account deleted successfully'});
            return
        }

        res.status(400).json({ message: 'Cannot delete non transfer account entry' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
});


export default router;
