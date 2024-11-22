import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toastError, toastSuccess, toastWarn } from "../toasts";
import ReimbursementModal from "../components/ReimbursementModal";
import { Expense, Project, Reimbursement } from "../types";
import { Button } from "flowbite-react";
import OverrideConfirmation from "../components/OverrideConfirmation";
import ProjectHeadExpenses from "../components/ProjectHeadExpenses";

const calculateNumberOfYears = (start: Date, end: Date) => {


    const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
    const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

    const yearsDiff = endYear - startYear + 1;
    return (yearsDiff >= 1 ? yearsDiff : 0);
};

export const calculateCurrentYear = (data: Project) => {

    if (data.override) return data.override.index

    const curr = new Date();

    if (curr > new Date(data.end_date!)) {
        return -1
    }

    const start = new Date(data.start_date!);
    let currentYear = curr.getFullYear() - start.getFullYear(); //should be +1, 0-indexing makes it +0

    if (curr.getMonth() > 3) currentYear++ //should be +2, but 0 indexing makes it +1
    if (start.getMonth() > 3) currentYear--;

    return (currentYear >= 0 ? currentYear : 0);
};

export const getCurrentInstallmentIndex = (project: Project): number => {

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

    return 0; // Return null if no active installment is found
}

const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "N/A";

const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

const ProjectDetails = () => {
    const { id } = useParams();
    const [projectData, setProjectData] = useState<Project>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reimbursements, setReimbursements] = useState<Array<Reimbursement>>([]);
    const [expenseData, setExpenseData] = useState<{ [key: string]: number }>()
    const [currentYear, setCurrentYear] = useState(0)
    const [isProjectOver, setIsProjectOver] = useState(false)
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
    const [label, setLabel] = useState<string>()
    const [isHeadExpensesModalOpen, setIsHeadExpensesModalOpen] = useState(false)
    const [headExpensesLabel, setHeadExpensesLabel] = useState<string>()
    const [headExpenses, setHeadExpenses] = useState<Array<Expense>>([])
    const [resetOverride, setResetOverride] = useState(false)

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setProjectData(data)
                const curr = data.project_type === "invoice" ? getCurrentInstallmentIndex(data) : calculateCurrentYear(data)
                curr >= 0 ? setCurrentYear(curr) : setIsProjectOver(true)
            })
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}/total-expenses`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => setExpenseData(data))
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }

    useEffect(() => {
        fetchProjectData()
    }, [id]);

    useEffect(() => {
        if (isProjectOver) toastWarn("Project's end date has been crossed!")
    }, [isProjectOver])

    const fetchReimbursements = async ({ head, index, all }: { head?: string, index?: number, all?: boolean }) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${projectData!._id}/${head}?index=${index}&all=${all}`,
                { credentials: "include" }
            );
            const data = await response.json();
            setLabel(all ? projectData?.project_name : `${head}${index !== undefined ? ` Year ${index + 1}` : ""}`)
            setReimbursements(data);
            setIsModalOpen(true);
        } catch (error) {
            toastError("Error fetching reimbursements");
            console.error(error);
        }
    };

    const fetchHeadExpenses = async (head: string) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/reimburse/${projectData!._id}/${head}/expenses`,
                { credentials: "include" }
            );
            const data = await response.json();
            setHeadExpensesLabel(`Expenses under ${head} for Year ${currentYear+1}`)
            setHeadExpenses(data);
            setIsHeadExpensesModalOpen(true);
        } catch (error) {
            toastError("Error fetching expenses");
            console.error(error);
        }
    };

    const handleOverride = async (selectedIndex?: number) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectData!._id}/override`,
                {
                    credentials: "include",
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ selectedIndex })
                }
            );

            if (response.ok) {
                fetchProjectData()
                toastSuccess("Override Set Sucessfully!")
            }
            else {
                const message = (await response.json()).message
                toastError(message ?? "Something went wrong!")
                console.error(message)
                return
            }

            setIsOverrideModalOpen(false)
        } catch (error) {
            toastError("Something went wrong");
            console.error(error);
        }
    };

    const handleOverrideReset = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/project/${projectData!._id}/override`,
                {
                    credentials: "include",
                    method: "DELETE",
                }
            );

            if (response.ok) {
                fetchProjectData()
                toastSuccess("Override Reset Sucessfully!")
            }
            else {
                const message = (await response.json()).message
                toastError(message ?? "Something went wrong!")
                console.error(message)
            }

            setResetOverride(false)
            setIsOverrideModalOpen(false)
        } catch (error) {
            toastError("Something went wrong");
            console.error(error);
        }
    };

    return (
        <>
            {projectData && (
                <div className="relative flex flex-col space-y-4 w-full mx-4">
                    <OverrideConfirmation
                        isOpen={isOverrideModalOpen}
                        label={projectData.project_type === "yearly" ? "year" : "invoice"}
                        reset={resetOverride}
                        max={projectData.project_type === "yearly" ? calculateNumberOfYears(new Date(projectData.start_date!), new Date(projectData.end_date!)) : projectData.installments?.length!}
                        onClose={() => {
                            setIsOverrideModalOpen(false)
                            setResetOverride(false)
                        }}
                        onConfirm={!resetOverride ? handleOverride : handleOverrideReset}
                    />
                    {!projectData.override ? <Button color="failure" onClick={() => setIsOverrideModalOpen(true)} className="absolute top-5 right-0">Override Current {projectData.project_type === "invoice" ? "Installment" : "Year"}</Button> : <Button color="failure" onClick={() => {
                        setIsOverrideModalOpen(true)
                        setResetOverride(true)
                    }} className="absolute top-5 right-0">Revert Override</Button>}
                    <span className="text-4xl font-bold text-center mt-5 text-gray-800">
                        {projectData.project_name}
                    </span>

                    <div className="flex justify-center">
                        <div className="flex justify-between w-1/3">
                            <span className="text-lg text-center mt-5 text-gray-800">
                                Project ID : {projectData.project_id}
                            </span>
                            <span className="text-lg text-center mt-5 text-gray-800">
                                Project Title : {projectData.project_title}
                            </span>
                        </div>
                    </div>


                    <div className="flex space-x-5 w-full h-fit">
                        <div className="flex-1">
                            <div className="flex justify-between mb-2">
                                <div className="flex space-x-2 items-center w-fit">
                                    <span className="text-2xl font-semibold text-gray-70">Project Data</span>
                                    <span className="">(Click on the amount to view the reimbursements)</span>
                                </div>
                                <button
                                    className="text-blue-600 text-lg hover:underline"
                                    onClick={() => fetchReimbursements({ all: true })}>
                                    View All Reimbursements
                                </button>
                            </div>
                            {Object.keys(projectData.project_heads).length ? <table className="min-w-full bg-white shadow-md rounded-lg">
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
                                                className={`py-3 px-6 text-center text-gray-600 ${!isProjectOver && currentYear === i ? "text-red-600" : "   "}`}
                                            >
                                                <div className="flex flex-col">
                                                    {projectData.project_type === "invoice" ? "Installment" : "Year"} {i + 1}
                                                    {projectData.project_type === "invoice" ? <span>{formatDate(projectData.installments![i].start_date)} - {formatDate(projectData.installments![i].end_date)}</span> : <></>}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="py-3 px-6 text-center text-gray-800 font-semibold">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(projectData.project_heads).map(
                                        ([head, allocations], index) => (
                                            <tr key={index} className="border-t">
                                                <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                                    <button
                                                        className="text-blue-600 hover:underline"
                                                        onClick={() => fetchReimbursements({ head })}>
                                                        {head}
                                                    </button>
                                                </td>
                                                {allocations.map((amount, i) => (
                                                    <td
                                                        key={i}
                                                        className={`py-3 px-6 text-center ${!isProjectOver && currentYear === i ? "text-red-600" : "text-blue-600"}`}
                                                    >
                                                        <button
                                                            className="hover:underline"
                                                            onClick={() => fetchReimbursements({ head, index: i })}>
                                                            {formatCurrency(amount)}
                                                        </button>
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
                                                            className={`py-3 text-center text-gray-600 ${!isProjectOver && currentYear === i ? "text-red-600" : "   "}`}
                                                        >
                                                            N/A
                                                        </td>
                                                    ))}
                                                    <td className="py-3 px-6 text-gray-800 text-center font-medium">
                                                        {allocations.reduce((acc, allocation) => acc+allocation, 0)}
                                                    </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table> : <div className="flex items-center justify-center text-2xl bg-gray-200 w-full h-56 rounded-lg ">
                                <span>No project heads added yet.</span>
                            </div>}
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center">
                                    <p className="text-md font-semibold">Total Amount</p>
                                    <p className="text-2xl font-bold mt-2 text-blue-800">
                                        {formatCurrency(projectData.total_amount)}
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
                            <div className="piDetails flex flex-col space-y-3 p-4 font-semibold w-full bg-gray-100 rounded-md shadow-md">
                                <div className="flex items-center">
                                    <span className="inline-block w-20 text-gray-700">PIs:</span>
                                    <span className="text-gray-900">
                                        {projectData.pis.map(pi => pi.name).join(", ")}
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <span className="inline-block w-20 text-gray-700">Co-PIs:</span>
                                    <span className="text-gray-900">
                                        {projectData.copis.map(coPi => coPi.name).join(", ")}
                                    </span>
                                </div>

                            </div>

                        </div>
                    </div>


                    <h2 className="text-2xl font-semibold text-gray-700 mt-6">{projectData.project_type === "yearly"?"Year" : "Installment"} {currentYear+1} Expense Sheet</h2>
                    <div className="flex py-5">
                        {!isProjectOver ? <table className="min-w-full bg-white shadow-md rounded-lg mt-2">
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
                                            {formatCurrency(allocations[currentYear])}
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            <button
                                                className="text-blue-600 hover:underline"
                                                onClick={() => fetchHeadExpenses(head)}>
                                                {expenseData ? formatCurrency(expenseData[head] ?? 0) : "Loading"}
                                            </button>
                                        </td>
                                        <td className="py-3 px-6 text-center text-gray-600">
                                            {expenseData ? formatCurrency(allocations[currentYear] - (expenseData[head] ?? 0)) : "Loading"}
                                        </td>
                                    </tr>
                                })}
                                <tr className="border-t bg-gray-100 font-semibold">
                                    <td className="py-3 px-6 text-gray-800 text-center">Total</td>
                                    <td className="py-3 px-6 text-center">
                                        {formatCurrency(Object.values(projectData.project_heads).map(arr => arr[currentYear] || 0).reduce((sum, value) => sum + value, 0))}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        {expenseData ? formatCurrency(Object.values(expenseData).reduce((acc, value) => acc + value, 0)) : "Loading"}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        {expenseData ? formatCurrency(Object.values(projectData.project_heads).map(arr => arr[currentYear] || 0).reduce((sum, value) => sum + value, 0) - Object.values(expenseData).reduce((acc, value) => acc + value, 0)) : "Loading"}
                                    </td>
                                </tr>
                            </tbody>
                        </table> : <div className="flex items-center justify-center text-2xl bg-gray-200 w-full h-56 rounded-lg ">
                            <span>Project's end date has been crossed.</span>
                        </div>}
                    </div>
                </div>
            )}

            <ReimbursementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                label={label!}
                reimbursements={reimbursements}
            />
            <ProjectHeadExpenses
                isOpen={isHeadExpensesModalOpen}
                onClose={() => setIsHeadExpensesModalOpen(false)}
                label={headExpensesLabel!}
                expenses={headExpenses}
            />
        </>
    );
};

export default ProjectDetails;