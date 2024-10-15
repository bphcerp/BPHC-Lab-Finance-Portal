import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Project } from "../components/ProjectList";

const ProjectDetails = () => {
    const { id } = useParams();
    const [projectData, setProjectData] = useState<Project>();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => setProjectData(data))
            .catch((e) => {
                alert("Something went wrong");
                console.error(e);
            });
    }, [id]);

    return (
        projectData && (
            <div className="p-6 space-y-8 w-full max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800">
                    {projectData.project_name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center">
                        <p className="text-lg font-semibold">Total Amount</p>
                        <p className="text-3xl font-bold mt-2 text-blue-800">
                            {projectData.total_amount.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </p>
                    </div>

                    <div className="bg-green-100 p-6 rounded-lg shadow-md text-center">
                        <p className="text-lg font-semibold">Project Duration</p>
                        <div className="flex justify-between mt-2">
                            <div>
                                <span className="font-medium text-gray-700">Start:</span>
                                <p className="text-lg">
                                    {projectData.start_date
                                        ? new Date(projectData.start_date).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">End:</span>
                                <p className="text-lg">
                                    {projectData.end_date
                                        ? new Date(projectData.end_date).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-700">
                        Project Heads
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(projectData.project_heads).map(([head, allocations], index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                    {head}
                                </h3>
                                <ul className="space-y-2">
                                    {allocations.map((amount, i) => (
                                        <li key={i} className="flex justify-between text-gray-600">
                                            <span className="font-medium">Year {i + 1}:</span>
                                            <span className="text-right">
                                                {amount.toLocaleString("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                })}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    );
};

export default ProjectDetails;
