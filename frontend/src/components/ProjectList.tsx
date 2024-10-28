import { Checkbox } from "flowbite-react";
import { FunctionComponent } from "react";

export interface Project {
    _id?: string;
    project_name: string;
    start_date: Date | null;
    end_date: Date | null;
    project_heads: {
        [key: string]: number[];
    };
    total_amount: number;
    pis: string[];
    copis: string[];
    sanction_letter?: File | null;
    sanction_letter_file_id?: string;
}

interface ProjectListProps {
    projectData: Array<Project> | null;
}

const ProjectList: FunctionComponent<ProjectListProps> = (props: ProjectListProps) => {
    return props.projectData ? (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <Checkbox className="focus:ring-0" color="blue" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Project Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granted Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sanction Letter
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Utilization Certificate
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {props.projectData.map((project, key) => (
                            <tr key={project._id} className={key % 2 ? "bg-gray-100" : "bg-white"}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Checkbox className="focus:ring-0" color="blue" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <a className="hover:underline text-blue-600" href={`/project/${project._id}`}>
                                        {project.project_name}
                                    </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.total_amount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.start_date ? project.start_date.toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.end_date ? project.end_date.toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.sanction_letter_file_id ? (
                                        <a
                                            href={`${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/sanction_letter`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <a
                                        href={`${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/util_cert`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
