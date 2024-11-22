import { FunctionComponent, useEffect, useState } from "react";
import { toastError } from "../toasts";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "../components/DescriptionModal";

import { createColumnHelper } from '@tanstack/react-table'
import TableCustom from "../components/TableCustom";
import { Link } from "react-router-dom";
import { Project } from "../types";


const ProjectList: FunctionComponent = () => {

    const getUniqueProjectHeads = (projects: Project[] | null): string[] => {
        if (!projects) return [];
        const headsSet = new Set<string>();

        projects.forEach((project) => {
            Object.keys(project.project_heads).forEach((head) => headsSet.add(head));
        });

        return Array.from(headsSet);
    };

    const fetchProjectData = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project?past=true&balance=true`, {
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
                    setUniqueHeads(getUniqueProjectHeads(data))
                })
            )
            .catch((e) => {
                toastError("Something went wrong");
                console.error(e);
            });
    }

    useEffect(() => {
        fetchProjectData()
    }, [])

    const [uniqueHeads, setUniqueHeads] = useState<Array<string>>([])
    const [projectData, setProjectData] = useState<Array<Project>>([]);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [description, setDescription] = useState("")
    const columnHelper = createColumnHelper<Project>()
    const columns = [
        columnHelper.accessor("project_id", {
            header: "Project ID",
            enableColumnFilter: true,
        }),
        columnHelper.accessor("project_name", {
            header: "Project Name",
            cell: (info) => (
                <Link className="hover:underline text-blue-600" to={`/project/${info.row.original._id}`}>
                    {info.getValue()}
                </Link>
            ),
            enableColumnFilter: true,
        }),
        columnHelper.accessor("project_title", {
            header: "Project Title",
            enableColumnFilter: true,
        }),
        columnHelper.accessor('start_date', {
            header: "Start Date",
            cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false
        }),
        columnHelper.accessor('end_date', {
            header: "End Date",
            cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString("en-IN") : "-",
            enableColumnFilter: false
        }),
        columnHelper.accessor(row => row.project_type.charAt(0).toUpperCase() + row.project_type.slice(1), {
            header: "Project Type",
            meta : {
                filterType : "dropdown"
            }
        }),
        columnHelper.accessor('total_amount', {
            header: "Granted Amount",
            cell: info => info.getValue().toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
            }),
            enableColumnFilter: false
        }),
        columnHelper.group({
            header: "Project Heads (Remaining)",
            columns: uniqueHeads.map(head => (
                columnHelper.accessor(row => `${row.project_name}_${head}`, {
                    header: head,
                    cell: info => (info.row.original.project_heads[head] ?? 0).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                    }),
                    enableColumnFilter : false
                })
            ))
        }),
        columnHelper.accessor('description', {
            header: "Description",
            cell: ({ row }) => row.original.description ? (
                <MdOutlineDescription
                    size="1.75em"
                    onClick={() => {
                        setDescription(row.original.description);
                        setIsDescModalOpen(true);
                    }}
                    className="hover:text-gray-700 cursor-pointer"
                />
            ) : "-",
            enableColumnFilter: false,
            enableSorting: false
        })
    ];
    

    return projectData ? (
        <div className="flex flex-col w-full p-4">
            <h1 className="text-2xl font-bold mb-4">Projects Overview</h1>
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='project'
                description={description}
            />
            <TableCustom data={projectData} columns={columns} />
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
