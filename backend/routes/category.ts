import express, { Request, Response } from 'express';
import { CategoryModel } from '../models/category';

const router = express.Router();

router.get('/:type', async (req: Request, res: Response) => {
    try {
        const categories = await CategoryModel.find({ type: req.params.type });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories: ' + (error as Error).message });
    }
});

export default router;
