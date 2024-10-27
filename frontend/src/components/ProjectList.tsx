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
    sanction_letter_file_id? : string
}

interface ProjectListProps {
    projectData: Array<Project> | null;
}

// Function to fetch and open the sanction letter
const fetchSanctionLetter = async (projectId: string) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${projectId}/sanction_letter`, {
            method: 'GET',
            credentials : "include",
            headers: {
                'Content-Type': 'application/pdf',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch the sanction letter');
        }

        const blob = await response.blob(); // Get the file as a Blob
        const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
        window.open(url); // Open the URL in a new tab
    } catch (error) {
        console.error(error);
        alert('Error fetching the sanction letter. Please try again later.');
    }
}

const getUniqueProjectHeads = (projects: Project[] | null): string[] => {
    if (!projects) return [];
    const headsSet = new Set<string>();

    projects.forEach((project) => {
        Object.keys(project.project_heads).forEach((head) => headsSet.add(head));
    });

    return Array.from(headsSet);
};

const ProjectList: FunctionComponent<ProjectListProps> = (props: ProjectListProps) => {
    const uniqueHeads = getUniqueProjectHeads(props.projectData);

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
                            {uniqueHeads.map((head, key) => (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" key={key}>
                                    {head}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sanction Letter
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
                                {uniqueHeads.map((head, index) => (
                                    <td className="px-6 py-4 whitespace-nowrap" key={index}>
                                        {project.project_heads[head]
                                            ? project.project_heads[head].reduce((a, b) => a + b, 0).toLocaleString("en-IN", {
                                                  style: "currency",
                                                  currency: "INR",
                                              })
                                            : "-"}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.sanction_letter_file_id?<button
                                        onClick={() => fetchSanctionLetter(project._id!)} // Ensure project._id is defined
                                        className="text-blue-600 hover:underline"
                                    >
                                        View
                                    </button>:"-"}
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
