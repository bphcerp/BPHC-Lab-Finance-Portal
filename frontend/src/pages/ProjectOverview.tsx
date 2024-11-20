import { FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "../components/DescriptionModal";

import { createColumnHelper } from '@tanstack/react-table'
import TableCustom from "../components/TableCustom";
import { Link } from "react-router-dom";
import { calculateCurrentYear, getCurrentInstallmentIndex } from "./ProjectDetails";
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

    const fetchProjectData = (page: number = 1) => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/?page=${page}`, {
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
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
                <Link className="hover:underline text-blue-600" to={`/project/${info.row.original.project_id}`}>
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
                    cell: info => (info.row.original.project_heads[head] ? (info.row.original.project_heads[head][info.row.original.project_type === "invoice"?getCurrentInstallmentIndex(info.row.original):calculateCurrentYear(info.row.original)] - (info.row.original.project_head_expenses[head] ?? 0) ) : 0).toLocaleString("en-IN", {
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
    
    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${projectToDelete._id}`, {
                credentials: "include",
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete project');
            }

            setProjectData(projectData!.filter(project => project._id !== projectToDelete._id));
            toastSuccess('Project deleted successfully');
        } catch (error) {
            toastError('Error deleting project');
            console.error('Error deleting project:', error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    return projectData ? (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Projects Overview</h1>
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteProject}
                item={projectToDelete?.project_name || ""}
            />
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
