import { FunctionComponent, useEffect, useState } from "react";
import ProjectList, { Project } from "../components/ProjectList";
import { Button } from "flowbite-react";
import { AddProjectModal } from "../components/AddProjectModal";
import { toastError } from "../toasts";

const DashBoard: FunctionComponent = () => {
    const [grandTotal, setGrandTotal] = useState(0);
    const [totalDue, setTotalDue] = useState(0);
    const [totalUnsettled, setTotalUnsettled] = useState(0);
    const [projectData, setProjectData] = useState<null | Array<Project>>(null);
    const [openModal, setOpenModal] = useState(false);

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/grandtotal/`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    setGrandTotal(data.total_amount_sum);
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/totaldue/`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    setTotalDue(data.total_due);
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/unsettled/`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    setTotalUnsettled(data.total_unsettled);
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    data = data.map((project: Project) => ({
                        ...project,
                        start_date: project.start_date
                            ? new Date(project.start_date)
                            : null,
                        end_date: project.end_date
                            ? new Date(project.end_date)
                            : null,
                    }));
                    setProjectData(data);
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    };

    useEffect(() => {
        fetchProjectData();
    }, [openModal]);

    return (
        <div className="flex flex-col p-4 space-y-4 w-full mx-auto overflow-hidden h-full">
            <AddProjectModal openModal={openModal} setOpenModal={setOpenModal} />

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg shadow-md text-center">
                    <p className="text-md font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold mt-2 text-blue-800">
                        {grandTotal.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                        })}
                    </p>
                </div>
                <div className="grid grid-cols-2 space-x-2">
                    <div className="bg-red-100 p-4 rounded-lg shadow-md text-center">
                        <p className="text-md font-semibold">Total Due</p>
                        <p className="text-2xl font-bold mt-2 text-red-800">
                            {totalDue.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg shadow-md text-center">
                        <p className="text-md font-semibold">Total Unsettled Amount</p>
                        <p className="text-2xl font-bold mt-2 text-red-800">
                            {totalUnsettled.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end w-full">
                <Button
                    onClick={() => setOpenModal((prev) => !prev)}
                    color="blue"
                    className="rounded-lg px-3 py-2 shadow-lg"
                >
                    Add Project
                </Button>
            </div>

            <ProjectList projectData={projectData} />
        </div>
    );
};

export default DashBoard;
