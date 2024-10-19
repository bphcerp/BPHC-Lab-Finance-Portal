import { Router, Response, Request } from "express";
import { ProjectHeadModel } from "../models/project_heads";

const router: Router = Router();

interface ProjectHeadBody {
    head_name: string;
}

router.get('/', async (req: Request, res: Response) => {
    try {
        const projectHeads = await ProjectHeadModel.find();
        res.status(200).json(projectHeads);
    } catch (error) {
        console.error("Error fetching project heads:", (error as Error).message);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/', async (req: Request<{}, {}, ProjectHeadBody>, res: Response) => {
    const { head_name } = req.body;

    if (!head_name) {
        res.status(400).json({ message: "Project head name is required" });
        return;
    }

    try {
        const newProjectHead = new ProjectHeadModel({ head_name });
        await newProjectHead.save();
        res.status(201).json(newProjectHead);
    } catch (error) {
        if ((error as any).code === 11000) {
            res.status(409).json({ message: "Project head already exists" });
        } else {
            console.error("Error adding project head:", (error as Error).message);
            res.status(500).json({ message: "Server error" });
        }
    }
});

router.put('/:id', async (req: Request<{ id: string }, {}, ProjectHeadBody>, res: Response) => {
    const { id } = req.params;
    const { head_name } = req.body;

    if (!head_name) {
        res.status(400).json({ message: "Project head name is required" });
        return;
    }

    try {
        const updatedProjectHead = await ProjectHeadModel.findByIdAndUpdate(id, { head_name }, { new: true, runValidators: true });

        if (!updatedProjectHead) {
            res.status(404).json({ message: "Project head not found" });
        } else {
            res.status(200).json(updatedProjectHead);
        }
    } catch (error) {
        console.error("Error updating project head:", (error as Error).message);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    try {
        const deletedProjectHead = await ProjectHeadModel.findByIdAndDelete(id);

        if (!deletedProjectHead) {
            res.status(404).json({ message: "Project head not found" });
        } else {
            res.status(204).send();
        }
    } catch (error) {
        console.error("Error deleting project head:", (error as Error).message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
