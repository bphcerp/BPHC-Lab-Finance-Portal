import { Button, Checkbox, Label, Table } from 'flowbite-react';
import React, { FormEvent, useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddExpenseModal, { Category } from '../components/AddExpenseModal';
import SettleExpenseModal from '../components/SettleExpenseModal';
import FileReimbursementModal from '../components/FileReimbursementModal';
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import { MdOutlineDescription } from "react-icons/md";
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditExpenseModal from '../components/EditExpenseModal';
import DescriptionModal from '../components/DescriptionModal';

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
    const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number; totalExpenses: number }>();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [description, setDescription] = useState("")

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
            setExpenses(expenses.map(exp =>
                exp._id === updatedExpense._id ? updatedExpense : exp
            ));
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
            setExpenses(data.expenses);
            setPagination(data.pagination);
        } catch (error) {
            toastError("Error fetching expenses");
            console.error('Error fetching expenses:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSelectAll = () => {
        if (selectedExpenses.size === expenses.length) {
            setSelectedExpenses(new Set());
        } else {
            const allIds = new Set(expenses.map((expense) => expense._id));
            setSelectedExpenses(allIds);
        }
    };

    const handleSelectExpense = (id: string) => {
        const newSelectedExpenses = new Set(selectedExpenses);
        if (newSelectedExpenses.has(id)) {
            newSelectedExpenses.delete(id);
        } else {
            newSelectedExpenses.add(id);
        }
        setSelectedExpenses(newSelectedExpenses);
    };

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

    return (
        <div className="container mx-auto p-4 text-[1px]">
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
                <div className='flex flex-col items-end mb-4 space-y-4'>
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
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <Table className="shadow-md rounded-lg text-center overflow-hidden divide-y divide-gray-200">
                    <Table.Head className="bg-gray-100">
                        <Table.HeadCell>
                            <Checkbox
                                color="blue"
                                checked={selectedExpenses.size === expenses.length}
                                onChange={handleSelectAll}
                                className="focus:ring-0"
                            />
                        </Table.HeadCell>
                        <Table.HeadCell className="text-left px-0 py-2.5 w-10">Reason</Table.HeadCell>
                        <Table.HeadCell className="px-0 py-2.5">Created At</Table.HeadCell>
                        <Table.HeadCell className="px-0 py-2.5">Updated At</Table.HeadCell>
                        <Table.HeadCell className="px-0 py-2.5">Category</Table.HeadCell>
                        <Table.HeadCell className="px-0 py-2.5">Amount</Table.HeadCell>
                        <Table.HeadCell className="px-0 py-2.5">Paid By</Table.HeadCell>
                        <Table.HeadCell className="w-20 px-0 py-2.5">Settled</Table.HeadCell>
                        <Table.HeadCell className="w-20 px-0 py-2.5">Reimbursement</Table.HeadCell>
                        <Table.HeadCell className="w-24 px-0 py-2.5">Description</Table.HeadCell>
                        {selectedExpenses.size > 0 ?
                            <Table.HeadCell className="w-20 px-0 py-2.5">Actions</Table.HeadCell>
                            : <></>}
                    </Table.Head>
                    <Table.Body className="min-h-[600px]">
                        {expenses.map(expense => (
                            <Table.Row key={expense._id} className="text-center whitespace-nowrap">
                                <Table.Cell className="px-0 py-2.5">
                                    <Checkbox
                                        color="blue"
                                        checked={selectedExpenses.has(expense._id)}
                                        onChange={() => handleSelectExpense(expense._id)}
                                        className="focus:ring-0"
                                    />
                                </Table.Cell>
                                <Table.Cell className="text-left px-0 py-2.5">{expense.expenseReason}</Table.Cell>
                                <Table.Cell className="px-0 py-2.5">{new Date(expense.createdAt).toLocaleDateString("en-IN")}</Table.Cell>
                                <Table.Cell className="px-0 py-2.5">{new Date(expense.updatedAt).toLocaleDateString("en-IN")}</Table.Cell>
                                <Table.Cell className="px-0 py-2.5">{expense.category.name}</Table.Cell>
                                <Table.Cell className="px-0 py-2.5">
                                    {expense.amount.toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                </Table.Cell>
                                <Table.Cell className="px-0 py-2.5">{expense.paidBy.name}</Table.Cell>
                                <Table.Cell className="px-0 py-2.5">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${expense.settled === "Current"
                                            ? "bg-blue-100 text-blue-800"
                                            : expense.settled === "Savings"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-gray-100 text-gray-800"
                                            } shadow-sm`}
                                    >
                                        {expense.settled ?? "Not Settled"}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="px-0 py-2.5">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${expense.reimbursedID
                                            ? expense.reimbursedID.paidStatus
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                            } shadow-sm`}
                                    >
                                        {!expense.reimbursedID ? "Not Filed" : expense.reimbursedID.title}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className='flex justify-center items-center px-0 py-2.5'>
                                    {expense.description ?
                                        <MdOutlineDescription className='hover:text-gray-700 hover:cursor-pointer' size="1.75em" onClick={() => {
                                            setIsDescModalOpen(true)
                                            setDescription(expense.description)
                                        }} />
                                        : "-"}
                                </Table.Cell>
                                {selectedExpenses.size > 0 ?
                                    <Table.Cell className="px-0 py-2.5">
                                        {expense.reimbursedID ? "NA" : (
                                            <div className="flex justify-center divide-x-2">
                                                <button
                                                    className="w-10 flex justify-center hover:cursor-pointer"
                                                    onClick={() => openEditModal(expense)}
                                                >
                                                    <RiEdit2Line color="blue" />
                                                </button>
                                                {expense.settled ? null : (
                                                    <button
                                                        className="w-10 flex justify-center hover:cursor-pointer"
                                                        onClick={() => openDeleteModal(expense)}
                                                    >
                                                        <RiDeleteBin6Line color="red" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </Table.Cell>
                                    : <></>}
                            </Table.Row>
                        ))}
                        {expenses.length === 0 && (
                            <Table.Row>
                                <Table.Cell colSpan={10} className="text-center">
                                    No expenses found.
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

            </div>
            <div className='flex space-x-2 divide-x text-base justify-center items-center w-full mt-4'>
                <div className='space-x-2'>
                    {pagination?.currentPage! > 1 ? <button onClick={() => fetchExpenses(pagination?.currentPage! - 1)} className='underline'>Prev</button> : ""}
                    <span>Page {pagination?.currentPage} of {pagination?.totalPages}</span>
                    {pagination?.currentPage! < pagination?.totalPages! ? <button onClick={() => fetchExpenses(pagination?.currentPage! + 1)} className='underline'>Next</button> : ""}
                </div>
                <div className='pl-2'>
                    <form className='flex justify-center items-center space-x-3' onSubmit={(e: FormEvent) => {
                        e.preventDefault()
                        fetchExpenses(parseInt([...(new FormData(e.target as HTMLFormElement)).entries()][0][1] as string))
                    }}>
                        <Label htmlFor='gotoPage' value='Go to' />
                        <input id="gotoPage" name="page" className='w-14' type='number' min={1} max={pagination?.totalPages} required />
                        <button type='submit' className='bg-blue-500 text-white p-1 rounded-sm'>Go</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpensesPage;