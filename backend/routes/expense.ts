import express, { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense'; // Adjust path as necessary

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const expenseData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const expense = new ExpenseModel(expenseData);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error creating expense: ' + (error as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseModel.find();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses: ' + (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
    } else {
      res.status(200).json(expense);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense: ' + (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedExpense = await ExpenseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedExpense) {
      res.status(404).json({ message: 'Expense not found' });
    } else {
      res.status(200).json(updatedExpense);
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating expense: ' + (error as Error).message });
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
