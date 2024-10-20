import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface Expense {
    _id: string;
    expenseReason: string;
    category: string;
    amount: number;
    reimbursedStatus: boolean;
    paidBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Array<Expense>>([]);
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/expense`);
            const data = await response.json();
            setExpenses(data);
        } catch (error) {
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
            <h1 className="text-2xl font-bold mb-4">Expenses</h1>
            <Link to="/add-expense" className="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Add Expense
            </Link>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={selectedExpenses.size === expenses.length}
                                    onChange={handleSelectAll}
                                    className="focus:outline-none"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reimbursed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th> {/* New column */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map(expense => (
                            <tr key={expense._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedExpenses.has(expense._id)}
                                        onChange={() => handleSelectExpense(expense._id)}
                                        className="focus:outline-none"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.expenseReason}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.reimbursedStatus ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{expense.paidBy}</td> {/* Display Paid By */}
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
