import { Router, Response, Request } from "express";
import { ProjectModel } from "../models/project";

const router : Router = Router()

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
  
	  const totalAmountSum = result.length > 0? result[0].totalSum : 0;
  
	  res.json({ total_amount_sum: totalAmountSum });
	} catch (error) {
	  res.status(500).json({ message: 'Error calculating total sum', error });
	}
});

router.post('/', async (req: Request, res: Response) => {

	try {
	  const { project_name, start_date, end_date, project_heads, total_amount} = req.body;

	  const startDate = start_date ? new Date(start_date) : null;
      const endDate = end_date ? new Date(end_date) : null;
	  
	  const newProject = new ProjectModel({
		project_name,
		start_date: startDate, 
		end_date: endDate,
		project_heads,
		total_amount,
	  });

	  const savedProject = await newProject.save();
	  res.status(201).json(savedProject);
	} catch (error) {
	  res.status(500).json({ message: 'Error creating project', error : (error as Error).message });
	}
  });

router.get('/', async (req: Request, res: Response) => {
  try {
	const projects = await ProjectModel.find();
	res.json(projects);
  } catch (error) {
	res.status(500).json({ message: 'Error fetching projects', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
	const project = await ProjectModel.findById(req.params.id);
	if (!project) {
	  res.status(404).json({ message: 'Project not found' })
	}
	else res.json(project);
  } catch (error) {
	res.status(500).json({ message: 'Error fetching project', error });
  }
});

router.put('/projects/:id', async (req: Request, res: Response) => {
	try {
	  const { project_name, start_date, end_date, project_heads, total_amount } = req.body;
  
	  const updatedProject = await ProjectModel.findByIdAndUpdate(
		req.params.id,
		{ project_name, start_date, end_date, project_heads, total_amount },
		{ new: true }
	  );
  
	  if (!updatedProject) {
		res.status(404).json({ message: 'Project not found' });
	  }
	  else res.json(updatedProject);
	} catch (error) {
	  res.status(500).json({ message: 'Error updating project', error });
	}
  });  

router.delete('/:id', async (req: Request, res: Response) => {
  try {
	const deletedProject = await ProjectModel.findByIdAndDelete(req.params.id);
	if (!deletedProject) {
	  res.status(404).json({ message: 'Project not found' });
	}
	else res.status(204).send(); // 204 No Content
  } catch (error) {
	res.status(500).json({ message: 'Error deleting project', error });
  }
});

export default router
