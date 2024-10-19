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
}

interface ProjectListProps {
    projectData: Array<Project> | null;
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
        <div className="flex flex-col items-center w-full h-full bg-gray-50 rounded-lg shadow-md overflow-y-auto p-4">
            <div className="flex sticky w-max top-0 bg-gray-200 text-gray-700 font-semibold border-b border-gray-300">
                <div className="flex justify-center items-center w-12 p-3">
                    <Checkbox color="blue" />
                </div>
                <span className="w-48 p-3 text-left flex-shrink-0">Project Name</span>
                <span className="w-32 p-3 text-left flex-shrink-0">Granted Amount</span>
                <span className="w-32 p-3 text-left flex-shrink-0">Start Date</span>
                <span className="w-32 p-3 text-left flex-shrink-0">End Date</span>
                {uniqueHeads.map((head, key) => (
                    <span className="w-32 p-3 text-left flex-shrink-0" key={key}>
                        {head}
                    </span>
                ))}
            </div>
            <div className="divide-y divide-gray-200">
                {props.projectData.map((project, key) => (
                    <div
                        key={key}
                        className={`flex text-gray-700 w-max h-20 items-center ${
                            key % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                    >
                        <div className="flex justify-center items-center w-12 p-3">
                            <Checkbox color="blue" />
                        </div>
                        <span className="w-48 p-3 text-left flex-shrink-0"> <a
                                className="hover:underline text-blue-600"
                                href={`/project/${project._id}`}
                            >
                                {project.project_name}
                            </a></span>
                        <span className="w-32 p-3 text-left flex-shrink-0">
                            {project.total_amount.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </span>
                        <span className="w-32 p-3 text-left flex-shrink-0">
                            {project.start_date
                                ? project.start_date.toLocaleDateString()
                                : "-"}
                        </span>
                        <span className="w-32 p-3 text-left flex-shrink-0">
                            {project.end_date
                                ? project.end_date.toLocaleDateString()
                                : "-"}
                        </span>
                        {uniqueHeads.map((head, index) => (
                            <span className="w-32 p-3 text-left flex-shrink-0" key={index}>
                                {project.project_heads[head]
                                    ? project.project_heads[head]
                                          .reduce((a, b) => a + b, 0)
                                          .toLocaleString("en-IN", {
                                              style: "currency",
                                              currency: "INR",
                                          })
                                    : "-"}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
