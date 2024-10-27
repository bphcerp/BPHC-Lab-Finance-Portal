import { Button, Checkbox } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import AddExpenseModal, { Category } from '../components/AddExpenseModal';
import SettleExpenseModal from '../components/SettleExpenseModal';
import FileReimbursementModal from '../components/FileReimbursementModal';
import { RiDeleteBin6Line, RiEdit2Line } from "react-icons/ri";
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

    export interface Expense {
        _id: string;
        expenseReason: string;
        category: Category;
        amount: number;
        reimbursedID: string | null;
        paidBy: string;
        settled: 'Current' | 'Savings' | null;
        createdAt: Date;
        updatedAt: Date;
    }

    const ExpensesPage: React.FC = () => {
        const [expenses, setExpenses] = useState<Array<Expense>>([])
        const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
        const [isModalOpen, setIsModalOpen] = useState(false)
        const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
        const [isFileReimbursementModalOpen, setIsFileReimbursementModalOpen] = useState(false)
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);


        const handleFileReimbursement = async (expenseIds: string[], projectId: string, projectHead: string, totalAmount : number, title : string) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                    method: 'POST',
                    credentials : "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ expenseIds, projectId, projectHead, totalAmount, title }),
                });
        
                if (!response.ok) {
                    throw new Error('Failed to file reimbursement');
                }
        
                fetchExpenses();
            } catch (error) {
                toastError('Error filing reimbursement');
                console.error('Error filing reimbursement:', error);
            }
        };        

        const handleSettleExpenses = async (ids: string[], settledStatus: 'Current' | 'Savings') => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense/settle`, {
                    method: 'PATCH',
                    credentials : "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ids, settledStatus }),
                });
        
                if (!response.ok) {
                    throw new Error('Failed to settle expenses');
                }
        
                fetchExpenses();
            } catch (error) {
                toastError('Error settling expenses');
                console.error('Error settling expenses:', error);
            }
        };

        const handleAddExpense = async (newExpense: Expense) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`, {
                    method: 'POST',
                    credentials : "include",
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
            } catch (error) {
                toastError('Error adding expense');
                console.error('Error adding expense:', error);
            }
        };
        

        const fetchExpenses = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`, {credentials : "include"});
                const data = await response.json();
                setExpenses(data);
            } catch (error) {
                toastError("Error fetching expenses")
                console.error('Error fetching expenses:', error);
            }
        };

        useEffect(() => {
            fetchExpenses();
        }, [expenses]);

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
                    credentials : "include",
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
                    expenseReason={expenseToDelete?.expenseReason || ""}
                />
                <h1 className="text-2xl font-bold mb-4">Expenses</h1>
                <div className='flex justify-between items-center mb-2'>
                    <Button color="blue" size="md" className='rounded-md' onClick={() => {setIsModalOpen(true)}}>Add Expense</Button>
                    {selectedExpenses.size>0?
                            <div className='flex space-x-2'>
                            <Button color="blue" size="md" className='rounded-md' onClick={() => {setIsSettleModalOpen(true)}}>{"Settle Expense" + (selectedExpenses.size>1?"s":"")}</Button>
                            <Button color="blue" size="md" className='rounded-md' onClick={() => {setIsFileReimbursementModalOpen(true)}}>File for Reimbursement</Button>
                        </div>:<></>    
                    }
                </div>
                <div className="bg-white shadow-md rounded-lg overflow-hidden"> 
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <Checkbox
                                        color="blue"
                                        checked={selectedExpenses.size === expenses.length}
                                        onChange={handleSelectAll}
                                        className="focus:ring-0"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th> 
                                <th className="px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settled</th>
                                <th className="px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reimbursed</th>
                                <th className="px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map(expense => (
                                <tr key={expense._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Checkbox
                                            color="blue"
                                            checked={selectedExpenses.has(expense._id)}
                                            onChange={() => handleSelectExpense(expense._id)}
                                            className="focus:ring-0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.expenseReason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.amount.toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.paidBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.settled ?? "No"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.reimbursedID ? "Yes" : 'No'}</td>
                                    <td className="px-2 py-2 w-20 text-center whitespace-nowrap">
                                        {expense.reimbursedID ? "NA" : 
                                            <div className='flex justify-center divide-x-2'>
                                                <button className='w-10 flex justify-center hover:cursor-pointer'><RiEdit2Line color='blue'/></button>
                                                {expense.settled ? <></> : 
                                                    <button className='w-10 flex justify-center hover:cursor-pointer' onClick={() => openDeleteModal(expense)}><RiDeleteBin6Line color='red'/></button>
                                                }
                                            </div>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center">No expenses found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    export default ExpensesPage;
