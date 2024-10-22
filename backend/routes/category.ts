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

router.post('/', async (req, res) => {
    const { name, type } = req.body;

    if (!name || !type) {
        res.status(400).json({ message: 'Name and type are required' });
        return
    }

    try {
        const existingCategory = await CategoryModel.findOne({ name });

        if (existingCategory) {
            res.status(400).json({ message: 'Category already exists' });
            return
        }

        const newCategory = new CategoryModel({ name, type });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error });
    }
});

export default router;
