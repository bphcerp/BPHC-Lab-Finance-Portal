import { Checkbox, Label } from "flowbite-react";
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { FormEvent, FunctionComponent, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { Link } from "react-router-dom";
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from "./DescriptionModal";

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
    description : string
}

const ProjectList: FunctionComponent = () => {

    const fetchProjectData = (page: number = 1) => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/?page=${page}`, {
            credentials: "include",
        })
            .then((res) =>
                res.json().then((data) => {
                    setPagination(data.pagination)
                    data = data.projects.map((project: Project) => ({
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

    const [projectData, setProjectData] = useState<null | Array<Project>>(null);
    const [pagination, setPagination] = useState<{ currentPage: number, totalPages: number, totalProjects: number }>()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [description, setDescription] = useState("")
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

    const openDeleteModal = (project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const handleSelectAll = () => {
        if (selectedProjects.size === projectData!.length) {
            setSelectedProjects(new Set());
        } else {
            const allIds = new Set(projectData!.map((project) => project._id!));
            setSelectedProjects(allIds);
        }
    };

    const handleSelectProject = (id: string) => {
        const newSelectedProjects = new Set(selectedProjects);
        if (newSelectedProjects.has(id)) {
            newSelectedProjects.delete(id);
        } else {
            newSelectedProjects.add(id);
        }
        setSelectedProjects(newSelectedProjects);
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
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <Checkbox className="focus:ring-0" color="blue" checked={selectedProjects.size === projectData.length} onChange={handleSelectAll}/>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sanction Letter
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Utilization Certificate
                            </th>
                            <th className="px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projectData.map((project, key) => (
                            <tr key={project._id} className={key % 2 ? "bg-gray-100" : "bg-white"}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Checkbox className="focus:ring-0" color="blue" checked={selectedProjects.has(project._id!)} onChange={() => handleSelectProject(project._id!)}/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link className="hover:underline text-blue-600" to={`/project/${project._id}`}>
                                        {project.project_name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.total_amount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.start_date ? project.start_date.toLocaleDateString("en-IN") : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.end_date ? project.end_date.toLocaleDateString("en-IN") : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {project.sanction_letter_file_id ? (
                                        <Link
                                            to={`${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/sanction_letter`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        to={`${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/util_cert`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        View
                                    </Link>
                                </td>
                                <td className='flex justify-center items-center px-0 py-2.5'>
                                    {project.description ?
                                        <MdOutlineDescription className='hover:text-gray-700 hover:cursor-pointer' size="1.75em" onClick={() => {
                                            setIsDescModalOpen(true)
                                            setDescription(project.description)
                                        }} />
                                        : "-"}
                                </td>
                                <td className="px-2 py-2 w-20 text-center whitespace-nowrap">
                                    <div className='flex justify-center divide-x-2'>
                                        <button className='w-10 flex justify-center hover:cursor-pointer'><RiEdit2Line color='blue' /></button>
                                        <button className='w-10 flex justify-center hover:cursor-pointer' onClick={() => openDeleteModal(project)}><RiDeleteBin6Line color='red' /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='flex flex-col items-center w-full mt-2'>
                <div className='space-x-2'>
                    {pagination?.currentPage! > 1 ? <button onClick={() => fetchProjectData(pagination?.currentPage! - 1)} className='underline'>Prev</button> : ""}
                    <span>Page {pagination?.currentPage} of {pagination?.totalPages}</span>
                    {pagination?.currentPage! < pagination?.totalPages! ? <button onClick={() => fetchProjectData(pagination?.currentPage! + 1)} className='underline'>Next</button> : ""}
                </div>
                <div className='mt-2'>
                    <form className='flex justify-center items-center space-x-3' onSubmit={(e: FormEvent) => {
                        e.preventDefault()
                        fetchProjectData(parseInt([...(new FormData(e.target as HTMLFormElement)).entries()][0][1] as string))
                    }}>
                        <Label htmlFor='gotoPage' value='Go to' />
                        <input id="gotoPage" name="page" className='w-14' type='number' min={1} max={pagination?.totalPages} required />
                        <button type='submit' className='bg-blue-500 text-white p-1 rounded-sm'>Go</button>
                    </form>
                </div>
            </div>
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
