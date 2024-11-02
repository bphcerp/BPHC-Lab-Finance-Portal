import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts'; // Assuming toastSuccess exists
import { Table } from 'flowbite-react';
import { Reimbursement } from '../components/ReimbursementModal';

const ReimbursementPage: React.FC = () => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [filteredReimbursements, setFilteredReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedReimbursements, setSelectedReimbursements] = useState<string[]>([]);

    const fetchReimbursements = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error('Failed to fetch reimbursements');
            }
            const data = await response.json();
            setReimbursements(data);
            setFilteredReimbursements(data);
        } catch (error) {
            toastError('Error fetching reimbursements');
            console.error('Error fetching reimbursements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReimbursements();
    }, []);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projectName = e.target.value;
        setSelectedProject(projectName);

        if (projectName === '') {
            setFilteredReimbursements(reimbursements);
        } else {
            const filtered = reimbursements.filter(
                (reimbursement) => reimbursement.project.project_name === projectName
            );
            setFilteredReimbursements(filtered);
        }
    };

    const handleCheckboxChange = (id: string) => {
        setSelectedReimbursements((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllChange = () => {
        if (selectedReimbursements.length === filteredReimbursements.length) {
            setSelectedReimbursements([]);
        } else {
            setSelectedReimbursements(filteredReimbursements.map((r) => r._id));
        }
    };

    const isAllSelected = selectedReimbursements.length === filteredReimbursements.length;

    const handleMarkAsPaid = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({ reimbursementIds: selectedReimbursements }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark reimbursements as paid');
            }

            toastSuccess('Selected reimbursements marked as paid.');
            fetchReimbursements(); // Refresh the list after updating
            setSelectedReimbursements([]); // Clear selection
        } catch (error) {
            toastError('Error marking reimbursements as paid');
            console.error('Error marking reimbursements as paid:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const projectNames = [...new Set(reimbursements.map(r => r.project.project_name))];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">List of Reimbursements</h1>

            <div className="mb-4">
                <label htmlFor="project-filter" className="mr-2">Filter by Project:</label>
                <select
                    id="project-filter"
                    value={selectedProject}
                    onChange={handleSelectChange}
                    className="border rounded p-2"
                >
                    <option value="">All Projects</option>
                    {projectNames.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={handleMarkAsPaid}
                    disabled={selectedReimbursements.length === 0}
                >
                    Mark as Paid
                </button>
            </div>

            {filteredReimbursements.length === 0 ? (
                <p>No reimbursements found.</p>
            ) : (
                <Table hoverable className="min-w-full divide-y divide-gray-200">
                    <Table.Head className="bg-gray-100">
                        <Table.HeadCell>
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAllChange}
                            />
                        </Table.HeadCell>
                        <Table.HeadCell>Title</Table.HeadCell>
                        <Table.HeadCell>Project Name</Table.HeadCell>
                        <Table.HeadCell>Project Head</Table.HeadCell>
                        <Table.HeadCell>Total Amount</Table.HeadCell>
                        <Table.HeadCell>Created At</Table.HeadCell>
                        <Table.HeadCell>Paid</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {filteredReimbursements.map((reimbursement) => (
                            <Table.Row key={reimbursement._id}>
                                <Table.Cell>
                                    <input
                                        type="checkbox"
                                        checked={selectedReimbursements.includes(reimbursement._id)}
                                        onChange={() => handleCheckboxChange(reimbursement._id)}
                                    />
                                </Table.Cell>
                                <Table.Cell>{reimbursement.title}</Table.Cell>
                                <Table.Cell><a className='hover:underline text-blue-600'
                                               href={`/project/${reimbursement.project._id}`}
                                               target="_blank" 
                                               rel="noopener noreferrer">
                                                {reimbursement.project.project_name}
                                            </a>
                                </Table.Cell>
                                <Table.Cell>{reimbursement.projectHead}</Table.Cell>
                                <Table.Cell>
                                    {reimbursement.totalAmount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                </Table.Cell>
                                <Table.Cell>
                                    {new Date(reimbursement.createdAt).toLocaleDateString("en-IN")}
                                </Table.Cell>
                                <Table.Cell className="whitespace-nowrap">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                            reimbursement.paidStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        } shadow-sm`}
                                    >
                                        {reimbursement.paidStatus ? "Paid" : "Unpaid"}
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </div>
    );
};

export default ReimbursementPage;