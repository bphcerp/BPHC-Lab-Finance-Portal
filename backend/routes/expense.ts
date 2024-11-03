import express, { Request, Response, NextFunction } from 'express';
import { ExpenseModel } from '../models/expense';
import { CategoryModel } from '../models/category';
import { authenticateToken } from '../middleware/authenticateToken';
import { ObjectId, Schema } from 'mongoose';

const router = express.Router();

interface ExpenseRequest {
  category: ObjectId;
  amount: number;
  description: string;
  paidBy : ObjectId
  reimbursedID?: ObjectId;
  settled?: 'Current' | 'Savings' | null;
}

interface MemberExpenseSummary {
  memberId : ObjectId
  memberName: string;
  totalPaid: number;
  totalSettled: number;
  totalDue: number;
}

// Error Handler
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware
router.use(authenticateToken);

// Constants
const ITEMS_PER_PAGE = 5;
const VALID_SETTLED_STATUS = ['Current', 'Savings'] as const;

// Validation
const validateCategory = async (categoryId: Schema.Types.ObjectId): Promise<boolean> => {
  const categoryExists = await CategoryModel.findById(categoryId);
  return !!categoryExists;
};

// Routes
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, ...expenseData } = req.body as ExpenseRequest;

  if (!await validateCategory(category)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const expense = new ExpenseModel({
    ...expenseData,
    category,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await expense.save();
  await expense.populate('category');
  return res.status(201).json(expense);
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [allExpenses, totalExpenses] = await Promise.all([
    ExpenseModel.find()
      .populate<{ reimbursedID: { _id: ObjectId; title: string; paidStatus: boolean } }>({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate('category paidBy')
      .lean(),
    ExpenseModel.countDocuments()
  ]);
  
  const sortedExpenses = allExpenses.sort((a, b) => {
    const aPaidStatus = a.reimbursedID?.paidStatus ?? false;
    const bPaidStatus = b.reimbursedID?.paidStatus ?? false;
  
    return (a.reimbursedID === null ? 0 : 1) - (b.reimbursedID === null ? 0 : 1) ||
           (aPaidStatus ? 1 : 0) - (bPaidStatus ? 1 : 0);
  });
  
  const expenses = sortedExpenses.slice(skip, skip + ITEMS_PER_PAGE)

  const totalPages = Math.ceil(totalExpenses / ITEMS_PER_PAGE);

  return res.status(200).json({
    expenses,
    pagination: {
      currentPage: page,
      totalPages,
      totalExpenses,
      itemsPerPage: ITEMS_PER_PAGE
    }
  });
}));

router.get('/totaldue', asyncHandler(async (req: Request, res: Response) => {
  const [result] = await ExpenseModel.aggregate([
    { $match: { reimbursedID: null } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
  ]);

  return res.status(200).json({ 
    total_due: result?.totalAmount || 0 
  });
}));

router.get('/unsettled', asyncHandler(async (req: Request, res: Response) => {
  const [result] = await ExpenseModel.aggregate([
    { $match: { settled: null } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
  ]);

  return res.status(200).json({ 
    total_unsettled: result?.totalAmount || 0 
  });
}));

router.patch('/settle', asyncHandler(async (req: Request, res: Response) => {
  const { ids, settledStatus } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty ids array' });
  }

  if (!VALID_SETTLED_STATUS.includes(settledStatus)) {
    return res.status(400).json({ 
      message: `Invalid settled status. Must be one of: ${VALID_SETTLED_STATUS.join(', ')}` 
    });
  }

  const result = await ExpenseModel.updateMany(
    { _id: { $in: ids } },
    { settled: settledStatus }
  );

  return res.status(200).json({ 
    message: 'Expenses settled successfully', 
    updatedCount: result.modifiedCount 
  });
}));

// Settle expenses for a specific member identified by their name in categories
router.post('/settle/:memberId', async (req, res) => {
  const { memberId } = req.params;
  const { settlementType } = req.body; // Get the settlement type from the request body

  try {
      // Validate the settlementType (optional)
      if (!['Current', 'Savings'].includes(settlementType)) {
          res.status(400).json({ message: 'Invalid settlement type' });
          return
      }

      // Settle expenses for the found member ID
      const result = await ExpenseModel.updateMany(
          { paidBy: memberId, settled: null }, // Find expenses for this member that are not settled
          { settled: settlementType } // Use the settlementType from the request
      );

      // Check if any expenses were updated
      if (result.modifiedCount > 0) {
          res.status(200).json({ message: `Settled expenses for member` });
      } else {
          res.status(404).json({ message: `No unsettled expenses found for member` });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error settling expenses', error });
  }
});

// Get member-wise expenses
router.get('/member-expenses', async (req: Request, res: Response) => {
  try {
      // Fetch all expenses
      const expenses = await ExpenseModel.find().populate<{paidBy : {_id : ObjectId , name : string}}>('paidBy').lean(); // Adjust populate as necessary

      // Process expenses to categorize by member
      const memberExpenses: Record<string, MemberExpenseSummary> = {};

      expenses.forEach(expense => {
          const memberName = expense.paidBy.name; // Assuming 'paidBy' is populated with member details

          if (!memberExpenses[memberName]) {
              memberExpenses[memberName] = {
                  memberId : expense.paidBy._id,
                  memberName,
                  totalPaid: 0,
                  totalSettled: 0,
                  totalDue: 0,
              };
          }

          // Check if the expense is settled based on the 'settled' field
          memberExpenses[memberName].totalPaid += expense.amount; // Total paid is simply the sum of all expenses

          if (expense.settled === 'Current' || expense.settled === 'Savings') {
              memberExpenses[memberName].totalSettled += expense.amount;
          } else {
              memberExpenses[memberName].totalDue += expense.amount;
          }
      });

      // Convert the memberExpenses object to an array for response
      const result: MemberExpenseSummary[] = Object.values(memberExpenses);

      res.json(result);
  } catch (error) {
      console.error('Error fetching member expenses:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category, ...expenseData } = req.body as ExpenseRequest;

  if (!await validateCategory(category)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  const updatedExpense = await ExpenseModel.findByIdAndUpdate(
    id,
    {
      ...expenseData,
      category,
      updatedAt: new Date()
    },
    { new: true }
  ).populate('category');

  if (!updatedExpense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  return res.status(200).json(updatedExpense);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deletedExpense = await ExpenseModel.findByIdAndDelete(req.params.id);
  
  if (!deletedExpense) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  
  return res.status(204).send();
}));

export default router;