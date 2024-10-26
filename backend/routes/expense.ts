import express, { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense'; 
import { CategoryModel } from '../models/category';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { category, ...expenseData } = req.body;

    const categoryExists = await CategoryModel.findById(category);
    if (!categoryExists) {
      res.status(400).json({ message: 'Invalid category ID' });
    }

    const expense = new ExpenseModel({
      ...expenseData,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expense.save()
    await expense.populate('category')
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error creating expense: ' + (error as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseModel.find()
      .populate('category')
      .sort({ settled:1,reimbursedID: 1, createdAt: 1 });
      
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses: ' + (error as Error).message });
  }
});

router.get('/totaldue', async (req: Request, res: Response) => {
  try {
    const totalDue = await ExpenseModel.aggregate([
      { $match: { reimbursedID: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const total = totalDue.length > 0 ? totalDue[0].totalAmount : 0;
    res.status(200).json({ total_due: total });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating total due: ' + (error as Error).message });
  }
})

router.get('/unsettled', async (req: Request, res: Response) => {
  try {
    const totalUnsettled = await ExpenseModel.aggregate([
      { $match: { settled: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const total = totalUnsettled.length > 0 ? totalUnsettled[0].totalAmount : 0;
    res.status(200).json({ total_unsettled: total });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating total unsettled expenses: ' + (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id).populate('category');
    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
    } else {
      res.status(200).json(expense);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense: ' + (error as Error).message });
  }
});

router.patch('/settle', async (req: Request, res: Response) => {
  try {
      const { ids, settledStatus } = req.body;

      if (!Array.isArray(ids) || !['Current', 'Savings'].includes(settledStatus)) {
          res.status(400).json({ message: 'Invalid input' });
      }

      const updatedExpenses = await ExpenseModel.updateMany(
          { _id: { $in: ids } },
          { settled: settledStatus }
      );

      res.status(200).json({ message: 'Expenses settled successfully', updatedCount: updatedExpenses.modifiedCount });
  } catch (error) {
      res.status(500).json({ message: 'Error settling expenses: ' + (error as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deletedExpense = await ExpenseModel.findByIdAndDelete(req.params.id);
    if (!deletedExpense) {
      res.status(404).json({ message: 'Expense not found' });
    } else {
      res.status(204).json();
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense: ' + (error as Error).message });
  }
});

export default router;
