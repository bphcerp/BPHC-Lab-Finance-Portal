import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { MemberModel } from '../models/member';

const router = express.Router();

// Apply authenticateToken middleware to all routes in this router
router.use(authenticateToken);

// GET /api/members/ - Fetch categories by type
router.get('/', async (req: Request, res: Response) => {
    try {
        const members = await MemberModel.find({ type: req.query.type });
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching members: ' + (error as Error).message });
    }
});

// POST /api/categories - Add a new member
router.post('/', async (req: Request, res: Response) => {
    const { name, institute_id } = req.body;
    const { type } = req.query

    if (!name || !type || !institute_id) {
        res.status(400).json({ message: 'Some fields are missing' });
        return;
    }

    try {
        const existingMember = await MemberModel.findOne({ institute_id });

        if (existingMember) {
            res.status(400).json({ message: 'Member already exists with this ID' });
            return;
        }

        const newMember = new MemberModel({ name, type, institute_id });
        await newMember.save();

        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ message: 'Error creating member', error : (error as Error).message });
    }
});

export default router;
