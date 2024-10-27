import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Project } from "../components/ProjectList";
import { toastError } from "../toasts";
import ReimbursementModal from "../components/ReimbursementModal";

const ProjectDetails = () => {
    const { id } = useParams();
    const [projectData, setProjectData] = useState<Project>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reimbursements, setReimbursements] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => setProjectData(data))
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }, []);

    const fetchReimbursements = async (head: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/${id}/${head}`, {credentials : "include"});
            const data = await response.json();
            setReimbursements(data);
            setIsModalOpen(true);
        } catch (error) {
            toastError("Error fetching reimbursements");
            console.error(error);
        }
    };

    return (
        <>
            {projectData && (
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
                                            ? new Date(projectData.start_date).toLocaleDateString('en-IN')
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">End:</span>
                                    <p className="text-lg">
                                        {projectData.end_date
                                            ? new Date(projectData.end_date).toLocaleDateString('en-IN')
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-700">Project Heads</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">Head</th>
                                        {Array.from({ length: Math.max(...Object.values(projectData.project_heads).map(arr => arr.length)) }).map((_, i) => (
                                            <th key={i} className="py-3 px-6 text-center text-gray-800 font-semibold">
                                                Year {i + 1}
                                            </th>
                                        ))}
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(projectData.project_heads).map(([head, allocations], index) => (
                                        <tr key={index} className="border-t">
                                            <td className="py-3 px-6 text-gray-800 text-center font-medium">{head}</td>
                                            {allocations.map((amount, i) => (
                                                <td key={i} className="py-3 px-6 text-center text-gray-600">
                                                    {amount.toLocaleString("en-IN", {
                                                        style: "currency",
                                                        currency: "INR",
                                                    })}
                                                </td>
                                            ))}
                                            {allocations.length < Math.max(...Object.values(projectData.project_heads).map(arr => arr.length)) &&
                                                Array.from({ length: Math.max(...Object.values(projectData.project_heads).map(arr => arr.length)) - allocations.length }).map((_, i) => (
                                                    <td key={i} className="py-3 px-6 text-center text-gray-600">N/A</td>
                                                ))
                                            }
                                            <td className="py-3 px-6 text-center">
                                                <button
                                                    className="text-blue-600 hover:underline"
                                                    onClick={() => fetchReimbursements(head)}
                                                >
                                                    View Reimbursements
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <ReimbursementModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                reimbursements={reimbursements} 
            />
        </>
    );
};

export default ProjectDetails;
