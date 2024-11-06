import { Button } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddExpenseModal, { Category } from '../components/AddExpenseModal';
import { MdOutlineDescription } from "react-icons/md";
import SettleExpenseModal from '../components/SettleExpenseModal';
import FileReimbursementModal from '../components/FileReimbursementModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditExpenseModal from '../components/EditExpenseModal';
import DescriptionModal from '../components/DescriptionModal';
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';

export interface Expense {
    _id: string;
    expenseReason: string;
    category: Category;
    amount: number;
    reimbursedID: { title: string, paidStatus: boolean } | null;
    paidBy: Category;
    description: string
    settled: 'Current' | 'Savings' | null;
    createdAt: Date;
    updatedAt: Date;
}

interface EditExpenseData {
    expenseReason: string;
    category: string;
    amount: number;
    paidBy: string;
}

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Array<Expense>>([]);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [isFileReimbursementModalOpen, setIsFileReimbursementModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [description, setDescription] = useState("")

    const columnHelper = createColumnHelper<Expense>();

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
        columnHelper.accessor(row => row.settled ?? "Not Settled", {
            header: 'Settled',
            cell: info => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${info.getValue() === 'Current' ? 'bg-blue-100 text-blue-800' :
                    info.getValue() === 'Savings' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                    } shadow-sm`}>
                    {info.getValue() ?? 'Not Settled'}
                </span>
            ),
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => row.reimbursedID ? row.reimbursedID.title : "Not Filed", {
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
        columnHelper.accessor('_id', {
            header: () => <div className='w-full text-center'>Actions</div>,
            cell: ({ row }) => row.original.reimbursedID ? <div className='w-full text-center'>NA</div> : (
                <div className="flex justify-center divide-x-2">
                    <button
                        className="w-10 flex justify-center hover:cursor-pointer"
                        onClick={() => openEditModal(row.original)}
                    >
                        <RiEdit2Line color="blue" />
                    </button>
                    {row.original.settled ? null : (
                        <button
                            className="w-10 flex justify-center hover:cursor-pointer"
                            onClick={() => openDeleteModal(row.original)}
                        >
                            <RiDeleteBin6Line color="red" />
                        </button>
                    )}
                </div>
            ),
            enableColumnFilter: false,
            enableSorting: false
        })
    ];

    const handleEditExpense = async (expenseData: EditExpenseData) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/expense/${selectedExpense?._id}`,
                {
                    method: 'PATCH',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(expenseData),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update expense');
            }

            const updatedExpense = await response.json();
            fetchExpenses()
            setIsEditModalOpen(false);
            setSelectedExpense(null);
            toastSuccess('Expense updated successfully');
        } catch (error) {
            toastError('Error updating expense');
            console.error('Error updating expense:', error);
        }
    };

    const openEditModal = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    const handleFileReimbursement = async (expenseIds: string[], projectId: string, projectHead: string, totalAmount: number, title: string, description: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expenseIds, projectId, projectHead, totalAmount, title, description }),
            });

            if (!response.ok) {
                throw new Error('Failed to file reimbursement');
            }

            fetchExpenses();
            toastSuccess('Reimbursement filed successfully');
        } catch (error) {
            toastError('Error filing reimbursement');
            console.error('Error filing reimbursement:', error);
        }
    };

    const handleSettleExpenses = async (ids: string[], settledStatus: 'Current' | 'Savings') => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/settle`, {
                method: 'PATCH',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids, settledStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to settle expenses');
            }

            fetchExpenses();
            toastSuccess('Expenses settled successfully');
        } catch (error) {
            toastError('Error settling expenses');
            console.error('Error settling expenses:', error);
        }
    };

    const handleAddExpense = async (newExpense: Expense) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newExpense),
            });

            if (!response.ok) {
                throw new Error('Failed to add expense');
            }

            const addedExpense = await response.json();
            setExpenses([...expenses, addedExpense]);
            fetchExpenses()
            toastSuccess('Expense added successfully');
        } catch (error) {
            toastError('Error adding expense');
            console.error('Error adding expense:', error);
        }
    };

    const fetchExpenses = async (page: number = 1) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense?page=${page}`, { credentials: "include" });
            const data = await response.json();
            setExpenses(data);
        } catch (error) {
            toastError("Error fetching expenses");
            console.error('Error fetching expenses:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);


    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/${expenseToDelete._id}`, {
                credentials: "include",
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete expense');
            }

            setExpenses(expenses.filter(exp => exp._id !== expenseToDelete._id));
            toastSuccess('Expense deleted successfully');
        } catch (error) {
            toastError('Error deleting expense');
            console.error('Error deleting expense:', error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const openDeleteModal = (expense: Expense) => {
        setExpenseToDelete(expense);
        setIsDeleteModalOpen(true);
    };

    return expenses ? (
        <div className="container mx-auto p-4">
            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddExpense}
            />
            <SettleExpenseModal
                isOpen={isSettleModalOpen}
                onClose={() => setIsSettleModalOpen(false)}
                selectedExpenses={expenses.filter(expense => selectedExpenses.has(expense._id))}
                onSettle={handleSettleExpenses}
            />
            <FileReimbursementModal
                isOpen={isFileReimbursementModalOpen}
                onClose={() => setIsFileReimbursementModalOpen(false)}
                selectedExpenses={expenses.filter(expense => selectedExpenses.has(expense._id))}
                onFileReimbursement={handleFileReimbursement}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteExpense}
                item={expenseToDelete?.expenseReason || ""}
            />
            <EditExpenseModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedExpense(null);
                }}
                expense={selectedExpense}
                onSubmit={handleEditExpense}
            />
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='expense'
                description={description}
            />
            <div className='flex justify-between'>
                <h1 className="text-2xl font-bold mb-4">Expenses</h1>
                <div className='flex justify-center items-end mb-4 space-x-4'>
                    <div className="bg-gray-100 p-3 rounded-lg shadow-md flex items-center space-x-4">
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
                    <div className='flex space-x-2'>
                        <Button color="blue" className='rounded-md' onClick={() => { setIsModalOpen(true) }}>Add Expense</Button>
                        {selectedExpenses.size > 0 ?
                            <div className='flex space-x-2'>
                                <Button color="gray" size="md" className='rounded-md' onClick={() => { setIsSettleModalOpen(true) }}>{"Settle Expense" + (selectedExpenses.size > 1 ? "s" : "")}</Button>
                                <Button color="gray" size="md" className='rounded-md' onClick={() => { setIsFileReimbursementModalOpen(true) }}>File for Reimbursement</Button>
                            </div> : <></>
                        }
                    </div>
                </div>
            </div>
            <TableCustom data={expenses} columns={columns} setSelected={(selectedExpenses : Array<Expense>) => {
                setSelectedExpenses(new Set(selectedExpenses.map(expense => expense._id)))
            }} />
        </div>
    ) : <div>
        No Expenses to show
    </div>;
};

export default ExpensesPage;