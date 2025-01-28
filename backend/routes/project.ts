import { Router, Response, Request } from "express";
import { ProjectModel } from "../models/project";
import multer from "multer";
import mongoose from "mongoose";
import { Readable } from "stream";
import { authenticateToken } from "../middleware/authenticateToken";
import { ReimbursementModel } from "../models/reimburse";
import wkhtmltopdf from "wkhtmltopdf";
import { InstituteExpenseModel } from "../models/expense";


const router: Router = Router();
const conn = mongoose.connection;
let gfs: mongoose.mongo.GridFSBucket;

router.use(authenticateToken);


conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db!, {
        bucketName: "uploads"
    });
});


const storage = multer.memoryStorage();
const upload = multer({ storage });

type Project = mongoose.Document & typeof ProjectModel extends mongoose.Model<infer T> ? T : never;

export const calculateNumberOfYears = (start: Date, end: Date) => {
    const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
    const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

    const yearsDiff = endYear - startYear + 1;
    return (yearsDiff >= 1 ? yearsDiff : 0);
};

export const getCurrentIndex = (project: Project) => project.project_type === "invoice" ? getCurrentInstallmentIndex(project) : calculateCurrentYear(project)

const calculateCurrentYear = (data: Project) => {
    if (data.override) return data.override.index
    const curr = new Date();

    if (curr > new Date(data.end_date!)) {
        return -1
    }

    const start = new Date(data.start_date!);
    let currentYear = curr.getFullYear() - start.getFullYear();

    if (curr.getMonth() > 3) currentYear++
    if (start.getMonth() > 3) currentYear--;

    return (currentYear >= 0 ? currentYear : 0);
}

const getCurrentInstallmentIndex = (project: Project): number => {
    if (project.override) return project.override.index
    const currentDate = new Date();

    for (let i = 0; i < project.installments!.length; i++) {
        const installment = project.installments![i];
        const startDate = new Date(installment.start_date);
        const endDate = new Date(installment.end_date);

        if (currentDate >= startDate && currentDate <= endDate) {
            return i;
        }
    }

    return -1;
}

const getProjectExpenses = async (project: Project) => {
    const reimbursementExpenses = await ReimbursementModel.aggregate([
        {
            $match: {
                project: (project as any)._id,
                year_or_installment: getCurrentIndex(project)
            },
        },
        {
            $group: {
                _id: '$projectHead',
                totalAmountSum: { $sum: '$totalAmount' },
            },
        },
    ]);

    const instituteExpenses = await InstituteExpenseModel.aggregate([
        {
            $match: {
                project: (project as any)._id,
                year_or_installment: getCurrentIndex(project)
            },
        },
        {
            $group: {
                _id: '$projectHead',
                totalAmountSum: { $sum: '$amount' },
            },
        },
    ]);

    const project_head_expenses = reimbursementExpenses.reduce((acc, { _id, totalAmountSum }) => {
        acc[_id] = totalAmountSum;
        return acc;
    }, {});

    instituteExpenses.map(({ _id, totalAmountSum }) => {
        project_head_expenses[_id] = (project_head_expenses[_id] ?? 0) + totalAmountSum;
    })


    return project_head_expenses
}

router.get('/:id/total-expenses', async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send({ message: 'Project ID is required and should be a single value' });
        return;
    }

    try {

        const project = await ProjectModel.findById(id)

        if (!project) {
            res.status(400).send({ message: 'Invalid project ID' });
            return;
        }

        const project_head_expenses = await getProjectExpenses(project)

        res.json(project_head_expenses);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: `Error occurred: ${(err as Error).message}` });
    }
})


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

router.post('/:id/carry', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        const currentIndex = getCurrentIndex(project)
        const isYearInvalid = project.project_type === 'invoice' ? ( currentIndex + 1 === project.installments.length) : ( currentIndex + 1 === calculateNumberOfYears(project.start_date!,project.end_date!))

        if (isYearInvalid){
            res.status(400).send({message : `Project's last ${project.project_type === 'invoice' ? 'installment' :  'year'}, cannot carry forward`})
            return
        }

        const project_head_expenses = await getProjectExpenses(project)

        project.carry_forward!.forEach((alloc, head) => {
            const carryForwardPerHead = project.project_heads.get(head)![getCurrentIndex(project)] - (project_head_expenses[head] ?? 0)
            let oldCarryArray = project.carry_forward!.get(head)!
            oldCarryArray[getCurrentIndex(project)] = carryForwardPerHead
            project.carry_forward!.set(head, oldCarryArray)
        })

        project.override = {
            type: project.project_type,
            index: getCurrentIndex(project) + 1
        }

        await project.save()
        res.send({ updatedProject: project })
    }
    catch (err) {
        console.error(err)
        res.status(500).send({ message: (err as Error).message })
    }
})

//Enforce Override
router.post('/:id/override', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        if (req.body.selectedIndex === getCurrentIndex(project)){
            res.status(409).send({ message : "Override redundant. Already set to that year."})
            return
        }

        if (getCurrentIndex(project) !== -1) {
            const isCarrySet =  Array.from(project.carry_forward!.values()).some(carry => carry[req.body.selectedIndex] !== null)
            if (isCarrySet) {
                res.status(403).json({ message: 'Carry already set. Cannot override.' })
                return
            }
        }

        const isYearInvalid = req.body.selectedIndex < 0 || project.project_type === 'invoice' ? ( req.body.selectedIndex >= project.installments.length) : ( req.body.selectedIndex >= calculateNumberOfYears(project.start_date!,project.end_date!))

        if (isYearInvalid){
            res.status(400).send({message : project.project_type ? "Invalid Installment Number" : "Invalid Year"})
            return
        }

        project.override = {
            type: project.project_type,
            index: req.body.selectedIndex
        }
        await project.save()
        res.send({ updatedProject: project })
    }
    catch (err) {
        console.error(err)
        res.status(500).send({ message: (err as Error).message })
    }
})

//Revert Override
router.delete('/:id/override', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await ProjectModel.findById(id);

        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }

        if (getCurrentIndex(project) !== -1) {
            const isCarrySet =  Array.from(project.carry_forward!.values()).some(carry => carry[getCurrentIndex(project)] !== null)
            if (isCarrySet) {
                res.status(403).json({ message: 'Carry already set. Cannot override.' })
                return
            }
        }


        await ProjectModel.updateOne({ _id: id }, { $unset: { override: "" } });

        res.send({ message: 'Override field removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: (err as Error).message });
    }
});



router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data = req.body;


        const parsedInstallments = data.installments && Array.isArray(data.installments) && data.installments.length
            ? JSON.parse(data.installments)
            : [];

        const updatedProject = await ProjectModel.findByIdAndUpdate(
            req.params.id,
            {
                ...data,
                installments: parsedInstallments,
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


router.get('/:id', async (req: Request, res: Response) => {
    try {
        const project = await ProjectModel.findById(req.params.id)
            .populate({ path: "pis", select: "name" })
            .populate({ path: "copis", select: "name" })

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error: (error as Error).message });
    }
});


router.get('/', async (req: Request, res: Response) => {
    try {
        const { past, balance } = req.query;
        const projects = await ProjectModel.find()
            .populate({ path: "pis", select: "name" })
            .populate({ path: "copis", select: "name" })


        const filteredProjects = past
            ? projects
            : projects.filter(project => getCurrentIndex(project) !== -1);

        if (balance === 'true') {
            const updatedProjects = await Promise.all(filteredProjects.map(async project => {
                const curr = getCurrentIndex(project)

                if (curr !== -1) {
                    const projectHeads = project.project_heads;

                    const project_head_expenses = await getProjectExpenses(project)

                    projectHeads.forEach((allocations, head) => {
                        const allocation = allocations[curr];
                        const headExpense = project_head_expenses[head] || 0;
                        const carryForward = curr ? project.carry_forward!.get(head)![curr - 1] : 0

                        allocations[curr] = allocation + carryForward - headExpense;
                        projectHeads.set(head, [allocations[curr]])
                    });
                }

                return project;
            }));
            res.send(updatedProjects);
            return;
        }

        res.send(filteredProjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
});


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


        const downloadStream = gfs.openDownloadStream(fileId);

        const filename = `${project.project_name}_sanction_letter.pdf`.replace(/\s/g, '_')


        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename=${filename}`);


        downloadStream.on('error', (error) => {
            console.error(`Error fetching file: ${error.message}`);
            res.status(404).send('File not found');
            return;
        });


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

        const project = await ProjectModel.findById(projectId);
        if (!project) {
            res.status(404).send('Project not found');
            return;
        }

        const curr = getCurrentIndex(project)


        const reimbursements = await ReimbursementModel.find({ project: projectId });


        const expenseSummary = new Map();


        reimbursements.forEach((reimbursement) => {
            const head = reimbursement.projectHead;
            const totalAmount = reimbursement.totalAmount;


            if (expenseSummary.has(head)) {
                expenseSummary.set(head, expenseSummary.get(head) + totalAmount);
            } else {
                expenseSummary.set(head, totalAmount);
            }
        });


        const html = `
        <!DOCTYPE html>
        <html lang="en-IN">
        <head>
            <meta charset="utf-8">
            <title>Utilization Certificate for ${project.project_type === "yearly" ? "Year" : "Installment"} ${curr + 1}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 10px 20px; }
                .header { display: flex; justify-content: space-between; align-items: center;}
                .company-info { text-align: center;}
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
                <img src="${req.protocol}:
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
            const totalAllocated = project.project_heads.get(head)![curr];
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
        wkhtmltopdf(html, {
            orientation: 'Landscape', pageSize: "A4",
            marginBottom: "0",
            marginTop: "0",
            marginLeft: "0",
            marginRight: "0"
        }).pipe(res)

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF');
    }
});


router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const toBeDeletedProject = await ProjectModel.findById(req.params.id).lean();
        if (!toBeDeletedProject) {
            res.status(404).json({ message: 'Project not found' });
        } else {
            const projectReimbursements = await ReimbursementModel.findOne({ project: toBeDeletedProject!._id })
            if (projectReimbursements) res.status(409).send({ message: "Cannot delete, project has reimbursements filed against. Please delete them and try again." })
            else {
                const sanction_letter_file_id = toBeDeletedProject.sanction_letter_file_id;

                if (sanction_letter_file_id) {
                    await gfs.delete(sanction_letter_file_id);
                }

                await ProjectModel.deleteOne(toBeDeletedProject)
                res.status(204).send()
            };
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: (error as Error).message });
    }
});

export default router;