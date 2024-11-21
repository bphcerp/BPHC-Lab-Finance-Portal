import express, { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense';
import { CategoryModel } from '../models/category';
import { authenticateToken } from '../middleware/authenticateToken';
import { ObjectId, Schema } from 'mongoose';
import { AccountModel } from '../models/account';

const router = express.Router();

interface ExpenseRequest {
  category: ObjectId;
  amount: number;
  description: string;
  paidBy: ObjectId;
  reimbursedID?: ObjectId;
  settled?: 'Current' | 'Savings' | null;
}

interface MemberExpenseSummary {
  memberId: ObjectId;
  memberName: string;
  totalPaid: number;
  totalSettled: number;
  totalDue: number;
}

router.use(authenticateToken);

const VALID_SETTLED_STATUS = ['Current', 'Savings'] as const;

const validateCategory = async (categoryId: Schema.Types.ObjectId): Promise<boolean> => {
  const categoryExists = await CategoryModel.findById(categoryId);
  return !!categoryExists;
};

router.post('/', async (req: Request, res: Response) => {
  const expenseData = req.body as ExpenseRequest;

  try {
    if (!await validateCategory(expenseData.category)) {
      res.status(400).json({ message: 'Invalid category ID' });
      return;
    }

    const expense = new ExpenseModel({
      ...expenseData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expense.save();
    await expense.populate('category paidBy');
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const expensesData = await ExpenseModel.find()
      .populate<{ reimbursedID: { _id: ObjectId; title: string; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate<{ settled: { _id: Schema.Types.ObjectId, type: string } }>('settled')
      .populate('category paidBy')
      .lean();

    const expenses = expensesData.sort((a, b) => {
      const aPaidStatus = a.reimbursedID?.paidStatus ?? false;
      const bPaidStatus = b.reimbursedID?.paidStatus ?? false;

      const reimbursementSort = (a.reimbursedID === null ? 0 : 1) - (b.reimbursedID === null ? 0 : 1) ||
        (aPaidStatus ? 1 : 0) - (bPaidStatus ? 1 : 0);

      if (reimbursementSort !== 0) return reimbursementSort;

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.status(200).send(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/passbook', async (req: Request, res: Response) => {
  const { type } = req.query;

  try {
    const expenses = await ExpenseModel.find({ settled: type })
      .populate<{ reimbursedID: { _id: ObjectId; title: string; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate('category paidBy')
      .lean();

    res.status(200).send(expenses);
  } catch (error) {
    console.error('Error fetching passbook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/totaldue', async (req: Request, res: Response) => {
  try {
    const [result] = await ExpenseModel.aggregate([
      { $match: { reimbursedID: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      total_due: result?.totalAmount || 0,
    });
  } catch (error) {
    console.error('Error calculating total due:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/unsettled', async (req: Request, res: Response) => {
  try {
    const [result] = await ExpenseModel.aggregate([
      { $match: { settled: null } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      total_unsettled: result?.totalAmount || 0,
    });
  } catch (error) {
    console.error('Error calculating unsettled total:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/settle', async (req: Request, res: Response) => {
  try {
    const { ids, type, amount, remarks } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Invalid or empty ids array' });
      return;
    }

    if (!VALID_SETTLED_STATUS.includes(type)) {
      res.status(400).json({
        message: `Invalid settled status. Must be one of: ${VALID_SETTLED_STATUS.join(', ')}`,
      });
      return;
    }

    const accountEntry = await new AccountModel({
      amount,
      type,
      remarks: remarks ?? 'Settled Expenses',
      credited: false,
    }).save();

    const result = await ExpenseModel.updateMany(
      { _id: { $in: ids } },
      { settled: accountEntry._id }
    );

    res.status(200).json({
      message: 'Expenses settled successfully',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error settling expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/settle/:memberId', async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const { settlementType, remarks, amount } = req.body;

  try {
    if (!['Current', 'Savings'].includes(settlementType)) {
      res.status(400).json({ message: 'Invalid settlement type' });
      return;
    }

    const accountEntry = new AccountModel({
      amount,
      type: settlementType,
      remarks,
      credited: false,
    });

    await accountEntry.save();

    const result = await ExpenseModel.updateMany(
      { paidBy: memberId, settled: null },
      { settled: accountEntry._id }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Settled expenses for member' });
    } else {
      res.status(404).json({ message: 'No unsettled expenses found for member' });
    }
  } catch (error) {
    console.error('Error settling member expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/member-expenses', async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseModel.find()
      .populate<{ paidBy: { _id: Schema.Types.ObjectId, name: string } }>('paidBy')
      .populate<{ settled: { _id: Schema.Types.ObjectId, type: string } }>('settled')
      .lean();

    const memberExpenses: Record<string, MemberExpenseSummary> = {};

    expenses.forEach(expense => {
      const memberName = expense.paidBy.name;

      if (!memberExpenses[memberName]) {
        memberExpenses[memberName] = {
          memberId: expense.paidBy._id as ObjectId,
          memberName,
          totalPaid: 0,
          totalSettled: 0,
          totalDue: 0,
        };
      }

      memberExpenses[memberName].totalPaid += expense.amount;

      if (expense.settled && (expense.settled.type === 'Current' || expense.settled.type === 'Savings')) {
        memberExpenses[memberName].totalSettled += expense.amount;
      } else {
        memberExpenses[memberName].totalDue += expense.amount;
      }
    });

    const result: MemberExpenseSummary[] = Object.values(memberExpenses);

    res.json(result);
  } catch (error) {
    console.error('Error fetching member expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const expenseData = req.body as ExpenseRequest;

  try {
    if (!await validateCategory(expenseData.category)) {
      res.status(400).json({ message: 'Invalid category ID' });
      return;
    }

    const updatedExpense = await ExpenseModel.findByIdAndUpdate(
      id,
      {
        ...expenseData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedExpense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    await updatedExpense.populate('category paidBy');

    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;