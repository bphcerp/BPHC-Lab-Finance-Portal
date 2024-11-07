import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import { Reimbursement } from '../components/ReimbursementModal';
import { MdOutlineDescription } from "react-icons/md";

import { Link } from 'react-router-dom';
import DescriptionModal from '../components/DescriptionModal';
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';

const ReimbursementPage: React.FC = () => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReimbursements, setSelectedReimbursements] = useState<Set<string>>(new Set());
    const [description, setDescription] = useState("")
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);

    const columnHelper = createColumnHelper<Reimbursement>();

    const columns = [
        columnHelper.accessor('title', {
            header: 'Title',
        }),
        columnHelper.accessor('project.project_name', {
            header: 'Project Name',
            cell: info => <Link className='hover:underline text-blue-600'
                to={`/project/${info.row.original.project._id}`}
                target="_blank"
                rel="noopener noreferrer">
                {info.row.original.project.project_name}
            </Link>
        }),
        columnHelper.accessor('projectHead', {
            header: 'Project Head',
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor('createdAt', {
            header: 'Updated At',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor(row => row.paidStatus ? "Paid" : "Unpaid", {
            header: 'Category',
            cell: info => {
                const paidStatus = info.row.original.paidStatus;
                return <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${paidStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        } shadow-sm`}
                >
                    {paidStatus ? "Paid" : "Unpaid"}
                </span>
            },
            meta: {
                filterType: "dropdown"
            },
            filterFn: (row, _columnId, filterValue) => {
                console.log("filterValue")
                return (filterValue == "Unpaid" && !row.original.paidStatus) || (filterValue == "Paid" && row.original.paidStatus)
            }
        }),
        columnHelper.accessor('totalAmount', {
            header: 'Amount',
            cell: info => info.getValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            enableColumnFilter: false
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
        }),
    ];

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



    const handleMarkAsPaid = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({ reimbursementIds: Array.from(selectedReimbursements) }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark reimbursements as paid');
            }

            toastSuccess('Selected reimbursements marked as paid.');
            fetchReimbursements(); // Refresh the list after updating
            setSelectedReimbursements(new Set()); // Clear selection
        } catch (error) {
            toastError('Error marking reimbursements as paid');
            console.error('Error marking reimbursements as paid:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className= "container mx-auto p-4">
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='reimbursement'
                description={description}
            />
            <h1 className="text-2xl font-bold mb-4">List of Reimbursements</h1>

            <div className="mb-4">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={handleMarkAsPaid}
                    disabled={selectedReimbursements.size === 0}
                >
                    Mark as Paid
                </button>
            </div>

            <TableCustom data={reimbursements} columns={columns} setSelected={(selectedReimbursements : Array<Reimbursement>) => {
                setSelectedReimbursements(new Set(selectedReimbursements.map(reimbursement => reimbursement._id)))
            }} />
        </div>
    );
};

export default ReimbursementPage;