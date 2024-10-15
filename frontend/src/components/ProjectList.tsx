import { Checkbox } from "flowbite-react";
import { FunctionComponent} from "react";

export interface Project{
    project_name: string;
    start_date: Date | null;
    end_date: Date | null;
    project_heads: {
      [key: string]: number[]; // Dynamic keys for project heads (e.g., Manpower, Travel, etc.)
    };
    total_amount: number;
}

interface ProjectListProps {
    projectData : Array<Project> | null
}

const getUniqueProjectHeads = (projects: Project[] | null): string[] => {
    if (!projects) return []
    const headsSet = new Set<string>()
  
    projects.forEach(project => {
      Object.keys(project.project_heads).forEach(head => headsSet.add(head));
    });
  
    return Array.from(headsSet);
  };
 
const ProjectList: FunctionComponent<ProjectListProps> = (props : ProjectListProps) => {

    const uniqueHeads = getUniqueProjectHeads(props.projectData)

    return props.projectData && (
        <div className='flex flex-col w-full h-full bg-gray-200 rounded-sm shadow-md overflow-y-auto'>
            <div className={`flex h-fit text-center font-bold bg-gray-300`}>
                <div className="flex justify-center items-center"><Checkbox color="blue"/></div>
                <span className="w-32">Project Name</span>
                <span className="w-32">Granted Amount</span>
                <span className="w-32">Start Date</span>
                <span className="w-32">End Date</span>
                {uniqueHeads.map(((head,key) => (
                    <span className="w-32" key={key}>{head}</span>
                )))}
            </div>
            {props.projectData.map((project,key) => (
                <div key={key} className={`flex text-center h-20 mt-2`}>
                    <div className="flex justify-center items-center h-fit mt-1"><Checkbox color="blue"/></div>
                    <span className="w-32">{project.project_name}</span>
                    <span className="w-32">{project.total_amount.toLocaleString('en-IN',{
                            style : "currency",
                            currency : "INR"
                        })}</span>
                    <span className="w-32">{project.start_date?project.start_date.toLocaleDateString():"-"}</span>
                    <span className="w-32">{project.end_date?project.end_date.toLocaleDateString():"-"}</span>
                    {uniqueHeads.map(((head,key) => (
                        <span className="w-32" key={key}>{project.project_heads[head]?project.project_heads[head].reduce((a, b) => a + b, 0).toLocaleString('en-IN',{
                            style : "currency",
                            currency : "INR"
                        }):"-"}</span>
                    )))}
                </div> 
            ) )}            
        </div>
    );
}
 
export default ProjectList;