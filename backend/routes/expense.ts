import express, { Request, Response, NextFunction } from 'express';
import { ExpenseModel } from '../models/expense';
import { CategoryModel } from '../models/category';
import { authenticateToken } from '../middleware/authenticateToken';
import { Schema } from 'mongoose';

const router = express.Router();

// Types
interface ExpenseRequest {
  category: Schema.Types.ObjectId;
  amount: number;
  description: string;
  paidStatus?: boolean;
  reimbursedID?: Schema.Types.ObjectId;
  settled?: 'Current' | 'Savings' | null;
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

  const [expenses, totalExpenses] = await Promise.all([
    ExpenseModel.find()
      .sort({ paidStatus: 1, reimbursedID: 1, createdAt: 1 })
      .populate({ path: 'reimbursedID', select: 'title paidStatus' })
      .populate({ path: 'category' })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .lean(),
    ExpenseModel.countDocuments()
  ]);

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

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const expense = await ExpenseModel.findById(req.params.id)
    .populate('category')
    .lean();

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  return res.status(200).json(expense);
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