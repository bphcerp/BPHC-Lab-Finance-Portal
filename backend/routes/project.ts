import { Router, Response, Request } from "express";
import { ProjectModel } from "../models/project";
import multer from "multer";
import mongoose from "mongoose";
import { Readable } from "stream";
import { authenticateToken } from "../middleware/authenticateToken";
import path from "path"; // Import path to handle file paths

const router: Router = Router();
const conn = mongoose.connection;
let gfs: mongoose.mongo.GridFSBucket;

router.use(authenticateToken);

// Initialize GridFS when MongoDB connection is open
conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
        bucketName: "uploads"
    });
});

// Set up Multer storage for GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to get a sanction letter file and return its path
const getSanctionLetterFilePath = (fileId: mongoose.Types.ObjectId): string => {
    return path.join(__dirname, `../uploads/${fileId}`); // Adjust the path as needed
};

// Route to get the total sum of all project amounts
router.get('/grandtotal', async (req: Request, res: Response) => {
    try {
        const result = await ProjectModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalSum: { $sum: "$total_amount" }
                }
            }
        ]);

        const totalAmountSum = result.length > 0 ? result[0].totalSum : 0;
        res.json({ total_amount_sum: totalAmountSum });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating total sum', error });
    }
});

// Route to create a new project and upload sanction letter
router.post('/', upload.single('sanction_letter'), async (req: Request, res: Response) => {
    try {
        const { project_name, start_date, end_date, project_heads, total_amount, pis, copis } = req.body;

        const startDate = start_date ? new Date(start_date) : null;
        const endDate = end_date ? new Date(end_date) : null;
        const projectHeads = JSON.parse(project_heads) as number[];

        let sanctionLetterFileId: mongoose.Types.ObjectId | null = null;

        // Handle file upload if provided
        if (req.file) {
            const readableStream = new Readable();
            readableStream.push(req.file.buffer);
            readableStream.push(null);

            const uploadStream = gfs.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype || 'application/octet-stream'
            });

            await new Promise<void>((resolve, reject) => {
                readableStream.pipe(uploadStream)
                    .on("error", (err) => reject(err))
                    .on("finish", () => {
                        sanctionLetterFileId = uploadStream.id; // Save the file ID
                        resolve();
                    });
            });
        }

        // Create and save new project
        const newProject = new ProjectModel({
            project_name,
            start_date: startDate,
            end_date: endDate,
            project_heads: projectHeads,
            total_amount: Number(total_amount),
            pis: JSON.parse(pis),
            copis: JSON.parse(copis),
            sanction_letter_file_id: sanctionLetterFileId
        });

        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: (error as Error).message });
    }
});

// Route to get all projects without sanction letter files
router.get('/', async (req: Request, res: Response) => {
    try {
        const projects = await ProjectModel.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
});

// Route to get a single project by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
});

// Route to get the sanction letter by project ID
router.get('/:id/sanction_letter', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);

        if (!project) {
            console.error(`Project not found for ID: ${req.params.id}`);
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        if (!project.sanction_letter_file_id) {
            console.error(`No sanction letter found for project ID: ${req.params.id}`);
            res.status(404).json({ message: 'Sanction letter not found for this project' });
            return;
        }

		console.log("haha")

        const fileId = project.sanction_letter_file_id;

        // Create a download stream from GridFS
        const downloadStream = gfs.openDownloadStream(fileId);

        // Set the correct headers for the file download
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename=${fileId}`);

        // Handle potential errors while streaming the file
        downloadStream.on('error', (error) => {
            console.error(`Error fetching file: ${error.message}`);
            res.status(404).send('File not found');
            return;
        });

        // Pipe the download stream to the response
        downloadStream.pipe(res).on('finish', () => {
            console.log('File streamed successfully.');
        });

        return; 
    } catch (error) {
        console.error(`Error fetching sanction letter for project ID ${req.params.id}: ${(error as Error).message}`);
        res.status(500).json({ message: 'Error fetching sanction letter', error: (error as Error).message });
        return;
    }
});

// Route to update a project by ID
router.put('/projects/:id', async (req: Request, res: Response) => {
    try {
        const { project_name, start_date, end_date, project_heads, total_amount, pis, copis } = req.body;

        const updatedProject = await ProjectModel.findByIdAndUpdate(
            req.params.id,
            { project_name, start_date, end_date, project_heads, total_amount, pis, copis },
            { new: true }
        );

        if (!updatedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            res.json(updatedProject);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
});

// Route to delete a project by ID
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const deletedProject = await ProjectModel.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            res.status(204).send();  // No Content
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error });
    }
});

export default router;