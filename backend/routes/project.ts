import { Router, Response, Request } from "express";
import { ProjectModel } from "../models/project";
import multer from "multer";
import mongoose from "mongoose";
import { Readable } from "stream";
import { authenticateToken } from "../middleware/authenticateToken";
import { ReimbursementModel } from "../models/reimburse";
import wkhtmltopdf from "wkhtmltopdf";


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

type Project = mongoose.Document & typeof ProjectModel extends mongoose.Model<infer T> ? T : never;

const calculateCurrentYear = (data: Project) => {
    const curr = new Date();

    if (curr > new Date(data.end_date!)){
        return -1
    }

    const start = new Date(data.start_date!);
    let currentYear = curr.getFullYear() - start.getFullYear(); //should be +1, 0-indexing makes it +0

    if (curr.getMonth() > 3) currentYear++ //should be +2, but 0 indexing makes it +1
    if (start.getMonth() > 3) currentYear--;

    return (currentYear >= 0 ? currentYear : 0);
}

const getCurrentInstallmentIndex = (project: Project): number => {
    const currentDate = new Date();

    for (let i = 0; i < project.installments!.length; i++) {
        const installment = project.installments![i];
        const startDate = new Date(installment.start_date);
        const endDate = new Date(installment.end_date);

        if (currentDate >= startDate && currentDate <= endDate) {
            return i;
        }
    }

    return 0;
}

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

router.get('/:id/total-expenses', async (req, res) => {
    try {
        // Use findOne to fetch a single project based on project_id
        const project = await ProjectModel.findOne({ project_id: req.params.id });

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        // Access the project_head_expenses
        const projectHeadExpenses = project.project_head_expenses;

        if (!projectHeadExpenses || Object.keys(projectHeadExpenses).length === 0) {
            res.status(200).json({ message: 'No expenses found for this project.' });
            return;
        }

        res.status(200).json(projectHeadExpenses);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching total expenses: ' + (error as Error).message });
    }
});

router.post('/', upload.single('sanction_letter'), async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const startDate = data.start_date ? new Date(data.start_date) : null;
        const endDate = data.end_date ? new Date(data.end_date) : null;
        const projectHeads = data.project_heads ? JSON.parse(data.project_heads) as number[] : [];
        const parsedPis = data.pis ? JSON.parse(data.pis) : [];
        const parsedCopis = data.copis ? JSON.parse(data.copis) : [];
        const parsedInstallments = data.installments ? JSON.parse(data.installments) : [];

        let sanctionLetterFileId: mongoose.Types.ObjectId | null = null;

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
                        sanctionLetterFileId = uploadStream.id;
                        resolve();
                    });
            });
        }

        const newProject = new ProjectModel({
            project_id: data.project_id,
            project_title: data.project_title,
            project_name: data.project_name,
            project_type: data.project_type,
            start_date: startDate,
            end_date: endDate,
            project_heads: projectHeads,
            total_amount: Number(data.total_amount),
            pis: parsedPis,
            copis: parsedCopis,
            sanction_letter_file_id: sanctionLetterFileId,
            description: data.description,
            installments: parsedInstallments,
            negative_heads: data.negative_heads
        });

        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating project', error: (error as Error).message });
    }
});

// Route to update a project by ID
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Parse installments if provided
        const parsedInstallments = data.installments && Array.isArray(data.installments) && data.installments.length
            ? JSON.parse(data.installments)
            : [];

        const updatedProject = await ProjectModel.findByIdAndUpdate(
            req.params.id,
            {
                project_name: data.project_name,
                start_date: data.start_date,
                end_date: data.end_date,
                project_heads: data.project_heads,
                total_amount: data.total_amount,
                pis: JSON.parse(data.pis),
                copis: JSON.parse(data.copis),
                description: data.description,
                installments: parsedInstallments,
                negative_heads: data.negative_heads
            },
            { new: true }
        );

        if (!updatedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            res.json(updatedProject);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating project', error: (error as Error).message });
    }
});

// Route to get a single project by ID (including installments)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findOne({project_id : req.params.id});

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error : (error as Error).message });
    }
});


router.get('/', async (req: Request, res: Response) => {
    try {
        const { past, balance } = req.query;
        const projects = await ProjectModel.find();

        const filteredProjects = past
            ? projects
            : projects.filter(project => calculateCurrentYear(project) !== -1);

        if (balance === 'true') {
            const updatedProjects = filteredProjects.map(project => {
                const isInvoice = project.project_type === "invoice";
                const curr = isInvoice ? getCurrentInstallmentIndex(project) : calculateCurrentYear(project);

                if (curr !== -1) {
                    const projectHeads = project.project_heads;

                    projectHeads.forEach((allocations, head) => {
                        const allocation = allocations[curr];
                        const headExpense = project.project_head_expenses.get(head) || 0;

                        allocations[curr] = allocation - headExpense;
                        projectHeads.set(head, [allocations[curr]])
                    });

                    return project;
                }

                return project;
            });
            res.send(updatedProjects);
            return;
        }

        res.send(filteredProjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
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

router.get('/:id/util_cert', async (req, res) => {
    try {
        const projectId = req.params.id;

        // 1. Fetch the project by its ID
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            res.status(404).send('Project not found');
            return;
        }

        // 2. Find all reimbursements related to this project
        const reimbursements = await ReimbursementModel.find({ project: projectId });

        // Initialize a map to track expenses per project head
        const expenseSummary = new Map();

        // 3. Calculate total expenses per project head
        reimbursements.forEach((reimbursement) => {
            const head = reimbursement.projectHead;
            const totalAmount = reimbursement.totalAmount;

            // Sum up the expenses per head
            if (expenseSummary.has(head)) {
                expenseSummary.set(head, expenseSummary.get(head) + totalAmount);
            } else {
                expenseSummary.set(head, totalAmount);
            }
        });

        // 4. Generate HTML for the utilization certificate
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Utilization Certificate</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px 20px; }
                .header { display: flex; justify-content: space-between; align-items: center;}
                .company-info { text-align: center;} /* Center text and add margin */
                .header img { max-width: 100px; height: auto; }
                h1 { text-align: center;}
                h2 { text-decoration: underline; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 8px; text-align: left; border: 1px solid #ccc; }
                th { background-color: #f2f2f2; }
                tfoot { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${req.protocol}://${req.get('host')}/bitslogo.png" alt="BITS Pilani Logo" /> <!-- Logo on the right -->
                <div class="company-info">
                    <h1>LAMBDA Lab</h1> <!-- Company Name -->
                    <i>BITS Pilani, Hyderabad Campus</i> <!-- Place -->
                </div>
            </div>
            <h2>Utilization Certificate</h2>
            <h3>Project Details</h3>
            <p><strong>Project Name:</strong> ${project.project_name}</p>
            <p><strong>Start Date:</strong> ${project.start_date ? project.start_date.toDateString() : 'N/A'}</p>
            <p><strong>End Date:</strong> ${project.end_date ? project.end_date.toDateString() : 'N/A'}</p>
            <p><strong>Total Allocated Amount:</strong> Rs. ${project.total_amount}</p>

            <h3>Project Head Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Head</th>
                        <th>Allocated Amount</th>
                        <th>Expenses</th>
                        <th>Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(project.project_heads).map(([head, amounts]) => {
            const totalAllocated = amounts.reduce((sum, amount) => sum + amount, 0);
            const expenses = expenseSummary.get(head) || 0;
            const remaining = totalAllocated - expenses;

            return `
                        <tr>
                            <td>${head}</td>
                            <td>Rs. ${totalAllocated}</td>
                            <td>Rs. ${expenses}</td>
                            <td>Rs. ${remaining}</td>
                        </tr>`;
        }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Total</td>
                        <td>Rs. ${Array.from(project.project_heads).reduce((sum, [head, amounts]) => sum + amounts.reduce((a, b) => a + b, 0), 0)}</td>
                        <td>Rs. ${Array.from(expenseSummary.values()).reduce((sum, val) => sum + val, 0)}</td>
                        <td>Rs. ${Array.from(project.project_heads).reduce((sum, [head, amounts]) => sum + amounts.reduce((a, b) => a + b, 0), 0) - Array.from(expenseSummary.values()).reduce((sum, val) => sum + val, 0)}</td>
                    </tr>
                </tfoot>
            </table>
            <p style="text-align: right;">Generated on: ${new Date().toLocaleDateString()}</p>
        </body>
        </html>`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Utilization_Certificate_${project.project_name}.pdf"`)
        wkhtmltopdf(html, {orientation: 'Landscape', pageSize : "A4",
            marginBottom : "0",
            marginTop : "0",
            marginLeft : "0",
            marginRight : "0"            
        }).pipe(res)

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF');
    }
});

// Route to delete a project by ID
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const toBeDeletedProject = await ProjectModel.findById(req.params.id).lean();
        if (!toBeDeletedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            const projectReimbursements = await ReimbursementModel.findOne({project : toBeDeletedProject!._id})
            if (projectReimbursements) res.status(409).send({ message : "Cannot delete, project has reimbursements filed against. Please delete them and try again."})
            else res.status(204).send();
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error : (error as Error).message });
    }
});

export default router;