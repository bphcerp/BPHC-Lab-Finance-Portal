import { Checkbox } from "flowbite-react";
import { FunctionComponent, useEffect, useState } from "react";

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

const ProjectList: FunctionComponent<ProjectListProps> = (props: ProjectListProps) => {
    const [projectHeads, setProjectHeads] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedHeads, setSelectedHeads] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    useEffect(() => {
        const fetchProjectHeads = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/heads`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const heads = data.map((head: { head_name: string }) => head.head_name);
                setProjectHeads(heads);
                setSelectedHeads(heads); // Select all heads by default
            } catch (error) {
                console.error("Error fetching project heads:", (error as Error).message);
            }
        };

        fetchProjectHeads();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const toggleHead = (head: string) => {
        setSelectedHeads(prevSelectedHeads =>
            prevSelectedHeads.includes(head)
                ? prevSelectedHeads.filter(h => h !== head)
                : [...prevSelectedHeads, head]
        );
    };

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedProjects = [...(props.projectData || [])].sort((a, b) => {
        if (sortConfig) {
            if (sortConfig.key === 'total_amount') {
                return sortConfig.direction === 'ascending'
                    ? a.total_amount - b.total_amount
                    : b.total_amount - a.total_amount;
            }
            if (sortConfig.key) {
                const aTotal = a.project_heads[sortConfig.key]?.reduce((sum, val) => sum + val, 0) || 0;
                const bTotal = b.project_heads[sortConfig.key]?.reduce((sum, val) => sum + val, 0) || 0;
                return sortConfig.direction === 'ascending' ? aTotal - bTotal : bTotal - aTotal;
            }
        }
        return 0; // Default return for sorting
    });

    const filteredProjects = sortedProjects.filter(project => 
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return props.projectData ? (
        <div className="flex flex-col">
            <div className="mb-4 w-full px-5 flex justify-between">
                <input
                    type="text"
                    placeholder="Search by project name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="p-2 border rounded"
                />
                <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="p-2 border rounded"
                    >
                        {selectedHeads.length === projectHeads.length ? "All Selected" : `${selectedHeads.length} Selected`} 
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute z-10 bg-white border rounded shadow-lg mt-2">
                            {projectHeads.map(head => (
                                <div key={head} className="flex items-center p-2 hover:bg-gray-200">
                                    <Checkbox 
                                        checked={selectedHeads.includes(head)} 
                                        onChange={() => toggleHead(head)} 
                                        color="blue" 
                                    />
                                    <span className="ml-2">{head}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center w-full h-full bg-gray-50 rounded-lg shadow-md overflow-y-auto p-4">
                <div className="flex sticky w-max top-0 bg-gray-200 text-gray-700 font-semibold border-b border-gray-300">
                    <div className="flex justify-center items-center w-12 p-3">
                        <Checkbox color="blue" />
                    </div>
                    <span className="w-48 p-3 text-left flex-shrink-0">Project Name</span>
                    <span className="w-32 p-3 text-left flex-shrink-0 cursor-pointer" onClick={() => requestSort('total_amount')}>
                        Granted Amount {sortConfig?.key === 'total_amount' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                    </span>
                    <span className="w-32 p-3 text-left flex-shrink-0">Start Date</span>
                    <span className="w-32 p-3 text-left flex-shrink-0">End Date</span>
                    {selectedHeads.map(head => (
                        <span className="w-32 p-3 text-left flex-shrink-0 cursor-pointer" key={head} onClick={() => requestSort(head)}>
                            {head} {sortConfig?.key === head ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                        </span>
                    ))}
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredProjects.length > 0 ? filteredProjects.map((project, key) => (
                        <div
                            key={key}
                            className={`flex text-gray-700 w-max h-20 items-center ${key % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                        >
                            <div className="flex justify-center items-center w-12 p-3">
                                <Checkbox color="blue" />
                            </div>
                            <span className="w-48 p-3 text-left flex-shrink-0">
                                <a className="hover:underline text-blue-600" href={`/project/${project._id}`}>
                                    {project.project_name}
                                </a>
                            </span>
                            <span className="w-32 p-3 text-left flex-shrink-0">
                                {project.total_amount.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                })}
                            </span>
                            <span className="w-32 p-3 text-left flex-shrink-0">
                                {project.start_date ? project.start_date.toLocaleDateString('en-IN') : "-"}
                            </span>
                            <span className="w-32 p-3 text-left flex-shrink-0">
                                {project.end_date ? project.end_date.toLocaleDateString('en-IN') : "-"}
                            </span>
                            {selectedHeads.map(head => (
                                <span className="w-32 p-3 text-left flex-shrink-0" key={head}>
                                    {project.project_heads[head]
                                        ? project.project_heads[head].reduce((a, b) => a + b, 0).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })
                                        : "-"}
                                </span>
                            ))}
                        </div>
                    )) : (
                        <div className="text-center text-gray-500">No matching projects found</div>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="text-center text-gray-500">No projects available</div>
    );
};

export default ProjectList;
