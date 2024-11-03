import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Project } from "../components/ProjectList";
import { toastError } from "../toasts";
import ReimbursementModal, { Reimbursement } from "../components/ReimbursementModal";

const ProjectDetails = () => {
    const { id } = useParams();
    const [projectData, setProjectData] = useState<Project>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reimbursements, setReimbursements] = useState<Array<Reimbursement>>([]);
    const [expenseData, setExpenseData] = useState<{[key : string] : number}>()
    const [currentYear, setCurrentYear] = useState(0)

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

        fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/total-expenses/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => setExpenseData(data))
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }, [id]);

    const fetchReimbursements = async (head: string) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${id}/${head}`,
                { credentials: "include" }
            );
            const data = await response.json();
            setReimbursements(data);
            setIsModalOpen(true);
        } catch (error) {
            toastError("Error fetching reimbursements");
            console.error(error);
        }
    };

    const calculateCurrentYear = () => {
        const curr = new Date().getTime();
        const start = new Date(projectData!.start_date!).getTime();
        const diff = Math.floor((curr - start) / (1000 * 60 * 60 * 24 * 365));
        setCurrentYear(diff >= 0?diff:0)
    };

    useEffect(() => {
        if (projectData) calculateCurrentYear()
    },[projectData])

    return (
        <>
            {projectData && (
                <div className="flex flex-col space-y-4 w-full mx-10">
                    <h1 className="text-4xl font-bold text-center mt-5 text-gray-800">
                        {projectData.project_name}
                    </h1>

                    <h2 className="text-2xl font-semibold text-gray-70">Project Data</h2>

                    <div className="flex flex-col md:flex-row md:space-x-10">
                        <div className="flex-1 overflow-x-auto">
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                            Head
                                        </th>
                                        {Array.from({
                                            length: Math.max(
                                                ...Object.values(projectData.project_heads).map(
                                                    (arr) => arr.length
                                                )
                                            ),
                                        }).map((_, i) => (
                                            <th
                                                key={i}
                                                className="py-3 px-6 text-center text-gray-800 font-semibold"
                                            >
                                                Year {i + 1}
                                            </th>
                                        ))}
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                            Reimbursements
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(projectData.project_heads).map(
                                        ([head, allocations], index) => (
                                            <tr key={index} className="border-t">
                                                <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                                    {head}
                                                </td>
                                                {allocations.map((amount, i) => (
                                                    <td
                                                        key={i}
                                                        className="py-3 px-6 text-center text-gray-600"
                                                    >
                                                        {amount.toLocaleString("en-IN", {
                                                            style: "currency",
                                                            currency: "INR",
                                                        })}
                                                    </td>
                                                ))}
                                                {allocations.length <
                                                    Math.max(
                                                        ...Object.values(projectData.project_heads).map(
                                                            (arr) => arr.length
                                                        )
                                                    ) &&
                                                    Array.from({
                                                        length:
                                                            Math.max(
                                                                ...Object.values(projectData.project_heads).map(
                                                                    (arr) => arr.length
                                                                )
                                                            ) - allocations.length,
                                                    }).map((_, i) => (
                                                        <td
                                                            key={i}
                                                            className="py-3 px-6 text-center text-gray-600"
                                                        >
                                                            N/A
                                                        </td>
                                                    ))}
                                                <td className="py-3 px-6 text-center">
                                                    <button
                                                        className="text-blue-600 hover:underline"
                                                        onClick={() => fetchReimbursements(head)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 md:mt-0 md:w-1/3">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center">
                                    <p className="text-md font-semibold">Total Amount</p>
                                    <p className="text-2xl font-bold mt-2 text-blue-800">
                                        {projectData.total_amount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })}
                                    </p>
                                </div>

                                <div className="bg-green-100 p-6 rounded-lg shadow-md text-center">
                                    <p className="text-md font-semibold">Project Duration</p>
                                    <div className="flex justify-between mt-2">
                                        <div>
                                            <span className="font-medium text-gray-700">Start:</span>
                                            <p className="text-sm">
                                                {projectData.start_date
                                                    ? new Date(projectData.start_date).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">End:</span>
                                            <p className="text-sm">
                                                {projectData.end_date
                                                    ? new Date(projectData.end_date).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-700 mt-6">Current Financial Year</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow-md rounded-lg mt-2">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                        Head
                                    </th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                        Total Initial Amount
                                    </th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                        Expenses
                                    </th>
                                    <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(projectData.project_heads).map(([head, allocations], index) => {
                                    return <tr key={index} className="border-t">
                                        <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                            {head}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {allocations[currentYear].toLocaleString("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                            })}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {expenseData ? expenseData[head] ?? 0 : "Loading"}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {expenseData ? allocations[currentYear] - (expenseData[head] ?? 0) : "Loading"}
                                        </td>
                                    </tr>
                                })}
                                <tr className="border-t bg-gray-100 font-semibold">
                                    <td className="py-3 px-6 text-gray-800 text-center">Total</td>
                                    <td className="py-3 px-6 text-center text-gray-600">
                                        {Object.values(projectData.project_heads).map(arr => arr[currentYear] || 0).reduce((sum, value) => sum + value, 0)}
                                    </td>
                                    <td className="py-3 px-6 text-center text-gray-600">
                                        {expenseData ? Object.values(expenseData).reduce((acc, value) => acc + value, 0) : "Loading"}
                                    </td>
                                    <td className="py-3 px-6 text-center text-gray-600">
                                        {expenseData ? Object.values(projectData.project_heads).map(arr => arr[currentYear] || 0).reduce((sum, value) => sum + value, 0) - Object.values(expenseData).reduce((acc, value) => acc + value, 0) : "Loading"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
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