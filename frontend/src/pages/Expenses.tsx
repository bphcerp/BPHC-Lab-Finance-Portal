    import { Button, Checkbox } from 'flowbite-react';
    import React, { useEffect, useState } from 'react';
    import { toastError } from '../toasts';
    import AddExpenseModal, { Category } from '../components/AddExpenseModal';
import SettleExpenseModal from '../components/SettleExpenseModal';
import FileReimbursementModal from '../components/FileReimbursementModal';

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
        const [isFileReimbursementModalOpen, setIsFileReimbursementModalOpen] = useState(false);

        const handleFileReimbursement = async (expenseIds: string[], projectId: string, projectHead: string, totalAmount : number, title : string) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                    method: 'POST',
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
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`);
                const data = await response.json();
                setExpenses(data);
            } catch (error) {
                toastError("Error fetching expenses")
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
                <h1 className="text-2xl font-bold mb-4">Expenses</h1>
                <div className='flex justify-between items-center'>
                    <Button color="blue" size="md" className='rounded-md mb-2' onClick={() => {setIsModalOpen(true)}}>Add Expense</Button>
                    {selectedExpenses.size>0?
                        <div className='flex space-x-2'>
                        <Button color="blue" size="md" className='rounded-md mb-2' onClick={() => {setIsSettleModalOpen(true)}}>{"Settle Expense" + (selectedExpenses.size>1?"s":"")}</Button>
                        <Button color="blue" size="md" className='rounded-md mb-2' onClick={() => {setIsFileReimbursementModalOpen(true)}}>File for Reimbursement</Button>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settled</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reimbursed</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.paidBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.settled ?? "No"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{expense.reimbursedID ? "Yes" : 'No'}</td>
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
