import { FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { Link } from "react-router-dom";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "./DescriptionModal";

import { createColumnHelper } from '@tanstack/react-table'
import TableCustom from "./TableCustom";

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
    description: string
    util_cert: File
}

const ProjectList: FunctionComponent = () => {

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

    const [projectData, setProjectData] = useState<Array<Project>>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [description, setDescription] = useState("")
    const columnHelper = createColumnHelper<Project>()
    const columns = [
        columnHelper.accessor('project_name', {
            header: "Project Name",
            cell: info => <Link className="hover:underline text-blue-600" to={`/project/${info.row.original._id}`}>
                {info.getValue()}
            </Link>,
            enableColumnFilter: true
        }),
        columnHelper.accessor('total_amount', {
            header: "Granted Amount",
            cell: info => info.getValue().toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
            }),
            enableColumnFilter: false
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
        columnHelper.accessor('sanction_letter_file_id', {
            header: "Sanction Letter",
            cell: ({ row }) => row.original.sanction_letter_file_id ? (
                <Link
                    to={`${import.meta.env.VITE_BACKEND_URL}/project/${row.original._id}/sanction_letter`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                >
                    View
                </Link>
            ) : "-",
            enableColumnFilter: false,
            enableSorting: false
        }),
        columnHelper.accessor('util_cert', {
            header: "Utilization Certificate",
            cell: ({ row }) => (
                <Link
                    to={`${import.meta.env.VITE_BACKEND_URL}/project/${row.original._id}/util_cert`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                >
                    View
                </Link>
            ),
            enableColumnFilter: false,
            enableSorting: false
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

    const openDeleteModal = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

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
