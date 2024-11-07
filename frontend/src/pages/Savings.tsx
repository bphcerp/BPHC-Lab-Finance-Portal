import React, { useEffect, useState } from 'react';
import { toastError } from '../toasts';
import { MdOutlineDescription } from "react-icons/md";
import DescriptionModal from '../components/DescriptionModal';
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';
import { Category } from '../types';

export interface SavingsData {
    _id: string;
    expenseReason: string;
    category: Category;
    amount: number;
    reimbursedID: { title: string, paidStatus: boolean } | null;
    paidBy: Category;
    description: string
    settled: 'Savings';
    createdAt: Date;
    updatedAt: Date;
}

const SavingsPage: React.FC = () => {
    const [savingsData, setSavingsData] = useState<Array<SavingsData>>([]);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [description, setDescription] = useState("")

    const columnHelper = createColumnHelper<SavingsData>();

    const columns = [
        columnHelper.accessor('expenseReason', {
            header: 'Reason',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('createdAt', {
            header: 'Created At',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor('updatedAt', {
            header: 'Updated At',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor('category.name', {
            header: 'Category',
            cell: info => info.getValue(),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: info => info.getValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            enableColumnFilter: false
        }),
        columnHelper.accessor('paidBy.name', {
            header: 'Paid By',
            cell: info => info.getValue(),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => row.reimbursedID ? row.reimbursedID.paidStatus ? "Filed and Reimbursed" : "Only Filed" : "Not Filed", {
            header: 'Reimbursement',
            cell: info => {
                const reimbursedID = info.row.original.reimbursedID;
                return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${!reimbursedID ? 'bg-red-100 text-red-800' :
                        reimbursedID.paidStatus ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                        } shadow-sm`}>
                        {!reimbursedID ? 'Not Filed' : reimbursedID.title}
                    </span>
                );
            },
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor((row) => row.reimbursedID && row.reimbursedID.paidStatus && row.settled === "Savings" ? (
            "Yes"
        ) : (
            "No"
        ), {
            header: "Appropriation",
            cell: ({ getValue }) => (
                <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${(getValue() == "Yes") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        } shadow-sm`}
                >
                    {getValue()}
                </span>
            ),
            meta: {
                filterType: "dropdown"
            }
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

    const fetchSavingsDatas = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/passbook?type=Savings`, { credentials: "include" });
            const data = await response.json();
            setSavingsData(data);
        } catch (error) {
            toastError("Error fetching data");
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchSavingsDatas();
    }, []);

    return savingsData ? (
        <div className="container mx-auto p-4">
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='expense'
                description={description}
            />
            <div className='flex justify-between'>
                <h1 className="text-2xl font-bold mb-4">Savings Passbook</h1>
                <div className="bg-gray-100 p-3 rounded-lg shadow-md flex items-center space-x-4 mb-4">
                    <h2 className="font-semibold text-gray-700 mr-4">Legend:</h2>
                    <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-yellow-300 rounded-full"></span>
                        <span className="text-sm text-gray-700">Filed, Pending Reimbursement</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">Filed, Reimbursed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">Not Filed</span>
                    </div>
                </div>
            </div>
            <TableCustom data={savingsData} columns={columns}/>
        </div>
    ) : <div>
        No SavingsDatas to show
    </div>;
};

export default SavingsPage;